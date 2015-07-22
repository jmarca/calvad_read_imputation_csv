var request = require('request')

var headers = {
    'content-type': 'application/json',
    'accept': 'application/json'
};

function create_db(config,db,cb){
    var url ='http://'
            +config.couchdb.host+':'
            +config.couchdb.port + '/'
            +db
    request.put(url,{
        'json':true,
        'content-type': 'application/json',
        'accept': 'application/json',
        'headers':headers,
        'auth':{'user':config.couchdb.auth.username,
              'pass':config.couchdb.auth.password}
    },
                function(e,r,b){
                    return cb(e,b)
                })
    return null
}
module.exports=create_db
