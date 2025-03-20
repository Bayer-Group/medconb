BEGIN;


CREATE TABLE "property" (
    "id" integer NOT NULL,
    "class_name" character varying NOT NULL,
    "name" character varying NOT NULL,
    "dtype" character varying NOT NULL,
    "dtype_meta" jsonb NOT NULL,
    "required" boolean NOT NULL,
    "read_only" boolean NOT NULL,
    PRIMARY KEY ("id"),
    UNIQUE ("class_name", "name")
) WITH (oids = false);

CREATE INDEX ON "property" ("class_name");


CREATE TABLE "user" (
    "id" uuid NOT NULL,
    "external_id" character varying NULL,
    "name" character varying NOT NULL,
    "properties" jsonb NOT NULL,
    PRIMARY KEY ("id")
);


CREATE TABLE "workspace" (
    "id" uuid NOT NULL,
    "user_id" uuid NOT NULL,
    "collection_ids" uuid[] NOT NULL,
    PRIMARY KEY ("id"),
    FOREIGN KEY("user_id") REFERENCES "user" ("id")
);


CREATE TABLE "collection" (
    "id" uuid NOT NULL,
    "name" character varying NOT NULL,
    "item_type" character varying NOT NULL,
    "description" character varying NOT NULL,
    "properties" jsonb DEFAULT '{}' NOT NULL,
    "reference_id" uuid NULL,
    "locked" boolean NOT NULL,
    PRIMARY KEY("id"),
    FOREIGN KEY ("reference_id") REFERENCES "collection" ("id")
);


CREATE TABLE "share" (
    "user_id" uuid NOT NULL,
    "collection_id" uuid NOT NULL,
    PRIMARY KEY("user_id", "collection_id"),
    FOREIGN KEY("user_id") REFERENCES "user" ("id"),
    FOREIGN KEY("collection_id") REFERENCES "collection" ("id")
);


CREATE TABLE "container_item" (
    "id" uuid NOT NULL,
    "type_" character varying NOT NULL,
    "order" integer NOT NULL,
    "container_type" character varying NOT NULL,
    "container_id" uuid NOT NULL,
    PRIMARY KEY ("id", "type_")
);


CREATE TABLE "phenotype" (
    "id" uuid NOT NULL,
    "name" character varying NOT NULL,
    "medical_description" character varying NOT NULL,
    "operational_description" character varying NOT NULL,
    "properties" jsonb NOT NULL,
    "reference_id" uuid,
    PRIMARY KEY("id"),
    FOREIGN KEY ("reference_id") REFERENCES "phenotype" ("id")
);


CREATE TABLE "codelist" (
    "id" uuid NOT NULL,
    "name" character varying NOT NULL,
    "description" character varying NOT NULL,
    "transient_commit_id" integer NULL,
    "reference_id" uuid NULL,
    PRIMARY KEY("id"),
    FOREIGN KEY ("reference_id") REFERENCES "codelist" ("id")
);


CREATE TABLE "commit" (
    "id" serial NOT NULL,
    "codelist_id" uuid NULL,
    "author_id" uuid NOT NULL,
    "created_at" timestamp NOT NULL,
    "message" character varying NOT NULL,
    "position" smallint NULL,
    PRIMARY KEY("id"),
    FOREIGN KEY ("codelist_id") REFERENCES "codelist" ("id")
);


CREATE TABLE "changeset" (
    "id" serial NOT NULL,
    "commit_id" integer NOT NULL,
    "ontology_id" character varying NOT NULL,
    "code_ids_added" integer[] NOT NULL,
    "code_ids_removed" integer[] NOT NULL,
    PRIMARY KEY("id"),
    FOREIGN KEY ("commit_id") REFERENCES "commit" ("id")
);


CREATE VIEW "orphaned_collections" AS SELECT collection.id,
    collection.name,
    collection.item_type,
    collection.description,
    collection.properties,
    collection.reference_id,
    collection.locked
   FROM (collection
     LEFT JOIN ( SELECT unnest(workspace.collection_ids) AS id
           FROM workspace) existing USING (id))
  WHERE (existing.id IS NULL);


CREATE VIEW "orphaned_container_items" AS SELECT ids.type_ AS source_type,
    ids.id AS source_id,
    ci.id,
    ci.type_,
    ci."order",
    ci.container_type,
    ci.container_id
   FROM (container_item ci
     FULL JOIN ( SELECT 'Codelist'::text AS type_,
            codelist.id
           FROM codelist
        UNION ALL
         SELECT 'Phenotype'::text AS type_,
            phenotype.id
           FROM phenotype) ids USING (type_, id))
  WHERE ((ci.id IS NULL) OR (ids.id IS NULL));


CREATE VIEW "orphaned_phenotypes" AS SELECT phenotype.id,
    phenotype.name,
    phenotype.medical_description,
    phenotype.operational_description,
    phenotype.properties,
    phenotype.reference_id
   FROM phenotype
  WHERE (phenotype.id IN ( SELECT container_item.id
           FROM container_item
          WHERE ((container_item.container_id IN ( SELECT orphaned_collections.id
                   FROM orphaned_collections)) AND ((container_item.type_)::text = 'Phenotype'::text))
        UNION
         SELECT orphaned_container_items.source_id AS id
           FROM orphaned_container_items
          WHERE (orphaned_container_items.source_type = 'Phenotype'::text)));


CREATE VIEW "orphaned_codelists" AS SELECT codelist.id,
    codelist.name,
    codelist.description,
    codelist.transient_commit_id,
    codelist.reference_id
   FROM codelist
  WHERE (codelist.id IN ( SELECT container_item.id
           FROM container_item
          WHERE ((((container_item.container_id IN ( SELECT orphaned_collections.id
                   FROM orphaned_collections)) AND ((container_item.container_type)::text = 'Collection'::text)) OR ((container_item.container_id IN ( SELECT orphaned_phenotypes.id
                   FROM orphaned_phenotypes)) AND ((container_item.container_type)::text = 'Phenotype'::text))) AND ((container_item.type_)::text = 'Codelist'::text))
        UNION
         SELECT orphaned_container_items.source_id AS id
           FROM orphaned_container_items
          WHERE (orphaned_container_items.source_type = 'Codelist'::text)));


CREATE VIEW "orphaned_commits" AS SELECT commit.id,
    commit.codelist_id,
    commit.author_id,
    commit.created_at,
    commit.message,
    commit."position"
   FROM commit
  WHERE ((commit.codelist_id IN ( SELECT orphaned_codelists.id
           FROM orphaned_codelists)) OR (commit.id IN ( SELECT orphaned_codelists.transient_commit_id
           FROM orphaned_codelists)))
UNION
 SELECT commit.id,
    commit.codelist_id,
    commit.author_id,
    commit.created_at,
    commit.message,
    commit."position"
   FROM commit
  WHERE ((commit.codelist_id IS NULL) AND (NOT (commit.id IN ( SELECT codelist.transient_commit_id
           FROM codelist
          WHERE (codelist.transient_commit_id IS NOT NULL)))));


CREATE VIEW "orphaned_changesets" AS SELECT changeset.id,
    changeset.commit_id,
    changeset.ontology_id,
    changeset.code_ids_added,
    changeset.code_ids_removed
   FROM changeset
  WHERE (changeset.commit_id IN ( SELECT orphaned_commits.id
           FROM orphaned_commits));


COMMIT;
