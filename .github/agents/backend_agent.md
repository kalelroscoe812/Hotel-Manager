# Hotel Manager — Backend Architecture & Engineering Agent

This specification serves as the operational agent guidelines for backend engineering on the **Hotel Manager Enterprise Property Management System (PMS)**, satisfying the course rubric requirements for **Morehouse College HCSC 460-01 (Group 3)**.

---

## 1. System Identity & Mission
- **Application:** Hotel Manager Backend Engine
- **Framework:** FastAPI (Asynchronous REST API)
- **Runtime:** Python 3.11+ / 3.14+
- **Persistence:** PostgreSQL 16 (Relational Database) with SQLAlchemy 2.0 ORM & Psycopg 3 driver
- **Authentication:** PBKDF2-HMAC-SHA256 password hashing (100k rounds) & HMAC-SHA256 tamper-proof access tokens
- **Email Service:** Resend SDK transactional onboarding and notification triggers
- **Migrations:** Alembic declarative schema revisions (0001 through 0005)

---

## 2. Architectural Boundaries & Principles
1. **Relational Model & Scoping:**
   - All hotel, room, user, and electricity meter records must strictly conform to SQLAlchemy declarative models (`src/hotel_manager/models.py`).
   - Every multi-property query must enforce `hotel_id` boundaries to prevent tenant data leakage.
   - Rooms require unique 1:1 associations with electricity submeters (`electricity_meters`).
2. **Business Layer Separation:**
   - Database queries, transactions, and business logic reside exclusively in `src/hotel_manager/services.py`.
   - API endpoints in `main.py`, `rooms.py`, and `meters.py` handle request validation, status codes, and response serialization.
3. **HTTP Status Code Standard (Rubric Deliverable 4):**
   - `200 OK`: Successful retrieval or update.
   - `201 Created`: Resource creation (`POST /hotels`, `POST /rooms`, `POST /users`, `POST /auth/signup`).
   - `204 No Content`: Successful deletion (`DELETE /hotels/{id}`, `DELETE /rooms/{id}`, `DELETE /users/{id}`, `DELETE /meters/{id}`).
   - `400 Bad Request`: Malformed payload or invalid business request.
   - `401 Unauthorized`: Missing or invalid credentials/token.
   - `404 Not Found`: Non-existent entity ID.
   - `409 Conflict`: Unique constraint violation or conflicting state (e.g. room has attached meter).
   - `422 Unprocessable Entity`: Validation failure (e.g. `min_price > max_price`).
4. **Security & Zero SQL Injection:**
   - All database queries must use SQLAlchemy 2.0 type-safe expressions (`select()`, `where()`, `delete()`). Raw string-interpolated SQL queries are strictly forbidden.
   - Secrets (`SECRET_KEY`, `DATABASE_URL`, `RESEND_API_KEY`) must be loaded from environment variables via `os.getenv()`. Hardcoded tokens are prohibited.
5. **Request Logging:**
   - Every incoming HTTP request and response status/duration must be logged via the `@app.middleware("http")` logging middleware.

---

## 3. Telemetry & Energy Calculation Specifications
When processing electricity submeter readings, correlate empirical kilowatt-hour (kWh) values with theoretical sensible heat gain ($Q_s$):
- **Sensible Heat Equation:** $Q_s [\text{BTU/hr}] = 1.08 \times (\text{CFM}) \times \Delta T$
- **CFM Calculation:** $\text{CFM} = (l \times w \times h) \times 60 \frac{\text{min}}{\text{hr}}$
- **Energy Conversion:** $\text{Cost/hr} = Q_s [\text{BTU/hr}] \times 0.000293071 [\text{kW}/(\text{BTU/hr})] \times \text{Rate}_{kWh}$

---

## 4. Verification Protocols
- Run complete test suite: `uv run pytest` (all 53 tests must pass).
- Run business-layer unit tests: `uv run pytest -m unit` (passes 100% in isolation).
- Apply migrations: `uv run alembic upgrade head`.
