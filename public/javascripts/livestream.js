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
        handleNewPic(parts[1]);
        break
    default:
        console.log('got sockjs message: ', event.data);
    }
};