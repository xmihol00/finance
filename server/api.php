<?php
session_start();
require_once 'auth.php';

// Check if user is logged in
$username = getCurrentUser();
if (!$username) {
    echo json_encode(['success' => false, 'error' => 'Not logged in', 'redirect' => 'index.php']);
    exit;
}

$username = $_SESSION['username'];

// Handle POST request to save an answer
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Get POST data
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Check if this is a mark/unmark request
    if (isset($data['action']) && $data['action'] === 'toggle_mark') {
        if (!isset($data['questionId'], $data['questionSet'], $data['practiceMode'])) {
            echo json_encode(['success' => false, 'error' => 'Invalid data for mark toggle']);
            exit;
        }
        
        $questionId = $data['questionId'];
        $questionSet = $data['questionSet'];
        $practiceMode = $data['practiceMode'];
        
        // Load users data
        $usersFile = 'users.json';
        if (file_exists($usersFile)) {
            $usersData = json_decode(file_get_contents($usersFile), true);
        } else {
            $usersData = ['users' => []];
        }
        
        // Find user
        $userIndex = -1;
        foreach ($usersData['users'] as $index => $user) {
            if ($user['name'] === $username) {
                $userIndex = $index;
                break;
            }
        }
        
        if ($userIndex === -1) {
            echo json_encode(['success' => false, 'error' => 'User not found']);
            exit;
        }
        
        // Initialize marked questions if it doesn't exist
        if (!isset($usersData['users'][$userIndex]['marked_questions'][$questionSet][$practiceMode])) {
            $usersData['users'][$userIndex]['marked_questions'][$questionSet][$practiceMode] = [];
        }
        
        $markedQuestions = &$usersData['users'][$userIndex]['marked_questions'][$questionSet][$practiceMode];
        
        // Toggle mark status
        $isMarked = in_array($questionId, $markedQuestions);
        if ($isMarked) {
            // Remove from marked questions
            $markedQuestions = array_values(array_filter($markedQuestions, function($id) use ($questionId) {
                return $id !== $questionId;
            }));
        } else {
            // Add to marked questions
            $markedQuestions[] = $questionId;
        }
        
        // Save users data
        file_put_contents($usersFile, json_encode($usersData, JSON_PRETTY_PRINT));
        
        echo json_encode([
            'success' => true, 
            'data' => [
                'isMarked' => !$isMarked,
                'markedCount' => count($markedQuestions)
            ]
        ]);
        exit;
    }
    
    // Handle regular answer submission
    if (!isset($data['questionId'], $data['correct'], $data['questionSet'], $data['practiceMode'])) {
        echo json_encode(['success' => false, 'error' => 'Invalid data']);
        exit;
    }
    
    $questionId = $data['questionId'];
    $correct = $data['correct'] ? true : false;
    $questionSet = $data['questionSet'];
    $practiceMode = $data['practiceMode'];
    
    // Load users data
    $usersFile = 'users.json';
    if (file_exists($usersFile)) {
        $usersData = json_decode(file_get_contents($usersFile), true);
    } else {
        $usersData = ['users' => []];
    }
    
    // Find user and update answers
    $userIndex = -1;
    foreach ($usersData['users'] as $index => $user) {
        if ($user['name'] === $username) {
            $userIndex = $index;
            break;
        }
    }
    
    if ($userIndex === -1) {
        echo json_encode(['success' => false, 'error' => 'User not found']);
        exit;
    }
    
    // Initialize answer record if it doesn't exist
    if (!isset($usersData['users'][$userIndex]['answers'][$questionSet][$practiceMode][$questionId])) {
        $usersData['users'][$userIndex]['answers'][$questionSet][$practiceMode][$questionId] = [
            'correct' => 0,
            'incorrect' => 0,
            'last_answer' => ''
        ];
    }
    
    // Update the answer counts
    if ($correct) {
        $usersData['users'][$userIndex]['answers'][$questionSet][$practiceMode][$questionId]['correct']++;
    } else {
        $usersData['users'][$userIndex]['answers'][$questionSet][$practiceMode][$questionId]['incorrect']++;
    }
    
    // Update last answer timestamp
    $usersData['users'][$userIndex]['answers'][$questionSet][$practiceMode][$questionId]['last_answer'] = date('Y-m-d H:i:s');
    
    // Save users data
    file_put_contents($usersFile, json_encode($usersData, JSON_PRETTY_PRINT));
    
    echo json_encode([
        'success' => true, 
        'data' => $usersData['users'][$userIndex]['answers'][$questionSet][$practiceMode][$questionId]
    ]);
    exit;
}

// Handle GET request to get user stats
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Load users data
    $usersFile = 'users.json';
    if (file_exists($usersFile)) {
        $usersData = json_decode(file_get_contents($usersFile), true);
    } else {
        echo json_encode(['success' => false, 'error' => 'Users file not found']);
        exit;
    }
    
    // Find user
    $userData = null;
    foreach ($usersData['users'] as $user) {
        if ($user['name'] === $username) {
            $userData = $user;
            break;
        }
    }
    
    if ($userData === null) {
        echo json_encode(['success' => false, 'error' => 'User not found']);
        exit;
    }
    
    echo json_encode(['success' => true, 'data' => $userData]);
    exit;
}

// If we reach here, it's an unsupported request method
echo json_encode(['success' => false, 'error' => 'Unsupported request method']);
