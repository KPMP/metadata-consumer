# Metadata Validation Scripts 

## Transcriptomics Metadata Column Validation Job (transcriptomics_metadata_column_validation.kjb)
### Expectations
- The master metdata file is (MetadataMaster.xlsx) in the directory with the Kettle file. 
- The file to be validated starts with "METADATA_" and resides in ${baseDirectory}/{packageDirectory} (set in the job variables).
### Output
There are three kinds of validations that compare the three file types (FAST, BAM, Expression Matrix) against the master producing a total output of 9 files:
- The the header/field names match.
- The number of fields match.
- The order of the fields match.
#### Ouput Format
The output is JSON text files in the following format:
```
{
  error: [true/false]
  message: "Validation message"
}
````
  
