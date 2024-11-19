var websocket = new WebSocket("ws://localhost:3001");
var myid = null;
var peer;
websocket.onopen = () => {
  console.log("websocket connection open ");
}
websocket.onclose = () => {
  console.log("websocket connection close ");
}
function is_sender_mode(mode) {
  return mode.includes("send")
}
websocket.onmessage = async (message) => {
  message = JSON.parse(message.data);
  switch (message.command) {
    case "start":
      console.log("start")
      myid = message.peer;
      if (is_sender_mode(mode)) {
        //await add_media();

        setVideo(await navigator.mediaDevices.getUserMedia({ video: true }));
        var stamptrack = await video_stamp_2();
        const mediaStream = new MediaStream();
        mediaStream.addTrack(stamptrack);
        peer.addTrack(stamptrack, mediaStream);
        send_offer();
      }
      //else
      //  await add_media();
      //await add_media("audio");
      break;
    case "offer":
      console.log("recived offer +", message.offer);
      peer.setRemoteDescription(message.offer).then(() => {
        send_answer();
      });
      break;
    case "answer":
      console.log("recived answer :" + message.answer.sdp);
      await peer.setRemoteDescription(message.answer);
      break;
    case "candidate":
      if (message.candidate != null)
        console.log("recived ice candidate \n");
      console.log(message.candidate);
      await peer.addIceCandidate(message.candidate);
  }
}

(async () => {

  peer = new RTCPeerConnection({
    bundlePolicy: "max-bundle",
    iceServers: [
      {
        urls: "stun:stun.l.google.com:19302"
      }
    ]
  }
  );
  peer.onsignalingstatechange = (e) => {
    //console.log(e);
  }
  peer.onicecandidate = (({ candidate }) => {
    if (candidate != null)
      console.log(candidate);
    websocket.send(JSON.stringify({ "command": "candidate", "candidate": candidate, "peer": myid }));
  });
  peer.ontrack = (media_track) => {
    let track = media_track.track;
    console.log("new track added of kind", track.kind, track.id);
    let media_stream = new MediaStream([track]);
    setVideo(media_stream);
    recived_timestamped_video(track);
  }
})();

async function add_media(type) {
  if (type == "video" || type == undefined || type == null) {
    media = await navigator.mediaDevices.getUserMedia({ video: true });
    setVideo(media);
    peer.addTrack(media.getVideoTracks()[0]);
    return;
  }
  else if (type == "audio") {
    media = await navigator.mediaDevices.getUserMedia({ audio: true });
    peer.addTrack(media.getAudioTracks()[0]);
    console.warn("audio aded");
    return;
  }

  //stream1 = media.getVideoTracks()[0].clone();
  //peer.addTrack(stream1);

}
function send_offer() {
  peer.createOffer().then(async (localdesc) => {

    // localdesc.sdp = localdesc.sdp.slice(0, localdesc.sdp.indexOf("extmap:2") - 3) + '\r\na=extmap:2 http://www.webrtc.org/experiments/rtp-hdrext/abs-capture-time\r\n' + localdesc.sdp.slice(localdesc.sdp.indexOf("extmap:3") - 2, localdesc.sdp.length)

    console.log("create and send offer " + localdesc.sdp);
    peer.setLocalDescription(localdesc).then(() => {
      websocket.send(JSON.stringify({ "command": "offer", "offer": localdesc, "peer": myid }));
    });
  });
}
function send_answer() {
  peer.createAnswer().then(async (answer) => {
    console.log(" create and send answer : " + answer.sdp);
    await peer.setLocalDescription(answer).then(() => {
      websocket.send(JSON.stringify({ "command": "answer", "answer": answer, "peer": myid }));
    })
  });
}
function setVideo(video_stream) {
  let video_player = document.getElementById("video_player");
  video_player.srcObject = video_stream;
  video_player.play();
}
