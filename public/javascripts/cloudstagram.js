jQuery.timeago.settings.strings = {
    prefixAgo: null,
    prefixFromNow: null,
    suffixAgo: null,
    suffixFromNow: null,
    seconds: "%s",
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

$(document).ready(function() {
    jQuery("abbr.timeago").timeago();
    
    if (loggedin) {
        jQuery(".userimage").dblclick(function (event){
            var imageid = jQuery(event.target).attr('data');
            jQuery.post('/like/'+ imageid, function () {
                //TODO display notification
                console.log("liked: ", imageid);
            });
            
        });

        jQuery(".follow").click(function (event){
            var userid = jQuery(event.target).attr('data');
            jQuery.post('/follow/' + userid, function () {
                console.log("followed: ", userid);
            })
        });
    }
});