<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../config/database.php';
session_start();

// Check if user is logged in and is admin
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
    echo json_encode(['success' => false, 'message' => 'Access denied']);
    exit;
}

try {
    $database = new Database();
    $pdo = $database->getConnection();
    
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        if (isset($_GET['id'])) {
            // Get single user
            $stmt = $pdo->prepare("SELECT id, npk, name, role, status, created_at FROM users WHERE id = ?");
            $stmt->execute([$_GET['id']]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($user) {
                echo json_encode(['success' => true, 'user' => $user]);
            } else {
                echo json_encode(['success' => false, 'message' => 'User not found']);
            }
        } else {
            // Get all users
            $stmt = $pdo->query("SELECT id, npk, name, role, status, created_at FROM users ORDER BY created_at DESC");
            $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode(['success' => true, 'users' => $users]);
        }
    } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $action = $_POST['action'] ?? 'create';
        
        if ($action === 'create') {
            // Add new user
            $npk = $_POST['npk'] ?? '';
            $name = $_POST['name'] ?? '';
            $role = $_POST['role'] ?? 'staff';
            $password = $_POST['password'] ?? '';
            $status = $_POST['status'] ?? 'active';
            
            if (empty($npk) || empty($name) || empty($password)) {
                echo json_encode(['success' => false, 'message' => 'NPK, name, and password are required']);
                exit;
            }
            
            // Check if NPK already exists
            $stmt = $pdo->prepare("SELECT id FROM users WHERE npk = ?");
            $stmt->execute([$npk]);
            if ($stmt->fetch()) {
                echo json_encode(['success' => false, 'message' => 'NPK already exists']);
                exit;
            }
            
            // Hash password
            $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
            
            // Insert new user
            $stmt = $pdo->prepare("INSERT INTO users (npk, name, role, password, status) VALUES (?, ?, ?, ?, ?)");
            $result = $stmt->execute([$npk, $name, $role, $hashedPassword, $status]);
            
            if ($result) {
                echo json_encode(['success' => true, 'message' => 'User created successfully']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Failed to create user']);
            }
            
        } elseif ($action === 'update') {
            // Update user
            $id = $_POST['id'] ?? '';
            $npk = $_POST['npk'] ?? '';
            $name = $_POST['name'] ?? '';
            $role = $_POST['role'] ?? 'staff';
            $password = $_POST['password'] ?? '';
            $status = $_POST['status'] ?? 'active';
            
            if (empty($id) || empty($npk) || empty($name)) {
                echo json_encode(['success' => false, 'message' => 'ID, NPK, and name are required']);
                exit;
            }
            
            // Check if NPK already exists for other users
            $stmt = $pdo->prepare("SELECT id FROM users WHERE npk = ? AND id != ?");
            $stmt->execute([$npk, $id]);
            if ($stmt->fetch()) {
                echo json_encode(['success' => false, 'message' => 'NPK already exists']);
                exit;
            }
            
            // Update user
            if (!empty($password)) {
                // Update with new password
                $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
                $stmt = $pdo->prepare("UPDATE users SET npk = ?, name = ?, role = ?, password = ?, status = ? WHERE id = ?");
                $result = $stmt->execute([$npk, $name, $role, $hashedPassword, $status, $id]);
            } else {
                // Update without changing password
                $stmt = $pdo->prepare("UPDATE users SET npk = ?, name = ?, role = ?, status = ? WHERE id = ?");
                $result = $stmt->execute([$npk, $name, $role, $status, $id]);
            }
            
            if ($result) {
                echo json_encode(['success' => true, 'message' => 'User updated successfully']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Failed to update user']);
            }
            
        } elseif ($action === 'delete') {
            // Delete user
            $id = $_POST['id'] ?? '';
            
            if (empty($id)) {
                echo json_encode(['success' => false, 'message' => 'User ID is required']);
                exit;
            }
            
            // Don't allow deleting current user
            if ($id == $_SESSION['user_id']) {
                echo json_encode(['success' => false, 'message' => 'Cannot delete your own account']);
                exit;
            }
            
            $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
            $result = $stmt->execute([$id]);
            
            if ($result) {
                echo json_encode(['success' => true, 'message' => 'User deleted successfully']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Failed to delete user']);
            }
        }
    }
    
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}
?>