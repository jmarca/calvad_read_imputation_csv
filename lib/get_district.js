var path = require('path')
var vds_regex = /^vds_id\.(1?\d{1})/;
var wim_regex = /^wim/;

function pad(n){return n<10 ? '0'+n : n}

function get_district (filename){
    var basename = path.basename(filename)
    if(wim_regex.test(basename)){
        return 'wim'
    }

    var result = vds_regex.exec(basename)
    if(result){
        var district = +result[1]
        return 'd'+pad(district)
    }
    return null
}
module.exports=get_district
