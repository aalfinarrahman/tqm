<?php
require_once '../config/database.php';

header('Content-Type: application/json');

try {
    $database = new Database();
    $db = $database->getConnection();
    
    $action = $_GET['action'] ?? '';
    
    switch ($action) {
        case 'export':
            exportToExcel($db);
            break;
        case 'import':
            importFromExcel($db);
            break;
        default:
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Action not specified']);
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}

function exportToExcel($db) {
    try {
        // Get all active MP data
        $query = "SELECT npk, name, title, grade, section, training_gc, batch, created_at FROM mp_data WHERE status = 'active' ORDER BY created_at DESC";
        $stmt = $db->prepare($query);
        $stmt->execute();
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Set headers for CSV download (lebih kompatibel)
        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename="data_mp_' . date('Y-m-d_H-i-s') . '.csv"');
        header('Cache-Control: max-age=0');
        
        // Output CSV with BOM for Excel compatibility
        echo "\xEF\xBB\xBF"; // UTF-8 BOM
        
        // Create CSV content
        $output = fopen('php://output', 'w');
        
        // Header row
        fputcsv($output, ['NPK', 'Nama', 'Title', 'Grade', 'Section', 'Training GC', 'Batch', 'Tanggal Dibuat']);
        
        // Data rows
        foreach ($data as $row) {
            fputcsv($output, [
                $row['npk'],
                $row['name'],
                $row['title'],
                $row['grade'],
                $row['section'],
                $row['training_gc'],
                $row['batch'],
                $row['created_at']
            ]);
        }
        
        fclose($output);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Export failed: ' . $e->getMessage()]);
    }
}

function importFromExcel($db) {
    try {
        if (!isset($_FILES['excel_file']) || $_FILES['excel_file']['error'] !== UPLOAD_ERR_OK) {
            echo json_encode(['success' => false, 'message' => 'File upload error']);
            return;
        }
        
        $file = $_FILES['excel_file']['tmp_name'];
        $fileName = $_FILES['excel_file']['name'];
        $fileExtension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
        
        $imported = 0;
        $errors = [];
        $data = [];
        
        // Handle different file types
        if ($fileExtension === 'csv') {
            // Handle CSV files
            $handle = fopen($file, 'r');
            if (!$handle) {
                echo json_encode(['success' => false, 'message' => 'Cannot read CSV file']);
                return;
            }
            
            // Skip header row
            fgetcsv($handle);
            
            while (($row = fgetcsv($handle)) !== FALSE) {
                $data[] = $row;
            }
            fclose($handle);
            
        } elseif ($fileExtension === 'xlsx') {
            // Handle XLSX files
            $data = parseXLSX($file);
            
        } elseif ($fileExtension === 'xls') {
            // Handle XLS files dengan cara sederhana
            $data = parseXLS($file);
            
        } else {
            echo json_encode(['success' => false, 'message' => 'Format file tidak didukung. Gunakan .csv, .xls, atau .xlsx']);
            return;
        }
        
        // Process the data
        // Di dalam function importFromExcel, tambahkan validasi setelah trim data:
        foreach ($data as $lineNumber => $row) {
            $lineNumber++; // Start from 1
            
            if (count($row) < 7) {
                $errors[] = "Baris $lineNumber: Data tidak lengkap (minimal 7 kolom)";
                continue;
            }
            
            $npk = trim($row[0]);
            $name = trim($row[1]);
            $title = trim($row[2]);
            $grade = trim($row[3]);
            $section = trim($row[4]);
            $training_gc = trim($row[5]) ?: 'Belum';
            $batch = trim($row[6]);
            
            // Validate required fields
            if (empty($npk) || empty($name) || empty($title) || empty($grade) || empty($section)) {
                $errors[] = "Baris $lineNumber: Field wajib kosong (NPK: $npk, Nama: $name)";
                continue;
            }
            
            // Validate field lengths based on database schema
            if (strlen($npk) > 20) {
                $errors[] = "Baris $lineNumber: NPK terlalu panjang (maksimal 20 karakter): $npk";
                continue;
            }
            
            if (strlen($name) > 100) {
                $errors[] = "Baris $lineNumber: Nama terlalu panjang (maksimal 100 karakter): $name";
                continue;
            }
            
            if (strlen($title) > 100) {
                $errors[] = "Baris $lineNumber: Title terlalu panjang (maksimal 100 karakter): $title";
                continue;
            }
            
            // Validate training_gc enum values
            if (!in_array($training_gc, ['Sudah', 'Belum'])) {
                $training_gc = 'Belum'; // Default value
            }
            
            // Validate grade format - lebih fleksibel untuk mengizinkan format seperti I-I, II-I, dll
            // Hanya validasi panjang karakter, tidak membatasi format spesifik
            if (strlen($grade) > 10) {
                $errors[] = "Baris $lineNumber: Grade terlalu panjang (maksimal 10 karakter): $grade";
                continue;
            }
            
            // Normalisasi grade - hapus spasi berlebih tapi pertahankan format asli
            $grade = trim($grade);
            
            // Validasi grade tidak boleh kosong setelah trim
            if (empty($grade)) {
                $errors[] = "Baris $lineNumber: Grade tidak boleh kosong";
                continue;
            }
            
            if (strlen($section) > 50) {
                $errors[] = "Baris $lineNumber: Section terlalu panjang (maksimal 50 karakter): $section";
                continue;
            }
            
            if (strlen($batch) > 20) {
                $errors[] = "Baris $lineNumber: Batch terlalu panjang (maksimal 20 karakter): $batch";
                continue;
            }
            
            // Validate training_gc enum values
            if (!in_array($training_gc, ['Sudah', 'Belum'])) {
                $training_gc = 'Belum'; // Default value
            }
            
            // Hapus validasi grade yang ketat - izinkan semua format grade
            // Hanya validasi bahwa grade tidak kosong dan tidak melebihi panjang maksimal
            if (empty($grade)) {
                $errors[] = "Baris $lineNumber: Grade tidak boleh kosong";
                continue;
            }
            
            // Check if NPK already exists
            $checkQuery = "SELECT id FROM mp_data WHERE npk = :npk";
            $checkStmt = $db->prepare($checkQuery);
            $checkStmt->bindParam(':npk', $npk);
            $checkStmt->execute();
            
            if ($checkStmt->fetch()) {
                $errors[] = "Baris $lineNumber: NPK $npk sudah ada";
                continue;
            }
            
            // Hapus seluruh blok validasi grade yang ketat (baris 212-224)
            // Langsung ke insert data
            
            // Insert data
            $insertQuery = "INSERT INTO mp_data (npk, name, title, grade, section, training_gc, batch) VALUES (:npk, :name, :title, :grade, :section, :training_gc, :batch)";
            $insertStmt = $db->prepare($insertQuery);
            
            $insertStmt->bindParam(':npk', $npk);
            $insertStmt->bindParam(':name', $name);
            $insertStmt->bindParam(':title', $title);
            $insertStmt->bindParam(':grade', $grade);
            $insertStmt->bindParam(':section', $section);
            $insertStmt->bindParam(':training_gc', $training_gc);
            $insertStmt->bindParam(':batch', $batch);
            
            if ($insertStmt->execute()) {
                $imported++;
            } else {
                $errors[] = "Baris $lineNumber: Gagal menyimpan ke database";
            }
        }
        
        $message = "Import selesai. $imported data berhasil diimport.";
        if (!empty($errors)) {
            $message .= " Error: " . implode(', ', array_slice($errors, 0, 3));
            if (count($errors) > 3) {
                $message .= " dan " . (count($errors) - 3) . " error lainnya...";
            }
        }
        
        echo json_encode([
            'success' => true,
            'message' => $message,
            'imported' => $imported,
            'errors' => count($errors)
        ]);
        
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Import failed: ' . $e->getMessage()]);
    }
}

function parseXLSX($file) {
    $data = [];
    
    try {
        // Simple XLSX parser using ZIP and XML
        $zip = new ZipArchive();
        if ($zip->open($file) !== TRUE) {
            throw new Exception('Cannot open XLSX file');
        }
        
        // Read shared strings
        $sharedStrings = [];
        if ($zip->locateName('xl/sharedStrings.xml') !== false) {
            $sharedStringsXml = $zip->getFromName('xl/sharedStrings.xml');
            $sharedStringsDoc = new DOMDocument();
            $sharedStringsDoc->loadXML($sharedStringsXml);
            $strings = $sharedStringsDoc->getElementsByTagName('t');
            foreach ($strings as $string) {
                $sharedStrings[] = $string->nodeValue;
            }
        }
        
        // Read worksheet data
        $worksheetXml = $zip->getFromName('xl/worksheets/sheet1.xml');
        $worksheetDoc = new DOMDocument();
        $worksheetDoc->loadXML($worksheetXml);
        
        $rows = $worksheetDoc->getElementsByTagName('row');
        $isFirstRow = true;
        
        foreach ($rows as $row) {
            if ($isFirstRow) {
                $isFirstRow = false;
                continue; // Skip header row
            }
            
            $cells = $row->getElementsByTagName('c');
            $rowData = [];
            $colIndex = 0;
            
            foreach ($cells as $cell) {
                $cellValue = '';
                $type = $cell->getAttribute('t');
                $value = $cell->getElementsByTagName('v')->item(0);
                
                if ($value) {
                    if ($type === 's') {
                        // Shared string
                        $index = (int)$value->nodeValue;
                        $cellValue = isset($sharedStrings[$index]) ? $sharedStrings[$index] : '';
                    } else {
                        $cellValue = $value->nodeValue;
                    }
                }
                
                $rowData[] = $cellValue;
                $colIndex++;
            }
            
            if (!empty(array_filter($rowData))) {
                $data[] = $rowData;
            }
        }
        
        $zip->close();
        
    } catch (Exception $e) {
        throw new Exception('Error parsing XLSX: ' . $e->getMessage());
    }
    
    return $data;
}

function parseXLS($file) {
    // Untuk file .xls, kita akan menggunakan pendekatan sederhana
    // Membaca sebagai binary dan mencoba ekstrak data
    
    try {
        // Coba baca file sebagai CSV dengan encoding yang berbeda
        $content = file_get_contents($file);
        
        // Jika file .xls berisi data tab-separated atau comma-separated
        // kita coba parse sebagai CSV
        $lines = explode("\n", $content);
        $data = [];
        $isFirstLine = true;
        
        foreach ($lines as $line) {
            if ($isFirstLine) {
                $isFirstLine = false;
                continue; // Skip header
            }
            
            $line = trim($line);
            if (empty($line)) continue;
            
            // Try different delimiters
            $row = str_getcsv($line, "\t"); // Tab separated
            if (count($row) < 7) {
                $row = str_getcsv($line, ","); // Comma separated
            }
            if (count($row) < 7) {
                $row = str_getcsv($line, ";"); // Semicolon separated
            }
            
            if (count($row) >= 7) {
                $data[] = $row;
            }
        }
        
        if (empty($data)) {
            throw new Exception('File .xls tidak dapat dibaca. Silakan simpan sebagai .xlsx atau .csv dari Excel');
        }
        
        return $data;
        
    } catch (Exception $e) {
        throw new Exception('Error parsing XLS: Silakan konversi file ke format .xlsx atau .csv terlebih dahulu');
    }
}
?>