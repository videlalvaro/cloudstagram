var image_storage = require('../lib/image_storage.js')
, user_images = require('../lib/user_images.js')
, user_interactions = require('../lib/user_interactions.js')
, view_helpers = require('../lib/view_helpers.js')
, cf_utils = require('../lib/cloudFoundryUtil.js')
;

/*
 * GET home page.
 */
exports.index = function(req, res) {
    // TODO remove magick numbers. Move them to configuraion
    var username = req.session.user ? req.session.user.name : null;
    var welcome_msg = view_helpers.getWelcomeMessage(req.session.user);
    var callback = view_helpers.imageList(req.session, username, welcome_msg);

    if (username == null) {
        user_images.getLatestImages(0, 49, callback);
    } else {
        user_images.getUserTimeline(username, 0, 49, callback);
    }
};

exports.latestImages = function(req, res) {
    // TODO remove magick numbers. Move them to configuraion
    var username = req.session.user ? req.session.user.name : null;
    var welcome_msg = 'latest';
    var callback = view_helpers.imageList(req.session, username, welcome_msg);
    user_images.getLatestImages(0, 49, callback);
};

exports.likeImage = function(req, res, next) {
    var username = req.session.user.name;
    var imageid = req.params.imageid;
    user_interactions.likeImage(username, imageid, function(error, data){
        error ? res.send(500) : res.send(204);
    });
};

exports.deleteImage = function (req, res, next) {
    var filename = req.params.imageid;
    console.log("deleteImage: ", filename);
    image_storage.deleteImage(filename, function(error, result) {
        console.log("deleteImage: ", result);
        error 
            ? res.send('Failed to delete image', 500) 
            : res.send('Image Deleted', 200);
    });  
};