var mongodb = require('mongodb')
, redis = require('redis')
, amqp = require('amqp')
, cf_utils = require('./cloudFoundryUtil.js')
;

var mongodbConn, rabbitmqConn;

function getMongoDbConnection(callback) {
    var dbServiceName = null;
    if (mongodbConn) {
        callback(null, mongodbConn);
    } else {
        mongodb.connect(cf_utils.getMongoUrl(dbServiceName), function(err, conn) {
            mongodbConn = conn;
            callback(err, mongodbConn);
        });   
    }
}

function getRedisClient() {
    var credentials = cf_utils.getRedisCredentials();
    var client = redis.createClient(credentials.port || null, credentials.hostname || null);
    if (credentials.password) {
        client.auth(credentials.password);
    }
    return client;
}

function getRabbitMqConnection(callback) {
    var url = cf_utils.getRabbitUrl();

    if (rabbitmqConn) {
        console.log("reusing rabbit connection");
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
;