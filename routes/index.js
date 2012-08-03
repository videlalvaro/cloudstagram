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
    var callback = function(error, data) {
        res.render('image_list', { 
            title: 'Cloudstagram', 
            data: data, 
            username: username,
            sideform: view_helpers.getSideForm(req.session),
            sidemessage: view_helpers.getSideMessage(req.session.user ? 'welcome' : 'welcome_visitor'),
            imageBoxTemplate: view_helpers.getImageBoxTemplate()
        });
    };

    if (username == null) {
        user_images.getLatestImages(0, 49, callback);
    } else {
        user_images.getUserTimeline(username, 0, 49, callback);
    }
};

exports.latestImages = function(req, res) {
    var username = req.session.user ? req.session.user.name : null;
    user_images.getLatestImages(0, 49, function(error, data) {
        res.render('image_list', {
            title: 'Cloudstagram', 
            data: data, 
            username: username,
            sideform: view_helpers.getSideForm(req.session),
            sidemessage: view_helpers.getSideMessage('latest'),
            imageBoxTemplate: view_helpers.getImageBoxTemplate()
        });
    });
};

exports.likeImage = function(req, res, next) {
    var username = req.session.user.name;
    var imageid = req.params.imageid;
    user_interactions.likeImage(username, imageid, function(error, data){
        if (error) {
            res.send(500);
        } else {
            res.send(204);
        }
    });
};

exports.deleteImage = function (req, res, next) {
    var filename = req.params.imageid;
    console.log("deleteImage: ", filename);
    image_storage.deleteImage(filename, function(error, result) {
        if (!error) {
            res.send('Image Deleted', 200);
        } else {
            console.log("deleteImage: ", result);
            res.send('Failed to delete image', 500);
        }
    });  
};