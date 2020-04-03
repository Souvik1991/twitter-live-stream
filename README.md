This code uses node.js twitter api client called twit. Once you search a query it starts the streaming, it uses socket.io for server side streaming push.

1. Clone the project 

2. <code>npm install</code>

3. open <code>index.js</code>

4. Place your access tokens and keys here

```
var TWITTER_CONSUMER_KEY = '< YOUR TWITTER_CONSUMER_KEY >', 
  TWITTER_CONSUMER_SECRET = '< YOUR TWITTER_CONSUMER_SECRET >', 
  TWITTER_ACCESS_TOKEN = '< YOUR TWITTER_ACCESS_TOKEN >', 
  TWITTER_ACCESS_TOKEN_SECRET = '< YOUR TWITTER_ACCESS_TOKEN_SECRET >', 

  var T = new Twit({
    consumer_key:         TWITTER_CONSUMER_KEY,
    consumer_secret:      TWITTER_CONSUMER_SECRET,
    access_token:         TWITTER_ACCESS_TOKEN,
    access_token_secret:  TWITTER_ACCESS_TOKEN_SECRET,
    timeout_ms:           60*1000,  // optional HTTP request timeout to apply to all requests.
  });
```

5. <code> node index.js </code>

Build the frontend present inside the frontend folder, by following the below steps:

1. <code>npm install</code>

2. <code>npm run build</code> to build the react project
