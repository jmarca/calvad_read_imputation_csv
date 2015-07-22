var should = require('should')
var _ = require('lodash')

var read_file = require('../lib/read_file.js')
var collapse_accumulator = require('../lib/collapse_accumulator.js')
var read_and_process = require('../.').read_and_process

describe('read csv',function(){
    it('should read a file',function(done){
        var accum = {}
        read_file('./test/files/vds_id.1205668.truck.imputed.2012.csv'
                  ,accum
                  ,function(e,r){

                      should.exist(accum)
                      Object.keys(accum).should.have.lengthOf(2708)

                      var ts_pattern = /^\d\d\d\d-\d\d-\d\d \d\d:\d\d:\d\d$/
                      _.each(accum,function(v,k){
                          // timestamp
                          k.should.match(ts_pattern)
                          v.should.be.an.instanceOf(Object)
                          v.should.have.keys('l1','r1','r2','r3')
                          _.each(v,function(vv,kk){
                              // lane
                              // already tested that lanes (kk) matched expected outcome above
                              vv.should.be.an.instanceOf(Object)
                              vv.should.have.keys(
                                  'imputations',
                                  'detector_id',
                                  'id',
                                  'n',
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
                                  'nh_speed'
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
                                    (vv[datum]).should.have.type('number')
                                })
                          })
                      })
                      var collapsed = collapse_accumulator(accum)
                      collapsed.should.be.instanceOf(Object)

                      Object.keys(collapsed).should.eql(Object.keys(accum))
                      _.each(collapsed,function(v,k){
                          v.should.be.an.instanceOf(Object)
                          v.should.have.keys('ts'
                                             ,'lanes'
                                             ,'detector_id'
                                             ,'_id'
                                             ,'data')
                          v.ts.should.eql(k)
                          v.lanes.should.eql(4)
                          v.detector_id.should.eql('1205668')
                          v._id.should.eql('1205668-'+v.ts)
                          v.data.should.be.instanceOf(Array)
                          v.data.should.have.lengthOf(14)
                          v.data[0].should.eql(1)
                          v.data[1].should.eql(v.lanes)
                      })
                      return done()
                  })
        return null
    })

})

describe('read and process all at once',function(){
    it('should work',function(done){
        read_and_process('./test/files/vds_id.1205668.truck.imputed.2012.csv'
                         ,function(e,r){
                             should.not.exist(e)
                             should.exist(r)
                             Object.keys(r).should.have.lengthOf(2708)

                             var ts_pattern = /^\d\d\d\d-\d\d-\d\d \d\d:\d\d:\d\d$/
                                 _.each(r,function(v,k){
                                     // timestamp
                                     k.should.match(ts_pattern)
                                     v.should.be.an.instanceOf(Object)
                                     v.should.have.keys('ts'
                                                        ,'lanes'
                                                        ,'detector_id'
                                                        ,'_id'
                                                        ,'data')
                                     v.ts.should.eql(k)
                                     v.lanes.should.eql(4)
                                     v.detector_id.should.eql('1205668')
                                     v._id.should.eql('1205668-'+v.ts)
                                     v.data.should.be.instanceOf(Array)
                                     v.data.should.have.lengthOf(14)
                                     v.data[0].should.eql(1)
                                     v.data[1].should.eql(v.lanes)
                                 })
                             return done()
                         })
        return null
    })

})
