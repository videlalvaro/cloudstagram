/**
 * Module dependencies.
 */

var express = require('express')
, routes = require('./routes')
, resize = require('./lib/resize.js')
;

var RedisStore = require('connect-redis')(express);

var app = module.exports = express.createServer();

// Configuration

app.configure(
    function() {
        app.set('views', __dirname + '/views');
        app.set('view engine', 'ejs');
        app.set('view options', {
            layout: false
        });
        app.use(express.bodyParser());
        app.use(express.cookieParser());
        app.use(express.session({ secret: "cloudstagram secret sauce", store: new RedisStore }));
        app.use(express.methodOverride());
        app.use(app.router);
        app.use(express.static(__dirname + '/public'));
    }
);

app.configure('development', function(){
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
    app.use(express.errorHandler());
});

// Routes

app.get('/', routes.index);
app.post('/upload', routes.upload);
app.get('/image/:id', routes.serveFile);

app.listen(3000, function(){
    resize.startConsumers();
    console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
});
