#Data Lake Mongo to Arranger Elasticsearch Index
##Overview
This script is intended to migrate records from the Data Lake Mongo into Elasticsearch for Arranger to use for the portal GUI.
It creates an index called "file", adds it to Elasticsearch, and adds all packages with "promoted: true".

##Running
In order to run me you will need to:

1) Copy .env.example to .env
2) Update your .env to match your environment (you may not need to change anything, but verify)
3) Ensure you have the dataLake running so it can access the dataLake mongo store
4) ./run.sh 

The bash file run.sh builds the docker container and launches it.
