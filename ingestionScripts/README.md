## Overview
Generates JSON files from metadata Excel files using Pentaho. These files are intended to be loaded into the Metadata Explorer.

## Setting Up

The following variables need to be set in the metadata_ingestion job:

* packageID: the ID of the package
* baseDirectory: the directory holding all of the packages
* packageDirectory: the directory with the specific package being ingested

The ingestion script expects the metadata file to start with "METADATA_". The ingestion script will also read in a list of all of the files (except the METADATA_* file) in the "packageDirectory" and lookup the file size based on the file name provided in the metadata.

## Output

The ingestion script produces three files:

* [packageID]_metadata_per_file.json

   A file with newline-separated JSON objects representing each file plus metadata.
* [packageID]_metadata_flat.json

   A file with newline-separated JSON objects representing the metadata for each replicate (all files).
* [packageID]_metadata_nested.json

   A file with newline-separated JSON objects representing the metadata for each replicate but with the file type-specific (FASTQ, BAM, Expression Matrix) metadata+files in sub-properties. 

