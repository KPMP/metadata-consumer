#!/bin/bash

# Rebuild the worker image (if necessary) and push to docker hub
cd docker
docker build --rm -t kingstonduo/files-json-to-mongo .

docker push kingstonduo/files-json-to-mongo

