const express = require('express')
const fs = require('node:fs')
const path = require('node:path')
const { randomUUID } = require('node:crypto')

const app = express()
const port = process.env.PORT || 3000
const projectRoot = path.join(__dirname, '..')
const dataDirectory = path.join(projectRoot, 'data')
const dataFile = path.join(dataDirectory, 'store.json')

function readData() {
    fs.mkdirSync(dataDirectory, { recursive: true })
    if (!fs.existsSync(dataFile)) {
        fs.writeFileSync(dataFile, JSON.stringify({ tasks: [], contacts: [] }, null, 2))
    }

    const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'))
    if (!data || !Array.isArray(data.tasks) || !Array.isArray(data.contacts)) {
        throw new Error('El archivo de datos debe contener listas de tareas y contactos.')
    }
    return data
}

let data = readData()

function saveData(nextData) {
    fs.writeFileSync(dataFile, JSON.stringify(nextData, null, 2))
    data = nextData
}

function isNonEmptyString(value, maxLength) {
    return typeof value === 'string' && value.trim().length > 0 && value.length <= maxLength
}

function isTask(value) {
    return value &&
        isNonEmptyString(value.title, 120) &&
        typeof value.dueDate === 'string' &&
        value.dueDate.length <= 10 &&
        typeof value.completed === 'boolean' &&
        Array.isArray(value.steps) &&
        value.steps.every((step) =>
            step &&
            isNonEmptyString(step.title, 500) &&
            typeof step.completed === 'boolean'
        )
}

function isContact(value) {
    return value &&
        isNonEmptyString(value.firstName, 60) &&
        isNonEmptyString(value.lastName, 60) &&
        isNonEmptyString(value.phone, 25) &&
        isNonEmptyString(value.city, 80) &&
        isNonEmptyString(value.address, 120) &&
        ['femenino', 'masculino', 'otro'].includes(value.gender)
}

app.use(express.json({ limit: '100kb' }))

function createCollectionRoutes(collectionName, isValid) {
    const route = `/api/${collectionName}`

    app.get(route, (req, res) => {
        res.json(data[collectionName])
    })

    app.post(route, (req, res) => {
        if (!isValid(req.body)) {
            return res.status(400).json({ error: 'Los datos enviados no son válidos.' })
        }

        const item = { ...req.body, id: randomUUID() }
        saveData({ ...data, [collectionName]: [...data[collectionName], item] })
        res.status(201).json(item)
    })

    app.put(`${route}/:id`, (req, res) => {
        if (!isValid(req.body)) {
            return res.status(400).json({ error: 'Los datos enviados no son válidos.' })
        }

        const index = data[collectionName].findIndex((item) => item.id === req.params.id)
        if (index === -1) {
            return res.status(404).json({ error: 'No se encontró el elemento solicitado.' })
        }

        const item = { ...req.body, id: req.params.id }
        const items = [...data[collectionName]]
        items[index] = item
        saveData({ ...data, [collectionName]: items })
        res.json(item)
    })

    app.delete(`${route}/:id`, (req, res) => {
        const items = data[collectionName].filter((item) => item.id !== req.params.id)
        if (items.length === data[collectionName].length) {
            return res.status(404).json({ error: 'No se encontró el elemento solicitado.' })
        }

        saveData({ ...data, [collectionName]: items })
        res.status(204).end()
    })
}

createCollectionRoutes('tasks', isTask)
createCollectionRoutes('contacts', isContact)

app.get('/api', (req, res) => {
    res.json({
        tasks: '/api/tasks',
        contacts: '/api/contacts'
    })
})

app.use(express.static(path.join(projectRoot, 'inicio')))
app.use('/tareas', express.static(path.join(projectRoot, 'tareas')))
app.use('/contactos', express.static(path.join(projectRoot, 'contactos')))

app.use((req, res) => {
    res.status(404).json({ error: 'La ruta solicitada no existe.' })
})

app.use((error, req, res, next) => {
    console.error('Error al procesar la solicitud:', error)
    if (res.headersSent) {
        return next(error)
    }
    res.status(500).json({ error: 'Ocurrió un error interno al procesar la solicitud.' })
})

app.listen(port, () => {
    console.log(`Aplicación disponible en http://localhost:${port}`)
})
