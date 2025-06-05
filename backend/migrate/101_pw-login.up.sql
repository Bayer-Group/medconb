BEGIN;

ALTER TABLE "user"
    ADD COLUMN "email" character varying NULL,
    ADD COLUMN "password_hash" character varying NULL;

COMMIT;
