const contactForm = document.getElementById('contact-form')
const contactList = document.getElementById('contact-list')
const contactCount = document.getElementById('contact-count')
const contactMessage = document.getElementById('contact-message')
const saveContactButton = document.getElementById('save-contact-button')
const cancelEditButton = document.getElementById('cancel-edit-button')
const contactStorageKey = 'mi-semana-contactos'
let contacts = []
let editingContactId = null

function showContactMessage(message) {
    contactMessage.textContent = message
}

function persistContacts() {
    try {
        localStorage.setItem(contactStorageKey, JSON.stringify(contacts))
        return true
    } catch (error) {
        console.error('No se pudieron guardar los contactos en este navegador.', error)
        showContactMessage('No se pudieron guardar los cambios en este navegador.')
        return false
    }
}

function loadContacts() {
    try {
        const savedContacts = localStorage.getItem(contactStorageKey)
        if (!savedContacts) {
            return
        }

        const parsedContacts = JSON.parse(savedContacts)
        if (!Array.isArray(parsedContacts)) {
            throw new Error('El formato guardado de contactos no es válido.')
        }

        contacts = parsedContacts.filter((contact) =>
            contact &&
            typeof contact.id === 'string' &&
            typeof contact.firstName === 'string' &&
            typeof contact.lastName === 'string' &&
            typeof contact.phone === 'string' &&
            typeof contact.city === 'string' &&
            typeof contact.address === 'string' &&
            ['femenino', 'masculino', 'otro'].includes(contact.gender)
        )
    } catch (error) {
        console.error('No se pudieron cargar los contactos guardados.', error)
        showContactMessage('No se pudieron cargar los contactos guardados.')
    }
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

function deleteContact(contact) {
    if (!window.confirm(`¿Eliminar a ${contact.firstName} ${contact.lastName} de tus contactos?`)) {
        return
    }

    const previousContacts = contacts
    contacts = contacts.filter((savedContact) => savedContact.id !== contact.id)
    if (persistContacts()) {
        if (editingContactId === contact.id) {
            resetContactForm()
        }
        renderContacts()
        showContactMessage('Contacto eliminado.')
    } else {
        contacts = previousContacts
        renderContacts()
    }
}

contactForm.addEventListener('submit', (event) => {
    event.preventDefault()

    const wasEditing = Boolean(editingContactId)
    const formData = new FormData(contactForm)
    const contact = {
        id: editingContactId || `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        firstName: formData.get('firstName').trim(),
        lastName: formData.get('lastName').trim(),
        phone: formData.get('phone').trim(),
        city: formData.get('city').trim(),
        address: formData.get('address').trim(),
        gender: formData.get('gender')
    }
    const previousContacts = contacts

    if (editingContactId) {
        contacts = contacts.map((savedContact) => savedContact.id === editingContactId ? contact : savedContact)
    } else {
        contacts = [...contacts, contact]
    }

    if (!persistContacts()) {
        contacts = previousContacts
        return
    }

    renderContacts()
    resetContactForm()
    showContactMessage(wasEditing ? 'Cambios guardados.' : 'Contacto guardado.')
    contactForm.elements.firstName.focus()
})

cancelEditButton.addEventListener('click', resetContactForm)

loadContacts()
renderContacts()
