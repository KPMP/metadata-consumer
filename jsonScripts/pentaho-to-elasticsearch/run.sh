#!/bin/bash

# Usage: ./run.sh <index-name> <path-to-metadata-json-file-path>
# Make sure the dataLake network with mongodb is running first!

# Rebuild the worker image (if necessary) and get the ID
WORKER_IMAGE=$(cd docker && \
  docker build --rm -t kingstonduo/pentaho-to-elasticsearch-worker . >/dev/null && \
  docker images -q kingstonduo/pentaho-to-elasticsearch-worker)

# Run the container with passed arguments
docker run --env-file=.env --env ES_INDEX=$1 --env METADATA_JSON_PATH=$2 --network=dataLake $WORKER_IMAGE
