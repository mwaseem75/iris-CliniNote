// app.js - Clinical Application 
// init Global variables
window.noteValue = '';

if (!localStorage.getItem('authToken')) {
    window.location.href = 'login.html';
}

const ENTITIES = {
    patients: {
        baseUrl: '/CliniNote/patient',
        listUrl: '/CliniNote/patients',
        columnsUrl: '/CliniNote/patients/columns',
        title: 'Patients',
        dialogTitleAdd: 'Add New Patient',
        dialogTitleEdit: 'Edit Patient',
        fields: [
            { id: 'name', label: 'Name *', type: 'text', required: true },
            { id: 'dob', label: 'Date of Birth', type: 'date' },
            { id: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female', 'Other'] },
            { id: 'street', label: 'Street', type: 'text' },
            { id: 'city', label: 'City', type: 'text' },
            { id: 'country', label: 'Country', type: 'text', default: 'USA' }
        ]
    },
    episodes: {
        baseUrl: '/CliniNote/episode',
        listUrl: '/CliniNote/episodes',
        columnsUrl: '/CliniNote/episodes/columns',
        title: 'Episodes',
        dialogTitleAdd: 'Add New Episode',
        dialogTitleEdit: 'Edit Episode',
        fields: [
            { id: 'patient', label: 'Patient *', type: 'search-select', required: true },
            { id: 'startDate', label: 'Start Date *', type: 'date', required: true },
            { id: 'endDate', label: 'End Date', type: 'date' },
            { id: 'type', label: 'Type', type: 'select', options: ['Outpatient', 'Inpatient', 'Emergency', 'Consultation', 'Surgery', 'Follow-up'] },
            { id: 'reason', label: 'Reason', type: 'textarea' }
        ]
    },
    notes: {
        baseUrl: '/CliniNote/note',
        listUrl: '/CliniNote/notes',
        columnsUrl: '/CliniNote/notes/columns',
        title: 'Notes',
        dialogTitleAdd: 'Add New Note',
        dialogTitleEdit: 'Edit Note',
        fields: [
            { id: 'episode', label: 'Episode *', type: 'search-select', required: true },
            { id: 'doctor', label: 'Doctor *', type: 'text', required: true },
            { id: 'content', label: 'Content *', type: 'textarea', required: true }
        ]
    },
    vectorSearch: {
        title: 'Patient Notes Semantic Search',
        noGrid: true
    },
    users: {
        baseUrl: '/CliniNote/user',
        listUrl: '/CliniNote/users',
        columnsUrl: '/CliniNote/users/columns',
        title: 'Users',
        dialogTitleAdd: 'Add New User',
        dialogTitleEdit: 'Edit User',
        fields: [
            { id: 'username', label: 'Username *', type: 'text', required: true },
            { id: 'password', label: 'Password', type: 'password', required: true, editRequired: false },
            { id: 'fullname', label: 'Full Name', type: 'text' },    
            { id: 'email', label: 'Email', type: 'text' },        
            { id: 'role', label: 'Role *', type: 'select', options: ['Admin', 'Doctor', 'Nurse', 'Viewer'], required: true },
            { id: 'active', label: 'Active', type: 'checkbox', default: true },
        ]
    },
    roles: {
        baseUrl: '/CliniNote/role',
        listUrl: '/CliniNote/roles',
        columnsUrl: '/CliniNote/roles/columns',
        title: 'Roles',
        dialogTitleAdd: 'Add New Role',
        dialogTitleEdit: 'Edit Role',
        fields: [
            { id: 'name', label: 'Role Name *', type: 'text', required: true },
            { id: 'description', label: 'Description', type: 'textarea' },
            {
                id: 'permissions',
                label: 'Permissions *',
                type: 'multi-select',
                required: true,
                options: [
                    'Patient:Read', 'Patient:Write', 'Patient:Delete',
                    'Episode:Read', 'Episode:Write', 'Episode:Delete',
                    'Note:Read', 'Note:Write', 'Note:Delete',
                    'User:Read', 'User:Write', 'User:Delete',
                    'Role:Read', 'Role:Write', 'Role:Delete'
                ]
            },
            { id: 'active', label: 'Active', type: 'checkbox', default: true }
        ]
    }
};

//default to patients view and initialize Tabulator instance variable
let currentEntity = 'patients';
let table = null;

// Bootstrap modal & toast
const crudModal = new bootstrap.Modal(document.getElementById('crudModal'));
const toastContainer = document.getElementById('toastContainer');

// Switch sidebar menu items
document.querySelectorAll('.nav-link[data-entity]').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelectorAll('.nav-link').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentEntity = btn.dataset.entity;
        document.getElementById('entityTitle').textContent = ENTITIES[currentEntity]?.title || 'View';
        loadGrid();
    });
});

async function loadGrid() {
    try {
        const container = document.getElementById('gridContainer');
        if (!container) {
            console.error("gridContainer not found");
            return;
        }

        // Clear only grid content
        container.innerHTML = '';

        // Remove old Add button
        const oldAddBtn = document.getElementById('addBtn');
        if (oldAddBtn) oldAddBtn.remove();

        // Hide/show search bar
        const searchGroup = document.getElementById('gridSearchGroup');
        if (searchGroup) {
            searchGroup.style.display = (currentEntity === 'vectorSearch') ? 'none' : 'flex';
        }

        // Special view: Vector Search
        if (currentEntity === 'vectorSearch') {
            renderVectorSearchUI();
            return;
        }

        // Unknown entity
        if (!ENTITIES[currentEntity]) {
            container.innerHTML = '<div class="alert alert-warning m-4">Unknown view</div>';
            document.getElementById('entityTitle').textContent = 'Error';
            return;
        }

        // Loading spinner
        container.innerHTML = `
            <div class="text-center mt-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-2">Loading ${ENTITIES[currentEntity].title} data...</p>
            </div>
        `;

        // Load columns
        const colRes = await fetch(ENTITIES[currentEntity].columnsUrl);
        if (!colRes.ok) throw new Error(`Columns load failed: ${colRes.status}`);
        let dynamicColumns = await colRes.json();

        // Force read-only + friendly formatters
        dynamicColumns.forEach(col => {
            col.editable = false;
            // Special handling for Content column in Notes
            if (currentEntity === 'notes' && col.field === 'content') {
                col.width = 600;               // wider column (adjust 500–800 as needed)
                col.formatter = function(cell) {
                    const value = cell.getValue() || '';
                    // Allow text wrapping + show more lines
                    return `<div style="white-space: normal; word-wrap: break-word; max-height: 120px; overflow: auto;">${value}</div>`;
                };
                col.title = "Content";  // optional rename
            }
            if (col.field === 'patient') {
                col.formatter = function(cell) {
                    const rowData = cell.getRow().getData();
                    const name = rowData.patientName || 'Unknown';
                    const id = rowData.patient || 'N/A';
                    return `${name} (ID: ${id})`;
                };
                col.title = "Patient";
            }
            if (col.field === 'episode') {
                col.formatter = function(cell) {
                    const rowData = cell.getRow().getData();
                    return rowData.episodeLabel || `Episode #${rowData.episode}`;
                };
                col.title = "Episode";
            }
        });

        // Create Tabulator
        if (table) table.destroy();
        table = new Tabulator("#gridContainer", {
            height: "100%",
            layout: "fitColumns",
            selectable: 1,
            pagination: true,
            paginationSize: 15,
            paginationSizeSelector: [10, 15, 25, 50],
            ajaxURL: ENTITIES[currentEntity].listUrl,
            ajaxConfig: "GET",
            ajaxContentType: "json",
            columns: dynamicColumns,
            // No cellEdited → read-only grid
        });

        // Double-click edit (skip for Roles)
        table.on("rowDblClick", function(e, row) {
            if (currentEntity === 'roles') {
                showToast('info', 'Edit Roles via Add/Edit button only');
                return;
            }
            openDialog(true, row.getData());
        });

        // Attach grid search (only for normal grids)
        attachGridSearch();

        // Rebuild dialog
        await setupDialog();

        // Re-create Add button (skip for Roles & Vector Search)
        if (currentEntity !== 'roles' && currentEntity !== 'vectorSearch') {
            const addBtn = document.createElement('button');
            addBtn.id = 'addBtn';
            addBtn.textContent = `Add New ${ENTITIES[currentEntity].title}`;
            addBtn.className = 'btn btn-primary';
            addBtn.onclick = () => openDialog(false);
            document.querySelector('.d-flex.justify-content-between').appendChild(addBtn);
        }

    } catch (err) {
        console.error("loadGrid error:", err);
        document.getElementById('gridContainer').innerHTML = `<div class="alert alert-danger m-4">Error: ${err.message}</div>`;
    }
}
// close top patients panel (if implemented as a side panel instead of modal)
function closeTopPatientsPanel() {
    const panel = document.getElementById('topPatientsPanel');
    if (panel) panel.style.transform = 'translateX(100%)';
}
// Reusable grid search attachment
function attachGridSearch() {
    const input = document.getElementById('searchInput');
    const clear = document.getElementById('clearSearchBtn');

    if (!input || !clear || !table) {
        console.warn("Grid search elements or table missing");
        return;
    }

    console.log("Attaching grid search listeners");

    input.value = '';

    input.addEventListener('input', () => {
        clearTimeout(window.gridTimer);
        window.gridTimer = setTimeout(() => {
            const term = input.value.trim().toLowerCase();
            console.log("Search term:", term);

            if (term === '') {
                table.clearFilter();
            } else {
                table.setFilter(function(data, filterParams) {
                    return Object.values(data).some(value => {
                        if (value == null) return false;
                        return String(value).toLowerCase().includes(term);
                    });
                });
            }
        }, 300);
    });

    clear.addEventListener('click', () => {
        input.value = '';
        table.clearFilter();
        input.focus();
    });
}

// Patient dropdown loading
async function loadPatientsIntoDropdown(selectEl) {
    try {
        const response = await fetch('/CliniNote/patients');
        if (!response.ok) throw new Error(`Failed to load patients: ${response.status}`);

        const patients = await response.json();

        selectEl.innerHTML = '<option value="">Select or search patient...</option>';

        patients.forEach(patient => {
            const option = document.createElement('option');
            option.value = patient.id;
            option.textContent = `${patient.name || 'Unnamed'} (ID: ${patient.id})${patient.dob ? ' - DOB: ' + patient.dob : ''}`;
            selectEl.appendChild(option);
        });

        console.log(`Loaded ${patients.length} patients into dropdown`);

    } catch (err) {
        console.error('Error loading patients:', err);
        selectEl.innerHTML = '<option value="">Error loading patients</option>';
    }
}

// Episode dropdown loading
async function loadEpisodesIntoDropdown(selectEl) {
    try {
        const response = await fetch('/CliniNote/episodes');
        if (!response.ok) throw new Error(`Failed to load episodes: ${response.status}`);

        const episodes = await response.json();

        selectEl.innerHTML = '<option value="">Select or search episode...</option>';

        episodes.forEach(episode => {
            const option = document.createElement('option');
            option.value = episode.id;

            let label = `Episode #${episode.id}`;
            if (episode.startDate) label += ` - ${episode.startDate}`;
            if (episode.type) label += ` (${episode.type})`;
            if (episode.patientName) label += ` - Patient: ${episode.patientName}`;
            else if (episode.patient) label += ` - Patient ID: ${episode.patient}`;

            option.textContent = label;
            selectEl.appendChild(option);
        });

        console.log(`Loaded ${episodes.length} episodes into dropdown`);

    } catch (err) {
        console.error('Error loading episodes:', err);
        selectEl.innerHTML = '<option value="">Error loading episodes</option>';
    }
}

// Vector search UI
function renderVectorSearchUI() {
    const container = document.getElementById('gridContainer');
    container.innerHTML = `
        <div class="card shadow-sm border-0">
            <div class="card-header bg-primary text-white">
                <h5 class="mb-0">Semantic Search in Clinical Notes</h5>
            </div>
            <div class="card-body">
                <div class="input-group input-group-lg mb-4">
                    <span class="input-group-text bg-white border-end-0">
                        <i class="bi bi-search text-muted"></i>
                    </span>
                    <input type="text" id="vectorQuery" class="form-control border-start-0" placeholder="e.g. chest pain after spicy meals...">
                    <button class="btn btn-primary" id="vectorSearchBtn">
                        <i class="bi bi-search me-1"></i> Search
                    </button>
                </div>
                <div id="vectorResults" class="list-group mt-3"></div>
            </div>
        </div>
    `;

    document.getElementById('vectorSearchBtn').addEventListener('click', performVectorSearch);
    document.getElementById('vectorQuery').addEventListener('keypress', e => {
        if (e.key === 'Enter') performVectorSearch();
    });
}
//vector search execution
async function performVectorSearch() {
    const query = document.getElementById('vectorQuery').value.trim();
    const resultsDiv = document.getElementById('vectorResults');

    if (!query) {
        resultsDiv.innerHTML = '<div class="alert alert-info">Please enter a search query.</div>';
        return;
    }

    resultsDiv.innerHTML = '<div class="text-center py-5">Searching...</div>';

    try {
        const res = await fetch('/CliniNote/notes/vector-search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, limit: 10, noteid:0 })
        });

        const data = await res.json();

        if (!res.ok) throw new Error(data.error || 'Search failed');

        if (data.length === 0) {
            resultsDiv.innerHTML = '<div class="alert alert-warning">No similar notes found.</div>';
            return;
        }

        let html = '';
        data.forEach(item => {
            const simValue = Number(item.similarity);
            const similarity = isNaN(simValue) ? 'N/A' : simValue.toFixed(4);
            const simClass = isNaN(simValue) 
                ? 'text-muted' 
                : (simValue > 0.9 ? 'text-success-strong' : 'text-warning-strong');

            html += `
                <div class="list-group-item list-group-item-action px-3 py-3">
                    <div class="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3">
                        <div class="flex-grow-1">
                            <h6 class="mb-1">Note #${item.id}</h6>
                            <p class="mb-2 text-muted text-truncate">${item.content.substring(0, 180)}${item.content.length > 180 ? '...' : ''}</p>
                        </div>
                        <div class="text-end d-flex flex-column align-items-end gap-2" style="min-width: 140px;">
                            <small class="${simClass} fw-bold">Similarity: ${similarity}</small>
                            <button class="btn btn-sm btn-outline-primary" onclick="openNote(${item.id})">
                                <i class="bi bi-eye me-1"></i> View Note
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });

        resultsDiv.innerHTML = html;

    } catch (err) {
        resultsDiv.innerHTML = `<div class="alert alert-danger">Error: ${err.message}</div>`;
    }
}
// View full note content in modal
async function openNote(noteId) {
    try {
        const res = await fetch(`/CliniNote/note/${noteId}`);
        if (!res.ok) throw new Error('Failed to load note');

        const note = await res.json();

        document.getElementById('dialogHeader').textContent = `View Note #${note.id || noteId}`;

        document.getElementById('dialogContent').innerHTML = `
            <div class="mb-3">
                <label class="form-label fw-bold">Doctor</label>
                <input type="text" class="form-control" value="${note.Doctor || note.doctor || 'N/A'}" readonly>
            </div>
            <div class="mb-3">
                <label class="form-label fw-bold">Note Date</label>
                <input type="text" class="form-control" value="${note.NoteDate || note.notedate || 'N/A'}" readonly>
            </div>
            <div class="mb-3">
                <label class="form-label fw-bold">Episode ID</label>
                <input type="text" class="form-control" value="${note.Episode || note.episode || 'N/A'}" readonly>
            </div>
            <div class="mb-4">
                <label class="form-label fw-bold">Content</label>
                <textarea class="form-control" rows="10" readonly>${note.Content || note.content || 'No content available'}</textarea>
            </div>
            <div class="text-end">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
            </div>
        `;

        crudModal.show();

    } catch (err) {
        alert('Error loading note: ' + err.message);
    }
}

// Display current user
function showCurrentUser() {
    const user = JSON.parse(localStorage.getItem('user'));
    const userEl = document.getElementById('currentUser');
    if (user && user.fullName) {
        userEl.textContent = user.fullName;
        userEl.classList.remove('text-muted');
        userEl.classList.add('text-dark', 'fw-bold');
    } else {
        userEl.textContent = 'Not logged in';
    }
}

// Dialog setup
async function setupDialog() {
    dialogContent.innerHTML = '<input type="hidden" id="editId" value="">';

    ENTITIES[currentEntity].fields.forEach(field => {
        // Label
        const label = document.createElement('label');
        label.htmlFor = field.id;
        label.textContent = field.label;
        label.className = 'form-label';
        dialogContent.appendChild(label);

        let input;
        if (field.type === 'textarea') {
            input = document.createElement('textarea');
            input.rows = 4;
            input.className = 'form-control';
        } else if (field.type === 'checkbox') {
            input = document.createElement('input');
            input.type = 'checkbox';
            input.className = 'form-check-input';
            input.id = field.id;
            if (field.default) input.checked = field.default;

            const wrapper = document.createElement('div');
            wrapper.className = 'form-check';
            wrapper.appendChild(input);
            wrapper.appendChild(label.cloneNode(true));
            dialogContent.appendChild(wrapper);
            return;
        } else if (field.type === 'multi-select') {
            input = document.createElement('select');
            input.id = field.id;
            input.multiple = true;
            input.className = 'form-control tom-select-multi';

            if (field.options) {
                field.options.forEach(optVal => {
                    const o = document.createElement('option');
                    o.value = optVal;
                    o.textContent = optVal;
                    input.appendChild(o);
                });
            }

            dialogContent.appendChild(input);
        } else if (field.type === 'select' || field.type === 'search-select') {
            input = document.createElement('select');
            input.className = field.type === 'search-select' ? 'form-select tom-select-patient' : 'form-select';
            input.id = field.id;

            const placeholder = document.createElement('option');
            placeholder.value = '';
            placeholder.textContent = field.type === 'search-select' ? 'Search or select...' : 'Select';
            input.appendChild(placeholder);

            if (field.options) {
                field.options.forEach(optVal => {
                    const o = document.createElement('option');
                    o.value = optVal;
                    o.textContent = optVal;
                    input.appendChild(o);
                });
            }
        } else {
            input = document.createElement('input');
            input.type = field.type || 'text';
            input.className = 'form-control';
            if (field.required) input.required = true;
            if (field.default) input.value = field.default;
        }

        if (input && field.id !== 'active') { // checkbox already appended via wrapper
            input.id = field.id;
            dialogContent.appendChild(input);
        }
    });

    // Load episodes for Notes
    if (currentEntity === 'notes') {
        const episodeSelect = document.getElementById('episode');
        if (episodeSelect) {
            console.log("Loading episodes for Note form...");
            await loadEpisodesIntoDropdown(episodeSelect);

            console.log("Initializing Tom Select for episodes...");
            try {
                new TomSelect(episodeSelect, {
                    maxItems: 1,
                    placeholder: 'Search or select episode...',
                    searchField: ['text'],
                    sortField: 'text',
                    create: false,
                    render: {
                        option: function(data, escape) {
                            return `<div>${escape(data.text)}</div>`;
                        },
                        item: function(data, escape) {
                            return `<div>${escape(data.text)}</div>`;
                        }
                    }
                });
                console.log("Tom Select ready for episodes");
            } catch (tsErr) {
                console.error("Tom Select init failed for episodes:", tsErr);
            }
        }
    }

    // Load patients for Episodes
    if (currentEntity === 'episodes') {
        const patientSelect = document.getElementById('patient');
        if (patientSelect) {
            console.log("Loading patients for Episode form...");
            await loadPatientsIntoDropdown(patientSelect);

            console.log("Initializing Tom Select...");
            try {
                new TomSelect(patientSelect, {
                    maxItems: 1,
                    placeholder: 'Search or select patient...',
                    searchField: ['text'],
                    sortField: 'text',
                    create: false,
                    render: {
                        option: function(data, escape) {
                            return `<div>${escape(data.text)}</div>`;
                        },
                        item: function(data, escape) {
                            return `<div>${escape(data.text)}</div>`;
                        }
                    }
                });
                console.log("Tom Select ready for patient");
            } catch (tsErr) {
                console.error("Tom Select init failed for patient:", tsErr);
            }
        }
    }
}

// Initialize Tom Select for multi-select fields
document.querySelectorAll('.tom-select-multi').forEach(select => {
    try {
        new TomSelect(select, {
            plugins: ['remove_button'],
            maxItems: null,
            placeholder: 'Select permissions...',
            searchField: ['text'],
            sortField: 'text',
            create: false,
            render: {
                option: function(data, escape) {
                    return `<div>${escape(data.text)}</div>`;
                },
                item: function(data, escape) {
                    return `<div class="item">${escape(data.text)}</div>`;
                }
            }
        });
        console.log("Tom Select multi initialized for", select.id);
    } catch (err) {
        console.error("Tom Select multi failed:", err);
    }
});

// Dialog open
function openDialog(isEdit = false, rowData = {}) {
    document.getElementById('dialogHeader').textContent = isEdit 
        ? ENTITIES[currentEntity].dialogTitleEdit 
        : ENTITIES[currentEntity].dialogTitleAdd;

    const editIdEl = document.getElementById('editId');
    if (editIdEl) editIdEl.value = isEdit ? (rowData.id || '') : '';
    window.noteValue = rowData.id;
    ENTITIES[currentEntity].fields.forEach(field => {
        const el = document.getElementById(field.id);
        if (el) {
            let value = isEdit ? (rowData[field.id] || '') : (field.default || '');
            el.value = value;
            //assign note id in global variable
            
            el.classList.remove('is-invalid');

            if (field.id === 'password' && isEdit) {
                el.placeholder = 'Leave blank to keep current password';
                el.value = '';
            }

            if (field.type === 'multi-select' && isEdit) {
                const values = value.split(',').map(v => v.trim()).filter(v => v);
                if (el.tomselect) {
                    el.tomselect.setValue(values);
                } else {
                    el.value = values.join(',');
                }
            }
        }
    });

    if (isEdit) {
        if (currentEntity === 'notes' && rowData.episode) {
            const episodeSelect = document.getElementById('episode');
            if (episodeSelect && episodeSelect.tomselect) {
                episodeSelect.tomselect.setValue(rowData.episode);
            }
        }
        if (currentEntity === 'episodes' && rowData.patient) {
            const patientSelect = document.getElementById('patient');
            if (patientSelect && patientSelect.tomselect) {
                patientSelect.tomselect.setValue(rowData.patient);
            }
        }
    }

    
    // Add Delete button only in edit mode
    const footer = document.querySelector('#crudModal .modal-footer');
    if (footer) {
        footer.innerHTML = '';

        // Close
        const closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.className = 'btn btn-secondary';
        closeBtn.textContent = 'Close';
        closeBtn.setAttribute('data-bs-dismiss', 'modal');
        footer.appendChild(closeBtn);

        // Save
        const saveBtn = document.createElement('button');
        saveBtn.type = 'button';
        saveBtn.className = 'btn btn-primary ms-2';
        saveBtn.textContent = 'Save';
        saveBtn.id = 'saveBtn';
        footer.appendChild(saveBtn);

        // Delete - only in edit mode
        if (isEdit && currentEntity !== 'users') { 
            const deleteBtn = document.createElement('button');
            deleteBtn.type = 'button';
            deleteBtn.className = 'btn btn-danger ms-auto';
            deleteBtn.textContent = 'Delete';
            deleteBtn.onclick = () => confirmAndDelete(rowData.id);
            footer.appendChild(deleteBtn);
        }
        // Top 5 Matching Patients button - only for Notes
        if (currentEntity === 'notes') {
            const topPatientsBtn = document.createElement('button');
            topPatientsBtn.type = 'button';
            topPatientsBtn.className = 'btn btn-info ms-2';
            topPatientsBtn.innerHTML = '<i class="bi bi-search-heart me-1"></i> Top 5 Similar Patients Notes';
            topPatientsBtn.onclick = findTopMatchingPatients; // ← no arrow function needed
            footer.appendChild(topPatientsBtn);
        }
    }

    crudModal.show();
}

//Top 5 matching patients based on current note content
async function findTopMatchingPatients() {
    const contentEl = document.getElementById('content');
    if (!contentEl || !contentEl.value.trim()) {
        showToast('warning', 'Please enter some note content first');
        return;
    }
    
    const queryText = contentEl.value.trim();
    // Show side panel
    const panel = document.getElementById('topPatientsPanel');
    const contentDiv = document.getElementById('topPatientsContent');
    if (!panel || !contentDiv) return;

    contentDiv.innerHTML = `
        <div class="text-center py-5">
            <div class="spinner-border text-primary" role="status"></div>
            <p class="mt-3">Searching similar patients...</p>
        </div>
    `;
    panel.style.transform = 'translateX(0)';
    
    try {
        const res = await fetch('/CliniNote/notes/vector-search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                query: queryText,
                noteid: window.noteValue,
                limit: 5
            })
        });

        if (!res.ok) throw new Error('Search failed');

        const results = await res.json();

        contentDiv.innerHTML = '';

        if (results.length === 0) {
            contentDiv.innerHTML = '<div class="alert alert-info">No similar patients found</div>';
            return;
        }

        let html = '';
        results.forEach(r => {
            const sim = (r.similarity * 100).toFixed(1);
            html += `
                <div class="list-group-item mb-3 border">
                    <div class="d-flex justify-content-between align-items-center">
                        <strong>Note #${r.id }</strong>
                        <span class="badge bg-success">${sim}% match</span>
                    </div>
                    <p class="mt-2 small text-muted">${r.content}</p>
                </div>
            `;
        });

        contentDiv.innerHTML = html;

    } catch (err) {
        contentDiv.innerHTML = `<div class="alert alert-danger">${err.message}</div>`;
        setTimeout(() => panel.style.transform = 'translateX(100%)', 5000);
    }
}
// Delete confirmation & execution
function confirmAndDelete(id) {
    const entityName = ENTITIES[currentEntity].title.slice(0, -1); // e.g. "User", "Episode"
    if (!confirm(`Are you sure you want to delete this ${entityName}? This cannot be undone.`)) {
        return;
    }

    // Frontend quick check for admin user
    if (currentEntity === 'users') {
        const currentUser = JSON.parse(localStorage.getItem('user'));
        if (currentUser && currentUser.username === 'admin' && id === currentUser.id) {
            showToast('danger', 'Cannot delete the admin user');
            return;
        }
    }

    deleteRecord(id);
}
//delete record function
async function deleteRecord(id) {
    try {
        const url = `${ENTITIES[currentEntity].baseUrl}/${id}`;
        const res = await fetch(url, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error || `Delete failed (HTTP ${res.status})`);
        }

        table.setData(ENTITIES[currentEntity].listUrl);
        crudModal.hide();
        showToast('success', `${ENTITIES[currentEntity].title.slice(0, -1)} deleted successfully`);

    } catch (err) {
        showToast('danger', err.message);
    }
}

// Toast
function showToast(type, message) {
    const toastEl = document.createElement('div');
    toastEl.className = `toast align-items-center text-white bg-${type === 'success' ? 'success' : 'danger'} border-0`;
    toastEl.role = 'alert';
    toastEl.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">${message}</div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    `;
    toastContainer.appendChild(toastEl);
    new bootstrap.Toast(toastEl).show();
    setTimeout(() => toastEl.remove(), 5000);
}

// Logout
function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

// Current user display
function showCurrentUser() {
    const user = JSON.parse(localStorage.getItem('user'));
    const userEl = document.getElementById('currentUser');
    if (user && user.fullName) {
        userEl.textContent = user.fullName;
        userEl.classList.remove('text-muted');
        userEl.classList.add('text-dark', 'fw-bold');
    } else {
        userEl.textContent = 'Not logged in';
    }
}

// Initial load
document.addEventListener('DOMContentLoaded', () => {
    showCurrentUser();
    loadGrid();
});