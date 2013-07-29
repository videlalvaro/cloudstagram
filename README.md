# Cloudstagram #

[Cloudstagram](http://cloudstagram.cfapps.io) is a Realtime Image Sharing Application that runs on [Cloud Foundry](http://cloudfoundry.com/).

With this app you can:

- Register your own user
- Upload Images including a comment.
- Follow other users
- Like Images

![Cloudstagram](https://bitbucket.org/videlalvaro/cloudstagram/raw/68fb5f131d4f/cloudstagram.png)

## Features ##

__Latest Images__: if you are on the [latest images tab](http://cloudstagram.cloudfoundry.com/latest) of Cloudstagram then you will see new images in realtime as they are uploaded by users. As a logged out user you are by default in the latest images view.

__User Timeline__: Once you log in you will land in your own timeline. This timeline includes your picutres and the pictures of the users that you follow. It's normal that once you log in for the first time you won't see any pictures there.

__User Profiles__: Each user has it's own profile where you can see information like amount of uploaded images, amount of followers and amount of users followed by the profile owner.

__Followers__: Following an user means that whenever she uploads a new picture that picture will be pushed in _realtime_ to your browser. That means new pictures of that user will be part of your timeline.

__Image Previews__: You can preview images by clicking on their thumbnail.

__Like Images__: You can like an image by double clicking on the picture once you are in preview mode. After the image has been liked you will see that a heart appears bellow the thumbnail with your user name.

## Technology ##

__node.js__: The web application is written in node.js using the express.js web framework.

__sock.js__: Realtime communication is done by using sock.js.

__MongoDB__: MongoDB is used to store and server images inside GridFS. Every time a user uploads a picture an `imageid` is generated. The images are later references by that `imageid`

__Redis__: Main application data is store in Redis including user sessions. The data structure is like this:

- LIST `latest_images`: contains a list of `imageids`. Images are pushed as they become available.
- LIST `username:images`: contains a list of `imageids` uploaded by `username`.
- INCR `username:image_count`: INT with the amount of images uploaded by `username`.
- LIST `username:timeline`: contains a list of `imageids` uploaded by `username` and by the users that she follows.
- LIST `imageid:likes`: contains a list of `usernames` that liked the image.
- LIST `username:likes`: contains a list of `imageids` liked by `username`.
- LIST `username:followers`: contains a list of `usernames` that follow the user.
- LIST `username:follows`: contains a list of `usernames` followed by the user.
- INCR `username:followers_count`: amount of users that follow `username`.
- INCR `username:follows_count`: amount of users that followed by `username`.

__RabbitMQ__: RabbitMQ is used for image post processing and for realtime notifications broadcasting.

Every time a user uploads an image the image is stored into MongoDB. If that operation succeeds then a message is sent to the `cloudstagram-new-image` exchange with the following image metadata:

```javascript
    var fileData = {
        userid: username,
        filename: filename,
        comment: comment,
        uploaded: ISODateString(new Date()),
        mime: mimeType
    }
```

That message is sent to the following queues:

- `add_image_to_user_queue`: The consumers attached to this queue will register the image in Redis. For example the image will be lpushed to the list `username:timeline`. Then it republishes the message to the following exchange: `cloudstagram-broadcast-newimage`.
- `new_image_queue`: In this case the image will be pushed to the `latest_images` list in Redis.
- `image_to_followers_queue`: This consumer does two things. First adds the image to the user followers.

#### Realtime Image Broadcasting ###

The consumers of `add_image_to_user_queue` will publish a message to the `cloudstagram-broadcast-newimage` exchange. That exchange is used to then broadcast the message to the user browsers via sock.js.

In this case to use features of Cloud Foundry like multiple instances we have a `fanout` exchange and then many anonymous queues (one on each instance). Then from every instance we broadcast the changes to the users connected to it via sock.js. Keep in mind that those changes might have happened in possibly a different instance.

- `sockjs_broadcast_to_uploader`: This consumer notifies the uploader that her picture is ready, this displaying it in the browser.
- `sockjs_broadcast_to_anonusers`: This consumer pushes the image to all the non logged in users. In this way they will see that activity is happening in realtime in the site.
- `sockjs_broadcast_to_followers_consumer`: This consumer will push the image to the user followers browsers.

## Pushing the App ##

The app requires that you bind the following services:

- MongoDB
- Redis
- RabbitMQ

To push the app to Cloud Foundry type:

```bash
    cf push
```

## NOTE ##

This project is by no means affiliated with Instagram.

## License ##

See LICENSE.md
