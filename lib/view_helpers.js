var sanitize = require('validator').sanitize;

exports.usernamelink = function(username) {
    return "<a href=/profile/" + sanitize(username).xss() + ">" + sanitize(username).xss() + "</a>";
};

exports.loggedin = function(username) {
    return username ? true : false;
};
    
exports.loggedinuser = function(username) {
    return username ? sanitize(username).xss() : "";
};