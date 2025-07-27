<?php
session_start();
require_once 'auth.php';

// Clear the persistent login cookie
clearLoginCookie();

session_destroy();
header('Location: index.php');
exit;
