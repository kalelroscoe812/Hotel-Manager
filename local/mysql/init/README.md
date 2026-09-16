# MySQL init scripts

Put `.sql` files here (e.g. `01-schema.sql`, `02-seed.sql`). They run automatically, in filename order, the first time the `mysql` container starts on a fresh volume.

If the database already has data in it, these will **not** re-run — use `docker compose down -v` first to reset.
