<?php
session_start();
require_once '../config/database.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

try {
    $database = new Database();
    $db = $database->getConnection();
    
    $npk = trim($_POST['npk'] ?? '');
    $password = $_POST['password'] ?? '';
    $remember = $_POST['remember'] ?? '0';
    
    if (empty($npk) || empty($password)) {
        echo json_encode(['success' => false, 'message' => 'NPK dan password harus diisi']);
        exit;
    }
    
    // Query user berdasarkan NPK
    $query = "SELECT id, npk, name, role, password, status 
              FROM users 
              WHERE npk = :npk AND status = 'active'
              LIMIT 1";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':npk', $npk);
    $stmt->execute();
    
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        echo json_encode(['success' => false, 'message' => 'NPK atau password salah']);
        exit;
    }
    
    // Verify password - Updated to handle both plain text and hashed passwords
    if (!password_verify($password, $user['password']) && $password !== $user['password']) {
        echo json_encode(['success' => false, 'message' => 'NPK atau password salah']);
        exit;
    }
    
    // Login successful - create session
    $_SESSION['user_id'] = $user['id'];
    $_SESSION['npk'] = $user['npk'];
    $_SESSION['name'] = $user['name'];
    $_SESSION['role'] = $user['role'];
    $_SESSION['login_time'] = time();
    
    // Set remember me cookie if requested
    if ($remember === '1') {
        $token = bin2hex(random_bytes(32));
        setcookie('remember_token', $token, time() + (30 * 24 * 60 * 60), '/', '', false, true); // 30 days
        
        // Save token to database
        $updateQuery = "UPDATE users SET remember_token = :token WHERE id = :id";
        $updateStmt = $db->prepare($updateQuery);
        $updateStmt->bindParam(':token', password_hash($token, PASSWORD_DEFAULT));
        $updateStmt->bindParam(':id', $user['id']);
        $updateStmt->execute();
    }
    
    // Update last login
    $updateLogin = "UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = :id";
    $updateStmt = $db->prepare($updateLogin);
    $updateStmt->bindParam(':id', $user['id']);
    $updateStmt->execute();
    
    echo json_encode([
        'success' => true,
        'message' => 'Login berhasil',
        'user' => [
            'id' => $user['id'],
            'npk' => $user['npk'],
            'name' => $user['name'],
            'role' => $user['role']
        ],
        'redirect' => 'dashboard.html'
    ]);
    
} catch (Exception $e) {
    error_log('Login error: ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Terjadi kesalahan sistem']);
}
?>