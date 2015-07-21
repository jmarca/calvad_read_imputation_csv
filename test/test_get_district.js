var get_district = require('../lib/get_district.js')
var should = require('should')
describe ('get district',function(){
    it('should parse vds filenames',function(){
        var result = get_district('./files/vds_id.1205668.truck.imputed.2012.csv')
        result.should.eql(12)
        return null
    })
    it('should parse vds filenames',function(){
        var result = get_district('vds_id.1205668.truck.imputed.2012.csv')
        result.should.eql(12)
        return null
    })
    it('should parse vds filenames',function(){
        var result = get_district('./files/wim.114.W.truck.imputed.2012.csv')
        result.should.eql('wim')
        return null
    })
    it('should parse vds filenames',function(){
        var result = get_district('wim.114.W.truck.imputed.2012.csv')
        result.should.eql('wim')
        return null
    })
})
