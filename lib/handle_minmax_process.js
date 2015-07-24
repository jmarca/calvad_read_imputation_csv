var argv = require('minimist')(process.argv.slice(2))


var config_file = argv.config
if(config_file === undefined){
    throw new Error('use --config to pass config file')
}

var file = argv.file
if(file === undefined){
    throw new Error('use --file to pass CSV file')
}

var year = argv.year
if(year === undefined){
    throw new Error('use --year to pass year')
}

var config_okay = require('config_okay')


var queue = require('queue-async')

var handle_file = require('./lib/handle_minmax.js')

var q = queue(1)

q.defer(config_okay,config_file)
q.await(function(e,config){
    console.log('starting '+file)

    handle_file(file,config,year,function(e,r){
        if(e) throw new Error(e)
        console.log('finished '+file)
        return null
    })
})
