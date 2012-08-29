var mongodb = require('mongodb')
, redis = require('redis')
, amqp = require('amqp')
, cf_utils = require('./cloudFoundryUtil.js')
;

var mongodbConn;

function getMongoDbConnection(callback) {
    if (mongodbConn && mongodbConn.state == 'connected') {
        callback(null, mongodbConn);
    } else {
        mongodb.connect(cf_utils.getMongoUrl(), function(err, conn) {
            if (err) {
                console.log("Failed to connect to MongoDB: ", err);
                callback(err, null);
            } else {
                mongodbConn = conn;
                mongodbConn.on("close", function(error){
                    mongodbConn = null;
                    console.log("Connection to MongoDB was closed!");
                });
                callback(err, mongodbConn);
            }
        });
    }
}

function getRedisClient() {
    return redis.createClient();
}

var rabbitmqConn;

function getRabbitMqConnection(callback) {
    var url = cf_utils.getRabbitUrl();

    if (rabbitmqConn) {
        callback(rabbitmqConn);
    } else {
        console.log("Starting ... AMQP URL: " + url);
        var conn = amqp.createConnection({url: url});
        conn.on('ready', function() {
            rabbitmqConn = conn;
            callback(rabbitmqConn);
        });
        conn.on('closed', function() {
            rabbitmqConn = null;
        });
    }
}

exports.getMongoDbConnection = getMongoDbConnection;
exports.getRedisClient = getRedisClient;
exports.getRabbitMqConnection = getRabbitMqConnection;
