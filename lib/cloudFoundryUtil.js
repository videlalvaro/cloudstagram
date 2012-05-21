var cloudfoundry = require('cloudfoundry');

module.exports = {
    getRabbitUrl: getRabbitUrl,
    getRedisCredentials: getRedisCredentials
};

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