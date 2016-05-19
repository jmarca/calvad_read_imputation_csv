var reader = require('../index.js')
var couch_saver = require('couchdb_bulkdoc_appender')
var queue = require('d3-queue').queue
var _ = require('lodash')
var get_district = require('./get_district')
var create_db = require('./create_db')

// FIXME
//
// this function works to parse the csv file and write the contained
// contents to couchdb, but it will not add the length of the segment.
// that must either be done later or I need to add that in as a lookup
// or something.

// I can't see how to work the segment length in cleanly here, so it
// may be better to just figure that out later and do a separate run
// to save it to each doc.

function handle_file(filename,config,year,callback){
    // parse out min, max, write to couchdb
    var bulkopts = _.clone(config.couchdb)
    var district = get_district(filename)
    var db = config.couchdb.imputeddb+'%2f'+district+"%2f"+year

    bulkopts.url = bulkopts.host
    bulkopts.db = db
    var process = queue(1)

    process.defer(create_db,config,db)

    // perhaps right here
    // var segments = {}
    // process.defer(get_segment_lengths,config,year,detector_id,segments)

    var saver = couch_saver(bulkopts)

    reader.read_and_process(filename,function(err,rows){

        if(err) return callback(err)
        // console.log(rows)
        // bulkdoc rows to couchdb
        //
        // and then right here, mixin the hash of segments with
        // the hash of rows.
        process.defer(saver,{
                docs:rows
        })


        process.awaitAll(function(e,r){
            //console.log(r[1])
            return callback(e,r)
        })
        return null
    })
    return null
}

module.exports=handle_file
