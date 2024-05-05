// app.js
let player;
let isPlayerReady = false; // Flag to track the readiness of the player
const ADMIN_KEY = "1234";
let admin = false;

window.onload = function () {
  const params = new URLSearchParams(window.location.search);
  const adminKey = params.get("admin_key");
  if (adminKey === ADMIN_KEY) {
    admin = true;
    document.getElementById("uploadForm").style.display = "block";
    document.querySelectorAll(".remove-thumbnail").forEach((button) => {
      button.style.display = "flex"; // Show the remove button
    });
  }
};

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
  if (player && typeof player.loadVideoById === "function") {
    if (player.getVideoData() && player.getVideoData().video_id !== videoId) {
      player.loadVideoById(videoId);
    } else if (player.getPlayerState() !== YT.PlayerState.PLAYING) {
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

function addRemoveEventListener(button) {
  button.addEventListener("click", function (event) {
    event.stopPropagation(); // Prevent triggering gallery click

    const thumbnailDiv = button.parentNode;
    // const thumbnailDiv = button.closest(".video-thumbnail"); // Using closest to be more specific
    const videoUrl = thumbnailDiv.dataset.videoUrl;

    // Fetch request to delete the thumbnail
    fetch(`/delete-thumbnail?url=${encodeURIComponent(videoUrl)}`, {
      method: "DELETE",
    })
      .then((response) => response.json())
      .then((data) => {
        thumbnailDiv.remove(); // Remove the thumbnail from the DOM
      })
      .catch((err) => console.error("Error deleting thumbnail:", err));
  });
}

// Function to create and append the thumbnail
function createAndAppendThumbnail(data) {
  const gallery = document.querySelector(".video-gallery");
  const newThumbnail = document.createElement("div");
  newThumbnail.className = "video-thumbnail";
  newThumbnail.innerHTML = `
    ${
      admin
        ? `<button class="remove-thumbnail" style="display: block">X</button>`
        : ``
    }
    <img src="${data.path}" alt="${data.description}">
    <div class="play-icon">▶</div>
    <p>${data.description}</p>
  `;
  newThumbnail.dataset.videoUrl = data.youtubeLink;

  if (admin) {
    // Add event listener to the remove button
    const removeButton = newThumbnail.querySelector(".remove-thumbnail");
    addRemoveEventListener(removeButton);
  }

  // Append the new thumbnail to the gallery
  gallery.appendChild(newThumbnail);
}

document
  .getElementById("thumbnailForm")
  .addEventListener("submit", async function (event) {
    event.preventDefault();

    const formData = new FormData();
    formData.append(
      "youtubeLink",
      document.getElementById("youtubeLink").value
    );
    formData.append(
      "description",
      document.getElementById("description").value
    );
    formData.append(
      "thumbnailImage",
      document.getElementById("thumbnailImage").files[0]
    );

    await fetch("/upload", {
      method: "POST",
      body: formData,
    })
      .then((response) => {
        if (!response.ok) throw new Error("Network response was not ok");
        return response.json();
      })
      .then((data) => {
        //creating and appending thumbnail
        createAndAppendThumbnail(data);
        this.reset(); // Reset the form fields after the data is successfully submitted
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  });

document.addEventListener("DOMContentLoaded", async function () {
  await fetch("/thumbnails")
    .then((response) => response.json())
    .then((data) => {
      data.forEach((thumbnail) => {
        createAndAppendThumbnail(thumbnail);
      });
    })
    .catch((error) => console.error("Error loading thumbnails:", error));
});
