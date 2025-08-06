<?php
require_once '../config/database.php';

header('Content-Type: application/json');

try {
    $database = new Database();
    $db = $database->getConnection();
    
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
    error_log('MP Data API error: ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Terjadi kesalahan sistem']);
}

function handleGet($db) {
    if (isset($_GET['id'])) {
        // Get single MP
        $query = "SELECT * FROM mp_data WHERE id = :id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':id', $_GET['id']);
        $stmt->execute();
        $mp = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($mp) {
            echo json_encode(['success' => true, 'data' => $mp]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Data MP tidak ditemukan']);
        }
        return;
    }
    
    // Get MP list with pagination and filters
    $page = $_GET['page'] ?? 1;
    $limit = $_GET['limit'] ?? 10; // Tambahkan parameter limit
    $offset = ($page - 1) * $limit;
    
    $search = $_GET['search'] ?? '';
    $section = $_GET['section'] ?? '';
    $grade = $_GET['grade'] ?? '';
    $sortBy = $_GET['sort_by'] ?? 'created_at'; // Tambahkan parameter sorting
    $sortOrder = $_GET['sort_order'] ?? 'DESC'; // Tambahkan parameter order
    
    // Validasi kolom sorting yang diizinkan
    $allowedSortColumns = ['npk', 'name', 'title', 'grade', 'section', 'training_gc', 'batch', 'created_at'];
    if (!in_array($sortBy, $allowedSortColumns)) {
        $sortBy = 'created_at';
    }
    
    // Validasi sort order
    if (!in_array(strtoupper($sortOrder), ['ASC', 'DESC'])) {
        $sortOrder = 'DESC';
    }
    
    // Validasi limit
    $allowedLimits = [10, 25, 50, 100];
    if (!in_array((int)$limit, $allowedLimits)) {
        $limit = 10;
    }
    
    $whereConditions = ["status = 'active'"];
    $params = [];
    
    if (!empty($search)) {
        $whereConditions[] = "(npk LIKE :search OR name LIKE :search)";
        $params[':search'] = "%$search%";
    }
    
    if (!empty($section)) {
        $whereConditions[] = "section = :section";
        $params[':section'] = $section;
    }
    
    if (!empty($grade)) {
        $whereConditions[] = "grade = :grade";
        $params[':grade'] = $grade;
    }
    
    $whereClause = implode(' AND ', $whereConditions);
    
    // Count total records
    $countQuery = "SELECT COUNT(*) as total FROM mp_data WHERE $whereClause";
    $countStmt = $db->prepare($countQuery);
    foreach ($params as $key => $value) {
        $countStmt->bindValue($key, $value);
    }
    $countStmt->execute();
    $totalRecords = $countStmt->fetch(PDO::FETCH_ASSOC)['total'];
    $totalPages = ceil($totalRecords / $limit);
    
    // Get data
    $query = "SELECT * FROM mp_data WHERE $whereClause ORDER BY $sortBy $sortOrder LIMIT :limit OFFSET :offset";
    $stmt = $db->prepare($query);
    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value);
    }
    $stmt->bindValue(':limit', (int)$limit, PDO::PARAM_INT);
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
        ]
    ]);
}

function handlePost($db) {
    $npk = trim($_POST['npk'] ?? '');
    $name = trim($_POST['name'] ?? '');
    $title = trim($_POST['title'] ?? '');
    $grade = $_POST['grade'] ?? '';
    $section = $_POST['section'] ?? '';
    $training_gc = $_POST['training_gc'] ?? 'Belum';
    $batch = trim($_POST['batch'] ?? '');
    
    if (empty($npk) || empty($name) || empty($title) || empty($grade) || empty($section)) {
        echo json_encode(['success' => false, 'message' => 'Semua field wajib harus diisi']);
        return;
    }
    
    // Check if NPK already exists
    $checkQuery = "SELECT id FROM mp_data WHERE npk = :npk";
    $checkStmt = $db->prepare($checkQuery);
    $checkStmt->bindParam(':npk', $npk);
    $checkStmt->execute();
    
    if ($checkStmt->fetch()) {
        echo json_encode(['success' => false, 'message' => 'NPK sudah terdaftar']);
        return;
    }
    
    $query = "INSERT INTO mp_data (npk, name, title, grade, section, training_gc, batch) 
              VALUES (:npk, :name, :title, :grade, :section, :training_gc, :batch)";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':npk', $npk);
    $stmt->bindParam(':name', $name);
    $stmt->bindParam(':title', $title);
    $stmt->bindParam(':grade', $grade);
    $stmt->bindParam(':section', $section);
    $stmt->bindParam(':training_gc', $training_gc);
    $stmt->bindParam(':batch', $batch);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Data MP berhasil ditambahkan']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Gagal menambahkan data MP']);
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
    
    if (empty($id) || empty($npk) || empty($name) || empty($title) || empty($grade) || empty($section)) {
        echo json_encode(['success' => false, 'message' => 'Semua field wajib harus diisi']);
        return;
    }
    
    // Check if NPK already exists for other records
    $checkQuery = "SELECT id FROM mp_data WHERE npk = :npk AND id != :id";
    $checkStmt = $db->prepare($checkQuery);
    $checkStmt->bindParam(':npk', $npk);
    $checkStmt->bindParam(':id', $id);
    $checkStmt->execute();
    
    if ($checkStmt->fetch()) {
        echo json_encode(['success' => false, 'message' => 'NPK sudah terdaftar']);
        return;
    }
    
    $query = "UPDATE mp_data SET npk = :npk, name = :name, title = :title, grade = :grade, 
              section = :section, training_gc = :training_gc, batch = :batch 
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
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Data MP berhasil diupdate']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Gagal mengupdate data MP']);
    }
}

function handleDelete($db) {
    $input = json_decode(file_get_contents('php://input'), true);
    $id = $input['id'] ?? '';
    
    if (empty($id)) {
        echo json_encode(['success' => false, 'message' => 'ID tidak valid']);
        return;
    }
    
    $query = "UPDATE mp_data SET status = 'inactive' WHERE id = :id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $id);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Data MP berhasil dihapus']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Gagal menghapus data MP']);
    }
}
?>