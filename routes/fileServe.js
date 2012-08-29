var  HTTPStatus = require('http-status')
, image_storage = require('../lib/image_storage')
;

function sendFile(res, data, mime, code) {
    res.send(data, 
             { 
                 'Content-Type': mime,
                 'Cache-Control': 'public, max-age=2592000'
             }, code);
}

exports.serveFile = function(req, res, next) {
    var filename = req.params.id;
    image_storage.readGsFile(filename, function(error, gsData) {
        if (error) {
            console.log(error);
            res.send(404);
        } else {
            console.log("serve file: ", gsData.gsObject.contentType);
            sendFile(res, gsData.binary, gsData.gsObject.contentType, HTTPStatus.OK);   
        }
    });
};