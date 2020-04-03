
const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io').listen(5000); //(server);
const port = 8001;
const path = require('path');
// var fs = require('fs');

const { processTweet, startStream, getStream, getInitialTweet, getNextData } = require('./twitter');

io.on('connection', function(socket) {
    var STRM = undefined,
        stopStream = () => {
            if(STRM){ 
                STRM.stop();
                STRM = undefined;
            }
        },
        socketStream = () => {
            startStream(STRM, (data) => {
                if(STRM) socket.emit('new-tweets', { 'tweet': processTweet(data)});
            }, () => {
                stopStream();
                STRM = getStream(query.text);
                socketStream();
            })
        };

    socket.on('message', (query) => {
        if(query.type === 'query'){
            if(STRM) stopStream();
            getInitialTweet(query.text, (data) => {
                var i = 0,
                maxId = data.search_metadata.next_results.split('&')[0].split('=')[1],
                tempArray = [];
                for(; i<data.statuses.length; i++)
                    tempArray.push(processTweet(data.statuses[i]))
        
                socket.emit('tweet', {tweet: tempArray, maxId: maxId});
            });
        }
        else if(query.type === 'stream'){
            STRM = getStream(query.text);
            socketStream();
        }
        else if(query.type === 'loadmore'){
            // console.log(query.next)
            getNextData(query.text, query.maxId, (data) => {
                var i = 0,
                    maxId = data.search_metadata.next_results.split('&')[0].split('=')[1],
                    tempArray = [];
                    for(; i<data.statuses.length; i++)
                        tempArray.push(processTweet(data.statuses[i]));

                socket.emit('append', {tweet: tempArray, maxId: maxId});
                if(!STRM){
                    STRM = getStream(query.text);
                    socketStream();
                }
            });
        }
    });

    socket.on('disconnect', () => {
        stopStream();
    });
});


app.use('/static', express.static('frontend/build/static'));
app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, 'frontend/build', 'index.html'));
});

// listen for requests :)
const listener = server.listen(port, function() {
	console.log('Your app is listening on port ' + listener.address().port);
});
