var amqp = require('amqp')
;

function rabbitUrl() {
    if (process.env.VCAP_SERVICES) {
        conf = JSON.parse(process.env.VCAP_SERVICES);
        return conf['rabbitmq-2.4'][0].credentials.url;
    } else {
        return "amqp://localhost";
    }
}

//TODO see how to use a singleton for the conn
var conn;

/**
 * consumes can be either an array with consumers or an object consumer.
 * a consumer has this shape:
 * {exchange: exchangeName, routingKey: routingKey, callback: fn}
 */
function startConsumers(consumers) {
    console.log("Starting ... AMQP URL: " + rabbitUrl());
    conn = amqp.createConnection({url: rabbitUrl()});
    conn.on('ready', function() {
        if (consumers instanceof Array) {
            for(var i=0; i < consumers.length; i++) {
                anonConsumer(consumers[i].exchange, consumers[i].routingKey, consumers[i].callback);
            }
        } else {
            anonConsumer(consumers.exchange, consumers.routingKey, consumers.callback);
        }
    });
}

function anonConsumer(exchangeName, routingKey, callback) {
    var exchange = {
        name: exchangeName,
        opts: { durable: true, type: 'fanout', durable: true}
    };

    var queue = {
        name: '',
        opts: {exclusive: true}
    };
    
    installCallback(exchange, queue, routingKey, callback);
}

function installCallback(exchange, queue, routingKey, callback) {
    var ex = conn.exchange(exchange.name, exchange.opts, function(ex) {
        var q = conn.queue(queue.name, queue.opts, function(q) {
            q.bind(ex.name, routingKey);
            q.on('queueBindOk', function() {
                q.subscribe(callback);
            });
        });
    });
}

function publishMessage(exchangeName, msg, routingKey) {
    var conn = amqp.createConnection({url: rabbitUrl()});
    conn.on('ready', function() {
        var exchange = {
            name: exchangeName,
            opts: { durable: true, type: 'fanout', durable: true}
        };
        var ex = conn.exchange(exchange.name, exchange.opts, function(ex) {
            ex.publish(routingKey, msg, {deliveryMode: 2});
        });
    });
}

exports.startConsumers = startConsumers;
exports.publishMessage = publishMessage;