.PHONY: dev build up down seed

dev:
	cd src && npm run dev

build:
	cd src && npm run build

up:
	docker build -t green-ledger ./src && docker run --rm -p 3000:3000 -v greenledger-data:/data green-ledger

down:
	docker stop $$(docker ps -q --filter ancestor=green-ledger) 2>/dev/null || true

seed:
	cd src && DATABASE_URL="file:../data/greenledger.db" npm run db:seed
