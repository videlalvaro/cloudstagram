var format = require('util').format
, fs = require('fs')
, path = require('path')
, crypto = require('crypto')
, mongodb = require('mongodb')
, redis = require('redis')
, mime = require('mime-magic')
, HTTPStatus = require('http-status')
, uuid = require('node-uuid')
, thumper= require('../lib/thumper.js')
;

/*
 * GET home page.
 */
exports.index = function(req, res) {
    if (typeof req.session.userid === "undefined") {
        req.session.userid = uuid.v4();
    }
    getUserImages(req.session.userid, function(error, images) {
        res.render('index', { title: 'Cloudstagram', images: images });
    });
};

/*
 * POST handles image upload
 */
exports.upload = function(req, res, next) {
    var tmpPath = req.files.image.path;
    var filename = generateNewFileName();
    var userid = req.session.userid;
    console.log("userid: ", userid);

    mime.fileWrapper(tmpPath, function (error, mime) {
        console.log("Mime Type: ", mime);

        openDb(function(error, db) {
            storeFile(db, tmpPath, filename, mime, function(error, data) {
                if (error) {
                    console.log(error);
                } else {
                    db.close();
                    fs.unlink(tmpPath);
                    addImageToUser(userid, data.filename);
                    thumper.publishMessage('cloudstagram-upload', {userid: userid, filename: data.filename}, '');
                    sendCreatedPath(res, "/images/" + data.filename);
                }
            });
        });
    });
};

function keyForUserImages(userid) {
    return "images:" + userid;
}

function addImageToUser(userid, filename) {
    var client = redis.createClient();
    client.sadd(keyForUserImages(userid), filename);
    client.quit();
}

function getUserImages(userid, callback) {
    console.log("getUserImages: ", userid);
    var client = redis.createClient();
    client.smembers(keyForUserImages(userid), function (error, images) {
        client.quit();
        callback(error, images);
    });
}

function generateNewFileName() {
    return crypto.createHash('md5').update(uuid.v4()).digest("hex");
}

exports.serveFile = function(req, res, next) {
    console.log("userid: ", req.session.userid);
    openDb(function(error, db) {
        readGsFile(db, req.params.id, function(error, gsData) {
            db.close();
            sendFile(res, gsData.binary, gsData.gsObject.contentType, HTTPStatus.OK);
        });
    });
};

function readGsFile(db, filename, callback) {
    var gs = new mongodb.GridStore(db, filename, "r");
    gs.open(function(error, gsObject) {
        gsObject.read(gsObject.length, function(error, data) {
            gsObject.close(function() {
                callback(error, {"binary": data, "gsObject": gsObject});
            });
        });
    });    
}

function openDb(callback) {
    var db = new mongodb.Db('cloudstagram', new mongodb.Server("127.0.0.1", 27017, {}));
    db.open(callback);
}

function sendCreatedPath(res, path) {
    res.send('', {'Location': path}, HTTPStatus.CREATED);
}

function sendFile(res, data, mime, code) {
    res.send(data, { 'Content-Type': mime }, code);
}

function storeFile(db, tmpFile, filename, mimeType, callback) {
    var gs = new mongodb.GridStore(db, filename, "w", {
        "content_type": mimeType,
        "chunk_size": 1024*4
    });

    gs.open(function(error, gs) {
        gs.writeFile(tmpFile, function(error, store) {
            gs.close(callback);
        });
    });
}