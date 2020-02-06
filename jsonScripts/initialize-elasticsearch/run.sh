#!/bin/bash

# Usage: ./run.sh <index-name> <optional-package-id>
# Make sure the dataLake network with mongodb is running first!

# Rebuild the worker image (if necessary) and get the ID
WORKER_IMAGE=$(cd docker && \
  docker build --rm -t kingstonduo/initialize-elasticsearch-worker . >/dev/null && \
  docker images -q kingstonduo/initialize-elasticsearch-worker)

# Run the compose with passed arguments
docker run --env-file=.env --env ES_INDEX=$1 --env PACKAGE_ID=$2 --network=dataLake $WORKER_IMAGE
