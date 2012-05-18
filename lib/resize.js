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
        console.log("add_image_to_user_consumer got message:", msg);
        user_images.addImageToUser(msg.userid, msg);
    }
};

var new_image_consumer = {
    exchange: 'cloudstagram-new-image',
    routingKey: '',
    callback: function(msg, headers, deliveryInfo) {
        console.log("new_image_consumer got message:", msg);
        user_images.addLatestImage(msg.userid, msg);
    }
};

var image_to_followers_consumer = {
    exchange: 'cloudstagram-new-image',
    routingKey: '',
    callback: function(msg, headers, deliveryInfo) {
        console.log("image_to_followers_consumer got message:", msg);
        user_images.addImageToFollowers(msg.userid, msg, function(error, data) {
            if(!error) {
                thumper.publishMessage('cloudstagram-image-propagated', msg, '');
            }
        });
    }
};

/**
 * TODO broadcast changes via sock.js.  
 * New images are broadcast to the user that uploaded and to its followers
 * broadcast is done after the images has ben stored into redis by image_to_followers_consumer consumer.
 */


exports.startConsumers = function() {
    thumper.startConsumers([
        resize_consumer, 
        add_image_to_user_consumer, 
        new_image_consumer,
        image_to_followers_consumer
    ]);  
};