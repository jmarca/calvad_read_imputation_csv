const tap = require('tap')

const path    = require('path')
const rootdir = path.normalize(__dirname)

const input_csv = rootdir+'/files/vds_id.1205668.truck.imputed.2012.csv'
const config_okay = require('config_okay')
const  _ = require('lodash')

const utils = require('./utils.js')

const read_file = require('../lib/read_file.js')
const collapse_accumulator = require('../lib/collapse_accumulator.js')
const read_and_process = require('../.').read_and_process

async function test(){
    await tap.test('read csv file',{'timeout':100000}, (t) => {
        //t.plan(186856)
        let accum = {}
        utils.promise_wrapper(read_file
                        ,input_csv
                        ,accum)
            .then( r => {
                t.ok(accum)
                t.equals(Object.keys(accum).length,2708)

                const ts_pattern = /^\d\d\d\d-\d\d-\d\d \d\d:\d\d:\d\d$/
                _.each(accum,function(v,k){
                          // timestamp
                    t.match(k,ts_pattern)
                    t.type(v,'object')
                    t.same(Object.keys(v).sort(),['l1','r1','r2','r3'])
                    _.each(v,function(vv,kk){
                        // lane
                        // already tested that lanes (kk) matched expected outcome above
                        t.type(vv,'object')
                        t.same(Object.keys(vv).sort(),
                               [
                                   'count_all_veh_speed',
                                   'detector_id',
                                   'heavyheavy',
                                   'hh_axles',
                                   'hh_speed',
                                   'hh_weight',
                                   'id',
                                   'imputations',
                                   'n',
                                   'nh_axles',
                                   'nh_speed',
                                   'nh_weight',
                                   'not_heavyheavy',
                                   'o',
                                   'wgt_spd_all_veh_speed'
                               ]
                              );

                        (['n',
                          'o',
                          'wgt_spd_all_veh_speed',
                          'count_all_veh_speed',
                          'not_heavyheavy',
                          'heavyheavy',
                          'hh_weight',
                          'hh_axles',
                          'hh_speed',
                          'nh_weight',
                          'nh_axles',
                          'nh_speed']).forEach(function(datum){
                              t.type(vv[datum],'number')
                          })
                    })
                })
                const collapsed = collapse_accumulator(accum)
                t.type(collapsed,'object')

                t.same(Object.keys(collapsed),Object.keys(accum))
                _.each(collapsed,function(v,k){
                    t.type(v,'object')
                    t.same(Object.keys(v),['ts'
                                           ,'lanes'
                                           ,'detector_id'
                                           ,'_id'
                                           ,'data'])
                    t.same(v.ts,k)
                    t.equal(v.lanes,4)
                    t.equal(v.detector_id,'1205668')
                    t.equal(v._id,'1205668-'+v.ts)
                    t.type(v.data,Array)
                    t.equal(v.data.length,14)
                    t.equal(v.data[0],1)
                    t.equal(v.data[1],v.lanes)
                })
            })
            .catch( e => {
                console.log('error',e)
                t.fail()
            })
            .then(()=>{
                t.end()
            })
    })

    await tap.test('read and process all at once',t =>{
        utils.promise_wrapper(read_and_process,
                              './test/files/vds_id.1205668.truck.imputed.2012.csv')
            .then(r=>{
                t.ok(r)
                t.equals(Object.keys(r).length,2708)

                const ts_pattern = /^\d\d\d\d-\d\d-\d\d \d\d:\d\d:\d\d$/
                _.each(r,function(v,k){
                    // timestamp
                    t.match(k,ts_pattern)
                    t.type(v,Object)
                    t.same(Object.keys(v).sort(),
                           [
                               '_id'
                               ,'data'
                               ,'detector_id'
                               ,'lanes'
                               ,'ts'
                           ])
                    t.same(v.ts,k)
                    t.equal(v.lanes,4)
                    t.equal(v.detector_id,'1205668')
                    t.equal(v._id,'1205668-'+v.ts)
                    t.type(v.data,Array)
                    t.equal(v.data.length,14)
                    t.equal(v.data[0],1)
                    t.equal(v.data[1],v.lanes)
                })
            })
            .catch( e => {
                console.log('error',e)
                t.fail()
            })
            .then(()=>{
                t.end()
            })

    })


}
test()
