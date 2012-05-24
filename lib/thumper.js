var services = require('./services.js')
;

/**
 * consumes can be either an array with consumers or an object consumer.
 * a consumer has this shape:
 * {exchange: exchangeName, routingKey: routingKey, callback: fn}
 */
function startConsumers(consumers) {
    services.getRabbitMqConnection(function(conn) {
        if (consumers instanceof Array) {
            for(var i=0; i < consumers.length; i++) {
                anonConsumer(conn, consumers[i].exchange, consumers[i].queue, 
                             consumers[i].routingKey, consumers[i].callback);
            }
        } else {
            anonConsumer(conn, consumers.exchange, consumers.queue, 
                         consumers.routingKey, consumers.callback);
        }
    });
}

function anonConsumer(conn, exchangeName, queueName, routingKey, callback) {
    var exchange = {
        name: exchangeName,
        opts: { durable: true, type: 'fanout', auto_delete: false}
    };

    var queue = {
        name: queueName,
        opts: {exclusive: false, durable: true, auto_delete: false}
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
            opts: { durable: true, type: 'fanout'}
        };
        var ex = conn.exchange(exchange.name, exchange.opts, function(ex) {
            ex.publish(routingKey, msg, {deliveryMode: 2});
        });
    });
}

exports.startConsumers = startConsumers;
exports.publishMessage = publishMessage;