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
        getSchedules();
        break;
    case 'POST':
        createSchedule();
        break;
    case 'PUT':
        updateSchedule();
        break;
    case 'DELETE':
        deleteSchedule();
        break;
    default:
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
}

function getSchedules() {
    global $pdo;
    
    try {
        // Check if table exists first
        $checkTable = $pdo->query("SHOW TABLES LIKE 'training_schedules'");
        if ($checkTable->rowCount() == 0) {
            echo json_encode(['success' => false, 'message' => 'Tabel training_schedules belum dibuat. Silakan jalankan script database terlebih dahulu.']);
            return;
        }
        
        $month = $_GET['month'] ?? '';
        $type = $_GET['type'] ?? '';
        
        $sql = "SELECT * FROM training_schedules WHERE 1=1";
        $params = [];
        
        if (!empty($month)) {
            $sql .= " AND DATE_FORMAT(scheduled_date, '%Y-%m') = ?";
            $params[] = $month;
        }
        
        if (!empty($type)) {
            $sql .= " AND training_type = ?";
            $params[] = $type;
        }
        
        $sql .= " ORDER BY scheduled_date ASC, start_time ASC";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $schedules = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get participant count for each schedule
        foreach ($schedules as &$schedule) {
            $countStmt = $pdo->prepare("SELECT COUNT(*) as count FROM schedule_participants WHERE schedule_id = ?");
            $countStmt->execute([$schedule['id']]);
            $count = $countStmt->fetch(PDO::FETCH_ASSOC);
            $schedule['participant_count'] = $count['count'];
        }
        
        echo json_encode(['success' => true, 'data' => $schedules]);
    } catch (Exception $e) {
        error_log('Schedule API Error: ' . $e->getMessage());
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
}

function createSchedule() {
    global $pdo;
    
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        $sql = "INSERT INTO training_schedules (training_type, batch_name, scheduled_date, start_time, end_time, room, trainer, max_participants, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
        
        $stmt = $pdo->prepare($sql);
        $result = $stmt->execute([
            $input['training_type'],
            $input['batch_name'],
            $input['scheduled_date'],
            $input['start_time'],
            $input['end_time'],
            $input['room'],
            $input['trainer'],
            $input['max_participants'],
            $input['description'] ?? null
        ]);
        
        if ($result) {
            echo json_encode(['success' => true, 'message' => 'Jadwal berhasil ditambahkan']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Gagal menambahkan jadwal']);
        }
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
}

function updateSchedule() {
    global $pdo;
    
    try {
        $id = $_GET['id'] ?? null;
        if (!$id) {
            echo json_encode(['success' => false, 'message' => 'ID jadwal diperlukan']);
            return;
        }
        
        $input = json_decode(file_get_contents('php://input'), true);
        
        $sql = "UPDATE training_schedules SET training_type=?, batch_name=?, scheduled_date=?, start_time=?, end_time=?, room=?, trainer=?, max_participants=?, description=? WHERE id=?";
        
        $stmt = $pdo->prepare($sql);
        $result = $stmt->execute([
            $input['training_type'],
            $input['batch_name'],
            $input['scheduled_date'],
            $input['start_time'],
            $input['end_time'],
            $input['room'],
            $input['trainer'],
            $input['max_participants'],
            $input['description'] ?? null,
            $id
        ]);
        
        if ($result) {
            echo json_encode(['success' => true, 'message' => 'Jadwal berhasil diperbarui']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Gagal memperbarui jadwal']);
        }
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
}

function deleteSchedule() {
    global $pdo;
    
    try {
        $id = $_GET['id'] ?? null;
        if (!$id) {
            echo json_encode(['success' => false, 'message' => 'ID jadwal diperlukan']);
            return;
        }
        
        $stmt = $pdo->prepare("DELETE FROM training_schedules WHERE id = ?");
        $result = $stmt->execute([$id]);
        
        if ($result) {
            echo json_encode(['success' => true, 'message' => 'Jadwal berhasil dihapus']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Gagal menghapus jadwal']);
        }
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
}
?>