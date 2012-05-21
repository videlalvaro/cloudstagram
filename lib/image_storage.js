var mongodb = require('mongodb')
, services = require('./services.js')
;

function storeFile(tmpFile, filename, mimeType, callback) {
    console.log('storeFile: ', 'getMongoDbConnection');
    services.getMongoDbConnection(function(error, db) {
        console.log('storeFile: ', 'new GridStore');
        var gs = new mongodb.GridStore(db, filename, "w", {
            "content_type": mimeType,
            "chunk_size": 1024*4
        });

        console.log('storeFile: ', 'open gridstore');
        gs.open(function(error, gs) {
            console.log('storeFile: ', 'writing file');
            gs.writeFile(tmpFile, function(error, store) {
                console.log('storeFile: ', 'closing gridstore');
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

exports.storeFile = storeFile;
exports.readGsFile = readGsFile;