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

function getUserImages(userid, callback) {
    console.log("getUserImages: ", userid);
    var client = redis.createClient();
    //TODO change it to lrange and add pagination
    client.lrange(keyForUserImages(userid), 0, 49, function (error, images) {
        client.quit();
        callback(error, images);
    });
}

exports.keyForUserImages = keyForUserImages;
exports.addImageToUser = addImageToUser;
exports.getUserImages = getUserImages;