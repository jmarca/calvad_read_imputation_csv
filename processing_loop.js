var argv = require('minimist')(process.argv.slice(2))
var path = require('path')
var glob = require('glob')
// configuration stuff
var rootdir = path.normalize(__dirname)

// where are the files

var config_file
if(argv.config === undefined){
    config_file = path.normalize(rootdir+'/../config.json')
}else{
    config_file = argv.config
}
console.log('setting configuration file to ',config_file,'.  Change with the -config option.')


var config_okay = require('config_okay')


var queue = require('queue-async')
var num_CPUs = require('os').cpus().length;
num_CPUs = 2 // probably not much better than this because I'm reading files

var mainQ = queue(1)
var fileQ = queue(1)
var processQ = queue(num_CPUs)



function control_loop(handle_file){

    mainQ.defer(config_okay,config_file)
    mainQ.await(function(e,config){

        var csv_path

        if(argv.csv_path !== undefined){
            csv_path = argv.csv_path
        }else{
            if(config.csv_path !== undefined){
                csv_path = config.csv_path
            }
        }
        if(!csv_path){
            console.log('pass CSV path using -path argument')
            return null
        }
        var year
        if(argv.year !== undefined){
            year = argv.year
        }else{
            if(config.year !== undefined){
                year = config.year
            }
        }
        if(!year){
            console.log('pass year in using the -year argument')
            return null
        }

        // have path, read it, process all the files
        var pattern = new RegExp('.*truck.imputed.'+year+'.csv')
        fileQ.defer(glob,pattern,{cwd:csv_path,dot:true})
        fileQ.await(function(e,list){
            list.forEach(function(f){
                processQ.defer(handle_file,f,config,year)
                return null
            })
        })
        processQ.await(function(ee,rr){
            console.log('queue drained for all files')
            return null
        })
        return null
    })

}

module.exports = control_loop
