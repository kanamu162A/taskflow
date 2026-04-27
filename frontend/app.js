// Configuration
const API_URL = 'http://localhost:3000/api/tasks';

// State
let allTasks = [];
let currentView = 'all';
let searchTerm = '';

// DOM Elements
const tasksContainer = document.getElementById('tasks-container');
const fabBtn = document.getElementById('fab-btn');
const modalOverlay = document.getElementById('modal-overlay');
const editModalOverlay = document.getElementById('edit-modal-overlay');
const taskForm = document.getElementById('task-form');
const editForm = document.getElementById('edit-form');
const searchInput = document.getElementById('search-input');
const viewTitle = document.getElementById('view-title');
const viewSubtitle = document.getElementById('view-subtitle');

let currentEditId = null;

// Helper Functions
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

function updateStats() {
    document.getElementById('total-count').textContent = allTasks.length;
    document.getElementById('pending-count').textContent = allTasks.filter(t => t.status === 'pending').length;
    document.getElementById('completed-count').textContent = allTasks.filter(t => t.status === 'completed').length;
}

// API Calls
async function fetchTasks() {
    try {
        const response = await fetch(API_URL);
        allTasks = await response.json();
        updateStats();
        renderTasks();
    } catch (error) {
        showNotification('Failed to load tasks', 'error');
    }
}

async function addTask(taskData) {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(taskData)
        });
        
        const newTask = await response.json();
        allTasks.unshift(newTask);
        updateStats();
        renderTasks();
        closeModal();
        showNotification('Task created successfully!');
        
        // Reset form
        document.getElementById('task-form').reset();
        
    } catch (error) {
        showNotification('Failed to create task', 'error');
    }
}

async function updateTask(id, updates) {
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });
        
        const updatedTask = await response.json();
        const index = allTasks.findIndex(t => t.id === id);
        allTasks[index] = updatedTask;
        updateStats();
        renderTasks();
        closeEditModal();
        showNotification('Task updated successfully!');
        
    } catch (error) {
        showNotification('Failed to update task', 'error');
    }
}

async function deleteTask(id) {
    if (!confirm('Delete this task?')) return;
    
    try {
        await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        allTasks = allTasks.filter(t => t.id !== id);
        updateStats();
        renderTasks();
        closeEditModal();
        showNotification('Task deleted successfully!');
        
    } catch (error) {
        showNotification('Failed to delete task', 'error');
    }
}

// Render Tasks
function renderTasks() {
    let filtered = allTasks;
    
    if (currentView !== 'all') {
        filtered = allTasks.filter(t => t.status === currentView);
    }
    
    if (searchTerm) {
        filtered = filtered.filter(t => 
            t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (t.description && t.description.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }
    
    if (filtered.length === 0) {
        tasksContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📭</div>
                <h3>No tasks found</h3>
                <p>Click the + button to create a new task</p>
            </div>
        `;
        return;
    }
    
    tasksContainer.innerHTML = filtered.map(task => `
        <div class="task-card" data-id="${task.id}" draggable="true">
            <div class="task-header">
                <div class="task-title">${escapeHtml(task.title)}</div>
                <div class="priority-badge priority-${task.priority}">
                    ${task.priority.toUpperCase()}
                </div>
            </div>
            ${task.description ? `<div class="task-description">${escapeHtml(task.description)}</div>` : ''}
            <div class="task-footer">
                <div class="status-badge">${getStatusEmoji(task.status)} ${task.status}</div>
                ${task.due_date ? `<div class="due-date">📅 ${new Date(task.due_date).toLocaleDateString()}</div>` : ''}
                <div class="task-actions">
                    <button class="edit-btn" onclick="openEditModal(${task.id})">✏️ Edit</button>
                    <button class="delete-btn" onclick="deleteTask(${task.id})">🗑️ Delete</button>
                </div>
            </div>
        </div>
    `).join('');
    
    // Add drag and drop listeners
    document.querySelectorAll('.task-card').forEach(card => {
        card.addEventListener('dragstart', handleDragStart);
        card.addEventListener('dragover', handleDragOver);
        card.addEventListener('drop', handleDrop);
    });
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function getStatusEmoji(status) {
    const emojis = { pending: '⏳', 'in-progress': '🔄', completed: '✅' };
    return emojis[status] || '📋';
}

// Modal Functions
function openModal() {
    modalOverlay.classList.add('active');
}

function closeModal() {
    modalOverlay.classList.remove('active');
    document.getElementById('task-form').reset();
}

function openEditModal(id) {
    const task = allTasks.find(t => t.id === id);
    if (!task) return;
    
    currentEditId = id;
    document.getElementById('edit-title').value = task.title;
    document.getElementById('edit-desc').value = task.description || '';
    document.getElementById('edit-status').value = task.status;
    document.getElementById('edit-priority').value = task.priority;
    document.getElementById('edit-due').value = task.due_date || '';
    
    editModalOverlay.classList.add('active');
}

function closeEditModal() {
    editModalOverlay.classList.remove('active');
    currentEditId = null;
}

// Drag and Drop
let draggedItem = null;

function handleDragStart(e) {
    draggedItem = this;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

async function handleDrop(e) {
    e.preventDefault();
    
    if (draggedItem !== this) {
        const tasks = document.querySelectorAll('.task-card');
        const draggedIndex = Array.from(tasks).indexOf(draggedItem);
        const targetIndex = Array.from(tasks).indexOf(this);
        
        if (draggedIndex < targetIndex) {
            this.parentNode.insertBefore(draggedItem, this.nextSibling);
        } else {
            this.parentNode.insertBefore(draggedItem, this);
        }
        
        // Update order in backend
        const updatedTasks = document.querySelectorAll('.task-card');
        const orderUpdates = Array.from(updatedTasks).map((task, index) => ({
            id: parseInt(task.dataset.id),
            order_position: index
        }));
        
        try {
            await fetch(`${API_URL}/reorder`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tasks: orderUpdates })
            });
            await fetchTasks();
        } catch (error) {
            console.error('Failed to update order');
        }
    }
    
    draggedItem.classList.remove('dragging');
    draggedItem = null;
}

// Event Listeners
fabBtn.addEventListener('click', openModal);

taskForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('task-title').value.trim();
    if (!title) {
        showNotification('Please enter a task title', 'error');
        return;
    }
    
    await addTask({
        title,
        description: document.getElementById('task-desc').value,
        priority: document.getElementById('task-priority').value,
        due_date: document.getElementById('task-due').value || null
    });
});

editForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentEditId) return;
    
    await updateTask(currentEditId, {
        title: document.getElementById('edit-title').value,
        description: document.getElementById('edit-desc').value,
        status: document.getElementById('edit-status').value,
        priority: document.getElementById('edit-priority').value,
        due_date: document.getElementById('edit-due').value || null
    });
});

// Close modals
document.getElementById('modal-close').onclick = closeModal;
document.getElementById('cancel-btn').onclick = closeModal;
document.getElementById('edit-modal-close').onclick = closeEditModal;
document.getElementById('edit-cancel-btn').onclick = closeEditModal;
document.getElementById('delete-task-btn').onclick = () => {
    if (currentEditId) deleteTask(currentEditId);
};

// Close modal on overlay click
modalOverlay.onclick = (e) => {
    if (e.target === modalOverlay) closeModal();
};
editModalOverlay.onclick = (e) => {
    if (e.target === editModalOverlay) closeEditModal();
};

// Navigation
document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentView = btn.dataset.view;
        
        // Update header
        const titles = { all: 'All Tasks', pending: 'Pending', 'in-progress': 'In Progress', completed: 'Completed' };
        viewTitle.textContent = titles[currentView];
        viewSubtitle.textContent = `${allTasks.filter(t => currentView === 'all' || t.status === currentView).length} tasks`;
        
        renderTasks();
    });
});

// Search with debounce
let searchTimeout;
searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        searchTerm = e.target.value;
        renderTasks();
    }, 300);
});

// Initialize
fetchTasks();