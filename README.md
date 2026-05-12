# Travelloop 🌍

> A personalized, end-to-end travel planning platform built for the **Odoo Hackathon**.

Travelloop lets users create multi-city itineraries, track budgets, manage packing lists, write trip notes, and share their plans publicly — all backed by a well-structured relational database and a clean, responsive UI.

---

## Tech Stack

| Layer     | Technology                                      |
|-----------|-------------------------------------------------|
| Frontend  | React 18, Tailwind CSS, Lucide Icons, Axios     |
| Backend   | FastAPI (Python), SQLAlchemy ORM, Pydantic v2   |
| Database  | MySQL                                           |
| Auth      | JWT (python-jose) + bcrypt password hashing     |

---

## Features

### User Authentication
- Register and login with email + password
- JWT token persisted in localStorage — survives page refresh
- Deactivated accounts blocked at login
- Beautiful 3:1 split login/register UI with feature highlights

### Dashboard
- Welcome message with user's first name
- Recent trips with status badges and budget indicators
- Budget highlights — total spent, over-budget alerts across trips
- Featured destinations grid with avg daily cost and popularity score
- Quick action cards — Plan Trip, Explore Cities, My Trips

### Trip Management
- Create trips with name, description, dates, budget limit, cover photo
- Edit trip details and status (Draft → Planned → Ongoing → Completed)
- Delete trips with cascade — removes all stops, activities, budget, notes, packing
- Trip cards showing date range, stop count, budget badge

### Itinerary Builder (Trip Detail)
- **List view** — stop cards with activities, costs, edit/delete actions
- **Timeline view** — vertical timeline with day numbers, nights, arrival/departure dates
- Add, edit, delete stops per trip
- Share button with clipboard copy and tooltip feedback

### City & Stop Management
- Search cities by name with live dropdown
- Add stops with arrival/departure dates, accommodation and transport costs, notes
- Edit existing stops — all fields pre-filled
- Stop order tracked for consistent itinerary display

### Activity Management
- Browse all activities for a city
- Filter by category (sightseeing, food, adventure, culture, shopping)
- Filter by max cost
- Add/remove activities per stop — duplicate prevention enforced
- Activity city validation — can't add an activity from a different city

### Budget & Cost Breakdown
- Per-category expense entry: Transport, Accommodation, Activities, Meals, Miscellaneous
- CSS `conic-gradient` pie chart — no external chart library
- Per-category progress bars with percentage
- Cost per day calculation
- Remaining budget tracker with progress bar
- Over-budget alert banner with exact overage amount

### Packing Checklist
- Add items with category: Clothing, Documents, Electronics, Toiletries, Medicines, Other
- Check/uncheck items — strikethrough on packed items
- Grouped display by category
- Progress bar showing packed/total count
- Reset all — uncheck everything in one click

### Trip Notes / Journal
- Add notes with optional title and content
- Inline edit mode — no page navigation needed
- Delete with confirmation
- Sorted by newest first with timestamp display

### City Explorer
- Browse all 12 seeded cities with images, descriptions, avg daily cost, popularity score
- Search by name — live filter
- Filter by country — dropdown populated from actual DB data
- Save/unsave cities as bookmarks (bookmark icon per card)
- Clear filters button

### City Detail
- Full city info — description, avg daily cost, popularity, featured status
- All activities listed with category badge, cost, and duration

### Shared / Public Itinerary
- Generate a unique public URL per trip (UUID token)
- Read-only public view — no login required
- Copy link to clipboard
- Share to WhatsApp and Twitter
- "Copy to My Trips" — logged-in users can clone the full itinerary

### User Profile & Settings
- Edit name and language preference
- Email shown as read-only (cannot be changed)
- Saved destinations list with unsave button and link to city detail
- Account info — member since date, active status
- Delete account with name-confirmation guard — cascades all user data

### Admin Dashboard *(Optional Feature)*
- Protected route — only `is_admin = true` users can access
- Admin link with shield icon in navbar (hidden for regular users)
- **Stats cards** — Total Users, Trips, Cities, Activities, Stops, Inactive Users
- **Trip status breakdown** — Draft / Planned / Ongoing / Completed pill counts
- **Top Cities chart** — CSS gradient bar chart ranked by trip stop count
- **Top Activities list** — ranked by usage count across all trips
- **User management table** — name, email, trip count, join date, role badge, status badge
- Toggle activate/deactivate any non-admin user in one click

---

## Database Schema

```
users
  id, name, email, password_hash, profile_photo,
  language_preference, is_active, is_admin, created_at, updated_at

cities
  id, name, country, region, description, image_url,
  avg_daily_cost, popularity_score, is_featured
  [UNIQUE: name + country]

activities
  id, city_id → cities, name, category, description,
  image_url, estimated_cost, duration_hours
  [INDEX: city_id + category]

trips
  id, user_id → users, name, description, cover_photo,
  start_date, end_date, status (enum), total_budget,
  is_public, created_at, updated_at

trip_stops
  id, trip_id → trips, city_id → cities, stop_order,
  arrival_date, departure_date, accommodation_cost,
  transport_cost, notes

stop_activities
  id, stop_id → trip_stops, activity_id → activities,
  scheduled_date, custom_cost

trip_budgets
  id, trip_id → trips (1:1), transport_cost,
  accommodation_cost, activity_cost, meals_cost, misc_cost

packing_items
  id, trip_id → trips, name, category (enum), is_packed, created_at

trip_notes
  id, trip_id → trips, stop_id → trip_stops (nullable),
  title, content, created_at, updated_at

shared_trips
  id, trip_id → trips (1:1), share_token (UUID, unique),
  is_active, created_at

saved_destinations
  id, user_id → users, city_id → cities, saved_at
  [UNIQUE: user_id + city_id]
```

---

## Project Structure

```
Travelloop/
├── backend/
│   ├── app/
│   │   ├── database/
│   │   │   └── db.py              # SQLAlchemy engine, session, Base
│   │   ├── models/
│   │   │   ├── user.py            # User model
│   │   │   ├── city.py            # City, Activity models
│   │   │   ├── trip.py            # Trip, TripStop, StopActivity models
│   │   │   └── extras.py          # TripBudget, PackingItem, TripNote,
│   │   │                          # SharedTrip, SavedDestination
│   │   ├── routers/
│   │   │   ├── auth.py            # POST /auth/register, /auth/login
│   │   │   ├── users.py           # GET/PUT/DELETE /users/me, saved destinations
│   │   │   ├── cities.py          # GET /cities, /cities/{id}, /cities/{id}/activities
│   │   │   ├── trips.py           # CRUD /trips
│   │   │   ├── stops.py           # CRUD /trips/{id}/stops + activities
│   │   │   ├── budget.py          # GET/PUT /trips/{id}/budget
│   │   │   ├── packing.py         # CRUD /trips/{id}/packing + reset
│   │   │   ├── notes.py           # CRUD /trips/{id}/notes
│   │   │   ├── share.py           # POST /trips/{id}/share, GET/POST /shared/{token}
│   │   │   └── admin.py           # GET /admin/stats, top-cities, top-activities, users
│   │   ├── schemas/
│   │   │   ├── user.py            # UserRegister, UserLogin, UserOut, TokenOut
│   │   │   ├── city.py            # CityOut, ActivityOut, CityWithActivities
│   │   │   ├── trip.py            # TripCreate/Update/Out, StopCreate/Update/Out
│   │   │   └── extras.py          # BudgetUpdate/Out, PackingItem*, Note*, SharedTripOut
│   │   ├── utils/
│   │   │   ├── auth.py            # bcrypt hash/verify, JWT create/decode
│   │   │   └── deps.py            # get_current_user dependency
│   │   └── main.py                # FastAPI app, CORS, router registration
│   ├── seed.py                    # Seeds 12 cities × 6 activities each
│   ├── make_admin.py              # Promote a user to admin by email
│   └── requirements.txt
│
└── frontend/
    └── src/
        ├── components/
        │   └── Navbar.jsx         # Sticky navbar — logo, nav links, admin link, logout
        ├── context/
        │   └── AuthContext.jsx    # Auth state, login/logout, localStorage persistence
        ├── services/
        │   └── api.js             # Axios instance, Bearer token interceptor
        ├── pages/
        │   ├── Login.jsx          # 3:1 split layout with feature highlights
        │   ├── Register.jsx       # 3:1 split layout
        │   ├── Dashboard.jsx      # Home — trips, budget highlights, featured cities
        │   ├── TripsList.jsx      # All trips grid with edit/delete
        │   ├── CreateTrip.jsx     # New trip form
        │   ├── EditTrip.jsx       # Edit trip — pre-filled, status dropdown
        │   ├── TripDetail.jsx     # List/Timeline toggle, share, budget sidebar
        │   ├── AddStop.jsx        # City search dropdown + stop form
        │   ├── EditStop.jsx       # Pre-filled stop edit form
        │   ├── AddActivity.jsx    # Activity browser with category/cost filters
        │   ├── Budget.jsx         # Pie chart, progress bars, cost-per-day stats
        │   ├── Packing.jsx        # Grouped checklist with progress bar + reset
        │   ├── Notes.jsx          # Inline add/edit/delete notes with timestamps
        │   ├── Cities.jsx         # City grid with search, country filter, save/unsave
        │   ├── CityDetail.jsx     # City info + full activities list
        │   ├── Profile.jsx        # Edit profile, saved destinations, delete account
        │   ├── SharedTrip.jsx     # Public read-only view, share buttons, copy trip
        │   └── AdminDashboard.jsx # Stats, charts, user management table
        ├── App.jsx                # All 19 routes with PrivateRoute/AdminRoute guards
        ├── index.css              # Tailwind + custom components (btn-primary, card, etc.)
        └── index.js               # React root with AuthProvider
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login, returns JWT + user |
| GET/PUT/DELETE | `/users/me` | Get, update, delete own profile |
| GET/POST/DELETE | `/users/me/saved-destinations/{city_id}` | Manage saved cities |
| GET | `/cities` | List cities (search, country, region, featured filters) |
| GET | `/cities/{id}` | City detail with activities |
| GET | `/cities/{id}/activities` | Activities (category, max_cost filters) |
| GET/POST | `/trips` | List / create trips |
| GET/PUT/DELETE | `/trips/{id}` | Get, update, delete trip |
| GET/POST | `/trips/{id}/stops` | List / add stops |
| PUT/DELETE | `/trips/{id}/stops/{sid}` | Update / delete stop |
| PUT | `/trips/{id}/stops/reorder` | Reorder stops |
| POST/DELETE | `/trips/{id}/stops/{sid}/activities` | Add / remove activity from stop |
| GET/PUT | `/trips/{id}/budget` | Get / update budget (auto-creates if missing) |
| GET/POST/PUT/DELETE | `/trips/{id}/packing` | Packing list CRUD |
| POST | `/trips/{id}/packing/reset` | Uncheck all packing items |
| GET/POST/PUT/DELETE | `/trips/{id}/notes` | Notes CRUD |
| POST | `/trips/{id}/share` | Generate share token |
| GET | `/shared/{token}` | Public trip view |
| POST | `/shared/{token}/copy` | Copy shared trip to own account |
| GET | `/admin/stats` | Platform stats (admin only) |
| GET | `/admin/top-cities` | Top 10 cities by stop count (admin only) |
| GET | `/admin/top-activities` | Top 10 activities by usage (admin only) |
| GET | `/admin/users` | All users with trip count (admin only) |
| PATCH | `/admin/users/{id}/toggle-active` | Activate / deactivate user (admin only) |

Interactive API docs available at `http://localhost:8000/docs`

---

## Setup & Running

### Prerequisites
- Python 3.10+
- Node.js 18+
- MySQL running locally

### 1. Database
Create the database in MySQL:
```sql
CREATE DATABASE travelloop;
```

### 2. Backend
```bash
cd backend
pip install -r requirements.txt
py -m uvicorn app.main:app --reload
```
Tables are auto-created on first run via SQLAlchemy.

### 3. Seed Data
Run once to populate 12 cities and 72 activities:
```bash
cd backend
py seed.py
```

### 4. Frontend
```bash
cd frontend
npm install
npm start
```

Open `http://localhost:3000`

### 5. Make yourself Admin (optional)
After registering your account:
```bash
cd backend
py make_admin.py your@email.com
```
Then log in — you'll see the **Admin** link in the navbar.

---

## Seeded Cities

| City | Country | Avg/Day | Activities |
|------|---------|---------|------------|
| Paris | France | $150 | Eiffel Tower, Louvre, Seine Cruise, Montmartre Food Tour, Versailles, Shopping |
| Tokyo | Japan | $120 | Senso-ji, Shibuya Crossing, Tsukiji Market, teamLab, Akihabara, Mt. Fuji |
| New York | USA | $200 | Statue of Liberty, Central Park, Met Museum, Broadway, Food Tour, 5th Ave |
| Rome | Italy | $130 | Colosseum, Vatican, Trastevere Food Walk, Trevi Fountain, Cooking Class |
| Bali | Indonesia | $60 | Monkey Forest, Rice Terraces, Tanah Lot, Cooking Class, Rafting, Beach |
| Barcelona | Spain | $120 | Sagrada Família, Park Güell, La Boqueria, Gothic Quarter, Beach |
| Dubai | UAE | $180 | Burj Khalifa, Desert Safari, Dubai Mall, Gold Souk, Dubai Frame |
| London | UK | $170 | British Museum, Tower of London, Borough Market, West End Theatre |
| Singapore | Singapore | $140 | Gardens by the Bay, Marina Bay Sands, Hawker Centre, Sentosa Island |
| Mumbai | India | $40 | Gateway of India, Dharavi Tour, Street Food, Elephanta Caves |
| Istanbul | Turkey | $70 | Hagia Sophia, Grand Bazaar, Bosphorus Cruise, Topkapi Palace |
| Sydney | Australia | $160 | Opera House, Bondi Beach, Harbour Bridge Climb, Taronga Zoo |

---

## Key Design Decisions

- **No external chart libraries** — Budget pie chart uses pure CSS `conic-gradient`
- **JWT in localStorage** — Simple and effective for a hackathon context; token + user object both stored so auth persists on refresh
- **Auto-create budget** — `GET /trips/{id}/budget` creates an empty budget record if none exists, so the frontend never needs to handle a missing budget
- **Computed fields** — `total_cost` on budget and `stop_count` on trips are computed at query time, not stored, keeping the DB normalized
- **Ownership checks on every endpoint** — All trip/stop/budget/packing/notes endpoints filter by `user_id = current_user.id`, preventing cross-user data access
- **Activity city validation** — Backend rejects adding an activity to a stop if the activity belongs to a different city
- **Cascade deletes** — Deleting a user removes all trips; deleting a trip removes all stops, activities, budget, packing, notes, and share token
- **Admin guard on both sides** — Backend returns 403, frontend AdminRoute redirects to dashboard

---

## Environment

Backend reads from `backend/.env`:
```
DATABASE_URL=mysql+pymysql://root:root@localhost/travelloop
SECRET_KEY=travelloop_secret
```

---

## Git History

```
feat: complete Travelloop MVP for Odoo Hackathon
feat: admin dashboard with stats, top cities/activities, user management
fix: 5 bugs found in full audit
fix: resolve all frontend compile errors
```
