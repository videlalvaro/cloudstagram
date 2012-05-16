var im = require('imagemagick')
, fs = require('fs')
, image_storage = require('./image_storage')
, thumper = require('./thumper')
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
                });
            });
        });
    }
};

exports.startConsumers = function() {
    thumper.startConsumers([resize_consumer]);  
};