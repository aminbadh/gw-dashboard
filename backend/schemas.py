from pydantic import BaseModel, Field, field_validator
from typing import List


class CharityBase(BaseModel):
    """Base schema for Charity"""
    name: str = Field(..., min_length=1, max_length=200)
    description: str = Field(..., min_length=1)
    website_url: str = Field(..., pattern=r"^https?://")


class CharityCreate(CharityBase):
    """Schema for creating a new charity"""
    pass


class CharityResponse(CharityBase):
    """Schema for charity response"""
    id: int

    class Config:
        from_attributes = True


class AllocationBase(BaseModel):
    """Base schema for Allocation"""
    charity_id: int
    percentage: float = Field(..., ge=0.0, le=1.0, description="Percentage as decimal (0.0 to 1.0)")


class AllocationCreate(AllocationBase):
    """Schema for creating an allocation"""
    user_id: int = 1  # Mocked for POC


class AllocationUpdate(BaseModel):
    """Schema for updating allocations"""
    allocations: List[AllocationBase]

    @field_validator("allocations")
    def validate_total_percentage(cls, v):
        """Ensure all allocations sum to 100% (1.0)"""
        total = sum(allocation.percentage for allocation in v)
        if not (0.99 <= total <= 1.01):  # Allow for floating-point precision
            raise ValueError(f"Total allocation must equal 100% (1.0), got {total * 100:.2f}%")
        return v


class AllocationResponse(BaseModel):
    """Schema for allocation response with charity details"""
    id: int
    charity_id: int
    user_id: int
    percentage: float
    charity: CharityResponse

    class Config:
        from_attributes = True


class AllocationSimple(BaseModel):
    """Simplified allocation schema without nested charity"""
    id: int
    charity_id: int
    percentage: float

    class Config:
        from_attributes = True
