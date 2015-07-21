var should = require('should')
var _ = require('lodash')

var min_max_handler = require('../lib/handle_minmax.js')

// just get the file name, pass to min_max_hanler for testing

var request = require('request')

var cdb // global so I can delete it
var headers = {
    'content-type': 'application/json',
    'accept': 'application/json'
};


var cdb

function create_tempdb(cb){
    var date = new Date()
    var test_db_unique = [config.couchdb.db,
                          date.getHours(),
                          date.getMinutes(),
                          date.getSeconds(),
                          date.getMilliseconds()].join('-')
    config.couchdb.db = test_db_unique
    cdb ='http://'+
        [config.couchdb.host+':'+config.couchdb.port
        ,config.couchdb.db].join('/')
    request.put(cdb,{
        jar:true,
        'content-type': 'application/json',
        'accept': 'application/json',
        headers:headers,
        auth:{'user':config.couchdb.auth.username,
              'pass':config.couchdb.auth.password,
              'sendImmediately': true}
    },
                function(e,r,b){

                    if(r.error){
                        // do not delete if we didn't create
                        config.delete_db=false
                    }else{
                        config.delete_db=true
                    }
                    //console.log(result.text)
                    return cb()
                })
    return null
}


function delete_tempdb(config,cb){
    request.del(cdb
                ,{
                    'content-type': 'application/json',
                    'auth': {
                        'user': config.couchdb.auth.username,
                        'pass': config.couchdb.auth.password,
                        'sendImmediately': true
                    }
                }
                ,cb)
    return null

}

var path    = require('path')
var rootdir = path.normalize(__dirname)
var config_okay = require('config_okay')
var config_file = rootdir+'/../test.config.json'
var config
var check = require('couch_check_state')

before(function(done){

    config_okay(config_file,function(err,c){
        config=c
        config.couchdb.db = 'test%2fminmax'
        queue(1)
        .defer(create_tempdb)
        .await(done)
        return null
    })
    return null
})


after(function(done){

    delete_tempdb(config,function(e){
        if(e) throw new Error(e)
        return done()
    })

})

var queue = require('queue-async')

describe('read csv for min max',function(){
    it('should read a file',function(done){
        var accum = {}
        min_max_handler('./test/files/vds_id.1205668.truck.imputed.2012.csv'
                        ,config
                        ,2012
                        ,function(e){
                            should.not.exist(e)
                            // check couchdb doc for min and max values

                            var taskmin = _.assign({}
                                                   ,config.couchdb
                                                   ,{'doc':'1205668'
                                                     ,'year':2012
                                                     ,'state':'mints'
                                                    })
                            var taskmax = _.assign({}
                                                   ,config.couchdb
                                                   ,{'doc':'1205668'
                                                     ,'year':2012
                                                     ,'state':'maxts'
                                                    })
                            var q = queue()
                            q.defer(check,taskmin)
                            q.defer(check,taskmax)
                            q.awaitAll(function(e,r){
                                r[0].should.eql('2012-09-06 14:00:00')
                                r[1].should.eql('2012-12-28 09:00:00')
                                return done()
                            })
                            return null
                        })
        return null
    })
    return null
})
