var vcap_services = JSON.parse(process.env.VCAP_SERVICES);
var vcap_application = JSON.parse(process.env.VCAP_APPLICATION);

function getRabbitUrl(rabbitServiceName) {
    return vcap_services['cloudamqp-n/a'][0]['credentials']['uri'];
}

function getRedisCredentials(redisServiceName) {
    console.log(vcap_services['rediscloud-n/a'][0]['credentials']);
    return vcap_services['rediscloud-n/a'][0]['credentials'];
}

function getMongoUrl(dbServiceName) {
    return vcap_services['mongolab-n/a'][0]['credentials']['uri'];
}

function getInstanceId() {
    return vcap_application['instance_id'];
}

exports.getRabbitUrl = getRabbitUrl;
exports.getMongoUrl = getMongoUrl;
exports.getRedisCredentials = getRedisCredentials;
exports.getInstanceId = getInstanceId;