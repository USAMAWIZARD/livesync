var a = 0;
timestamp_frame = (videoFrame) => {


  window.v = videoFrame;
  console.log("Frame details: ", {
    timestamp: videoFrame.timestamp,
    duration: videoFrame.duration,
    visible: videoFrame.visible,
    width: videoFrame.displayWidth,
    height: videoFrame.displayHeight,
  });

  if (a == 0) {
    a = 1
    return videoFrame
  }
  videoFrame.timestamp += 100000;

  return videoFrame;

}

// Register the callback for the first frame

async function video_stamp() {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  const videoTrack = stream.getVideoTracks()[0];


  const trackProcessor = new MediaStreamTrackProcessor({ track: videoTrack });
  const trackGenerator = new MediaStreamTrackGenerator({ kind: "video" });

  const transformer = new TransformStream({
    async transform(videoFrame, controller) {
      // Create a new VideoFrame with the same properties
      const stampedFrame = timestamp_frame(videoFrame);
      controller.enqueue(stampedFrame);
    },
  });

  trackProcessor.readable
    .pipeThrough(transformer)
    .pipeTo(trackGenerator.writable);

  const before_play = document.getElementById("video_player");
  var newstream = new MediaStream();
  newstream.addTrack(videoTrack);

  before_play.srcObject = newstream;

  before_play.play();

}


async function video_stamp_2() {

  const trackGenerator = new MediaStreamTrackGenerator({ kind: "video" });
  const writer = trackGenerator.writable.getWriter();
  const video = document.getElementById('video_player');

  const config = {
    codec: "avc1.64001E",
    width: 640,
    height: 480,
    bitrate: 2_000_000, // 2 Mbps
    framerate: 30,
    avc: { format: "annexb" }
  };

  const init = {
    output: async (chunk, metadata) => {
      console.log(chunk, metadata);
      await writer.write(chunk);
      writer.releaseLock();
    },
    error: (e) => {
      console.log(e.message);
    },
  };

  let frame_counter = 0;

  if (!VideoEncoder.isConfigSupported(config)) {
    console.error("VideoEncoder configuration not supported.");
    return;
  }
  var encoder = new VideoEncoder(init);
  encoder.configure(config)

  const handleFrame = (now, metadata) => {
    console.log("Now (HighResTimeStamp):", now);
    console.log("Frame Metadata:", metadata);

    if (metadata.captureTime !== undefined) {
      console.log("Capture Time (HighResTimeStamp):", metadata.captureTime);
    } else {
      console.log("Capture Time is not available.");
    }

    if (encoder.encodeQueueSize > 2) {
      // Too many frames in flight, encoder is overwhelmed
      // let's drop this frame.
      //frame.close();
    } else {
      frame_counter++;
      var frame = new VideoFrame(video);
      const insert_keyframe = frame_counter % 150 === 0;
      encoder.encode(frame, { keyFrame: insert_keyframe });
      //frame.close();
    }

    video.requestVideoFrameCallback(handleFrame);
  };

  video.requestVideoFrameCallback(handleFrame);

}
