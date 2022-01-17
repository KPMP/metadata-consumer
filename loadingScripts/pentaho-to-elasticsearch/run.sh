#!/bin/bash

# Usage: ./run.sh <path-to-metadata-json-file>
# Make sure the dataLake network with mongodb is running first!

realpath() {
    [[ $1 = /* ]] && echo "$1" || echo "$PWD/${1#./}"
}

WORKER_IMAGE=kingstonduo/pentaho-to-elasticsearch-worker:latest
METADATA_DIR=$(dirname $(realpath "$1"))
METADATA_FILE=$(basename "$1")

# Run the container with passed arguments
CMD="docker run --env-file=.env --env METADATA_FILE=$METADATA_FILE -v $METADATA_DIR:/data --network=dataLake $WORKER_IMAGE"

# echo $CMD
${CMD}

