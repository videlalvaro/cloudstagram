if(!Array.prototype.last) {
    Array.prototype.last = function() {
        return this[this.length - 1];
    }
}

var format = require('util').format;
var fs = require('fs');
var mongodb = require('mongodb');
var mime = require('mime-magic');
var HTTPStatus = require('http-status');

/*
 * GET home page.
 */
exports.index = function(req, res) {
    res.render('index', { title: 'Cloudstagram' })
};

/*
 * POST handles image upload
 */
exports.upload = function(req, res, next) {
    var tmpPath = req.files.image.path;
    var baseName = getBasename(tmpPath);
    console.log(baseName);

    mime.fileWrapper(tmpPath, function (error, mime) {
        console.log("Mime Type: ", mime);

        openDb(function(error, db) {
            storeFile(db, tmpPath, mime, function(error, data) {
                if (error) {
                    console.log(error);
                } else {
                    fs.unlink(tmpPath);
                    //TODO push message to RabbitMQ.
                    readFile(db, baseName, function(error, data) {
                        db.close();
                        sendFile(res, data, mime, HTTPStatus.CREATED);
                    });
                }
            });
        });
    });
};

function openDb(callback) {
    var db = new mongodb.Db('cloudstagram', new mongodb.Server("127.0.0.1", 27017, {}));
    db.open(callback);
}

function sendFile(res, data, mime, code) {
    res.send(data, { 'Content-Type': mime }, code);
}

function storeFile(db, fileName, mimeType, callback) {
    var gs = new mongodb.GridStore(db, getBasename(fileName), "w", {
        "content_type": mimeType,
        "chunk_size": 1024*4
    });

    gs.open(function(error, gs) {
        console.log('gridfs open');
        console.log(error);
        gs.writeFile(fileName, function(error, store) {
            gs.close(callback);
        });
    });
}

function readFile(db, baseName, callback) {
    mongodb.GridStore.read(db, baseName, function(error, data) {
        console.log("reading file");
        console.log(error);
        callback(error, data);
    });
}


function getBasename(fileName) {
    return fileName.split('/').last();   
}