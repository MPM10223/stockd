
/*
 * GET home page.
 */
var mongo = require('mongojs');

exports.show = function(req, res){
    var id = req.param('id');
    
    var db = mongo.connect('stokd', ['sizeNotificationRequests']);
    db.sizeNotificationRequests.findOne({_id: mongo.ObjectId(id)}, function(err, snr) {
        if(err||!snr) {
            console.log('cannot find it...');
            res.render('confirm', { id: null });
        } else {
            res.render('confirm', { id: id, productURL: snr.productURL }); 
        }
    });
}