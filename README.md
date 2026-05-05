# LinkLite

LinkLite is a full-stack URL management platform with a React frontend and a Java Spring Boot backend. It lets users create short links, generate QR codes, review analytics, manage expiry, block IPs, and work from a modern dashboard. It also includes an admin workspace for user, link, report, feedback, and security management.

## Main Folder

Project root:

`/Users/princeraj/Desktop/Linklite ReDesign/rajprince031-LinkLite-ff58ad5`

This is the folder you should upload to GitHub.

## Folder Structure

### Root

- `README.md`
  - Main project documentation.
- `.gitignore`
  - Git ignore rules for local/generated files.
- `.dockerignore`
  - Docker build ignore rules.
- `docker-compose.yml`
  - Runs frontend and backend together with Docker.
- `client/`
  - React frontend application.
- `backend/`
  - Java Spring Boot backend application.

### Frontend

Frontend root:

`/Users/princeraj/Desktop/Linklite ReDesign/rajprince031-LinkLite-ff58ad5/client`

Important files and folders:

- `package.json`
  - Frontend dependencies and scripts.
- `.env.example`
  - Frontend environment variable template.
- `Dockerfile`
  - Frontend production container build.
- `vite.config.js`
  - Vite configuration.
- `src/App.jsx`
  - Main route and app entry setup.
- `src/component/`
  - Main UI screens and reusable feature components.
- `src/style/`
  - App styling files.
- `src/redux/`
  - Redux store and user state.
- `src/api/client.js`
  - Shared API base configuration.
- `public/`
  - Static public assets.

### Backend

Backend root:

`/Users/princeraj/Desktop/Linklite ReDesign/rajprince031-LinkLite-ff58ad5/backend`

Important files and folders:

- `pom.xml`
  - Maven dependencies and build config.
- `.env.example`
  - Backend environment variable template.
- `Dockerfile`
  - Backend container build.
- `src/main/resources/application.yml`
  - Spring Boot configuration.
- `src/main/java/com/linklite/backend/controller/`
  - Backend API controllers.
- `src/main/java/com/linklite/backend/service/`
  - Business logic and schedulers.
- `src/main/java/com/linklite/backend/entity/`
  - JPA entities.
- `src/main/java/com/linklite/backend/repository/`
  - Database repositories.
- `src/main/java/com/linklite/backend/dto/`
  - Request/response DTOs.
- `src/main/java/com/linklite/backend/security/`
  - JWT/security configuration.

## Features

### User Features

- User signup and login
- OTP email verification
- Forgot password with OTP
- Create short links
- Custom aliases
- QR code preview, download, and share
- Expiry presets and custom expiry
- No-expiry option
- Link analytics
- Country, region, city, browser, device, and IP tracking
- CSV and JSON export
- Block IPs for a specific link
- Profile and password management

### Admin Features

- Separate admin login
- Admin dashboard
- User management
- Link management
- Activate, deactivate, block, unblock controls
- Reports and analytics
- Security monitoring
- Feedback inbox
- Admin action visibility

### Public/Visitor Features

- Short-link redirection
- Common unavailable page for:
  - blocked access
  - expired links
  - inactive links
  - missing/deleted links
  - broken destination links

## Tech Stack

### Frontend

- React
- Vite
- Redux Toolkit
- React Router
- Axios
- CSS

### Backend

- Java
- Spring Boot
- Spring Security
- Spring Data JPA
- JWT authentication
- JavaMail
- Maven

### Database

- Production-ready via env-based DB config
- Intended for PostgreSQL in deployment

## Environment Files

Do not commit real secrets.

Use these templates:

- [client/.env.example](/Users/princeraj/Desktop/Linklite%20ReDesign/rajprince031-LinkLite-ff58ad5/client/.env.example)
- [backend/.env.example](/Users/princeraj/Desktop/Linklite%20ReDesign/rajprince031-LinkLite-ff58ad5/backend/.env.example)

Before deployment, create:

- `client/.env`
- `backend/.env`

and fill them with your real values.

## Run Locally

### Frontend

```bash
cd client
npm install
npm run dev
```

### Backend

```bash
cd backend
mvn spring-boot:run
```

## Build

### Frontend

```bash
cd client
npm run build
```

### Backend

```bash
cd backend
mvn -q -DskipTests package
```

## Docker

Docker files added:

- [docker-compose.yml](/Users/princeraj/Desktop/Linklite%20ReDesign/rajprince031-LinkLite-ff58ad5/docker-compose.yml)
- [client/Dockerfile](/Users/princeraj/Desktop/Linklite%20ReDesign/rajprince031-LinkLite-ff58ad5/client/Dockerfile)
- [backend/Dockerfile](/Users/princeraj/Desktop/Linklite%20ReDesign/rajprince031-LinkLite-ff58ad5/backend/Dockerfile)

### Before running Docker

Create these files first:

- `backend/.env`
- `client/.env` if you want to keep local frontend env values

For Docker Compose build args, export frontend API values in your shell or place them in a root `.env` file before running:

```env
VITE_API_BASE_URL=http://localhost:8080/api
VITE_LOCALHOST_API=http://localhost:8080/api
```

### Run with Docker

From the project root:

```bash
docker compose up --build
```

This starts:

- frontend on `http://localhost:5173`
- backend on `http://localhost:8080`

## Important Before GitHub Upload

Upload this folder:

`/Users/princeraj/Desktop/Linklite ReDesign/rajprince031-LinkLite-ff58ad5`

Do not upload local/generated files such as:

- `client/.env`
- `backend/.env`
- `client/dist`
- `client/node_modules`
- `backend/target`
- `backend/data/linklite.mv.db`
- `backend/data/linklite.trace.db`

Keep these:

- `client/.env.example`
- `backend/.env.example`

## Author

Prince Raj
# LinkLite-v2.0
