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
    
exports.loggedinuser = function(username) {
    return username ? sanitize(username).xss() : "";
};

exports.renderTemplate =  function(template, options) {
    var str = fs.readFileSync(__dirname + '/../views/' + template + '.ejs', 'utf8');
    return ejs.render(str, options);
};

exports.getImageBoxTemplate = function(){
    return fs.readFileSync(__dirname + '/../public/javascripts/image_box.ejs', 'utf8');
}