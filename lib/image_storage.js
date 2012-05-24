var mongodb = require('mongodb')
, services = require('./services.js')
;

function storeFile(tmpFile, filename, mimeType, callback) {
    services.getMongoDbConnection(function(error, db) {
        var gs = new mongodb.GridStore(db, filename, "w", {
            "contentType": mimeType,
            "chunkSize": 1024*4
        });

        gs.open(function(error, gs) {
            gs.writeFile(tmpFile, function(error, store) {
                gs.close(callback);
            });
        });
    });
}

function readGsFile(filename, callback) {
    services.getMongoDbConnection(function(error, db) {
        var gs = new mongodb.GridStore(db, filename, "r");
        gs.open(function(error, gsObject) {
            gsObject.read(gsObject.length, function(error, data) {
                gsObject.close(function() {
                    callback(error, {"binary": data, "gsObject": gsObject});
                });
            });
        });
    });    
}

function deleteImage(filename, callback) {
    services.getMongoDbConnection(function(error, db) {
        var gs = new mongodb.GridStore(db, filename, "r");
        gs.open(function(error, gsObject) {
            gsObject.unlink(callback);
        });
    });    
}

exports.storeFile = storeFile;
exports.readGsFile = readGsFile;
exports.deleteImage = deleteImage;