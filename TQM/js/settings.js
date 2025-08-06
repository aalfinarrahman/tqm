// Settings page functionality
let currentEditId = null;
let currentDeleteId = null;

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    loadUsers();
    setupEventListeners();
    checkSession();
});

function setupEventListeners() {
    // Add user form
    document.getElementById('addUserForm').addEventListener('submit', handleAddUser);
    
    // Edit user form
    document.getElementById('editUserForm').addEventListener('submit', handleEditUser);
    
    // Search functionality
    document.getElementById('searchUser').addEventListener('input', handleSearch);
    
    // Modal close buttons
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            this.closest('.modal').style.display = 'none';
        });
    });
    
    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', logout);
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    });
}

// Check session and load user info
function checkSession() {
    fetch('auth/check_session.php')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                document.getElementById('userName').textContent = data.user.name;
                // Only allow admin to access settings
                if (data.user.role !== 'admin') {
                    alert('Access denied. Only admin can access settings.');
                    window.location.href = 'dashboard.html';
                }
            } else {
                window.location.href = 'login.html';
            }
        })
        .catch(error => {
            console.error('Session check error:', error);
            window.location.href = 'login.html';
        });
}

// Load users from database
function loadUsers() {
    fetch('api/users_data.php')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displayUsers(data.users);
            } else {
                showError('Failed to load users: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Load users error:', error);
            showError('Failed to load users');
        });
}

// Display users in table
function displayUsers(users) {
    const tbody = document.getElementById('usersTableBody');
    
    if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="loading">No users found</td></tr>';
        return;
    }
    
    tbody.innerHTML = users.map(user => `
        <tr>
            <td>${user.npk}</td>
            <td>${user.name}</td>
            <td><span class="role-badge role-${user.role}">${user.role}</span></td>
            <td><span class="status-badge status-${user.status}">${user.status}</span></td>
            <td>${formatDate(user.created_at)}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-warning btn-sm" onclick="editUser(${user.id})">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="deleteUser(${user.id}, '${user.name}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Handle add user form submission
function handleAddUser(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    
    fetch('api/users_data.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showSuccess('User added successfully');
            event.target.reset();
            loadUsers();
        } else {
            showError('Failed to add user: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Add user error:', error);
        showError('Failed to add user');
    });
}

// Edit user
function editUser(id) {
    fetch(`api/users_data.php?id=${id}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const user = data.user;
                document.getElementById('editUserId').value = user.id;
                document.getElementById('editNpk').value = user.npk;
                document.getElementById('editName').value = user.name;
                document.getElementById('editRole').value = user.role;
                document.getElementById('editStatus').value = user.status;
                document.getElementById('editPassword').value = '';
                
                document.getElementById('editUserModal').style.display = 'block';
                currentEditId = id;
            } else {
                showError('Failed to load user data');
            }
        })
        .catch(error => {
            console.error('Load user error:', error);
            showError('Failed to load user data');
        });
}

// Handle edit user form submission
function handleEditUser(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    formData.append('action', 'update');
    
    fetch('api/users_data.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showSuccess('User updated successfully');
            closeEditModal();
            loadUsers();
        } else {
            showError('Failed to update user: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Update user error:', error);
        showError('Failed to update user');
    });
}

// Delete user
function deleteUser(id, name) {
    currentDeleteId = id;
    document.getElementById('deleteUserName').textContent = name;
    document.getElementById('deleteModal').style.display = 'block';
}

// Confirm delete
function confirmDelete() {
    if (!currentDeleteId) return;
    
    const formData = new FormData();
    formData.append('action', 'delete');
    formData.append('id', currentDeleteId);
    
    fetch('api/users_data.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showSuccess('User deleted successfully');
            closeDeleteModal();
            loadUsers();
        } else {
            showError('Failed to delete user: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Delete user error:', error);
        showError('Failed to delete user');
    });
}

// Search functionality
function handleSearch(event) {
    const searchTerm = event.target.value.toLowerCase();
    const rows = document.querySelectorAll('#usersTableBody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

// Modal functions
function closeEditModal() {
    document.getElementById('editUserModal').style.display = 'none';
    currentEditId = null;
}

function closeDeleteModal() {
    document.getElementById('deleteModal').style.display = 'none';
    currentDeleteId = null;
}

// Utility functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function showSuccess(message) {
    alert('Success: ' + message);
}

function showError(message) {
    alert('Error: ' + message);
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        fetch('auth/logout.php', { method: 'POST' })
            .then(() => {
                window.location.href = 'login.html';
            })
            .catch(error => {
                console.error('Logout error:', error);
                window.location.href = 'login.html';
            });
    }
}