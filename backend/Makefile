# Makefile for backend tasks

.PHONY: venv install migrate make_migration run test lint reset_db clean help

# Default target
help:
	@echo "Available commands:"
	@echo "  venv                    - Create Python virtual environment"
	@echo "  install                 - Install Python dependencies"
	@echo "  migrate                 - Apply all Alembic migrations"
	@echo "  make_migration msg=...  - Create new migration (autogenerate)"
	@echo "  run                     - Start FastAPI server with auto-reload"
	@echo "  test                    - Run backend tests"
	@echo "  lint                    - Run code linting"
	@echo "  reset_db                - Drop and recreate database"
	@echo "  clean                   - Remove virtual environment and cache"
	@echo "  help                    - Show this help message"

venv:
	python3 -m venv venv

install: venv
	source venv/bin/activate && pip install -r requirements.txt

migrate:
	source venv/bin/activate && alembic upgrade head

make_migration:
	@if [ -z "$(msg)" ]; then \
		echo "Error: Please provide a message for the migration"; \
		echo "Usage: make make_migration msg=\"Your migration message\""; \
		exit 1; \
	fi
	source venv/bin/activate && alembic revision --autogenerate -m "$(msg)"

run:
	source venv/bin/activate && uvicorn app.main:app --reload --host 0.0.0.0 --port 8001

test:
	source venv/bin/activate && python -m pytest tests/ -v

lint:
	source venv/bin/activate && flake8 app/ --max-line-length=88 --extend-ignore=E203,W503
	source venv/bin/activate && black app/ --check
	source venv/bin/activate && isort app/ --check-only

reset_db:
	@echo "Warning: This will drop and recreate the database!"
	@echo "Make sure you have backed up any important data."
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		source venv/bin/activate && python -c "from app.core.db import engine; from app.models import Base; Base.metadata.drop_all(engine); Base.metadata.create_all(engine)"; \
		echo "Database reset complete. Run 'make migrate' to apply migrations."; \
	else \
		echo "Database reset cancelled."; \
	fi

clean:
	rm -rf venv/
	rm -rf __pycache__/
	rm -rf app/__pycache__/
	rm -rf app/*/__pycache__/
	find . -type f -name "*.pyc" -delete
	find . -type d -name "__pycache__" -delete 