/**
 * Module dependencies.
 */

var express = require('express')
, dateformat = require('dateformat')
, routes = require('./routes') //TODO separate routes in specific controllers
, login = require('./routes/login.js')
, resize = require('./lib/resize.js')
, view_helpers = require('./lib/view_helpers.js')
, services = require('./lib/services.js')
, cf_utils = require('./lib/cloudFoundryUtil.js')
;

var RedisStore = require('connect-redis')(express);

var app = module.exports = express.createServer();

app.helpers({
    dateformat: dateformat
});

app.helpers({
    usernamelink: view_helpers.usernamelink
});

app.helpers({
    loggedin: view_helpers.loggedin
});

app.helpers({
    loggedinuser: view_helpers.loggedinuser
});

app.dynamicHelpers({
    session: function(req, res){
        return req.session;
    }
});

// Configuration

function getSessionOptions() {
    var cf_creds = cf_utils.getRedisCredentials();
    
    var redisCreds = {
        host: cf_creds.hostname,
        port: cf_creds.port,
        pass: cf_creds.password
    };

    var redisOpts = {
        client: services.getRedisClient();  
    };

    var sessOpts = {
        secret: "cloudstagram secret sauce",
        store: new RedisStore(redisOpts)
    };
    
    if (process.env.stickySession && process.env.stickySession == "ON") {
        sessOpts.key = 'csessionid';
    }

    return sessOpts;
}

app.configure(
    function() {
        app.set('views', __dirname + '/views');
        app.set('view engine', 'ejs');
        app.set('view options', {
            layout: true
        });
        app.use(express.static(__dirname + '/public'));
        app.use(express.bodyParser());
        app.use(express.cookieParser());
        app.use(express.session(getSessionOptions()));
        app.use(express.methodOverride());
        app.use(app.router);
    }
);

app.configure('development', function(){
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
    app.use(express.errorHandler());
});

function restrict(req, res, next) {
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

// Routes
app.get('/', routes.index);
app.get('/image/:id', routes.serveFile);
app.get('/profile/:userid', routes.userProfile);
app.get('/latest', routes.latestImages);

// Logged out only routes
app.post('/register', loggedoutOnly, login.addUser);
app.post('/login', loggedoutOnly, login.auth);

// Secure routes
app.post('/upload', restrict, routes.upload);
app.get('/logout', restrict, login.logout);
app.post('/like/:imageid', restrict, routes.likeImage);
app.get('/isfollower/:userid', restrict, routes.isFollower);
app.post('/follow/:userid', restrict, routes.followUser);

/**
 * Start the app only if connected to mongodb and rabbitmq
 */
services.getMongoDbConnection(function(err, db) {
    if (db) {
        services.getRabbitMqConnection(function(conn) {
            if (conn) {
                app.listen(3000, function(){
                    resize.startConsumers();
                    console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
                })
            } else {
                console.log("failed to connect to rabbitmq");
            }
        });
    } else {
        console.log("failed to connect to mongodb: ", err);
    }
});
