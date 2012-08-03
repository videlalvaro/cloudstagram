var sanitize = require('validator').sanitize
, fs = require('fs')
, ejs = require('ejs');
;

exports.usernamelink = function(username) {
    return "<a class='profileLink' href=/profile/" + sanitize(username).xss() + ">" + sanitize(username).xss() + "</a>";
};

exports.loggedin = function(username) {
    return username ? true : false;
};
    
exports.getLoggedinUser = function(username) {
    return username ? sanitize(username).xss() : "";
};

exports.renderTemplate =  function(template, options) {
    //TODO make options optional doh!
    var str = fs.readFileSync(__dirname + '/../views/' + template + '.ejs', 'utf8');
    return ejs.render(str, options);
};

exports.getImageBoxTemplate = function(){
    return fs.readFileSync(__dirname + '/../public/javascripts/image_box.ejs', 'utf8');
};

exports.getUserForm = function(session, action, error, prevAction) {
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
};

exports.getSideForm = function(session) {
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
};

exports.getSideMessage = function(message) {
    return view_helpers.renderTemplate(message, {
    });
};

exports.getWelcomeMessage = function(user) {
    return user ? 'welcome' : 'welcome_visitor';
};

exports.imageList = function(session, username, welcome_msg) {
    return function(error, data) {
        res.render('image_list', { 
            title: 'Cloudstagram', 
            data: data, 
            username: username,
            sideform: view_helpers.getSideForm(session),
            sidemessage: view_helpers.getSideMessage(welcome_msg),
            imageBoxTemplate: view_helpers.getImageBoxTemplate()
        });
    };
};