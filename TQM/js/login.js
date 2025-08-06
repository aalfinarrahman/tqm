// Login functionality
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const loginBtn = document.getElementById('loginBtn');
    const errorAlert = document.getElementById('errorAlert');
    const errorMessage = document.getElementById('errorMessage');
    
    loginForm.addEventListener('submit', handleLogin);
});

function handleLogin(e) {
    e.preventDefault();
    
    const npk = document.getElementById('npk').value;
    const password = document.getElementById('password').value;
    const remember = document.getElementById('remember').checked;
    const loginBtn = document.getElementById('loginBtn');
    
    // Validation
    if (!npk || !password) {
        showError('NPK dan password harus diisi!');
        return;
    }
    
    // Show loading
    setLoading(true);
    hideError();
    
    // Prepare data
    const formData = new FormData();
    formData.append('npk', npk);
    formData.append('password', password);
    formData.append('remember', remember ? '1' : '0');
    
    // Send login request
    fetch('auth/login.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        setLoading(false);
        
        if (data.success) {
            // Login successful
            showSuccess('Login berhasil! Mengalihkan...');
            
            // Redirect after 1 second
            setTimeout(() => {
                window.location.href = data.redirect || 'dashboard.html';
            }, 1000);
        } else {
            // Login failed
            showError(data.message || 'Login gagal!');
        }
    })
    .catch(error => {
        setLoading(false);
        console.error('Error:', error);
        showError('Terjadi kesalahan sistem!');
    });
}

function togglePassword() {
    const passwordInput = document.getElementById('password');
    const passwordIcon = document.getElementById('passwordIcon');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        passwordIcon.className = 'fas fa-eye-slash';
    } else {
        passwordInput.type = 'password';
        passwordIcon.className = 'fas fa-eye';
    }
}

function setLoading(loading) {
    const loginBtn = document.getElementById('loginBtn');
    
    if (loading) {
        loginBtn.disabled = true;
        loginBtn.innerHTML = '<div class="loading"></div> Memproses...';
    } else {
        loginBtn.disabled = false;
        loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Masuk';
    }
}

function showError(message) {
    const errorAlert = document.getElementById('errorAlert');
    const errorMessage = document.getElementById('errorMessage');
    
    errorMessage.textContent = message;
    errorAlert.classList.remove('d-none');
    
    // Auto hide after 5 seconds
    setTimeout(hideError, 5000);
}

function hideError() {
    const errorAlert = document.getElementById('errorAlert');
    errorAlert.classList.add('d-none');
}

function showSuccess(message) {
    const errorAlert = document.getElementById('errorAlert');
    const errorMessage = document.getElementById('errorMessage');
    
    errorAlert.className = 'alert alert-success';
    errorMessage.innerHTML = '<i class="fas fa-check-circle"></i> ' + message;
    errorAlert.classList.remove('d-none');
}

// Auto focus on NPK field
window.addEventListener('load', function() {
    document.getElementById('npk').focus();
});

// Enter key handling
document.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        const loginForm = document.getElementById('loginForm');
        loginForm.dispatchEvent(new Event('submit'));
    }
});