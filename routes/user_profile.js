var ejs = require('ejs') 
, user_data = require('../lib/user_data.js')
, view_helpers = require('../lib/view_helpers.js')
;

exports.profile = function(req, res) {
    var username = req.session.user ? req.session.user.name : null;
    var profileUser = req.params.userid;
    
    user_data.getUserData(profileUser, function(error, data) {
        var welcome_msg = req.session.user 
            ? 'welcome' : 'welcome_visitor';
        var sideform = req.session.user 
            ? null : view_helpers.getSideForm(req.session);
        var sidemessage = req.session.user 
            ? null : view_helpers.getSideMessage(welcome_msg);
        
        var renderedImages = view_helpers.renderTemplate('image_list', {
            username: username,
            data: data.images,
            usernamelink: view_helpers.usernamelink,
            loggedin: view_helpers.loggedin,
            loggedinuser: view_helpers.getLoggedinUser(username),
            imageBoxTemplate: view_helpers.getImageBoxTemplate(),
            ejs: ejs
        });

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