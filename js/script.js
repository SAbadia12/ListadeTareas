const taskForm = document.getElementById('task-form')
const titleInput = document.getElementById('todo-title')
const datePicker = document.getElementById('date-picker')
const todoList = document.getElementById('todo-list')
const emptyState = document.getElementById('empty-state')
const taskCount = document.getElementById('task-count')
const progressText = document.getElementById('progress-text')
const taskProgress = document.getElementById('task-progress')
const formMessage = document.getElementById('form-message')
const todos = []

function showToday() {
    const today = new Date()
    document.getElementById('today-day').textContent = today.getDate()
    document.getElementById('today-month').textContent = new Intl.DateTimeFormat('es', {
        month: 'short'
    }).format(today).replace('.', '')
}

function formatDueDate(dateValue) {
    const [year, month, day] = dateValue.split('-').map(Number)
    return new Intl.DateTimeFormat('es', {
        day: 'numeric',
        month: 'short'
    }).format(new Date(year, month - 1, day))
}

function updateSummary() {
    const completedCount = todos.filter((todo) => todo.completed).length
    const totalCount = todos.length
    const taskWord = totalCount === 1 ? 'tarea' : 'tareas'

    taskCount.textContent = `${totalCount} ${taskWord}`
    progressText.textContent = `${completedCount} de ${totalCount} completadas`
    taskProgress.max = totalCount || 1
    taskProgress.value = completedCount
    taskProgress.textContent = `${totalCount ? Math.round((completedCount / totalCount) * 100) : 0}%`
    taskProgress.setAttribute('aria-valuetext', `${completedCount} de ${totalCount} tareas completadas`)
}

function createTaskElement(todo) {
    const item = document.createElement('li')
    const checkbox = document.createElement('input')
    const content = document.createElement('div')
    const title = document.createElement('span')
    const status = document.createElement('span')

    item.className = 'task-row'
    checkbox.className = 'task-checkbox'
    checkbox.type = 'checkbox'
    checkbox.checked = todo.completed
    checkbox.setAttribute('aria-label', `Marcar "${todo.title}" como completada`)

    content.className = 'task-content'
    title.className = 'task-title'
    title.textContent = todo.title
    status.className = 'task-status'
    status.textContent = todo.completed ? 'Completada' : 'Pendiente'

    if (todo.dueDate) {
        const date = document.createElement('span')
        date.className = 'task-date'
        date.textContent = `Fecha límite: ${formatDueDate(todo.dueDate)}`
        content.append(title, date)
    } else {
        content.append(title)
    }

    if (todo.completed) {
        item.classList.add('is-complete')
    }

    checkbox.addEventListener('change', () => {
        todo.completed = checkbox.checked
        item.classList.toggle('is-complete', todo.completed)
        status.textContent = todo.completed ? 'Completada' : 'Pendiente'
        updateSummary()
    })

    item.append(checkbox, content, status)
    return item
}

function renderTasks() {
    todoList.replaceChildren()

    if (todos.length === 0) {
        todoList.append(emptyState)
    } else {
        todos.forEach((todo) => {
            todoList.append(createTaskElement(todo))
        })
    }

    updateSummary()
}

taskForm.addEventListener('submit', (event) => {
    event.preventDefault()

    const title = titleInput.value.trim()
    if (!title) {
        formMessage.textContent = 'Escribe el nombre de la tarea para agregarla.'
        titleInput.focus()
        return
    }

    todos.push({
        title,
        dueDate: datePicker.value,
        completed: false
    })

    formMessage.textContent = ''
    taskForm.reset()
    renderTasks()
    titleInput.focus()
})

titleInput.addEventListener('input', () => {
    formMessage.textContent = ''
})

showToday()
renderTasks()