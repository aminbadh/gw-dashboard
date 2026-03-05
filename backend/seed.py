"""
Seed script to populate database with sample charities and allocations
Run with: python seed.py
"""
import asyncio
from sqlalchemy import select
from database import AsyncSessionLocal, init_db
from models import Charity, Allocation


async def seed_database():
    """Seed the database with sample data"""
    
    # Initialize database tables
    await init_db()
    print("✅ Database tables created")
    
    async with AsyncSessionLocal() as session:
        # Check if data already exists
        result = await session.execute(select(Charity))
        existing_charities = result.scalars().all()
        
        if existing_charities:
            print("⚠️  Database already contains data. Skipping seed.")
            return
        
        # Create sample charities (based on GiveWell recommendations)
        charities_data = [
            {
                "name": "Against Malaria Foundation",
                "description": "Distributes long-lasting insecticide-treated nets to prevent malaria in developing countries.",
                "website_url": "https://www.againstmalaria.com"
            },
            {
                "name": "GiveDirectly",
                "description": "Provides direct cash transfers to people living in extreme poverty in East Africa.",
                "website_url": "https://www.givedirectly.org"
            },
            {
                "name": "Helen Keller International",
                "description": "Provides vitamin A supplementation to prevent child blindness and death in developing countries.",
                "website_url": "https://www.hki.org"
            },
            {
                "name": "Malaria Consortium",
                "description": "Implements seasonal malaria chemoprevention programs to protect children from malaria.",
                "website_url": "https://www.malariaconsortium.org"
            },
            {
                "name": "New Incentives",
                "description": "Provides conditional cash transfers to increase vaccination coverage in North West Nigeria.",
                "website_url": "https://www.newincentives.org"
            }
        ]
        
        # Insert charities
        charities = []
        for charity_data in charities_data:
            charity = Charity(**charity_data)
            session.add(charity)
            charities.append(charity)
        
        await session.commit()
        print(f"✅ Created {len(charities)} charities")
        
        # Refresh to get IDs
        for charity in charities:
            await session.refresh(charity)
        
        # Create sample allocations for user_id=1 (equal distribution)
        allocation_percentage = 1.0 / len(charities)  # Split equally
        
        for charity in charities:
            allocation = Allocation(
                charity_id=charity.id,
                user_id=1,
                percentage=allocation_percentage
            )
            session.add(allocation)
        
        await session.commit()
        print(f"✅ Created {len(charities)} allocations with equal distribution ({allocation_percentage * 100:.1f}% each)")
        
        print("\n🎉 Database seeded successfully!")
        print("\n📊 Sample Data:")
        for charity in charities:
            print(f"  - {charity.name}")


if __name__ == "__main__":
    print("🌱 Seeding database...\n")
    asyncio.run(seed_database())
