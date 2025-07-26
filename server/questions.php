<?php
session_start();

// Check if user is logged in
if (!isset($_SESSION['username']) || empty($_SESSION['username'])) {
    header('Location: index.php');
    exit;
}

// Check if question set and practice mode are selected
if (!isset($_SESSION['question_set']) || empty($_SESSION['question_set']) ||
    !isset($_SESSION['practice_mode']) || empty($_SESSION['practice_mode'])) {
    header('Location: select-set.php');
    exit;
}

$username = $_SESSION['username'];
$questionSet = $_SESSION['question_set'];
$practiceMode = $_SESSION['practice_mode'];

// Load questions based on selected set
$questionsFile = 'questions' . ($questionSet === 'set1' ? '1' : '2') . '.json';
if (!file_exists($questionsFile)) {
    die("Questions file not found: " . $questionsFile);
}
$questionsData = json_decode(file_get_contents($questionsFile), true);

// Load questions based on practice mode
if ($practiceMode === 'knowledge') {
    $questions = $questionsData['knowledge'];
    $skills = [];
} else {
    $questions = [];
    $skills = $questionsData['skills'];
}

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

// Prepare answers data for JavaScript - get answers for the current question set and practice mode
$userAnswers = [];
if (isset($currentUser['answers'][$questionSet][$practiceMode])) {
    $userAnswers = $currentUser['answers'][$questionSet][$practiceMode];
}
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
            <h1>Finanční otázky - <?php echo $questionSet === 'set1' ? 'Zkouška I' : 'Zkouška II'; ?> - <?php echo $practiceMode === 'knowledge' ? 'Testové otázky' : 'Případové studie'; ?></h1>
            <div class="header-actions">
                <a href="select-set.php" class="btn btn-small change-selection-btn">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M8 0a8 8 0 1 0 8 8 8 8 0 0 0-8-8zm0 14a6 6 0 1 1 6-6 6 6 0 0 1-6 6z"/>
                        <path d="M8 4a4 4 0 1 0 4 4 4 4 0 0 0-4-4zm0 6a2 2 0 1 1 2-2 2 2 0 0 1-2 2z"/>
                    </svg>
                    Změnit výběr
                </a>
                <div class="user-menu">
                    <button class="user-menu-toggle" id="userMenuToggle">
                        <svg class="user-avatar" width="32" height="32" viewBox="0 0 32 32">
                            <circle cx="16" cy="16" r="16" fill="#3498db"/>
                            <text x="16" y="22" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="16" font-weight="bold"><?php echo strtoupper(substr($username, 0, 1)); ?></text>
                        </svg>
                    </button>
                    <div class="user-dropdown" id="userDropdown">
                        <div class="dropdown-user-info">
                            <div class="user-avatar-small">
                                <svg width="24" height="24" viewBox="0 0 32 32">
                                    <circle cx="16" cy="16" r="16" fill="#3498db"/>
                                    <text x="16" y="20" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="12" font-weight="bold"><?php echo strtoupper(substr($username, 0, 1)); ?></text>
                                </svg>
                            </div>
                            <div class="user-details">
                                <span class="username"><?php echo htmlspecialchars($username); ?></span>
                                <span class="user-role">Student</span>
                            </div>
                        </div>
                        <div class="dropdown-actions">
                            <a href="logout.php" class="dropdown-item">
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                    <path d="M8 0a8 8 0 1 0 8 8 8 8 0 0 0-8-8zm0 14a6 6 0 1 1 6-6 6 6 0 0 1-6 6z"/>
                                    <path d="M8 4a4 4 0 1 0 4 4 4 4 0 0 0-4-4zm0 6a2 2 0 1 1 2-2 2 2 0 0 1-2 2z"/>
                                </svg>
                                Odhlásit
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    
    <script>
        // Pass PHP data to JavaScript
        const currentUser = <?php echo json_encode($username); ?>;
        const userAnswers = <?php echo json_encode($userAnswers); ?>;
        const allQuestions = <?php echo json_encode($questions); ?>;
        const allSkills = <?php echo json_encode($skills); ?>;
        const questionSet = <?php echo json_encode($questionSet); ?>;
        const practiceMode = <?php echo json_encode($practiceMode); ?>;
    </script>
    <script src="js/script.js"></script>
</body>
</html>
