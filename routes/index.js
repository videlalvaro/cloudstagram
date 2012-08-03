var user_images = require('../lib/user_images.js')
, view_helpers = require('../lib/view_helpers.js')
;

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