// app.js - Clinical Application (Simplified, no toggle bar)
// Check if user is logged in
let searchTimer = null;

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
            { id: 'patient', label: 'Patient ID *', type: 'number', required: true },
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
            { id: 'episode', label: 'Episode ID *', type: 'number', required: true },
            { id: 'notedate', label: 'Episode Date *', type: 'date', required: true }, 
            { id: 'doctor', label: 'Doctor *', type: 'text', required: true },
            { id: 'content', label: 'Content *', type: 'textarea', required: true }
        ]
    },
    vectorSearch: {
    title: 'Vector',
    noGrid: true  // tells loadGrid() to skip Tabulator
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
        document.getElementById('entityTitle').textContent = ENTITIES[currentEntity].title ;
        loadGrid();
    });
});

async function loadGrid() {
    try {
        if (table) {
            table.destroy();
            table = null;
        }

        
        document.getElementById('gridContainer').innerHTML = `
            <div class="text-center mt-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-2">Loading ${ENTITIES[currentEntity].title} data...</p>
            </div>
        `;

        
        if (currentEntity === 'vectorSearch') {
            const oldAddBtn = document.getElementById('addBtn');
            if (oldAddBtn) oldAddBtn.remove();
            const oldSearchGroup = document.querySelector('.input-group');
            if (oldSearchGroup) oldSearchGroup.remove();
            renderVectorSearchUI();
            return;
        }
        
        const colRes = await fetch(ENTITIES[currentEntity].columnsUrl);



        if (!colRes.ok) throw new Error(`Columns load failed: ${colRes.status}`);
        const dynamicColumns = await colRes.json();
        
        table = new Tabulator("#gridContainer", {
            height: "100%",
            layout: "fitColumns",
            selectable: 1,
            searchable: true,
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
        
        // === SEARCH FUNCTIONALITY ===
// === SEARCH FUNCTIONALITY (re-attached every grid load) ===

const searchInput = document.getElementById('searchInput');
const clearBtn = document.getElementById('clearSearchBtn');

if (!searchInput || !clearBtn) {
    console.error("Search elements missing in DOM. Check index.html for #searchInput and #clearSearchBtn");
} else {
    console.log("Search input found → attaching listeners");

    // Reset search field on new grid load
    searchInput.value = '';

    // Live filtering with debounce
    searchInput.addEventListener('input', function() {
        console.log("Search input changed:", this.value); // debug

        clearTimeout(window.searchDebounce);
        window.searchDebounce = setTimeout(() => {
            const term = this.value.trim();

            if (term === '') {
                console.log("Clearing filter");
                table.clearFilter();
            } else {
                console.log("Applying filter:", term);
                table.setFilter(function(data, filterParams) {
                    // Global search: check every string value in the row
                    return Object.values(data).some(value => {
                        if (value == null) return false;
                        return String(value).toLowerCase().includes(term.toLowerCase());
                    });
                }, term);
            }
        }, 350); // 350ms debounce to avoid lag
    });

    // Clear button
    clearBtn.addEventListener('click', () => {
        console.log("Clear button clicked");
        searchInput.value = '';
        table.clearFilter();
        searchInput.focus();
    });
}
//////////////////////////
        table.on("rowDblClick", function(e, row) {
            openDialog(true, row.getData());
        });

        setupDialog();

        const oldBtn = document.getElementById('addBtn');
        if (oldBtn) oldBtn.remove();

        const addBtn = document.createElement('button');
        addBtn.id = 'addBtn';
        addBtn.textContent = `Add New ${ENTITIES[currentEntity].title}`;
        addBtn.className = 'btn btn-primary';
        addBtn.onclick = () => openDialog(false);
        document.querySelector('.d-flex.justify-content-between').appendChild(addBtn);

        

    } catch (err) {
        showToast('danger', 'Grid load failed: ' + err.message);
    }
}

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
                    <input type="text" id="vectorQuery" class="form-control border-start-0" placeholder="e.g. chest pain after spicy meals, shortness of breath, recurrent migraine...">
                    <button class="btn btn-primary" id="vectorSearchBtn">
                        <i class="bi bi-search me-1"></i> Search
                    </button>
                </div>

                <div id="vectorResults" class="list-group mt-3"></div>
            </div>
        </div>
    `;

    // Event listeners
    document.getElementById('vectorSearchBtn').addEventListener('click', performVectorSearch);
    document.getElementById('vectorQuery').addEventListener('keypress', (e) => {
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
            body: JSON.stringify({ query: query, limit: 10 })
        });

        // Read raw text first (very important for debug)
        const rawText = await res.text();
        console.log("Raw response status:", res.status);
        console.log("Raw response headers:", [...res.headers.entries()]);
        console.log("Raw response body (first 500 chars):", rawText.substring(0, 500));

        // Try to parse as JSON
        let data;
        try {
            data = JSON.parse(rawText);
        } catch (jsonErr) {
            console.error("JSON parse error:", jsonErr);
            resultsDiv.innerHTML = `<div class="alert alert-danger">
                Server response is not valid JSON.<br>
                Status: ${res.status}<br>
                Raw body preview: <pre>${rawText.substring(0, 300)}</pre>
            </div>`;
            return;
        }

        // Normal success handling
        if (data.length === 0) {
            resultsDiv.innerHTML = '<div class="alert alert-warning">No similar notes found.</div>';
            return;
        }

        // let html = '';
        // data.forEach(item => {
        //     const similarity = (1 - item.distance).toFixed(3);
        //     html += `
        //         <a href="#" class="list-group-item list-group-item-action" onclick="openNote(${item.id})">
        //             <div class="d-flex w-100 justify-content-between">
        //                 <h6 class="mb-1">Note #${item.id}</h6>
        //                 <small class="text-success fw-bold">Similarity: ${similarity}</small>
        //             </div>
        //             <p class="mb-1 text-truncate">${item.content.substring(0, 180)}${item.content.length > 180 ? '...' : ''}</p>
        //         </a>
        //     `;
        // });

        // resultsDiv.innerHTML = html;

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
                <!-- Left side: note info -->
                <div class="flex-grow-1">
                    <h6 class="mb-1">Note #${item.id}</h6>
                    <p class="mb-2 text-muted text-truncate">${item.content.substring(0, 180)}${item.content.length > 180 ? '...' : ''}</p>
                </div>

                <!-- Right side: similarity + button -->
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
        resultsDiv.innerHTML = `<div class="alert alert-danger">Fetch error: ${err.message}</div>`;
    }
}

async function openNote(noteId) {
    try {
        const res = await fetch(`/clininote/note/${noteId}`);
        if (!res.ok) throw new Error('Failed to load note');

        const note = await res.json();

        // Log the raw note to see actual keys (remove after testing)
        console.log("Raw note data:", note);

        // Populate modal (adjust keys based on your actual JSON response)
        document.getElementById('dialogHeader').textContent = `View Note #${note.id || noteId}`;

        document.getElementById('dialogContent').innerHTML = `
            <div class="mb-3">
                <label class="form-label fw-bold">Doctor</label>
                <input type="text" class="form-control" value="${note.Doctor || note.doctor || 'N/A'}" readonly>
            </div>
            <div class="mb-3">
                <label class="form-label fw-bold">Note Date</label>
                <input type="text" class="form-control" value="${note.NoteDate || note.noteDate || 'N/A'}" readonly>
            </div>
            <div class="mb-3">
                <label class="form-label fw-bold">Episode ID</label>
                <input type="text" class="form-control" value="${note.Episode || note.episode || 'N/A'}" readonly>
            </div>
            <div class="mb-4">
                <label class="form-label fw-bold">Content</label>
                <textarea class="form-control" rows="10" readonly>${note.Content || note.content || 'No content available'}</textarea>
            </div>

            <!-- Only Close button -->
            <div class="text-end">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
            </div>
        `;

        crudModal.show();

    } catch (err) {
        alert('Error loading note: ' + err.message);
    }
}
//Display current user info in navbar
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

function setupDialog() {
    dialogContent.innerHTML = '<input type="hidden" id="editId" value="">';

    ENTITIES[currentEntity].fields.forEach(field => {
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
        } else if (field.type === 'select') {
            input = document.createElement('select');
            input.className = 'form-select';
            const opt = document.createElement('option');
            opt.value = '';
            opt.textContent = 'Select';
            input.appendChild(opt);
            field.options.forEach(optVal => {
                const o = document.createElement('option');
                o.value = optVal;
                o.textContent = optVal;
                input.appendChild(o);
            });
        } else {
            input = document.createElement('input');
            input.type = field.type || 'text';
            input.className = 'form-control';
            if (field.required) input.required = true;
            if (field.default) input.value = field.default;
        }
        input.id = field.id;
        dialogContent.appendChild(input);
    });
}

function openDialog(isEdit = false, rowData = {}) {
    document.getElementById('dialogHeader').textContent = isEdit ? ENTITIES[currentEntity].dialogTitleEdit : ENTITIES[currentEntity].dialogTitleAdd;

    const editIdEl = document.getElementById('editId');
    if (editIdEl) editIdEl.value = isEdit ? (rowData.id || '') : '';

    ENTITIES[currentEntity].fields.forEach(field => {
        const el = document.getElementById(field.id);
        if (el) {
            el.value = isEdit ? (rowData[field.id] || '') : (field.default || '');
            el.classList.remove('is-invalid');
        }
    });

    crudModal.show();
}

function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}
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

// Initial load
document.addEventListener('DOMContentLoaded', () => {
    showCurrentUser();     // show logged-in name in navbar
    loadGrid();            // load the first grid (patients by default)
});