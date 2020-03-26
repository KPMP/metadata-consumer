# Update Data Lake Package Files Using Metadata JSON File
## Overview
This script is intended to update the "files" field of the specified package with the contents of the provided metadata JSON file. 

The JSON file should be a newline-delimited list of JSON objects representing the files in that package. 

## Running
In order to run this you will need to:

1) Copy .env.example to .env
2) Update your .env to match your environment (you may not need to change anything, but verify)
3) Ensure you have the dataLake running so it can access the dataLake mongo store
4) ./run.sh [packageId] [metadata file path]
    - ./run.sh 007aef61-c32b-4f86-80fd-a8b498d86946 /data/package_007aef61-c32b-4f86-80fd-a8b498d86946/007aef61-c32b-4f86-80fd-a8b498d86946_metadata_per_file.json

## Output
Either an error or the number of records matched and the number of records modified. 

## Building
The bash file build.sh builds the docker container and pushes it to the Docker Hub. 
