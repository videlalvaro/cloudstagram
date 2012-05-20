var fs = require('fs')
, path = require('path')
, crypto = require('crypto')
, mime = require('mime-magic')
, HTTPStatus = require('http-status')
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

function sendCreatedPath(res, path) {
    res.send('', {'Location': path}, HTTPStatus.CREATED);
}

function sendFile(res, data, mime, code) {
    res.send(data, { 'Content-Type': mime }, code);
}

function generateNewFileName() {
    return crypto.createHash('md5').update(uuid.v4()).digest("hex");
}

function getUploadForm(session) {
    return view_helpers.renderTemplate('upload_form', {
        session: session
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
            uploadform: getUploadForm(req.session),
            sidemessage: getSideMessage('welcome')
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
            uploadform: getUploadForm(req.session),
            sidemessage: getSideMessage('latest')
        });
    });
}

exports.userImages = function(req, res) {
    var username = req.session.user ? req.session.user.name : null;
    // TODO remove magick numbers. Move them to configuraion
    // TODO escape userid
    user_images.getUserImages(req.params.userid, 0, 49, function(error, data) {
        res.render('image_list', { title: 'Cloudstagram', data: data, username: username });
    });
};

exports.userProfile = function(req, res) {
    var username = req.session.user ? req.session.user.name : null;
    var profileUser = req.params.userid;
    
    // TODO remove magick numbers. Move them to configuraion
    // TODO escape userid
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
            loggedinuser: view_helpers.loggedinuser
        });

        res.render('profile', { 
            title: 'Cloudstagram', 
            data: info, 
            username: username,
            profileUser: profileUser,
            renderedImages: renderedImages
        });
    });
};

/*
 * POST handles image upload
 */
exports.upload = function(req, res, next) {
    var tmpPath = req.files.image.path;
    var comment = sanitize(req.body.comment || "").xss();
    var filename = generateNewFileName();
    var username = req.session.user.name;

    mime.fileWrapper(tmpPath, function (error, mime) {
        image_storage.storeFile(tmpPath, filename, mime, function(error, data) {
            if (error) {
                console.log(error);
                req.session.upload_error = "There was an error uploading your image";
            } else {
                fs.unlink(tmpPath);
                thumper.publishMessage('cloudstagram-upload', {
                    userid: username, 
                    filename: data.filename,
                    comment: comment,
                    uploaded: Date.now()
                }, '');
                delete req.session.upload_error;
            }
            res.redirect('back');
        });
    });
};

exports.serveFile = function(req, res, next) {
    var filename = req.param('size') == 'small' ? 'small_' + req.params.id : req.params.id;
    image_storage.readGsFile(filename, function(error, gsData) {
        sendFile(res, gsData.binary, gsData.gsObject.contentType, HTTPStatus.OK);
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