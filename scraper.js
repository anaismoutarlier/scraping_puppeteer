const puppeteer = require("puppeteer");
const moment = require("moment");

const scraper = async () => {
  try {
    var browser = await puppeteer.launch({ headless: false });
    console.log("Browser created.");
    const page = await browser.newPage();

    await page.setRequestInterception(true);

    page.on("request", request => {
      const url = request.url();
      const type = request.resourceType();
      console.log(type, "    ", url);
      if (["stylesheet", "font", "image"].includes(type)) request.abort();
      else request.continue();
    });

    console.log("New page created.");
    await page.goto(
      "https://www.welcometothejungle.com/fr/jobs?refinementList%5Boffices.country_code%5D%5B%5D=FR&refinementList%5Bcontract_type%5D%5B%5D=full_time&refinementList%5Bcontract_type%5D%5B%5D=internship&query=javascript%20developer&page=1",
      // load, domcontentloaded, networkidle2, networkidle0
      { waitUntil: "networkidle2" }
    );

    // .$eval() = 1 seul element (querySelector)
    const totalJobs = await page.$eval(
      "div[data-testid='jobs-search-results-count']",
      el => {
        return Number(el.textContent.trim());
      }
    );
    console.log("Total jobs: ", totalJobs);

    // .$$eval() = plusieurs elements (querySelectorAll)
    const limitDate = moment().subtract(1, "days");
    const jobList = (
      await page.$$eval(
        "ul.ais-Hits-list[data-testid='search-results'] li",
        arr => {
          return arr.map(el => {
            const url = el.querySelector("a").href;
            const title = el.querySelector("h4").textContent.trim();
            const tags = [...el.querySelectorAll(".sc-dQEtJz.cJTvEr")].map(t =>
              t.textContent.trim()
            );
            const createdAt = el.querySelector("time").dateTime;
            return { url, title, tags, createdAt };
          });
        }
      )
    ).filter(el => moment(el.createdAt).isAfter(limitDate));

    console.log("Number of filtered jobs: ", jobList.length, jobList);
  } catch (error) {
    console.error(error);
  } finally {
    if (browser) await browser.close();
  }
};

module.exports = scraper;
