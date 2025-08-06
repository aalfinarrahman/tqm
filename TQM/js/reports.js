// Check session on page load
document.addEventListener('DOMContentLoaded', function() {
    checkSession();
    loadReportStats();
    setupEventListeners();
});

// Check if user is logged in
function checkSession() {
    fetch('auth/check_session.php')
        .then(response => response.json())
        .then(data => {
            if (!data.success) {
                window.location.href = 'login.html';
                return;
            }
            
            // Update user info if elements exist
            const userNameElement = document.getElementById('userName');
            const userRoleElement = document.getElementById('userRole');
            
            if (userNameElement && data.user) {
                userNameElement.textContent = data.user.name;
            }
            if (userRoleElement && data.user) {
                userRoleElement.textContent = data.user.role;
            }
        })
        .catch(error => {
            console.error('Session check error:', error);
            window.location.href = 'login.html';
        });
}

// Setup event listeners
function setupEventListeners() {
    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', logout);
    
    // Generate report button
    document.getElementById('generateReport').addEventListener('click', generateReport);
    
    // Period change
    document.getElementById('period').addEventListener('change', handlePeriodChange);
    
    // Report type filter
    document.getElementById('reportType').addEventListener('change', filterReports);
}

// Load report statistics
function loadReportStats() {
    // Load MP count and calculate statistics
    fetch('api/mp_data.php')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const totalMP = data.data.length;
                document.getElementById('totalMPCount').textContent = totalMP;
                
                // Calculate MP status distribution
                const activeMP = data.data.filter(mp => mp.status === 'Aktif').length;
                const trainingMP = data.data.filter(mp => mp.status === 'Training').length;
                const inactiveMP = data.data.filter(mp => mp.status === 'Non-Aktif').length;
                
                // Store MP stats globally for reports
                window.mpStats = {
                    total: totalMP,
                    active: activeMP,
                    training: trainingMP,
                    inactive: inactiveMP,
                    activePercent: totalMP > 0 ? Math.round((activeMP / totalMP) * 100) : 0,
                    trainingPercent: totalMP > 0 ? Math.round((trainingMP / totalMP) * 100) : 0,
                    inactivePercent: totalMP > 0 ? Math.round((inactiveMP / totalMP) * 100) : 0
                };
            }
        })
        .catch(error => console.error('Error loading MP data:', error));
    
    // Load Peserta count and calculate statistics
    fetch('api/peserta_data.php')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const totalPeserta = data.data.length;
                document.getElementById('totalPesertaCount').textContent = totalPeserta;
                
                // Calculate success rate
                const lulusCount = data.data.filter(p => p.status === 'Lulus').length;
                const gagalCount = data.data.filter(p => p.status === 'Gagal').length;
                const successRate = totalPeserta > 0 ? Math.round((lulusCount / totalPeserta) * 100) : 0;
                
                document.getElementById('successRate').textContent = successRate;
                
                // Store Peserta stats globally for reports
                window.pesertaStats = {
                    total: totalPeserta,
                    lulus: lulusCount,
                    gagal: gagalCount,
                    successRate: successRate,
                    failRate: 100 - successRate
                };
                
                // Calculate training statistics from peserta data
                const uniqueTrainings = [...new Set(data.data.map(p => p.training_id))].filter(id => id);
                const completedTrainings = data.data.filter(p => p.status === 'Lulus').map(p => p.training_id);
                const uniqueCompletedTrainings = [...new Set(completedTrainings)].length;
                
                window.trainingStats = {
                    total: uniqueTrainings.length,
                    completed: uniqueCompletedTrainings,
                    ongoing: uniqueTrainings.length - uniqueCompletedTrainings
                };
                
                document.getElementById('totalTrainingCount').textContent = uniqueTrainings.length;
            }
        })
        .catch(error => console.error('Error loading Peserta data:', error));
}

// Handle period change
function handlePeriodChange() {
    const period = document.getElementById('period').value;
    const startDate = document.getElementById('startDate');
    const endDate = document.getElementById('endDate');
    
    if (period === 'custom') {
        startDate.style.display = 'block';
        endDate.style.display = 'block';
    } else {
        startDate.style.display = 'none';
        endDate.style.display = 'none';
        
        // Set dates based on period
        const today = new Date();
        const start = new Date();
        
        switch (period) {
            case 'today':
                start.setDate(today.getDate());
                break;
            case 'week':
                start.setDate(today.getDate() - 7);
                break;
            case 'month':
                start.setMonth(today.getMonth() - 1);
                break;
            case 'quarter':
                start.setMonth(today.getMonth() - 3);
                break;
            case 'year':
                start.setFullYear(today.getFullYear() - 1);
                break;
        }
        
        startDate.value = start.toISOString().split('T')[0];
        endDate.value = today.toISOString().split('T')[0];
    }
}

// Filter reports based on type
function filterReports() {
    const reportType = document.getElementById('reportType').value;
    const reportCards = document.querySelectorAll('.report-card');
    
    reportCards.forEach(card => {
        if (reportType === 'all' || card.dataset.type === reportType) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// Generate report
function generateReport() {
    const reportType = document.getElementById('reportType').value;
    const period = document.getElementById('period').value;
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    
    console.log('Generating report:', {
        type: reportType,
        period: period,
        startDate: startDate,
        endDate: endDate
    });
    
    // Show loading
    showNotification('Generating report...', 'info');
    
    // Simulate report generation
    setTimeout(() => {
        showNotification('Report generated successfully!', 'success');
    }, 2000);
}

// View report
function viewReport(type) {
    const previewSection = document.getElementById('previewSection');
    const previewTitle = document.getElementById('previewTitle');
    const previewContent = document.getElementById('previewContent');
    
    // Show preview section
    previewSection.style.display = 'block';
    previewTitle.textContent = `Preview Laporan ${type.charAt(0).toUpperCase() + type.slice(1)}`;
    
    // Show loading
    previewContent.innerHTML = '<div class="loading"><i class="fas fa-spinner"></i> Loading...</div>';
    
    // Simulate loading report data
    setTimeout(() => {
        let content = '';
        
        switch (type) {
            case 'mp':
                content = generateMPReportPreview();
                break;
            case 'peserta':
                content = generatePesertaReportPreview();
                break;
            case 'training':
                content = generateTrainingReportPreview();
                break;
            case 'performance':
                content = generatePerformanceReportPreview();
                break;
        }
        
        previewContent.innerHTML = content;
    }, 1500);
    
    // Scroll to preview
    previewSection.scrollIntoView({ behavior: 'smooth' });
}

// Generate MP report preview with real data
function generateMPReportPreview() {
    const stats = window.mpStats || { total: 0, activePercent: 0, trainingPercent: 0, inactivePercent: 0 };
    
    return `
        <div class="report-preview">
            <h4>Ringkasan Laporan MP</h4>
            <div class="row g-3 mb-3">
                <div class="col-md-3">
                    <div class="stat-box">
                        <h5>Total MP</h5>
                        <p class="stat-number">${stats.total}</p>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="stat-box">
                        <h5>Aktif</h5>
                        <p class="stat-number text-success">${stats.activePercent}%</p>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="stat-box">
                        <h5>Training</h5>
                        <p class="stat-number text-warning">${stats.trainingPercent}%</p>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="stat-box">
                        <h5>Non-Aktif</h5>
                        <p class="stat-number text-danger">${stats.inactivePercent}%</p>
                    </div>
                </div>
            </div>
            <p><em>Preview laporan MP menampilkan distribusi status dan departemen berdasarkan data real.</em></p>
        </div>
    `;
}

// Generate Peserta report preview with real data
function generatePesertaReportPreview() {
    const stats = window.pesertaStats || { total: 0, successRate: 0, failRate: 0 };
    
    return `
        <div class="report-preview">
            <h4>Ringkasan Laporan Peserta</h4>
            <div class="row g-3 mb-3">
                <div class="col-md-4">
                    <div class="stat-box">
                        <h5>Total Peserta</h5>
                        <p class="stat-number">${stats.total}</p>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="stat-box">
                        <h5>Lulus</h5>
                        <p class="stat-number text-success">${stats.successRate}%</p>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="stat-box">
                        <h5>Gagal</h5>
                        <p class="stat-number text-danger">${stats.failRate}%</p>
                    </div>
                </div>
            </div>
            <p><em>Preview laporan peserta menampilkan hasil evaluasi dan tingkat kelulusan berdasarkan data real.</em></p>
        </div>
    `;
}

// Generate Training report preview with real data
function generateTrainingReportPreview() {
    const stats = window.trainingStats || { total: 0, completed: 0, ongoing: 0 };
    
    return `
        <div class="report-preview">
            <h4>Ringkasan Laporan Training</h4>
            <div class="row g-3 mb-3">
                <div class="col-md-4">
                    <div class="stat-box">
                        <h5>Total Training</h5>
                        <p class="stat-number">${stats.total}</p>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="stat-box">
                        <h5>Selesai</h5>
                        <p class="stat-number text-success">${stats.completed}</p>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="stat-box">
                        <h5>Berlangsung</h5>
                        <p class="stat-number text-warning">${stats.ongoing}</p>
                    </div>
                </div>
            </div>
            <p><em>Preview laporan training menampilkan jadwal dan status pelaksanaan berdasarkan data real.</em></p>
        </div>
    `;
}

// Generate Performance report preview with real data
function generatePerformanceReportPreview() {
    const pesertaStats = window.pesertaStats || { successRate: 0 };
    const mpStats = window.mpStats || { total: 0, active: 0 };
    
    // Calculate satisfaction rate based on success rate and MP effectiveness
    const mpEffectiveness = mpStats.total > 0 ? Math.round((mpStats.active / mpStats.total) * 100) : 0;
    const satisfactionRate = Math.round((pesertaStats.successRate + mpEffectiveness) / 20); // Scale to 1-5
    
    return `
        <div class="report-preview">
            <h4>Ringkasan Laporan Performa</h4>
            <div class="row g-3 mb-3">
                <div class="col-md-6">
                    <div class="stat-box">
                        <h5>Efektivitas Program</h5>
                        <p class="stat-number text-success">${pesertaStats.successRate}%</p>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="stat-box">
                        <h5>Efektivitas MP</h5>
                        <p class="stat-number text-info">${mpEffectiveness}%</p>
                    </div>
                </div>
            </div>
            <p><em>Preview laporan performa menampilkan analisis efektivitas program TQM berdasarkan data real.</em></p>
        </div>
    `;
}

// Download report
function downloadReport(type) {
    showNotification(`Downloading ${type} report...`, 'info');
    
    // Simulate download
    setTimeout(() => {
        showNotification(`${type.charAt(0).toUpperCase() + type.slice(1)} report downloaded successfully!`, 'success');
    }, 2000);
}

// Close preview
function closePreview() {
    document.getElementById('previewSection').style.display = 'none';
}

// Logout function
function logout() {
    if (confirm('Apakah Anda yakin ingin logout?')) {
        fetch('auth/logout.php', {
            method: 'POST'
        })
        .then(() => {
            window.location.href = 'login.html';
        })
        .catch(error => {
            console.error('Logout error:', error);
            window.location.href = 'login.html';
        });
    }
}

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show position-fixed`;
    notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 3000);
}