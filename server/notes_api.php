<?php
session_start();
require_once 'auth.php';

// Check if user is logged in
$username = getCurrentUser();
if (!$username) {
    echo json_encode(['success' => false, 'error' => 'Not logged in', 'redirect' => 'index.php']);
    exit;
}

// Handle POST request to add a note or get GPT explanation
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Check if this is a GPT request
    if (isset($data['action']) && $data['action'] === 'ask_gpt') {
        if (!isset($data['questionId'], $data['questionSet'], $data['practiceMode'])) {
            echo json_encode(['success' => false, 'error' => 'Invalid data for GPT request']);
            exit;
        }
        
        $questionId = $data['questionId'];
        $questionSet = $data['questionSet'];
        $practiceMode = $data['practiceMode'];
        
        // Load question data
        $questionData = loadQuestionData($questionId, $questionSet, $practiceMode);
        if (!$questionData) {
            echo json_encode(['success' => false, 'error' => 'Question not found']);
            exit;
        }
        
        // Call Python script to get GPT explanation
        $gptExplanation = callGptExplainer($questionData);
        
        if (strpos($gptExplanation, 'Error:') === 0) {
            echo json_encode(['success' => false, 'error' => $gptExplanation]);
            exit;
        }
        
        // Add the GPT explanation as a note
        $notesFile = 'notes.json';
        if (file_exists($notesFile)) {
            $notesData = json_decode(file_get_contents($notesFile), true);
        } else {
            $notesData = ['notes' => []];
        }
        
        // Create new GPT note
        $newNote = [
            'id' => uniqid(),
            'questionId' => $questionId,
            'questionSet' => $questionSet,
            'practiceMode' => $practiceMode,
            'author' => 'GPT Assistant 🤖',
            'text' => $gptExplanation,
            'timestamp' => date('Y-m-d H:i:s'),
            'likes' => 0,
            'likedBy' => [],
            'isGptNote' => true
        ];
        
        $notesData['notes'][] = $newNote;
        
        // Save notes data
        file_put_contents($notesFile, json_encode($notesData, JSON_PRETTY_PRINT));
        
        echo json_encode(['success' => true, 'data' => $newNote]);
        exit;
    }
    
    // Regular note addition
    if (!isset($data['questionId'], $data['questionSet'], $data['practiceMode'], $data['noteText'])) {
        echo json_encode(['success' => false, 'error' => 'Invalid data']);
        exit;
    }
    
    $questionId = $data['questionId'];
    $questionSet = $data['questionSet'];
    $practiceMode = $data['practiceMode'];
    $noteText = $data['noteText'];
    
    if (empty(trim($noteText))) {
        echo json_encode(['success' => false, 'error' => 'Note text cannot be empty']);
        exit;
    }
    
    // Load notes data
    $notesFile = 'notes.json';
    if (file_exists($notesFile)) {
        $notesData = json_decode(file_get_contents($notesFile), true);
    } else {
        $notesData = ['notes' => []];
    }
    
    // Create new note
    $newNote = [
        'id' => uniqid(),
        'questionId' => $questionId,
        'questionSet' => $questionSet,
        'practiceMode' => $practiceMode,
        'author' => $username,
        'text' => $noteText,
        'timestamp' => date('Y-m-d H:i:s'),
        'likes' => 0,
        'likedBy' => []
    ];
    
    $notesData['notes'][] = $newNote;
    
    // Save notes data
    file_put_contents($notesFile, json_encode($notesData, JSON_PRETTY_PRINT));
    
    echo json_encode(['success' => true, 'data' => $newNote]);
    exit;
}

// Handle GET request to get notes for a question
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Check if this is a bulk count request
    if (isset($_GET['action']) && $_GET['action'] === 'bulk_counts') {
        if (!isset($_GET['questionSet'], $_GET['practiceMode'])) {
            echo json_encode(['success' => false, 'error' => 'Missing parameters for bulk counts']);
            exit;
        }
        
        $questionSet = $_GET['questionSet'];
        $practiceMode = $_GET['practiceMode'];
        
        // Load notes data
        $notesFile = 'notes.json';
        if (!file_exists($notesFile)) {
            echo json_encode(['success' => true, 'data' => []]);
            exit;
        }
        
        $notesData = json_decode(file_get_contents($notesFile), true);
        
        // Count notes for each question
        $noteCounts = [];
        foreach ($notesData['notes'] as $note) {
            if ($note['questionSet'] === $questionSet && $note['practiceMode'] === $practiceMode) {
                $questionId = $note['questionId'];
                if (!isset($noteCounts[$questionId])) {
                    $noteCounts[$questionId] = 0;
                }
                $noteCounts[$questionId]++;
            }
        }
        
        echo json_encode(['success' => true, 'data' => $noteCounts]);
        exit;
    }
    
    // Regular single question notes request
    if (!isset($_GET['questionId'], $_GET['questionSet'], $_GET['practiceMode'])) {
        echo json_encode(['success' => false, 'error' => 'Missing parameters']);
        exit;
    }
    
    $questionId = $_GET['questionId'];
    $questionSet = $_GET['questionSet'];
    $practiceMode = $_GET['practiceMode'];
    
    // Load notes data
    $notesFile = 'notes.json';
    if (!file_exists($notesFile)) {
        echo json_encode(['success' => true, 'data' => []]);
        exit;
    }
    
    $notesData = json_decode(file_get_contents($notesFile), true);
    
    // Filter notes for the specific question
    $questionNotes = array_filter($notesData['notes'], function($note) use ($questionId, $questionSet, $practiceMode) {
        return $note['questionId'] == $questionId && 
               $note['questionSet'] === $questionSet && 
               $note['practiceMode'] === $practiceMode;
    });
    
    // Sort by likes (descending) and then by timestamp (newest first)
    usort($questionNotes, function($a, $b) {
        if ($a['likes'] !== $b['likes']) {
            return $b['likes'] - $a['likes'];
        }
        return strtotime($b['timestamp']) - strtotime($a['timestamp']);
    });
    
    echo json_encode(['success' => true, 'data' => array_values($questionNotes)]);
    exit;
}

// Handle PUT request to like/unlike a note
if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($data['noteId'])) {
        echo json_encode(['success' => false, 'error' => 'Missing note ID']);
        exit;
    }
    
    $noteId = $data['noteId'];
    
    // Load notes data
    $notesFile = 'notes.json';
    if (!file_exists($notesFile)) {
        echo json_encode(['success' => false, 'error' => 'Notes file not found']);
        exit;
    }
    
    $notesData = json_decode(file_get_contents($notesFile), true);
    
    // Find the note
    $noteIndex = -1;
    foreach ($notesData['notes'] as $index => $note) {
        if ($note['id'] === $noteId) {
            $noteIndex = $index;
            break;
        }
    }
    
    if ($noteIndex === -1) {
        echo json_encode(['success' => false, 'error' => 'Note not found']);
        exit;
    }
    
    $note = &$notesData['notes'][$noteIndex];
    
    // Toggle like
    if (in_array($username, $note['likedBy'])) {
        // Unlike
        $note['likedBy'] = array_diff($note['likedBy'], [$username]);
        $note['likes'] = count($note['likedBy']);
    } else {
        // Like
        $note['likedBy'][] = $username;
        $note['likes'] = count($note['likedBy']);
    }
    
    // Save notes data
    file_put_contents($notesFile, json_encode($notesData, JSON_PRETTY_PRINT));
    
    echo json_encode(['success' => true, 'data' => $note]);
    exit;
}

// If we reach here, it's an unsupported request method
echo json_encode(['success' => false, 'error' => 'Unsupported request method']);

// Helper functions
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