# Medical Concept Builder (MedConB)

## Introduction

Welcome to the Medical Concept Builder (MedConB), a pioneering tool designed to simplify the complex process of translating medical knowledge into a machine-readable format for studies utilizing Real World Data (RWD)[^1]. As the landscape of healthcare continuously evolves, the ability to efficiently encode medical transactions collected in hospitals and clinics becomes increasingly crucial. MedConB stands at the forefront of this initiative, empowering medical professionals and researchers to create reliable and high-quality studies with ease.

### Medical Concepts

A medical concept generally refers to an idea, definition, or understanding related to health, disease, diagnosis, treatment, or biomedical research. These concepts can range from specific diseases (like diabetes or hypertension) to broader ideas such as public health measures, epidemiology, clinical practice guidelines, or health policy.

In RWD studies a key challenge is to translate medical concepts from the real world into structured and computable formats that can be effectively analyzed and interpreted. This is a process which involves experts from multiple professions - from clinicians over epidemiologists to data specialists - to work closely together. The outcomes range from lists of medical codes (codelists) that are used as e.g. exclusion criteria to complex concepts (sometimes also referred to as phenotypes, ePhenotypes, or phenotype algorithms) that can consist of multiple codelists and lab value criteria in temporal relationship.

[^1]: Real World Data refers to the information collected during routine medical care, encompassing every transaction that takes place within clinical settings. This data is recorded using various coding ontologies, such as ICD-9, ICD-10, CPRD, SNOMED, and NDC.

### The Challenge

Constructing accurate medical concepts is a complex endeavor that requires the expertise of medical professionals and can significantly affect the quality and reliability of RWD studies. The traditional methods of developing these concepts are often cumbersome and prone to errors, leading to inconsistencies in research outcomes and wasted resources.

### Our Solution: MedConB

MedConB aims to bridge the gap between medical expertise and machine-readable formats. By providing an intuitive platform, we enable medical experts to easily translate their domain knowledge into structured formats that can be rapidly deployed in studies. Our tool fosters collaboration among clinicians and pharmaco-epidemiologists, allowing them to communicate in a universally understood language.

Through efforts such as streamlined knowledge curation interfaces and linked data resources, MedConB facilitates the connection of RWD sources to clinical studies. Looking forward, our vision includes enhancing the link to early research and development drug targets, further enriching the medical research ecosystem.

### Join Us

We invite you to participate in the ongoing development of the Medical Concept Builder. The application is constantly being extended, your feedback and collaboration are invaluable as we work to refine this tool and expand its capabilities. If you wish to get involved or require access to the preview version, please contact us.

Together, let's make strides towards a more efficient, accurate, and collaborative approach to medical concept creation.

## Documentation

Docs are created by mkdocs. For the branch `develop` they are published under this url: https://Bayer-Group.github.io/medconb/.

If you want to see the docs locally (e.g. for a different branch), run `mkdocs serve -a localhost:8099` and go to http://localhost:8099.

## Development Setup

For development, you need _anaconda/miniconda_, _docker_ and _git-lfs_ installed. Then clone the repo.

### 1. Create Conda Environment

```bash
conda env create -n medconb -f environment.dev.fixed.yml
```

### 2. Start Database Server

```bash
docker-compose -f docker-compose.dev.yml up
```

You can now access the database through adminer by going to http://localhost:8091/.
Choose "PostgreSQL" in System, "db" in Server. The credentials are user: "postgres", pass: "password".

### 3. Prepare databases

To reset the databases, there is a script that can be called by running `make reset-databases-local`.
It runs `cicd/reset-databases-local.sh`. Open that file and uncomment the three lines that refer to the `ontologies` database.
Then run the make command.

### 4. Create Config File

1. Copy `backend/config.default.yaml` to `backend/config.yaml`,
2. uncomment the section `auth.develop`,
3. set a random `auth.develop.token`.

4. Copy `frontend/assets/config/config.example.json` to `frontend/assets/config/config.json`,
5. Change the entry `dev_token` to the token you set above.

### 5. Start Backend

Make sure you have the `medconb` conda environment activated.

```bash
cd backend
MEDCONBDIR=. uvicorn --reload --factory medconb:create_app
```

You can now access the GraphQL playground at http://localhost:8000/graphql/. In order to send successful requests, you have to put the following into the "HTTP Headers" section (left bottom of the page).

```json
{
  "Authorization": "Bearer <the auth.develop.token from config.yaml>"
}
```

### 6. Start Frontend

```bash
cd frontend
npm ci  # initially and if some dependencies change
npm start
```
