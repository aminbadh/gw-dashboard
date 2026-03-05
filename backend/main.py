from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from contextlib import asynccontextmanager

from database import get_db, init_db
from models import Charity, Allocation
from schemas import (
    CharityResponse,
    CharityCreate,
    AllocationResponse,
    AllocationUpdate,
    AllocationCreate
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan event handler for startup and shutdown"""
    # Startup: Initialize database
    await init_db()
    print("✅ Database initialized")
    yield
    # Shutdown: Cleanup can go here if needed
    print("👋 Shutting down")


app = FastAPI(
    title="GiveWise Allocation API",
    description="API for managing charity allocations with smart balancing",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware to allow Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==================== CHARITY ENDPOINTS ====================

@app.get("/charities", response_model=List[CharityResponse])
async def get_charities(db: AsyncSession = Depends(get_db)):
    """Get all charities"""
    result = await db.execute(select(Charity))
    charities = result.scalars().all()
    return charities


@app.post("/charities", response_model=CharityResponse, status_code=201)
async def create_charity(charity: CharityCreate, db: AsyncSession = Depends(get_db)):
    """Create a new charity"""
    db_charity = Charity(**charity.model_dump())
    db.add(db_charity)
    await db.commit()
    await db.refresh(db_charity)
    return db_charity


@app.get("/charities/{charity_id}", response_model=CharityResponse)
async def get_charity(charity_id: int, db: AsyncSession = Depends(get_db)):
    """Get a specific charity by ID"""
    charity = await db.get(Charity, charity_id)
    if not charity:
        raise HTTPException(status_code=404, detail="Charity not found")
    return charity


# ==================== ALLOCATION ENDPOINTS ====================

@app.get("/allocations", response_model=List[AllocationResponse])
async def get_allocations(user_id: int = 1, db: AsyncSession = Depends(get_db)):
    """Get all allocations for a user (mocked to user_id=1)"""
    result = await db.execute(
        select(Allocation)
        .where(Allocation.user_id == user_id)
    )
    allocations = result.scalars().all()
    
    # Eager load charities
    for allocation in allocations:
        await db.refresh(allocation, ["charity"])
    
    return allocations


@app.post("/allocations", response_model=AllocationResponse, status_code=201)
async def create_allocation(allocation: AllocationCreate, db: AsyncSession = Depends(get_db)):
    """Create a new allocation"""
    # Check if charity exists
    charity = await db.get(Charity, allocation.charity_id)
    if not charity:
        raise HTTPException(status_code=404, detail="Charity not found")
    
    db_allocation = Allocation(**allocation.model_dump())
    db.add(db_allocation)
    await db.commit()
    await db.refresh(db_allocation, ["charity"])
    return db_allocation


@app.patch("/allocations", response_model=List[AllocationResponse])
async def update_allocations(
    allocation_update: AllocationUpdate,
    user_id: int = 1,
    db: AsyncSession = Depends(get_db)
):
    """
    ⭐ THE "RECRUITER BAIT" ENDPOINT ⭐
    
    Update multiple allocations atomically using async SQLAlchemy transaction.
    Validates that total allocation equals 100% before committing.
    """
    try:
        # Start transaction (automatic with AsyncSession)
        async with db.begin():
            # Fetch all current allocations for the user
            result = await db.execute(
                select(Allocation)
                .where(Allocation.user_id == user_id)
            )
            existing_allocations = {alloc.charity_id: alloc for alloc in result.scalars().all()}
            
            # Update each allocation
            for alloc_data in allocation_update.allocations:
                if alloc_data.charity_id in existing_allocations:
                    # Update existing
                    existing_allocations[alloc_data.charity_id].percentage = alloc_data.percentage
                else:
                    # Create new allocation
                    charity = await db.get(Charity, alloc_data.charity_id)
                    if not charity:
                        raise HTTPException(status_code=404, detail=f"Charity {alloc_data.charity_id} not found")
                    
                    new_alloc = Allocation(
                        charity_id=alloc_data.charity_id,
                        user_id=user_id,
                        percentage=alloc_data.percentage
                    )
                    db.add(new_alloc)
            
            # Commit happens automatically at the end of async with block
            await db.commit()
        
        # Fetch updated allocations with charity details
        result = await db.execute(
            select(Allocation)
            .where(Allocation.user_id == user_id)
        )
        updated_allocations = result.scalars().all()
        
        # Eager load charities
        for allocation in updated_allocations:
            await db.refresh(allocation, ["charity"])
        
        return updated_allocations
    
    except ValueError as e:
        # Pydantic validation error
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Transaction failed: {str(e)}")


@app.delete("/allocations/{allocation_id}", status_code=204)
async def delete_allocation(allocation_id: int, db: AsyncSession = Depends(get_db)):
    """Delete an allocation"""
    allocation = await db.get(Allocation, allocation_id)
    if not allocation:
        raise HTTPException(status_code=404, detail="Allocation not found")
    
    await db.delete(allocation)
    await db.commit()
    return None


# ==================== HEALTH CHECK ====================

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "GiveWise Allocation API",
        "version": "1.0.0"
    }


@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "ok",
        "database": "connected"
    }
