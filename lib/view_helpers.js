exports.usernamelink = function(username) {
    return "<a href=/profile/" + username + ">" + username + "</a>";
};

exports.loggedin = function(username) {
    return username ? true : false;
};
    
exports.loggedinuser = function(username) {
    return username ? username : "";
};