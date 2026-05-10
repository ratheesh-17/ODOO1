# Travelloop – Project Analysis

---

## Problem Statement (Original)

Design and develop a complete travel planning application where users can:
- Create customized multi-city itineraries
- Assign travel dates, activities, and budgets
- Discover activities and destinations through search
- Receive cost breakdowns and visual calendars
- Share their plans publicly or with friends

---

## What Has Been Built

All 14 features from the problem statement are implemented:

| # | Feature | Status |
|---|---------|--------|
| 1 | Login / Register | ✅ Done |
| 2 | Dashboard / Home | ✅ Done |
| 3 | Create Trip | ✅ Done |
| 4 | My Trips (Trip List) | ✅ Done |
| 5 | Itinerary Builder (Add/Edit/Reorder Stops) | ✅ Done |
| 6 | Itinerary View (Timeline + List toggle) | ✅ Done |
| 7 | City Search & Explore | ✅ Done |
| 8 | Activity Search & Add to Stop | ✅ Done |
| 9 | Budget & Cost Breakdown (Pie + Bar charts) | ✅ Done |
| 10 | Packing Checklist | ✅ Done |
| 11 | Shared / Public Itinerary View | ✅ Done |
| 12 | User Profile / Settings | ✅ Done |
| 13 | Trip Notes / Journal | ✅ Done |
| 14 | Admin / Analytics Dashboard | ✅ Done |

---

## Architecture Overview

### Backend (FastAPI + MySQL)
- `app/main.py` — FastAPI app, CORS, router registration
- `app/database/db.py` — SQLAlchemy engine + session
- `app/models/` — ORM models: User, Trip, TripStop, StopActivity, City, Activity, TripBudget, PackingItem, TripNote, SharedTrip, SavedDestination
- `app/schemas/` — Pydantic schemas for validation and serialization
- `app/routers/` — 10 routers: auth, users, cities, trips, stops, budget, packing, notes, share, admin
- `app/utils/auth.py` — bcrypt password hashing, JWT creation/decoding
- `app/utils/deps.py` — `get_current_user` dependency

### Frontend (React + Tailwind CSS)
- `src/context/AuthContext.jsx` — Global auth state (user + token in localStorage)
- `src/services/api.js` — Axios instance with JWT interceptor + 401 auto-logout
- `src/App.jsx` — React Router with PrivateRoute, PublicRoute, AdminRoute guards
- `src/components/Navbar.jsx` — Sticky nav with active link highlighting
- `src/pages/` — 18 page components, one per screen

---

## Issues & Gaps Found

### 🔴 Critical

1. **Weak JWT secret in production**
   - `backend/.env`: `SECRET_KEY=travelloop_secret_key_change_in_prod`
   - This is committed to the repo and is a trivially guessable value. Any token signed with this key can be forged.
   - **Fix:** Use a long random secret (e.g. `openssl rand -hex 32`) and never commit it.

2. **No rate limiting on auth endpoints**
   - `/auth/login` and `/auth/register` have no brute-force protection.
   - An attacker can try unlimited passwords.
   - **Fix:** Add `slowapi` or similar rate-limiting middleware.

3. **Profile.jsx: `setFormData` called twice on load (data loss risk)**
   - In `Profile.jsx` lines 33–38, `setFormData` is called twice in the same `load()` function. The first call (line 33) sets `name` and `language_preference` but immediately gets overwritten by the second call (line 34–38). This is harmless now but is a latent bug — if the second call ever fails or is removed, `profile_photo` would be missing.
   - **Fix:** Remove the first `setFormData` call, keep only the second one.

4. **`unsave_destination` uses `city_id` but the route passes `city.id` (SavedDestination primary key vs city FK)**
   - In `users.py` router, `DELETE /users/me/saved-destinations/{city_id}` queries `SavedDestination` by `city_id` (the FK), which is correct. However, in `Profile.jsx`, `handleUnsave(city.id)` passes the city's ID — this is consistent. No bug here, but the naming is confusing and could cause mistakes.

5. **No input sanitization on `profile_photo` and `cover_photo` URL fields**
   - These accept any URL string including `javascript:` URIs, which could enable XSS if rendered as `<img src>` without sanitization.
   - **Fix:** Validate that the URL starts with `http://` or `https://` in the Pydantic schema.

### 🟠 Medium

6. **Dashboard makes N+1 API calls for budgets**
   - `Dashboard.jsx` fetches all trips, then fires one `GET /trips/{id}/budget` per trip in `Promise.allSettled`. With many trips this is slow.
   - **Fix:** Add a backend endpoint like `GET /trips/budgets/summary` that returns all budget totals in one query.

7. **`AddActivity.jsx` has an eslint-disable comment hiding a missing dependency**
   - `useEffect` for `init()` has `// eslint-disable-line` suppressing the `tripId`/`stopId` dependency warning. If params change without remount, the effect won't re-run.
   - **Fix:** Add `[tripId, stopId]` to the dependency array properly.

8. **`TripDetail.jsx` has `useEffect` with eslint-disable for missing `fetchTripData` dependency**
   - Same pattern: `useEffect(() => { fetchTripData(); }, [tripId]); // eslint-disable-line react-hooks/exhaustive-deps`
   - **Fix:** Wrap `fetchTripData` in `useCallback` with `[tripId]` dependency, then include it in the effect array.

9. **`Notes.jsx` `handleDelete` has no error handling**
   - If the API call fails, the note is silently not deleted but no error is shown to the user.
   - **Fix:** Wrap in try/catch and set an error state.

10. **`CreateTrip.jsx` file upload is a dead feature**
    - The file picker reads the image locally for preview but explicitly sets `cover_photo: ''` and never uploads the file anywhere. The comment says "In production, upload to S3/Cloudinary". This means the file upload UI is non-functional.
    - **Fix:** Either remove the file picker UI and keep only the URL input, or implement actual file upload.

11. **`Login.jsx` "Forgot Password" is a fake feature**
    - `handleForgot` never calls any API. It just sets `forgotSent = true` and shows a fake success message. Users who click this will think they received an email but nothing happens.
    - **Fix:** Either implement the endpoint or remove the "Forgot password?" link entirely.

12. **`SharedTrip.jsx` uses `alert()` for copy link feedback**
    - `copyLink` calls `alert('Link copied!')` which is a blocking browser dialog — bad UX.
    - **Fix:** Use a toast/inline message like the rest of the app does.

13. **`admin.py` `list_users` loads all trips via `len(u.trips)` — N+1 query**
    - For each user, SQLAlchemy lazy-loads `u.trips` to count them. With many users this fires N extra queries.
    - **Fix:** Use a subquery count: `func.count(Trip.id)` with a join instead of `len(u.trips)`.

14. **Stop dates are not validated against trip dates**
    - A stop can have `arrival_date` before the trip's `start_date` or after `end_date`. The backend only validates that `departure >= arrival` within the stop itself.
    - **Fix:** In `stops.py`, check that `arrival_date >= trip.start_date` and `departure_date <= trip.end_date`.

### 🟡 Low / Polish

15. **`Profile.jsx` indentation inconsistency**
    - The profile photo `<div>` block (lines 97–104) is not indented to match the surrounding `<div className="card">` children. Minor but visible in code review.

16. **`LANGUAGES` array in `Profile.jsx` has no human-readable labels**
    - The language dropdown shows raw codes (`EN`, `ES`, `FR`...) instead of full names (`English`, `Spanish`, `French`).
    - **Fix:** Map codes to display names.

17. **No 404 / catch-all route in `App.jsx`**
    - Navigating to an unknown URL (e.g. `/foo`) redirects to `/dashboard` via the `<Route path="/" element={<Navigate to="/dashboard" />} />` catch, but only if the path is exactly `/`. Any other unknown path shows a blank page.
    - **Fix:** Add `<Route path="*" element={<Navigate to="/dashboard" />} />`.

18. **`seed.py` and `make_admin.py` are in the repo root with hardcoded credentials**
    - These utility scripts connect directly with `root:root` credentials. They should not be committed or should use environment variables.

19. **`declarative_base` is deprecated in SQLAlchemy 2.x**
    - `from sqlalchemy.ext.declarative import declarative_base` is the legacy import. The modern import is `from sqlalchemy.orm import DeclarativeBase`.
    - **Fix:** Update to the modern API to avoid deprecation warnings.

20. **No `updated_at` on `User` model when `profile_photo` is null initially**
    - `updated_at` uses `onupdate=func.now()` which only fires on SQL UPDATE. If a user never updates their profile, `updated_at` is `NULL`. This is fine but worth noting if you display it anywhere.

---

## What's Missing vs. Problem Statement

| Requirement | Gap |
|-------------|-----|
| "Visual calendars" | No calendar view — only timeline/list toggle. A date-grid calendar view is not implemented. |
| "Automatic budget estimation" | Budget is manually entered. There's no auto-calculation from stop costs (accommodation + transport) into the budget tracker. Stop costs exist in `TripStop` but are separate from `TripBudget`. |
| "Recommended destinations" | Dashboard shows featured cities but there's no personalization — it's the same list for all users. |
| Password reset | The "Forgot Password" flow is a UI stub with no backend implementation. |
| Mobile responsiveness | The app uses Tailwind responsive classes but has no dedicated mobile navigation (hamburger menu). The navbar collapses nav links on small screens with no replacement. |

---

## Summary

The project is **feature-complete** relative to the hackathon problem statement. All 14 screens are built and functional. The main concerns are:

- **Security:** Weak JWT secret committed to repo, no rate limiting on auth
- **Data integrity:** Stop dates not validated against trip date range
- **UX stubs:** Fake "Forgot Password", non-functional file upload
- **Performance:** N+1 queries in Dashboard and Admin
- **Minor bugs:** Double `setFormData` in Profile, missing error handling in Notes delete
