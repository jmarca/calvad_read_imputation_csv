var argv = require('minimist')(process.argv.slice(2))

var config = JSON.parse(process.env.CONFIGPARAMS)
if(!config){
    throw new Error('failed to pass config params')
}

var file = argv.file
if(file === undefined){
    throw new Error('use --file to pass CSV file')
}

var year = argv.year
if(year === undefined){
    throw new Error('use --year to pass year')
}



var handle_file = require('./handle_store_file.js')

handle_file(file,config,year,function(e,r){
    if(e) throw new Error(e)
    return null
})
