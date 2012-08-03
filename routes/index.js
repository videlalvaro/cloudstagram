var 
, path = require('path')
, image_storage = require('../lib/image_storage.js')
, user_images = require('../lib/user_images.js')
, user_interactions = require('../lib/user_interactions.js')
, user_data = require('../lib/user_data.js')
, ejs = require('ejs')
, view_helpers = require('../lib/view_helpers.js')
, cf_utils = require('../lib/cloudFoundryUtil.js')
;

function getSideForm(session) {
    if (session.user) {
        return view_helpers.renderTemplate('upload_form', {
            session: session
        });
    } else {
        var forms = getUserForm(session, 'login', session.error, session.prevAction) 
            + getUserForm(session, 'register', session.error, session.prevAction); 
        delete session.error;
        delete session.prevAction;
        return forms;
    }
}

function getUserForm(session, action, error, prevAction) {
    var ishidden;
    var errorMsg = action == prevAction ? error : null;
    
    if (typeof session.prevAction === "undefined") {
        //if no previous action then hide register form
        ishidden = action == "register";
    } else {
        ishidden = action != session.prevAction;
    }

    return view_helpers.renderTemplate('user_form', {
        action: action,
        error: errorMsg,
        ishidden: ishidden
    });
}

function getSideMessage(message) {
    return view_helpers.renderTemplate(message, {
    });
}

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
            sideform: getSideForm(req.session),
            sidemessage: getSideMessage(req.session.user ? 'welcome' : 'welcome_visitor'),
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
            sideform: getSideForm(req.session),
            sidemessage: getSideMessage('latest'),
            imageBoxTemplate: view_helpers.getImageBoxTemplate()
        });
    });
}

exports.userProfile = function(req, res) {
    var username = req.session.user ? req.session.user.name : null;
    var profileUser = req.params.userid;
    
    user_data.getUserData(profileUser, function(error, data) {
        
        var renderedImages = view_helpers.renderTemplate('image_list', {
            username: username,
            data: data.images,
            usernamelink: view_helpers.usernamelink,
            loggedin: view_helpers.loggedin,
            loggedinuser: view_helpers.getLoggedinUser(username),
            imageBoxTemplate: view_helpers.getImageBoxTemplate(),
            ejs: ejs
        });

        var sideform = req.session.user ? null : getSideForm(req.session);
        var sidemessage = req.session.user ? null : getSideMessage(req.session.user ? 'welcome' : 'welcome_visitor');

        res.render('profile', {
            title: 'Cloudstagram', 
            data: data, 
            username: username,
            profileUser: profileUser,
            renderedImages: renderedImages,
            sideform: sideform,
            sidemessage: sidemessage
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