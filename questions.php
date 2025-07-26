<?php
session_start();

// Check if user is logged in
if (!isset($_SESSION['username']) || empty($_SESSION['username'])) {
    header('Location: index.php');
    exit;
}

$username = $_SESSION['username'];

// Load questions
$questionsFile = 'questions.json';
if (!file_exists($questionsFile)) {
    die("Questions file not found");
}
$questionsData = json_decode(file_get_contents($questionsFile), true);
$questions = $questionsData['knowledge'];

// Load user data
$usersFile = 'users.json';
if (file_exists($usersFile)) {
    $usersData = json_decode(file_get_contents($usersFile), true);
} else {
    die("Users file not found");
}

// Find current user
$currentUser = null;
foreach ($usersData['users'] as $user) {
    if ($user['name'] === $username) {
        $currentUser = $user;
        break;
    }
}

if ($currentUser === null) {
    die("User not found");
}

// Prepare answers data for JavaScript
$userAnswers = isset($currentUser['answers']) ? $currentUser['answers'] : [];
?>

<!DOCTYPE html>
<html lang="cs">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Platforma pro výuku - Otázky</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <div class="container">
        <header>
            <h1>Finanční otázky</h1>
            <div class="user-info">
                <span><?php echo htmlspecialchars($username); ?></span>
                <a href="logout.php" class="btn btn-small">Odhlásit</a>
            </div>
        </header>
        
        <div class="controls">
            <div class="button-group">
                <button id="shuffle-btn" class="btn">Zamíchat otázky</button>
                <button id="sort-wrong-btn" class="btn">Seřadit podle chyb</button>
            </div>
            <div class="stats">
                <span id="answered-count">0</span> zodpovězeno z <span id="total-count"><?php echo count($questions); ?></span>
            </div>
        </div>
        
        <div id="questions-container" class="questions-container">
            <!-- Questions will be loaded here by JavaScript -->
            <div class="loading">Načítání otázek...</div>
        </div>
    </div>
    
    <script>
        // Pass PHP data to JavaScript
        const currentUser = <?php echo json_encode($username); ?>;
        const userAnswers = <?php echo json_encode($userAnswers); ?>;
        const allQuestions = <?php echo json_encode($questions); ?>;
    </script>
    <script src="js/script.js"></script>
</body>
</html>
