var user_interactions = require('../lib/user_interactions.js');

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