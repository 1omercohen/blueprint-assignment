.PHONY: setup run stop logs test test-db cli-build

setup:
	docker-compose build

run:
	docker-compose up

stop:
	docker-compose down

logs:
	docker-compose logs -f api

test-db:
	docker-compose exec postgres createdb -U bluebricks blueprints_test 2>/dev/null || true

test: test-db
	cd api && npm test

cli-build:
	cd cli && go build -o bin/blueprint .
