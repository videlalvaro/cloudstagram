var fs = require('fs')
, thumper = require('./thumper')
, user_images = require('../lib/user_images.js')
;

var broadcast;

// exports.Consumer = function(exchange, routingKey, other, callback) {

// };

var resize_consumer = {
    exchange: 'cloudstagram-upload',
    routingKey: '',
    callback: function(msg, headers, deliveryInfo) {
        console.log("got message:", msg.userid, msg.filename);
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
    routingKey: '',
    callback: function(msg, headers, deliveryInfo) {
        user_images.addImageToUser(msg.userid, msg, function (error, data) {
            if (!error) {
                var data = JSON.stringify(msg);
                broadcast.sendToUser(msg.userid, 'new_pic', data);
                broadcast.sendToAnon('new_pic', data);
            }
        });
    }
};

var new_image_consumer = {
    exchange: 'cloudstagram-new-image',
    routingKey: '',
    callback: function(msg, headers, deliveryInfo) {
        user_images.addLatestImage(msg.userid, msg);
    }
};

var image_to_followers_consumer = {
    exchange: 'cloudstagram-new-image',
    routingKey: '',
    callback: function(msg, headers, deliveryInfo) {
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
 * broadcast is done after the images has been stored into redis by image_to_followers_consumer consumer.
 * a new consumer needs to listen to cloudstagram-image-propagated exchange and then send data via sock.js
 */

exports.startConsumers = function(sockjs) {
    broadcast = sockjs;
    thumper.startConsumers([
        resize_consumer, 
        add_image_to_user_consumer, 
        new_image_consumer,
        image_to_followers_consumer
    ]);  
};