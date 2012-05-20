jQuery(document).ready(function() {
    if (loggedin) {
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
});