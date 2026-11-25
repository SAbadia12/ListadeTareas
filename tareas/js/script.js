const taskForm = document.getElementById('task-form')
const titleInput = document.getElementById('todo-title')
const stepsInput = document.getElementById('todo-steps')
const datePicker = document.getElementById('date-picker')
const todoList = document.getElementById('todo-list')
const emptyState = document.getElementById('empty-state')
const taskCount = document.getElementById('task-count')
const progressText = document.getElementById('progress-text')
const taskProgress = document.getElementById('task-progress')
const formMessage = document.getElementById('form-message')
let todos = []

async function requestApi(path, options = {}) {
    let response
    try {
        response = await fetch(path, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        })
    } catch (error) {
        console.error('No se pudo conectar con la API de tareas.', error)
        throw new Error('No se pudo conectar con la API. En PowerShell ejecuta "npm.cmd start" en la carpeta del proyecto y abre http://localhost:3000.')
    }

    if (!response.headers.get('content-type')?.includes('application/json')) {
        throw new Error('La página recibió HTML en vez de la API. En PowerShell ejecuta "npm.cmd start" en la carpeta del proyecto y abre http://localhost:3000 (no uses Live Server).')
    }

    const result = response.status === 204 ? null : await response.json()

    if (!response.ok) {
        throw new Error(result.error || 'No se pudo completar la solicitud.')
    }

    return result
}

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

function createActionButton(label, className, action) {
    const button = document.createElement('button')
    button.className = className
    button.type = 'button'
    button.textContent = label
    button.addEventListener('click', action)
    return button
}

function focusTaskEditButton(id) {
    const button = [...todoList.querySelectorAll('.task-edit-button')]
        .find((editButton) => editButton.closest('.task-row').dataset.taskId === id)
    button?.focus()
}

async function updateTask(updatedTask) {
    const savedTask = await requestApi(`/api/tasks/${encodeURIComponent(updatedTask.id)}`, {
        method: 'PUT',
        body: JSON.stringify(updatedTask)
    })
    todos = todos.map((todo) => todo.id === savedTask.id ? savedTask : todo)
    renderTasks()
    return savedTask
}

function createTaskEditor(todo, item) {
    const form = document.createElement('form')
    const titleLabel = document.createElement('label')
    const titleInput = document.createElement('input')
    const stepsLabel = document.createElement('label')
    const stepsInput = document.createElement('textarea')
    const dateLabel = document.createElement('label')
    const dateInput = document.createElement('input')
    const buttons = document.createElement('div')

    form.className = 'task-editor'

    titleLabel.textContent = 'Nombre de la tarea'
    titleInput.type = 'text'
    titleInput.maxLength = 120
    titleInput.required = true
    titleInput.value = todo.title
    titleLabel.append(titleInput)

    stepsLabel.textContent = 'Pasos (uno por línea)'
    stepsInput.maxLength = 500
    stepsInput.rows = 3
    stepsInput.value = todo.steps.map((step) => step.title).join('\n')
    stepsLabel.append(stepsInput)

    dateLabel.textContent = 'Fecha límite'
    dateInput.type = 'date'
    dateInput.value = todo.dueDate
    dateLabel.append(dateInput)

    buttons.className = 'task-editor-actions'
    buttons.append(
        createActionButton('Guardar', 'task-action task-save-button', () => form.requestSubmit()),
        createActionButton('Cancelar', 'task-action', () => {
            renderTasks()
            focusTaskEditButton(todo.id)
        })
    )

    form.append(titleLabel, stepsLabel, dateLabel, buttons)
    form.addEventListener('submit', async (event) => {
        event.preventDefault()

        const title = titleInput.value.trim()
        if (!title) {
            titleInput.focus()
            return
        }

        const previousSteps = [...todo.steps]
        const updatedSteps = stepsInput.value
            .split(/\r?\n/)
            .map((step) => step.trim())
            .filter((step) => step.length > 0)
            .map((stepTitle) => {
                const previousIndex = previousSteps.findIndex((step) => step.title === stepTitle)
                const previousStep = previousIndex === -1 ? null : previousSteps.splice(previousIndex, 1)[0]
                return { title: stepTitle, completed: previousStep?.completed ?? false }
            })

        const updatedTask = {
            ...todo,
            title,
            dueDate: dateInput.value,
            steps: updatedSteps
        }
        if (updatedSteps.length > 0) {
            updatedTask.completed = updatedSteps.every((step) => step.completed)
        }

        try {
            await updateTask(updatedTask)
            focusTaskEditButton(todo.id)
            formMessage.textContent = ''
        } catch (error) {
            formMessage.textContent = error.message
        }
    })

    item.querySelector('.task-content').replaceChildren(form)
    titleInput.focus()
}

async function deleteTask(todo, taskIndex) {
    if (!window.confirm(`¿Eliminar la tarea "${todo.title}"?`)) {
        return
    }

    try {
        await requestApi(`/api/tasks/${encodeURIComponent(todo.id)}`, { method: 'DELETE' })
        todos = todos.filter((savedTask) => savedTask.id !== todo.id)
        renderTasks()
        const nextTask = todoList.querySelector(`[data-task-index="${Math.min(taskIndex, todos.length - 1)}"] .task-edit-button`)
        if (nextTask) {
            nextTask.focus()
        } else {
            titleInput.focus()
        }
        formMessage.textContent = ''
    } catch (error) {
        formMessage.textContent = error.message
    }
}

function createTaskElement(todo) {
    const item = document.createElement('li')
    const checkbox = document.createElement('input')
    const content = document.createElement('div')
    const title = document.createElement('span')
    const status = document.createElement('span')
    const taskIndex = todos.indexOf(todo)
    const actions = document.createElement('div')

    item.className = 'task-row'
    item.dataset.taskIndex = taskIndex
    item.dataset.taskId = todo.id
    checkbox.className = 'task-checkbox'
    checkbox.type = 'checkbox'
    checkbox.checked = todo.completed
    checkbox.setAttribute('aria-label', `Marcar "${todo.title}" como completada`)
    actions.className = 'task-actions'
    actions.append(
        createActionButton('Editar', 'task-action task-edit-button', () => createTaskEditor(todo, item)),
        createActionButton('Eliminar', 'task-action task-delete-button', () => deleteTask(todo, taskIndex))
    )

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

    const stepCheckboxes = []
    if (todo.steps.length > 0) {
        const stepList = document.createElement('ul')
        const completedSteps = todo.steps.filter((step) => step.completed).length
        const stepSummary = document.createElement('span')

        stepList.className = 'step-list'
        stepSummary.className = 'step-summary'
        stepSummary.textContent = `${completedSteps} de ${todo.steps.length} pasos`
        content.append(stepSummary)

        todo.steps.forEach((step, index) => {
            const stepItem = document.createElement('li')
            const stepCheckbox = document.createElement('input')
            const stepTitle = document.createElement('span')

            stepItem.className = 'step-item'
            stepCheckbox.type = 'checkbox'
            stepCheckbox.checked = step.completed
            stepCheckbox.setAttribute('aria-label', `Marcar paso: ${step.title}`)
            stepTitle.textContent = step.title

            if (step.completed) {
                stepItem.classList.add('is-complete')
            }

            stepCheckbox.addEventListener('change', async () => {
                const updatedTask = {
                    ...todo,
                    steps: todo.steps.map((taskStep, stepIndex) =>
                        stepIndex === index ? { ...taskStep, completed: stepCheckbox.checked } : taskStep
                    )
                }
                updatedTask.completed = updatedTask.steps.every((taskStep) => taskStep.completed)
                try {
                    await updateTask(updatedTask)
                    formMessage.textContent = ''
                } catch (error) {
                    renderTasks()
                    formMessage.textContent = error.message
                }
            })

            stepCheckboxes.push({ checkbox: stepCheckbox, stepItem, step })
            stepItem.append(stepCheckbox, stepTitle)
            stepList.append(stepItem)
        })

        content.append(stepList)
    }

    checkbox.addEventListener('change', async () => {
        const updatedTask = {
            ...todo,
            completed: checkbox.checked,
            steps: todo.steps.map((step) => ({ ...step, completed: checkbox.checked }))
        }
        try {
            await updateTask(updatedTask)
            formMessage.textContent = ''
        } catch (error) {
            renderTasks()
            formMessage.textContent = error.message
        }
    })

    item.append(checkbox, content, status, actions)
    updateTaskCompletion(todo, item, checkbox, status, stepCheckboxes)
    return item
}

function updateTaskCompletion(todo, item, checkbox, status, stepCheckboxes) {
    checkbox.checked = todo.completed
    item.classList.toggle('is-complete', todo.completed)
    status.textContent = todo.completed ? 'Completada' : 'Pendiente'

    stepCheckboxes.forEach(({ checkbox: stepCheckbox, stepItem, step }) => {
        stepCheckbox.checked = step.completed
        stepItem.classList.toggle('is-complete', step.completed)
    })
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

taskForm.addEventListener('submit', async (event) => {
    event.preventDefault()

    const title = titleInput.value.trim()
    const steps = stepsInput.value
        .split(/\r?\n/)
        .map((step) => step.trim())
        .filter((step) => step.length > 0)

    if (!title) {
        formMessage.textContent = 'Escribe el nombre de la tarea para agregarla.'
        titleInput.focus()
        return
    }

    try {
        const task = await requestApi('/api/tasks', {
            method: 'POST',
            body: JSON.stringify({
                title,
                dueDate: datePicker.value,
                completed: false,
                steps: steps.map((step) => ({ title: step, completed: false }))
            })
        })
        todos = [...todos, task]
        formMessage.textContent = ''
        taskForm.reset()
        renderTasks()
        titleInput.focus()
    } catch (error) {
        formMessage.textContent = error.message
    }
})

titleInput.addEventListener('input', () => {
    formMessage.textContent = ''
})

async function loadTasks() {
    try {
        todos = await requestApi('/api/tasks')
        renderTasks()
    } catch (error) {
        renderTasks()
        formMessage.textContent = `No se pudieron cargar las tareas: ${error.message}`
    }
}

showToday()
loadTasks()
