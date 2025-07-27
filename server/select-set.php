<?php
session_start();
require_once 'auth.php';

// Check if user is logged in
$username = requireAuth();

// Process question set and practice mode selection
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['question_set'], $_POST['practice_mode'])) {
    $questionSet = $_POST['question_set'];
    $practiceMode = $_POST['practice_mode'];
    
    // Validate question set and practice mode
    if (($questionSet === 'set1' || $questionSet === 'set2') && 
        ($practiceMode === 'knowledge' || $practiceMode === 'skills')) {
        $_SESSION['question_set'] = $questionSet;
        $_SESSION['practice_mode'] = $practiceMode;
        header('Location: questions.php');
        exit;
    }
}
?>

<!DOCTYPE html>
<html lang="cs">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Výběr zkoušky - Platforma pro výuku finančních otázek</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <div class="container">
        <div class="selection-container">
            <h1>Výběr zkoušky</h1>
            <p>Vítejte, <strong><?php echo htmlspecialchars($username); ?></strong>!</p>
            <p>Vyberte si zkoušku, kterou chcete procvičovat:</p>
            
            <form method="post" class="set-selection-form">
                <div class="selection-section">
                    <h2>1. Vyberte zkoušku</h2>
                    <div class="set-options">
                        <div class="set-option">
                            <input type="radio" name="question_set" id="set1" value="set1" required>
                            <label for="set1" class="set-label">
                                <h3>Zkouška I</h3>
                                <p>Jednání se zákazníky v rámci poskytování investičních služeb týkajícího se pouze investičních nástrojů uvedených v § 29 odst. 3 zákona</p>
                                <div class="question-counts">
                                    <span class="count knowledge-count">741 testových otázek</span>
                                    <span class="count skills-count">51 případových studií</span>
                                </div>
                            </label>
                        </div>
                        
                        <div class="set-option">
                            <input type="radio" name="question_set" id="set2" value="set2" required>
                            <label for="set2" class="set-label">
                                <h3>Zkouška II</h3>
                                <p>Jednání se zákazníky v rámci poskytování investičních služeb týkajícího se všech investičních nástrojů uvedených v § 3 odst. 1 zákona</p>
                                <div class="question-counts">
                                    <span class="count knowledge-count">1019 testových otázek</span>
                                    <span class="count skills-count">64 případových studií</span>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>
                
                <div class="selection-section">
                    <h2>2. Vyberte typ procvičování</h2>
                    <div class="practice-options">
                        <div class="practice-option">
                            <input type="radio" name="practice_mode" id="knowledge" value="knowledge" required>
                            <label for="knowledge" class="practice-label">
                                <h3>Testové otázky (Znalosti)</h3>
                                <p>Jednotlivé otázky s jednou nebo více správnými odpověďmi. Ideální pro procvičování konkrétních znalostí a pojmů.</p>
                            </label>
                        </div>
                        
                        <div class="practice-option">
                            <input type="radio" name="practice_mode" id="skills" value="skills" required>
                            <label for="skills" class="practice-label">
                                <h3>Případové studie (Dovednosti)</h3>
                                <p>Soubory otázek k modelovým situacím. Procvičujte řešení konkrétních scénářů a aplikaci znalostí v praxi.</p>
                            </label>
                        </div>
                    </div>
                </div>
                
                <div class="form-group">
                    <button type="submit" class="btn">Začít procvičování</button>
                </div>
            </form>
            
            <div class="user-actions">
                <a href="logout.php" class="btn btn-small">Odhlásit</a>
            </div>
        </div>
    </div>
</body>
</html> 