var should = require('should')
var _ = require('lodash')

// from the perl code, how to parse CSV files
var csv_variables = "tod day ts vds_id lane heavyheavy hh_weight hh_axles hh_speed nh_weight nh_axles nh_speed wgt_spd_all_veh_speed count_all_veh_speed not_heavyheavy n o".split(' ');

// VDS sites have vds_id, WIM sites have site_dir
var repeatedcols_N   = 'tod day vds_id site_dir lane'.split(' ')
var repeatedcols_C   = ['ts']
var repeatedcols = repeatedcols_C.concat(repeatedcols_N)

var datacols = csv_variables.filter(function(v){
    return repeatedcols.indexOf(v) === -1
})

// have to hard code this.  Different from the one in globals.js because here I have 'nh' not 'nhh'
var store_variable_order = {'count':0
                            ,'imputations':1
                            ,'n':2
                            ,'o':3
                            ,'heavyheavy':4
                            ,'hh_speed'  :5
                            ,'hh_weight' :6
                            ,'hh_axles':7
                            ,'not_heavyheavy':8
                            ,'nhh_speed':9
                            ,'nhh_weight':10
                            ,'nhh_axles':11
                            ,'wgt_spd_all_veh_speed':12
                            ,'count_all_veh_speed':13};

var parse = require('csv-parse')
var fs = require('fs')

/**
 * row_parser
 *
 * make a parser for individual rows of CSV data
 * @param {Object} accum where to put the data.  An empty object would be nice
 * @returns {Function} returns a parsing function that will fill up
 * the accum object with data.  This function takes a row at a time.
 */
function row_parser(accum){

    /**
     * _parser
     *
     * parse a single row, add what it contains to the accum object
     * @param {Object} row  typically the object returned from csv-parse
     * @returns {Object}  returns the reference to accum
     */
    function _parser(row){
        // for example:
        // { ts: '2012-12-28 08:00:00',
        //    vds_id: '1205668',
        //    tod: '8',
        //    day: '5',
        //    n: '553',
        //    o: '0.05626',
        //    wgt_spd_all_veh_speed: '43658.2801915731',
        //    count_all_veh_speed: '669.628407469973',
        //    lane: 'r1',
        //    not_heavyheavy: '54.7711270529593',
        //    heavyheavy: '55.2556764401146',
        //    hh_weight: '2937.30662180933',
        //    hh_axles: '308.28970952241',
        //    hh_speed: '3736.6016515046',
        //    nh_weight: '961.38358490215',
        //    nh_axles: '126.355551643419',
        //    nh_speed: '3091.93010962903' },

        // refactor code from doDataQueryCDB.js to work with CSV rows


        var ts = row.ts
        if(ts===undefined){
            // no timestamp, no parse
            return null
        }
        var lane = row.lane
        if(lane===undefined){
            // no lane, no parse
            return null
        }

        var detector_id = row.vds_id || row.site_dir
        var is_wim =  /wim/.test(detector_id);
        var id = detector_id+'-'+ts
        if(accum[ts] === undefined){
            accum[ts]={}
        }

        if(accum[ts][lane] === undefined){
            accum[ts][lane]={
                'imputations':1,
                'detector_id':detector_id,
                'id':id
            }
            // copy this row directly in
            datacols.forEach(function(variable){
                if(row[variable] !== undefined){
                    accum[ts][lane][variable] = +row[variable]
                }
                return null
            })
            if(is_wim && ! row.n ){
                accum[ts][lane]['n'] = +row.count_all_veh_speed
            }

        }else{

            accum[ts][lane]['imputations'] += 1
            // add this row to what is there
            datacols.forEach(function(variable){
                if(row[variable] !== undefined){
                    accum[ts][lane][variable] += +row[variable]
                }
                return null
            })
        }
        // WIM sites bug.  for WIM sites, n (volume) and o (occupancy)
        // are not computed.  I can't do much about occ, but I can
        // insert count_all_veh_speed for volume
        if(is_wim && ! row.n ){
            accum[ts][lane]['n'] += row.count_all_veh_speed
        }

        return accum
    }
    return _parser
}

/**
 * read_file
 *
 * Read a CSV file, populate the passed accumulator object
 *
 * @param {string} file the full filename to read in
 * @param {Object} accumulator an object (empty) to fill with parsed data
 * @param {read_file_callback} cb a function after the file is done.
 * will be passed an error (or null), and the filled-up accumulator as
 * the second argument.
 * @returns {null}  just the callback thanks, after it is done
 */
function read_file(file,accumulator,cb){
    var rp = row_parser(accumulator)
    var parser = parse({delimiter: ',',
                        columns:true},
                       function(err, data){
                           //console.log(err)
                           data.forEach(function(record){
                               rp(record)
                           })
                           return cb()
                       })
    fs.createReadStream(file).pipe(parser);
    return null

}
/**
 * read_file_callback
 * @callback read_file_callback
 * @param {?Object} error hopefully null
 * @param {Object} accumulator the filled-up accumulator object after
 * reading the CSV file
 */


/**
 * collapse_accumulator
 *
 * collapse the accumulator to be one record per timestamp, properly
 * handling multiple imputations, if any
 *
 * @param {Object} accumulator
 * @returns {Object} the collapsed accumulator object, with one "row"
 * per timestamp.  The timestamps are the keys of the returned object
 * The individual records have a unique id for couchdb (concatenate
 * detector_id +'-'+ ts), so can be passed to bulkdocs or whatnot
 */
function collapse_accumulator(accumulator){

    // roll up an average every value over all of the imputations,
    // assuming there are multiple imputations

    var data = {}
    _.each(accumulator,function(v,ts){
        var sums
        var lanes = Object.keys(v)
        if(v[lanes[0]].imputations > 1){
            sums = collapse_lanes(impute_avg(v))
        }else{
            sums = collapse_lanes(v)
        }
        var CDB_record = {'ts':ts
                          ,'lanes':lanes.length
                          ,'detector_id':v[lanes[0]].detector_id
                          ,'id':v[lanes[0]].id
                          ,'data':sums
                         };
        data[ts] = CDB_record
    })
    return data
}

function impute_avg(record){
    // no op for now
    return record
}

/**
 * collapse_lanes
 *
 * collapse a record by lanes, so that you have one record across the
 * entire freeway location
 *
 * @param {} record
 * @returns {}
 */
function collapse_lanes(record){
    // I've got a record, a hash with lanes, each with data.
    // aggregate into a single row, and return
    var lanes = Object.keys(record)

    // initialize the collector
    var init = []
    for(var i =0,j=Object.keys(store_variable_order).length;i<j;i++) init[i]=0;
    var sums = lanes.reduce(function(memo,_lane,idx){
        _.each(store_variable_order,function(slot,varname){
            // just to be super safe, if _lane[varname] is falsy, don't add it
            if(record[_lane][varname]){
                memo[slot] += +record[_lane][varname]
            }
            return null
        })
        return memo
    },init)

    // compute means across lanes for occupancy
    sums[store_variable_order.o] /= lanes;

    // in the Amelia imputaiton process, speeds, etc are summed
    // everywhere, so right now I have total sum of speeds, sum of
    // axles, etc.  Otherwise the imputations crash.  so have to
    // divide out the counts of vehicles now

    // hh
    if(sums[store_variable_order.heavyheavy]){
        sums[store_variable_order.hh_axles] /=
            sums[store_variable_order.heavyheavy]
        sums[store_variable_order.hh_speed]   /=
            sums[store_variable_order.heavyheavy]
        sums[store_variable_order.hh_weight]  /=
            sums[store_variable_order.heavyheavy]
    }
    // nhh
    if(sums[store_variable_order.not_heavyheavy]){
        sums[store_variable_order.nh_axles] /=
            sums[store_variable_order.not_heavyheavy]
        sums[store_variable_order.nh_speed]   /=
            sums[store_variable_order.not_heavyheavy]
        sums[store_variable_order.nh_weight]  /=
            sums[store_variable_order.not_heavyheavy]
    }
    // all veh speeds from WIM reports
    if(sums[store_variable_order.count_all_veh_speed]){
        sums[store_variable_order.wgt_spd_all_veh_speed] /=
            sums[store_variable_order.count_all_veh_speed]
    }


    sums[0]=1

    return sums

}

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
                                             ,'id'
                                             ,'data')
                          v.ts.should.eql(k)
                          v.lanes.should.eql(4)
                          v.detector_id.should.eql('1205668')
                          v.id.should.eql('1205668-'+v.ts)
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
