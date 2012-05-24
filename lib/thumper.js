var services = require('./services.js')
, cf_utils = require('./cloudFoundryUtil.js')
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
                getConsumer(conn, consumers[i].exchange, consumers[i].queue, 
                             consumers[i].routingKey, consumers[i].callback);
            }
        } else {
            getConsumer(conn, consumers.exchange, consumers.queue, 
                         consumers.routingKey, consumers.callback);
        }
    });
}

function getConsumer(conn, exchangeName, queueName, routingKey, callback) {
    var exchange = {
        name: exchangeName,
        opts: { durable: true, type: 'direct', auto_delete: false}
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
            q.bind(ex.name, cf_utils.getInstanceId() + routingKey);
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
            opts: { durable: true, type: 'direct', auto_delete: false}
        };
        var ex = conn.exchange(exchange.name, exchange.opts, function(ex) {
            ex.publish(cf_utils.getInstanceId() + routingKey, msg, {deliveryMode: 2});
        });
    });
}

exports.startConsumers = startConsumers;
exports.publishMessage = publishMessage;