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
                'answers' => []
            ];
            file_put_contents($usersFile, json_encode($usersData, JSON_PRETTY_PRINT));
        }
        
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
    <title>Platforma pro výuku finančních otázek</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <div class="container">
        <div class="login-container">
            <h1>Finanční otázky</h1>
            <p>Zadejte své jméno pro začátek výuky</p>
            
            <form method="post">
                <div class="form-group">
                    <input type="text" name="username" id="username" placeholder="Vaše jméno" required>
                </div>
                <div class="form-group">
                    <button type="submit" class="btn">Začít výuku</button>
                </div>
            </form>
        </div>
    </div>
</body>
</html>
