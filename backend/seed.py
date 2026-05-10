"""
Seed script — run once to populate cities and activities.
Usage: python seed.py
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database.db import SessionLocal
from app.models.user import User
from app.models.city import City, Activity
from app.utils.auth import hash_password

ADMIN_EMAIL    = "admin123@gmail.com"
ADMIN_PASSWORD = "admin123"
ADMIN_NAME     = "Admin"

CITIES = [
    {"name": "Paris", "country": "France", "region": "Europe", "description": "The City of Light, famous for art, fashion, and cuisine.", "image_url": "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800", "avg_daily_cost": 150.0, "popularity_score": 98, "is_featured": True},
    {"name": "Tokyo", "country": "Japan", "region": "Asia", "description": "A blend of ultramodern and traditional, from neon-lit skyscrapers to historic temples.", "image_url": "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800", "avg_daily_cost": 120.0, "popularity_score": 97, "is_featured": True},
    {"name": "New York", "country": "USA", "region": "North America", "description": "The city that never sleeps — iconic skyline, culture, and energy.", "image_url": "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800", "avg_daily_cost": 200.0, "popularity_score": 96, "is_featured": True},
    {"name": "Rome", "country": "Italy", "region": "Europe", "description": "The Eternal City with millennia of history, art, and incredible food.", "image_url": "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800", "avg_daily_cost": 130.0, "popularity_score": 95, "is_featured": True},
    {"name": "Bali", "country": "Indonesia", "region": "Asia", "description": "Island of the Gods — lush rice terraces, temples, and beaches.", "image_url": "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800", "avg_daily_cost": 60.0, "popularity_score": 94, "is_featured": True},
    {"name": "Barcelona", "country": "Spain", "region": "Europe", "description": "Gaudí architecture, vibrant nightlife, and beautiful Mediterranean beaches.", "image_url": "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800", "avg_daily_cost": 120.0, "popularity_score": 93, "is_featured": True},
    {"name": "Dubai", "country": "UAE", "region": "Middle East", "description": "Futuristic skyline, luxury shopping, and desert adventures.", "image_url": "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800", "avg_daily_cost": 180.0, "popularity_score": 92, "is_featured": True},
    {"name": "London", "country": "UK", "region": "Europe", "description": "Historic landmarks, world-class museums, and a thriving cultural scene.", "image_url": "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800", "avg_daily_cost": 170.0, "popularity_score": 95, "is_featured": True},
    {"name": "Singapore", "country": "Singapore", "region": "Asia", "description": "A gleaming city-state known for food, gardens, and efficiency.", "image_url": "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800", "avg_daily_cost": 140.0, "popularity_score": 91, "is_featured": False},
    {"name": "Mumbai", "country": "India", "region": "Asia", "description": "India's financial capital — Bollywood, street food, and colonial architecture.", "image_url": "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=800", "avg_daily_cost": 40.0, "popularity_score": 88, "is_featured": False},
    {"name": "Istanbul", "country": "Turkey", "region": "Europe", "description": "Where East meets West — stunning mosques, bazaars, and Bosphorus views.", "image_url": "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800", "avg_daily_cost": 70.0, "popularity_score": 90, "is_featured": True},
    {"name": "Sydney", "country": "Australia", "region": "Oceania", "description": "Iconic Opera House, Harbour Bridge, and stunning beaches.", "image_url": "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=800", "avg_daily_cost": 160.0, "popularity_score": 92, "is_featured": False},
]

ACTIVITIES = {
    "Paris": [
        {"name": "Eiffel Tower Visit", "category": "sightseeing", "description": "Visit the iconic iron lattice tower on the Champ de Mars.", "estimated_cost": 25.0, "duration_hours": 2.0},
        {"name": "Louvre Museum", "category": "culture", "description": "World's largest art museum — home to the Mona Lisa.", "estimated_cost": 17.0, "duration_hours": 4.0},
        {"name": "Seine River Cruise", "category": "sightseeing", "description": "Scenic boat cruise along the Seine past Notre-Dame and bridges.", "estimated_cost": 15.0, "duration_hours": 1.5},
        {"name": "Montmartre Food Tour", "category": "food", "description": "Explore the bohemian Montmartre district with local food tastings.", "estimated_cost": 45.0, "duration_hours": 3.0},
        {"name": "Versailles Day Trip", "category": "culture", "description": "Visit the opulent Palace of Versailles and its gardens.", "estimated_cost": 20.0, "duration_hours": 6.0},
        {"name": "Champs-Élysées Shopping", "category": "shopping", "description": "Shop along the world's most famous avenue.", "estimated_cost": 0.0, "duration_hours": 3.0},
    ],
    "Tokyo": [
        {"name": "Senso-ji Temple", "category": "culture", "description": "Tokyo's oldest temple in the historic Asakusa district.", "estimated_cost": 0.0, "duration_hours": 2.0},
        {"name": "Shibuya Crossing Walk", "category": "sightseeing", "description": "Experience the world's busiest pedestrian crossing.", "estimated_cost": 0.0, "duration_hours": 1.0},
        {"name": "Tsukiji Outer Market Food Tour", "category": "food", "description": "Sample fresh sushi, tamagoyaki, and street food at the famous market.", "estimated_cost": 30.0, "duration_hours": 2.0},
        {"name": "teamLab Borderless", "category": "culture", "description": "Immersive digital art museum — a unique sensory experience.", "estimated_cost": 32.0, "duration_hours": 3.0},
        {"name": "Akihabara Electronics Tour", "category": "shopping", "description": "Explore Tokyo's electric town for gadgets, anime, and manga.", "estimated_cost": 0.0, "duration_hours": 3.0},
        {"name": "Mt. Fuji Day Trip", "category": "adventure", "description": "Day trip to Japan's iconic sacred mountain.", "estimated_cost": 50.0, "duration_hours": 10.0},
    ],
    "New York": [
        {"name": "Statue of Liberty & Ellis Island", "category": "sightseeing", "description": "Ferry trip to the iconic Statue of Liberty.", "estimated_cost": 24.0, "duration_hours": 4.0},
        {"name": "Central Park Walk", "category": "sightseeing", "description": "Stroll through 843 acres of urban parkland.", "estimated_cost": 0.0, "duration_hours": 2.0},
        {"name": "Metropolitan Museum of Art", "category": "culture", "description": "One of the world's greatest art museums.", "estimated_cost": 25.0, "duration_hours": 4.0},
        {"name": "Broadway Show", "category": "culture", "description": "Watch a world-class musical or play on Broadway.", "estimated_cost": 120.0, "duration_hours": 3.0},
        {"name": "NYC Food Tour - Manhattan", "category": "food", "description": "Taste NYC's iconic foods — pizza, bagels, hot dogs, and more.", "estimated_cost": 55.0, "duration_hours": 3.0},
        {"name": "Times Square & 5th Ave Shopping", "category": "shopping", "description": "Shop at flagship stores along 5th Avenue.", "estimated_cost": 0.0, "duration_hours": 3.0},
    ],
    "Rome": [
        {"name": "Colosseum & Roman Forum", "category": "sightseeing", "description": "Explore the ancient amphitheater and the heart of ancient Rome.", "estimated_cost": 18.0, "duration_hours": 3.0},
        {"name": "Vatican Museums & Sistine Chapel", "category": "culture", "description": "World-renowned art collection including Michelangelo's ceiling.", "estimated_cost": 20.0, "duration_hours": 4.0},
        {"name": "Trastevere Food Walk", "category": "food", "description": "Eat your way through Rome's most charming neighborhood.", "estimated_cost": 40.0, "duration_hours": 3.0},
        {"name": "Trevi Fountain & Spanish Steps", "category": "sightseeing", "description": "Visit Rome's most iconic fountains and piazzas.", "estimated_cost": 0.0, "duration_hours": 2.0},
        {"name": "Cooking Class — Pasta & Tiramisu", "category": "food", "description": "Learn to make authentic Roman pasta and dessert.", "estimated_cost": 75.0, "duration_hours": 3.0},
        {"name": "Borghese Gallery", "category": "culture", "description": "Stunning Baroque art and sculpture in a beautiful villa.", "estimated_cost": 15.0, "duration_hours": 2.0},
    ],
    "Bali": [
        {"name": "Ubud Monkey Forest", "category": "sightseeing", "description": "Sacred forest sanctuary with hundreds of Balinese long-tailed monkeys.", "estimated_cost": 5.0, "duration_hours": 2.0},
        {"name": "Tegallalang Rice Terraces", "category": "sightseeing", "description": "Stunning UNESCO-listed rice paddies north of Ubud.", "estimated_cost": 2.0, "duration_hours": 2.0},
        {"name": "Tanah Lot Temple Sunset", "category": "culture", "description": "Watch the sunset at Bali's most photographed sea temple.", "estimated_cost": 3.0, "duration_hours": 2.0},
        {"name": "Bali Cooking Class", "category": "food", "description": "Learn to cook traditional Balinese dishes with local spices.", "estimated_cost": 35.0, "duration_hours": 4.0},
        {"name": "White Water Rafting — Ayung River", "category": "adventure", "description": "Thrilling rafting through jungle gorges and waterfalls.", "estimated_cost": 40.0, "duration_hours": 3.0},
        {"name": "Seminyak Beach & Sunset", "category": "sightseeing", "description": "Relax on Bali's trendiest beach and watch the sunset.", "estimated_cost": 0.0, "duration_hours": 3.0},
    ],
    "Barcelona": [
        {"name": "Sagrada Família", "category": "sightseeing", "description": "Gaudí's unfinished masterpiece — a breathtaking basilica.", "estimated_cost": 26.0, "duration_hours": 2.0},
        {"name": "Park Güell", "category": "sightseeing", "description": "Colorful mosaic park with panoramic city views.", "estimated_cost": 10.0, "duration_hours": 2.0},
        {"name": "La Boqueria Market Food Tour", "category": "food", "description": "Explore Barcelona's famous market with fresh produce and tapas.", "estimated_cost": 20.0, "duration_hours": 2.0},
        {"name": "Gothic Quarter Walking Tour", "category": "culture", "description": "Wander through medieval streets of the Barri Gòtic.", "estimated_cost": 15.0, "duration_hours": 2.5},
        {"name": "Barceloneta Beach", "category": "adventure", "description": "Swim and relax at Barcelona's most popular urban beach.", "estimated_cost": 0.0, "duration_hours": 3.0},
        {"name": "Passeig de Gràcia Shopping", "category": "shopping", "description": "Shop along Barcelona's most elegant boulevard.", "estimated_cost": 0.0, "duration_hours": 3.0},
    ],
    "Dubai": [
        {"name": "Burj Khalifa — At the Top", "category": "sightseeing", "description": "Visit the observation deck of the world's tallest building.", "estimated_cost": 35.0, "duration_hours": 2.0},
        {"name": "Desert Safari", "category": "adventure", "description": "Dune bashing, camel riding, and BBQ dinner under the stars.", "estimated_cost": 60.0, "duration_hours": 6.0},
        {"name": "Dubai Mall & Dubai Fountain", "category": "shopping", "description": "Shop at the world's largest mall and watch the fountain show.", "estimated_cost": 0.0, "duration_hours": 4.0},
        {"name": "Dubai Creek & Gold Souk", "category": "culture", "description": "Explore the historic creek and traditional gold and spice souks.", "estimated_cost": 5.0, "duration_hours": 3.0},
        {"name": "Dubai Frame", "category": "sightseeing", "description": "Walk across the glass bridge framing old and new Dubai.", "estimated_cost": 14.0, "duration_hours": 1.5},
        {"name": "Jumeirah Mosque Tour", "category": "culture", "description": "Guided tour of one of Dubai's most beautiful mosques.", "estimated_cost": 5.0, "duration_hours": 1.5},
    ],
    "London": [
        {"name": "British Museum", "category": "culture", "description": "World-class collection of art and antiquities from across the globe.", "estimated_cost": 0.0, "duration_hours": 4.0},
        {"name": "Tower of London & Tower Bridge", "category": "sightseeing", "description": "Historic castle and iconic Victorian bridge.", "estimated_cost": 30.0, "duration_hours": 3.0},
        {"name": "Buckingham Palace & St. James's Park", "category": "sightseeing", "description": "Watch the Changing of the Guard and stroll through the royal park.", "estimated_cost": 0.0, "duration_hours": 2.0},
        {"name": "Borough Market Food Tour", "category": "food", "description": "London's oldest food market with artisan produce and street food.", "estimated_cost": 20.0, "duration_hours": 2.0},
        {"name": "West End Theatre Show", "category": "culture", "description": "Catch a world-famous musical in London's theatre district.", "estimated_cost": 80.0, "duration_hours": 3.0},
        {"name": "Oxford Street & Covent Garden Shopping", "category": "shopping", "description": "Shop at London's most famous retail streets.", "estimated_cost": 0.0, "duration_hours": 3.0},
    ],
    "Singapore": [
        {"name": "Gardens by the Bay", "category": "sightseeing", "description": "Futuristic Supertrees and stunning indoor gardens.", "estimated_cost": 28.0, "duration_hours": 3.0},
        {"name": "Marina Bay Sands SkyPark", "category": "sightseeing", "description": "Iconic infinity pool and observation deck with city views.", "estimated_cost": 23.0, "duration_hours": 2.0},
        {"name": "Hawker Centre Food Crawl", "category": "food", "description": "Eat your way through Singapore's legendary hawker centres.", "estimated_cost": 15.0, "duration_hours": 2.0},
        {"name": "Sentosa Island Adventure", "category": "adventure", "description": "Beach, Universal Studios, and cable car on Sentosa Island.", "estimated_cost": 80.0, "duration_hours": 8.0},
        {"name": "Chinatown & Little India Walk", "category": "culture", "description": "Explore Singapore's vibrant ethnic enclaves.", "estimated_cost": 0.0, "duration_hours": 3.0},
        {"name": "Orchard Road Shopping", "category": "shopping", "description": "Singapore's premier shopping belt with luxury and high-street brands.", "estimated_cost": 0.0, "duration_hours": 3.0},
    ],
    "Mumbai": [
        {"name": "Gateway of India", "category": "sightseeing", "description": "Iconic arch monument overlooking the Arabian Sea.", "estimated_cost": 0.0, "duration_hours": 1.0},
        {"name": "Dharavi Slum Tour", "category": "culture", "description": "Eye-opening guided tour of Asia's largest urban slum.", "estimated_cost": 15.0, "duration_hours": 3.0},
        {"name": "Mumbai Street Food Walk", "category": "food", "description": "Taste vada pav, pav bhaji, and bhel puri on the streets.", "estimated_cost": 10.0, "duration_hours": 2.0},
        {"name": "Elephanta Caves", "category": "culture", "description": "UNESCO rock-cut cave temples on an island in Mumbai Harbour.", "estimated_cost": 8.0, "duration_hours": 4.0},
        {"name": "Marine Drive Sunset Walk", "category": "sightseeing", "description": "Stroll along the Queen's Necklace at sunset.", "estimated_cost": 0.0, "duration_hours": 1.5},
        {"name": "Colaba Causeway Shopping", "category": "shopping", "description": "Browse antiques, clothes, and souvenirs at this famous street market.", "estimated_cost": 0.0, "duration_hours": 2.0},
    ],
    "Istanbul": [
        {"name": "Hagia Sophia", "category": "culture", "description": "Magnificent Byzantine cathedral turned mosque with stunning mosaics.", "estimated_cost": 0.0, "duration_hours": 2.0},
        {"name": "Grand Bazaar", "category": "shopping", "description": "One of the world's oldest and largest covered markets.", "estimated_cost": 0.0, "duration_hours": 3.0},
        {"name": "Bosphorus Cruise", "category": "sightseeing", "description": "Scenic cruise between Europe and Asia along the Bosphorus strait.", "estimated_cost": 15.0, "duration_hours": 2.0},
        {"name": "Turkish Cooking Class", "category": "food", "description": "Learn to make baklava, kebabs, and mezes.", "estimated_cost": 50.0, "duration_hours": 3.0},
        {"name": "Topkapi Palace", "category": "culture", "description": "Former Ottoman palace with imperial treasures and harem.", "estimated_cost": 15.0, "duration_hours": 3.0},
        {"name": "Spice Bazaar & Street Food", "category": "food", "description": "Explore the Egyptian Bazaar and taste Turkish street food.", "estimated_cost": 10.0, "duration_hours": 2.0},
    ],
    "Sydney": [
        {"name": "Sydney Opera House Tour", "category": "culture", "description": "Guided tour of the world-famous performing arts venue.", "estimated_cost": 40.0, "duration_hours": 1.5},
        {"name": "Bondi Beach & Coastal Walk", "category": "adventure", "description": "Swim at Bondi and walk the stunning coastal cliff path to Coogee.", "estimated_cost": 0.0, "duration_hours": 4.0},
        {"name": "Sydney Harbour Bridge Climb", "category": "adventure", "description": "Climb to the top of the iconic Harbour Bridge for panoramic views.", "estimated_cost": 170.0, "duration_hours": 3.5},
        {"name": "Taronga Zoo", "category": "sightseeing", "description": "World-class zoo with native Australian animals and harbour views.", "estimated_cost": 47.0, "duration_hours": 4.0},
        {"name": "The Rocks Food & History Tour", "category": "food", "description": "Explore Sydney's oldest neighbourhood with food and history.", "estimated_cost": 35.0, "duration_hours": 2.5},
        {"name": "Queen Victoria Building Shopping", "category": "shopping", "description": "Shop in Sydney's most beautiful heritage building.", "estimated_cost": 0.0, "duration_hours": 2.0},
    ],
}


def seed():
    db = SessionLocal()
    try:
        # --- Admin user ---
        if not db.query(User).filter(User.email == ADMIN_EMAIL).first():
            db.add(User(
                name=ADMIN_NAME,
                email=ADMIN_EMAIL,
                password_hash=hash_password(ADMIN_PASSWORD),
                is_admin=True,
                is_active=True,
            ))
            db.commit()
            print(f"Admin created: {ADMIN_EMAIL} / {ADMIN_PASSWORD}")
        else:
            print("Admin already exists. Skipping.")

        if db.query(City).count() > 0:
            print("Cities already seeded. Skipping.")
            return

        print("Seeding cities and activities...")
        for city_data in CITIES:
            city = City(**city_data)
            db.add(city)
            db.flush()  # get city.id before adding activities

            for act_data in ACTIVITIES.get(city_data["name"], []):
                db.add(Activity(city_id=city.id, **act_data))

        db.commit()
        city_count = db.query(City).count()
        activity_count = db.query(Activity).count()
        print(f"Done. {city_count} cities and {activity_count} activities seeded.")
    except Exception as e:
        db.rollback()
        print(f"Seeding failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
