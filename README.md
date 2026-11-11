# Hotel Manager

A full-stack hotel operations and management platform built with a **FastAPI** / **SQLAlchemy** backend and a modern **React** / **Vite** frontend.

The project provides multi-property management, room inventory tracking, electricity meter telemetry, and role-based operational views for Hotel Administrators, Front Desk Staff, Property Managers, and Maintenance Engineers.

---

## Architecture & Stack

### Backend
- **Python 3.11+ / 3.14+**
- **FastAPI**: REST API layer
- **SQLAlchemy 2.0**: ORM persistence layer
- **Pydantic v2**: Request/response schema validation
- **PBKDF2-SHA256**: Secure password hashing and tamper-proof access tokens
- **Resend**: Transactional email connectivity and user onboarding notifications
- **PostgreSQL 16**: Primary relational database engine (managed via Docker Compose or cloud hosting)
- **Pytest**: Integration and unit test suite (49 passing tests)

### Frontend
- **React 19 & TypeScript**
- **Vite**: Ultra-fast build tool and dev server
- **Tailwind CSS v4**: Fluid percentage-based responsive layout and window sizing
- **Lucide React**: Modern iconography

---

## Database Schema

```text
┌─────────────────┐       ┌──────────────────────┐       ┌────────────────────────┐
│      users      │       │     hotel_users      │       │         hotels         │
├─────────────────┤       ├──────────────────────┤       ├────────────────────────┤
│ id (PK)         │◄─────┐│ id (PK)              │┌─────►│ id (PK)                │
│ username        │      └│ user_id (FK)         ││      │ name                   │
│ email           │       │ hotel_id (FK)        │┘      │ address                │
│ password_hash   │       └──────────────────────┘       │ city                   │
│ first_name      │                                      │ state                  │
│ last_name       │                                      │ country                │
│ other_info      │                                      │ contact_number         │
│ role (ENUM)     │                                      │ total_rooms            │
└─────────────────┘                                      │ logo                   │
                                                         └───────────┬────────────┘
                                                                     │ 1:N
                                                                     ▼
┌────────────────────────┐       ┌──────────────────────┐
│   electricity_meters   │       │        rooms         │
├────────────────────────┤       ├──────────────────────┤
│ id (PK)                │       │ id (PK)              │
│ room_id (FK, Unique)   │◄─────┐│ hotel_id (FK)        │
│ current_reading (kWh)  │      └│ room_number          │
│ status (Active/Inact.) │       │ status (ENUM)        │
└────────────────────────┘       └──────────────────────┘
```

### Roles (`UserRole` Enum)
- `ADMIN`: Global administration, hotel provisioning, staff binding.
- `FRONT_DESK`: Guest check-in, check-out, and live room turnover.
- `PROPERTY_MANAGER`: Occupancy metrics, property details, and electricity meter telemetry.
- `MAINTENANCE_ENGINEER`: Room repairs work orders and meter diagnostics.
- `GUEST`: Guest reservations and portal.

---

## Role-Based Frontend Views

The React application implements the role-based UI specification:

1. **Authentication & Sign-up Portal (`/login`)**:
   - Secure authenticated sign-in with username/email and password (PBKDF2 encrypted).
   - Sign-up workflow allowing new users as well as administrators (`ADMIN`) to register accounts.
   - Resend email connectivity: automatically dispatches welcome notifications to user emails.
   - Removed unauthenticated bypasses and instant easy-access pills.

2. **Administrator Console (`AdminView`)**:
   - **Create Hotel**: Modal form with State/Province field and Pydantic validation.
   - **Searchable & Paginated Table**: Hotel Name, Address, Location, Capacity, and Manage actions.
   - **Manage Property Modal**:
     - *Property Info*: Property summary, room counts, and staff member directory with Edit and Send Test Email actions.
     - *Add Staff*: Register and bind staff directly with an initial account password and Resend email.
     - *Add Room*: Add room number, floor, and pricing to inventory.
     - *Update Info*: Live editing of address, city, state/province, phone number, and capacity.
   - **Edit Staff Member Modal**: Live updating of name, username, email, role, active status, and optional password resets.

3. **Front Desk Operations (`FrontDeskView`)**:
   - Filtered view of the staff member's assigned hotel.
   - Room status grid (`available`, `OCCUPIED`, `Maintenance`).
   - 1-click guest check-in and check-out turnover.

4. **Property Operations (`PropertyManagerView`)**:
   - Property summary and real-time occupancy percentages.
   - **In-App Electricity Meter Modal**: Log meter readings in kWh with quick-add increment buttons (`+1`, `+5`, `+10`, `+25`, `+50` kWh), status toggle, and "Setup Meter" support for unmetered rooms.

5. **Facilities & Maintenance (`MaintenanceEngineerView`)**:
   - Real-time work order queue of rooms flagged for repair.
   - Electrical diagnostic telemetry.
   - One-click repair resolution (`Maintenance` ➔ `available`).

6. **Guest Portal (`GuestView`)**:
   - Dedicated booking and availability portal strictly accessible for authenticated guest accounts (`role === 'GUEST'`).
   - Live availability matrix with multi-property selection and room type filtering.
   - Interactive booking modal with live total price calculation, length of stay, and special requests.
   - Instant confirmation receipt modal with unique confirmation code (`HM-XXXXXX`).
   - "My Reservations" tab allowing guests to view active stays and cancel bookings in real-time.

---

## API Surface Summary

### System & Authentication (`/auth`)
| Method | Path | Description |
|---|---|---|
| `GET` | `/` | Health check (`{"service": "hotel-manager", "status": "ok"}`) |
| `POST` | `/auth/signup` | Register new user or administrator account |
| `POST` | `/auth/login` | Authenticate with username/email & password, return JWT session token |
| `GET` | `/auth/me` | Retrieve authenticated user session details |
| `POST` | `/login` | Legacy endpoint for username-based login session |

### Hotels (`/hotels`)
| Method | Path | Description |
|---|---|---|
| `POST` | `/hotels` | Create a new hotel record (includes `state` / province) |
| `GET` | `/hotels` | List hotels (supports `page` and `page_size` pagination) |
| `GET` | `/hotels/{hotel_id}` | Retrieve hotel details by ID |
| `PUT` | `/hotels/{hotel_id}` | Update hotel details (name, address, city, state, country, etc.) |
| `DELETE` | `/hotels/{hotel_id}` | Delete hotel and associated inventory |

### Rooms (`/rooms`)
| Method | Path | Description |
|---|---|---|
| `POST` | `/rooms` | Create a room in a hotel |
| `GET` | `/rooms` | List rooms (supports `hotel_id`, `status`, and pagination) |
| `GET` | `/rooms/{room_id}` | Retrieve room details |
| `PUT` | `/rooms/{room_id}` | Update room details or change status |
| `DELETE` | `/rooms/{room_id}` | Delete room record |

### Users & Staff Management (`/users`)
| Method | Path | Description |
|---|---|---|
| `POST` | `/users` | Create user record with password hashing and optional hotel binding |
| `GET` | `/users` | List users with pagination and `role` filter |
| `PUT` | `/users/{user_id}` | Update user details, role, status, and reset password |
| `DELETE` | `/users/{user_id}` | Delete user record |
| `POST` | `/users/{id}/connect-email` | Connect user email address via Resend |
| `GET` | `/hotels/{hotel_id}/users/{user_id}` | Retrieve hotel staff record |
| `POST` | `/hotels/{hotel_id}/users/{user_id}/bind` | Bind a user to a specific hotel |

### Electricity Meters (`/meters`) & Email (`/email`)
| Method | Path | Description |
|---|---|---|
| `POST` | `/meters` | Log or update electricity meter reading (kWh) & status |
| `GET` | `/meters` | List all electricity meters |
| `GET` | `/rooms/{room_id}/meter` | Get current meter reading for a room |
| `DELETE` | `/meters/{meter_id}` | Delete electricity meter record |
| `POST` | `/email/send-test` | Dispatch test notification via Resend SDK |

---

## Quick Start & Local Execution

### 1. Running the React Frontend

Ensure you are in the project root directory:

```bash
# Install dependencies
npm install

# Start the Vite development server
npm run dev
```

Open your browser to:
```text
http://localhost:3000
```

---

### 2. Running the FastAPI Backend with PostgreSQL

From the repository root, run these commands to start PostgreSQL and the backend. The Compose file starts PostgreSQL only; it does not start MySQL or the frontend.

```bash
# Start PostgreSQL
docker compose -f local/postgres/docker-compose.yml up -d

# Wait until PostgreSQL accepts connections
docker exec capstone-postgres pg_isready -U capstone -d capstone

# Install/sync dependencies on first setup or after dependency changes
uv sync

# Create or update the database schema
uv run alembic upgrade head

# Start the API
uv run fastapi dev src/hotel_manager/main.py
```

The API is available at `http://127.0.0.1:8000`.

#### Alternative: Standard Python / Uvicorn
```bash
# Set the Python path and start Uvicorn
PYTHONPATH=src python -m uvicorn hotel_manager.main:app --reload --port 8000
```

Interactive API Documentation:
- **Swagger UI**: `http://127.0.0.1:8000/docs`
- **ReDoc**: `http://127.0.0.1:8000/redoc`
- **OpenAPI Schema**: `http://127.0.0.1:8000/openapi.json`

---

### 3. PostgreSQL Database Details

The backend uses the local PostgreSQL container by default. Section 2 includes the complete first-time startup sequence and schema migration command.

The React app reads and writes hotels, rooms, users, and meter readings through the FastAPI backend. Vite proxies `/api` requests to `http://127.0.0.1:8000`; run both development servers and apply database migrations before using the UI. The UI's create and delete actions now persist to PostgreSQL.

Existing browser `localStorage` data is not automatically imported or deleted. New and updated UI data is stored in PostgreSQL.

Default PostgreSQL Connection:
```text
postgresql+psycopg://capstone:capstone@localhost:5432/capstone
```

---

### 4. Running Isolated Test Groups

Unit and integration test suites exercise the service layer and FastAPI endpoints using hermetic, isolated test fixtures for rapid CI/CD validation without requiring an external database instance:

```bash
# Run unit tests
uv run pytest -m unit

# Run integration tests
uv run pytest -m integration

# Run the full test suite (all 49 tests)
uv run pytest
```

`tests/test_services.py` is marked `unit`. `tests/test_api.py`, `tests/test_auth_and_email.py`, `tests/test_deliverables_oct27.py`, and `tests/test_room_inventory.py` are marked `integration`.

---

## VS Code & GitHub Codespaces Debugging

Pre-configured launch and task profiles are included in `.vscode/`:
- **`Frontend: Debug in Chrome`**: Automatically triggers `npm run dev` and attaches the Chrome debugger.
- **`Backend: Debug FastAPI`**: Launches Uvicorn with active Python breakpoints.
- **`Full Stack: FastAPI + Frontend`**: Compound launcher that starts both with a single press of **F5**.

---

## Project Directory Structure

```text
├── .vscode/
│   ├── launch.json              # VS Code / Codespaces debug configurations
│   └── tasks.json               # Dev server background tasks
├── frontend/
│   ├── components/
│   │   ├── AdminView.tsx        # Admin property & staff management
│   │   ├── CreateHotelModal.tsx # Hotel registration form
│   │   ├── GuestView.tsx        # Guest room booking & availability portal
│   │   ├── LoginPage.tsx        # Portal login & signup UI
│   │   ├── Navbar.tsx           # Role badge & header navigation
│   │   └── RoleViews.tsx        # Front Desk, Property Mgr, Maintenance views
│   ├── App.tsx                  # App state & role routing
│   ├── main.tsx                 # React entry point
│   ├── api.ts                   # Backend API client for PostgreSQL data
│   └── types.ts                 # TypeScript data contracts
├── src/
│   └── hotel_manager/
│       ├── __init__.py
│       ├── auth.py              # Authentication, password hashing & tokens
│       ├── database.py          # SQLAlchemy engine & PostgreSQL adapter
│       ├── email_service.py     # Resend SDK integration & email notifications
│       ├── main.py              # FastAPI app & endpoint routing
│       ├── meters.py            # Electricity meter telemetry router
│       ├── models.py            # User, Hotel, Room, Meter ORM models
│       ├── rooms.py             # Room APIRouter
│       ├── schemas.py           # Pydantic schemas
│       └── services.py          # CRUD services
├── tests/
│   ├── test_api.py              # Core hotel API tests
│   ├── test_auth_and_email.py   # Auth, tokens & Resend email tests
│   ├── test_deliverables_oct27.py # Complete deliverables test suite
│   ├── test_room_inventory.py   # Room inventory & meter tests
│   └── test_services.py         # Service layer tests
├── local/                       # Docker compose setups (Postgres, MySQL)
├── package.json
├── pyproject.toml
└── vite.config.ts
```

## Room Inventory API

The room API supports creation, retrieval, updates, deletion, and combined inventory filters.

### Optional inventory fields

- `floor`: Integer; negative values can represent basement floors.
- `nightly_price`: Nonnegative decimal amount with up to eight integer digits and two decimal places.
- `room_type`: Nonempty string of up to 50 characters, trimmed and stored in lowercase.

Existing room creation requests remain valid without these fields. During updates, omitted fields retain their values. Explicit `null` clears optional inventory fields; room number and status cannot be set to `null`.

Prices are returned as JSON strings to preserve decimal representation.

### Listing and filtering

`GET /rooms` accepts:

| Parameter | Description |
|---|---|
| `hotel_id` | Filter by hotel |
| `status` | Exact room status |
| `floor` | Exact floor |
| `room_type` | Room type, trimmed and normalized to lowercase |
| `min_price` | Inclusive minimum nightly price |
| `max_price` | Inclusive maximum nightly price |
| `page` | Page number, starting at 1 |
| `page_size` | Results per page, from 1 to 100; default 50 |

Filters combine before pagination. Results are ordered by room number, then room ID. No matches returns an empty array. Rooms without a nightly price are excluded when a price filter is supplied.

Example:

```text
GET /rooms?hotel_id=1&floor=2&room_type=double&min_price=100&max_price=200
```

Invalid filter values or a minimum price greater than the maximum return 422.

### Room deletion

`DELETE /rooms/{room_id}` returns:

- 204 when deletion succeeds.
- 404 when the room does not exist.
- 409 when an electricity meter is associated with the room.

Deleting a room updates the hotel's room count. Removing an associated meter is not exposed by this contribution.

### Electricity meters

- `POST /meters` creates or updates the current meter record for a room.
- `GET /rooms/{room_id}/meter` retrieves that record.
- Missing rooms or meter records return 404.

Posting another reading updates the existing record. Historical readings and batch ingestion are not implemented.

## Database Migrations

Alembic uses the application's `DATABASE_URL` (configured for PostgreSQL).

To apply migrations to your local or staging PostgreSQL database:

```bash
# Start PostgreSQL via Docker Compose
docker compose -f local/postgres/docker-compose.yml up -d

# Run migrations to bring PostgreSQL up to the latest revision
uv run alembic upgrade head

# Start the FastAPI application
uv run fastapi dev src/hotel_manager/main.py
```

Open `http://127.0.0.1:8000/docs` to explore the interactive API.

### Migration History:
- `0001_create_hotel_room_user_meter_tables.py`: Baseline tables (`hotels`, `rooms`, `users`, `hotel_users`, `electricity_meters`).
- `0002_add_room_inventory_fields.py`: Added `floor`, `nightly_price`, and `room_type` inventory columns.
- `0003_add_room_status_enum.py`: Room status enum constraints.
- `0004_add_user_auth_fields.py`: Added `email` and `password_hash` to users.
- `0005_add_hotel_state_field.py`: Added `state` (State/Province) to hotels.

Schema upgrades must always be applied via `uv run alembic upgrade head`.

## Test Suite and Validation

Run the complete test suite:

```bash
uv run pytest -q
```

All 49 unit and integration tests pass cleanly (100% pass rate):
- `tests/test_api.py`: Core hotel CRUD and pagination endpoints.
- `tests/test_auth_and_email.py`: PBKDF2 password hashing, tamper-proof session tokens, authenticated signup/login, and Resend email dispatches.
- `tests/test_deliverables_oct27.py`: Comprehensive hotel, room, and user management workflows.
- `tests/test_room_inventory.py`: Advanced room filtering, inventory validations, and meter associations.
- `tests/test_services.py`: Service-layer business logic and isolation.
