var user_images = require('./user_images.js')
, user_interactions = require('./user_interactions')
, redis = require('redis')
;


function getUserData(userid, callback) {
    var client = redis.createClient();
    var multi = client.multi();

    multi.lrange(user_images.keyForUserImages(userid), 0, -1);
    multi.get(user_images.keyForUserImagesCount(userid));
    multi.get(user_interactions.keyForUserFollowersCount(userid));
    multi.get(user_interactions.keyForUserFollowsCount(userid));

    multi.exec(function (error, replies) {
        client.quit();
        callback(error, replies);
    });
}

exports.getUserData = getUserData;