import os

# Ensure default environment variables for test execution
os.environ.setdefault(
    "SECRET_KEY",
    "capstone-development-secret-key-at-least-32-chars-long-for-testing",
)
os.environ.setdefault("DATABASE_URL", "sqlite+pysqlite:///:memory:")
