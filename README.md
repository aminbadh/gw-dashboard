# 🎯 GiveWise Allocation Dashboard

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

### 1. ⭐ Smart Allocation Logic (Frontend)
Dynamic slider system that automatically balances charity allocations to always equal 100%. When you increase one charity's allocation, others adjust proportionally - no manual math required.

**Technical Highlight:**
```typescript
// Proportional redistribution algorithm in AllocationSlider.tsx
const handleSliderChange = (charityId: number, newValue: number) => {
  // Calculate remaining percentage for other charities
  // Distribute proportionally based on current ratios
  // Ensures total always equals 100%
}
```

### 2. 🔄 Async-First Backend Architecture
All database operations use async/await with SQLAlchemy's AsyncSession for maximum performance.

**Technical Highlight:**
```python
# Atomic transaction in main.py PATCH /allocations endpoint
async with db.begin():
    # Update multiple allocations atomically
    # Validate total equals 100% before commit
    # Rollback automatically on error
```

### 3. 🎨 Real-time UI Updates
- Visual percentage bars with smooth transitions
- Instant validation feedback
- Loading and error states
- Success notifications

### 4. 📊 Database Design
Simple but effective schema demonstrating SQL relationships:
- **Charity** table with basic charity information
- **Allocation** table with foreign keys and percentage storage
- One-to-many relationship (Charity → Allocations)

---

## 🏗️ Project Structure

```
givewise-poc/
├── backend/
│   ├── main.py           # FastAPI app & routes
│   ├── models.py         # SQLAlchemy models
│   ├── schemas.py        # Pydantic schemas
│   ├── database.py       # Async DB configuration
│   ├── seed.py           # Database seeding script
│   └── requirements.txt  # Python dependencies
│
└── frontend/
    ├── app/
    │   └── page.tsx      # Main dashboard page
    ├── components/
    │   └── AllocationSlider.tsx  # Smart slider logic
    ├── lib/
    │   └── api.ts        # API service layer
    └── types/
        └── api.ts        # TypeScript interfaces
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
- `GET /allocations?user_id=1` - Get user's allocations
- `PATCH /allocations?user_id=1` - Update all allocations (atomic transaction)
- `DELETE /allocations/{id}` - Delete allocation

### Health
- `GET /` - Health check
- `GET /health` - Detailed health status

---

## 🎯 "Recruiter Bait" Highlights

### 1. **Built with AI Assistance**
This POC was developed with AI-assisted code generation, demonstrating effective human-AI collaboration for rapid prototyping. Modern development workflows leverage AI for boilerplate generation while maintaining code quality and best practices.

### 2. **Async First**
Every database operation uses `asyncio` and `AsyncSession` for non-blocking I/O:
- Better resource utilization
- Improved scalability under load
- Production-ready patterns

**Example:**
```python
async with db.begin():
    result = await db.execute(select(Allocation))
    await db.commit()
```

### 3. **Type Safety Everywhere**
- Backend: Pydantic models with validation
- Frontend: TypeScript with strict mode
- End-to-end type safety from database to UI

### 4. **Transaction Safety**
The PATCH `/allocations` endpoint demonstrates proper transaction handling:
- Atomic updates (all-or-nothing)
- Validation before commit (must equal 100%)
- Automatic rollback on error

### 5. **Timezone Ready**
Built in a sprint format demonstrating rapid development capability. The codebase is clean, documented, and production-ready despite the tight timeline.

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
- Zero configuration
- Fast setup
- Easy to share/demo
- **Easily swappable for PostgreSQL** (just change DATABASE_URL)

### Why Async SQLAlchemy?
- Future-proof for high-traffic scenarios
- Non-blocking I/O for better resource utilization
- Industry best practice for modern Python APIs

### Why Next.js App Router?
- Server and client components
- Built-in routing
- Optimized for production
- Great TypeScript support

---

## 🚀 Production Considerations

To make this production-ready:

1. **Database**: Switch to PostgreSQL
   ```python
   DATABASE_URL = "postgresql+asyncpg://user:pass@host/db"
   ```

2. **Authentication**: Add user authentication (JWT, OAuth)

3. **Environment Variables**: Use proper secret management

4. **Error Handling**: Add Sentry or similar for error tracking

5. **Testing**: Add pytest for backend, Jest for frontend

6. **CI/CD**: Add GitHub Actions for automated testing and deployment

7. **Monitoring**: Add observability (logs, metrics, traces)

---

## 📈 Future Enhancements

- [ ] User authentication and multiple user support
- [ ] Historical allocation tracking and analytics
- [ ] Monthly donation history and impact reports
- [ ] Email notifications for successful donations
- [ ] Integration with payment processors (Stripe)
- [ ] Mobile-responsive design enhancements
- [ ] Dark mode support
- [ ] Export allocations as CSV/PDF

---

## 👨‍💻 Development Notes

**Time to Build**: ~4 hours (demonstrating rapid prototyping capability)

**Lines of Code**:
- Backend: ~300 lines
- Frontend: ~400 lines
- Total: ~700 lines of production-quality code

**Key Patterns Used**:
- Dependency Injection (FastAPI)
- Repository pattern (could be added)
- Service layer pattern
- Component composition (React)
- Custom hooks (React)
- Type-safe API clients

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
