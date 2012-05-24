jQuery(document).ready(function() {
    var imageBoxTemplate;

    var likeImage = function(event){
        var img = jQuery(event.target);
        var imageid = img.attr('data-id');
        
        if (jQuery("#" + loggedinuser + "-liked-" + imageid).length > 0) {
            console.log("likes pic already");
            return;
        }

        console.log(imageid);

        jQuery.post('/like/'+ imageid, function () {
            //TODO display notification
            var likesul = jQuery('#likes-' + imageid);
            
            console.log("heart exists?: ", jQuery('#heart-' + imageid).length);
            if (jQuery('#heart-' + imageid).length == 0) {
                likesul.prepend('<span id="heart-' + imageid+ '" class="heart"><i class="icon-heart"></i></span>');
            }

            var likesHeart = jQuery('#heart-' + imageid);

            likesHeart.after("<li><span id='" + loggedinuser + "-liked-" + imageid + "'>"
                             + "<a href='/profile/" + loggedinuser + "'>" + loggedinuser + "</a>"
                             + "</span></li>");
            
            console.log("liked: ", imageid);
            $('#image-list').masonry('reload');
        });
    };

    function displayAlert(id, type, message) {
        var html = "<div id='" + id + "' class='alert alert-" + type + "'>" 
            + "<button class='close' data-dismiss='alert'>×</button>"
            + message + "</div>";

        jQuery("#info-box").prepend(html);
        jQuery("#" + id).click(function (){
            jQuery(this).remove();
        })
    }
    
    function notifyUploadResult(id, type, message) {
        displayAlert(id, type, message);
        document.getElementById('upload-form').reset();
        jQuery('#upload-button').removeAttr('disabled');
    }

    jQuery.timeago.settings.strings = {
        prefixAgo: null,
        prefixFromNow: null,
        suffixAgo: null,
        suffixFromNow: null,
        seconds: "%ds",
        minute: "1m",
        minutes: "%dm",
        hour: "1h",
        hours: "%dh",
        day: "a day",
        days: "%dd",
        month: "about a month",
        months: "%dmonths",
        year: "about a year",
        years: "%dyears",
        wordSeparator: " ",
        numbers: []
    };
    jQuery("abbr.timeago").timeago();

    jQuery("button.close").click(function (event) {
        jQuery(event.target).parent().remove();
    });

    $('#image-list').masonry({
        itemSelector : '.imagebox',
        columnWidth : 240,
        isAnimated: true
    });

    function renderImage(template, options) {
        var html = require('ejs').render(template, options);
        $('#image-list').prepend(html).masonry('reload');
        jQuery("abbr.timeago").timeago();
        jQuery(".userimage").dblclick(likeImage);
    };

    var sockUrl = 'http://' + window.location.host +'/broadcast';
    console.log('sockUrl: ', sockUrl);
    var sock = new SockJS(sockUrl);
    sock.onopen = function (event) {
        var username = loggedin ? loggedinuser : "anon";
        sock.send('auth|'+ username);
    };
    sock.onmessage = function (event) {
        console.log("onmessage: ", event.data);
        var parts = event.data.split('|');
        switch(parts[0]) {
          case 'auth':
            console.log('connected to sockjs');
            jQuery('#upload-button').removeAttr('disabled');
            break;
          case 'new_pic':
            var img = JSON.parse(parts[1]);

            //if the image is present don't append it
            if(jQuery('#box-' + img.filename).length != 0) {
                 break;
            }

            var templateOptions = {
                image: {
                    path: img.filename,
                    comment: img.comment,
                    username: img.userid,
                    uploaded: img.uploaded,
                },
                data: {}
            };

            // We do it this way so we can cache the template.
            //TODO fade away the upload confirmation since we don't need it now that 
            // we display the actual image
            if (imageBoxTemplate) {
                renderImage(imageBoxTemplate, templateOptions);
            } else {
                jQuery.get('/javascripts/image_box.ejs', function(imageBoxTemplate) {
                    renderImage(imageBoxTemplate, templateOptions);
                });
            }
            break
        default:
            console.log('got sockjs message: ', event.data);
        }
    };

    if (!loggedin) {
        jQuery('.show-form').click(function (event) {
            var elem = jQuery(event.target);
            var action = elem.attr('href').substring(1);
            var hide = action == 'login' ? 'register' : 'login';
            var toHide = jQuery('#' + hide + '-form');
            var toShow = jQuery('#' + action + '-form');
            
            if (!toHide.hasClass('hidden')) {
                toHide.addClass('hidden');
            }

            if (toShow.hasClass('hidden')) {
                toShow.removeClass('hidden');
            }
            event.preventDefault();
        });
    }

    if (loggedin) {
        jQuery('#upload-form').ajaxForm({
            beforeSubmit: function (){
                jQuery('#file-upload-error').addClass('hidden');
                jQuery("#file-control-group").removeClass('error');
                if (jQuery("input:file").val() == "") {
                    jQuery("#file-control-group").addClass('error');
                    jQuery("#file-error-message").removeClass('hidden');
                    return false;
                }
                
                jQuery('#upload-button').attr('disabled', 'disabled');
                return true;
            },
            success: function (data, statusText) {
                console.log('statusText: ', statusText);
                var parts = data.split('|');

                notifyUploadResult(parts[2], parts[0], parts[1]);
            },
            error: function(response, status, err){
                var parts = response.responseText.split('|');
                if (parts.length == 3) {
                    //if known error use info from server
                    notifyUploadResult(parts[2], parts[0], parts[1]);
                } else {
                    notifyUploadResult('upload-error', 'error', 
                                       'There was an error while uploading your picture. '
                                       + 'Please try again later.');    
                }
            }
        });

        jQuery('#image-comment').keyup(function() {
            var len = this.value.length;
            if (len >= 140) {
                this.value = this.value.substring(0, 140);
            }
            var charsLeft = 140 - len;
            jQuery('#charsLeft').text('(' + charsLeft + ')');
        });

        jQuery(".userimage").dblclick(likeImage);

        //user profile actions
        if (typeof profileUser !== "undefined") {
            if (profileUser != loggedinuser) {
                jQuery.get('/isfollower/' + profileUser, function (data) {
                    if (data == "YES") {
                        $("#alreadyfollow").removeClass("hidden");
                    } else {
                        $("#followform").removeClass("hidden");
                    }
                });   
            }

            jQuery(".follow").click(function (event){
                var userid = jQuery(event.target).attr('data-id');
                jQuery.post('/follow/' + userid, function (data) {
                    console.log("follow result: ", data);
                    if (data == "OK") {
                        jQuery("#followform").addClass('hidden');
                        jQuery("#alreadyfollow").removeClass('hidden');
                    } else {
                        console.log("follow failed");
                    }
                })
            });
        }
    }
});