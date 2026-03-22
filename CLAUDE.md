# GiveWise Allocation Dashboard — AI Development Guide

**Project Type**: Full-stack charity allocation dashboard (POC/Portfolio piece)  
**Stack**: FastAPI (async Python) + Next.js 16 (TypeScript/React 19) + Docker  
**Architecture**: RESTful API with async SQLAlchemy backend, App Router frontend with client-side state

---

## 🚀 Quick Start Commands

### Development (Docker)
```bash
# Start all services (backend:8000, frontend:3000)
docker-compose up --build

# Backend only
cd backend && uvicorn main:app --reload

# Frontend only  
cd frontend && npm run dev
```

### Database
```bash
# Seed database (idempotent)
cd backend && python seed.py

# Reset database
rm backend/givewise.db && python backend/seed.py
```

### Testing
```bash
# Backend linting (manual)
cd backend && python -m pylint main.py models.py schemas.py

# Frontend linting
cd frontend && npm run lint
```

---

## 📁 Project Structure

```
impact-allocation/
├── backend/              # FastAPI async backend
│   ├── main.py          # App initialization, lifespan, routes
│   ├── models.py        # SQLAlchemy models (Charity, Allocation, AllocationHistory)
│   ├── schemas.py       # Pydantic validation schemas
│   ├── database.py      # AsyncSession setup, get_db() dependency
│   ├── seed.py          # Database seeding script
│   └── requirements.txt # Python dependencies
├── frontend/            # Next.js 16 App Router
│   ├── app/
│   │   ├── layout.tsx   # Root layout (metadata, Geist fonts)
│   │   ├── page.tsx     # Main allocation dashboard (client component)
│   │   └── globals.css  # Tailwind + custom slider styles
│   ├── components/      # Reusable UI components
│   │   ├── AllocationSlider.tsx   # Preset + lock/unlock sliders
│   │   ├── AllocationHistory.tsx  # History snapshots + restore
│   │   └── AppLayout.tsx          # Sidebar navigation
│   ├── lib/
│   │   └── api.ts       # ApiService singleton (fetch wrapper)
│   └── types/
│       └── api.ts       # TypeScript interfaces (match backend schemas)
└── docker-compose.yml   # Multi-container orchestration
```

---

## 🏗️ Architecture Patterns

### Backend (FastAPI + SQLAlchemy 2.0 Async)

#### 1. **Async-First Database Operations**
```python
# ✅ CORRECT: All DB operations use await
async def get_allocations(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Allocation).options(joinedload(Allocation.charity)))
    allocations = result.scalars().all()
    return allocations

# ❌ WRONG: Never use sync operations
def get_allocations(db: Session):  # Don't use Session instead of AsyncSession
    return db.query(Allocation).all()  # Don't use .query() (old SQLAlchemy 1.x syntax)
```

#### 2. **Transaction Patterns with Rollback**
```python
# ✅ CORRECT: Atomic updates with history tracking
async def update_allocations(...):
    try:
        # Step 1: Save history snapshot before modifying
        history_records = [AllocationHistory(...) for alloc in current_allocations]
        db.add_all(history_records)
        
        # Step 2: Update allocations
        for update in allocation_updates:
            # ... modify objects
            db.add(allocation)
        
        # Step 3: Commit atomically
        await db.commit()
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
```

#### 3. **Pydantic Validation with Custom Validators**
```python
# ✅ CORRECT: Business logic in schema validators
class AllocationUpdateRequest(BaseModel):
    allocations: list[AllocationCreate]
    
    @field_validator("allocations")
    def validate_total_percentage(cls, v):
        total = sum(alloc.percentage for alloc in v)
        if not (0.99 <= total <= 1.01):  # Floating-point tolerance
            raise ValueError(f"Total must equal 100%, got {total * 100:.2f}%")
        return v
```

#### 4. **Relationship Loading**
```python
# ✅ CORRECT: Eager load relationships to avoid N+1 queries
result = await db.execute(
    select(Allocation).options(joinedload(Allocation.charity))
)

# Or after object creation:
await db.refresh(allocation, ["charity"])

# ❌ WRONG: Lazy loading triggers additional queries
allocations = await db.scalars(select(Allocation))
for alloc in allocations:
    print(alloc.charity.name)  # N+1 problem
```

#### 5. **Dependency Injection**
```python
# ✅ CORRECT: Use Depends(get_db) for all routes
@app.get("/allocations")
async def get_allocations(db: AsyncSession = Depends(get_db)):
    ...

# ❌ WRONG: Don't create sessions manually in routes
@app.get("/allocations")
async def get_allocations():
    async with AsyncSessionLocal() as db:  # Don't do this
        ...
```

---

### Frontend (Next.js 16 + TypeScript)

#### 1. **Client Components Pattern**
```tsx
// ✅ CORRECT: Mark interactive components with 'use client'
'use client';

import { useState, useEffect } from 'react';

interface AllocationSliderProps {
  allocations: Allocation[];
  onUpdate: (allocations: AllocationCreate[]) => Promise<void>;
}

export default function AllocationSlider({ allocations, onUpdate }: AllocationSliderProps) {
  const [localState, setLocalState] = useState<Allocation[]>(allocations);
  // ...
}

// ❌ WRONG: Missing 'use client' for interactive components
import { useState } from 'react';  // Error: useState only works in client components
```

#### 2. **API Client Usage**
```tsx
// ✅ CORRECT: Use apiService singleton from lib/api.ts
import { apiService } from '@/lib/api';

async function loadData() {
  try {
    setLoading(true);
    const allocations = await apiService.getAllocations();
    setAllocations(allocations);
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Failed to load allocations');
  } finally {
    setLoading(false);
  }
}

// ❌ WRONG: Don't hardcode fetch calls
const response = await fetch('http://localhost:8000/allocations');  // Don't do this
```

#### 3. **State Management with Hooks**
```tsx
// ✅ CORRECT: Use hooks for local state + callbacks for parent updates
const [allocations, setAllocations] = useState<Allocation[]>([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

const handleUpdate = useCallback(async (newAllocations: AllocationCreate[]) => {
  try {
    await apiService.updateAllocations(newAllocations);
    setRefreshTrigger(prev => prev + 1);  // Trigger parent refresh
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Update failed');
  }
}, []);

// ❌ WRONG: Don't create inline arrow functions for callbacks (causes re-renders)
<AllocationSlider onUpdate={async (allocs) => { ... }} />  // Re-creates function every render
```

#### 4. **TypeScript Types**
```tsx
// ✅ CORRECT: Import shared types from @/types/api
import { Allocation, AllocationCreate, Charity } from '@/types/api';

interface ComponentProps {
  allocations: Allocation[];  // Use shared types
  onUpdate: (allocations: AllocationCreate[]) => Promise<void>;
}

// ❌ WRONG: Don't define duplicate types
interface Allocation {  // Don't redefine types already in @/types/api
  id: number;
  // ...
}
```

#### 5. **Tailwind Styling**
```tsx
// ✅ CORRECT: Use utility classes with brand color #fabe36
<button className="bg-[#fabe36] hover:bg-[#fab020] text-white font-medium py-2 px-4 rounded-md transition-colors">
  Save Allocations
</button>

// Use inline styles ONLY for dynamic values
<div style={{ background: `linear-gradient(to right, #fabe36 ${percentage}%, #f3f4f6 ${percentage}%)` }} />

// ❌ WRONG: Don't use inline styles for static values
<button style={{ backgroundColor: '#fabe36', padding: '8px 16px' }}>  // Use Tailwind instead
```

---

## 🔑 Key Conventions

### Backend
- **Percentage Storage**: Store as `Float` (0.0 to 1.0), display as percentage (0 to 100)
- **Floating-Point Tolerance**: Validate totals with `0.99 <= total <= 1.01` (not exact `== 1.0`)
- **User ID**: Hardcoded as `1` in this POC (no authentication yet)
- **History Snapshots**: Always save before updates for rollback capability
- **Error Handling**: Use `HTTPException` with appropriate status codes (400, 404, 500)
- **CORS**: Configured via `CORS_ORIGINS` environment variable (defaults to `localhost:3000`)

### Frontend
- **Brand Color**: `#fabe36` (golden yellow) for buttons, sliders, highlights
- **API URL**: `NEXT_PUBLIC_API_URL` environment variable (defaults to `http://localhost:8000`)
- **Loading States**: Always show spinners/disabled states during async operations
- **Error Messages**: Display errors prominently with red backgrounds (#fee2e2)
- **Success Messages**: Auto-dismiss after 3-5 seconds with green backgrounds (#d1fae5)
- **Refresh Pattern**: Use numeric triggers (`refreshTrigger`) to force child component re-fetches

### Database
- **Models**: `Charity`, `Allocation`, `AllocationHistory`
- **Relationships**: `Charity` ↔ `Allocation` (one-to-many with cascade delete)
- **History Table**: Separate from `Allocation` to enable restores
- **Seed Data**: 5 charities (AMF, GiveDirectly, HKI, Malaria Consortium, New Incentives)

---

## 🚨 Common Pitfalls

### Backend
1. **Forgetting `await`**: All SQLAlchemy operations must use `await` (async engine)
2. **Using old SQLAlchemy syntax**: Don't use `.query()`, use `select()` statements
3. **Not loading relationships**: Call `joinedload()` or `db.refresh(obj, ["relation"])`
4. **Exact percentage validation**: Account for floating-point errors (use tolerance range)
5. **Missing rollback**: Always wrap multi-step transactions in try/except with `db.rollback()`

### Frontend
1. **Missing 'use client'**: Components with hooks/events need client-side rendering
2. **Hardcoded API URLs**: Use `apiService` singleton, not direct `fetch()` calls
3. **Inline callback functions**: Use `useCallback()` to prevent re-renders
4. **Not handling loading states**: Always disable buttons/show spinners during async ops
5. **Forgetting error handling**: Wrap API calls in try/catch with user-visible error messages

---

## 📝 Adding New Features

### New Backend Endpoint
1. Define Pydantic schemas in `schemas.py`
2. Add SQLAlchemy model to `models.py` (if needed)
3. Create route in `main.py` with async function + `Depends(get_db)`
4. Use try/except with rollback for write operations
5. Test with FastAPI auto-docs at http://localhost:8000/docs

### New Frontend Component
1. Create `ComponentName.tsx` in `components/` directory
2. Add `'use client'` directive at top
3. Define `ComponentNameProps` interface with types from `@/types/api`
4. Use `apiService` for API calls with try/catch error handling
5. Style with Tailwind utilities (use `#fabe36` for interactive elements)

### New Database Migration
1. Update models in `models.py`
2. Run `alembic init migrations` (not yet configured)
3. For now: delete `givewise.db` and re-run `python seed.py`

---

## 🌐 Environment Variables

### Backend (`.env` in backend/)
```bash
DATABASE_URL=sqlite+aiosqlite:///./givewise.db
ENVIRONMENT=development  # or 'production'
CORS_ORIGINS=http://localhost:3000  # comma-separated for multiple
```

### Frontend (`.env.local` in frontend/)
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 🐳 Docker Notes

- **Backend**: Hot-reload enabled with volume mount (`./backend:/app`)
- **Frontend**: Production build (no hot-reload in container mode)
- **Database**: Persisted in named volume `backend-data`
- **Health Checks**: Backend has curl-based healthcheck every 30s
- **Ports**: Backend:8000, Frontend:3000

---

## 📚 Additional Resources

- **FastAPI Docs**: https://fastapi.tiangolo.com/
- **SQLAlchemy 2.0 Async**: https://docs.sqlalchemy.org/en/20/orm/extensions/asyncio.html
- **Next.js App Router**: https://nextjs.org/docs/app
- **Pydantic Validation**: https://docs.pydantic.dev/latest/concepts/validators/

---

## ⚠️ Portfolio Project Disclaimer

This is a **technical demonstration** — not affiliated with any charity organizations mentioned. All charity names are used for demonstration purposes only. For actual donations, visit official charity websites directly.
