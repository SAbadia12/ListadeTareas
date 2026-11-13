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

function createActionButton(label, className, action) {
    const button = document.createElement('button')
    button.className = className
    button.type = 'button'
    button.textContent = label
    button.addEventListener('click', action)
    return button
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
            todoList.querySelector(`[data-task-index="${todos.indexOf(todo)}"] .task-edit-button`)?.focus()
        })
    )

    form.append(titleLabel, stepsLabel, dateLabel, buttons)
    form.addEventListener('submit', (event) => {
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

        todo.title = title
        todo.dueDate = dateInput.value
        todo.steps = updatedSteps
        if (updatedSteps.length > 0) {
            todo.completed = updatedSteps.every((step) => step.completed)
        }

        renderTasks()
        const taskIndex = todos.indexOf(todo)
        todoList.querySelector(`[data-task-index="${taskIndex}"] .task-edit-button`)?.focus()
    })

    item.querySelector('.task-content').replaceChildren(form)
    titleInput.focus()
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
    checkbox.className = 'task-checkbox'
    checkbox.type = 'checkbox'
    checkbox.checked = todo.completed
    checkbox.setAttribute('aria-label', `Marcar "${todo.title}" como completada`)
    actions.className = 'task-actions'
    actions.append(
        createActionButton('Editar', 'task-action task-edit-button', () => createTaskEditor(todo, item)),
        createActionButton('Eliminar', 'task-action task-delete-button', () => {
            if (window.confirm(`¿Eliminar la tarea "${todo.title}"?`)) {
                todos.splice(todos.indexOf(todo), 1)
                renderTasks()
                const nextTask = todoList.querySelector(`[data-task-index="${Math.min(taskIndex, todos.length - 1)}"] .task-edit-button`)
                if (nextTask) {
                    nextTask.focus()
                } else {
                    titleInput.focus()
                }
            }
        })
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

            stepCheckbox.addEventListener('change', () => {
                todo.steps[index].completed = stepCheckbox.checked
                todo.completed = todo.steps.every((taskStep) => taskStep.completed)
                stepItem.classList.toggle('is-complete', step.completed)
                stepSummary.textContent = `${todo.steps.filter((taskStep) => taskStep.completed).length} de ${todo.steps.length} pasos`
                updateTaskCompletion(todo, item, checkbox, status, stepCheckboxes)
                updateSummary()
            })

            stepCheckboxes.push({ checkbox: stepCheckbox, stepItem, step })
            stepItem.append(stepCheckbox, stepTitle)
            stepList.append(stepItem)
        })

        content.append(stepList)
    }

    checkbox.addEventListener('change', () => {
        todo.completed = checkbox.checked
        todo.steps.forEach((step) => {
            step.completed = todo.completed
        })
        updateTaskCompletion(todo, item, checkbox, status, stepCheckboxes)
        updateSummary()
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

taskForm.addEventListener('submit', (event) => {
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

    todos.push({
        title,
        dueDate: datePicker.value,
        completed: false,
        steps: steps.map((step) => ({
            title: step,
            completed: false
        }))
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