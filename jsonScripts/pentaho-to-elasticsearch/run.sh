#!/bin/bash

# Usage: ./run.sh <index-name> <path-to-metadata-json-file>
# Make sure the dataLake network with mongodb is running first!

# Rebuild the worker image (if necessary) and get the ID
WORKER_IMAGE=$(cd docker && \
  docker build --rm -t kingstonduo/pentaho-to-elasticsearch-worker . >/dev/null && \
  docker images -q kingstonduo/pentaho-to-elasticsearch-worker)

realpath() {
    [[ $1 = /* ]] && echo "$1" || echo "$PWD/${1#./}"
}

METADATA_DIR=$(dirname $(realpath "$2"))
METADATA_FILE=$(basename "$2")

# Run the container with passed arguments
CMD="docker run --env-file=.env --env ES_INDEX=$1 --env METADATA_FILE=$METADATA_FILE -v $METADATA_DIR:/data --network=dataLake $WORKER_IMAGE"

# echo $CMD
${CMD}

