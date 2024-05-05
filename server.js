const express = require("express");
const multer = require("multer");
const path = require("path");
const cors = require("cors");
const fs = require("fs");

const app = express();
const port = process.env.PORT || 8000; // Default to 8000 if process.env.PORT isn't set
const thumbnailsDataPath = "./thumbnails_data.json";

let thumbnails = [];

if (fs.existsSync(thumbnailsDataPath)) {
  thumbnails = JSON.parse(fs.readFileSync(thumbnailsDataPath, "utf8"));
}
// Enable CORS for all origins
app.use(cors());

// Serving static files
app.use(express.static(path.join(__dirname, "public")));

// For parsing application/json
app.use(express.json());

app.get("/", (req, res) => {
  res.sendFile("/index.html", { root: __dirname });
});

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "public", "thumbnails"));
  },
  filename: (req, file, cb) => {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

const upload = multer({ storage: storage });

// POST route to handle file uploads
app.post("/upload", upload.single("thumbnailImage"), (req, res) => {
  const youtubeLink = req.body.youtubeLink;
  const description = req.body.description;

  if (!req.file) {
    console.log("No file uploaded");
    return res.status(400).send("No file uploaded");
  }

  const filePath = `/thumbnails/${req.file.filename}`;
  thumbnails.push({ path: filePath, youtubeLink, description });
  fs.writeFileSync(thumbnailsDataPath, JSON.stringify(thumbnails, null, 2));

  res.setHeader("Content-Type", "application/json");
  res.json({
    message: "File uploaded successfully",
    path: filePath,
    youtubeLink: youtubeLink,
    description: description,
  });
});

app.get("/thumbnails", (req, res) => {
  res.json(thumbnails);
});

// DELETE route to handle thumbnail removal
app.delete("/delete-thumbnail", (req, res) => {
  const urlToDelete = req.query.url;
  const thumbnailIndex = thumbnails.findIndex(
    (thumb) => thumb.youtubeLink === urlToDelete
  );

  if (thumbnailIndex === -1) {
    return res.status(404).json({ message: "Thumbnail not found" });
  }

  // Get the file path
  const filePath = path.join(
    __dirname,
    "public",
    thumbnails[thumbnailIndex].path
  );

  // Remove the thumbnail file from the filesystem
  fs.unlink(filePath, (err) => {
    if (err) {
      console.error("Failed to delete file:", err);
      return res
        .status(500)
        .json({ message: "Failed to delete thumbnail file" });
    }

    // Remove the thumbnail from the array and update the JSON file
    thumbnails.splice(thumbnailIndex, 1);
    fs.writeFileSync(thumbnailsDataPath, JSON.stringify(thumbnails, null, 2));

    res.json({ message: "Thumbnail removed successfully" });
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
