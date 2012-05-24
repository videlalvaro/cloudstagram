var fs = require('fs')
, thumper = require('./thumper')
, user_images = require('../lib/user_images.js')
;

var resize_consumer = {
    exchange: 'cloudstagram-upload',
    queue: 'resize_queue',
    routingKey: '',
    callback: function(msg, headers, deliveryInfo) {
        var uploadDir = __dirname + "/../public/uploads";
        im.resize({
            srcPath: uploadDir + "/" + msg.filename,
            dstPath: uploadDir + "/small_" + msg.filename,
            width:   256,
            heigth: 256
        }, function(err, stdout, stderr){
            if (err) {
                console.log(err, stdout, stderr);
            } else {
                console.log("resized image");
                thumper.publishMessage('cloudstagram-new-image', msg, '');   
            }
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
            if(!error) {
                thumper.publishMessage('cloudstagram-image-propagated', msg, '');
            }
        });
    }
};

exports.startConsumers = function() {
    thumper.startConsumers([
        add_image_to_user_consumer, 
        new_image_consumer,
        image_to_followers_consumer,
    ]);  
};