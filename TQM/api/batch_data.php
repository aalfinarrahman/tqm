<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../config/database.php';
session_start();

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        getBatches();
        break;
    case 'POST':
        createBatch();
        break;
    case 'PUT':
        updateBatch();
        break;
    case 'DELETE':
        deleteBatch();
        break;
    default:
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
}

function getBatches() {
    global $pdo;
    
    try {
        $sql = "SELECT b.*, COUNT(p.npk) as participant_count FROM training_batches b LEFT JOIN peserta_data p ON b.name = p.batch WHERE b.status = 'active' GROUP BY b.id ORDER BY b.created_at DESC";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute();
        $batches = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode(['success' => true, 'data' => $batches]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
}

function createBatch() {
    global $pdo;
    
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        $sql = "INSERT INTO training_batches (name, section, start_date) VALUES (?, ?, ?)";
        
        $stmt = $pdo->prepare($sql);
        $result = $stmt->execute([
            $input['name'],
            $input['section'],
            date('Y-m-d')
        ]);
        
        if ($result) {
            echo json_encode(['success' => true, 'message' => 'Batch berhasil dibuat']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Gagal membuat batch']);
        }
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
}

function updateBatch() {
    global $pdo;
    
    try {
        $id = $_GET['id'] ?? null;
        if (!$id) {
            echo json_encode(['success' => false, 'message' => 'ID batch diperlukan']);
            return;
        }
        
        $input = json_decode(file_get_contents('php://input'), true);
        
        $sql = "UPDATE training_batches SET name=?, section=? WHERE id=?";
        
        $stmt = $pdo->prepare($sql);
        $result = $stmt->execute([
            $input['name'],
            $input['section'],
            $id
        ]);
        
        if ($result) {
            echo json_encode(['success' => true, 'message' => 'Batch berhasil diperbarui']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Gagal memperbarui batch']);
        }
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
}

function deleteBatch() {
    global $pdo;
    
    try {
        $id = $_GET['id'] ?? null;
        if (!$id) {
            echo json_encode(['success' => false, 'message' => 'ID batch diperlukan']);
            return;
        }
        
        $stmt = $pdo->prepare("UPDATE training_batches SET status = 'cancelled' WHERE id = ?");
        $result = $stmt->execute([$id]);
        
        if ($result) {
            echo json_encode(['success' => true, 'message' => 'Batch berhasil dihapus']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Gagal menghapus batch']);
        }
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
}
?>