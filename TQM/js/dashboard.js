// Check if user is logged in
function checkSession() {
    fetch('auth/check_session.php')
        .then(response => response.json())
        .then(data => {
            if (!data.success) {
                window.location.href = 'login.html';
                return;
            }
            
            // Update user info
            document.getElementById('userName').textContent = data.user.name;
            document.getElementById('userRole').textContent = data.user.role;
        })
        .catch(error => {
            console.error('Session check error:', error);
            window.location.href = 'login.html';
        });
}

// Load dashboard statistics
function loadStats() {
    fetch('api/dashboard_stats.php')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                document.getElementById('totalMP').textContent = data.stats.total_mp || 0;
                document.getElementById('totalPeserta').textContent = data.stats.total_peserta || 0;
                document.getElementById('totalLulus').textContent = data.stats.total_lulus || 0;
                document.getElementById('totalGagal').textContent = data.stats.total_gagal || 0;
            }
        })
        .catch(error => {
            console.error('Stats loading error:', error);
            // Set default values if API fails
            document.getElementById('totalMP').textContent = '0';
            document.getElementById('totalPeserta').textContent = '0';
            document.getElementById('totalLulus').textContent = '0';
            document.getElementById('totalGagal').textContent = '0';
        });
}

// Logout function
function logout() {
    if (confirm('Apakah Anda yakin ingin logout?')) {
        fetch('auth/logout.php', {
            method: 'POST'
        })
        .then(response => response.json())
        .then(data => {
            window.location.href = 'login.html';
        })
        .catch(error => {
            console.error('Logout error:', error);
            window.location.href = 'login.html';
        });
    }
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    checkSession();
    loadStats();
    
    // Logout button event
    document.getElementById('logoutBtn').addEventListener('click', logout);
    
    // Refresh stats every 30 seconds
    setInterval(loadStats, 30000);
});