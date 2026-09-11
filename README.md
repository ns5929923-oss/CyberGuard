# CyberGuard

A full-stack cybersecurity security-assessment dashboard with a full **Admin Panel**.

---

## Tech Stack

| Layer    | Technology                                                      |
|----------|-----------------------------------------------------------------|
| Frontend | React 19, Vite, Tailwind CSS 4, React Router 7, Axios, Recharts |
| Backend  | Python, Flask, Flask-SQLAlchemy, Flask-JWT-Extended             |
| Database | SQLite                                                          |
| Auth     | JWT (Bearer tokens), Werkzeug password hashing (scrypt)        |

---

## Project Structure

```
CyberGuard/
├── frontend/src/
│   ├── api/                  # Axios client
│   ├── components/
│   │   ├── AdminLayout.jsx   # Admin page shell
│   │   ├── AdminRoute.jsx    # Admin frontend guard
│   │   ├── AdminSidebar.jsx  # Admin navigation
│   │   ├── ConfirmModal.jsx  # Destructive-action dialog
│   │   ├── ProtectedRoute.jsx
│   │   └── ...
│   ├── context/
│   │   └── AuthContext.jsx   # Auth + role state
│   ├── pages/
│   │   ├── AdminDashboard.jsx
│   │   ├── AdminUsers.jsx
│   │   ├── AdminUserDetails.jsx
│   │   ├── AdminScans.jsx
│   │   ├── AdminFindings.jsx
│   │   ├── AdminSettings.jsx
│   │   ├── Unauthorized.jsx
│   │   └── (existing user pages)
│   └── services/
│       └── adminService.js   # Admin API calls
├── backend/app/
│   ├── middleware/
│   │   └── auth.py           # @admin_required decorator
│   ├── models/               # user.py, scan.py, finding.py
│   ├── routes/
│   │   ├── admin.py          # /api/admin/* endpoints
│   │   └── (auth, scans, dashboard)
│   └── services/
│       └── admin_service.py  # Admin business logic
├── backend/migrate_db.py     # Safe DB migration script
├── backend/seed_admin.py     # Admin account creation script
└── docs/ADMIN_PANEL.md       # Full admin documentation
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

### Authentication

| Method | Endpoint              | Auth     | Description              |
|--------|-----------------------|----------|--------------------------|
| POST   | `/api/auth/register`  | No       | Register a new user (role=user) |
| POST   | `/api/auth/login`     | No       | Login → JWT + role       |
| GET    | `/api/auth/me`        | Bearer   | Get authenticated user   |

### Admin Panel (`role=admin` required)

| Method | Endpoint                        | Description                     |
|--------|---------------------------------|---------------------------------|
| GET    | `/api/admin/dashboard`          | Platform statistics             |
| GET    | `/api/admin/dashboard/charts`   | Chart time-series data          |
| GET    | `/api/admin/users`              | Paginated user list             |
| GET    | `/api/admin/users/<id>`         | User details                    |
| GET    | `/api/admin/users/<id>/activity`| User scan/finding activity      |
| PUT    | `/api/admin/users/<id>`         | Update user name/email/role     |
| PATCH  | `/api/admin/users/<id>/status`  | Activate / deactivate account   |
| DELETE | `/api/admin/users/<id>`         | Delete user (self-delete blocked)|
| GET    | `/api/admin/scans`              | All scans (all users)           |
| GET    | `/api/admin/findings`           | All findings (all users)        |

> All `/api/admin/*` endpoints return **HTTP 403** for non-admin users.
> Passwords and secrets are **never** returned in any API response.

---

## Admin Panel

### Quick start

1. **Migrate database** (adds role, is_active, last_login, updated_at columns):
   ```bash
   cd backend && python migrate_db.py
   ```

2. **Create admin account** (set credentials in `backend/.env` first):
   ```bash
   # Edit backend/.env and set ADMIN_EMAIL and ADMIN_PASSWORD
   cd backend && python seed_admin.py
   ```

3. **Log in** at `/login` — admins are automatically redirected to `/admin/dashboard`.

### Features

| Feature | Description |
|---------|-------------|
| Role-based auth | JWT + DB role check on every admin API call |
| Dashboard | Real-time stats: users, scans, findings, risk levels |
| Charts | Recharts line/bar/pie charts using live backend data |
| User management | View, search, filter, sort, activate/deactivate, delete |
| User details | Profile, activity, recent scans, role editor |
| Scan monitoring | All users' scans with filtering |
| Finding monitoring | All users' findings with severity filter |
| Self-delete prevention | Admins cannot delete/deactivate their own account |
| Confirmation dialogs | All destructive actions require confirmation |

Full documentation: [`docs/ADMIN_PANEL.md`](docs/ADMIN_PANEL.md)

---

## Security

- Passwords hashed with Werkzeug `generate_password_hash` (scrypt)
- JWT tokens signed server-side, never stored
- Role verified from **database** on every `/api/admin/*` request
- `password_hash` excluded from all API responses
- CORS restricted to configured origins
- Admin accounts only via `seed_admin.py` — public registration always sets `role="user"`
- `.env` in `.gitignore`; secrets never committed

---

## License

See [LICENSE](LICENSE).
