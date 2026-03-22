# GiveWise Allocation Dashboard

> **A high-impact POC demonstrating full-stack async architecture for charitable giving allocation**

A production-ready vertical slice showcasing modern web development best practices: FastAPI with async SQLAlchemy on the backend, Next.js with TypeScript on the frontend, and intelligent client-side state management for dynamic budget allocation.

---

## ⚠️ Disclaimer

**This is a technical demonstration project and portfolio piece.** This application is **not affiliated with, endorsed by, or connected to** GiveWell, Against Malaria Foundation, GiveDirectly, Helen Keller International, Malaria Consortium, New Incentives, or any other charitable organization mentioned in this project.

All charity names, descriptions, and information are used solely for demonstration purposes to showcase technical capabilities. This is not a functional donation platform. For actual charitable donations, please visit the official websites of these organizations directly.

---

## 🚀 Tech Stack (The "Must-Haves")

### Backend
- **FastAPI** - Modern async Python web framework
- **SQLAlchemy 2.0** - Async ORM with full type hints
- **Pydantic** - Robust request/response validation
- **SQLite** with `aiosqlite` - Fast async database (PostgreSQL-ready)

### Frontend
- **Next.js 16** - React framework with App Router
- **TypeScript** - Full type safety
- **Tailwind CSS** - Utility-first styling
- **React 19** - Latest React features

### Communication
- RESTful API with JSON
- CORS-enabled for local development
- Automatic OpenAPI documentation

---

## ✨ Key Features

### 1. ⭐ Smart Allocation Sliders
Dynamic slider system that automatically balances charity allocations to always equal 100%. When you increase one charity's allocation, others adjust proportionally - no manual math required.

**Features:**
- Real-time proportional redistribution
- Lock/unlock individual charities to preserve their allocation
- Visual percentage bars with smooth transitions
- HKD/Percentage toggle for viewing allocations
- Total validation ensures 100% allocation at all times

### 2. 🎯 Preset Distributions
Quick allocation strategies for common giving patterns:
- **Equal** - Split evenly across all charities
- **Top 2** - 48% each to top 2, remaining split equally
- **Top 3** - 30% each to top 3, remaining split equally  
- **Gradual** - Decreasing distribution (40%, 25%, 20%, 10%, 5%)
- **Concentrated** - Focus on a single charity (60% + remainder split)

### 3. 📜 Allocation History
Track and restore previous allocations:
- Automatic snapshots saved on each update
- View past allocation distributions with timestamps
- One-click restore to load previous values
- Review before re-saving (non-destructive preview)

### 4. 🔄 Async-First Backend Architecture
All database operations use async/await with SQLAlchemy's AsyncSession for maximum performance.

**Technical Highlight:**
```python
# Atomic transactions with automatic history tracking
async def update_allocations(...):
    # Save current state to history
    # Update allocations atomically
    # Validate total equals 100% before commit
    # Rollback automatically on error
```

### 5. 📊 Database Design
Clean schema with three tables:
- **Charity** - Organization information
- **Allocation** - User allocation percentages with FK to Charity
- **AllocationHistory** - Timestamped snapshots for rollback

---

## 🏗️ Project Structure

```
impact-allocation/
├── backend/
│   ├── main.py              # FastAPI app & routes
│   ├── models.py            # SQLAlchemy models (Charity, Allocation, AllocationHistory)
│   ├── schemas.py           # Pydantic schemas
│   ├── database.py          # Async DB configuration with env support
│   ├── seed.py              # Database seeding script (idempotent)
│   ├── Dockerfile           # Backend container
│   ├── .env.example         # Environment variables template
│   └── requirements.txt     # Python dependencies
│
├── frontend/
│   ├── app/
│   │   ├── page.tsx         # Main dashboard page
│   │   └── layout.tsx       # Root layout with metadata
│   ├── components/
│   │   ├── AllocationSlider.tsx    # Smart slider with lock/presets
│   │   ├── AllocationHistory.tsx   # History display & restore
│   │   └── AppLayout.tsx           # Common layout wrapper
│   ├── lib/
│   │   └── api.ts           # API service layer
│   ├── types/
│   │   └── api.ts           # TypeScript interfaces
│   ├── Dockerfile           # Frontend container (multi-stage)
│   └── next.config.ts       # Next.js configuration
│
└── docker-compose.yml       # Orchestration for both services
```

---

## 🚦 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- npm or yarn

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Seed the database with sample charities
python seed.py

# Start the FastAPI server
uvicorn main:app --reload
```

Backend will be available at: **http://localhost:8000**
API docs at: **http://localhost:8000/docs**

### 2. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

Frontend will be available at: **http://localhost:3000**

### 3. Docker Setup (Recommended for Production)

The easiest way to run the entire application with Docker:

```bash
# Build and start both services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

The Docker setup includes:
- **Backend** on port 8000 with production configuration
- **Frontend** on port 3000 with optimized build
- **Persistent volume** for database storage
- **Health checks** for reliability
- **Automatic restarts** on failure

**Individual Docker builds:**

```bash
# Backend only
cd backend
docker build -t givewise-backend .
docker run -p 8000:8000 givewise-backend

# Frontend only
cd frontend
docker build -t givewise-frontend .
docker run -p 3000:3000 givewise-frontend
```

---

## 🎮 How to Use

1. **Open the dashboard** at http://localhost:3000
2. **Adjust sliders** for each charity - notice how others automatically rebalance
3. **Click "Save Allocations"** when satisfied with the distribution
4. **View charity details** below the sliders to learn more about each organization

---

## 📡 API Endpoints

### Charities
- `GET /charities` - List all charities
- `GET /charities/{id}` - Get specific charity
- `POST /charities` - Create new charity

### Allocations
- `GET /allocations?user_id=1` - Get user's current allocations
- `PATCH /allocations?user_id=1` - Update allocations (atomic, saves history)
- `DELETE /allocations/{id}` - Delete allocation

### Allocation History
- `GET /allocations/history?user_id=1&limit=10` - Get historical snapshots
- `POST /allocations/history/{timestamp}/restore` - Restore from history

### Health
- `GET /` - Health check
- `GET /docs` - Interactive API documentation (Swagger UI)

---

## 🧪 Testing the POC

### Test the Backend API
```bash
# Health check
curl http://localhost:8000/

# Get all charities
curl http://localhost:8000/charities

# Get allocations
curl http://localhost:8000/allocations?user_id=1

# Update allocations
curl -X PATCH http://localhost:8000/allocations?user_id=1 \
  -H "Content-Type: application/json" \
  -d '{
    "allocations": [
      {"charity_id": 1, "percentage": 0.4},
      {"charity_id": 2, "percentage": 0.3},
      {"charity_id": 3, "percentage": 0.2},
      {"charity_id": 4, "percentage": 0.05},
      {"charity_id": 5, "percentage": 0.05}
    ]
  }'
```

### Test the Frontend
1. Open browser to http://localhost:3000
2. Open DevTools Network tab
3. Move sliders and watch API calls
4. Verify allocations persist on page refresh

---

## 🔧 Technical Decisions

### Why SQLite for POC?
- Zero configuration required
- Fast development iteration
- Easy to demo and share
- PostgreSQL-ready (just change `DATABASE_URL` in `.env`)

### Why Async SQLAlchemy?
- Non-blocking I/O for better resource utilization
- Scales better under concurrent load
- Modern Python async/await patterns
- Industry best practice for new APIs

### Why Next.js App Router?
- Server and client components
- Built-in routing and file-based structure
- Optimized for production builds
- Excellent TypeScript support

### Why Docker?
- Consistent environment across development and deployment
- Easy to run the full stack with one command
- Demonstrates containerization skills
- Production-ready deployment approach

---

## 👨‍💻 Development Notes

**Key Patterns Demonstrated**:
- Async/await throughout the stack
- Dependency Injection (FastAPI)
- Atomic database transactions
- Component composition (React)
- Type-safe API contracts (Pydantic + TypeScript)
- Container orchestration (Docker Compose)
- Environment-based configuration
- Idempotent database seeding

---

## 📝 License

MIT License - feel free to use this POC as a learning resource or starting point for your own projects.

**Important:** If you use this code, ensure you add appropriate disclaimers if using real organization names, or replace them with fictional examples. This project is for educational and portfolio purposes only.

---

## 🙏 Acknowledgments

- Charity information inspired by **GiveWell** recommendations (for demonstration purposes only)
- **FastAPI** team for excellent async Python framework
- **Vercel** for Next.js and amazing developer experience
- **SQLAlchemy** team for robust async ORM

---

**Built with ❤️ and ☕ as a technical demonstration of full-stack async web development**
