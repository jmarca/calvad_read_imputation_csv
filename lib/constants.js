// from the perl code, how to parse CSV files
var csv_variables = "tod day ts vds_id lane heavyheavy hh_weight hh_axles hh_speed nh_weight nh_axles nh_speed wgt_spd_all_veh_speed count_all_veh_speed not_heavyheavy n o".split(' ');

// VDS sites have vds_id, WIM sites have site_dir
var repeatedcols_N   = 'tod day vds_id site_dir lane'.split(' ')
var repeatedcols_C   = ['ts']
var repeatedcols = repeatedcols_C.concat(repeatedcols_N)

var datacols = csv_variables.filter(function(v){
    return repeatedcols.indexOf(v) === -1
})

// have to hard code this.  Different from the one in globals.js because here I have 'nh' not 'nhh'
var store_variable_order = {'count':0
                            ,'imputations':1
                            ,'n':2
                            ,'o':3
                            ,'heavyheavy':4
                            ,'hh_speed'  :5
                            ,'hh_weight' :6
                            ,'hh_axles':7
                            ,'not_heavyheavy':8
                            ,'nh_speed':9
                            ,'nh_weight':10
                            ,'nh_axles':11
                            ,'wgt_spd_all_veh_speed':12
                            ,'count_all_veh_speed':13};

module.exports.store_variable_order = store_variable_order
module.exports.datacols = datacols
module.exports.csv_variables = csv_variables
