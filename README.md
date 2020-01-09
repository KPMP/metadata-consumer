# metadata-consumer
Repository to hold the Pentaho scripts used for both validation of the metadata files as well as the scripts to consume the metadata for use in the system.

This repository will store the xml that defines the scripts used by Pentaho to perform the data transformations.

You can download a free version of Pentaho from https://sourceforge.net/projects/pentaho/ to use for editing the scripts.


To call the validation script on your local machine:
http://localhost:8080/kettle/executeTrans/?rep=docker-pentaho-di&trans=transcriptomics&user=cluster&pass=cluster&baseDirectory=%2Fdata&packageDirectory=package_123&level=debug
Where baseDirectory = /data and packageDirectory is the directory name for the package you want to check
Also, make sure that you have your ENV_PENTAHO_SCRIPT_DIR pointed at the validationScripts directory inside of the metadataValidator project

