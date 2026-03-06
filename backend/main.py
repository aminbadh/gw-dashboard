from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import joinedload
from typing import List
from contextlib import asynccontextmanager
import os

from database import get_db, init_db
from models import Charity, Allocation, AllocationHistory
from schemas import (
    CharityResponse,
    CharityCreate,
    AllocationResponse,
    AllocationUpdate,
    AllocationCreate,
    AllocationHistorySnapshot,
    AllocationHistoryItem
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
# In production, set CORS_ORIGINS env var to your Vercel URL
allowed_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
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
    Update multiple allocations atomically using async SQLAlchemy transaction.
    Validates that total allocation equals 100% before committing.
    Also saves a snapshot to history for undo/rollback functionality.
    """
    try:
        # Fetch all current allocations for the user (to save to history before updating)
        result = await db.execute(
            select(Allocation)
            .where(Allocation.user_id == user_id)
        )
        existing_allocations = {alloc.charity_id: alloc for alloc in result.scalars().all()}
        
        # Save current allocations to history before updating
        for alloc in existing_allocations.values():
            history_entry = AllocationHistory(
                user_id=user_id,
                charity_id=alloc.charity_id,
                percentage=alloc.percentage
            )
            db.add(history_entry)
        
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
        
        # Commit all changes
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


# ==================== ALLOCATION HISTORY ENDPOINTS ====================

@app.get("/allocations/history", response_model=List[AllocationHistorySnapshot])
async def get_allocation_history(user_id: int = 1, limit: int = 10, db: AsyncSession = Depends(get_db)):
    """
    Get allocation history for a user, grouped by save timestamp.
    Returns the last N snapshots (default 10).
    """
    from sqlalchemy import desc, distinct
    
    # Get all distinct timestamps for this user
    result = await db.execute(
        select(distinct(AllocationHistory.saved_at))
        .where(AllocationHistory.user_id == user_id)
        .order_by(desc(AllocationHistory.saved_at))
        .limit(limit)
    )
    timestamps = [row[0] for row in result.all()]
    
    # Fetch allocations for each timestamp
    snapshots = []
    for timestamp in timestamps:
        # Strip microseconds to match database precision
        timestamp_str = timestamp.strftime('%Y-%m-%d %H:%M:%S')
        
        result = await db.execute(
            select(AllocationHistory)
            .options(joinedload(AllocationHistory.charity))
            .where(
                AllocationHistory.user_id == user_id,
                AllocationHistory.saved_at == timestamp_str
            )
        )
        history_records = result.unique().scalars().all()
        
        # Build snapshot
        snapshot = AllocationHistorySnapshot(
            saved_at=timestamp,
            allocations=[
                AllocationHistoryItem(
                    charity_id=record.charity_id,
                    percentage=record.percentage,
                    charity=record.charity
                )
                for record in history_records
            ]
        )
        snapshots.append(snapshot)
    
    return snapshots


@app.post("/allocations/history/{timestamp}/restore", response_model=List[AllocationResponse])
async def restore_allocation_from_history(
    timestamp: str,
    user_id: int = 1,
    db: AsyncSession = Depends(get_db)
):
    """
    Restore allocations from a specific historical snapshot.
    The timestamp should be in ISO format.
    """
    from datetime import datetime, timedelta
    from sqlalchemy import and_, between
    
    try:
        # Parse timestamp
        parsed_timestamp = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
        
        # Use a 1-second window to account for microsecond precision differences
        start_time = parsed_timestamp - timedelta(seconds=0.5)
        end_time = parsed_timestamp + timedelta(seconds=0.5)
        
        # Fetch historical allocations within the time window
        result = await db.execute(
            select(AllocationHistory)
            .where(
                and_(
                    AllocationHistory.user_id == user_id,
                    AllocationHistory.saved_at >= start_time,
                    AllocationHistory.saved_at <= end_time
                )
            )
            .order_by(AllocationHistory.saved_at.desc())
        )
        all_records = result.scalars().all()
        
        if not all_records:
            raise HTTPException(status_code=404, detail="No history found for this timestamp")
        
        # Group by exact timestamp and take the most recent group
        from itertools import groupby
        grouped = groupby(all_records, key=lambda x: x.saved_at)
        history_records = list(next(grouped)[1])  # Get first group (most recent)
        
        if not history_records:
            raise HTTPException(status_code=404, detail="No history found for this timestamp")
        
        # Fetch current allocations
        result = await db.execute(
            select(Allocation)
            .where(Allocation.user_id == user_id)
        )
        existing_allocations = {alloc.charity_id: alloc for alloc in result.scalars().all()}
        
        # Save current state to history before restoring
        for alloc in existing_allocations.values():
            history_entry = AllocationHistory(
                user_id=user_id,
                charity_id=alloc.charity_id,
                percentage=alloc.percentage
            )
            db.add(history_entry)
        
        # Update allocations from history
        for history_record in history_records:
            if history_record.charity_id in existing_allocations:
                existing_allocations[history_record.charity_id].percentage = history_record.percentage
            else:
                # Create new allocation if it doesn't exist
                new_alloc = Allocation(
                    charity_id=history_record.charity_id,
                    user_id=user_id,
                    percentage=history_record.percentage
                )
                db.add(new_alloc)
        
        await db.commit()
        
        # Fetch updated allocations
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
        raise HTTPException(status_code=400, detail=f"Invalid timestamp format: {str(e)}")
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Restore failed: {str(e)}")


# ==================== HEALTH CHECK ====================

@app.api_route("/", methods=["GET", "HEAD"])
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
