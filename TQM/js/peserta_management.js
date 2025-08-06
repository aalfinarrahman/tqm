let currentPage = 1;
let totalPages = 1;
let currentEditId = null;
let npkSearchTimeout;
let selectedMpData = null;

// Check session on page load
function checkSession() {
    fetch('auth/check_session.php')
        .then(response => response.json())
        .then(data => {
            if (!data.success) {
                window.location.href = 'login.html';
                return;
            }
            document.getElementById('userName').textContent = data.user.name;
        })
        .catch(error => {
            console.error('Session check error:', error);
            window.location.href = 'login.html';
        });
}

// Load Peserta data
function loadPesertaData(page = 1, search = '', section = '', status = '') {
    const params = new URLSearchParams({
        page: page,
        search: search,
        section: section,
        status: status
    });
    
    fetch(`api/peserta_data.php?${params}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displayPesertaData(data.data);
                updatePagination(data.pagination);
            } else {
                showError(data.message);
            }
        })
        .catch(error => {
            console.error('Error loading Peserta data:', error);
            showError('Gagal memuat data peserta');
        });
}

// Display Peserta data in table
function displayPesertaData(data) {
    const tbody = document.getElementById('pesertaTableBody');
    
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="15" class="no-data">Tidak ada data peserta</td></tr>';
        return;
    }
    
    tbody.innerHTML = data.map(peserta => {
        const tanggalFormatted = new Date(peserta.tanggal).toLocaleDateString('id-ID');
        return `
            <tr>
                <td>${tanggalFormatted}</td>
                <td>${peserta.npk}</td>
                <td>${peserta.name}</td>
                <td>${peserta.title}</td>
                <td>${peserta.grade}</td>
                <td>${peserta.section}</td>
                <td><span class="badge ${peserta.training_gc === 'Sudah' ? 'badge-success' : 'badge-warning'}">${peserta.training_gc}</span></td>
                <td>${peserta.batch || '-'}</td>
                <td>${peserta.pre_test || '-'}</td>
                <td>${peserta.post_test || '-'}</td>
                <td>${peserta.seven_tools || '-'}</td>
                <td>${peserta.jigsaw || '-'}</td>
                <td>${peserta.yaotoshi || '-'}</td>
                <td><span class="badge ${getStatusBadgeClass(peserta.status)}">${peserta.status}</span></td>
                <td>
                    <button class="btn btn-sm btn-warning" onclick="editPeserta(${peserta.id})">Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="deletePeserta(${peserta.id})">Hapus</button>
                </td>
            </tr>
        `;
    }).join('');
}

// Set default tanggal ke hari ini
document.addEventListener('DOMContentLoaded', function() {
    // Set default tanggal ke hari ini
    const today = new Date().toISOString().split('T')[0];
    const tanggalInput = document.getElementById('tanggal');
    if (tanggalInput) {
        tanggalInput.value = today;
    }
});

// Format score display
function formatScore(score) {
    if (score === null || score === undefined || score === '') {
        return '<span class="score score-empty">-</span>';
    }
    
    const numScore = parseInt(score);
    let className = 'score-low';
    
    if (numScore >= 80) className = 'score-high';
    else if (numScore >= 60) className = 'score-medium';
    
    return `<span class="score ${className}">${numScore}</span>`;
}

// Add this new function
function getScoreClass(score) {
    if (score === null || score === undefined || score === '') {
        return 'score-empty';
    }
    
    const numScore = parseInt(score);
    
    if (numScore >= 80) return 'score-high';
    else if (numScore >= 60) return 'score-medium';
    else return 'score-low';
}

// Update pagination
function updatePagination(pagination) {
    currentPage = pagination.current_page;
    totalPages = pagination.total_pages;
    
    const paginationDiv = document.getElementById('pagination');
    let paginationHTML = '';
    
    // Previous button
    paginationHTML += `<button ${currentPage === 1 ? 'disabled' : ''} onclick="changePage(${currentPage - 1})">‹ Prev</button>`;
    
    // Page numbers
    for (let i = Math.max(1, currentPage - 2); i <= Math.min(totalPages, currentPage + 2); i++) {
        paginationHTML += `<button class="${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">${i}</button>`;
    }
    
    // Next button
    paginationHTML += `<button ${currentPage === totalPages ? 'disabled' : ''} onclick="changePage(${currentPage + 1})">Next ›</button>`;
    
    paginationDiv.innerHTML = paginationHTML;
}

// Change page
function changePage(page) {
    if (page >= 1 && page <= totalPages) {
        loadPesertaData(page, getSearchValue(), getSectionFilter(), getStatusFilter());
    }
}

// Get current filter values
function getSearchValue() {
    return document.getElementById('searchInput').value;
}

function getSectionFilter() {
    return document.getElementById('sectionFilter').value;
}

function getStatusFilter() {
    return document.getElementById('statusFilter').value;
}

// Show/Hide modal
function showModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}

function hideModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Add new Peserta
function addPeserta() {
    currentEditId = null;
    document.getElementById('modalTitle').textContent = 'Tambah Peserta';
    document.getElementById('pesertaForm').reset();
    
    // Enable NPK field for new entries
    const npkField = document.getElementById('npk');
    if (npkField) npkField.readOnly = false;
    
    // Clear auto-fill fields but keep them enabled
    clearAutoFillFields();
    
    const nameField = document.getElementById('name');
    const titleField = document.getElementById('title');
    const gradeField = document.getElementById('grade');
    const sectionField = document.getElementById('section');
    
    // Remove readonly/disabled attributes so data can be submitted
    if (nameField) {
        nameField.readOnly = false;
        nameField.style.backgroundColor = '#f8f9fa';
        nameField.style.color = '#6c757d';
    }
    if (titleField) {
        titleField.readOnly = false;
        titleField.style.backgroundColor = '#f8f9fa';
        titleField.style.color = '#6c757d';
    }
    if (gradeField) {
        gradeField.disabled = false;
        gradeField.style.backgroundColor = '#f8f9fa';
        gradeField.style.color = '#6c757d';
    }
    if (sectionField) {
        sectionField.disabled = false;
        sectionField.style.backgroundColor = '#f8f9fa';
        sectionField.style.color = '#6c757d';
    }
    
    showModal('pesertaModal');
}

// Edit Peserta
function editPeserta(id) {
    currentEditId = id;
    document.getElementById('modalTitle').textContent = 'Edit Peserta';
    
    // Fetch Peserta data
    fetch(`api/peserta_data.php?id=${id}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const peserta = data.data;
                
                // Disable NPK field for editing
                document.getElementById('npk').readOnly = true;
                document.getElementById('npk').value = peserta.npk;
                
                // Enable all fields for editing
                document.getElementById('name').readOnly = false;
                document.getElementById('title').readOnly = false;
                document.getElementById('grade').disabled = false;
                document.getElementById('section').disabled = false;
                
                // Fill all form fields
                document.getElementById('name').value = peserta.name;
                document.getElementById('title').value = peserta.title;
                document.getElementById('grade').value = peserta.grade;
                document.getElementById('section').value = peserta.section;
                document.getElementById('training_gc').value = peserta.training_gc;
                document.getElementById('batch').value = peserta.batch || '';
                document.getElementById('status').value = peserta.status;
                document.getElementById('pre_test').value = peserta.pre_test || '';
                document.getElementById('post_test').value = peserta.post_test || '';
                document.getElementById('seven_tools').value = peserta.seven_tools || '';
                document.getElementById('jigsaw').value = peserta.jigsaw || '';
                document.getElementById('yaotoshi').value = peserta.yaotoshi || '';
                
                showModal('pesertaModal');
            } else {
                showError(data.message);
            }
        })
        .catch(error => {
            console.error('Error fetching Peserta data:', error);
            showError('Gagal memuat data peserta');
        });
}

// Delete Peserta
function deletePeserta(id, name) {
    currentEditId = id;
    document.getElementById('deleteItemName').textContent = name;
    showModal('deleteModal');
}

// Save Peserta
function savePeserta(formData) {
    const url = 'api/peserta_data.php';
    const method = currentEditId ? 'PUT' : 'POST';
    
    if (currentEditId) {
        formData.append('id', currentEditId);
    }
    
    fetch(url, {
        method: method,
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            hideModal('pesertaModal');
            // Perbaikan: Untuk data baru, kembali ke halaman 1
            // Untuk edit, tetap di halaman saat ini
            const targetPage = currentEditId ? currentPage : 1;
            currentPage = targetPage; // Update currentPage
            loadPesertaData(targetPage, getSearchValue(), getSectionFilter(), getStatusFilter());
            showSuccess(data.message);
            // Reset currentEditId setelah berhasil
            currentEditId = null;
        } else {
            showError(data.message);
        }
    })
    .catch(error => {
        console.error('Error saving Peserta:', error);
        showError('Gagal menyimpan data peserta');
    });
}

// Confirm delete
function confirmDelete() {
    fetch('api/peserta_data.php', {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: currentEditId })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            hideModal('deleteModal');
            loadPesertaData(currentPage, getSearchValue(), getSectionFilter(), getStatusFilter());
            showSuccess(data.message);
        } else {
            showError(data.message);
        }
    })
    .catch(error => {
        console.error('Error deleting Peserta:', error);
        showError('Gagal menghapus data peserta');
    });
}

// Show success message
function showSuccess(message) {
    alert('✅ ' + message);
}

// Show error message
function showError(message) {
    alert('❌ ' + message);
}

// Logout
function logout() {
    if (confirm('Apakah Anda yakin ingin logout?')) {
        fetch('auth/logout.php', { method: 'POST' })
            .then(() => window.location.href = 'login.html')
            .catch(() => window.location.href = 'login.html');
    }
}

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    checkSession();
    loadPesertaData();
    
    // Setup NPK search functionality
    setupNpkSearch();
    
    // Event listeners
    const backBtn = document.getElementById('backBtn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            window.location.href = 'dashboard.html';
        });
    }
    
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
    
    const addPesertaBtn = document.getElementById('addPesertaBtn');
    if (addPesertaBtn) {
        addPesertaBtn.addEventListener('click', addPeserta);
    }
    
    // Search and filter
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            loadPesertaData(1, getSearchValue(), getSectionFilter(), getStatusFilter());
        });
    }
    
    const sectionFilter = document.getElementById('sectionFilter');
    if (sectionFilter) {
        sectionFilter.addEventListener('change', () => {
            loadPesertaData(1, getSearchValue(), getSectionFilter(), getStatusFilter());
        });
    }
    
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', () => {
            loadPesertaData(1, getSearchValue(), getSectionFilter(), getStatusFilter());
        });
    }
    
    // Modal events
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            if (modal) modal.style.display = 'none';
        });
    });
    
    const cancelBtn = document.getElementById('cancelBtn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            hideModal('pesertaModal');
        });
    }
    
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener('click', () => {
            hideModal('deleteModal');
        });
    }
    
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', confirmDelete);
    }
    
    // Form submission
    const pesertaForm = document.getElementById('pesertaForm');
    if (pesertaForm) {
        pesertaForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const formData = new FormData(this);
            savePeserta(formData);
        });
    }
    
    // Modal click outside to close
    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });
});

// Clear auto-fill fields
function clearAutoFillFields() {
    selectedMpData = null;
    document.getElementById('name').value = '';
    document.getElementById('title').value = '';
    document.getElementById('grade').value = '';
    document.getElementById('section').value = '';
    
    // Reset styling
    const nameField = document.getElementById('name');
    const titleField = document.getElementById('title');
    const gradeField = document.getElementById('grade');
    const sectionField = document.getElementById('section');
    
    if (nameField) {
        nameField.style.backgroundColor = '#f8f9fa';
        nameField.style.color = '#6c757d';
    }
    if (titleField) {
        titleField.style.backgroundColor = '#f8f9fa';
        titleField.style.color = '#6c757d';
    }
    if (gradeField) {
        gradeField.style.backgroundColor = '#f8f9fa';
        gradeField.style.color = '#6c757d';
    }
    if (sectionField) {
        sectionField.style.backgroundColor = '#f8f9fa';
        sectionField.style.color = '#6c757d';
    }
}

// Setup NPK search functionality
function setupNpkSearch() {
    const npkInput = document.getElementById('npk');
    const npkDropdown = document.getElementById('npkDropdown');
    
    if (!npkInput || !npkDropdown) return;
    
    npkInput.addEventListener('input', function() {
        clearTimeout(npkSearchTimeout);
        const query = this.value.trim();
        
        if (query.length < 2) {
            hideNpkDropdown();
            clearAutoFillFields();
            return;
        }
        
        npkSearchTimeout = setTimeout(() => {
            searchMpData(query);
        }, 300);
    });
    
    npkInput.addEventListener('focus', function() {
        if (this.value.length >= 2) {
            searchMpData(this.value.trim());
        }
    });
    
    // Prevent editing auto-filled fields when they come from NPK selection
    const autoFillFields = ['name', 'title', 'grade', 'section'];
    autoFillFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.addEventListener('focus', function() {
                if (selectedMpData && !currentEditId) {
                    this.blur();
                    showError('Field ini diisi otomatis dari data MP. Pilih NPK yang berbeda jika ingin mengubah.');
                }
            });
        }
    });
    
    // Hide dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.npk-search-container')) {
            hideNpkDropdown();
        }
    });
}

// Search MP data for NPK auto-complete
function searchMpData(query) {
    fetch(`api/mp_data.php?search=${encodeURIComponent(query)}&limit=10`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showNpkDropdown(data.data);
            } else {
                hideNpkDropdown();
            }
        })
        .catch(error => {
            console.error('Error searching MP data:', error);
            hideNpkDropdown();
        });
}

// Show NPK dropdown with search results
function showNpkDropdown(mpData) {
    const dropdown = document.getElementById('npkDropdown');
    if (!dropdown) return;
    
    if (mpData.length === 0) {
        dropdown.innerHTML = '<div class="npk-dropdown-item">Tidak ada data ditemukan</div>';
    } else {
        dropdown.innerHTML = mpData.map(mp => `
            <div class="npk-dropdown-item" onclick="selectMpData('${mp.npk}', '${mp.name}', '${mp.title}', '${mp.grade}', '${mp.section}')">
                <div class="npk">${mp.npk}</div>
                <div class="name">${mp.name}</div>
                <div class="details">${mp.title} - ${mp.section} (Grade ${mp.grade})</div>
            </div>
        `).join('');
    }
    
    dropdown.style.display = 'block';
}

// Hide NPK dropdown
function hideNpkDropdown() {
    const dropdown = document.getElementById('npkDropdown');
    if (dropdown) {
        dropdown.style.display = 'none';
    }
}

// Select MP data and auto-fill form
function selectMpData(npk, name, title, grade, section) {
    selectedMpData = { npk, name, title, grade, section };
    
    // Fill form fields
    document.getElementById('npk').value = npk;
    document.getElementById('name').value = name;
    document.getElementById('title').value = title;
    
    // Handle grade - add option if not exists
    const gradeField = document.getElementById('grade');
    if (gradeField) {
        // Check if grade option exists
        let gradeExists = false;
        for (let option of gradeField.options) {
            if (option.value === grade) {
                gradeExists = true;
                break;
            }
        }
        // Add option if doesn't exist
        if (!gradeExists && grade) {
            const newOption = new Option(`Grade ${grade}`, grade);
            gradeField.add(newOption);
        }
        gradeField.value = grade;
        gradeField.disabled = false;
        gradeField.style.backgroundColor = '#e9ecef';
        gradeField.style.color = '#495057';
    }
    
    // Handle section - add option if not exists
    const sectionField = document.getElementById('section');
    if (sectionField) {
        // Check if section option exists
        let sectionExists = false;
        for (let option of sectionField.options) {
            if (option.value === section) {
                sectionExists = true;
                break;
            }
        }
        // Add option if doesn't exist
        if (!sectionExists && section) {
            const newOption = new Option(section, section);
            sectionField.add(newOption);
        }
        sectionField.value = section;
        sectionField.disabled = false;
        sectionField.style.backgroundColor = '#e9ecef';
        sectionField.style.color = '#495057';
    }
    
    // Keep other fields enabled but styled as readonly
    const nameField = document.getElementById('name');
    const titleField = document.getElementById('title');
    
    if (nameField) {
        nameField.readOnly = false;
        nameField.style.backgroundColor = '#e9ecef';
        nameField.style.color = '#495057';
    }
    if (titleField) {
        titleField.readOnly = false;
        titleField.style.backgroundColor = '#e9ecef';
        titleField.style.color = '#495057';
    }
    
    hideNpkDropdown();
}

// Enhanced date formatting function
function formatDate(dateString) {
    if (!dateString) return '-';
    
    const date = new Date(dateString);
    const months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = months[date.getMonth()];
    const year = date.getFullYear().toString().slice(-2);
    
    return `${day} ${month} ${year}`;
}

// Update displayPesertaData function
function displayPesertaData(data) {
    const tbody = document.getElementById('pesertaTableBody');
    
    if (!data || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="15" class="loading">Tidak ada data peserta</td></tr>';
        return;
    }
    
    tbody.innerHTML = data.map(peserta => `
        <tr>
            <td><span class="date-cell">${formatDate(peserta.tanggal)}</span></td>
            <td><strong>${peserta.npk || '-'}</strong></td>
            <td>${peserta.nama || '-'}</td>
            <td>${peserta.title || '-'}</td>
            <td><span class="badge badge-secondary">${peserta.grade || '-'}</span></td>
            <td>${peserta.section || '-'}</td>
            <td>${peserta.training_gc || '-'}</td>
            <td><span class="badge badge-info">${peserta.batch || '-'}</span></td>
            <td><span class="score ${getScoreClass(peserta.pre_test)}">${peserta.pre_test || '-'}</span></td>
            <td><span class="score ${getScoreClass(peserta.post_test)}">${peserta.post_test || '-'}</span></td>
            <td><span class="score ${getScoreClass(peserta.tools_7)}">${peserta.tools_7 || '-'}</span></td>
            <td><span class="score ${getScoreClass(peserta.jigsaw)}">${peserta.jigsaw || '-'}</span></td>
            <td><span class="score ${getScoreClass(peserta.yaotoshi)}">${peserta.yaotoshi || '-'}</span></td>
            <td><span class="status-badge status-${(peserta.status || 'dalam-proses').toLowerCase().replace(' ', '-')}">${peserta.status || 'Dalam Proses'}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-warning btn-sm" onclick="editPeserta(${peserta.id})" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="deletePeserta(${peserta.id})" title="Hapus">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Set default date to today in Indonesian format
document.addEventListener('DOMContentLoaded', function() {
    // ... existing code ...
    
    // Set default date
    const dateInput = document.getElementById('tanggal');
    if (dateInput) {
        const today = new Date();
        const formattedDate = today.toISOString().split('T')[0];
        dateInput.value = formattedDate;
    }
});