#!/bin/bash

# Usage: ./run.sh <optional-package-id>
# Make sure the dataLake network with mongodb is running first!

WORKER_IMAGE=kingstonduo/mongo-packages-to-es-arranger:latest

# Run the container with passed arguments
docker run --env-file=.env --network=dataLake $WORKER_IMAGE