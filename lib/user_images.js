var redis = require('redis')
;

function keyForUserImages(userid) {
    return "images:" + userid;
}

function addImageToUser(userid, filename) {
    var client = redis.createClient();
    client.rpush(keyForUserImages(userid), filename);
    client.quit();
}

function getUserImages(userid, from, to, callback) {
    console.log("getUserImages: ", userid);
    var client = redis.createClient();
    client.lrange(keyForUserImages(userid), from, to, function (error, images) {
        client.quit();
        callback(error, images);
    });
}

function addLatestImage(username, filename) {
    var client = redis.createClient();
    //TODO store username
    client.rpush("latest_images", filename);
    client.quit();
}

function getLatestImages(from, to, callback) {
    var client = redis.createClient();
    client.lrange("latest_images", from, to, function (error, images) {
        client.quit();
        callback(error, images);
    });    
}

exports.keyForUserImages = keyForUserImages;
exports.addImageToUser = addImageToUser;
exports.getUserImages = getUserImages;
exports.addLatestImage = addLatestImage;
exports.getLatestImages = getLatestImages;