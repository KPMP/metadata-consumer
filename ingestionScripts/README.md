## Setting Up

The following variables need to be set in the metadata_ingestion job:

* packageID: the ID of the package
* baseDirectory: the directory holding all of the packages
* packageDirectory: the directory with the specific package being ingested

The ingestion script expects the metadata file to start with "METADATA_".

## Output

The ingestion script produces three files:

* [packageID]_metadata_per_file.json

   A file with newline-separated JSON objects representing each file plus metadata.
* [packageID]_metadata_flat.json

   A file with newline-separated JSON objects representing the metadata for each replicate (all files).
* [packageID]_metadata_nested.json

   A file with newline-separated JSON objects representing the metadata for each replicate but with the file type-specific (FASTQ, BAM, Expression Matrix) metadata+files in sub-properties. 
