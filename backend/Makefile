# Makefile for backend tasks

.PHONY: venv install migrate make_migration run

venv:
	python3 -m venv venv

install: venv
	source venv/bin/activate && pip install -r requirements.txt

migrate:
	source venv/bin/activate && alembic upgrade head

make_migration:
	source venv/bin/activate && alembic revision --autogenerate -m "$(msg)"

run:
	source venv/bin/activate && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 