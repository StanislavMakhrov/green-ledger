.PHONY: dev build up down seed

dev:
	cd src && npm run dev

build:
	cd src && npm run build

up:
	docker compose up --build

down:
	docker compose down

seed:
	cd src && DATABASE_URL="file:../data/greenledger.db" npm run db:seed
