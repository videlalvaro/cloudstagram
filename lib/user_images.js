var redis = require('redis')
, user_interactions = require('./user_interactions.js')
, services = require('./services.js')
;

function keyForUserImages(userid) {
    return userid + ":images";
}

function keyForUserImagesCount(userid) {
    return userid + ":image_count";
}

function keyForUserTimeline(userid) {
    return userid + ":timeline";
}

function imageFromData(data) {
    return JSON.stringify({
        username: data.userid,
        path: data.filename,
        uploaded: data.uploaded,
        comment: data.comment
    });
}

/**
 * adds image to user own's image list
 */
function addImageToUser(userid, data, callback) {
    var client = services.getRedisClient();
    var multi = client.multi();
    var img = imageFromData(data);

    multi.lpush(keyForUserImages(userid), img);
    multi.lpush(userid + ":timeline", img);
    multi.incr(keyForUserImagesCount(userid));
    multi.exec(function(error, reply) {
        client.quit();
        callback(error, reply);
    });
}

/**
 * - retrieves the images for a particular user.
 * - data includes who liked which image.
 */
function getUserImages(userid, from, to, callback) {
    getImagesWithRelatedData(keyForUserImages(userid), "likes", from, to, callback);
}

/**
 * - retrieves the timeline for a particular user.
 * - data includes who liked which image.
 */
function getUserTimeline(userid, from, to, callback) {
    getImagesWithRelatedData(keyForUserTimeline(userid), "likes", from, to, callback);
}

/**
 * latest_images is the so called public timeline
 */
function addLatestImage(userid, data) {
    var client = services.getRedisClient();
    var img = imageFromData(data);

    client.lpush("latest_images", img, function (error, images){
        client.quit();
    });
}

/**
 * get the public timeline
 */
function getLatestImages(from, to, callback) {
    getImagesWithRelatedData("latest_images", "likes", from, to, callback);
}

function addImageToFollowers(user, data, callback) {
    var img = imageFromData(data);

    user_interactions.getUserFollowers(data.userid, function (error, followers) {
        var client = services.getRedisClient();
        var multi = client.multi();
        followers.forEach(function(id) {
            multi.lpush(id + ":timeline", img);
        });

        multi.exec(function (error, replies) {
            client.quit();
            callback(error, replies);
        });
    });
}

/**
 * fetches related data for a list of images, for example image likes
 */
function getImagesWithRelatedData(key, related, from, to, callback) {
    var client = services.getRedisClient();
    client.lrange(key, from, to, function (error, images) {
        var image_ids = [];
        images.forEach(function(image) {
            var img_data = JSON.parse(image);
            image_ids.push(img_data.path);
        });
        getRelatedData(image_ids, related, client, function(error, related_data) {
            client.quit();
            callback(error, {images: images, related: related_data});
        });
    });    
}

/**
 * fetches the related data for a list of ids
 */
function getRelatedData(ids, related, client, callback) {
    var multi = client.multi();
    ids.forEach(function(id) {
        multi.lrange(id + ":" + related, 0, -1); 
    });

    multi.exec(function (error, replies) {
        callback(error, replies);
    });
}

exports.keyForUserImages = keyForUserImages;
exports.keyForUserImagesCount = keyForUserImagesCount;
exports.addImageToUser = addImageToUser;
exports.getUserImages = getUserImages;
exports.addLatestImage = addLatestImage;
exports.getLatestImages = getLatestImages;
exports.addImageToFollowers = addImageToFollowers;
exports.getUserTimeline = getUserTimeline;