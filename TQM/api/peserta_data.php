<?php
require_once '../config/database.php';

header('Content-Type: application/json');

// Enable error reporting for debugging
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

try {
    $database = new Database();
    $db = $database->getConnection();
    
    // Check if database connection is successful
    if (!$db) {
        throw new Exception('Database connection failed');
    }
    
    $method = $_SERVER['REQUEST_METHOD'];
    
    switch ($method) {
        case 'GET':
            handleGet($db);
            break;
        case 'POST':
            handlePost($db);
            break;
        case 'PUT':
            handlePut($db);
            break;
        case 'DELETE':
            handleDelete($db);
            break;
        default:
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    }
    
} catch (Exception $e) {
    error_log('Peserta Data API error: ' . $e->getMessage());
    echo json_encode([
        'success' => false, 
        'message' => 'Terjadi kesalahan sistem: ' . $e->getMessage(),
        'debug' => $e->getTraceAsString()
    ]);
}

function handleGet($db) {
    try {
        if (isset($_GET['id'])) {
            // Get single Peserta
            $query = "SELECT id, npk, name as nama, title, grade, section, training_gc, batch, 
                    pre_test, post_test, seven_tools as tools_7, jigsaw, yaotoshi, 
                    status, created_at, updated_at 
             FROM peserta_data WHERE id = :id";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':id', $_GET['id']);
            $stmt->execute();
            $peserta = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($peserta) {
                echo json_encode(['success' => true, 'data' => $peserta]);
            } else {
                echo json_encode(['success' => false, 'message' => 'Data peserta tidak ditemukan']);
            }
            return;
        }
        
        // Get Peserta list with pagination and filters
        $page = $_GET['page'] ?? 1;
        $limit = 10;
        $offset = ($page - 1) * $limit;
        
        $search = $_GET['search'] ?? '';
        $section = $_GET['section'] ?? '';
        $status = $_GET['status'] ?? '';
        
        $whereConditions = [];
        $params = [];
        
        if (!empty($search)) {
            $whereConditions[] = "(npk LIKE :search OR name LIKE :search)";
            $params[':search'] = "%$search%";
        }
        
        if (!empty($section)) {
            $whereConditions[] = "section = :section";
            $params[':section'] = $section;
        }
        
        if (!empty($status)) {
            $whereConditions[] = "status = :status";
            $params[':status'] = $status;
        }
        
        $whereClause = !empty($whereConditions) ? 'WHERE ' . implode(' AND ', $whereConditions) : '';
        
        // Count total records
        $countQuery = "SELECT COUNT(*) as total FROM peserta_data $whereClause";
        $countStmt = $db->prepare($countQuery);
        foreach ($params as $key => $value) {
            $countStmt->bindValue($key, $value);
        }
        $countStmt->execute();
        $totalRecords = $countStmt->fetch(PDO::FETCH_ASSOC)['total'];
        $totalPages = ceil($totalRecords / $limit);
        
        // Get data
        // Di function handleGet untuk get data list
        // Di function handleGet untuk single peserta
        $query = "SELECT id, npk, name as nama, title, grade, section, training_gc, batch, 
                pre_test, post_test, seven_tools as tools_7, jigsaw, yaotoshi, 
                status, created_at, updated_at 
         FROM peserta_data $whereClause ORDER BY created_at DESC LIMIT :limit OFFSET :offset";
        $stmt = $db->prepare($query);
        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'data' => $data,
            'pagination' => [
                'current_page' => (int)$page,
                'total_pages' => $totalPages,
                'total_records' => $totalRecords,
                'limit' => $limit
            ],
            'debug' => [
                'query' => $query,
                'params' => $params,
                'where_clause' => $whereClause
            ]
        ]);
        
    } catch (Exception $e) {
        error_log('HandleGet error: ' . $e->getMessage());
        echo json_encode([
            'success' => false, 
            'message' => 'Error loading data: ' . $e->getMessage(),
            'debug' => $e->getTraceAsString()
        ]);
    }
}

function handlePost($db) {
    $tanggal = $_POST['tanggal'] ?? '';
    $npk = trim($_POST['npk'] ?? '');
    $name = trim($_POST['name'] ?? '');
    $title = trim($_POST['title'] ?? '');
    $grade = $_POST['grade'] ?? '';
    $section = $_POST['section'] ?? '';
    $training_gc = $_POST['training_gc'] ?? 'Belum';
    $batch = trim($_POST['batch'] ?? '');
    $status = $_POST['status'] ?? 'Dalam Proses';
    $pre_test = $_POST['pre_test'] !== '' ? (int)$_POST['pre_test'] : null;
    $post_test = $_POST['post_test'] !== '' ? (int)$_POST['post_test'] : null;
    $seven_tools = $_POST['seven_tools'] !== '' ? (int)$_POST['seven_tools'] : null;
    $jigsaw = $_POST['jigsaw'] !== '' ? (int)$_POST['jigsaw'] : null;
    $yaotoshi = $_POST['yaotoshi'] !== '' ? (int)$_POST['yaotoshi'] : null;
    
    if (empty($tanggal) || empty($npk) || empty($name) || empty($title) || empty($grade) || empty($section)) {
        echo json_encode(['success' => false, 'message' => 'Semua field wajib harus diisi']);
        return;
    }
    
    // Check if NPK already exists
    $checkQuery = "SELECT id FROM peserta_data WHERE npk = :npk";
    $checkStmt = $db->prepare($checkQuery);
    $checkStmt->bindParam(':npk', $npk);
    $checkStmt->execute();
    
    if ($checkStmt->fetch()) {
        echo json_encode(['success' => false, 'message' => 'NPK sudah terdaftar sebagai peserta']);
        return;
    }
    
    $query = "INSERT INTO peserta_data (tanggal, npk, name, title, grade, section, training_gc, batch, status, pre_test, post_test, seven_tools, jigsaw, yaotoshi) 
              VALUES (:tanggal, :npk, :name, :title, :grade, :section, :training_gc, :batch, :status, :pre_test, :post_test, :seven_tools, :jigsaw, :yaotoshi)";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':tanggal', $tanggal);
    $stmt->bindParam(':npk', $npk);
    $stmt->bindParam(':name', $name);
    $stmt->bindParam(':title', $title);
    $stmt->bindParam(':grade', $grade);
    $stmt->bindParam(':section', $section);
    $stmt->bindParam(':training_gc', $training_gc);
    $stmt->bindParam(':batch', $batch);
    $stmt->bindParam(':status', $status);
    $stmt->bindParam(':pre_test', $pre_test);
    $stmt->bindParam(':post_test', $post_test);
    $stmt->bindParam(':seven_tools', $seven_tools);
    $stmt->bindParam(':jigsaw', $jigsaw);
    $stmt->bindParam(':yaotoshi', $yaotoshi);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Data peserta berhasil ditambahkan']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Gagal menambahkan data peserta']);
    }
}

function handlePut($db) {
    parse_str(file_get_contents('php://input'), $_PUT);
    
    $id = $_PUT['id'] ?? '';
    $npk = trim($_PUT['npk'] ?? '');
    $name = trim($_PUT['name'] ?? '');
    $title = trim($_PUT['title'] ?? '');
    $grade = $_PUT['grade'] ?? '';
    $section = $_PUT['section'] ?? '';
    $training_gc = $_PUT['training_gc'] ?? 'Belum';
    $batch = trim($_PUT['batch'] ?? '');
    $status = $_PUT['status'] ?? 'Dalam Proses';
    $pre_test = $_PUT['pre_test'] !== '' ? (int)$_PUT['pre_test'] : null;
    $post_test = $_PUT['post_test'] !== '' ? (int)$_PUT['post_test'] : null;
    $seven_tools = $_PUT['seven_tools'] !== '' ? (int)$_PUT['seven_tools'] : null;
    $jigsaw = $_PUT['jigsaw'] !== '' ? (int)$_PUT['jigsaw'] : null;
    $yaotoshi = $_PUT['yaotoshi'] !== '' ? (int)$_PUT['yaotoshi'] : null;
    
    if (empty($id) || empty($npk) || empty($name) || empty($title) || empty($grade) || empty($section)) {
        echo json_encode(['success' => false, 'message' => 'Semua field wajib harus diisi']);
        return;
    }
    
    // Check if NPK already exists for other records
    $checkQuery = "SELECT id FROM peserta_data WHERE npk = :npk AND id != :id";
    $checkStmt = $db->prepare($checkQuery);
    $checkStmt->bindParam(':npk', $npk);
    $checkStmt->bindParam(':id', $id);
    $checkStmt->execute();
    
    if ($checkStmt->fetch()) {
        echo json_encode(['success' => false, 'message' => 'NPK sudah terdaftar sebagai peserta']);
        return;
    }
    
    $query = "UPDATE peserta_data SET npk = :npk, name = :name, title = :title, grade = :grade, 
              section = :section, training_gc = :training_gc, batch = :batch, status = :status,
              pre_test = :pre_test, post_test = :post_test, seven_tools = :seven_tools, 
              jigsaw = :jigsaw, yaotoshi = :yaotoshi 
              WHERE id = :id";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $id);
    $stmt->bindParam(':npk', $npk);
    $stmt->bindParam(':name', $name);
    $stmt->bindParam(':title', $title);
    $stmt->bindParam(':grade', $grade);
    $stmt->bindParam(':section', $section);
    $stmt->bindParam(':training_gc', $training_gc);
    $stmt->bindParam(':batch', $batch);
    $stmt->bindParam(':status', $status);
    $stmt->bindParam(':pre_test', $pre_test);
    $stmt->bindParam(':post_test', $post_test);
    $stmt->bindParam(':seven_tools', $seven_tools);
    $stmt->bindParam(':jigsaw', $jigsaw);
    $stmt->bindParam(':yaotoshi', $yaotoshi);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Data peserta berhasil diupdate']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Gagal mengupdate data peserta']);
    }
}

function handleDelete($db) {
    $input = json_decode(file_get_contents('php://input'), true);
    $id = $input['id'] ?? '';
    
    if (empty($id)) {
        echo json_encode(['success' => false, 'message' => 'ID tidak valid']);
        return;
    }
    
    $query = "DELETE FROM peserta_data WHERE id = :id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $id);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Data peserta berhasil dihapus']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Gagal menghapus data peserta']);
    }
}
?>