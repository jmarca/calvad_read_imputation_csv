const tap = require('tap')
const get_district = require('../lib/get_district.js')
const utils = require('./utils.js')

tap.test('get district', async (t)=>{
    t.test('should parse 2 digit districts from  vds filenames',async (tt)=>{
        utils.promise_wrapper(get_district,'./files/vds_id.1205668.truck.imputed.2012.csv')
            .then(result=>{
                tt.equal(result,'d12')
                return null
            })
    })
    t.test('should parse 2 digit districts from vds filenames',async (tt)=>{
        utils.promise_wrapper(get_district,'vds_id.1205668.truck.imputed.2012.csv')
            .then(result=>{
                tt.equal(result,'d12')
                return null
            })
    })
    t.test('should parse one digit vds filenames',async (tt)=>{
        utils.promise_wrapper(get_district,'./files/vds_id.305668.truck.imputed.2012.csv')
            .then(result=>{
                tt.equal(result,'d03')
                return null
            })
    })
    t.test('should parse wim filenames',async (tt)=>{
        utils.promise_wrapper(get_district,'./files/wim.114.W.truck.imputed.2012.csv')
            .then(result=>{
                tt.equal(result,'wim')
                return null
            })
    })
    t.test('should parse wim filenames',async (tt)=>{
        utils.promise_wrapper(get_district,'wim.114.W.truck.imputed.2012.csv')
            .then(result=>{
                tt.equal(result,'wim')
                return null
            })
    })

})
