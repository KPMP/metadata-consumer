#!/bin/bash

# Usage: ./run.sh <packageID> <path-to-metadata-json-file>
# Make sure the dataLake network with mongodb is running first!

realpath() {
    [[ $2 = /* ]] && echo "$2" || echo "$PWD/${2#./}"
}

WORKER_IMAGE=kingstonduo/files-json-to-mongo:latest

# Run the container with passed arguments
CMD="docker run --env-file=.env --env METADATA_FILE_PATH=$2 --network=dataLake $WORKER_IMAGE"

# echo $CMD
${CMD}

