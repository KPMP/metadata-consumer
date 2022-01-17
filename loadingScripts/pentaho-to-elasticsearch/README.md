## Overview

Loads the JSON metadata files produced by Pentaho into the ES index used by the metadata explorer.

## Setup and Run

1) Copy .env.example to .env
2) Update your .env to match your environment (you may not need to change anything, but verify)
3) Ensure you have the dataLake running so it can access the dataLake mongo store
4) ./run.sh metadata_flat.json

## Results

This will insert data into 2 different ElasticSearch indexes:
1) metadata-packages-YYYY-MM-DD, which is 1 record per package
2) metadata-replicates-YYYY-MM-DD, which is 1 record per replicate (with package attributes included)

## Notes

The date is taken from the day the script was run.

The bash file run.sh builds the docker container and launches it.
