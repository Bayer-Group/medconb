# Medical Concept Builder (MedConB)

[![Build Status](https://github.com/Bayer-Group/medconb/actions/workflows/docker-build-deploy.yml/badge.svg)](https://github.com/Bayer-Group/medconb/actions/workflows/docker-build-deploy.yml)
[![Documentation](https://img.shields.io/badge/Documentation-526CFE?logo=MaterialForMkDocs&logoColor=white)](https://bayer-group.github.io/medconb/)
[![Checked with mypy](https://www.mypy-lang.org/static/mypy_badge.svg)](https://mypy-lang.org/)
[![Code style: black](https://img.shields.io/badge/code%20style-black-000000.svg)](https://github.com/psf/black)
[![Linting: Pylama](https://img.shields.io/badge/colinting-PyLama-000000.svg)](https://github.com/klen/pylama)

## Contributions

| **Role**                | **Contributor**                                                   |
|-------------------------|-------------------------------------------------------------------|
| Project Management      | [Alexander Vowinkel](https://github.com/kaktus42)                 |
| Backend Development     | [Alexander Vowinkel](https://github.com/kaktus42)                 |
| Frontend Development    | [Rajesh Sharma](https://github.com/broncha)                       |
| UX & UI                 | Susanne Feldt                                                     |
| Ideation                | [Alexander Hartenstein](https://github.com/a-hartens), Bayer-Team |

## Introduction

Welcome to the Medical Concept Builder (MedConB), a pioneering tool designed to simplify the complex process of translating medical knowledge into a machine-readable format for studies utilizing Real World Data (RWD)[^1]. As the landscape of healthcare continuously evolves, the ability to efficiently encode medical transactions collected in hospitals and clinics becomes increasingly crucial. MedConB stands at the forefront of this initiative, empowering medical professionals and researchers to create reliable and high-quality studies with ease.

[^1]: Real World Data refers to the information collected during routine medical care, encompassing every transaction that takes place within clinical settings. This data is recorded using various coding ontologies, such as ICD-9, ICD-10, CPRD, SNOMED, and NDC.

### Medical Concepts

A medical concept generally refers to an idea, definition, or understanding related to health, disease, diagnosis, treatment, or biomedical research. These concepts can range from specific diseases (like diabetes or hypertension) to broader ideas such as public health measures, epidemiology, clinical practice guidelines, or health policy.

In RWD studies a key challenge is to translate medical concepts from the real world into structured and computable formats that can be effectively analyzed and interpreted. This is a process which involves experts from multiple professions - from clinicians over epidemiologists to data specialists - to work closely together. The outcomes range from lists of medical codes (codelists) that are used as e.g. exclusion criteria to complex concepts (sometimes also referred to as phenotypes, ePhenotypes, or phenotype algorithms) that can consist of multiple codelists and lab value criteria in temporal relationship.

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

If you want to see the docs locally (e.g. for a different branch), run `uv run mkdocs serve -a localhost:8099` and go to http://localhost:8099.

## Local Deployment

### Quick start (Docker)

For you to check out MedConB quickly, we have a docker compose based setup that gets you started quickly
to test the tool. All you need is docker and [docker compose](https://docs.docker.com/compose/)

Then you can run `docker compose up` to start everything in the background. Once all services are up,
go to http://localhost:3001 and use the dev login ("Sign in using dev token")

### Development setup

This project uses [uv](https://docs.astral.sh/uv/) for Python dependency management.

```bash
# Install uv (if not already installed)
curl -LsSf https://astral.sh/uv/install.sh | sh

# Install all dependencies (dev + docs)
make sync

# Run all quality checks (lint, typecheck, tests)
make all_qa
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for more details.
