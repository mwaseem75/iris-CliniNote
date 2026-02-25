# Semantic Clinical Notes Application
A modern, responsive full-stack CSP application for managing clinical patient data, episodes, and doctor notes — built with **InterSystems IRIS**, **ObjectScript**, **Bootstrap 5**, **Tabulator**, and **vector search** capabilities.
<img width="1907" alt="image" src="https://github.com/user-attachments/assets/70072e88-b7db-4987-b1c7-8c28f627128b" />

## Features

- **Patient Management** — CRUD operations (create, read, update, delete)
- **Episode Tracking** — episodes linked to patients with type, dates, and reason
- **Clinical Notes** — doctor notes attached to episodes
- **Top 5 matching notes** panel showing semantically similar notes against the selected note
- **Semantic Vector Search** — search notes by meaning (not just keywords) using IRIS native vector search + sentence-transformers embeddings
- **Searchable dropdowns** for linked entities (Patient → Episode, Episode → Note) using Tom Select
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
<img width="1916" alt="image" src="https://github.com/user-attachments/assets/39cb1dd2-39d6-4db3-8650-28730eeab96f" />
3. Patient Notes Data Entry
<img width="1910" alt="image" src="https://github.com/user-attachments/assets/c31affb0-27d4-4edb-9da6-fb16e9a49e5b" />
4. Vector search interface with results
<img width="1915" alt="image" src="https://github.com/user-attachments/assets/1aa059de-b67b-4871-908a-f4f26454ff3a" />


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
#### ZPM

Open IRIS for Health installation with ZPM client installed. 
```
zpm install iris-CliniNote
```

Navigate to the URL below to access the application (credentials: admin/admin).

http://localhost:42773/csp/Clininote/login.html
