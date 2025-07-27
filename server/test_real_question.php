<?php
// Test GPT functionality with a real question from the database
echo "Testing GPT functionality with real question data...\n\n";

// Load the real question data
$questionsData = json_decode(file_get_contents('questions.json'), true);
$question = null;

foreach ($questionsData['knowledge'] as $q) {
    if ($q['id'] == 19359) {
        $question = $q;
        break;
    }
}

if (!$question) {
    echo "❌ Question not found\n";
    exit(1);
}

echo "✅ Found question: " . $question['text'] . "\n";
echo "Question ID: " . $question['id'] . "\n";
echo "Correct answer: ";
foreach ($question['answers'] as $answer) {
    if ($answer['correct']) {
        echo $answer['text'] . "\n";
    }
}
echo "\n";

// Test the loadQuestionData function
echo "Testing loadQuestionData function...\n";
$loadedQuestion = loadQuestionData(19359, 'A', 'knowledge');
if ($loadedQuestion) {
    echo "✅ Question loaded successfully via PHP function\n";
} else {
    echo "❌ Failed to load question via PHP function\n";
}

// Test the Python script directly
echo "\nTesting Python script with real question data...\n";
$questionJson = json_encode($question);
$descriptorspec = array(
    0 => array("pipe", "r"),  // stdin
    1 => array("pipe", "w"),  // stdout
    2 => array("pipe", "w")   // stderr
);

$process = proc_open("python gpt_explainer.py", $descriptorspec, $pipes);

if (is_resource($process)) {
    fwrite($pipes[0], $questionJson);
    fclose($pipes[0]);
    
    $output = stream_get_contents($pipes[1]);
    fclose($pipes[1]);
    
    $error = stream_get_contents($pipes[2]);
    fclose($pipes[2]);
    
    $return_value = proc_close($process);
    
    if ($return_value === 0) {
        echo "✅ Python script executed successfully\n";
        if (strpos($output, 'Error:') === 0) {
            echo "⚠️  API Error: " . trim($output) . "\n";
            echo "This is expected if the API quota is exceeded.\n";
        } else {
            echo "✅ Got GPT response:\n";
            echo "---\n";
            echo trim($output);
            echo "\n---\n";
        }
    } else {
        echo "❌ Python script failed with return code: $return_value\n";
        if ($error) {
            echo "Error output: $error\n";
        }
    }
} else {
    echo "❌ Failed to start Python script\n";
}

// Test the full PHP API flow
echo "\nTesting full PHP API flow...\n";
$testData = [
    'action' => 'ask_gpt',
    'questionId' => 19359,
    'questionSet' => 'A',
    'practiceMode' => 'knowledge'
];

// Simulate the API call
$questionData = loadQuestionData(19359, 'A', 'knowledge');
if ($questionData) {
    echo "✅ Question data loaded for API test\n";
    
    // Test the GPT explainer function
    $gptExplanation = callGptExplainer($questionData);
    if (strpos($gptExplanation, 'Error:') === 0) {
        echo "⚠️  GPT API Error: " . $gptExplanation . "\n";
        echo "This is expected if the API quota is exceeded.\n";
    } else {
        echo "✅ GPT explanation generated successfully\n";
        echo "Length: " . strlen($gptExplanation) . " characters\n";
    }
} else {
    echo "❌ Failed to load question data for API test\n";
}

echo "\nTest complete!\n";

// Include the helper functions
function loadQuestionData($questionId, $questionSet, $practiceMode) {
    // Load questions based on practice mode and question set
    $questionsFile = '';
    if ($practiceMode === 'knowledge') {
        $questionsFile = 'questions.json';
    } else {
        // For skills mode, use the appropriate file based on question set
        if ($questionSet === 'A') {
            $questionsFile = 'questions1.json';
        } else {
            $questionsFile = 'questions2.json';
        }
    }
    
    if (!file_exists($questionsFile)) {
        return false;
    }
    
    $questionsData = json_decode(file_get_contents($questionsFile), true);
    
    // Find the question
    if ($practiceMode === 'knowledge') {
        foreach ($questionsData['knowledge'] as $question) {
            if ($question['id'] == $questionId) {
                return $question;
            }
        }
    } else {
        // For skills mode, search in case studies
        if (isset($questionsData['skills'])) {
            foreach ($questionsData['skills'] as $caseStudy) {
                foreach ($caseStudy['questions'] as $question) {
                    if ($question['id'] == $questionId) {
                        return $question;
                    }
                }
            }
        }
    }
    
    return false;
}

function callGptExplainer($questionData) {
    // Prepare the command to call the Python script
    $pythonScript = __DIR__ . '/gpt_explainer.py';
    
    // Check if Python script exists
    if (!file_exists($pythonScript)) {
        return "Error: GPT explainer script not found";
    }
    
    // Make sure the script is executable
    chmod($pythonScript, 0755);
    
    // Prepare the question data as JSON
    $questionJson = json_encode($questionData);
    
    // Call the Python script
    $descriptorspec = array(
        0 => array("pipe", "r"),  // stdin
        1 => array("pipe", "w"),  // stdout
        2 => array("pipe", "w")   // stderr
    );
    
    $process = proc_open("python $pythonScript", $descriptorspec, $pipes);
    
    if (is_resource($process)) {
        // Write question data to stdin
        fwrite($pipes[0], $questionJson);
        fclose($pipes[0]);
        
        // Read output from stdout
        $output = stream_get_contents($pipes[1]);
        fclose($pipes[1]);
        
        // Read error from stderr
        $error = stream_get_contents($pipes[2]);
        fclose($pipes[2]);
        
        // Close the process
        $return_value = proc_close($process);
        
        if ($return_value !== 0) {
            return "Error: Python script failed: $error";
        }
        
        return trim($output);
    } else {
        return "Error: Failed to start Python script";
    }
}
?> 