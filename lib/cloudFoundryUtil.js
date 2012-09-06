var cloudfoundry = require('cloudfoundry');

function getRabbitUrl(rabbitServiceName) {
    return "amqp://localhost";
}

function getRedisCredentials(redisServiceName) {
    var credentials = {};
    if (cloudfoundry.cloud && cloudfoundry.redis) {
	var service;
	if(redisServiceName) {
	    service = cloudfoundry.redis[redisServiceName];
	} else {//select first one
	    for( var name in cloudfoundry.redis) {
		service = cloudfoundry.redis[name];
		break;
	    };			
	}
	if(service) {
	    credentials = service.credentials;
	}
    }
    return credentials;
}

function getMongoCredentials(dbServiceName) {
    return {
        "hostname": "localhost",
        "port": 27017,
        "name": "",
        "db": "cloudstagram"
    };
}

function getMongoUrl(dbServiceName) {
    var credentials = getMongoCredentials();
    var mongoUrl = "mongodb://" + credentials.hostname
        + ":" + credentials.port + "/" + credentials.db;

    console.log("MongoUrl: " + mongoUrl);
    return mongoUrl;
}

function getInstanceId() {
    if (cloudfoundry.cloud) {
        return cloudfoundry.app.instance_id;
    } else {
        return "pid-" + process.pid;
    }
}

exports.getRabbitUrl = getRabbitUrl;
exports.getRedisCredentials = getRedisCredentials;
exports.getMongoCredentials = getMongoCredentials;
exports.getMongoUrl = getMongoUrl;
exports.getInstanceId = getInstanceId;