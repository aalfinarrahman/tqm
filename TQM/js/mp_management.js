let currentPage = 1;
let totalPages = 1;
let currentEditId = null;
let currentLimit = 10; // Tambahkan variabel limit
let currentSortBy = 'created_at'; // Tambahkan variabel sorting
let currentSortOrder = 'DESC';

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

// Load MP data
function loadMPData(page = 1, search = '', section = '', grade = '') {
    const params = new URLSearchParams({
        page: page,
        search: search,
        section: section,
        grade: grade
    });
    
    fetch(`api/mp_data.php?${params}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displayMPData(data.data);
                updatePagination(data.pagination);
            } else {
                showError(data.message);
            }
        })
        .catch(error => {
            console.error('Error loading MP data:', error);
            showError('Gagal memuat data MP');
        });
}

// Load MP data dengan parameter tambahan
function loadMPData(page = 1, search = '', section = '', grade = '', limit = currentLimit, sortBy = currentSortBy, sortOrder = currentSortOrder) {
    const params = new URLSearchParams({
        page: page,
        search: search,
        section: section,
        grade: grade,
        limit: limit,
        sort_by: sortBy,
        sort_order: sortOrder
    });
    
    fetch(`api/mp_data.php?${params}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displayMPData(data.data);
                updatePagination(data.pagination);
                updatePaginationInfo(data.pagination);
                updateSortHeaders(sortBy, sortOrder);
            } else {
                showError(data.message);
            }
        })
        .catch(error => {
            console.error('Error loading MP data:', error);
            showError('Gagal memuat data MP');
        });
}

// Update pagination info
function updatePaginationInfo(pagination) {
    const start = ((pagination.current_page - 1) * currentLimit) + 1;
    const end = Math.min(pagination.current_page * currentLimit, pagination.total_records);
    const total = pagination.total_records;
    
    document.getElementById('paginationInfo').textContent = 
        `Menampilkan ${start}-${end} dari ${total} entri`;
}

// Update sort headers
function updateSortHeaders(sortBy, sortOrder) {
    // Reset semua header
    document.querySelectorAll('.sortable-header').forEach(header => {
        header.classList.remove('sort-asc', 'sort-desc');
    });
    
    // Set header yang aktif
    const activeHeader = document.querySelector(`[data-sort="${sortBy}"]`);
    if (activeHeader) {
        activeHeader.classList.add(sortOrder === 'ASC' ? 'sort-asc' : 'sort-desc');
    }
}

// Change entries per page
function changeEntriesPerPage() {
    currentLimit = parseInt(document.getElementById('entriesPerPage').value);
    currentPage = 1; // Reset ke halaman pertama
    loadMPData(currentPage, getSearchValue(), getSectionFilter(), getGradeFilter(), currentLimit, currentSortBy, currentSortOrder);
}

// Handle column sorting
function handleSort(column) {
    if (currentSortBy === column) {
        // Toggle order jika kolom sama
        currentSortOrder = currentSortOrder === 'ASC' ? 'DESC' : 'ASC';
    } else {
        // Set kolom baru dengan order ASC
        currentSortBy = column;
        currentSortOrder = 'ASC';
    }
    
    currentPage = 1; // Reset ke halaman pertama
    loadMPData(currentPage, getSearchValue(), getSectionFilter(), getGradeFilter(), currentLimit, currentSortBy, currentSortOrder);
}

// Update change page function
function changePage(page) {
    if (page >= 1 && page <= totalPages) {
        loadMPData(page, getSearchValue(), getSectionFilter(), getGradeFilter(), currentLimit, currentSortBy, currentSortOrder);
    }
}

// Display MP data in table
function displayMPData(data) {
    const tbody = document.getElementById('mpTableBody');
    
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="loading">Tidak ada data MP</td></tr>';
        return;
    }
    
    tbody.innerHTML = data.map(mp => `
        <tr>
            <td>${mp.npk}</td>
            <td>${mp.name}</td>
            <td>${mp.title}</td>
            <td>${mp.grade}</td>
            <td>${mp.section}</td>
            <td><span class="status-badge status-${mp.training_gc.toLowerCase()}">${mp.training_gc}</span></td>
            <td>${mp.batch || '-'}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-warning btn-sm" onclick="editMP(${mp.id})" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="deleteMP(${mp.id}, '${mp.name}')" title="Hapus">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
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
        loadMPData(page, getSearchValue(), getSectionFilter(), getGradeFilter());
    }
}

// Get current filter values
function getSearchValue() {
    return document.getElementById('searchInput').value;
}

function getSectionFilter() {
    return document.getElementById('sectionFilter').value;
}

function getGradeFilter() {
    return document.getElementById('gradeFilter').value;
}

// Show/Hide modal
function showModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}

function hideModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Add new MP
function addMP() {
    currentEditId = null;
    document.getElementById('modalTitle').textContent = 'Tambah MP';
    document.getElementById('mpForm').reset();
    showModal('mpModal');
}

// Edit MP
function editMP(id) {
    currentEditId = id;
    document.getElementById('modalTitle').textContent = 'Edit MP';
    
    // Fetch MP data
    fetch(`api/mp_data.php?id=${id}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const mp = data.data;
                document.getElementById('npk').value = mp.npk;
                document.getElementById('name').value = mp.name;
                document.getElementById('title').value = mp.title;
                document.getElementById('grade').value = mp.grade;
                document.getElementById('section').value = mp.section;
                document.getElementById('training_gc').value = mp.training_gc;
                document.getElementById('batch').value = mp.batch || '';
                showModal('mpModal');
            } else {
                showError(data.message);
            }
        })
        .catch(error => {
            console.error('Error fetching MP data:', error);
            showError('Gagal memuat data MP');
        });
}

// Delete MP
function deleteMP(id, name) {
    currentEditId = id;
    document.getElementById('deleteItemName').textContent = name;
    showModal('deleteModal');
}

// Save MP
function saveMP(formData) {
    const url = currentEditId ? 'api/mp_data.php' : 'api/mp_data.php';
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
            hideModal('mpModal');
            loadMPData(currentPage, getSearchValue(), getSectionFilter(), getGradeFilter());
            showSuccess(data.message);
        } else {
            showError(data.message);
        }
    })
    .catch(error => {
        console.error('Error saving MP:', error);
        showError('Gagal menyimpan data MP');
    });
}

// Confirm delete
function confirmDelete() {
    fetch('api/mp_data.php', {
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
            loadMPData(currentPage, getSearchValue(), getSectionFilter(), getGradeFilter());
            showSuccess(data.message);
        } else {
            showError(data.message);
        }
    })
    .catch(error => {
        console.error('Error deleting MP:', error);
        showError('Gagal menghapus data MP');
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
    loadMPData();
    
    // Event listeners - perbaiki referensi elemen
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
    
    // Hapus baris ini karena addMPBtn tidak ada di HTML
    // document.getElementById('addMPBtn').addEventListener('click', addMP);
    
    // Search and filter
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            loadMPData(1, getSearchValue(), getSectionFilter(), getGradeFilter());
        });
    }
    
    const sectionFilter = document.getElementById('sectionFilter');
    if (sectionFilter) {
        sectionFilter.addEventListener('change', () => {
            loadMPData(1, getSearchValue(), getSectionFilter(), getGradeFilter());
        });
    }
    
    const gradeFilter = document.getElementById('gradeFilter');
    if (gradeFilter) {
        gradeFilter.addEventListener('change', () => {
            loadMPData(1, getSearchValue(), getSectionFilter(), getGradeFilter());
        });
    }
    
    // Modal events
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) {
                modal.style.display = 'none';
            }
        });
    });
    
    // Form submit
    const mpForm = document.getElementById('mpForm');
    if (mpForm) {
        mpForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const formData = new FormData(this);
            saveMP(formData);
        });
    }
    
    // Cancel buttons
    const cancelBtn = document.getElementById('cancelBtn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            hideModal('mpModal');
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
    
    // Click outside modal to close
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    });
});

// Tambahkan fungsi yang hilang untuk modal
function openMpModal() {
    currentEditId = null;
    document.getElementById('modalTitle').textContent = 'Tambah MP';
    document.getElementById('mpForm').reset();
    showModal('mpModal');
}

function openImportModal() {
    const importModal = document.getElementById('importModal');
    if (importModal) {
        importModal.style.display = 'block';
        const excelFile = document.getElementById('excelFile');
        if (excelFile) {
            excelFile.value = '';
        }
    }
}

function closeImportModal() {
    const importModal = document.getElementById('importModal');
    if (importModal) {
        importModal.style.display = 'none';
    }
}

// Export to Excel
function exportToExcel() {
    if (confirm('Apakah Anda yakin ingin mengekspor semua data MP ke Excel?')) {
        window.location.href = 'api/mp_excel.php?action=export';
    }
}

// Import from Excel
// Load filter options from database
function loadFilterOptions() {
    fetch('api/mp_filters.php')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                populateFilterOptions(data.data);
            } else {
                console.error('Failed to load filter options:', data.message);
            }
        })
        .catch(error => {
            console.error('Error loading filter options:', error);
        });
}

// Populate filter dropdowns with real data
function populateFilterOptions(filterData) {
    // Populate section filter
    const sectionFilter = document.getElementById('sectionFilter');
    const currentSectionValue = sectionFilter.value; // Preserve current selection
    
    // Clear existing options except "Semua Section"
    sectionFilter.innerHTML = '<option value="">Semua Section</option>';
    
    // Add sections from database
    filterData.sections.forEach(section => {
        const option = document.createElement('option');
        option.value = section;
        option.textContent = section;
        if (section === currentSectionValue) {
            option.selected = true;
        }
        sectionFilter.appendChild(option);
    });
    
    // Populate grade filter
    const gradeFilter = document.getElementById('gradeFilter');
    const currentGradeValue = gradeFilter.value; // Preserve current selection
    
    // Clear existing options except "Semua Grade"
    gradeFilter.innerHTML = '<option value="">Semua Grade</option>';
    
    // Add grades from database
    filterData.grades.forEach(grade => {
        const option = document.createElement('option');
        option.value = grade;
        option.textContent = grade;
        if (grade === currentGradeValue) {
            option.selected = true;
        }
        gradeFilter.appendChild(option);
    });
}

// Refresh filter options (useful after data import)
function refreshFilterOptions() {
    loadFilterOptions();
}

// Update DOMContentLoaded event
document.addEventListener('DOMContentLoaded', function() {
    checkSession();
    loadFilterOptions(); // Load filter options first
    loadMPData(); // Then load data
    
    // Refresh filters when search/filter changes
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            loadMPData(1, this.value, getSectionFilter(), getGradeFilter(), currentLimit, currentSortBy, currentSortOrder);
        });
    }
    
    const sectionFilter = document.getElementById('sectionFilter');
    if (sectionFilter) {
        sectionFilter.addEventListener('change', function() {
            loadMPData(1, getSearchValue(), this.value, getGradeFilter(), currentLimit, currentSortBy, currentSortOrder);
        });
    }
    
    const gradeFilter = document.getElementById('gradeFilter');
    if (gradeFilter) {
        gradeFilter.addEventListener('change', function() {
            loadMPData(1, getSearchValue(), getSectionFilter(), this.value, currentLimit, currentSortBy, currentSortOrder);
        });
    }
    
    // Modal events
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) {
                modal.style.display = 'none';
            }
        });
    });
    
    // Form submit
    const mpForm = document.getElementById('mpForm');
    if (mpForm) {
        mpForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const formData = new FormData(this);
            saveMP(formData);
        });
    }
    
    // Cancel buttons
    const cancelBtn = document.getElementById('cancelBtn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            hideModal('mpModal');
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
    
    // Click outside modal to close
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    });
});

// Update import success function to refresh filters
function importFromExcel() {
    const fileInput = document.getElementById('excelFile');
    const file = fileInput.files[0];
    
    if (!file) {
        showError('Pilih file terlebih dahulu');
        return;
    }
    
    const formData = new FormData();
    formData.append('excel_file', file);
    
    const importBtn = document.querySelector('#importModal .btn-primary');
    const originalText = importBtn.textContent;
    importBtn.textContent = 'Mengimpor...';
    importBtn.disabled = true;
    
    fetch('api/mp_excel.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showSuccess(`Import berhasil. ${data.imported} data berhasil diimport.`);
            loadMPData(); // Reload data
            refreshFilterOptions(); // Refresh filter options with new data
            closeImportModal();
            fileInput.value = '';
        } else {
            showError(`Import gagal: ${data.message}`);
        }
    })
    .catch(error => {
        console.error('Import error:', error);
        showError('Terjadi kesalahan saat mengimpor data');
    })
    .finally(() => {
        importBtn.textContent = originalText;
        importBtn.disabled = false;
    });
}

// Download Template
function downloadTemplate() {
    const csvContent = "NPK,Nama,Title,Grade,Section,Training GC,Batch\n" +
                      "12345,John Doe,Operator,A,Production,Belum,Batch 1\n" +
                      "67890,Jane Smith,Supervisor,B,Quality,Sudah,Batch 2";
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template_import_mp.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}