# GitHub Copilot Instructions — GiveWise Dashboard

> **See [CLAUDE.md](../CLAUDE.md) for comprehensive architecture guide and patterns.**

This file provides quick reference patterns for GitHub Copilot when editing code in this repository.

---

## Tech Stack Summary

- **Backend**: FastAPI (async) + SQLAlchemy 2.0 (async) + Pydantic 2 + SQLite/aiosqlite
- **Frontend**: Next.js 16 App Router + React 19 + TypeScript 5 + Tailwind CSS 4
- **Deployment**: Docker Compose (multi-container orchestration)

---

## Code Generation Rules

### Backend (Python/FastAPI)

**Always use async/await:**
```python
# ✅ Do this
async def get_allocations(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Allocation))
    return result.scalars().all()

# ❌ Never do this
def get_allocations(db: Session):  # Wrong session type
    return db.query(Allocation).all()  # Old SQLAlchemy 1.x syntax
```

**Wrap transactions with rollback:**
```python
try:
    db.add(new_object)
    await db.commit()
    await db.refresh(new_object)
except Exception as e:
    await db.rollback()
    raise HTTPException(status_code=500, detail=str(e))
```

**Route pattern:**
```python
@app.post("/endpoint", response_model=SchemaResponse)
async def create_thing(
    data: SchemaCreate,
    db: AsyncSession = Depends(get_db)
):
    # Use Pydantic model for validation
    # Return ORM object (auto-serialized via response_model)
```

**Key conventions:**
- Use `select()` statements, not `.query()`
- Use `joinedload()` for relationships to prevent N+1 queries
- Store percentages as 0.0-1.0 (Float), validate with tolerance `0.99 <= total <= 1.01`
- Use `HTTPException` for errors with appropriate status codes

---

### Frontend (TypeScript/React/Next.js)

**Client component pattern:**
```tsx
'use client';  // Required for useState/useEffect/event handlers

import { useState } from 'react';
import { apiService } from '@/lib/api';
import { Allocation } from '@/types/api';

interface ComponentProps {
  allocations: Allocation[];
  onUpdate: (data: AllocationCreate[]) => Promise<void>;
}

export default function Component({ allocations, onUpdate }: ComponentProps) {
  const [loading, setLoading] = useState(false);
  // ...
}
```

**API calls pattern:**
```tsx
// ✅ Do this - use apiService singleton
import { apiService } from '@/lib/api';

async function loadData() {
  try {
    setLoading(true);
    const data = await apiService.getAllocations();
    setAllocations(data);
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Failed');
  } finally {
    setLoading(false);
  }
}

// ❌ Never hardcode fetch calls
fetch('http://localhost:8000/endpoint')  // Don't do this
```

**Styling pattern:**
```tsx
// Use Tailwind utilities + brand color #fabe36
<button className="bg-[#fabe36] hover:bg-[#fab020] text-white font-medium py-2 px-4 rounded-md">
  Save
</button>

// Inline styles ONLY for dynamic values
<div style={{ width: `${percentage}%` }} />
```

**Key conventions:**
- Import types from `@/types/api`, not manual definitions
- Use `useCallback()` for functions passed as props
- Always handle loading/error states visually
- Use `@/` path alias for imports (maps to project root)

---

## File Organization Patterns

### Adding new backend endpoint:
1. Define schemas in `backend/schemas.py`
2. Add model in `backend/models.py` (if new table)
3. Create route in `backend/main.py` grouped with related endpoints
4. Use section comments: `# ===== Endpoint Group =====`

### Adding new frontend component:
1. Create file in `frontend/components/ComponentName.tsx`
2. Import types from `@/types/api` (match backend schemas)
3. Export as default function
4. Use `apiService` for API communication

---

## Common Tasks

### Update database schema:
```bash
# For now: delete and re-seed (no migrations configured yet)
rm backend/givewise.db && python backend/seed.py
```

### Run development servers:
```bash
# Docker (recommended)
docker-compose up --build

# Local backend
cd backend && uvicorn main:app --reload

# Local frontend
cd frontend && npm run dev
```

---

## Critical Don'ts

❌ **Backend:**
- Don't use synchronous DB operations
- Don't use `.query()` (old SQLAlchemy 1.x)
- Don't validate percentages with exact `== 1.0` (use tolerance range)
- Don't forget `await` before DB operations
- Don't skip try/except + rollback for write operations

❌ **Frontend:**
- Don't omit `'use client'` on interactive components
- Don't hardcode API URLs (use `apiService`)
- Don't create inline callbacks without `useCallback()`
- Don't forget loading/error states
- Don't define types that exist in `@/types/api`

---

## Environment Variables

**Backend** (`.env`):
- `DATABASE_URL` — SQLite connection string (default: `sqlite+aiosqlite:///./givewise.db`)
- `CORS_ORIGINS` — Allowed origins (default: `http://localhost:3000`)
- `ENVIRONMENT` — `development` or `production`

**Frontend** (`.env.local`):
- `NEXT_PUBLIC_API_URL` — Backend URL (default: `http://localhost:8000`)

---

## Quick Reference Links

- Full architecture guide: [CLAUDE.md](../CLAUDE.md)
- Backend: [main.py](../backend/main.py), [models.py](../backend/models.py), [schemas.py](../backend/schemas.py)
- Frontend: [page.tsx](../frontend/app/page.tsx), [api.ts](../frontend/lib/api.ts)
- API types: [types/api.ts](../frontend/types/api.ts)
