var should = require('should')
var _ = require('lodash')

var create_db =  require('../lib/create_db.js')

var db // global so I can delete it
var request = require('request')


var path    = require('path')
var rootdir = path.normalize(__dirname)
var config_okay = require('config_okay')
var config_file = rootdir+'/../test.config.json'
var config

before(function(done){
    config_okay(config_file,function(err,c){
        config=c
        return done()
    })
    return null
})

function delete_tempdb(config,cb){
    var cdb ='http://'+
        [config.couchdb.host+':'+config.couchdb.port
        ,db].join('/')
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

after(function(done){

    delete_tempdb(config,function(e){
        if(e) throw new Error(e)
        return done()
    })

})

describe('create db',function(){
    var date = new Date()
    var test_db_unique = ['a%2ftest%2fdb%2f',
                          date.getHours(),
                          date.getMinutes(),
                          date.getSeconds(),
                          date.getMilliseconds()].join('-')
    db = test_db_unique
    it('should create a db',function(done){
        create_db(config,db,function(e,r){
            should.not.exist(e)
            should.exist(r)
            should.not.exist(r.error)
            return done(e)
        })

    })
    it('should fail with error statement on duplicate db',function(done){
        create_db(config,db,function(e,r){
            should.not.exist(e)
            should.exist(r)
            r.should.have.property('error')
            return done(e)
        })

    })
})
