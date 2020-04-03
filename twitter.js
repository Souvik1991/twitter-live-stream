const Twit = require('twit');
const date = require('date-and-time');

var TWITTER_CONSUMER_KEY = 'EAW0nwPSEH9mnDpHRnwC74EQg', //'0XG5299e6oSESyHvLGIMGmwW3',
TWITTER_CONSUMER_SECRET = 'hGLAtrsew6sOnawdpxaaiJFl5zjLHw1cIYv5m22U7OwYOIhKzn', //'kh08Sydpo5hYYr0DCY8i7oJRAbxNkI1NKNpdStVi08ICIwBUOW',
TWITTER_ACCESS_TOKEN = '93469909-y4lWK4FjZhqbRj7Z2WTboeTDYB9ktwf3cH8RfFETD', //'3097151617-91Ayf0gu7O81oe6ae3quLPX5cxYkf7pZlkNZ09h',
TWITTER_ACCESS_TOKEN_SECRET = 'vfNQeTHtMTeYKHXHVe7QYCQsjMUkbF3NWQjQn9NdtiNhu', //'TPnK7IgPW0TB0m9NemXiyKAlZC6rBRpqi56w7sDhVxEgl',
T = new Twit({
	consumer_key: TWITTER_CONSUMER_KEY, 
	consumer_secret: TWITTER_CONSUMER_SECRET, 
	access_token: TWITTER_ACCESS_TOKEN, 
	access_token_secret: TWITTER_ACCESS_TOKEN_SECRET,
	timeout_ms: 60*1000,  // optional HTTP request timeout to apply to all requests.
});

exports.processTweet = function(tweet){
	var dt;
	if(tweet.created_at){
		dt = tweet.created_at.split(' ');
		dt.splice(0, 1);
		dt = dt.join(' ');
	}
	else dt = undefined;

	return {
		id: tweet.id_str,
		text: tweet.extended_tweet ? tweet.extended_tweet.full_text : tweet.text,
		entities: tweet.extended_tweet ? tweet.extended_tweet.entities : tweet.entities,
		retweet: tweet.retweet_count,
		favorite: tweet.favorite,
		date: dt ? date.format(date.parse(dt, 'MMM DD HH:mm:ss Z YYYY'), 'YYYY/MM/DD HH:mm:ss Z') : date.format(new Date(), 'YYYY/MM/DD HH:mm:ss Z'), // "Wed Jun 06 20:07:10 +0000 2012",
		user: {
			id: tweet.user.id,
			name: tweet.user.name,
			username: tweet.user.screen_name,
			pic: tweet.user.profile_image_url,
			verified: tweet.user.verified,
		}
	}
}

exports.getStream = function(query){
	return T.stream('statuses/filter', { track: query });
};

exports.startStream = function(stream, callback, close){
	stream.on('tweet', function(tweet){
		callback(tweet);
	});

	stream.on('disconnect', function(){
		close();
	});
};

exports.getInitialTweet = function(query, callback){
	T.get('search/tweets', { q: query, count: 25 }, function(err, data, response) {
		// console.log(JSON.stringify(data));
		callback(data);
	});
};

exports.getNextData = function(query, maxId, callback){
	T.get('search/tweets', { q: query, max_id: maxId, count: 25 }, function(err, data, response) {
		callback(data);
	});
};
