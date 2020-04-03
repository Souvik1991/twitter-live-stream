const Twit = require('twit');
const date = require('date-and-time');

var TWITTER_CONSUMER_KEY = '< YOUR TWITTER_CONSUMER_KEY >', 
TWITTER_CONSUMER_SECRET = '< YOUR TWITTER_CONSUMER_SECRET >', 
TWITTER_ACCESS_TOKEN = '< YOUR TWITTER_ACCESS_TOKEN >', 
TWITTER_ACCESS_TOKEN_SECRET = '< YOUR TWITTER_ACCESS_TOKEN_SECRET >', 
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
