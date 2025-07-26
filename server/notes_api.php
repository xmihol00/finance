<?php
session_start();

// Check if user is logged in
if (!isset($_SESSION['username']) || empty($_SESSION['username'])) {
    echo json_encode(['success' => false, 'error' => 'Not logged in']);
    exit;
}

$username = $_SESSION['username'];

// Handle POST request to add a note
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
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