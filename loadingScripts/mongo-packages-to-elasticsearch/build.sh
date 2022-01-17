#!/bin/bash

# Rebuild the worker image (if necessary) and get the ID
cd docker
docker build --rm -t kingstonduo/mongo-packages-to-elasticsearch-worker . 
docker push kingstonduo/mongo-packages-to-elasticsearch-worker
