var format = require('util').format
, fs = require('fs')
, path = require('path')
, crypto = require('crypto')
, mime = require('mime-magic')
, HTTPStatus = require('http-status')
, uuid = require('node-uuid')
, thumper = require('../lib/thumper.js')
, image_storage = require('../lib/image_storage.js')
, user_images = require('../lib/user_images.js')
;

/*
 * GET home page.
 */
exports.index = function(req, res) {
    if (typeof req.session.userid === "undefined") {
        req.session.userid = uuid.v4();
    }
    user_images.getUserImages(req.session.userid, function(error, images) {
        res.render('index', { title: 'Cloudstagram', images: images });
    });
};

/*
 * POST handles image upload
 */
exports.upload = function(req, res, next) {
    //TODO if files is empty then return an error template.
    var tmpPath = req.files.image.path;
    var filename = generateNewFileName();
    var userid = req.session.userid;
    console.log("userid: ", userid);

    mime.fileWrapper(tmpPath, function (error, mime) {
        image_storage.storeFile(tmpPath, filename, mime, function(error, data) {
            if (error) {
                console.log(error);
            } else {
                fs.unlink(tmpPath);
                user_images.addImageToUser(userid, data.filename);
                thumper.publishMessage('cloudstagram-upload', {userid: userid, filename: data.filename}, '');
                res.redirect('/');
                //sendCreatedPath(res, "/image/" + data.filename);
            }
        });
    });
};

exports.serveFile = function(req, res, next) {
    console.log("userid: ", req.session.userid);
    console.log("size: ", req.param('size'));
    var filename = req.param('size') == 'small' ? 'small_' + req.params.id : req.params.id;
    image_storage.readGsFile(filename, function(error, gsData) {
        sendFile(res, gsData.binary, gsData.gsObject.contentType, HTTPStatus.OK);
    });
};

function sendCreatedPath(res, path) {
    res.send('', {'Location': path}, HTTPStatus.CREATED);
}

function sendFile(res, data, mime, code) {
    res.send(data, { 'Content-Type': mime }, code);
}

function generateNewFileName() {
    return crypto.createHash('md5').update(uuid.v4()).digest("hex");
}