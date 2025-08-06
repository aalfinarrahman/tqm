// Schedule Management JavaScript

let currentDate = new Date();
let currentView = 'calendar';
let scheduleData = [];
let currentEditId = null;

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    checkSession();
    initializeEventListeners();
    loadScheduleData();
    renderCalendar();
    loadTodaySchedule();
    setDefaultDate();
});

// Check session
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

// Initialize event listeners
function initializeEventListeners() {
    // Modal close buttons
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            this.closest('.modal').style.display = 'none';
        });
    });
    
    // Modal background click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.style.display = 'none';
            }
        });
    });
    
    // Form submissions
    document.getElementById('scheduleForm').addEventListener('submit', handleScheduleSubmit);
    document.getElementById('batchForm').addEventListener('submit', handleBatchSubmit);
    
    // Cancel buttons
    document.getElementById('cancelScheduleBtn').addEventListener('click', function() {
        document.getElementById('scheduleModal').style.display = 'none';
    });
    
    // Logout
    document.getElementById('logoutBtn').addEventListener('click', logout);
    
    // Participant search
    document.getElementById('participantSearch').addEventListener('input', function() {
        filterParticipants(this.value);
    });
}

// Set default date to today
function setDefaultDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('scheduleDate').value = today;
}

// Switch between calendar and list view
function switchView(view) {
    currentView = view;
    
    // Update button states
    document.querySelectorAll('.view-toggle .btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Show/hide views
    document.querySelectorAll('.view-container').forEach(container => {
        container.classList.remove('active');
    });
    
    if (view === 'calendar') {
        document.getElementById('calendarView').classList.add('active');
        renderCalendar();
    } else {
        document.getElementById('listView').classList.add('active');
        renderScheduleTable();
    }
}

// Calendar navigation
function previousMonth() {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
}

function nextMonth() {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
}

// Render calendar
function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Update month header
    const monthNames = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    document.getElementById('currentMonth').textContent = `${monthNames[month]} ${year}`;
    
    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    // Create calendar grid
    const calendarGrid = document.getElementById('calendarGrid');
    calendarGrid.innerHTML = '';
    
    // Add day headers
    const dayHeaders = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    dayHeaders.forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'calendar-day-header';
        dayHeader.textContent = day;
        dayHeader.style.cssText = `
            background: #f8f9fa;
            padding: 0.5rem;
            text-align: center;
            font-weight: 600;
            color: #495057;
            border-bottom: 2px solid #dee2e6;
        `;
        calendarGrid.appendChild(dayHeader);
    });
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day other-month';
        calendarGrid.appendChild(emptyDay);
    }
    
    // Add days of the month
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        
        // Check if it's today
        if (year === today.getFullYear() && 
            month === today.getMonth() && 
            day === today.getDate()) {
            dayElement.classList.add('today');
        }
        
        // Add day number
        const dayNumber = document.createElement('div');
        dayNumber.className = 'day-number';
        dayNumber.textContent = day;
        dayElement.appendChild(dayNumber);
        
        // Add events for this day
        const dayEvents = document.createElement('div');
        dayEvents.className = 'day-events';
        
        // Filter events for this day
        const daySchedules = scheduleData.filter(schedule => {
            const scheduleDate = new Date(schedule.scheduled_date);
            return scheduleDate.getFullYear() === year &&
                   scheduleDate.getMonth() === month &&
                   scheduleDate.getDate() === day;
        });
        
        daySchedules.forEach(schedule => {
            const eventItem = document.createElement('div');
            eventItem.className = `event-item ${schedule.training_type}`;
            eventItem.textContent = `${schedule.start_time} ${schedule.training_type.replace('_', ' ')}`;
            eventItem.onclick = () => viewScheduleDetails(schedule.id);
            dayEvents.appendChild(eventItem);
        });
        
        dayElement.appendChild(dayEvents);
        calendarGrid.appendChild(dayElement);
    }
}

// Render schedule table
function renderScheduleTable() {
    const tbody = document.getElementById('scheduleTableBody');
    
    if (scheduleData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="loading">Tidak ada jadwal</td></tr>';
        return;
    }
    
    tbody.innerHTML = scheduleData.map(schedule => {
        const date = new Date(schedule.scheduled_date).toLocaleDateString('id-ID');
        const timeRange = `${schedule.start_time} - ${schedule.end_time}`;
        
        return `
            <tr>
                <td>${date}</td>
                <td>${timeRange}</td>
                <td><span class="badge badge-info">${schedule.training_type.replace('_', ' ')}</span></td>
                <td>${schedule.batch_name}</td>
                <td>${schedule.room}</td>
                <td>${schedule.trainer}</td>
                <td>${schedule.participant_count || 0}/${schedule.max_participants}</td>
                <td><span class="status-badge status-${schedule.status}">${schedule.status}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-info btn-sm" onclick="manageParticipants(${schedule.id})" title="Kelola Peserta">
                            <i class="fas fa-users"></i>
                        </button>
                        <button class="btn btn-warning btn-sm" onclick="editSchedule(${schedule.id})" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="deleteSchedule(${schedule.id})" title="Hapus">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// Load schedule data from API
function loadScheduleData() {
    const params = new URLSearchParams({
        month: document.getElementById('monthFilter').value,
        type: document.getElementById('typeFilter').value
    });
    
    fetch(`api/schedule_data.php?${params}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                scheduleData = data.data;
                if (currentView === 'calendar') {
                    renderCalendar();
                } else {
                    renderScheduleTable();
                }
                loadTodaySchedule(); // Update today's schedule widget
            } else {
                showError(data.message);
                scheduleData = []; // Clear data on error
            }
        })
        .catch(error => {
            console.error('Error loading schedule data:', error);
            showError('Gagal memuat data jadwal');
            scheduleData = []; // Clear data on error
        });
}

// Get dummy data for demo
function getDummyScheduleData() {
    const today = new Date();
    return [
        {
            id: 1,
            training_type: 'pre_test',
            batch_name: 'Batch 1 - Production',
            scheduled_date: today.toISOString().split('T')[0],
            start_time: '08:00',
            end_time: '10:00',
            room: 'Training Room A',
            trainer: 'John Doe',
            max_participants: 20,
            participant_count: 15,
            status: 'scheduled'
        },
        {
            id: 2,
            training_type: 'seven_tools',
            batch_name: 'Batch 2 - Quality',
            scheduled_date: new Date(today.getTime() + 86400000).toISOString().split('T')[0],
            start_time: '13:00',
            end_time: '16:00',
            room: 'Training Room B',
            trainer: 'Jane Smith',
            max_participants: 25,
            participant_count: 20,
            status: 'scheduled'
        }
    ];
}

// Load today's schedule
function loadTodaySchedule() {
    const today = new Date().toISOString().split('T')[0];
    const todaySchedules = scheduleData.filter(schedule => 
        schedule.scheduled_date === today
    );
    
    const container = document.getElementById('todaySchedule');
    
    if (todaySchedules.length === 0) {
        container.innerHTML = '<p class="text-muted">Tidak ada jadwal hari ini</p>';
        return;
    }
    
    container.innerHTML = todaySchedules.map(schedule => `
        <div class="schedule-card">
            <div class="schedule-card-header">
                <div class="schedule-card-title">${schedule.training_type.replace('_', ' ')}</div>
                <div class="schedule-card-time">${schedule.start_time} - ${schedule.end_time}</div>
            </div>
            <div class="schedule-card-details">
                <strong>${schedule.batch_name}</strong><br>
                📍 ${schedule.room} | 👨‍🏫 ${schedule.trainer}<br>
                👥 ${schedule.participant_count || 0}/${schedule.max_participants} peserta
            </div>
        </div>
    `).join('');
}

// Filter schedule
function filterSchedule() {
    loadScheduleData();
}

// Open schedule modal
function openScheduleModal() {
    currentEditId = null;
    document.getElementById('scheduleModalTitle').textContent = 'Tambah Jadwal';
    document.getElementById('scheduleForm').reset();
    setDefaultDate();
    document.getElementById('scheduleModal').style.display = 'block';
}

// Edit schedule
function editSchedule(id) {
    const schedule = scheduleData.find(s => s.id === id);
    if (!schedule) return;
    
    currentEditId = id;
    document.getElementById('scheduleModalTitle').textContent = 'Edit Jadwal';
    
    // Fill form
    document.getElementById('trainingType').value = schedule.training_type;
    document.getElementById('batchName').value = schedule.batch_name;
    document.getElementById('scheduleDate').value = schedule.scheduled_date;
    document.getElementById('startTime').value = schedule.start_time;
    document.getElementById('endTime').value = schedule.end_time;
    document.getElementById('room').value = schedule.room;
    document.getElementById('trainer').value = schedule.trainer;
    document.getElementById('maxParticipants').value = schedule.max_participants;
    document.getElementById('description').value = schedule.description || '';
    
    document.getElementById('scheduleModal').style.display = 'block';
}

// Handle schedule form submit
function handleScheduleSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const scheduleData = {
        training_type: formData.get('training_type'),
        batch_name: formData.get('batch_name'),
        scheduled_date: formData.get('scheduled_date'),
        start_time: formData.get('start_time'),
        end_time: formData.get('end_time'),
        room: formData.get('room'),
        trainer: formData.get('trainer'),
        max_participants: formData.get('max_participants'),
        description: formData.get('description')
    };
    
    const url = currentEditId ? 
        `api/schedule_data.php?id=${currentEditId}` : 
        'api/schedule_data.php';
    const method = currentEditId ? 'PUT' : 'POST';
    
    fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(scheduleData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showSuccess(currentEditId ? 'Jadwal berhasil diupdate' : 'Jadwal berhasil ditambahkan');
            document.getElementById('scheduleModal').style.display = 'none';
            loadScheduleData();
            loadTodaySchedule();
        } else {
            showError(data.message);
        }
    })
    .catch(error => {
        console.error('Error saving schedule:', error);
        showError('Gagal menyimpan jadwal');
    });
}

// Delete schedule
function deleteSchedule(id) {
    if (!confirm('Apakah Anda yakin ingin menghapus jadwal ini?')) {
        return;
    }
    
    fetch(`api/schedule_data.php?id=${id}`, {
        method: 'DELETE'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showSuccess('Jadwal berhasil dihapus');
            loadScheduleData();
            loadTodaySchedule();
        } else {
            showError(data.message);
        }
    })
    .catch(error => {
        console.error('Error deleting schedule:', error);
        showError('Gagal menghapus jadwal');
    });
}

// Open batch modal
function openBatchModal() {
    document.getElementById('batchModal').style.display = 'block';
    loadActiveBatches();
}

// Load active batches
function loadActiveBatches() {
    fetch('api/batch_data.php')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                renderActiveBatches(data.data);
            } else {
                showError('Gagal memuat data batch');
                renderActiveBatches([]);
            }
        })
        .catch(error => {
            console.error('Error loading batches:', error);
            showError('Gagal memuat data batch');
            renderActiveBatches([]);
        });
}

// Render active batches
function renderActiveBatches(batches) {
    const container = document.getElementById('activeBatches');
    
    if (batches.length === 0) {
        container.innerHTML = '<p class="text-muted">Belum ada batch aktif</p>';
        return;
    }
    
    container.innerHTML = batches.map(batch => `
        <div class="batch-card">
            <div class="batch-info">
                <h5>${batch.name}</h5>
                <small>${batch.section} • ${batch.participant_count} peserta</small>
            </div>
            <div class="batch-actions">
                <button class="btn btn-sm btn-outline-primary" onclick="editBatch(${batch.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteBatch(${batch.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// Handle batch form submit
function handleBatchSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const batchData = {
        name: formData.get('batch_name'),
        section: formData.get('section')
    };
    
    fetch('api/batch_data.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(batchData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showSuccess('Batch berhasil dibuat');
            document.getElementById('batchForm').reset();
            loadActiveBatches();
        } else {
            showError(data.message);
        }
    })
    .catch(error => {
        console.error('Error creating batch:', error);
        showError('Gagal membuat batch');
    });
}

// Manage participants
function manageParticipants(scheduleId) {
    const schedule = scheduleData.find(s => s.id === scheduleId);
    if (!schedule) return;
    
    document.getElementById('participantScheduleTitle').textContent = 
        `${schedule.batch_name} - ${schedule.training_type.replace('_', ' ')}`;
    
    document.getElementById('participantModal').style.display = 'block';
    loadAvailableParticipants();
    loadAssignedParticipants(scheduleId);
}

// Load available participants
function loadAvailableParticipants() {
    fetch('api/mp_data.php')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                renderAvailableParticipants(data.data);
            } else {
                showError('Gagal memuat data peserta');
                renderAvailableParticipants([]);
            }
        })
        .catch(error => {
            console.error('Error loading participants:', error);
            showError('Gagal memuat data peserta');
            renderAvailableParticipants([]);
        });
}

// Render available participants
function renderAvailableParticipants(participants) {
    const container = document.getElementById('availableList');
    
    container.innerHTML = participants.map(participant => `
        <div class="participant-item" onclick="assignParticipant(${participant.id})">
            <div class="participant-info">
                <strong>${participant.npk} - ${participant.name}</strong>
                <small>${participant.title} | ${participant.section}</small>
            </div>
            <button class="btn btn-sm btn-outline-primary">
                <i class="fas fa-plus"></i>
            </button>
        </div>
    `).join('');
}

// Load assigned participants
function loadAssignedParticipants(scheduleId) {
    fetch(`api/schedule_participants.php?schedule_id=${scheduleId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                renderAssignedParticipants(data.data);
            }
        })
        .catch(error => {
            console.error('Error loading assigned participants:', error);
        });
}

// Render assigned participants
function renderAssignedParticipants(participants) {
    const container = document.getElementById('assignedList');
    
    if (participants.length === 0) {
        container.innerHTML = '<p class="text-muted">Belum ada peserta terdaftar</p>';
        return;
    }
    
    container.innerHTML = participants.map(participant => `
        <div class="participant-item">
            <div class="participant-info">
                <strong>${participant.npk} - ${participant.name}</strong>
                <small>${participant.title} | ${participant.section}</small>
            </div>
            <button class="btn btn-sm btn-outline-danger" onclick="removeParticipant(${participant.id})">
                <i class="fas fa-minus"></i>
            </button>
        </div>
    `).join('');
}

// Filter participants
function filterParticipants(query) {
    const items = document.querySelectorAll('#availableList .participant-item');
    
    items.forEach(item => {
        const text = item.textContent.toLowerCase();
        if (text.includes(query.toLowerCase())) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

// Close participant modal
function closeParticipantModal() {
    document.getElementById('participantModal').style.display = 'none';
}

// Export schedule
function exportSchedule() {
    const params = new URLSearchParams({
        month: document.getElementById('monthFilter').value,
        type: document.getElementById('typeFilter').value
    });
    
    window.open(`api/schedule_excel.php?${params}`, '_blank');
}

// View schedule details
function viewScheduleDetails(scheduleId) {
    const schedule = scheduleData.find(s => s.id === scheduleId);
    if (!schedule) return;
    
    alert(`Jadwal: ${schedule.training_type.replace('_', ' ')}\nBatch: ${schedule.batch_name}\nWaktu: ${schedule.start_time} - ${schedule.end_time}\nRuangan: ${schedule.room}\nTrainer: ${schedule.trainer}`);
}

// Utility functions
function showSuccess(message) {
    alert('✅ ' + message);
}

function showError(message) {
    alert('❌ ' + message);
}

function logout() {
    fetch('auth/logout.php', { method: 'POST' })
        .then(() => {
            window.location.href = 'login.html';
        })
        .catch(error => {
            console.error('Logout error:', error);
            window.location.href = 'login.html';
        });
}