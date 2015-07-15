var read_file = require('./lib/read_file.js')
var collapse_accumulator = require('./lib/collapse_accumulator.js')

module.exports.read_file = read_file
module.exports.collapse_accumulator = collapse_accumulator

/**
 * read_and_process
 *
 * Read a CSV file, populate an object with the contenst, and then
 * condense the accumulator so that it can be stashed in CouchDB
 *
 * @param {string} file the full filename to read in
 * @param {read_process_callback} cb a function after the file is done.
 * will be passed an error (or null), and the collapsed accumulator as
 * the second argument.
 * @returns {null}  just the callback thanks, after it is done
 */
function read_and_process(file,cb){
    var accumulator = {}
    read_file(file
              ,accumulator
              ,function(e,r){
                  if(e) return cb(e)
                  var collapsed = collapse_accumulator(accumulator)
                  return cb(null,collapsed)

              })
    return null
}
/**
 * read_process_callback
 * @callback read_process_callback
 * @param {?Object} error hopefully null
 * @param {Object} records the filled-up and then collapsed
 * accumulator object after reading the CSV file and collapsing the
 * lanes so that you just have one entry per timestamp (in other
 * words, sum up the various volumes, average the occupancy, etc)
 */



/**
 * read_and_minmax_ts
 *
 * Read a CSV file, extract the min and max timestamps
 *
 * @param {string} file the full filename to read in
 * @param {read_process_callback} cb a function after the file is done.
 * will be passed an error (or null), and the collapsed accumulator as
 * the second argument.
 * @returns {null}  just the callback thanks, after it is done
 */
function read_and_minmax_ts(file,cb){
    var accumulator = {}
    read_file(file
              ,accumulator
              ,function(e,r){
                  if(e) return cb(e)
                  var times = Object.keys(accumulator)
                  var min = times[0]
                  var max = times[0]
                  times.forEach(function(t,i){
                      min = min < t ? min : t
                      max = max < t ? t : max
                      return null
                  })

                  return cb(null,{'mints':min,'maxts':max})

              })
    return null

}


module.exports.read_and_process = read_and_process
module.exports.read_and_minmax_ts = read_and_minmax_ts
