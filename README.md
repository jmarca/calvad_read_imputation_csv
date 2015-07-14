# CalVAD Read CSV Imputation Data into CouchDB

This repo contains some code to parse the output of the truck
imputation process, and to write that data into CouchDB.  Actually, it
doesn't do the writing, but it does set things up to be written using
bulkdocs.

The input CSV files are generated by the imputation code in the repo `calvad_impute_trucks`.

The problem with many small repositories is that it is sometimes hard
to see what the heck is going on.  That's why I named this as
descriptively as I could.  Still, if you're not working on CalVAD, it
is unlikely to be helpful.