from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from database import Base


class Charity(Base):
    """Model representing a high-impact charity"""
    __tablename__ = "charities"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)
    description = Column(String, nullable=False)
    website_url = Column(String, nullable=False)
    
    # Relationship to allocations
    allocations = relationship("Allocation", back_populates="charity", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Charity(name='{self.name}')>"


class Allocation(Base):
    """Model representing fund allocation to a charity"""
    __tablename__ = "allocations"

    id = Column(Integer, primary_key=True, index=True)
    charity_id = Column(Integer, ForeignKey("charities.id"), nullable=False)
    user_id = Column(Integer, nullable=False, default=1)  # Mocked user ID for POC
    percentage = Column(Float, nullable=False, default=0.0)  # 0.0 to 1.0 (representing 0% to 100%)
    
    # Relationship to charity
    charity = relationship("Charity", back_populates="allocations")

    def __repr__(self):
        return f"<Allocation(charity_id={self.charity_id}, percentage={self.percentage * 100}%)>"
