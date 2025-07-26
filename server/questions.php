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
        
        <div class="platform-info">
            <div class="info-toggle">
                <button class="btn btn-small info-toggle-btn" id="infoToggleBtn">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M8 0a8 8 0 1 0 8 8 8 8 0 0 0-8-8zm0 14a6 6 0 1 1 6-6 6 6 0 0 1-6 6z"/>
                        <path d="M8 4a4 4 0 1 0 4 4 4 4 0 0 0-4-4zm0 6a2 2 0 1 1 2-2 2 2 0 0 1-2 2z"/>
                    </svg>
                    Jak platforma funguje
                </button>
            </div>
            <div class="info-content hidden" id="infoContent">
                <div class="info-section">
                    <h3>🎯 Co můžete vybrat</h3>
                    <ul>
                        <li><strong>Zkouška I:</strong> Jednání se zákazníky v rámci poskytování investičních služeb týkajícího se pouze investičních nástrojů uvedených v § 29 odst. 3 zákona</li>
                        <li><strong>Zkouška II:</strong> Jednání se zákazníky v rámci poskytování investičních služeb týkajícího se všech investičních nástrojů uvedených v § 3 odst. 1 zákona</li>
                        <li><strong>Testové otázky:</strong> Klasické otázky s jednou nebo více správnými odpověďmi</li>
                        <li><strong>Případové studie:</strong> Praktické scénáře s několika otázkami k řešení</li>
                    </ul>
                </div>
                
                <div class="info-section">
                    <h3>💾 Jak se ukládají odpovědi</h3>
                    <ul>
                        <li>Každá vaše odpověď se automaticky ukládá do vašeho profilu</li>
                        <li>Sledujeme počet správných a nesprávných odpovědí pro každou otázku</li>
                        <li>Data jsou uložena odděleně pro každou zkoušku a typ cvičení</li>
                        <li>Váš pokrok je trvale uložen a můžete se k němu kdykoliv vrátit</li>
                    </ul>
                </div>
                
                <div class="info-section">
                    <h3>📈 Jak využít minulé odpovědi pro lepší učení</h3>
                    <ul>
                        <li><strong>Prioritní řazení:</strong> Otázky, které jste často chybovali, se zobrazují častěji</li>
                        <li><strong>Statistiky u každé otázky:</strong> Vidíte svůj poměr správných/nesprávných odpovědí</li>
                        <li><strong>Seřazení podle chyb:</strong> Tlačítko "Seřadit podle chyb" vám ukáže nejproblematičtější otázky</li>
                        <li><strong>Vizuální indikátory:</strong> Barvy karet ukazují váš pokrok (nové, většinou správné, potřebuje procvičení)</li>
                        <li><strong>Společné poznámky:</strong> Můžete přidávat a číst tipy od ostatních studentů</li>
                    </ul>
                </div>
                
                <div class="info-section">
                    <h3>🎨 Barevné označení karet</h3>
                    <ul>
                        <li><span class="color-indicator new">Nové otázky</span> - Zatím jste na ně neodpovídali</li>
                        <li><span class="color-indicator mostly-correct">Většinou správně</span> - Máte více správných než nesprávných odpovědí</li>
                        <li><span class="color-indicator needs-practice">Potřebuje procvičení</span> - Máte více nesprávných než správných odpovědí</li>
                    </ul>
                </div>
                
                <div class="info-section">
                    <h3>💡 Tipy pro efektivní učení</h3>
                    <ul>
                        <li>Začněte s otázkami, které máte označené jako "potřebuje procvičení"</li>
                        <li>Používejte funkci "Seřadit podle chyb" pro zaměření na problematické oblasti</li>
                        <li>Přidávejte poznámky k otázkám, které vám dělají problémy</li>
                        <li>Čtěte poznámky od ostatních studentů pro nové perspektivy</li>
                        <li>Pravidelně si míchajte otázky pro lepší zapamatování</li>
                    </ul>
                </div>
            </div>
        </div>
        
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
        const allSkills = <?php echo json_encode($skills); ?>;
        const questionSet = <?php echo json_encode($questionSet); ?>;
        const practiceMode = <?php echo json_encode($practiceMode); ?>;
    </script>
    <script src="js/script.js"></script>
</body>
</html>
