#!/bin/bash

# Usage: ./run.sh <optional-package-id>
# Make sure the dataLake network with mongodb is running first!

# Rebuild the worker image (if necessary) and get the ID
WORKER_IMAGE=$(cd docker && \
  docker build --rm -t kingstonduo/mongo-packages-to-elasticsearch-worker . >/dev/null && \
  docker images -q kingstonduo/mongo-packages-to-elasticsearch-worker)

# Run the container with passed arguments
docker run --env-file=.env --env PACKAGE_ID=$1 --network=dataLake $WORKER_IMAGE
