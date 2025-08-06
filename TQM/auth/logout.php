<?php
session_start();

// Clear remember me cookie
if (isset($_COOKIE['remember_token'])) {
    setcookie('remember_token', '', time() - 3600, '/');
}

// Destroy session
session_destroy();

header('Content-Type: application/json');
echo json_encode(['success' => true, 'message' => 'Logout berhasil']);
?>