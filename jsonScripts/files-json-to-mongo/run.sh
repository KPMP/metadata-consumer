#!/bin/bash

# Usage: ./run.sh <packageID> <path-to-metadata-json-file>
# Make sure the dataLake network with mongodb is running first!

realpath() {
    [[ $2 = /* ]] && echo "$2" || echo "$PWD/${1#./}"
}

WORKER_IMAGE=kingstonduo/files-json-to-mongo:latest
METADATA_DIR=$(dirname $(realpath "$2"))
METADATA_FILE=$(basename "$2")

# Run the container with passed arguments
CMD="docker run --env-file=.env --env METADATA_FILE=$METADATA_FILE --env PACKAGE_ID=$1 -v $METADATA_DIR:/data --network=dataLake $WORKER_IMAGE"

# echo $CMD
${CMD}

