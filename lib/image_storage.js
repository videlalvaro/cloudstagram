var mongodb = require('mongodb')
;

function openDb(callback) {
    var db = new mongodb.Db('cloudstagram', new mongodb.Server("127.0.0.1", 27017, {}));
    //TODO see where to close the connection
    //db.close();
    db.open(callback);
}

function storeFile(tmpFile, filename, mimeType, callback) {
    openDb(function(error, db) {
        var gs = new mongodb.GridStore(db, filename, "w", {
            "content_type": mimeType,
            "chunk_size": 1024*4
        });

        gs.open(function(error, gs) {
            gs.writeFile(tmpFile, function(error, store) {
                gs.close(callback);
            });
        });
    });
}

function readGsFile(filename, callback) {
    openDb(function(error, db) {
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

exports.openDb = openDb;
exports.storeFile = storeFile;
exports.readGsFile = readGsFile;