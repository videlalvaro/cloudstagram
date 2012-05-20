var bcrypt = require('bcrypt')
, redis = require('redis')
, sanitize = require('validator').sanitize
;

function userKey(username) {
    return "user:" + username;
}

// Used to generate a hash of the plain-text password + salt
function hash(pass, salt) {
    return bcrypt.hashSync(pass, salt);
}

function generateSalt() {
    return bcrypt.genSaltSync(10);
}

// Authenticate using our plain-object database of doom!
function authenticate(name, pass, fn) {
    console.log('authenticating %s:%s', name, pass);
    //get user from redis. User is a hash
    var client = redis.createClient();
    client.HGETALL([userKey(name)], function (err, obj) {
        client.quit();
        if (err || obj == null) {
            console.log('cannot find user');
            return fn(new Error('cannot find user'));
        } else {
            console.log("got reply: ", obj);
            var user = {
                name: obj.name.toString(),
                salt: obj.salt.toString(),
                pass: obj.pass.toString()
            };
            if (user.pass == hash(pass, user.salt)) return fn(null, user);
            fn(new Error('invalid password'));
        }
    });
}

exports.addUser = function(req, res) {
    console.log("addUser: ", req.body.username, req.body.password);
    var username = sanitize(req.body.username).xss();
    var password = req.body.password;
    var client = redis.createClient();
    
    client.exists(userKey(username), function(error, data) {
        if (data != 1) {
            var salt = generateSalt();
            user = {
                name: username,
                salt: salt,
                pass: hash(password, salt)
            };
            client.hmset(userKey(username), user, function(error, reply) {
                if (reply == "OK") {
                    client.quit();
                    req.session.user = user;
                    console.log("redirect after success");
                    res.redirect('back');
                } else {
                    req.session.error = "Can't create user. Please try again later";
                    req.session.prevAction = 'register';
                    console.log("redirect cannot create user");
                    res.redirect('back');
                }
            });
        } else {
            req.session.error = "Username: " + username + " already exists." +                
                "Please try again with a different user name ";
            req.session.prevAction = 'register';
            console.log("redirect user exists");
            res.redirect('back');
        }
    });
};

exports.auth = function(req, res) {
    authenticate(req.body.username, req.body.password, function(err, user){
        if (user) {
            // Regenerate session when signing in
            // to prevent fixation 
            req.session.regenerate(function(){
                req.session.user = user;
                res.redirect('back');
            });
        } else {
            console.log('auth error:', err);
            req.session.error = 'Authentication failed, please check your '
                + ' username and password.';
            req.session.prevAction = 'login';
            res.redirect('back');
        }
    });
};

exports.logout = function(req, res) {
    req.session.destroy(function() {
        res.redirect('/');
    });
};