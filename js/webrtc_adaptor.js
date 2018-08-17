/**
 *
 * @returns
 */
function WebRTCAdaptor(initialValues)
{
	var thiz = this;
	thiz.peerconnection_config = null;
	thiz.sdp_constraints = null;
	thiz.remotePeerConnection = new Array();
	thiz.webSocketAdaptor = null;
	thiz.roomName = null;
	thiz.videoTrackSender = null;
	thiz.audioTrackSender = null;
	thiz.playStreamId = new Array();
	thiz.micGainNode = null;

	thiz.isPlayMode = false;
	thiz.debug = false;

	for(var key in initialValues) {
		if(initialValues.hasOwnProperty(key)) {
			this[key] = initialValues[key];
		}
	}

	thiz.localVideo = document.getElementById(thiz.localVideoId);
	thiz.remoteVideo = document.getElementById(thiz.remoteVideoId);

	if (!("WebSocket" in window)) {
		console.log("WebSocket not supported.");
		callbackError("WebSocketNotSupported");
		return;
	}

	if (!this.isPlayMode)  // if it is in play mode, do not get user media
	{
		if (typeof thiz.mediaConstraints.video != "undefined" && thiz.mediaConstraints.video != false)
		{

			if (thiz.mediaConstraints.audio.mandatory) 
			{
				navigator.mediaDevices.getUserMedia({audio:true, video:false}).then(function(micStream){
					navigator.mediaDevices.getUserMedia(thiz.mediaConstraints)
					.then(function(stream) 
					{
						//console.debug("audio stream track count: " + audioStream.getAudioTracks().length);

						var audioContext = new AudioContext();
						var desktopSoundGainNode = audioContext.createGain();
						
						desktopSoundGainNode.gain.value = 1;

						var audioDestionation = audioContext.createMediaStreamDestination();
						var audioSource = audioContext.createMediaStreamSource(stream);

						audioSource.connect(desktopSoundGainNode);

						thiz.micGainNode = audioContext.createGain();
						thiz.micGainNode.gain.value = 1;
						var audioSource2 = audioContext.createMediaStreamSource(micStream);
						audioSource2.connect(thiz.micGainNode);

						desktopSoundGainNode.connect(audioDestionation);
						thiz.micGainNode.connect(audioDestionation);

						stream.removeTrack(stream.getAudioTracks()[0]);
						audioDestionation.stream.getAudioTracks().forEach(function(track) {
							stream.addTrack(track);
						});
						
						console.debug("Running gotStream");
						thiz.gotStream(stream);
						
					}).catch(function (error) {
						thiz.callbackError(error.name, error.message);
					});;
				}).catch(function(error){
					thiz.callbackError(error.name, error.message);
				});	
			}
			else {
				//var media_video_constraint = { video: thiz.mediaConstraints.video };
				navigator.mediaDevices.getUserMedia(thiz.mediaConstraints)
				.then(function(stream){

					//this trick, getting audio and video separately, make us add or remove tracks on the fly
					var audioTrack = stream.getAudioTracks();
					if (audioTrack.length > 0) {
						stream.removeTrack(audioTrack[0]);
					}

					//now get only audio to add this stream
					if (typeof thiz.mediaConstraints.audio != "undefined" && thiz.mediaConstraints.audio != false) {
						var media_audio_constraint = { audio: thiz.mediaConstraints.audio};
						navigator.mediaDevices.getUserMedia(media_audio_constraint)
						.then(function(audioStream) {
							stream.addTrack(audioStream.getAudioTracks()[0]);
							thiz.gotStream(stream);
						})
						.catch(function(error) {
							thiz.callbackError(error.name, error.message);
						});
					}
					else {
						thiz.gotStream(stream);
					}
				})
				.catch(function(error) {
					thiz.callbackError(error.name, error.message);
				});
			}
		}
		else {
			var media_audio_constraint = { audio: thiz.mediaConstraints.audio };
			navigator.mediaDevices.getUserMedia(media_audio_constraint)
			.then(function(stream) {
				thiz.gotStream(stream);
			})
			.catch(function(error) {
				thiz.callbackError(error.name, error.message);
			});
		}
	}
	else {
		if (thiz.webSocketAdaptor == null || thiz.webSocketAdaptor.isConnected() == false) {
			thiz.webSocketAdaptor = new WebSocketAdaptor();
		}
	}
	
	this.enableMicInMixedAudio = function(enable) {
		if (thiz.micGainNode != null) {
			if (enable) {
				thiz.micGainNode.gain.value = 1;
			}
			else {
				thiz.micGainNode.gain.value = 0;
			}
		}
	}
	
	this.sendChatMessage = function (message,streamId,id,user)
	{
		var jsCmd = {
				command : "chatMessage",
				streamId : streamId,
				chatMessage: message,
				messageId : id,
				userName : user, 
		};

		thiz.webSocketAdaptor.send(JSON.stringify(jsCmd));
		
		
		
	}

	this.raiseHand = function (streamId,user)
	{
		var jsCmd = {
				command : "raiseHand",
				streamId : streamId,
				userName : user, 
		}
		thiz.webSocketAdaptor.send(JSON.stringify(jsCmd));
	}
	
	this.givePermission = function (streamId)
	{
		var jsCmd = {
				command : "givePermission",
				streamId : streamId,
		}
		thiz.webSocketAdaptor.send(JSON.stringify(jsCmd));
	}

	this.blockPermission = function (streamId)
	{
		var jsCmd = {
				command : "blockPermission",
				streamId : streamId,
		}
		thiz.webSocketAdaptor.send(JSON.stringify(jsCmd));
	}

	this.shareUserName = function (streamId,userName)
	{
		var jsCmd = {
				command : "shareUserName",
				streamId : streamId,
				userName : userName,
		}
		thiz.webSocketAdaptor.send(JSON.stringify(jsCmd));	
	}
	
	this.publish = function (streamId) {

		var jsCmd = {
				command : "publish",
				streamId : streamId,
				video: thiz.mediaConstraints.video == false ? false : true,
				audio: thiz.mediaConstraints.audio == false ? false : true,
		};


		thiz.webSocketAdaptor.send(JSON.stringify(jsCmd));
	}


	this.joinRoom = function (roomName) {
		thiz.roomName = roomName;

		var jsCmd = {
				command : "joinRoom",
				room: roomName,
				video: thiz.mediaConstraints.video == false ? false : true,
				audio: thiz.mediaConstraints.audio == false ? false : true,
		};

		thiz.webSocketAdaptor.send(JSON.stringify(jsCmd));

	}

	this.play = function (streamId) {

		thiz.playStreamId.push(streamId);
		var jsCmd =
		{
				command : "play",
				streamId : streamId,
		}

		thiz.webSocketAdaptor.send(JSON.stringify(jsCmd));
	}

	this.stop = function(streamId) {
		thiz.closePeerConnection(streamId);

		var jsCmd = {
				command : "stop",
				streamId: streamId,
		};

		thiz.webSocketAdaptor.send(JSON.stringify(jsCmd));
	}

	this.join = function(streamId) {
		var jsCmd = {
				command : "join",
				streamId : streamId,
		};


		thiz.webSocketAdaptor.send(JSON.stringify(jsCmd));
	}

	this.leave = function (streamId) {

		var jsCmd = {
				command : "leave",
				streamId: streamId,
		};

		thiz.webSocketAdaptor.send(JSON.stringify(jsCmd));
		thiz.closePeerConnection(streamId);
	}

	this.getStreamInfo = function(streamId) {
		var jsCmd = {
				command : "getStreamInfo",
				streamId: streamId,
		};
		this.webSocketAdaptor.send(JSON.stringify(jsCmd));
	}

	this.gotStream = function (stream) 
	{	
		thiz.localStream = stream;
		thiz.localVideo.srcObject = stream;
		if (thiz.webSocketAdaptor == null || thiz.webSocketAdaptor.isConnected() == false) {
			thiz.webSocketAdaptor = new WebSocketAdaptor();
		}
	};


	this.onTrack = function(event, streamId) {
		console.log("onTrack");
		if (thiz.remoteVideo != null) {
			//thiz.remoteVideo.srcObject = event.streams[0];
			if (thiz.remoteVideo.srcObject !== event.streams[0]) {
				thiz.remoteVideo.srcObject = event.streams[0];
				console.log('Received remote stream');
			}
		}
		else {
			var dataObj = {
					track: event.streams[0],
					streamId: streamId
			}
			thiz.callback("newStreamAvailable", dataObj);
		}

	}

	this.iceCandidateReceived = function(event, streamId) {
		if (event.candidate) {

			var jsCmd = {
					command : "takeCandidate",
					streamId : streamId,
					label : event.candidate.sdpMLineIndex,
					id : event.candidate.sdpMid,
					candidate : event.candidate.candidate
			};

			if (thiz.debug) {
				console.log("sending ice candiate for stream Id " + streamId );
				console.log(JSON.stringify(event.candidate));
			}

			thiz.webSocketAdaptor.send(JSON.stringify(jsCmd));
		}
	}


	this.initPeerConnection = function(streamId) {
		if (thiz.remotePeerConnection[streamId] == null) 
		{

			var closedStreamId = streamId;
			console.log("stream id in init peer connection: " + streamId + " close dstream id: " + closedStreamId);
			thiz.remotePeerConnection[streamId] = new RTCPeerConnection(thiz.peerconnection_config);
			if (!thiz.playStreamId.includes(streamId)) 
			{
				thiz.remotePeerConnection[streamId].addStream(thiz.localStream);
			}
			thiz.remotePeerConnection[streamId].onicecandidate = function(event) {
				thiz.iceCandidateReceived(event, closedStreamId);
			}
			thiz.remotePeerConnection[streamId].ontrack = function(event) {
				thiz.onTrack(event, closedStreamId);
			}
		}
	}

	this.closePeerConnection = function(streamId) {
		if (thiz.remotePeerConnection[streamId] != null
				&& thiz.remotePeerConnection[streamId].signalingState != "closed") {
			thiz.remotePeerConnection[streamId].close();
			thiz.remotePeerConnection[streamId] = null;
			delete thiz.remotePeerConnection[streamId];
			var playStreamIndex = thiz.playStreamId.indexOf(streamId);
			if (playStreamIndex != -1) {
				thiz.playStreamId.splice(playStreamIndex, 1);
			}

		}
	}

	this.signallingState = function(streamId) {
		if (thiz.remotePeerConnection[streamId] != null) {
			return thiz.remotePeerConnection[streamId].signalingState;
		}
		return null;
	}

	this.iceConnectionState = function(streamId) {
		if (thiz.remotePeerConnection[streamId] != null) {
			return thiz.remotePeerConnection[streamId].iceConnectionState;
		}
		return null;
	}

	this.gotDescription = function(configuration, streamId) 
	{
		thiz.remotePeerConnection[streamId]
		.setLocalDescription(configuration)
		.then(function(responose) 
				{
			console.log("Set local description successfully for stream Id " + streamId);

			var jsCmd = {
					command : "takeConfiguration",
					streamId : streamId,
					type : configuration.type,
					sdp : configuration.sdp

			};

			if (thiz.debug) {
				console.log("local sdp: " );
				console.log(configuration);
			}

			thiz.webSocketAdaptor.send(JSON.stringify(jsCmd));

				})
				.catch(function(error){
					console.error("Cannot set local description. Error is: " + error);
				});


	}



	this.camVideo = function(param){
		if (thiz.remotePeerConnection != null) {
			var senders = thiz.remotePeerConnection[param].getSenders();
			
			var videoTrackSender = null;


			for (index in senders) {
				if (senders[index].track.kind == "video") {
					videoTrackSender = senders[index];
					break;
				}
			}
			navigator.mediaDevices.getUserMedia({video:true})
				.then(function(stream) {
					thiz.localVideo.srcObject = stream;
					console.log(stream.getVideoTracks()[0]);
					videoTrackSender.replaceTrack(stream.getVideoTracks()[0]);		
				})
				
				.catch(function(error) {
					thiz.callbackError(error.name);
				});
		}
	}

	this.screenVideo = function(streamId,mediaConstraints) {
		if (thiz.remotePeerConnection != null) {
			var senders = thiz.remotePeerConnection[streamId].getSenders();
			
			var videoTrackSender = null;


			for (index in senders) {
				if (senders[index].track.kind == "video") {
					videoTrackSender = senders[index];
					break;
				}
			}

			navigator.mediaDevices.getUserMedia({video:mediaConstraints.video})
				.then(function(stream) {
					thiz.localVideo.srcObject = stream;
					console.log(stream.getVideoTracks()[0]);
					videoTrackSender.replaceTrack(stream.getVideoTracks()[0]);
					stream.getVideoTracks()[0].onended = function(event) {
  						thiz.camVideo(streamId);
					}
					
				})
				
				.catch(function(error) {
					thiz.callbackError(error.name);
				});
		}
	}

	

	

	this.takeConfiguration = function (idOfStream, configuration, typeOfConfiguration) 
	{
		var streamId = idOfStream
		var type = typeOfConfiguration;
		var conf = configuration;

		thiz.initPeerConnection(streamId);

		thiz.remotePeerConnection[streamId].setRemoteDescription(new RTCSessionDescription({
			sdp : conf,
			type : type
		})).then(function(response)  {

			if (thiz.debug) {
				console.log("set remote description is succesfull with response: " + response + " for stream : " 
						+ streamId + " and type: " + type);
			}

			if (type == "offer") {
				//SDP constraints may be different in play mode
				console.log("try to create answer for stream id: " + streamId);

				thiz.remotePeerConnection[streamId].createAnswer(thiz.sdp_constraints)
				.then(function(configuration) 
						{
					console.log("created answer for stream id: " + streamId);
					thiz.gotDescription(configuration, streamId);
						})
						.catch(function(error) 
								{
							console.error("create answer error :" + error);
								});
			}

		}).catch(function(error){
			if (thiz.debug) {
				console.error("set remote description is failed with error: " + error);
			}
		});

	}


	this.takeCandidate = function(idOfTheStream, tmpLabel, tmpCandidate) {
		var streamId = idOfTheStream;
		var label = tmpLabel;
		var candidateSdp = tmpCandidate;

		var candidate = new RTCIceCandidate({
			sdpMLineIndex : label,
			candidate : candidateSdp
		});

		thiz.initPeerConnection(streamId);

		thiz.remotePeerConnection[streamId].addIceCandidate(candidate)
		.then(function(response) {
			if (thiz.debug) {
				console.log("Candidate is added for stream " + streamId);
			}
		})
		.catch(function (error) {
			console.error("ice candiate cannot be added for stream id: " + streamId + " error is: " + error  );
			console.error(candidate);
		});

	}

	this.startPublishing = function(idOfStream) {
		var streamId = idOfStream;

		thiz.initPeerConnection(streamId);

		thiz.remotePeerConnection[streamId].createOffer(thiz.sdp_constraints)
		.then(function(configuration) {
			thiz.gotDescription(configuration, streamId);
		})
		.catch(function (error) {

			console.error("create offer error for stream id: " + streamId + " error: " + error);
		});
	}

	//this.WebSocketAdaptor = function() {
	function WebSocketAdaptor() {
		var wsConn = new WebSocket(thiz.websocket_url);

		var connected = false;

		wsConn.onopen = function() {
			if (thiz.debug) {
				console.log("websocket connected");
			}

			connected = true;
			thiz.callback("initialized");
		}

		this.send = function(text) {

			if (wsConn.readyState == 0 || wsConn.readyState == 2 || wsConn.readyState == 3) {
				thiz.callbackError("WebSocketNotConnected");
				return;
			}
			wsConn.send(text);
		}

		this.isConnected = function() {
			return connected;
		}

		wsConn.onmessage = function(event) {
			
			var obj = JSON.parse(event.data);
			console.log("handlerEvent Adapter Come"+obj.command);
			if (obj.command == "start") 
			{
				//this command is received first, when publishing so playmode is false

				if (thiz.debug) {
					console.log("received start command");
				}

				thiz.startPublishing(obj.streamId);
			}
			else if (obj.command == "takeCandidate") {

				if (thiz.debug) {
					console.log("received ice candidate for stream id " + obj.streamId);
				}

				thiz.takeCandidate(obj.streamId, obj.label, obj.candidate);

			} else if (obj.command == "takeConfiguration") {

				if (thiz.debug) {
					console.log("received remote description type for stream id: " + obj.streamId + " type: " + obj.type );
				}
				thiz.takeConfiguration(obj.streamId, obj.sdp, obj.type);

			}
			else if (obj.command == "chatMessage") {
				thiz.callback(obj.definition, obj);
			}
			else if(obj.command == "raiseHand")
			{
				thiz.callback(obj.definition, obj);
			}
			else if(obj.command == "giveFloor")
			{
				thiz.callback(obj.definition,obj);			
			}
			else if(obj.command == "blockPermission")
			{
				thiz.callback(obj.definition,obj);			
			}
			else if(obj.command == "shareUserName")
			{
				thiz.callback(obj.definition,obj);			
			}			
			else if (obj.command == "stop") {
				console.debug("Stop command received");
				thiz.closePeerConnection(obj.streamId);
			}
			else if (obj.command == "error") {
				thiz.callbackError(obj.definition);
			}
			else if (obj.command == "notification") {
				thiz.callback(obj.definition, obj);
			}
			else if (obj.command == "streamInformation") {
				thiz.callback(obj.command, obj);
			}

		}

		wsConn.onerror = function(error) {
			console.log(" error occured: " + JSON.stringify(error));
			thiz.callbackError(error)
		}

		wsConn.onclose = function(event) {
			connected = false;

			console.log("connection closed.");
			thiz.callback("closed", event);
		}
	};
}
