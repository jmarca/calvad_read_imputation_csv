const superagent = require('superagent')

function delete_tempdb(config){
    var cdb =
        config.couchdb.host+':'+config.couchdb.port
             + '/'+ config.couchdb.db
    return superagent.del(cdb)
        .type('json')
        .auth(config.couchdb.auth.username
              ,config.couchdb.auth.password)
}

function promise_wrapper(fn,arg1,arg2){
    return new Promise((resolve, reject)=>{
        fn(arg1,arg2,function(e,r){
            if(e){
                console.log(e)
                return reject(e)
            }else{
                return resolve(r)
            }
        })
    })
}

exports.delete_tempdb = delete_tempdb
exports.promise_wrapper = promise_wrapper
