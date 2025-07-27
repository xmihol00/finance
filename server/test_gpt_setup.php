<?php
// Simple test script to verify GPT setup
echo "Testing GPT setup...\n\n";

// Test 1: Check if Python script exists
$pythonScript = __DIR__ . '/gpt_explainer.py';
if (file_exists($pythonScript)) {
    echo "✅ Python script exists: $pythonScript\n";
} else {
    echo "❌ Python script not found: $pythonScript\n";
}

// Test 2: Check if Python script is executable
if (is_executable($pythonScript)) {
    echo "✅ Python script is executable\n";
} else {
    echo "❌ Python script is not executable\n";
}

// Test 3: Check if requirements.txt exists
$requirementsFile = __DIR__ . '/requirements.txt';
if (file_exists($requirementsFile)) {
    echo "✅ Requirements file exists\n";
} else {
    echo "❌ Requirements file not found\n";
}

// Test 4: Check if OpenAI API key is set
$apiKey = getenv('OPENAI_API_KEY');
if ($apiKey) {
    echo "✅ OpenAI API key is set\n";
} else {
    echo "❌ OpenAI API key is not set (set OPENAI_API_KEY environment variable)\n";
}

// Test 5: Test Python script with sample data
echo "\nTesting Python script with sample data...\n";
$testData = [
    'text' => 'Test question about financial markets',
    'justification' => 'This is a test justification',
    'answers' => [
        ['text' => 'Wrong answer', 'correct' => false],
        ['text' => 'Correct answer', 'correct' => true]
    ]
];

$questionJson = json_encode($testData);
$descriptorspec = array(
    0 => array("pipe", "r"),  // stdin
    1 => array("pipe", "w"),  // stdout
    2 => array("pipe", "w")   // stderr
);

$process = proc_open("python $pythonScript", $descriptorspec, $pipes);

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
            echo "⚠️  Expected error (no API key): " . trim($output) . "\n";
        } else {
            echo "✅ Got response from GPT\n";
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

echo "\nSetup test complete!\n";
?> 