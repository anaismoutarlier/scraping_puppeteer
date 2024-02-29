const scrap = require("./scraper");
const express = require("express");
const http = require("http");
const { CronJob } = require("cron");

const app = express();
const server = http.createServer(app);
const SEARCH_URL =
  "https://www.welcometothejungle.com/fr/jobs?refinementList%5Bcontract_type%5D%5B%5D=internship&refinementList%5Bcontract_type%5D%5B%5D=full_time&refinementList%5Bcontract_type%5D%5B%5D=temporary&query=javascript%20developer&page=1&aroundQuery=worldwide";

function cron() {
  const job = new CronJob(
    "0 45 19 * * *",
    () => scrap(SEARCH_URL),
    null,
    true,
    "Europe/Paris"
  );
  job.start();
}

cron();

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server listening on port ${PORT}.`));
