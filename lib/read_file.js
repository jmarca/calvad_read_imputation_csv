var _ = require('lodash')


var parse = require('csv-parse')
var fs = require('fs')
var datacols = require('./constants.js').datacols

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


module.exports = read_file
