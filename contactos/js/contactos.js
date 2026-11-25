const contactForm = document.getElementById('contact-form')
const contactList = document.getElementById('contact-list')
const contactCount = document.getElementById('contact-count')
const contactMessage = document.getElementById('contact-message')
const saveContactButton = document.getElementById('save-contact-button')
const cancelEditButton = document.getElementById('cancel-edit-button')
let contacts = []
let editingContactId = null

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
        console.error('No se pudo conectar con la API de contactos.', error)
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

function showContactMessage(message) {
    contactMessage.textContent = message
}

function resetContactForm() {
    contactForm.reset()
    editingContactId = null
    saveContactButton.textContent = 'Guardar contacto'
    cancelEditButton.hidden = true
    showContactMessage('')
}

function createContactAction(label, icon, className, action) {
    const button = document.createElement('button')
    button.className = `contact-action ${className}`
    button.type = 'button'
    button.setAttribute('aria-label', label)
    button.title = label
    button.textContent = icon
    button.addEventListener('click', action)
    return button
}

function renderContacts() {
    contactList.replaceChildren()
    const contactWord = contacts.length === 1 ? 'contacto' : 'contactos'
    contactCount.textContent = `${contacts.length} ${contactWord}`

    if (contacts.length === 0) {
        const emptyItem = document.createElement('li')
        emptyItem.className = 'empty-contacts'
        emptyItem.textContent = 'Todavía no tienes contactos. Agrega el primero usando el formulario.'
        contactList.append(emptyItem)
        return
    }

    contacts.forEach((contact) => {
        const item = document.createElement('li')
        const avatar = document.createElement('span')
        const info = document.createElement('div')
        const name = document.createElement('strong')
        const details = document.createElement('div')
        const phone = document.createElement('span')
        const cityAddress = document.createElement('span')
        const actions = document.createElement('div')

        item.className = 'contact-card'
        avatar.className = 'contact-avatar'
        avatar.setAttribute('aria-hidden', 'true')
        avatar.textContent = contact.gender === 'femenino' ? '👩' : contact.gender === 'masculino' ? '👨' : '🧑'
        info.className = 'contact-info'
        name.className = 'contact-name'
        name.textContent = `${contact.firstName} ${contact.lastName}`
        details.className = 'contact-details'
        phone.textContent = `Teléfono: ${contact.phone}`
        cityAddress.textContent = `${contact.city} · ${contact.address}`
        actions.className = 'contact-actions'
        actions.append(
            createContactAction(`Editar a ${contact.firstName}`, '✏️', 'edit-contact-button', () => editContact(contact)),
            createContactAction(`Eliminar a ${contact.firstName}`, '🗑️', 'delete-contact-button', () => deleteContact(contact))
        )

        details.append(phone, cityAddress)
        info.append(name, details)
        item.append(avatar, info, actions)
        contactList.append(item)
    })
}

function editContact(contact) {
    contactForm.elements.firstName.value = contact.firstName
    contactForm.elements.lastName.value = contact.lastName
    contactForm.elements.phone.value = contact.phone
    contactForm.elements.city.value = contact.city
    contactForm.elements.address.value = contact.address

    const genderInput = [...contactForm.querySelectorAll('input[name="gender"]')]
        .find((input) => input.value === contact.gender)
    if (genderInput) {
        genderInput.checked = true
    }

    editingContactId = contact.id
    saveContactButton.textContent = 'Guardar cambios'
    cancelEditButton.hidden = false
    showContactMessage('')
    contactForm.elements.firstName.focus()
}

async function deleteContact(contact) {
    if (!window.confirm(`¿Eliminar a ${contact.firstName} ${contact.lastName} de tus contactos?`)) {
        return
    }

    try {
        await requestApi(`/api/contacts/${encodeURIComponent(contact.id)}`, { method: 'DELETE' })
        contacts = contacts.filter((savedContact) => savedContact.id !== contact.id)
        if (editingContactId === contact.id) {
            resetContactForm()
        }
        renderContacts()
        showContactMessage('Contacto eliminado.')
    } catch (error) {
        showContactMessage(error.message)
    }
}

contactForm.addEventListener('submit', async (event) => {
    event.preventDefault()

    const wasEditing = Boolean(editingContactId)
    const formData = new FormData(contactForm)
    const contact = {
        firstName: formData.get('firstName').trim(),
        lastName: formData.get('lastName').trim(),
        phone: formData.get('phone').trim(),
        city: formData.get('city').trim(),
        address: formData.get('address').trim(),
        gender: formData.get('gender')
    }

    try {
        const savedContact = await requestApi(
            wasEditing ? `/api/contacts/${encodeURIComponent(editingContactId)}` : '/api/contacts',
            {
                method: wasEditing ? 'PUT' : 'POST',
                body: JSON.stringify(contact)
            }
        )
        if (wasEditing) {
            contacts = contacts.map((saved) => saved.id === savedContact.id ? savedContact : saved)
        } else {
            contacts = [...contacts, savedContact]
        }

        renderContacts()
        resetContactForm()
        showContactMessage(wasEditing ? 'Cambios guardados.' : 'Contacto guardado.')
        contactForm.elements.firstName.focus()
    } catch (error) {
        showContactMessage(error.message)
    }
})

cancelEditButton.addEventListener('click', resetContactForm)

async function loadContacts() {
    try {
        contacts = await requestApi('/api/contacts')
        renderContacts()
    } catch (error) {
        renderContacts()
        showContactMessage(`No se pudieron cargar los contactos: ${error.message}`)
    }
}

loadContacts()
