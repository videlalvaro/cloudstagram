//This is a DB utility module.. Currently it supports MongoDB but will support others soon
//todo need to refactor

var cloudfoundry = require('cloudfoundry');
var mongodb = require('mongodb').Db;

module.exports = {
    getMongoUrl: getMongoUrl,
    getRabbitUrl: getRabbitUrl,
    getRedisCredentials: getRedisCredentials
};

function getMongoUrl(dbServiceName) {
    var mongoUrl;
    //default
    var credentials = {
        "hostname": "localhost",
        "port": 27017,
        "username": "",
        "password": "",
        "name": "",
        "db": "cloudstagram"
    }
    if (cloudfoundry.cloud && cloudfoundry.mongodb) {
	var service;
	if(dbServiceName) {
	    service = cloudfoundry.mongodb[dbServiceName];
	} else {//select first one
	    for( var name in cloudfoundry.mongodb) {
		service = cloudfoundry.mongodb[name];
		break;
	    };			
	}
	if(service) {
	    credentials = service.credentials;
	}
    }
    if (credentials.username && credentials.password) {
        mongoUrl = "mongodb://" + credentials.username + ":" 
            + credentials.password + "@" + credentials.hostname 
            + ":" + credentials.port + "/" + credentials.db;
    } else {
        mongoUrl = "mongodb://" + credentials.hostname + ":" + credentials.port + "/" + credentials.db;
    }
    console.log("MongoUrl: " + mongoUrl);
    return mongoUrl;
}

function getRabbitUrl(rabbitServiceName) {
    if (process.env.VCAP_SERVICES) {
        conf = JSON.parse(process.env.VCAP_SERVICES);
        return conf['rabbitmq-2.4'][0].credentials.url;
    } else {
        return "amqp://localhost";
    }
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