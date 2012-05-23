var fs = require('fs')
, path = require('path')
, crypto = require('crypto')
, mime = require('mime')
, uuid = require('node-uuid')
, thumper = require('../lib/thumper.js')
, image_storage = require('../lib/image_storage.js')
, user_images = require('../lib/user_images.js')
, user_interactions = require('../lib/user_interactions.js')
, user_data = require('../lib/user_data.js')
, ejs = require('ejs')
, view_helpers = require('../lib/view_helpers.js')
, dateformat = require('dateformat')
, sanitize = require('validator').sanitize
;

function generateNewFileName() {
    return crypto.createHash('md5').update(uuid.v4()).digest("hex");
}

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
        ishidden = action != session.prevAction
    }

    return view_helpers.renderTemplate('user_form', {
        action: action,
        error: error,
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
        var info = {
            images: data[0],
            imagesCount: data[1] || 0,
            followersCount: data[2] || 0,
            followsCount: data[3] || 0
        };
        
        var renderedImages = view_helpers.renderTemplate('image_list', {
            data: {
                images: data[0]
            },
            dateformat: dateformat,
            usernamelink: view_helpers.usernamelink,
            loggedin: view_helpers.loggedin,
            loggedinuser: view_helpers.loggedinuser,
            imageBoxTemplate: view_helpers.getImageBoxTemplate()
        });

        var sideform = req.session.user ? null : getSideForm(req.session);
        var sidemessage = req.session.user ? null : getSideMessage(req.session.user ? 'welcome' : 'welcome_visitor');

        res.render('profile', {
            title: 'Cloudstagram', 
            data: info, 
            username: username,
            profileUser: profileUser,
            renderedImages: renderedImages,
            sideform: sideform,
            sidemessage: sidemessage
        });
    });
};

/*
 * POST handles image upload
 */
exports.upload = function(req, res, next) {
    var username = req.session.user.name;
    var tmpPath = req.files.image.path;
    var comment = sanitize(req.body.comment || "").xss();
    var mimeType = mime.lookup(tmpPath);
    var extension = mime.extension(mimeType);
    var unique = generateNewFileName();
    var filename = unique + "." + extension;
    var destPath = __dirname + "/../public/uploads/" + filename;

    image_storage.storeFile(tmpPath, filename, mimeType, function (error, data) {
        if (error) {
            console.log(error);
            req.session.upload_error = "There was an error uploading your image";
            req.flash('error', "There was an error uploading your image|upload-" + unique);
            req.session.prevAction = 'upload';
        } else {
            var fileData = {
                userid: username, 
                filename: filename,
                comment: comment,
                uploaded: Date.now(),
                mime: mimeType
            };
            fs.unlink(tmpPath);
            thumper.publishMessage('cloudstagram-new-image', fileData, '');
            delete req.session.upload_error;
            req.flash('success', "The image was uploaded succesfully "
                      + "and is being processed by our services|upload-" + unique);
        }
        console.log('upload: ', 'redirecting back');
        res.redirect('back')
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
}

exports.followUser = function(req, res, next) {
    var from = req.session.user.name;
    var target = req.params.userid;
    user_interactions.followUser(from, target, function(error, data) {
        if (error) {
            res.send("KO", 500);
        } else {
            res.send("OK", 200);
        }        
    });
}

exports.isFollower = function (req, res, next) {
    var from = req.session.user.name;
    var target = req.params.userid;

    user_interactions.isFollowedBy(target, from, function (error, data) {
        if (error) {
            res.send(500);
        } else {
            res.send(data == 0 ? "NO" : "YES", 200);
        }
    });
}