# Hotel Manager API

## Overview

This project is a FastAPI-based hotel management API with a PostgreSQL-backed persistence layer. The current MVP focuses on the foundation of hotel operations: creating a hotel and listing the hotels in the system.

The application is structured as a clean API-first service so future features can extend it into guest management, reservations, room inventory, check-in/check-out workflows, and operational reporting.

## Stack

- Python 3.14+
- FastAPI
- Pydantic
- SQLAlchemy 2
- PostgreSQL 16 via Docker Compose
- Pytest for unit and integration testing

## Minimum Viable Product

The MVP is intentionally narrow and focused on the first operational capability:

- register a hotel record
- retrieve all hotel records
- persist the data in PostgreSQL
- expose the API through FastAPI and OpenAPI documentation

## Current Application Functionality

### Health check

- Endpoint: `GET /`
- Purpose: confirm the service is running

Example response:

```json
{
  "service": "hotel-manager",
  "status": "ok"
}
```

### Create a hotel

- Endpoint: `POST /hotels`
- Purpose: create a new hotel in the database

Request body:

```json
{
  "name": "Harbor House",
  "address": "1 Marina Way",
  "city": "Boston",
  "country": "USA"
}
```

Example response:

```json
{
  "id": 1,
  "name": "Harbor House",
  "address": "1 Marina Way",
  "city": "Boston",
  "country": "USA"
}
```

### List hotels

- Endpoint: `GET /hotels`
- Purpose: return all hotel records in the database

Example response:

```json
[
  {
    "id": 1,
    "name": "Harbor House",
    "address": "1 Marina Way",
    "city": "Boston",
    "country": "USA"
  }
]
```

## API Surface Summary

| Method | Path | Purpose |
|---|---|---|
| GET | `/` | Health check |
| POST | `/hotels` | Create a hotel |
| GET | `/hotels` | List hotels |
| GET | `/docs` | Swagger UI |
| GET | `/openapi.json` | OpenAPI schema |
| GET | `/redoc` | ReDoc documentation |

## App Structure

```text
src/
  hotel_manager/
    __init__.py
    database.py
    main.py
    models.py
    schemas.py
    services.py

tests/
  test_api.py
  test_services.py
```

## Database Setup

The local PostgreSQL database is defined in [local/postgres/docker-compose.yml](local/postgres/docker-compose.yml).

Connection details:

- Host: `localhost`
- Port: `5432`
- Database: `capstone`
- Username: `capstone`
- Password: `capstone`

Default SQLAlchemy connection string:

```text
postgresql+psycopg://capstone:capstone@localhost:5432/capstone
```

## Local Initialization

### 1. Activate the Python environment

```powershell
. .\.venv\Scripts\Activate.ps1
```

### 2. Install project dependencies

```powershell
uv sync
```

### 3. Start PostgreSQL with Docker

```powershell
docker compose -f local/postgres/docker-compose.yml up -d
```

### 4. Verify the database is ready

```powershell
docker exec capstone-postgres pg_isready -U capstone -d capstone
```

Expected output:

```text
/var/run/postgresql:5432 - accepting connections
```

### 5. Run the FastAPI application

```powershell
uv run fastapi dev src/hotel_manager/main.py
```

### 6. Open the API docs in the browser

```text
http://127.0.0.1:8000/docs
```

OpenAPI schema:

```text
http://127.0.0.1:8000/openapi.json
```

## Demo Testing Workflow

### Option A: Swagger UI

1. Open `http://127.0.0.1:8000/docs`
2. Expand `POST /hotels`
3. Enter JSON for a new hotel
4. Click `Execute`
5. Confirm the response contains the created hotel
6. Expand `GET /hotels`
7. Click `Execute`
8. Confirm the new hotel appears in the list

### Option B: PowerShell demo requests

Create a hotel:

```powershell
Invoke-RestMethod `
  -Method Post `
  -Uri http://127.0.0.1:8000/hotels `
  -ContentType "application/json" `
  -Body '{"name":"Harbor House","address":"1 Marina Way","city":"Boston","country":"USA"}'
```

List hotels:

```powershell
Invoke-RestMethod http://127.0.0.1:8000/hotels
```

## Testing

Unit and integration tests are included.

Run the full test suite:

```powershell
uv run pytest
```

Current verified result:

```text
2 passed
```

## Features Considered for the Next Phase

These are the hotel-management features planned after the current MVP foundation:

- Hotel profile management
- Room inventory and room types
- Availability and occupancy tracking
- Guest records
- Reservations and booking flow
- Check-in and check-out operations
- Staff roles and authentication
- Payments and invoicing
- Housekeeping status
- Reporting and analytics

## Notes

- The app currently provides the base hotel CRUD foundation with hotel creation and listing.
- The schema and database are ready to expand into a more complete hotel operations system.
- The PostgreSQL Docker setup is intentionally local-development focused and suitable for rapid iteration.
