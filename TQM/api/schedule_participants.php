<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE');
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
        getScheduleParticipants();
        break;
    case 'POST':
        assignParticipant();
        break;
    case 'DELETE':
        removeParticipant();
        break;
    default:
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
}

function getScheduleParticipants() {
    global $pdo;
    
    try {
        $schedule_id = $_GET['schedule_id'] ?? null;
        if (!$schedule_id) {
            echo json_encode(['success' => false, 'message' => 'Schedule ID diperlukan']);
            return;
        }
        
        $sql = "SELECT sp.*, mp.name, mp.title, mp.section FROM schedule_participants sp JOIN mp_data mp ON sp.participant_npk = mp.npk WHERE sp.schedule_id = ?";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$schedule_id]);
        $participants = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode(['success' => true, 'data' => $participants]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
}

function assignParticipant() {
    global $pdo;
    
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        $sql = "INSERT INTO schedule_participants (schedule_id, participant_npk) VALUES (?, ?)";
        
        $stmt = $pdo->prepare($sql);
        $result = $stmt->execute([
            $input['schedule_id'],
            $input['participant_npk']
        ]);
        
        if ($result) {
            echo json_encode(['success' => true, 'message' => 'Peserta berhasil ditugaskan']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Gagal menugaskan peserta']);
        }
    } catch (Exception $e) {
        if ($e->getCode() == 23000) {
            echo json_encode(['success' => false, 'message' => 'Peserta sudah ditugaskan ke jadwal ini']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
        }
    }
}

function removeParticipant() {
    global $pdo;
    
    try {
        $schedule_id = $_GET['schedule_id'] ?? null;
        $participant_npk = $_GET['participant_npk'] ?? null;
        
        if (!$schedule_id || !$participant_npk) {
            echo json_encode(['success' => false, 'message' => 'Schedule ID dan Participant NPK diperlukan']);
            return;
        }
        
        $stmt = $pdo->prepare("DELETE FROM schedule_participants WHERE schedule_id = ? AND participant_npk = ?");
        $result = $stmt->execute([$schedule_id, $participant_npk]);
        
        if ($result) {
            echo json_encode(['success' => true, 'message' => 'Peserta berhasil dihapus dari jadwal']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Gagal menghapus peserta dari jadwal']);
        }
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
}
?>