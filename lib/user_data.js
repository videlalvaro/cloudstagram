var user_images = require('./user_images.js')
, user_interactions = require('./user_interactions.js')
, services = require('./services.js')
;

function getUserData(userid, callback) {
    user_images.getUserImages(userid, 0, -1, function (error, data) {
        if (error) {
            callback(error, null);
        } else {
            var client = services.getRedisClient();
            var multi = client.multi();

            multi.get(user_images.keyForUserImagesCount(userid));
            multi.get(user_interactions.keyForUserFollowersCount(userid));
            multi.get(user_interactions.keyForUserFollowsCount(userid));

            multi.exec(function (error, replies) {
                client.quit();
                if (error) {
                    callback(error, null);
                } else {
                    callback(error, {
                        images: data,
                        imagesCount: replies[0] || 0,
                        followersCount: replies[1] || 0,
                        followsCount: replies[2] || 0
                    });
                }
            });
        }
    });
}

exports.getUserData = getUserData;