# Overview
Generates package information JSON and loads into ES for the Metadata Explorer.

In order to run me you will need to:

1) Copy .env.example to .env
2) Update your .env to match your environment (you may not need to change anything, but verify)
3) Ensure you have the dataLake running so it can access the dataLake mongo store
4) ./run.sh metadata-2020-02-04
   NOTE: metadata-2020-02-04 is the index in elasticsearch you want the data to flow into

The bash file run.sh builds the docker container and launches it.
