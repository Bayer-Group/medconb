#!/bin/bash

set -e

export PYTHONPATH=$(pwd)

python helper/build_ontology_assets.py

uvicorn --factory medconb:create_app $@
