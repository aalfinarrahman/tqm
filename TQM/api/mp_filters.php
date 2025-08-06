<?php
require_once '../config/database.php';

header('Content-Type: application/json');

try {
    $database = new Database();
    $db = $database->getConnection();
    
    // Get unique sections
    $sectionQuery = "SELECT DISTINCT section FROM mp_data WHERE status = 'active' AND section IS NOT NULL AND section != '' ORDER BY section ASC";
    $sectionStmt = $db->prepare($sectionQuery);
    $sectionStmt->execute();
    $sections = $sectionStmt->fetchAll(PDO::FETCH_COLUMN);
    
    // Get unique grades
    $gradeQuery = "SELECT DISTINCT grade FROM mp_data WHERE status = 'active' AND grade IS NOT NULL AND grade != '' ORDER BY grade ASC";
    $gradeStmt = $db->prepare($gradeQuery);
    $gradeStmt->execute();
    $grades = $gradeStmt->fetchAll(PDO::FETCH_COLUMN);
    
    echo json_encode([
        'success' => true,
        'data' => [
            'sections' => $sections,
            'grades' => $grades
        ]
    ]);
    
} catch (Exception $e) {
    error_log('MP Filters API error: ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Terjadi kesalahan sistem']);
}
?>