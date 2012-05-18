var redis = require('redis')
;

function keyForUserImages(userid) {
    return userid + ":images";
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
function addImageToUser(userid, data) {
    var client = redis.createClient();
    var img = imageFromData(data);
    console.log(img);

    client.lpush(keyForUserImages(userid), img, function(error, reply) {
        client.quit();
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
 * latest_images is the so called public timeline
 */
function addLatestImage(userid, data) {
    var client = redis.createClient();
    var img = imageFromData(data);
    console.log(img);

    multi.lpush("latest_images", img, function (error, images){
        client.quit();
    });
}

/**
 * get the public timeline
 */
function getLatestImages(from, to, callback) {
    getImagesWithRelatedData("latest_images", "likes", from, to, callback);
}

/**
 * fetches related data for a list of images, for example image likes
 */
function getImagesWithRelatedData(key, related, from, to, callback) {
    var client = redis.createClient();
    client.lrange(key, from, to, function (error, images) {
        console.log("getImagesWithRelatedData: ", images);
        console.log(typeof images);
        var image_ids = [];
        images.forEach(function(image) {
            image_ids.push(image.path);
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
        console.log(replies);
        callback(error, replies);
    });
}

function likeImage(userid, imageid, callback) {
    var client = redis.createClient();
    var multi = client.multi();
    multi.lpush(imageid + ":likes", userid);
    multi.lpush(userid + ":likes", imageid);
    multi.exec(function (error, replies){
        client.quit();
        callback(error, replies);
    });
}

exports.addImageToUser = addImageToUser;
exports.getUserImages = getUserImages;
exports.addLatestImage = addLatestImage;
exports.getLatestImages = getLatestImages;
exports.likeImage = likeImage;