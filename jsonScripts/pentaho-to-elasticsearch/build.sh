#!/bin/bash

# Rebuild the worker image (if necessary) and push to docker hub
cd docker
docker build --rm -t kingstonduo/pentaho-to-elasticsearch-worker . 

docker push kingstonduo/pentaho-to-elasticsearch-worker

