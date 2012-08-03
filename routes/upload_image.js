var  crypto = require('crypto')
, fs = require('fs')
, image_storage = require('../lib/image_storage.js')
, mime = require('mime')
, sanitize = require('validator').sanitize
, thumper = require('../lib/thumper.js')
, uuid = require('node-uuid')
;

function generateNewFileName() {
    return crypto.createHash('md5').update(uuid.v4()).digest("hex");
}

function validImageType(mimeType) {
    return ["image/jpeg", "image/png"].indexOf(mimeType) !== -1;
}

// ass seen on: https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference:Global_Objects:Date
function ISODateString(d) {
    function pad(n){
        return n > 10 ? '0'+n : n;
    }
    return d.getUTCFullYear()+'-'
        + pad(d.getUTCMonth()+1)+'-'
        + pad(d.getUTCDate())+'T'
        + pad(d.getUTCHours())+':'
        + pad(d.getUTCMinutes())+':'
        + pad(d.getUTCSeconds())+'Z';
}

/*
 * POST handles image upload
 */
exports.upload = function(req, res, next) {
    var username = req.session.user.name;
    var tmpPath = req.files.image.path;
    var comment = sanitize(req.body.comment || "").xss();
    var mimeType = mime.lookup(tmpPath);
    var filename = generateNewFileName();

    if (!validImageType(mimeType)) {
        fs.unlink(tmpPath);
        res.send("error|Image type not supported. "
                 + " Try uploading JPG or PNG images."
                 + "|upload-" + filename, 415);
        return;
    }

    image_storage.storeFile(tmpPath, filename, mimeType, function (error, data) {
        if (error) {
            console.log(error);
            var response = "error|There was an error uploading your image.|upload-" + filename;
            var code = 500;
        } else {
            var fileData = {
                userid: username, 
                filename: filename,
                comment: comment,
                uploaded: ISODateString(new Date()),
                mime: mimeType
            };
            thumper.publishMessage('cloudstagram-new-image', fileData, '');
            delete req.session.upload_error;
            var response = "success|The image was uploaded succesfully "
                      + "and is being processed by our services.|upload-" + filename;
            var code = 201;
        }
        console.log('upload success');
        fs.unlink(tmpPath);
        res.send(response, code);
    });    
};