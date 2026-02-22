# Clinical Notes App

A modern, responsive web application for managing clinical patient data, episodes, and doctor notes — built with **InterSystems IRIS**, **ObjectScript**, **Bootstrap 5**, **Tabulator**, and **vector search** capabilities.


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

(Add 3–5 screenshots here – recommended order:)

1. Login screen
<img width="1452" height="827" alt="image" src="https://github.com/user-attachments/assets/2d58874a-e1e5-4a36-adea-f79d7db90eb3" />

2. Main dashboard with sidebar & patient grid  
<img width="1916" height="927" alt="image" src="https://github.com/user-attachments/assets/dde159c0-0f99-402f-86bc-39362c2da585" />

3. Vector search interface with results
<img width="1877" height="916" alt="image" src="https://github.com/user-attachments/assets/0a9083b2-635f-4891-96c4-8421fe486408" />

## Installation & Setup

### Prerequisites

- InterSystems IRIS 2024.1+ (with Embedded Python enabled)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/[your-username]/clinical-notes-iris.git
   cd clinical-notes-iris

<img src="https://community.intersystems.com/sites/default/files/inline/images/archived.gif" width=100></img>
<b>&nbsp;no maintenance or update</b> 

# Vector-inside-IRIS
This is an attempt to run a vector search demo completely in IRIS    
There are no external tools and all you need is a Terminal / Console and the management portal.  
Special thanks to [Alvin Ryanputra](https://community.intersystems.com/user/alvin-ryanputra)
as his package [iris-vector-search](https://openexchange.intersystems.com/package/iris-vector-search) that was the base   
of inspiration and the source for test data.   
My package is based on IRIS 2024.1 release and requires attention to your processor capabilities.   

I attempted to write the demo in pure ObjectScript.   
Only the calculation of the description_vectoris is done in embedded Python.   
Calculation of a vector with 384 dimensions over 2247 records takes time.   
In my Docker container, it was running  01:53:14 to generate them completely.      
So I adjusted this step to be reentrant to allow pausing generation.     
Every 50 records you get an offer to have a stop.

Any suggestions for enhancements are very welcome,

### Prerequisites
Make sure you have [git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git) and [Docker desktop](https://www.docker.com/products/docker-desktop) installed.
### Installation
Clone/git pull the repo into any local directory
```
$ git clone https://github.com/rcemper/Vector-inside-IRIS.git
```
To build and start the container run:
```
$ docker compose up -d && docker compose logs -f
```
To access the application (Credentials admin/admin)
http://localhost:42773/csp/Clininote/index.html
```
http://localhost:42773/csp/sys/UtilHome.csp
```
