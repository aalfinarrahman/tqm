<?php
session_start();
require_once '../config/database.php';

header('Content-Type: application/json');

function checkSession() {
    if (!isset($_SESSION['user_id'])) {
        return false;
    }
    
    // Check session timeout (optional - 2 hours)
    if (isset($_SESSION['login_time']) && (time() - $_SESSION['login_time']) > 7200) {
        session_destroy();
        return false;
    }
    
    return true;
}

if (checkSession()) {
    echo json_encode([
        'success' => true,
        'authenticated' => true,
        'user' => [ 
            'id' => $_SESSION['user_id'],
            'npk' => $_SESSION['npk'],
            'name' => $_SESSION['name'],
            'role' => $_SESSION['role']
        ]
    ]);
} else {
    echo json_encode([
        'success' => false,
        'authenticated' => false
    ]);
}
?>