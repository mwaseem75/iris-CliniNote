# Clinical Notes App

A modern, responsive full-stack CSP application for managing clinical patient data, episodes, and doctor notes — built with **InterSystems IRIS**, **ObjectScript**, **Bootstrap 5**, **Tabulator**, and **vector search** capabilities.


## Features

- **Patient Management** — CRUD operations (create, read, update, delete)
- **Episode Tracking** — episodes linked to patients with type, dates, reason
- **Clinical Notes** — doctor notes attached to episodes
- **Semantic Vector Search** — search notes by meaning (not just keywords) using IRIS native vector search + sentence-transformers embeddings
- **User Authentication** — custom login system with roles (Admin, Doctor, Nurse, Viewer)
- **Responsive Design** — works great on desktop and mobile
- **Professional UI** — Bootstrap 5 + clean sidebar navigation

## Tech Stack

**Backend**
- InterSystems IRIS (database, REST API, vector search)
- ObjectScript (classes, dispatch logic)
- IRIS Embedded Python (sentence-transformers for embeddings)

**Frontend**
- HTML5 / CSS3 / JavaScript
- Bootstrap 5 (responsive layout, modals, toasts)
- Tabulator.js (interactive data grids)
- Tom Select (searchable patient dropdown)
- Fetch API (REST communication)

## Screenshots

1. Login screen
<img width="1452" alt="image" src="https://github.com/user-attachments/assets/2d58874a-e1e5-4a36-adea-f79d7db90eb3" />

2. Main dashboard with sidebar & patient grid  
<img width="1916" alt="image" src="https://github.com/user-attachments/assets/dde159c0-0f99-402f-86bc-39362c2da585" />

3. Vector search interface with results
<img width="1877" alt="image" src="https://github.com/user-attachments/assets/0a9083b2-635f-4891-96c4-8421fe486408" />

### Prerequisites
Make sure you have [git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git) and [Docker desktop](https://www.docker.com/products/docker-desktop) installed.

### Installation
Clone/git pull the repo into any local directory
```
$ git clone https://github.com/mwaseem75/iris-CliniNote.git
```
To build and start the container run:
```
$ docker compose up -d && docker compose logs -f
```
Navigate to the URL below to access the application (credentials: admin/admin).
http://localhost:42773/csp/Clininote/index.html
```
