#!/bin/bash

# Usage: ./run.sh <path-to-package-files> <package-id>
# Make sure the host network has Mongo (or port forwarding of a Mongo DB on 27017)

FILE_SUFFIX="_metadata_flat.json"
WORKER_IMAGE=kingstonduo/pentaho-to-elasticsearch-worker:latest
METADATA_DIR=$1\\\\$2
METADATA_FILE=$2$FILE_SUFFIX

# Run the container with passed arguments
CMD="docker run --env-file=.env --env METADATA_FILE=$METADATA_FILE -v $METADATA_DIR:/data -p 27017:27017 $WORKER_IMAGE"

echo $CMD
${CMD}
