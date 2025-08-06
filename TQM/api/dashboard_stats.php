<?php
require_once '../config/database.php';

header('Content-Type: application/json');

try {
    $database = new Database();
    $db = $database->getConnection();
    
    // Get MP count
    $mpQuery = "SELECT COUNT(*) as total FROM mp_data WHERE status = 'active'";
    $mpStmt = $db->prepare($mpQuery);
    $mpStmt->execute();
    $totalMP = $mpStmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    // Get Peserta count
    $pesertaQuery = "SELECT COUNT(*) as total FROM peserta_data";
    $pesertaStmt = $db->prepare($pesertaQuery);
    $pesertaStmt->execute();
    $totalPeserta = $pesertaStmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    // Get Lulus count
    $lulusQuery = "SELECT COUNT(*) as total FROM peserta_data WHERE status = 'Lulus'";
    $lulusStmt = $db->prepare($lulusQuery);
    $lulusStmt->execute();
    $totalLulus = $lulusStmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    // Get Gagal count
    $gagalQuery = "SELECT COUNT(*) as total FROM peserta_data WHERE status = 'Gagal'";
    $gagalStmt = $db->prepare($gagalQuery);
    $gagalStmt->execute();
    $totalGagal = $gagalStmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    // Update dashboard_stats table
    $updateQuery = "INSERT INTO dashboard_stats (id, total_mp, total_peserta, total_lulus, total_gagal) 
                    VALUES (1, :total_mp, :total_peserta, :total_lulus, :total_gagal) 
                    ON DUPLICATE KEY UPDATE 
                    total_mp = :total_mp, 
                    total_peserta = :total_peserta, 
                    total_lulus = :total_lulus, 
                    total_gagal = :total_gagal";
    
    $updateStmt = $db->prepare($updateQuery);
    $updateStmt->bindParam(':total_mp', $totalMP);
    $updateStmt->bindParam(':total_peserta', $totalPeserta);
    $updateStmt->bindParam(':total_lulus', $totalLulus);
    $updateStmt->bindParam(':total_gagal', $totalGagal);
    $updateStmt->execute();
    
    echo json_encode([
        'success' => true,
        'stats' => [
            'total_mp' => $totalMP,
            'total_peserta' => $totalPeserta,
            'total_lulus' => $totalLulus,
            'total_gagal' => $totalGagal
        ]
    ]);
    
} catch (Exception $e) {
    error_log('Dashboard stats error: ' . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Gagal memuat statistik dashboard'
    ]);
}
?>