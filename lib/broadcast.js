var sockjs = require('sockjs');

module.exports = function () {
    
    var broadcast = sockjs.createServer({jsessionid: true});
    broadcast.anonClients = [];
    broadcast.users = {};

    broadcast.on('connection', function (conn) {
        conn.on('close', function () {
            var index = broadcast.anonClients.indexOf(conn);
            if (-1 !== index) {
                broadcast.anonClients.splice(index, 1);
            }

            Object.keys(broadcast.users).forEach(function loop(key) {
                if(loop.stop){ return; }

                if (broadcast.users[key] == conn) {
                    delete broadcast.users[key];
                    loop.stop = true;
                };
            });
        });
        
        conn.on('data', function(message){
            var parts = message.split('|');
            switch(parts[0]) {
              case 'auth':
                if (parts[1] == 'anon') {
                    broadcast.anonClients.push(conn);
                } else {
                    broadcast.users[parts[1]] = conn;
                }
                conn.write("auth|ok");
                break;
            default:
                console.log("sockjs got data: ", message);
            }
        });
    });

    broadcast.sendToUser = function (user, type, message) {
        var data = type + '|' + message;
        console.log('sending data: ', data);
        try {
            if (broadcast.users[user]) {
                broadcast.users[user].write(data);
            }
        } catch (err) {
            console.log(err);
        }
    };

    broadcast.sendToAnon = function (type, message) {
        this.anonClients.forEach(function (conn) {
            conn.write(type + '|' + message);
        });
    };

    return broadcast;
};