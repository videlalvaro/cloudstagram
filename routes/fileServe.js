var  HTTPStatus = require('http-status')
, image_storage = require('../lib/image_storage')
;

exports.serveFile = function(req, res, next) {
    var filename = req.params.id;
    image_storage.readGsFile(filename, function(error, gsData) {
        if (error) {
            console.log(error);
            res.send(404);
        } else {
            console.log("serve file: ", gsData.gsObject.contentType);
            res.send(gsData.binary, { 
                'Content-Type': gsData.gsObject.contentType,
                'Cache-Control': 'public, max-age=2592000'
            }, HTTPStatus.OK);
        }
    });
};