// script.js
let player;
let isPlayerReady = false; // Flag to track the readiness of the player

document.querySelector("header").addEventListener("click", function (event) {
  let target = event.target.closest(".social-icon");
  if (target && target.dataset.url) {
    // Check if a matching element was found and it has a URL
    redirectUser(target.dataset.url); // Redirect user to the URL
  }
});

document
  .querySelector(".video-gallery")
  .addEventListener("click", function (event) {
    let target = event.target.closest(".video-thumbnail");
    if (target && target.dataset.videoUrl && isPlayerReady) {
      const videoUrl = new URL(target.dataset.videoUrl);
      const videoId = videoUrl.searchParams.get("v");
      if (player && typeof player.loadVideoById === "function") {
        player.loadVideoById(videoId);
        document.getElementById("videoPlayer").style.display = "block"; // Ensure visibility

        // Scroll to the video player smoothly
        document
          .getElementById("videoPlayer")
          .scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        console.error("Please reload the page");
      }
    }
  });

function redirectUser(url) {
  // Redirect user to the URL
  window.location.href = url;
}

function onYouTubeIframeAPIReady() {
  // This function creates the player after the API code downloads.
  player = new YT.Player("videoPlayer", {
    height: "360",
    width: "640",
    videoId: "", // Initial video ID, can be left empty or set a default
    events: {
      onReady: onPlayerReady,
      onError: onPlayerError,
    },
  });
}

function playVideo(videoId) {
  //   console.log(`Attempting to play VideoID: ${videoId}`);
  if (player && typeof player.loadVideoById === "function") {
    // console.log("Player is ready, checking video ID...");
    if (player.getVideoData() && player.getVideoData().video_id !== videoId) {
      //   console.log("Loading new video");
      player.loadVideoById(videoId);
    } else if (player.getPlayerState() !== YT.PlayerState.PLAYING) {
      //   console.log("Resuming video playback");
      player.playVideo();
    }
    // Ensure the player element is correctly shown
    document.getElementById("videoPlayer").style.display = "block";
  } else {
    console.error("YouTube Player is not ready or not defined.");
  }
}

function onPlayerReady(event) {
  isPlayerReady = true; // Set the flag when player is ready

  // You can autoplay the video here if you like
  //   event.target.playVideo();
}

function onPlayerError(event) {
  console.error("Error occurred: ", event.data);
  isPlayerReady = false; // Reset the flag if there's an error

  // Handle different error codes
  switch (event.data) {
    case 2:
      console.error("Invalid parameter.");
      break;
    case 5:
      console.error("HTML5 player error.");
      break;
    case 100:
      console.error("Video not found.");
      break;
    case 101:
    case 150:
      console.error("Video not allowed to be played in embedded players.");
      break;
  }
}
