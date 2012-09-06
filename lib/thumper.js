var services = require('./services.js')
;

/**
 * consumes can be either an array with consumers or an object consumer.
 * a consumer has this shape:
 * {exchange: exchangeName, routingKey: routingKey, callback: fn}
 */
function genericStartConsumers(consumers, isAnon) {
    var consumerFunc = isAnon ? getAnonConsumer : getConsumer

    services.getRabbitMqConnection(function(conn) {
        if (consumers instanceof Array) {
            for(var i=0; i < consumers.length; i++) {
                consumerFunc(conn, consumers[i].exchange, consumers[i].queue, 
                             consumers[i].routingKey, consumers[i].callback);
            }
        } else {
            consumerFunc(conn, consumers.exchange, consumers.queue, 
                         consumers.routingKey, consumers.callback);
        }
    });
}

function startConsumers(consumers) {
    genericStartConsumers(consumers, false);
}

function startAnonConsumers(consumers) {
    genericStartConsumers(consumers, true);
}

function getConsumer(conn, exchangeName, queueName, routingKey, callback) {
    var exchange = {
        name: exchangeName,
        opts: { durable: true, type: 'direct', autoDelete: false}
    };

    var queue = {
        name: queueName,
        opts: {exclusive: false, durable: true, autoDelete: false}
    };
    
    installCallback(conn, exchange, queue, routingKey, callback);
}

function getAnonConsumer(conn, exchangeName, queueName, routingKey, callback) {
    var exchange = {
        name: exchangeName,
        opts: { durable: true, type: 'fanout', autoDelete: false}
    };

    var queue = {
        name: queueName,
        opts: {exclusive: true, durable: false, autoDelete: true}
    };
    
    installCallback(conn, exchange, queue, routingKey, callback);
}

function installCallback(conn, exchange, queue, routingKey, callback) {
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
    services.getRabbitMqConnection(function(conn) {
        var exchange = {
            name: exchangeName,
            opts: { durable: true, type: 'direct', autoDelete: false}
        };
        var ex = conn.exchange(exchange.name, exchange.opts, function(ex) {
            ex.publish(routingKey, msg, {deliveryMode: 1});
        });
    });
}

function publishPubSubMessage(exchangeName, msg, routingKey) {
    //sadly node-amqp requires to declare an exchange before publishing.
    services.getRabbitMqConnection(function(conn) {
        var exchange = {
            name: exchangeName,
            opts: { durable: true, type: 'fanout', autoDelete: false}
        };
        var ex = conn.exchange(exchange.name, exchange.opts, function(ex) {
            ex.publish(routingKey, msg, {deliveryMode: 1});
        });
    });
}

exports.startConsumers = startConsumers;
exports.startAnonConsumers = startAnonConsumers;
exports.publishMessage = publishMessage;
exports.publishPubSubMessage = publishPubSubMessage;