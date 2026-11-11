# Changelog

## [1.0.0] - 2026-11-11
### Added
- **Project Vision, Requirements, and Design Document (`docs/PROJECT_VISION_REQUIREMENTS_DESIGN.md`)**:
  - Authored comprehensive enterprise engineering documentation according to the course documentation template for **Morehouse College**, **HCSC 460-01 (Senior Capstone)**, **Group 3** (Authors: Kalel Roscoe, Shanterrian Walker, OBrien White, Jonathan Porter, KeiShaun Mortis, Silas Erving).
  - Included thermodynamic sensible heat gain ($Q_s = 1.08 \times \text{CFM} \times \Delta T$) and electrical energy cost equations.
  - Authored complete Mermaid system diagrams: Feature Tree, Use Case Diagram, System Context Flow, Room Lifecycle State Chart, Module Decomposition, Entity-Relationship (ER) Diagram, Activity Diagrams (Turnover & Submetering), and UML Class Diagram.
  - Documented role-based user stories, structured use cases, operating environment, and group meeting minutes.

### Changed
- **README.md Architecture & Database Stack Update**:
  - Formally updated backend architecture documentation to reflect **pure PostgreSQL 16** as the primary relational database engine.
  - Synchronized repository directory tree and removed obsolete SQLite references.
  - Updated validation section to reflect 100% passing test rate (49/49 passing automated tests).

## [0.4.0] - 2026-11-11
### Added
- **Authentication & Security Layer**:
  - Secure PBKDF2-HMAC-SHA256 password hashing (100,000 iterations with cryptographic salt) and HMAC-SHA256 tamper-proof signed session tokens (`src/hotel_manager/auth.py`).
  - Added `/auth/signup`, `/auth/login`, and `/auth/me` endpoints supporting multi-role registration for users and administrators.
  - Added administrator password input when creating staff members in the admin console for direct login testing.
  - Added user editing via `PUT /users/{user_id}` with optional password resets, role updates, and account status toggling.
- **Resend Email Integration**:
  - Integrated Resend SDK (`src/hotel_manager/email_service.py`) for transactional onboarding and welcome notifications with simulation fallback.
  - Added `/users/{user_id}/connect-email` and `/email/send-test` endpoints.
- **Dedicated Guest Portal (`role === 'GUEST'`)**:
  - Created `GuestView.tsx` accessible strictly for authenticated guests.
  - Real-time room availability matrix, multi-property selection, room type filtering, and search.
  - Interactive room booking flow with live price calculation and instant booking confirmation receipt (`HM-XXXXXX`).
  - "My Reservations" management tab allowing guests to review active stays and cancel bookings in real-time.
- **Property Manager In-App Meter Logging**:
  - Replaced browser `window.prompt` with an in-app **Log Electricity Meter Modal**.
  - Added support for configuring new meters ("Setup Meter") and updating existing readings with validation and quick-add kWh increments.
- **Database Schema Enhancements**:
  - Added `email` and `password_hash` columns to `User` model (Alembic migration `0004_add_user_auth_and_email.py`).
  - Added `state` / province column to `Hotel` model (Alembic migration `0005_add_hotel_state.py`).
  - Added dual-database auto-resolver with socket reachability test for zero-friction local PostgreSQL/SQLite fallback.

### Changed
- **Responsive UI & Sizing**:
  - Converted layouts to fluid percentage-based window sizing (`w-[94%] sm:w-[92%] lg:w-[88%]` and `w-[90%] sm:w-[85%] md:w-[75%] lg:w-[65%]`).
  - Standardized button spacing with CSS flex wrapping (`.btn-group-wrap`, `.btn-fixed`, `.btn-fixed-sm`).
  - Refactored admin manage menu top bar with balanced padding, standardized button sizing, and individual tab icons.
- **Production-Grade UI Copy**:
  - Removed raw enum underscores from role names across the application (`Front Desk`, `Property Manager`, `Maintenance Engineer`, `Administrator`).
  - Removed self-referential / meta assignment task descriptions and debug modals in favor of a sleek Enterprise Property Management System look.

### Removed
- Removed legacy one-click sign-in bypasses from the login portal.
- Removed FastAPI Swagger UI embed and `ApiDocsView.tsx` from the user-facing frontend.
- Removed legacy `DeliverablesAnalysisModal.tsx`.

## [0.3.0] - 2026-10-20
### Added
- React and TypeScript frontend using Vite and Tailwind CSS.
- Role-based dashboards for administrators, front desk staff, property managers, and maintenance engineers.
- Hotel creation, editing, and management interface.
- Room inventory tracking and room status management.
- Electricity meter monitoring and maintenance features.
- Interactive API console for testing endpoints.

## [0.2.0] - 2026-10-13
### Added
- `GET /hotels/{hotel_id}` endpoint for retrieving individual hotels.
- `PUT /hotels/{hotel_id}` endpoint for updating hotel information.
- `DELETE /hotels/{hotel_id}` endpoint for deleting hotels.
- CRUD API endpoints for room management.
- User management and hotel staff assignments.
- Login endpoint and role-based user models.
- Additional database models for users, rooms, and electricity meters.
- Expanded API and service testing.
  
## [0.1.0] - 2026-09-28

### Included

- FastAPI hotel management API.
- `POST /hotels` endpoint for creating hotel records.
- `GET /hotels` endpoint for listing hotel records.
- PostgreSQL database integration through SQLAlchemy.
- Environment-based database configuration using `DATABASE_URL`.
- Unit tests for the hotel service layer.
- Integration test for the hotel API endpoints.
- Swagger API documentation through FastAPI.
