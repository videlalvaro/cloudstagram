var user_images = require('../lib/user_images.js')
, view_helpers = require('../lib/view_helpers.js')
;

var MAX_IMAGES = 49;

exports.index = function(req, res) {
    var username = req.session.user ? req.session.user.name : null;
    var welcome_msg = view_helpers.getWelcomeMessage(req.session.user);
    var callback = view_helpers.imageList(res, req.session, username, welcome_msg);

    if (username == null) {
        user_images.getLatestImages(0, MAX_IMAGES, callback);
    } else {
        user_images.getUserTimeline(username, 0, MAX_IMAGES, callback);
    }
};

exports.latestImages = function(req, res) {    
    var username = req.session.user ? req.session.user.name : null;
    var welcome_msg = 'latest';
    var callback = view_helpers.imageList(res, req.session, username, welcome_msg);
    user_images.getLatestImages(0, MAX_IMAGES, callback);
};