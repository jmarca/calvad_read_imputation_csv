var should = require('should')
var _ = require('lodash')

var handler = require('../lib/handle_store_file.js')

var request = require('request')

var svo = require('../lib/constants.js').store_variable_order

function delete_tempdb(config,cb){
    var db = config.couchdb.imputeddb
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

var path    = require('path')
var rootdir = path.normalize(__dirname)
var config_okay = require('config_okay')
var config_file = rootdir+'/../test.config.json'
var config
var check = require('couch_check_state')
var create_db =  require('../lib/create_db.js')


before(function(done){

    config_okay(config_file,function(err,c){
        config=c
        //config.couchdb.imputeddb = 'test%2fcollated'
    var date = new Date()
    var test_db_unique = ['a%2ftest%2fdb%2f',
                          date.getHours(),
                          date.getMinutes(),
                          date.getSeconds(),
                          date.getMilliseconds()].join('-')
        var db = test_db_unique
        config.couchdb.imputeddb = db
        create_db(config,db,function(e,r){
            should.not.exist(e)
            should.exist(r)
            should.not.exist(r.error)
            return done(e)
        })

        return done()
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
        handler('./test/files/vds_id.1205668.truck.imputed.2012.csv'
                ,config
                ,2012
                ,function(e){
                    should.not.exist(e)
                    // check couchdb doc for values
                    var tests = queue(1)
                    tests.defer(createddb,config)
                    tests.defer(hasmin,config)
                    tests.defer(hasmax,config)
                    tests.await(function(e,r){
                        return done(e)
                    })
                    return null
                })
        return null
    })
})


function createddb(config,cb){
    var url = 'http://'+ config.couchdb.host+':'+config.couchdb.port
    var db = config.couchdb.imputeddb + '%2f12%2f2012'
    var cdb =url + '/' + db
    request.get(
        {  'uri': cdb
           , 'content-type': 'application/json'
           , 'json':true

        }
        , function (e,r,b){

            // body should be json decoded, right?
            should.not.exist(e)
            should.exist(b)
            b.should.not.have.property('error')
            b.should.have.property('doc_count')
            b.doc_count.should.be.above(0)
            b.doc_count.should.eql(2708) // 10832 lines, 4 lanes
            return cb(null)
        })
}

function hasmin(config,cb){
    var url = 'http://'+ config.couchdb.host+':'+config.couchdb.port
    var db = config.couchdb.imputeddb + '%2f12%2f2012'
    var cdb =url + '/' + db
    var doc = "1205668-2012-09-06 14:00:00"
    request.get(
        {  'uri': cdb + '/' + doc
           , 'content-type': 'application/json'
           , 'json':true
        }
        , function (e,r,b){
            should.not.exist(e)
            should.exist(b)
            b.should.have.keys('_id','_rev','ts','lanes','detector_id','data')
            b.ts.should.eql("2012-09-06 14:00:00")
            b.lanes.should.eql(4)
            b.data.should.have.length(14)
            b.data[svo.n].should.be.approximately(3153.9785962235,0.000001)
	    b.data[svo.o].should.be.approximately(0.0848356591,0.000001)
            b.data[svo.wgt_spd_all_veh_speed].should.be.approximately(65.6615481851,0.000001)
            b.data[svo.count_all_veh_speed].should.be.approximately(3059.0311392817,0.000001)
            b.data[svo.not_heavyheavy].should.be.approximately(89.3919895599,0.000001)
            b.data[svo.heavyheavy].should.be.approximately(90.6037589141,0.000001)
            b.data[svo.hh_weight].should.be.approximately(38.2962816872,0.000001)
            b.data[svo.hh_axles].should.be.approximately(4.4948021844,0.000001)
            b.data[svo.hh_speed].should.be.approximately(49.1686765558,0.000001)
            b.data[svo.nh_weight].should.be.approximately(11.53163557,0.000001)
            b.data[svo.nh_axles].should.be.approximately(1.3696953295,0.000001)
            b.data[svo.nh_speed].should.be.approximately(65.0317028776,0.000001)

            return cb(null)
        })
    return null
}

// source rows
// 1036.52447762784,0.0933265301337552,61566.8296251436,816.643036591961,"l1",NA,NA,NA,NA,NA,NA,NA,NA
// 1012.30872273161,0.10269834843983,62910.8245305018,876.955172448076,"r3",NA,NA,NA,NA,NA,NA,NA,NA
// 650.910129695934,0.0836900835407967,44501.3021851995,760.394670365881,"r2",45.7878164464907,57.5694356360226,2159.57247760396,234.924940896369,2838.13003051877,631.857873986294,64.420243790849,3324.9703809053
// 454.235266168078,0.0596276742847961,31881.7642107694,605.038259875728,"r1",43.6041731133655,33.0343232780937,1310.21459569365,172.321032582005,1616.73688626549,398.977972496108,58.0195468036579,2488.3429237916



function hasmax(config,cb){
    var url = 'http://'+ config.couchdb.host+':'+config.couchdb.port
    var db = config.couchdb.imputeddb + '%2f12%2f2012'
    var cdb =url + '/' + db
    var doc = "1205668-2012-12-28 09:00:00"
    request.get(
        {  'uri': cdb + '/' + doc
           , 'content-type': 'application/json'
           , 'json':true
        }
        , function (e,r,b){
            should.not.exist(e)
            should.exist(b)
            b.should.have.keys('_id','_rev','ts','lanes','detector_id','data')
            b.ts.should.eql("2012-12-28 09:00:00")
            b.lanes.should.eql(4)
            b.data.should.have.length(14)

            b.data[svo.n].should.be.approximately(1286.0745603789,0.000001)
	    b.data[svo.o].should.be.approximately(0.0860591722,0.000001)
            b.data[svo.wgt_spd_all_veh_speed].should.be.approximately(50.5282921217,0.000001)
            b.data[svo.count_all_veh_speed].should.be.approximately(1410.7302312415,0.000001)
            b.data[svo.not_heavyheavy].should.be.approximately(57.2819450153,0.000001)
            b.data[svo.heavyheavy].should.be.approximately(59.4976573709,0.000001)
            b.data[svo.hh_weight].should.be.approximately(29.6915981966,0.000001)
            b.data[svo.hh_axles].should.be.approximately(4.3542728187,0.000001)
            b.data[svo.hh_speed].should.be.approximately(55.0519569329,0.000001)
            b.data[svo.nh_weight].should.be.approximately(9.4554787921,0.000001)
            b.data[svo.nh_axles].should.be.approximately(1.7096261934,0.000001)
            b.data[svo.nh_speed].should.be.approximately(42.2881596677,0.000001)



            return cb(null)
        })
    return null
}

//                                                    ,config.couchdb
//                                                    ,{'doc':'1205668'
//                                                      ,'year':2012
//                                                      ,'state':'mints'
//                                                     })
//                             var taskmax = _.assign({}
//                                                    ,config.couchdb
//                                                    ,{'doc':'1205668'
//                                                      ,'year':2012
//                                                      ,'state':'maxts'
//                                                     })
//                             var q = queue()
//                             q.defer(check,taskmin)
//                             q.defer(check,taskmax)
//                             q.awaitAll(function(e,r){
//                                 r[0].should.eql('2012-09-06 14:00:00')
//                                 r[1].should.eql('2012-12-28 09:00:00')
//                                 return done()
//                             })
//                             return null
//                         })
//         return null
//     })
//     return null
// })
