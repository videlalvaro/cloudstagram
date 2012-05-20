jQuery(document).ready(function() {
    if (loggedin) {
        jQuery.get('/isfollower/' + profileUser, function (data) {
            console.log("isfollower: ", data);
            if (data == "YES") {
                $("#alreadyfollow").removeClass("hidden");
            } else {
                $("#followform").removeClass("hidden");
            }
        });
    }
});