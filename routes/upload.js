var format = require('util').format;

/*
 * POST handles image upload
 */

exports.upload = function(req, res, next) {
  // the uploaded file can be found as `req.files.image` and the
  // title field as `req.body.title`
  res.send(format('\nuploaded %s (%d Kb) to %s as %s'
    , req.files.image.name
    , req.files.image.size / 1024 | 0
    , req.files.image.path
    , req.body.title));
};