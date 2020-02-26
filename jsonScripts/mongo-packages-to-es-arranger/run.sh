#!/bin/bash

# Usage: ./run.sh
# Make sure the dataLake network with mongodb is running first!

WORKER_IMAGE=kingstonduo/mongo-packages-to-es-arranger:latest

# Run the container with passed arguments
docker run --env-file=.env --network=dataLake $WORKER_IMAGE