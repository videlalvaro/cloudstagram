var mongodb = require('mongodb')
, redis = require('redis')
, amqp = require('amqp')
, cf_utils = require('./cloudFoundryUtil.js')
;

var mongodbConn;

function getMongoDbConnection(callback) {
    if (mongodbConn) {
        callback(null, mongodbConn);
    } else {
        var credentials = cf_utils.getMongoCredentials(null);
        var mongoserver = new mongodb.Server(credentials.hostname, credentials.port, {auto_reconnect: true});
        var db_connector = new mongodb.Db(credentials.db, mongoserver, {});

        db_connector.open(function(err, conn) {
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
    var credentials = cf_utils.getRedisCredentials();
    var client = redis.createClient(credentials.port || null, credentials.hostname || null);
    if (credentials.password) {
        client.auth(credentials.password);
    }
    return client;
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
