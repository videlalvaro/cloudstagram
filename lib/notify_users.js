var user_interactions = require('../lib/user_interactions.js')
, thumper = require('./thumper')
;

var broadcast;

var sockjs_broadcast_to_uploader = {
    exchange: 'cloudstagram-broadcast-newimage',
    queue: '',
    routingKey: '',
    callback: function(msg, headers, deliveryInfo) {
        var data = JSON.stringify(msg);
        broadcast.sendToUser(msg.userid, 'new_pic', data);
    }
};

var sockjs_broadcast_to_anonusers = {
    exchange: 'cloudstagram-broadcast-newimage',
    queue: '',
    routingKey: '',
    callback: function(msg, headers, deliveryInfo) {
        var data = JSON.stringify(msg);
        broadcast.sendToAnon('new_pic', data);
    }
};

        

var sockjs_broadcast_to_followers_consumer = {
    exchange: 'cloudstagram-broadcast-newimage',
    queue: '',
    routingKey: '',
    callback: function(msg, headers, deliveryInfo) {
        user_interactions.getUserFollowers(msg.userid, function (error, followers) {
            if (!error) {
                followers.forEach(function(username) {
                    var data = JSON.stringify(msg);
                    broadcast.sendToUser(username, 'new_pic', data);
                });
            }
        });
    }
};

exports.startConsumers = function(sockjs) {
    broadcast = sockjs;
    thumper.startAnonConsumers([
        sockjs_broadcast_to_uploader,
        sockjs_broadcast_to_anonusers,
        sockjs_broadcast_to_followers_consumer
    ]);  
};