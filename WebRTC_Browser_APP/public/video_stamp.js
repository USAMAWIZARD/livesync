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


  const handleFrame = async (now, metadata) => {
    console.log("Now (HighResTimeStamp):", now);
    console.log("Frame Metadata:", metadata);

    if (metadata.captureTime !== undefined) {
      console.log("Capture Time (HighResTimeStamp):", metadata.captureTime);
    } else {
      console.log("Capture Time is not available.");
    }

    var frame = new VideoFrame(video);
    await writer.ready;
    writer.write(frame);
    frame.close();

    video.requestVideoFrameCallback(handleFrame);
  };

  video.requestVideoFrameCallback(handleFrame);

  console.log(trackGenerator);
  return trackGenerator;
}
async function recived_timestamped_video(videoTrack) {

  const processor = new MediaStreamTrackProcessor(videoTrack);

  // Get a readable stream for the frames
  const reader = processor.readable.getReader();

  // Process frames in a loop
  while (true) {
    const { value: frame, done } = await reader.read();
    if (done) break; // Stop if no more frames

    console.log("Frame timestamp:", frame.timestamp);
    console.log("Frame resolution:", frame.displayWidth, frame.displayHeight);


    frame.close();
  }
}
