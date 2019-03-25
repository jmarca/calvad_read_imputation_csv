
check = require('couch_check_state')
const tap = require('tap')
const get_district = require('../lib/get_district.js')
const utils = require('./utils.js')
const superagent = require('superagent')

const _ = require('lodash')

const create_db =  require('../lib/create_db.js')
const handler = require('../lib/handle_store_file.js')
const svo = require('../lib/constants.js').store_variable_order

// just get the file name, pass to min_max_hanler for testing


const path    = require('path')
const rootdir = path.normalize(__dirname)
const config_file = rootdir+'/../test.config.json'
const config_okay = require('config_okay')
const config={}


config_okay(config_file)
    .then( async (c) => {
        config.couchdb=c.couchdb

        const  date = new Date()
        const db = ['an%2fimputed%2fdb%2f',
                    date.getHours(),
                    date.getMinutes(),
                    date.getSeconds(),
                    date.getMilliseconds()].join('-')

        // await tap.test('should create a db', t => {
        //     utils.promise_wrapper(create_db,
        //                           config,
        //                           db)
        //         .then( r =>{
        //             t.ok(r)
        //             t.notOk(r.error)
        //             return t.end()
        //         })
        //         .catch( e => {
        //             console.log('error',e)
        //             t.fail()
        //         })
        // })
        config.couchdb.imputeddb = db
        config.couchdb.db = db

        tap.test('read csv file for min max', async t =>{
            await utils.promise_wrapper(handler,
                                        './test/files/vds_id.1205668.truck.imputed.2012.csv'
                                        ,config
                                        ,2012)
                .then(()=>{
                    // check couchdb doc for values
                    return t.test('test db created',test_createddb)
                })
                .then(()=>{
                    return t.test('test has a minimum',hasmin)
                })
                .then(()=>{
                    return t.test('test has a maximum',hasmax)
                })
                .catch( e =>{
                    console.log('caught error',e)
                    t.fail()
                })
                .then(()=>{
                    return t.end()
                })
        })
            .then(async ()=>{
                tap.end()
                config.couchdb.db = db + '%2fd12%2f2012'
                await utils.delete_tempdb(config)
                    .catch( e => {
                        console.log('error deleting')
                    })
                return null
            })
    })



function test_createddb(t){
    var url = 'http://'+ config.couchdb.host+':'+config.couchdb.port
    var db = config.couchdb.imputeddb + '%2fd12%2f2012'
    var cdb =url + '/' + db
    return superagent.get(cdb)
        .type('json')
        .then(r=>{
            t.ok(r.body)
            const b = r.body
            t.notOk(b.error)
            t.ok(b.doc_count)
            t.ok(b.doc_count>0)
            t.equal(b.doc_count,2708)
            return null
        })
        .catch( e =>{
            console.log('caught error',e)
            t.fail()
        })
        .then(()=>{
            return t.end()
        })
}

function approx(a,b,delta){
    return Math.abs(a - b) <= delta
}

function hasmin(t){
    var url = 'http://'+ config.couchdb.host+':'+config.couchdb.port
    var db = config.couchdb.imputeddb + '%2fd12%2f2012'
    var cdb =url + '/' + db
    var doc = "1205668-2012-09-06 14:00:00"
    return superagent.get(cdb+'/'+doc)
        .type('json')
        .then(r=>{
            t.ok(r.body)
            const b = r.body
            t.same(Object.keys(b).sort(),['_id','_rev','ts','lanes','detector_id','data'].sort())
            t.equal(b.ts,"2012-09-06 14:00:00")
            t.equal(b.lanes,4)
            t.equal(b.data.length,14)
            t.ok(approx(b.data[svo.n],3153.9785962235,0.000001))
	    t.ok(approx(b.data[svo.o],0.0848356591,0.000001))
            t.ok(approx(b.data[svo.wgt_spd_all_veh_speed],65.6615481851,0.000001))
            t.ok(approx(b.data[svo.count_all_veh_speed],3059.0311392817,0.000001))
            t.ok(approx(b.data[svo.not_heavyheavy],89.3919895599,0.000001))
            t.ok(approx(b.data[svo.heavyheavy],90.6037589141,0.000001))
            t.ok(approx(b.data[svo.hh_weight],38.2962816872,0.000001))
            t.ok(approx(b.data[svo.hh_axles],4.4948021844,0.000001))
            t.ok(approx(b.data[svo.hh_speed],49.1686765558,0.000001))
            t.ok(approx(b.data[svo.nh_weight],11.53163557,0.000001))
            t.ok(approx(b.data[svo.nh_axles],1.3696953295,0.000001))
            t.ok(approx(b.data[svo.nh_speed],65.0317028776,0.000001))
            return t.end()
        })
}

// source rows
// 1036.52447762784,0.0933265301337552,61566.8296251436,816.643036591961,"l1",NA,NA,NA,NA,NA,NA,NA,NA
// 1012.30872273161,0.10269834843983,62910.8245305018,876.955172448076,"r3",NA,NA,NA,NA,NA,NA,NA,NA
// 650.910129695934,0.0836900835407967,44501.3021851995,760.394670365881,"r2",45.7878164464907,57.5694356360226,2159.57247760396,234.924940896369,2838.13003051877,631.857873986294,64.420243790849,3324.9703809053
// 454.235266168078,0.0596276742847961,31881.7642107694,605.038259875728,"r1",43.6041731133655,33.0343232780937,1310.21459569365,172.321032582005,1616.73688626549,398.977972496108,58.0195468036579,2488.3429237916



function hasmax(t){
    var url = 'http://'+ config.couchdb.host+':'+config.couchdb.port
    var db = config.couchdb.imputeddb + '%2fd12%2f2012'
    var cdb =url + '/' + db
    var doc = "1205668-2012-12-28 09:00:00"
    return superagent.get(cdb+'/'+doc)
        .type('json')
        .then(r=>{
            t.ok(r.body)
            const b = r.body
            t.same(Object.keys(b).sort(),['_id','_rev','ts','lanes','detector_id','data'].sort())
            t.equal(b.ts,"2012-12-28 09:00:00")
            t.equal(b.lanes,4)
            t.equal(b.data.length,14)
            t.ok(approx(b.data[svo.n],1286.0745603789,0.000001))
	    t.ok(approx(b.data[svo.o],0.0860591722,0.000001))
            t.ok(approx(b.data[svo.wgt_spd_all_veh_speed],50.5282921217,0.000001))
            t.ok(approx(b.data[svo.count_all_veh_speed],1410.7302312415,0.000001))
            t.ok(approx(b.data[svo.not_heavyheavy],57.2819450153,0.000001))
            t.ok(approx(b.data[svo.heavyheavy],59.4976573709,0.000001))
            t.ok(approx(b.data[svo.hh_weight],29.6915981966,0.000001))
            t.ok(approx(b.data[svo.hh_axles],4.3542728187,0.000001))
            t.ok(approx(b.data[svo.hh_speed],55.0519569329,0.000001))
            t.ok(approx(b.data[svo.nh_weight],9.4554787921,0.000001))
            t.ok(approx(b.data[svo.nh_axles],1.7096261934,0.000001))
            t.ok(approx(b.data[svo.nh_speed],42.2881596677,0.000001))
            return t.end()
        })
    return null
}
