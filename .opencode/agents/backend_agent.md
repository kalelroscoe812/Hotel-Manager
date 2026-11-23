# Hotel Manager — Backend Architecture & Engineering Agent
See .github/agents/backend_agent.md for complete specification.

- Framework: FastAPI (Python 3.11+ / 3.14+)
- Persistence: PostgreSQL 16 via SQLAlchemy 2.0 ORM
- Migrations: Alembic 0001 through 0005
- Authentication: PBKDF2-HMAC-SHA256 & signed HMAC tokens
- Testing: Pytest with 53 passing tests
- Request Logging: Asynchronous HTTP middleware in main.py
