var redis = require('redis')
, amqp = require('amqp')
, cf_utils = require('./cloudFoundryUtil.js')
;

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

exports.getRedisClient = getRedisClient;
exports.getRabbitMqConnection = getRabbitMqConnection;