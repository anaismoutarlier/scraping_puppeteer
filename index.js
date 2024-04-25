const scraper = require("./scraper");
const express = require("express");
const http = require("http");
require("dotenv").config();
const { CronJob } = require("cron");

const app = express();
const server = http.createServer(app);

function cron() {
  const job = new CronJob(
    "0 58 19 * * *",
    () => {
      console.log("Launching job");
      scraper();
    },
    null,
    true,
    "Europe/Paris"
  );
  job.start();
}

cron();
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Listening on port ${PORT}.`));
