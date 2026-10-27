# Hotel Manager

A full-stack hotel operations and management platform built with a **FastAPI** / **SQLAlchemy** backend and a modern **React** / **Vite** frontend.

The project provides multi-property management, room inventory tracking, electricity meter telemetry, and role-based operational views for Hotel Administrators, Front Desk Staff, Property Managers, and Maintenance Engineers.

---

## Architecture & Stack

### Backend
- **Python 3.11+ / 3.14+**
- **FastAPI**: REST API layer with OpenAPI 3.1 documentation
- **SQLAlchemy 2.0**: ORM persistence layer
- **Pydantic v2**: Request/response schema validation
- **PostgreSQL 16 & SQLite**: Dual database compatibility (PostgreSQL via Docker Compose or zero-config local SQLite)
- **Pytest**: Integration and unit test suite

### Frontend
- **React 19 & TypeScript**
- **Vite**: Ultra-fast build tool and dev server
- **Tailwind CSS v4**: Responsive UI styling
- **Lucide React**: Modern iconography

---

## Database Schema

```text
┌─────────────────┐       ┌──────────────────────┐       ┌────────────────────────┐
│      users      │       │     hotel_users      │       │         hotels         │
├─────────────────┤       ├──────────────────────┤       ├────────────────────────┤
│ id (PK)         │◄─────┐│ id (PK)              │┌─────►│ id (PK)                │
│ username        │      └│ user_id (FK)         ││      │ name                   │
│ first_name      │       │ hotel_id (FK)        │┘      │ address                │
│ last_name       │       └──────────────────────┘       │ city                   │
│ other_info      │                                      │ country                │
│ role (ENUM)     │                                      │ contact_number         │
└─────────────────┘                                      │ total_rooms            │
                                                         │ logo                   │
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

1. **Authentication Portal (`/login`)**:
   - Clean login card resolving user session: `[ userid, username, role, hotel_id ]`.
   - Quick one-click test account pills (`admin`, `frontdesk_jane`, `manager_mike`, `engineer_bob`).

2. **Admin View (`ROLE: ADMIN`)**:
   - **Create Hotel**: Modal form with Pydantic field constraint validation.
   - **Searchable & Paginated Table**: `HOTEL NAME | ADDRESS | TOTAL ROOMS | MANAGE`.
   - **Manage Hotel Drawer**:
     - *Hotel Details*: Property summary and room counters.
     - *Add User*: Register and bind staff directly to the hotel.
     - *Add Room*: Add room number, floor, and pricing.
     - *Update Hotel*: Live editing of address, phone number, and capacity.

3. **Front Desk View (`ROLE: FRONT_DESK`)**:
   - Filtered view of the staff member's assigned hotel.
   - Room status grid (`available`, `OCCUPIED`, `Maintenance`).
   - 1-click guest check-in and check-out turnover.

4. **Property Manager View (`ROLE: PROPERTY_MANAGER`)**:
   - Property summary and real-time occupancy percentages.
   - **Electricity Meter Table**: Room #, current reading in kWh, active/inactive status, and log reading update.

5. **Maintenance View (`ROLE: MAINTENANCE_ENGINEER`)**:
   - Real-time work order queue of rooms flagged for repair.
   - Electrical diagnostic telemetry.
   - One-click repair resolution (`Maintenance` ➔ `available`).

6. **Interactive API Console (`/api`)**:
   - Live endpoint executor mirroring Swagger UI (`/docs`).
   - Copyable cURL and PowerShell (`Invoke-RestMethod`) commands.

---

## API Surface Summary

### System & Auth
| Method | Path | Description |
|---|---|---|
| `GET` | `/` | Health check (`{"service": "hotel-manager", "status": "ok"}`) |
| `POST` | `/login` | Authenticate username and return user session + hotel binding |

### Hotels (`/hotels`)
| Method | Path | Description |
|---|---|---|
| `POST` | `/hotels` | Create a new hotel record |
| `GET` | `/hotels` | List hotels (supports `page` and `page_size` pagination) |
| `GET` | `/hotels/{hotel_id}` | Retrieve hotel details by ID |
| `PUT` | `/hotels/{hotel_id}` | Update hotel details |
| `DELETE` | `/hotels/{hotel_id}` | Delete hotel and associated inventory |

### Rooms (`/rooms`)
| Method | Path | Description |
|---|---|---|
| `POST` | `/rooms` | Create a room in a hotel |
| `GET` | `/rooms` | List rooms (supports `hotel_id`, `status`, and pagination) |
| `GET` | `/rooms/{room_id}` | Retrieve room details |
| `PUT` | `/rooms/{room_id}` | Update room details or change status |
| `DELETE` | `/rooms/{room_id}` | Delete room record |

### Users & Bindings (`/users`)
| Method | Path | Description |
|---|---|---|
| `POST` | `/users` | Create user record |
| `GET` | `/users` | List users with pagination and `role` filter |
| `GET` | `/hotels/{hotel_id}/users/{user_id}` | Retrieve hotel staff record |
| `POST` | `/hotels/{hotel_id}/users/{user_id}/bind` | Bind a user to a specific hotel |

### Electricity Meters (`/meters`)
| Method | Path | Description |
|---|---|---|
| `POST` | `/meters` | Log or update electricity meter reading (kWh) |
| `GET` | `/rooms/{room_id}/meter` | Get current meter reading for a room |

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

### 2. Running the FastAPI Backend

#### Using `uv` (Recommended)
```bash
uv sync
uv run fastapi dev src/hotel_manager/main.py
```

#### Using Standard Python / Uvicorn
```bash
# Set Python path and start uvicorn
PYTHONPATH=src python -m uvicorn hotel_manager.main:app --reload --port 8000
```

Interactive API Documentation:
- **Swagger UI**: `http://127.0.0.1:8000/docs`
- **ReDoc**: `http://127.0.0.1:8000/redoc`
- **OpenAPI Schema**: `http://127.0.0.1:8000/openapi.json`

---

### 3. Running Database with Docker Compose (PostgreSQL)

To use local PostgreSQL instead of SQLite:

```bash
# Start PostgreSQL container
docker compose -f local/postgres/docker-compose.yml up -d

# Verify connection
docker exec capstone-postgres pg_isready -U capstone -d capstone
```

Default PostgreSQL Connection:
```text
postgresql+psycopg://capstone:capstone@localhost:5432/capstone
```

---

### 4. Running the Test Suite

Run the full pytest suite:

```bash
# Using uv
uv run pytest

# Or using python directly
PYTHONPATH=src python -m pytest
```

Expected result:
```text
- tests/test_api.py (Hotel creation & listing)
- tests/test_services.py (Hotel ORM services)
- tests/test_deliverables_oct27.py (Hotel, User, Room, Meter & Auth APIs)
```

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
│   │   ├── AdminView.tsx        # Admin hotel management & table
│   │   ├── ApiDocsView.tsx      # OpenAPI interactive tester
│   │   ├── CreateHotelModal.tsx # Hotel registration form
│   │   ├── CreateRoomModal.tsx  # Room inventory form
│   │   ├── DeliverablesAnalysisModal.tsx # Audit & checklist
│   │   ├── HotelsView.tsx       # Directory grid
│   │   ├── LoginPage.tsx        # Portal login UI (spec compliant)
│   │   ├── Navbar.tsx           # Role badge & switcher
│   │   ├── Overview.tsx         # Executive dashboard
│   │   ├── RoleViews.tsx        # Front Desk, Prop Mgr, Maintenance views
│   │   └── RoomsView.tsx        # Room inventory matrix
│   ├── App.tsx                  # App state & role routing
│   ├── main.tsx                 # React entry point
│   ├── storage.ts               # Local persistence & initial seeds
│   └── types.ts                 # TypeScript data contracts
├── src/
│   └── hotel_manager/
│       ├── __init__.py
│       ├── database.py          # SQLAlchemy engine & SQLite/Postgres adapter
│       ├── main.py              # FastAPI app & endpoint routing
│       ├── models.py            # User, Hotel, Room, Meter ORM models
│       ├── rooms.py             # Room APIRouter
│       ├── schemas.py           # Pydantic schemas
│       └── services.py          # CRUD services
├── tests/
│   ├── test_api.py              # Core hotel API tests
│   ├── test_services.py         # Service layer tests
│   └── test_deliverables_oct27.py # Complete deliverables test suite
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

Alembic uses the application's `DATABASE_URL`.

For a new local SQLite database, run migrations before starting the application:

```bash
uv sync
export DATABASE_URL="sqlite+pysqlite:///./hotel_manager_dev.db"
uv run alembic upgrade head
uv run fastapi dev src/hotel_manager/main.py
```

Open `http://127.0.0.1:8000/docs` to explore the API.

Migration `0001` creates the original tables. Migration `0002` adds nullable floor, nightly price, and room type columns.

For an existing database without Alembic tracking, back it up and verify that its schema matches migration `0001` before stamping that revision and applying `0002`. Do not run the table-creation baseline against populated tables or stamp an unverified schema.

Application startup uses `create_all()`, which does not add columns to existing tables. Schema changes require migrations.

## Room and Meter Validation

Run the focused tests:

```bash
uv run pytest tests/test_room_inventory.py -q
```

Run the complete suite:

```bash
uv run pytest -q
```

At the time of this contribution, the focused suite passes 37 tests. The complete suite reports 40 passed and two existing failures in `tests/test_deliverables_oct27.py`:

- Hotel update: `PUT /hotels/{hotel_id}` returns 405.
- User creation/auth flow: `POST /users` returns 404.

SQLite migration checks verified fresh database creation, agreement with the models, and preservation of existing hotel and room records during upgrade. PostgreSQL migration execution has not yet been verified.