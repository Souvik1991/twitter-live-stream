import React, {Component} from 'react';
import {Helmet} from "react-helmet";
import socketIOClient from "socket.io-client";

import verified from "./image/verified.png";
// import search from "./image/search.svg";

require('./css/base.css');

class TwitterApp extends Component{
	constructor(props){
		super(props);
		this.state = {
			counter: 0,
			uniqueTweetID: [],
			searchText: '',
			tweets: [],
			newlyArrived: [],
			socket: undefined,
			searching: false,
			isLoading: false,
			popup: undefined,
			anchor: undefined,
			maxId: ''
		};
		this.handleScroll = this.handleScroll.bind(this);
	}

	sortWithIndeces(toSort, key) {
		for (var i = 0; i < toSort.length; i++)
			toSort[i] = [toSort[i][key], i];
		
		toSort.sort(function(left, right) {
			return left[0] < right[0] ? -1 : 1;
		});
		toSort.sortIndices = [];
		for (var j = 0; j < toSort.length; j++){
			toSort.sortIndices.push(toSort[j][1]);
			toSort[j] = toSort[j][0];
		}
		return toSort.sortIndices;
	}

	orderArray(tArr, key){
		if(tArr && Array.isArray(tArr) && tArr.length > 1){
			var i = 0,
				newArray = [],
				sortedIndex = [];
			for(; i<tArr.length; i++)
				tArr[i]['len'] = tArr[i][key].length;
			
			sortedIndex = this.sortWithIndeces([...tArr], 'len');
			sortedIndex.reverse();
			for(i=0; i<sortedIndex.length; i++)
				newArray.push(tArr[sortedIndex[i]]);

			tArr = newArray;
		}
		return tArr;
	}

	parseTweetText(text, hashtags, mention, urls, media){
		hashtags = this.orderArray(hashtags, 'text');
		mention = this.orderArray(mention, 'screen_name');
		urls = this.orderArray(urls, 'url');
		media = this.orderArray(media, 'url');
		
		var i;
		if(hashtags.length > 0)
			for(i = 0; i<hashtags.length; i++)
				text = text.replace(new RegExp(`#${hashtags[i].text}`, 'ig'), `<a href="https://twitter.com/hashtag/${hashtags[i].text}/" target="_blank" rel="noopener noreferrer" class="t-link">#${hashtags[i].text}</a>`)
		
		if(mention.length > 0)
			for(i = 0; i<mention.length; i++)
				text = text.replace(new RegExp(`@${mention[i].screen_name}`, 'ig'), `<a href="https://twitter.com/${mention[i].screen_name}" target="_blank" rel="noopener noreferrer" class="t-link">@${mention[i].screen_name}</a>`);

		if(urls.length > 0)
			for(i = 0; i<urls.length; i++)
				text = text.replace(new RegExp(`${urls[i].url}`, 'ig'), `<a href="${urls[i].url}" target="_blank" rel="noopener noreferrer" class="t-link">${urls[i].url}</a>`);

		if(media && media.length > 0)
			for(i = 0; i<media.length; i++)
				text = text.replace(new RegExp(`${media[i].url}`, 'ig'), `<div class="media-cont">${media[i].type === 'photo' ? `<img src="${media[i].media_url}" class="media"/>` : `<video poster="${media[i].media_url}" src="${media[i].display_url}" class="media"></video`}</div>`);

		return text;
	}

	submit(e){
		e.preventDefault();
		this.setState({
			counter: 0,
			uniqueTweetID: [],
			newlyArrived: [],
			searching: true
		}, () => {
			this.state.socket.send({type:'query', text:this.state.searchText});
		});
	}

	parseDate(date){
		// Get timestamps
		var unixTime = new Date(date).getTime();
		if (!unixTime) return;
		var now = new Date().getTime();
	
		// Calculate difference
		var difference = (unixTime / 1000) - (now / 1000);
	
		// Setup return object
		var tfn = {};
	
		// Check if time is in the past, present, or future
		tfn.when = 'now';
		if (difference > 0) {
			tfn.when = 'future';
		} else if (difference < -1) {
			tfn.when = 'past';
		}
	
		// Convert difference to absolute
		difference = Math.abs(difference);
	
		// Calculate time unit
		if (difference / (60 * 60 * 24 * 365) > 1) {
			// Years
			tfn.time = Math.floor(difference / (60 * 60 * 24 * 365));
			tfn.unitOfTime = tfn.time > 1 ? 'years' : 'year';
		} else if (difference / (60 * 60 * 24 * 30) > 1) {
			// Months
			tfn.time = Math.floor(difference / (60 * 60 * 24 * 30));
			tfn.unitOfTime = tfn.time > 1 ? 'months' : 'month';
		} else if (difference / (60 * 60 * 24) > 1) {
			// Days
			tfn.time = Math.floor(difference / (60 * 60 * 24));
			tfn.unitOfTime = tfn.time > 1 ? 'days' : 'day';
		} else if (difference / (60 * 60) > 1) {
			// Hours
			tfn.time = Math.floor(difference / (60 * 60));
			tfn.unitOfTime = tfn.time > 1 ? 'hours' : 'hour';
		} else if (difference / 60 > 1) {
			// Hours
			tfn.time = Math.floor(difference / 60);
			tfn.unitOfTime = tfn.time > 1 ? 'minutes' : 'minute';
		} else {
			// Seconds
			tfn.unitOfTime = 'seconds';
			tfn.time = Math.floor(difference);
		}
	
        // Return time from now data
		return `${tfn.time}${tfn.unitOfTime[0]}`;
	}

	mergeTweets(type){
		if(type && type === 'popup'){
			this.state.popup.classList.remove('appear');
			document.documentElement.scrollTop = 0;
		}

		if(this.state.newlyArrived.length > 0){
			var allTweet = [...this.state.newlyArrived, ...this.state.tweets],
				maxId = this.state.maxId,
				i,
				uniqueTweetID = [];
			// console.log(allTweet);
			if(allTweet.length > 50){ 
				allTweet = allTweet.slice(0, 50);
				maxId = allTweet[allTweet.length - 1].id;
				for(i=0; i<allTweet.length; i++) 
					uniqueTweetID.push(allTweet[i].id)
			}

			this.setState({
				counter: 0,
				newlyArrived: [],
				tweets: [],
				uniqueTweetID: uniqueTweetID,
				maxId: maxId
			}, () => {
				this.setState({
					tweets: allTweet
				})
			})
		}
	}

	getPosition(el){
		var xPos = 0, yPos = 0;
		while (el) {
			if (el.tagName === "BODY") {
				// deal with browser quirks with body/window/document and page scroll
				var xScroll = el.scrollLeft || document.documentElement.scrollLeft;
				var yScroll = el.scrollTop || document.documentElement.scrollTop;

				xPos += el.offsetLeft - xScroll + el.clientLeft;
				yPos += el.offsetTop - yScroll + el.clientTop;
			} else {
				// for all other non-BODY elements
				xPos += el.offsetLeft - el.scrollLeft + el.clientLeft;
				yPos += el.offsetTop - el.scrollTop + el.clientTop;
			}

			el = el.offsetParent;
		}
		return { x: xPos, y: yPos };
	}

	handleScroll(){
		if(this.state.newlyArrived.length > 0){
			var scrollTop = document.documentElement.scrollTop;
			if(scrollTop > 100 && !this.state.popup.classList.contains('appear')) this.state.popup.classList.add('appear');
			else if(scrollTop < 100) this.state.popup.classList.remove('appear');
		}

		if(this.state.anchor){
			var position = this.getPosition(this.state.anchor);
			if(position.y < (window.innerHeight + 150) && !this.state.isLoading){
                this.setState({
					isLoading: true
				}, () => {
					this.state.socket.send({type:'loadmore', text:this.state.searchText, maxId:this.state.maxId});
				})
            }
		}
	}

	decideAndOpenTab(e, username, id){
		if(e && e.target){
			if(e.target.tagName.toLowerCase() !== 'a'){
				var a = document.createElement('a'),
				link = `https://twitter.com/${username}/status/${id}`;
				
				a.href = link
				a.target = "_blank";
				document.body.appendChild(a);
				a.click();

				a.parentElement.removeChild(a);
			}
		}
	}

	componentDidMount(){
		this.setState({
			socket: socketIOClient(process.env.NODE_ENV === 'development' ? "ws://localhost:5000" : "ws://163.172.169.14:81")
		}, () => {
			this.state.socket.on("tweet", (data) => {
				var newTweet = [],
					uniqueTweetID = [];
				
				data.tweet.forEach((el) => {
					if(uniqueTweetID.indexOf(el.id) === -1){
						newTweet.push(el);
						uniqueTweetID.push(el.id);
					}
				});
				
				this.setState({
					searching: false,
					counter: 0,
					newlyArrived: [],
					tweets: newTweet,
					uniqueTweetID: uniqueTweetID,
					maxId: data.maxId
				}, () => {
					setTimeout(() => {
						this.state.socket.send({type:'stream', text:this.state.searchText});
					});
					if(!this.state.popup)
						this.setState({
							popup: document.getElementById('popup'),
							anchor: document.getElementById('anchor')
						}, () => {
							window.addEventListener('scroll', this.handleScroll);
						})
				});
			});

			this.state.socket.on('append', (data) => {
				var newTweet = [],
					uniqueTweetID = [...this.state.uniqueTweetID];
				
				data.tweet.forEach((el) => {
					if(uniqueTweetID.indexOf(el.id) === -1){
						newTweet.push(el);
						uniqueTweetID.push(el.id);
					}
				});

				this.setState({
					isLoading: false,
					tweets: [...this.state.tweets, ...newTweet],
					uniqueTweetID: uniqueTweetID,
					maxId: data.maxId
				})
			})

			this.state.socket.on("new-tweets", (data) => {
				// console.log(data);
				var uniqueTweetID = [...this.state.uniqueTweetID];
				if(uniqueTweetID.indexOf(data.tweet.id) === -1){
					uniqueTweetID.push(data.tweet.id);
					var newlyArrived = [...this.state.newlyArrived];
					newlyArrived.unshift(data.tweet);

					if(newlyArrived.length > 50)
						newlyArrived = newlyArrived.slice(0, 50);
					
					this.setState({
						counter: this.state.counter + 1,
						newlyArrived: newlyArrived
					})
				}
			});
		});
	}

	render(){
		return (
			<div className="container">
				<Helmet>
					<meta charSet="utf-8" />
					<title>Twitter - Streaming app</title>
					<meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no"/>
					<meta name="author" content="Souvik Maity"/>
				</Helmet>
				<div className="search-bar flex-container">
					<div className="search flexbox">
						<form method="post" onSubmit={(e) => this.submit(e)}>
							<svg viewBox="0 0 24 24"><g><path d="M21.53 20.47l-3.66-3.66C19.195 15.24 20 13.214 20 11c0-4.97-4.03-9-9-9s-9 4.03-9 9 4.03 9 9 9c2.215 0 4.24-.804 5.808-2.13l3.66 3.66c.147.146.34.22.53.22s.385-.073.53-.22c.295-.293.295-.767.002-1.06zM3.5 11c0-4.135 3.365-7.5 7.5-7.5s7.5 3.365 7.5 7.5-3.365 7.5-7.5 7.5-7.5-3.365-7.5-7.5z"></path></g></svg>
							<input type="text" autoComplete="off" className="search-box" name="search" placeholder="Type and press enter to search..." onChange={(e) => this.setState({searchText: e.target.value})} value={this.state.searchText}/>
						</form>
					</div>
					<div className="flexbox notification">
						<div className="round">
							<svg viewBox="0 0 24 24"><g><path d="M21.697 16.468c-.02-.016-2.14-1.64-2.103-6.03.02-2.533-.812-4.782-2.347-6.334-1.375-1.393-3.237-2.164-5.242-2.172h-.013c-2.004.008-3.866.78-5.242 2.172-1.534 1.553-2.367 3.802-2.346 6.333.037 4.332-2.02 5.967-2.102 6.03-.26.194-.366.53-.265.838s.39.515.713.515h4.494c.1 2.544 2.188 4.587 4.756 4.587s4.655-2.043 4.756-4.587h4.494c.324 0 .61-.208.712-.515s-.005-.644-.265-.837zM12 20.408c-1.466 0-2.657-1.147-2.756-2.588h5.512c-.1 1.44-1.29 2.587-2.756 2.587z"></path></g></svg>
							<span className="counter">{this.state.counter}</span>
						</div>
					</div>
				</div>
				<div className="timeline">
					<div className="popup" id="popup" onClick={() => this.mergeTweets('popup')}>{this.state.counter} new tweets</div>
					{this.state.counter > 0 && 
						<div className="load-new" onClick={() => this.mergeTweets()}>
							<span>{this.state.counter} new tweets have appeared after you have searched</span>
							<span>Click here to see them</span>
						</div>
					}
					{this.state.searching > 0 && 
						<div className="loading">
							<div className="flex-container center vertical-middle">
								<div className="flexbox">
									<svg version="1.1" id="loader-1" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="40px" height="40px" viewBox="0 0 50 50"><path fill="#8899a6" d="M43.935,25.145c0-10.318-8.364-18.683-18.683-18.683c-10.318,0-18.683,8.365-18.683,18.683h4.068c0-8.071,6.543-14.615,14.615-14.615c8.072,0,14.615,6.543,14.615,14.615H43.935z"><animateTransform attributeType="xml" attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="0.6s" repeatCount="indefinite"/></path></svg>
								</div>
								<div className="flexbox">Loading...</div>
							</div>
						</div>
					}
					{
						this.state.tweets.map((el, index) => {
							// console.log(el.user);
							return (
								<div className="tweet" key={index}>
									<div className="flex-container">
										<div className="flexbox profile-image">
											<a href={`https://www.twitter.com/${el.user.username}/`} target="_blank" rel="noopener noreferrer">
												<img src={el.user.pic} className="avatar" alt="profile pic"/>
											</a>
										</div>
										<div className="flexbox tweet-body">
											<div className="top-row">
												<a href={`https://www.twitter.com/${el.user.username}/`} target="_blank" rel="noopener noreferrer">
													<div className="flex-container flex-start">
														<div className="name">{el.user.name}</div>
														{el.user.verified && <div className="verified"><img src={verified} alt="verified"/></div>}
														<div className="username">@{el.user.username}</div>
														<div className="time">&bull;&nbsp;{this.parseDate(el.date)}</div>
													</div>
												</a>
											</div>
											<div className="tweet-text" onClick={(e) => this.decideAndOpenTab(e, el.user.username, el.id)} dangerouslySetInnerHTML={{__html: this.parseTweetText(el.text, el.entities.hashtags, el.entities.user_mentions, el.entities.urls, el.entities.media)}}></div>
										</div>
									</div>
								</div>
							)
						})
					}
					<div id="anchor" className="load-anchor">
                        {this.state.isLoading && 
                            <div className="loading">
                                <div className="flex-container center vertical-middle">
									<div className="flexbox">
										<svg version="1.1" id="loader-1" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="40px" height="40px" viewBox="0 0 50 50"><path fill="#8899a6" d="M43.935,25.145c0-10.318-8.364-18.683-18.683-18.683c-10.318,0-18.683,8.365-18.683,18.683h4.068c0-8.071,6.543-14.615,14.615-14.615c8.072,0,14.615,6.543,14.615,14.615H43.935z"><animateTransform attributeType="xml" attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="0.6s" repeatCount="indefinite"/></path></svg>
									</div>
									<div className="flexbox">Fetching more...</div>
								</div>
                            </div>
                        }
                    </div>
				</div>
			</div>
		)
	}
}

export default TwitterApp;