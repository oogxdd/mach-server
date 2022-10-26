const fs = require("fs");
const express = require("express");
const bodyParser = require("body-parser");
const ytdl = require("ytdl-core");
const readline = require("readline");
const fetch = require("node-fetch");
const cors = require("cors");
// const ffmpeg = require("fluent-ffmpeg");

const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const ffmpeg = require("fluent-ffmpeg");
ffmpeg.setFfmpegPath(ffmpegPath);

const url = "https://api.assemblyai.com/v2/upload";

const app = express();

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static("files"));

app.get("/hi", async (req, res) => {
  res.send("hi");
});

app.get("/audio", async (req, res) => {
  console.log(req.query.v);

  if (false) {
    fs.readFile(`${__dirname}/files/${req.query.v}.mp3`, (err, data) => {
      if (err) {
        return console.log(err);
      }

      const params = {
        headers: {
          // authorization: process.env.ASSEMBLYAI_API_KEY,
          authorization: "49704478b90f44b683aef4a01e1e9d15",
          "Transfer-Encoding": "chunked",
        },
        body: data,
        method: "POST",
      };

      fetch(url, params)
        .then((response) => response.json())
        .then((data) => {
          console.log(data);
          console.log(`URL: ${data["upload_url"]}`);
          res.send(`URL: ${data["upload_url"]}`);
        })
        .catch((error) => {
          console.error(`Error: ${error}`);
        });
    });
  } else {
    let stream = ytdl(req.query.v, {
      quality: "highestaudio",
    });

    let start = Date.now();
    await ffmpeg(stream)
      .audioBitrate(128)
      .save(`${__dirname}/files/${req.query.v}.mp3`)
      .on("progress", (p) => {
        readline.cursorTo(process.stdout, 0);
        process.stdout.write(`${p.targetSize}kb downloaded`);
      })
      .on("end", (stdout) => {
        console.log(stdout);
        console.log(`\ndone, thanks - ${(Date.now() - start) / 1000}s`);

        fs.readFile(`${__dirname}/files/${req.query.v}.mp3`, (err, data) => {
          if (err) {
            return console.log(err);
          }

          const params = {
            headers: {
              // authorization: process.env.ASSEMBLYAI_API_KEY,
              authorization: "49704478b90f44b683aef4a01e1e9d15",
              "Transfer-Encoding": "chunked",
            },
            body: data,
            method: "POST",
          };

          fetch(url, params)
            .then((response) => response.json())
            .then((data) => {
              console.log(data);
              console.log(`URL: ${data["upload_url"]}`);
              // fs.unlink(`${__dirname}/files/${req.query.v}.mp3`, (a) => {
              //   console.log("deleted");
              // });
              res.json({
                url: data["upload_url"],
              });
            })
            .catch((error) => {
              console.error(`Error: ${error}`);
            });
        });
      })
      .on("data", function (chunk) {
        console.log("ffmpeg just wrote " + chunk.length + " bytes");
      });
    console.log("yeah");
  }
});

app.use((req, res, next) => {
  console.log("A new request received at " + Date.now());

  // This function call tells that more processing is
  // required for the current request and is in the next middleware
  next();
});

app.listen(4000, () => console.log("Example app listening on port 4000!"));
