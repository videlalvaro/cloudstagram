var im = require('imagemagick')
, thumper = require('./thumper')
;

var resize_consumer = {
    exchange: 'cloudstagram-upload',
    routingKey: '',
    callback: function(msg, headers, deliveryInfo) {
        console.log("got message:", msg.userid, msg.filename);
    }
};

exports.startConsumers = function() {
    thumper.startConsumers([resize_consumer]);  
};