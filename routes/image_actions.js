var image_storage = require('../lib/image_storage.js')
, user_interactions = require('../lib/user_interactions.js')
;

exports.likeImage = function(req, res) {
    var username = req.session.user.name;
    var imageid = req.params.imageid;
    user_interactions.likeImage(username, imageid, function(error, data){
        error ? res.send(500) : res.send(204);
    });
};

exports.deleteImage = function (req, res) {
    console.log("deleteImage: ", req.params.imageid);
    image_storage.deleteImage(req.params.imageid, function(error, result) {
        console.log("deleteImage: ", result);
        error 
            ? res.send('Failed to delete image', 500) 
            : res.send('Image Deleted', 200);
    });
};