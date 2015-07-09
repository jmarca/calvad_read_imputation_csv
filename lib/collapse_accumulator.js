var collapse_lanes = require('./collapse_lanes.js')
var impute_avg     = require('./impute_averager.js')
var _ = require('lodash')

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

module.exports = collapse_accumulator
