# CyberGuard

A full-stack cybersecurity security-assessment dashboard.

> **Phase 1** — Project foundation and authentication system.
> Phase 2 will introduce the vulnerability scanner and assessment modules.

---

## Tech Stack

| Layer    | Technology                                           |
|----------|------------------------------------------------------|
| Frontend | React 19, Vite, Tailwind CSS, React Router, Axios   |
| Backend  | Python, Flask, Flask-SQLAlchemy, Flask-JWT-Extended |
| Database | SQLite                                               |
| Auth     | JWT (Bearer tokens), Werkzeug password hashing       |

---

## Project Structure

```
CyberGuard/
├── frontend/               # React/Vite application
│   ├── src/
│   │   ├── api/            # Axios client
│   │   ├── components/     # Shared components (ProtectedRoute)
│   │   ├── context/        # AuthContext
│   │   └── pages/          # Login, Register, Dashboard
│   ├── .env.example
│   └── vite.config.js
├── backend/                # Flask API
│   ├── app/
│   │   ├── __init__.py     # App factory
│   │   ├── models/
│   │   │   └── user.py     # User model
│   │   └── routes/
│   │       └── auth.py     # Auth endpoints
│   ├── run.py
│   ├── requirements.txt
│   └── .env.example
├── docs/
├── screenshots/
├── .gitignore
└── README.md
```

---

## Installation

### Prerequisites

- Python 3.10+
- Node.js 18+
- npm 9+

---

### Backend Setup

```bash
cd CyberGuard/backend

# (Optional) create and activate a virtual environment
python -m venv venv
venv\Scripts\activate   # Windows
# source venv/bin/activate  # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Copy and configure environment variables
copy .env.example .env
# Then edit .env and set SECRET_KEY and JWT_SECRET_KEY
```

### Frontend Setup

```bash
cd CyberGuard/frontend

# Install dependencies
npm install

# Copy and configure environment variables
copy .env.example .env
```

---

## Environment Variables

### `backend/.env`

| Variable       | Description                          | Example                  |
|----------------|--------------------------------------|--------------------------|
| `SECRET_KEY`   | Flask secret key                     | `your-random-secret`     |
| `JWT_SECRET_KEY` | JWT signing key                    | `your-random-jwt-secret` |
| `DATABASE_URL` | SQLAlchemy connection string         | `sqlite:///cyberguard.db`|

### `frontend/.env`

| Variable        | Description          | Default                         |
|-----------------|----------------------|---------------------------------|
| `VITE_API_URL`  | Backend API base URL | `http://localhost:5000/api`     |

---

## Running the Application

### Start the Backend

```bash
cd CyberGuard/backend
python run.py
```

Backend runs at **http://localhost:5000**

### Start the Frontend

```bash
cd CyberGuard/frontend
npm run dev
```

Frontend runs at **http://localhost:5173**

---

## API Endpoints

| Method | Endpoint              | Auth required | Description              |
|--------|-----------------------|---------------|--------------------------|
| POST   | `/api/auth/register`  | No            | Register a new user      |
| POST   | `/api/auth/login`     | No            | Login and receive JWT    |
| GET    | `/api/auth/me`        | Yes (Bearer)  | Get authenticated user   |

---

## Security

- Passwords are hashed with Werkzeug's `generate_password_hash` (scrypt)
- JWT tokens are signed with a secret key and never stored server-side
- CORS is restricted to `/api/*` routes
- Plaintext passwords are never stored or logged

---

## License

See [LICENSE](LICENSE).
