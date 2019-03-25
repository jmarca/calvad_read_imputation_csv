var reader = require('../index.js')
var couch_set = require('couch_set_state')
var queue = require('d3-queue').queue
var _ = require('lodash')

function handle_file(filename,config,year,callback){
    // parse out min, max, write to couchdb
    reader.read_and_minmax_ts(filename,function(err,minmax){
        if(err) return callback(err)

        var optmin = _.assign({},
                              config.couchdb,
                              {
                                  'state':'mints'
                                  ,'value':minmax.mints
                                  ,'year':year
                                  ,'doc':minmax.detector_id
                              })
        optmin.db = config.couchdb.trackingdb
        var optmax = _.clone(optmin)
        optmax.state = 'maxts'
        optmax.value = minmax.maxts

        // save both to couchdb
        var q = queue(1)
        q.defer(couch_set,optmin)
        q.defer(couch_set,optmax)
        q.await(function(e,r){
            return callback(e,null)
        })
        return null
    })
    return null
}

module.exports=handle_file
