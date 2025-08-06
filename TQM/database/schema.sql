-- TQM System Database Schema (Updated)
-- Database: tqm_system

-- Create database
CREATE DATABASE IF NOT EXISTS tqm_system;
USE tqm_system;

-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    npk VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    role ENUM('admin', 'manager', 'supervisor', 'staff') DEFAULT 'staff',
    password VARCHAR(255) NOT NULL,
    status ENUM('active', 'inactive') DEFAULT 'active',
    remember_token VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- MP (Manpower) database table
CREATE TABLE IF NOT EXISTS mp_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    npk VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    title VARCHAR(100) NOT NULL,
    grade VARCHAR(10) NOT NULL,
    section VARCHAR(50) NOT NULL,
    training_gc ENUM('Sudah', 'Belum') DEFAULT 'Belum',
    batch VARCHAR(20) NULL,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Peserta (Participants) data table
CREATE TABLE IF NOT EXISTS peserta_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    npk VARCHAR(20) NOT NULL,
    name VARCHAR(100) NOT NULL,
    title VARCHAR(100) NOT NULL,
    grade VARCHAR(10) NOT NULL,
    section VARCHAR(50) NOT NULL,
    training_gc ENUM('Sudah', 'Belum') DEFAULT 'Belum',
    batch VARCHAR(20) NULL,
    pre_test INT DEFAULT NULL,
    post_test INT DEFAULT NULL,
    seven_tools INT DEFAULT NULL,
    jigsaw INT DEFAULT NULL,
    yaotoshi INT DEFAULT NULL,
    status ENUM('Lulus', 'Gagal', 'Dalam Proses') DEFAULT 'Dalam Proses',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (npk) REFERENCES mp_data(npk) ON UPDATE CASCADE
);

-- Dashboard statistics table
CREATE TABLE IF NOT EXISTS dashboard_stats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    total_mp INT DEFAULT 0,
    total_peserta INT DEFAULT 0,
    total_lulus INT DEFAULT 0,
    total_gagal INT DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Training schedules table
CREATE TABLE IF NOT EXISTS training_schedules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    training_type ENUM('pre_test', 'post_test', 'seven_tools', 'jigsaw', 'yaotoshi') NOT NULL,
    batch_name VARCHAR(100) NOT NULL,
    scheduled_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    room VARCHAR(100) NOT NULL,
    trainer VARCHAR(100) NOT NULL,
    max_participants INT NOT NULL DEFAULT 20,
    description TEXT NULL,
    status ENUM('scheduled', 'ongoing', 'completed', 'cancelled') DEFAULT 'scheduled',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Schedule participants table
CREATE TABLE IF NOT EXISTS schedule_participants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    schedule_id INT NOT NULL,
    participant_npk VARCHAR(20) NOT NULL,
    attendance_status ENUM('present', 'absent', 'pending') DEFAULT 'pending',
    score INT NULL,
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (schedule_id) REFERENCES training_schedules(id) ON DELETE CASCADE,
    FOREIGN KEY (participant_npk) REFERENCES mp_data(npk) ON UPDATE CASCADE,
    UNIQUE KEY unique_schedule_participant (schedule_id, participant_npk)
);

-- Training batches table
CREATE TABLE IF NOT EXISTS training_batches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    section VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NULL,
    status ENUM('active', 'completed', 'cancelled') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);