.PHONY: lint typecheck test all_qa clean reset-databases-local reset-databases-k8s-develop
SHELL:=/bin/bash

all_qa: lint typecheck test

lint:
	black --check ./backend
	isort --check ./backend
	pylama ./backend

typecheck:
	mypy backend/medconb

test:
	pytest --cov-config=.coveragerc --cov-report xml:cov.xml --cov-report term --cov backend/medconb backend/test/domain backend/test/graphql backend/test/interactors backend/test/persistence backend/test/middleware backend/test/api

clean:
	find . -type d -name __pycache__ | xargs rm -rf
	find . -type d -name .mypy_cache | xargs rm -rf
	find . -type d -name .pytest_cache | xargs rm -rf

reset-databases-local:
	bash cicd/reset-databases-local.sh

reset-databases-k8s-develop:
	bash cicd/reset-databases-k8s-develop.sh

reset-databases-rajesh:
	{ \
	psql -U postgres -d postgres -c 'DROP DATABASE mcb_dev'; \
	psql -U postgres -d postgres -c 'CREATE DATABASE mcb_dev'; \
	migrate -database 'postgres://localhost/mcb_dev?sslmode=disable' -path=backend/migrate up; \
	VERSION=$$(migrate -database 'postgres://localhost/mcb_dev?sslmode=disable' -path=backend/migrate version 2>&1); \
	psql -U postgres -d mcb_dev < backend/fixtures/$${VERSION}_fixtures.sql; \
	gunzip -c backend/fixtures/ontologies.sql.gz | psql -U postgres -d mcb_ontologies; \
	}

reset-databases-k8s-qa:
	{ \
	export PGPASSWORD=$$(kubectl get secret medconb-qa-api-postgresql -o jsonpath='{.data.postgres-password}' | base64 --decode); \
	kubectl exec -i medconb-qa-api-postgresql-0 -- /bin/bash -c "PGPASSWORD=$${PGPASSWORD} psql -U postgres -c 'CREATE DATABASE ontologies'"; \
	cat backend/fixtures/db_reset.sql backend/fixtures/db_fixtures.sql | kubectl exec -i medconb-qa-api-postgresql-0 -- /bin/bash -c "PGPASSWORD=$${PGPASSWORD} psql -U postgres -d medconb"; \
	gzcat backend/fixtures/ontologies_all.sql.gz | kubectl exec -i medconb-qa-api-postgresql-0 -- /bin/bash -c "PGPASSWORD=$${PGPASSWORD} psql -U postgres -d ontologies"; \
	}

# docker exec -i -u postgres "$$CONTAINER_ID" dropdb --if-exists -ef test_template; \
# docker exec -i -u postgres "$$CONTAINER_ID" dropdb --if-exists -ef dev; \
# docker exec -i -u postgres "$$CONTAINER_ID" createdb -e test_template; \
# docker exec -i -u postgres "$$CONTAINER_ID" createdb -e dev; \
