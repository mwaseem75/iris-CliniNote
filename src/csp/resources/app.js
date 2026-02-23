// app.js - Clinical Application

// Check authentication
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
            { id: 'startdate', label: 'Start Date *', type: 'date', required: true },
            { id: 'enddate', label: 'End Date', type: 'date' },
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
            { id: 'episode', label: 'Episode ID *', type: 'search-select', required: true },
            { id: 'doctor', label: 'Doctor *', type: 'text', required: true },
            { id: 'content', label: 'Content *', type: 'textarea', required: true }
        ]
    },
    vectorSearch: {
        title: 'Vector Search',
        noGrid: true
    }
};

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

        // Clean up previous content & buttons
        container.innerHTML = '';
        const oldAddBtn = document.getElementById('addBtn');
        if (oldAddBtn) oldAddBtn.remove();
        const oldSearchGroup = document.querySelector('.input-group');
        if (oldSearchGroup && currentEntity !== 'vectorSearch') oldSearchGroup.remove();

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

        // Show loading
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
        const dynamicColumns = await colRes.json();
        dynamicColumns.forEach(col => {
            col.editable = false; // force all read-only
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
            cellEdited: async function(cell) {
                const rowData = cell.getRow().getData();
                try {
                    const r = await fetch(`${ENTITIES[currentEntity].baseUrl}/${rowData.id}`, {
                        method: 'PUT',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify(rowData)
                    });
                    if (!r.ok) throw new Error('Update failed');
                    table.setData(ENTITIES[currentEntity].listUrl);
                    showToast('success', 'Record updated');
                } catch (err) {
                    showToast('danger', 'Update failed: ' + err.message);
                    cell.restoreOldValue();
                }
            }
        });

        // Attach double-click edit
        table.on("rowDblClick", function(e, row) {
            openDialog(true, row.getData());
        });

        // Main grid search (single clean version)
        const searchInput = document.getElementById('searchInput');
        const clearBtn = document.getElementById('clearSearchBtn');

        if (searchInput && clearBtn && table) {
            console.log("Main grid search attached");

            searchInput.value = '';

            searchInput.addEventListener('input', () => {
                clearTimeout(window.gridSearchTimer);
                window.gridSearchTimer = setTimeout(() => {
                    const term = searchInput.value.trim().toLowerCase();
                    if (term === '') {
                        table.clearFilter();
                    } else {
                        table.setFilter("all", "like", term);
                    }
                }, 300);
            });

            clearBtn.addEventListener('click', () => {
                searchInput.value = '';
                table.clearFilter();
                searchInput.focus();
            });
        }

        // Rebuild dialog
        await setupDialog();

        // Add new Add button
        const addBtn = document.createElement('button');
        addBtn.id = 'addBtn';
        addBtn.textContent = `Add New ${ENTITIES[currentEntity].title}`;
        addBtn.className = 'btn btn-primary';
        addBtn.onclick = () => openDialog(false);
        document.querySelector('.d-flex.justify-content-between').appendChild(addBtn);

    } catch (err) {
        console.error("loadGrid error:", err);
        document.getElementById('gridContainer').innerHTML = `<div class="alert alert-danger m-4">Error: ${err.message}</div>`;
    }
}

async function loadEpisodesIntoDropdown(selectEl) {
    try {
        // Fetch all episodes from your REST API
        const response = await fetch('/CliniNote/episodes');
        if (!response.ok) {
            throw new Error(`Failed to load episodes: ${response.status}`);
        }

        const episodes = await response.json();

        // Clear existing options
        selectEl.innerHTML = '<option value="">Select or search episode...</option>';

        // Add each episode as an option
        episodes.forEach(episode => {
            const option = document.createElement('option');
            option.value = episode.id;  // store episode ID as value

            // Show useful info (adjust fields to match your Episode class)
            // Example: ID - Start Date - Type - (Patient if available)
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
            body: JSON.stringify({ query, limit: 10 })
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
        } else if (field.type === 'select' || field.type === 'search-select') {
            input = document.createElement('select');
            input.className = field.type === 'search-select' ? 'form-select tom-select-patient' : 'form-select';
            input.id = field.id;

            // Placeholder
            const placeholder = document.createElement('option');
            placeholder.value = '';
            placeholder.textContent = field.type === 'search-select' ? 'Search or select patient...' : 'Select';
            input.appendChild(placeholder);

            // Static options if any (e.g. Type field)
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

        // Assign ID and append
        if (input) {
            input.id = field.id;
            dialogContent.appendChild(input);
        }
    });


    // Load episodes for Note forms
    if (currentEntity === 'notes') {
        const episodeSelect = document.getElementById('episode');
        if (episodeSelect) {
            console.log("Episode select found, loading episodes...");
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
                console.log("Tom Select initialized successfully for episodes");
            } catch (tsErr) {
                console.error("Tom Select failed to initialize for episodes:", tsErr);
            }
        } else {
            console.error("Episode select element not found after building form");
        }
    }
    // Load patients for Episode forms (after all fields built)
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
                console.log("Tom Select ready");
            } catch (tsErr) {
                console.error("Tom Select init failed:", tsErr);
            }
        }
    }
}

// Dialog open
function openDialog(isEdit = false, rowData = {}) {
    document.getElementById('dialogHeader').textContent = isEdit 
        ? ENTITIES[currentEntity].dialogTitleEdit 
        : ENTITIES[currentEntity].dialogTitleAdd;

    const editIdEl = document.getElementById('editId');
    if (editIdEl) editIdEl.value = isEdit ? (rowData.id || '') : '';

    ENTITIES[currentEntity].fields.forEach(field => {
        const el = document.getElementById(field.id);
        if (el) {
            let value = isEdit ? (rowData[field.id] || '') : (field.default || '');
            el.value = value;
            el.classList.remove('is-invalid');
        }
    });

    // Pre-select in Tom Select for searchable fields (edit mode)
    if (isEdit) {
        // For Episode in Notes
        if (currentEntity === 'notes' && rowData.episode) {
            const episodeSelect = document.getElementById('episode');
            if (episodeSelect && episodeSelect.tomselect) {
                episodeSelect.tomselect.setValue(rowData.episode);
                console.log("Pre-selected episode ID on edit:", rowData.episode);
            }
        }

        // For Patient in Episodes (already added earlier, keeping for completeness)
        if (currentEntity === 'episodes' && rowData.patient) {
            const patientSelect = document.getElementById('patient');
            if (patientSelect && patientSelect.tomselect) {
                patientSelect.tomselect.setValue(rowData.patient);
                console.log("Pre-selected patient ID on edit:", rowData.patient);
            }
        }
    }

    crudModal.show();
}

// Save handler
document.getElementById('saveBtn').onclick = async () => {
    const id = document.getElementById('editId')?.value.trim() || '';
    const isEdit = !!id;

    const data = {};
    let valid = true;

    ENTITIES[currentEntity].fields.forEach(field => {
        const el = document.getElementById(field.id);
        if (el) {
            if (field.required && !el.value.trim()) {
                el.classList.add('is-invalid');
                valid = false;
            } else {
                el.classList.remove('is-invalid');
                data[field.id] = el.value.trim() || null;
            }
        }
    });

    if (!valid) {
        alert('Please fill all required fields');
        return;
    }

    try {
        let url = ENTITIES[currentEntity].baseUrl;
        let method = 'POST';
        if (isEdit) {
            url += `/${id}`;
            method = 'PUT';
        }

        const r = await fetch(url, {
            method,
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        });

        if (!r.ok) {
            const err = await r.json().catch(() => ({}));
            throw new Error(err.error || `HTTP ${r.status}`);
        }

        table.setData(ENTITIES[currentEntity].listUrl);
        crudModal.hide();
        showToast('success', 'Saved successfully');
    } catch (err) {
        showToast('danger', 'Save failed: ' + err.message);
    }
};

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