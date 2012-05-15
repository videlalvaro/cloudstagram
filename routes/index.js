var format = require('util').format
, fs = require('fs')
, path = require('path')
, mongodb = require('mongodb')
, mime = require('mime-magic')
, HTTPStatus = require('http-status')
;

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

    mime.fileWrapper(tmpPath, function (error, mime) {
        console.log("Mime Type: ", mime);

        openDb(function(error, db) {
            storeFile(db, tmpPath, mime, function(error, data) {
                if (error) {
                    console.log(error);
                } else {
                    db.close();
                    fs.unlink(tmpPath);
                    console.log(data);
                    //TODO push message to RabbitMQ.
                    sendCreatedPath(res, "/images/" + data.filename);
                }
            });
        });
    });
};

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

function storeFile(db, fileName, mimeType, callback) {
    var gs = new mongodb.GridStore(db, path.basename(fileName), "w", {
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

function readFile(db, filename, callback) {
    mongodb.GridStore.read(db, filename, function(error, data) {
        console.log("reading file");
        console.log(error);
        callback(error, data);
    });
}