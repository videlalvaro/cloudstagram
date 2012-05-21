var redis = require('redis')
, services = require('./services.js')
;

function keyForUserFollowers(username) {    
    return username + ":followers";
}

function keyForUserFollowersCount(username) {
    return username + ":followers_count";
}

function keyForUserFollows(username) {    
    return username + ":follows";
}

function keyForUserFollowsCount(username) {
    return username + ":follows_count";
}

/**
 * from: the logged in user
 * target: the user that is being followed
 */
function followUser(from, target, callback) {
    var client = services.getRedisClient();
    var multi = client.multi();
    multi.sadd(keyForUserFollowers(target), from);
    multi.sadd(keyForUserFollows(from), target);
    multi.incr(keyForUserFollowersCount(target));
    multi.incr(keyForUserFollowsCount(from));
    multi.exec(function (error, replies) {
        client.quit();
        callback(error, replies);
    });
}

function getUserFollowers(username, callback) {
    var client = services.getRedisClient();
    client.smembers(keyForUserFollowers(username), function(error, data) {
        client.quit();
        callback(error, data);
    });
}

function getUserFollows(username, callback) {
    var client = services.getRedisClient();
    client.lrange(keyForUserFollows(username), 0, -1, function(error, data) {
        client.quit();
        callback(error, data);
    });
}

function isFollowedBy(user, follower, callback) {
    var client = services.getRedisClient();
    client.sismember(keyForUserFollowers(user), follower, function (error, data) {
        client.quit();
        callback(error, data);
    });
}

function likeImage(userid, imageid, callback) {
    var client = services.getRedisClient();
    var multi = client.multi();
    multi.lpush(imageid + ":likes", userid);
    multi.lpush(userid + ":likes", imageid);
    multi.exec(function (error, replies){
        client.quit();
        callback(error, replies);
    });
}

exports.followUser = followUser;
exports.getUserFollowers = getUserFollowers;
exports.keyForUserFollowersCount = keyForUserFollowersCount;
exports.getUserFollows = getUserFollows;
exports.isFollowedBy = isFollowedBy;
exports.keyForUserFollowsCount = keyForUserFollowsCount;
exports.likeImage = likeImage;