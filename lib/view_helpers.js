var sanitize = require('validator').sanitize
, fs = require('fs')
, ejs = require('ejs');
;

function usernamelink(username) {
    return "<a class='profileLink' href=/profile/" + sanitize(username).xss() + ">" + sanitize(username).xss() + "</a>";
};

function loggedin(username) {
    return username ? true : false;
};
    
function getLoggedinUser(username) {
    return username ? sanitize(username).xss() : "";
};

function renderTemplate(template, options) {
    //TODO make options optional doh!
    var str = fs.readFileSync(__dirname + '/../views/' + template + '.ejs', 'utf8');
    return ejs.render(str, options);
};

function getImageBoxTemplate(){
    return fs.readFileSync(__dirname + '/../public/javascripts/image_box.ejs', 'utf8');
};

function getUserForm(session, action, error, prevAction) {
    var ishidden;
    var errorMsg = action == prevAction ? error : null;
    
    if (typeof session.prevAction === "undefined") {
        //if no previous action then hide register form
        ishidden = action == "register";
    } else {
        ishidden = action != session.prevAction;
    }

    return renderTemplate('user_form', {
        action: action,
        error: errorMsg,
        ishidden: ishidden
    });
};

function getSideForm(session) {
    if (session.user) {
        return renderTemplate('upload_form', {
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

function getSideMessage(message) {
    return renderTemplate(message, {});
};

function getWelcomeMessage(user) {
    return user ? 'welcome' : 'welcome_visitor';
};

function imageList(res, session, username, welcome_msg) {
    return function(error, data) {
        res.render('image_list', { 
            title: 'Cloudstagram', 
            data: data, 
            username: username,
            sideform: getSideForm(session),
            sidemessage: getSideMessage(welcome_msg),
            imageBoxTemplate: getImageBoxTemplate()
        });
    };
};

exports.usernamelink = usernamelink;
exports.loggedin = loggedin;
exports.getLoggedinUser = getLoggedinUser;
exports.renderTemplate = renderTemplate;
exports.getImageBoxTemplate = getImageBoxTemplate;
exports.getUserForm = getUserForm;
exports.getSideForm = getSideForm;
exports.getSideMessage = getSideMessage;
exports.getWelcomeMessage = getWelcomeMessage;
exports.imageList = imageList;