<?php
// Shared authentication functions

// Function to set persistent login cookie
function setLoginCookie($username) {
    $cookieValue = base64_encode($username . '|' . time() . '|' . hash('sha256', $username . '|' . $_SERVER['HTTP_USER_AGENT']));
    setcookie('finance_login', $cookieValue, time() + (30 * 24 * 60 * 60), '/', '', false, true); // 30 days, secure, httponly
}

// Function to validate login cookie
function validateLoginCookie() {
    if (!isset($_COOKIE['finance_login'])) {
        return false;
    }
    
    $cookieValue = $_COOKIE['finance_login'];
    $decoded = base64_decode($cookieValue);
    $parts = explode('|', $decoded);
    
    if (count($parts) !== 3) {
        return false;
    }
    
    $username = $parts[0];
    $timestamp = $parts[1];
    $hash = $parts[2];
    
    // Check if cookie is not too old (30 days)
    if (time() - $timestamp > 30 * 24 * 60 * 60) {
        return false;
    }
    
    // Verify hash
    $expectedHash = hash('sha256', $username . '|' . $_SERVER['HTTP_USER_AGENT']);
    if ($hash !== $expectedHash) {
        return false;
    }
    
    return $username;
}

// Function to get current user (from session or cookie)
function getCurrentUser() {
    if (isset($_SESSION['username']) && !empty($_SESSION['username'])) {
        return $_SESSION['username'];
    }
    
    // Try to restore session from cookie
    $cookieUsername = validateLoginCookie();
    if ($cookieUsername) {
        $_SESSION['username'] = $cookieUsername;
        return $cookieUsername;
    }
    
    return null;
}

// Function to require authentication
function requireAuth() {
    $username = getCurrentUser();
    if (!$username) {
        header('Location: index.php');
        exit;
    }
    return $username;
}

// Function to clear login cookie
function clearLoginCookie() {
    setcookie('finance_login', '', time() - 3600, '/', '', false, true);
}
?> 