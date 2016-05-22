var cp = require('child_process')
var fs = require('fs')

var id_pattern = /^(.*)\.truck/;
var path = require('path')

function forker(processor,config,csvfile,year,idx,done){
    // var basename = path.basename(csvfile)
    // var pattern_result = id_pattern.exec(basename)
    // var logfilename = pattern_result[1]
    console.log(csvfile,idx)
    var opts = { cwd: undefined,
                 env: process.env
               }
    opts.env.CONFIGPARAMS=JSON.stringify(config)
    if(opts.env.FREEWAY_TRUNCATE === undefined){
        opts.env.FREEWAY_TRUNCATE=15
    }
    var n = cp.fork(processor,
                    ["--file",csvfile,
                     "--year",year]
                    )

    n.on('exit',function(code){
        console.log(['got exit: ',code, 'for',csvfile].join(' '))
        // debug
        // throw new Error('croak while testing')
        return done()
    })

}

module.exports=forker
