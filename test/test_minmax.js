const tap = require('tap')
const get_district = require('../lib/get_district.js')
const utils = require('./utils.js')

const _ = require('lodash')

const min_max_handler = require('../lib/handle_minmax.js')
const create_db =  require('../lib/create_db.js')

// just get the file name, pass to min_max_hanler for testing


const headers = {
    'content-type': 'application/json',
    'accept': 'application/json'
};



const path    = require('path')
const rootdir = path.normalize(__dirname)

const config_file = rootdir+'/../test.config.json'
const config_okay = require('config_okay')

const check = require('couch_check_state')


config_okay(config_file)
    .then( async (config) => {


        const  date = new Date()
        const db = ['a%2ftest%2fdb%2f',
                    date.getHours(),
                    date.getMinutes(),
                    date.getSeconds(),
                    date.getMilliseconds()].join('-')

        await tap.test('should create a db', t => {
            utils.promise_wrapper(create_db,
                                  config,
                                  db)
                .then( r =>{
                    t.ok(r)
                    t.notOk(r.error)
                    return t.end()
                })
                .catch( e => {
                    console.log('error',e)
                    t.fail()
                })
        })
        config.couchdb.trackingdb = db

        await tap.test('read csv file for min max', t =>{
            const accum = {}
            utils.promise_wrapper(
                min_max_handler,
                './test/files/vds_id.1205668.truck.imputed.2012.csv'
                ,config
                ,2012)
                .then( async ()=>{
                    var taskmin =
                        _.assign({}
                                 ,config.couchdb
                                 ,{'doc':'1205668'
                                   ,'year':2012
                                   ,'state':'mints'
                                   ,'db':config.couchdb.trackingdb
                                  })
                    var taskmax =
                        _.assign({}
                                 ,config.couchdb
                                 ,{'doc':'1205668'
                                   ,'year':2012
                                   ,'state':'maxts'
                                   ,'db':config.couchdb.trackingdb
                                  })
                    await utils.promise_wrapper(check,taskmin)
                        .then( r =>{
                            t.equal(r,'2012-09-06 14:00:00')
                        })

                    await utils.promise_wrapper(check,taskmax)
                        .then( r =>{
                            t.equal(r,'2012-12-28 09:00:00')
                        })

                })
                .then(()=>{
                    t.end()
                })
                .catch( e => {
                    console.log('error',e)
                    t.fail()
                })

        })

        config.couchdb.db = db
        tap.end()
        await utils.delete_tempdb(config)
            .catch( e => {
                console.log('error deleting',e)
            })
        return null
})
