.PHONY: setup run stop logs test cli-build

setup:
	docker-compose build

run:
	docker-compose up

stop:
	docker-compose down

logs:
	docker-compose logs -f api

test:
	cd api && npm test

cli-build:
	cd cli && go build -o bin/blueprint ./cmd
