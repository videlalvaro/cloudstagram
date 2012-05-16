var im = require('imagemagick')
, fs = require('fs')
, image_storage = require('./image_storage')
, thumper = require('./thumper')
, user_images = require('../lib/user_images.js')
;

var resize_consumer = {
    exchange: 'cloudstagram-upload',
    routingKey: '',
    callback: function(msg, headers, deliveryInfo) {
        console.log("got message:", msg.userid, msg.filename);
        filename = "small_" + msg.filename;
        tmpPath = "/tmp/" + filename;
        image_storage.readGsFile(msg.filename, function(error, gsData) {
            im.resize({
                srcData: gsData.binary,
                dstPath: tmpPath,
                width:   256
            }, function(err, stdout, stderr){
                image_storage.storeFile(tmpPath, filename, gsData.gsObject.contentType, function(error, data) {
                    console.log("deleting temporary file: ", tmpPath);
                    fs.unlink(tmpPath);
                    thumper.publishMessage('cloudstagram-new-image', msg, '');
                });
            });
        });
    }
};

var add_image_to_user_consumer = {
    exchange: 'cloudstagram-new-image',
    routingKey: '',
    callback: function(msg, headers, deliveryInfo) {
        console.log("add_image_to_user_consumer got message:", msg.userid, msg.filename);
        user_images.addImageToUser(msg.userid, msg.filename);
    }
};

var new_image_consumer = {
    exchange: 'cloudstagram-new-image',
    routingKey: '',
    callback: function(msg, headers, deliveryInfo) {
        console.log("new_image_consumer got message:", msg.userid, msg.filename);
        user_images.addLatestImage(msg.userid, msg.filename);
    }
};

exports.startConsumers = function() {
    thumper.startConsumers([
        resize_consumer, 
        add_image_to_user_consumer, 
        new_image_consumer
    ]);  
};