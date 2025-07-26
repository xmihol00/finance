<?php
session_start();

// Redirect if already logged in
if (isset($_SESSION['username']) && !empty($_SESSION['username'])) {
    header('Location: questions.php');
    exit;
}

// Process login
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['username'])) {
    $username = trim($_POST['username']);
    if (!empty($username)) {
        $_SESSION['username'] = $username;
        
        // Create user if doesn't exist
        $usersFile = 'users.json';
        if (file_exists($usersFile)) {
            $usersData = json_decode(file_get_contents($usersFile), true);
        } else {
            $usersData = ['users' => []];
        }
        
        $userExists = false;
        foreach ($usersData['users'] as $user) {
            if ($user['name'] === $username) {
                $userExists = true;
                break;
            }
        }
        
        if (!$userExists) {
            $usersData['users'][] = [
                'name' => $username,
                'answers' => [
                    'set1' => [
                        'knowledge' => [],
                        'skills' => []
                    ],
                    'set2' => [
                        'knowledge' => [],
                        'skills' => []
                    ]
                ]
            ];
            file_put_contents($usersFile, json_encode($usersData, JSON_PRETTY_PRINT));
        }
        
        header('Location: select-set.php');
        exit;
    }
}
?>

<!DOCTYPE html>
<html lang="cs">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Platforma pro výuku finančních otázek</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <div class="container">
        <div class="login-container">
            <h1>Finanční otázky</h1>
            <p style="margin-bottom: 5px;">Zadejte své jméno pro začátek výuky</p>
            
            <form method="post">
                <div class="form-group">
                    <input type="text" name="username" id="username" placeholder="Vaše jméno" required>
                </div>
                <div class="form-group">
                    <button type="submit" class="btn">Začít výuku</button>
                </div>
            </form>
        </div>
        
        <div class="platform-info">
            <div class="info-content" id="infoContent">
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
    </div>
    

</body>
</html>
