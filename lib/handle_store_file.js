var reader = require('../index.js')
var couch_saver = require('couchdb_bulkdoc_appender')
var queue = require('queue-async')
var _ = require('lodash')
var get_district = require('./get_district')
var create_db = require('./create_db')

function handle_file(filename,config,year,callback){
    // parse out min, max, write to couchdb
    var bulkopts = _.clone(config.couchdb)
    var district = get_district(filename)
    var db = config.couchdb.imputeddb+'%2f'+district+"%2f"+year

    bulkopts.url = bulkopts.host
    bulkopts.db = db
    var process = queue(1)

    process.defer(create_db,config,db)


    var saver = couch_saver(bulkopts)

    reader.read_and_process(filename,function(err,rows){

        if(err) return callback(err)
        // console.log(rows)
        // bulkdoc rows to couchdb
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
