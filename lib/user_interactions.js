var redis = require('redis');

/**
 * from: the logged in user
 * target: the user that is being followed
 */
function followUser(from, target, callback) {
    var client = redis.createClient();
    var multi = client.multi();
    multi.lpush(target + ":followers", from);
    multi.lpush(from + ":follows", target);
    multi.exec(function (error, replies) {
        client.close();
        callback(error, replies);
    });
}

function getUserFollowers(username, callback) {
    var client = redis.createClient();
    client.lrange(username + ":followers", 0, -1, function(error, data) {
        client.quit();
        callback(error, data);
    });
}

function getUserFollows(username, callback) {
    var client = redis.createClient();
    client.lrange(username + ":follows", 0, -1, function(error, data) {
        client.quit();
        callback(error, data);
    });
}

exports.followUser = followUser;