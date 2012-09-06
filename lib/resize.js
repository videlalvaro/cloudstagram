var fs = require('fs')
, im = require('imagemagick')
, image_storage = require('./image_storage.js')
, thumper = require('./thumper')
, user_images = require('../lib/user_images.js')
;

var resize_consumer = {
    exchange: 'cloudstagram-upload',
    queue: 'resize_queue',
    routingKey: '',
    callback: function(msg, headers, deliveryInfo) {
        console.log("__dirname", __dirname);
        filename = "small_" + msg.filename;
        tmpPath = __dirname + "/../tmp/" + filename;
        image_storage.readGsFile(msg.filename, function(error, gsData) {
            console.log('resize_consumer readGsFile');
            im.resize({
                srcData: gsData.binary,
                dstPath: tmpPath,
                width:   225
            }, function(err, stdout, stderr){
                console.log('storing file');
                console.log(Object.keys(gsData.gsObject));
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
    queue: 'add_image_to_user_queue',
    routingKey: '',
    callback: function(msg, headers, deliveryInfo) {
        user_images.addImageToUser(msg.userid, msg, function (error, data) {
            if (!error) {
                thumper.publishPubSubMessage('cloudstagram-broadcast-newimage', msg, '');
            }
        });
    }
};

var new_image_consumer = {
    exchange: 'cloudstagram-new-image',
    queue: 'new_image_queue',
    routingKey: '',
    callback: function(msg, headers, deliveryInfo) {
        user_images.addLatestImage(msg.userid, msg);
    }
};

var image_to_followers_consumer = {
    exchange: 'cloudstagram-new-image',
    queue: 'image_to_followers_queue',
    routingKey: '',
    callback: function(msg, headers, deliveryInfo) {
        user_images.addImageToFollowers(msg.userid, msg, function(error, data) {
        });
    }
};

exports.startConsumers = function() {
    thumper.startConsumers([
  //      resize_consumer,
        add_image_to_user_consumer, 
        new_image_consumer,
        image_to_followers_consumer,
    ]);  
};