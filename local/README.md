# Database Docker Compose (MySQL + Postgres)

Two independent, self-contained folders — pick whichever matches your team's stack. Each has its own `docker-compose.yml`, pre-configured with a database, username, and password, so you can connect immediately.

```
db-docker-compose/
├── postgres/
│   ├── docker-compose.yml
│   └── init/          <- drop .sql files here (schema/seed)
└── mysql/
    ├── docker-compose.yml
    └── init/           <- drop .sql files here (schema/seed)
```

## Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running

## Start a database

Only start the one your team is using — `cd` into that folder first.

```bash
# Postgres
cd postgres
docker compose up -d

# MySQL
cd mysql
docker compose up -d
```

## Connection details

**Postgres**
| Field | Value |
|---|---|
| Host | `localhost` |
| Port | `5432` |
| Database | `capstone` |
| Username | `capstone` |
| Password | `capstone` |

**MySQL**
| Field | Value |
|---|---|
| Host | `localhost` |
| Port | `3306` |
| Database | `capstone` |
| Username | `capstone` |
| Password | `capstone` |
| Root password | `capstone` |

## Connect with DBeaver
Create a new connection → pick Postgres or MySQL → use the details above (host `localhost`, not the container name) → Test Connection → Finish.

## Loading a schema / seed data
Drop `.sql` files into that database's `init/` folder (e.g. `01-schema.sql`, `02-seed.sql`). They run **automatically, in filename order, the first time the database starts on a fresh volume** — see below.

## Stopping

Run these from inside the `postgres/` or `mysql/` folder you started.

```bash
# Stop the container, keep your data
docker compose down

# Stop the container AND wipe its data (fresh start / re-run init scripts)
docker compose down -v
```

## Notes
- Credentials are hardcoded for local development only — never reuse these in a real deployment.
- Data persists in a Docker volume between `docker compose down` / `up`. If your data looks stuck or wrong, `docker compose down -v` gives you a clean slate.
- Postgres and MySQL are fully independent — you can run one or both at the same time (their ports, `5432` and `3306`, don't conflict).
