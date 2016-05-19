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
    config_file = path.normalize(rootdir+'/'+argv.config)
}
console.log('setting configuration file to ',config_file,'.  Change with the --config option.')


var config_okay = require('config_okay')


var queue = require('queue-async')
var num_CPUs = require('os').cpus().length;
num_CPUs -= 1 // leave slack for couchdb to work

var mainQ = queue(1)
var fileQ = queue(1)
var processQ = queue(num_CPUs)

var forker = require('./lib/forker.js')

function control_loop(handler){

    mainQ.defer(config_okay,config_file)
    mainQ.await(function(e,config){
        var csv_path

        if(argv.path !== undefined){
            csv_path = argv.path
        }else{
            if(config.csv_path !== undefined){
                csv_path = config.csv_path
            }
        }
        if(!csv_path){
            console.log('pass CSV path using --path argument')
            return null
        }else{
            if(!path.isAbsolute(csv_path)){
                path.normalize(rootdir+'/'+csv_path)
            }
            console.log('setting csv path to '+csv_path)

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
        var pattern = '*truck.imputed.'+year+'.csv'
        fileQ.defer(glob,pattern,{cwd:csv_path,dot:true})
        fileQ.await(function(e,list){
            console.log('got ',list.length,' CSV files')
            // debugging, just do 10
            // list = list.slice(590,600)
            // list = [list[600],list[601]]
            list.forEach(function(f,idx){
                // resume at 600
                // if (idx < 600) return null
                f = csv_path + '/' + f
                //console.log(f)
                processQ.defer(forker,handler,config,f,year,idx)
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
