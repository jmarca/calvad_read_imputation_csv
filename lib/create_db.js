const superagent = require('superagent')


function create_db(config,db,cb){
    const url ='http://'
            +config.couchdb.host+':'
            +config.couchdb.port + '/'
          +db
    if(cb !== undefined){
        // callback version
        superagent.put(url)
            .type('json')
            .auth(config.couchdb.auth.username
                  ,config.couchdb.auth.password)
            .then(r =>{
                return cb(null,r.body)
            })
            .catch( e =>{
                //console.log('caught error in creation')
                return cb(null,e.response.body)
            })
    }else{
        // promise version
        return superagent.put(url)
            .type('json')
            .auth(config.couchdb.auth.username
                  ,config.couchdb.auth.password)
    }
    return null
}
module.exports=create_db
