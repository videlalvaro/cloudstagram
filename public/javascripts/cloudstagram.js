$(document).ready(function() {
    jQuery.timeago.settings.strings = {
        prefixAgo: null,
        prefixFromNow: null,
        suffixAgo: null,
        suffixFromNow: null,
        seconds: "%ds",
        minute: "about a minute",
        minutes: "%dm",
        hour: "about an hour",
        hours: "%dh",
        day: "a day",
        days: "%dd",
        month: "about a month",
        months: "%dm",
        year: "about a year",
        years: "%dy",
        wordSeparator: " ",
        numbers: []
    };
    jQuery("abbr.timeago").timeago();
    
    if (loggedin) {
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

        jQuery(".follow").click(function (event){
            //TODO prevent user from following already followed users
            var userid = jQuery(event.target).attr('data');
            jQuery.post('/follow/' + userid, function () {
                console.log("followed: ", userid);
            })
        });
    }
});