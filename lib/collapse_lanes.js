var store_variable_order = require('./constants.js').store_variable_order
var _ = require('lodash')

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
    sums[store_variable_order.o] /= lanes.length;

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
module.exports=collapse_lanes
