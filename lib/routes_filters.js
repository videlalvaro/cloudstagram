function loggedinOnly(req, res, next) {
    if (req.session.user) {
        next();
    } else {
        req.session.error = 'Access denied!';
        res.redirect('/login');
    }
}

function loggedoutOnly(req, res, next) {
    if(req.session.user) {
        res.redirect('/');
    } else {
        next();
    }
}

exports.loggedinOnly = loggedinOnly;
exports.loggedoutOnly = loggedoutOnly