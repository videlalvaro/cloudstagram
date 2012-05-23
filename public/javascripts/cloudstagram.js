jQuery(document).ready(function() {
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
    
    var imageList = $('#image-list');

    imageList.masonry({
        itemSelector : '.imagebox',
        columnWidth : 240,
        isAnimated: true
    });

    var imageBoxTemplate;

    function renderTempalte(template, options) {
        var html = require('ejs').render(template, options);
        imageList.prepend(html).masonry('reload');
        jQuery("abbr.timeago").timeago();
    };

    //TODO use VCAP port
    var sock = new SockJS('http://localhost:3000/broadcast');
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
                renderTempalte(imageBoxTemplate, templateOptions);
            } else {
                jQuery.get('/javascripts/image_box.ejs', function(imageBoxTemplate) {
                    renderTempalte(imageBoxTemplate, templateOptions);
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
            success: function (data) {
                var parts = data.split('|');
                var html = "<div id='" + parts[2] + "' class='alert alert-" + parts[0] + "'>" 
                    + "<button class='close' data-dismiss='alert'>×</button>"
                    + parts[1] + "</div>";
                
                jQuery("#info-box").prepend(html);
                jQuery("#" + parts[2]).click(function (){
                    jQuery(this).remove();
                });

                document.getElementById('upload-form').reset();
                jQuery('#upload-button').removeAttr('disabled');
            }
        });
        
        //TODO add register and login form validation

        jQuery('#image-comment').keyup(function() {
            var len = this.value.length;
            if (len >= 140) {
                this.value = this.value.substring(0, 140);
            }
            var charsLeft = 140 - len;
            jQuery('#charsLeft').text('(' + charsLeft + ')');
        });


        jQuery(".userimage").dblclick(function (event){
            var img = jQuery(event.target);
            var imageid = img.attr('data-id');
            
            if (jQuery("#" + loggedinuser + "-liked-" + imageid).length > 0) {
                console.log("likes pic already");
                return;
            }

            jQuery.post('/like/'+ imageid, function () {
                //TODO display notification
                var likesul = jQuery('#likes-' + imageid);

                
                console.log("heart exists?: ", jQuery('#heart-' + imageid).length);
                if (jQuery('#heart-' + imageid).length == 0) {
                    likesul.prepend('<span id="heart-' + imageid+ '" class="heart"><i class="icon-heart"></i></span>');
                }

                var likesHeart = jQuery('#heart-' + imageid);

                likesHeart.after("<li><span id='" + loggedinuser + "-liked-" + imageid + "'>"
                                + "<a href='/images/" + loggedinuser + "'>" + loggedinuser + "</a>"
                                + "</span></li>");
                
                console.log("liked: ", imageid);
            });
        });
    }
});