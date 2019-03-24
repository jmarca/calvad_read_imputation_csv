const tap = require('tap')

const path    = require('path')
const rootdir = path.normalize(__dirname)

const config_file = rootdir+'/../test.config.json'
const config_okay = require('config_okay')
const  _ = require('lodash')

const utils = require('./utils.js')
const create_db =  require('../lib/create_db.js')


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
        await tap.test('should fail with error statement on duplicate db', t =>{
            utils.promise_wrapper(create_db,
                                  config,
                                  db)
                .then( r =>{
                    t.ok(r)
                    t.ok(r.error)
                    return t.end()
                })
                .catch( e => {
                    console.log('error',e)
                    t.fail()
                })
        })

        tap.end()
        config.couchdb.db = db
        await utils.delete_tempdb(config)
            .catch( e => {
                console.log('error deleting',e)
            })
        return null
    })
