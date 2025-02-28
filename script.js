document.addEventListener('DOMContentLoaded', () => {
    const taskInput = document.getElementById('task-input');
    const dueDateInput = document.getElementById('due-date');
    const prioritySelect = document.getElementById('priority');
    const categoryInput = document.getElementById('category');
    const addBtn = document.getElementById('add-btn');
    const taskList = document.getElementById('task-list');
    const tasksCounter = document.getElementById('tasks-counter');
    const clearCompletedBtn = document.getElementById('clear-completed');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const searchInput = document.getElementById('search-input');
    const themeToggle = document.getElementById('theme-toggle');
    const saveTasksBtn = document.getElementById('save-tasks');

    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    let currentFilter = 'all';
    let searchQuery = '';
    let theme = localStorage.getItem('theme') || 'dark';
    let hasUnsavedChanges = false;

    // Theme Management
    document.documentElement.setAttribute('data-theme', theme);
    updateThemeIcon();

    function updateThemeIcon() {
        const icon = themeToggle.querySelector('i');
        icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }

    function toggleTheme() {
        theme = theme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        updateThemeIcon();
    }

    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
        hasUnsavedChanges = false;
        showSaveConfirmation();
    }

    function showSaveConfirmation() {
        saveTasksBtn.classList.add('saved');
        saveTasksBtn.innerHTML = '<i class="fas fa-check"></i> Saved!';
        
        setTimeout(() => {
            saveTasksBtn.classList.remove('saved');
            saveTasksBtn.innerHTML = '<i class="fas fa-save"></i> Save Tasks';
        }, 2000);
    }

    function markUnsavedChanges() {
        hasUnsavedChanges = true;
        saveTasksBtn.innerHTML = '<i class="fas fa-save"></i> Save Tasks*';
    }

    function updateTasksCounter() {
        const activeTasks = tasks.filter(task => !task.completed).length;
        tasksCounter.textContent = `${activeTasks} task${activeTasks !== 1 ? 's' : ''} left`;
    }

    function formatDate(date) {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    }

    function createTaskElement(task) {
        const li = document.createElement('li');
        li.className = `task-item ${task.completed ? 'completed' : ''}`;
        li.dataset.id = task.id;

        li.innerHTML = `
            <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
            <span class="task-text">${task.text}</span>
            <span class="task-meta">
                ${task.dueDate ? `<span class="due-date">${formatDate(task.dueDate)}</span>` : ''}
                ${task.category ? `<span class="category-badge">${task.category}</span>` : ''}
                <span class="priority-badge priority-${task.priority}">${task.priority}</span>
            </span>
            <button class="delete-btn">
                <i class="fas fa-trash"></i>
            </button>
        `;

        const checkbox = li.querySelector('.task-checkbox');
        checkbox.addEventListener('change', () => toggleTask(task.id));

        const deleteBtn = li.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', () => deleteTask(task.id));

        // Make tasks draggable
        li.draggable = true;
        li.addEventListener('dragstart', handleDragStart);
        li.addEventListener('dragover', handleDragOver);
        li.addEventListener('drop', handleDrop);
        li.addEventListener('dragend', handleDragEnd);

        return li;
    }

    function addTask(text) {
        if (text.trim() === '') return;

        const newTask = {
            id: Date.now(),
            text: text,
            completed: false,
            dueDate: dueDateInput.value || null,
            priority: prioritySelect.value,
            category: categoryInput.value || null,
            order: tasks.length
        };

        tasks.push(newTask);
        markUnsavedChanges();
        renderTasks();
        
        // Clear inputs
        taskInput.value = '';
        dueDateInput.value = '';
        prioritySelect.value = 'low';
        categoryInput.value = '';
    }

    // Drag and Drop Functionality
    let draggedItem = null;

    function handleDragStart(e) {
        draggedItem = this;
        this.style.opacity = '0.4';
    }

    function handleDragOver(e) {
        e.preventDefault();
    }

    function handleDrop(e) {
        e.preventDefault();
        if (this === draggedItem) return;

        const allItems = [...taskList.querySelectorAll('.task-item')];
        const draggedIdx = allItems.indexOf(draggedItem);
        const droppedIdx = allItems.indexOf(this);

        // Update task orders
        const draggedTaskId = parseInt(draggedItem.dataset.id);
        const droppedTaskId = parseInt(this.dataset.id);
        
        const tempOrder = tasks.find(t => t.id === draggedTaskId).order;
        tasks.find(t => t.id === draggedTaskId).order = tasks.find(t => t.id === droppedTaskId).order;
        tasks.find(t => t.id === droppedTaskId).order = tempOrder;

        markUnsavedChanges();
        renderTasks();
    }

    function handleDragEnd(e) {
        this.style.opacity = '1';
        draggedItem = null;
    }

    function toggleTask(id) {
        const task = tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            markUnsavedChanges();
            renderTasks();
        }
    }

    function deleteTask(id) {
        tasks = tasks.filter(task => task.id !== id);
        markUnsavedChanges();
        renderTasks();
    }

    function clearCompleted() {
        tasks = tasks.filter(task => !task.completed);
        markUnsavedChanges();
        renderTasks();
    }

    function filterTasks(task) {
        const matchesFilter = currentFilter === 'all' || 
            (currentFilter === 'active' && !task.completed) ||
            (currentFilter === 'completed' && task.completed);

        const matchesSearch = task.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (task.category && task.category.toLowerCase().includes(searchQuery.toLowerCase()));

        return matchesFilter && matchesSearch;
    }

    function renderTasks() {
        const filteredTasks = tasks
            .filter(filterTasks)
            .sort((a, b) => a.order - b.order);

        taskList.innerHTML = '';
        filteredTasks.forEach(task => {
            taskList.appendChild(createTaskElement(task));
        });

        updateTasksCounter();
    }

    // Event Listeners
    addBtn.addEventListener('click', () => addTask(taskInput.value));

    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addTask(taskInput.value);
        }
    });

    clearCompletedBtn.addEventListener('click', clearCompleted);

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelector('.filter-btn.active').classList.remove('active');
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderTasks();
        });
    });

    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        renderTasks();
    });

    themeToggle.addEventListener('click', toggleTheme);

    saveTasksBtn.addEventListener('click', saveTasks);

    window.addEventListener('beforeunload', (e) => {
        if (hasUnsavedChanges) {
            e.preventDefault();
            e.returnValue = '';
        }
    });

    // Initial render
    renderTasks();
});
