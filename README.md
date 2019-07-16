# CalVAD Read CSV Imputation Data into CouchDB

[![Build Status](https://travis-ci.org/jmarca/calvad_read_imputation_csv.svg?branch=master)](https://travis-ci.org/jmarca/calvad_read_imputation_csv)
[![Maintainability](https://api.codeclimate.com/v1/badges/84bf21077042f74465d7/maintainability)](https://codeclimate.com/github/jmarca/calvad_read_imputation_csv/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/84bf21077042f74465d7/test_coverage)](https://codeclimate.com/github/jmarca/calvad_read_imputation_csv/test_coverage) [![Greenkeeper badge](https://badges.greenkeeper.io/jmarca/calvad_read_imputation_csv.svg)](https://greenkeeper.io/)


This repo contains some code to parse the output of the truck
imputation process, and to write that data into CouchDB.  Actually, it
doesn't do the writing, but it does set things up to be written using
bulkdocs.

The input CSV files are generated by the imputation code in the repo `calvad_impute_trucks`.

The problem with many small repositories is that it is sometimes hard
to see what the heck is going on.  That's why I named this as
descriptively as I could.  Still, if you're not working on CalVAD, it
is unlikely to be helpful.

# Executable stuff

To combat the issue with small libraries that are used elsewhere, I've
written two executables that can be used here.  Assuming all the tests
pass, you can run them.

First, to store the min and max timestamps, which is important for
determining the segment lengths.

Do something like:

```
node write_min_max.js --config ./test.config.json --path ./test/files --year 2012
```

except put config.json, not test.config.json, and put the real path to
the CSV files.

The real config.json should be mode 0600, (nobody can read or write
except the owner) and should contain something like:

```
{
    "couchdb": {
        "host": "127.0.0.1",
        "port":5984,
        "trackingdb":"vdsdata%2ftracking",
        "auth":{"username":"couchuser",
                "password":"super secret password for couchdb"
               },
        "imputeddb":"imputed%2fcollated"
    }
}
```


## Note about imputeddb

If you look at the code in './lib/handle_store_file.js', you will see
that the actual couchdb database this program will use is the
concatenation of the district and year with whatever you pass in.

At the moment I am not using any postgresql configuration for this code.

Obviously put the real host, port, username, and password for couchdb
in there, not the fake ones above.

For the actual parsing, do something similar:

```
node parse_csv_to_couchdb.js --config ./test.config.json --path ./test/files --year 2012
```

However, at this time of writing, I haven't yet merged in the segment
lengths, and am undecided about whether or not I should merge it in,
or do it after the fact.  If merging, then the config file will need a
postgresql link to go fetch the segment lengths.  But I think I am
going to do it after the fact.

# And then...

As of April 2016, the above comment still holds.  That is, the lengths
have not been merged into couchdb docs, but rather have to be queried
from postgresql.

Anyway, the next step after running this code is to generate the
precached areas, which grabs the lengths from postgresql and
multiplies by the volume and saves.

To do that, go look at the repository `calvad_precache_areas` and read
the README there.
