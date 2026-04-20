# hoWrk

A full-stack web application built for a hackathon. **hoWrk** consists of a React + TypeScript frontend (Vite) and a Python FastAPI backend. The app enables users — citizens, guardians, and authorities — to register, log in, and interact with live incident maps and dashboards.

## 🚀 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React, TypeScript, Vite, Tailwind CSS |
| **Backend** | Python 3, FastAPI |
| **Auth** | JWT (`auth.py`) |
| **Database** | SQLite / Firebase |
| **Testing** | pytest |

## 📁 Project Structure

```text
hoWrk/
├── backend/               # Python FastAPI server
│   ├── main.py            # API entrypoint
│   ├── auth.py            # JWT authentication
│   ├── database.py        # DB connection
│   ├── models.py          # ORM models
│   ├── schemas.py         # Pydantic schemas
│   ├── test_api.py        # Backend tests
│   └── req.txt            # Python dependencies
├── src/                   # React application
│   ├── App.tsx            # Root component
│   ├── main.tsx           # Entry point
│   ├── index.css          # Global styles
│   └── components/        # UI components
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── req.txt                # Root-level Python deps
└── README.md
```

## 🧰 Prerequisites

- Node.js >= 16.x
- Python 3.10+
- pip

## 🏁 Running Locally

### Backend

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

pip install -r req.txt
uvicorn main:app --reload
```

> API will be available at `http://localhost:8000`

### Frontend

```bash
# From project root
npm install
npm run dev
```

> App will be available at `http://localhost:5173`

## 🧪 Running Tests

```bash
cd backend
pytest test_api.py
```

## 📦 Deployment

- **Frontend:** `npm run build` → outputs to `dist/`
- **Backend:** Deploy with Docker or any Python-compatible cloud host (Render, Railway, etc.)

## 📝 Notes

- Copy `.env.example` to `.env` and fill in your credentials before running.
- `firebase-key.json` is excluded via `.gitignore` — add your own if using Firebase.

---

© 2026 hoWrk Team
