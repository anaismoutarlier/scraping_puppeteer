const puppeteer = require("puppeteer");
const moment = require("moment");
const sendResults = require("./mailer");
const scraper = async () => {
  try {
    var browser = await puppeteer.launch();
    console.log("Browser created.");
    const page = await browser.newPage();
    console.log("New page created.");

    await page.setRequestInterception(true);

    page.on("request", request => {
      const type = request.resourceType();
      if (["stylesheet", "font", "image"].includes(type)) request.abort();
      else request.continue();
    });

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
    const limitDate = moment().subtract(1, "days").toDate();
    const jobList = await page.$$eval(
      "ul.ais-Hits-list[data-testid='search-results'] li",
      (arr, limitDate) => {
        // NAVIGATEUR______________________________________
        return arr
          .map(el => {
            const url = el.querySelector("a").href;
            const title = el.querySelector("h4").textContent.trim();
            const tags = [...el.querySelectorAll(".sc-dQEtJz.cJTvEr")].map(t =>
              t.textContent.trim()
            );
            const createdAt = el.querySelector("time").dateTime;
            return { url, title, tags, createdAt };
          })
          .filter(el => new Date(el.createdAt) > new Date(limitDate));
        // NAVIGATEUR______________________________________
      },
      limitDate
    );

    console.log("Number of filtered jobs: ", jobList.length);

    for (let job of jobList) {
      await page.goto(job.url, { waitUntil: "networkidle2" });
      const data = await page.evaluate(() => {
        const data = {};
        data.applyUrl = document.querySelector(
          "a[data-testid='job_bottom-button-apply']"
        )?.href;
        const competencyContainer =
          document.querySelectorAll(".sc-bXCLTC.hdepoj")?.[1];
        if (competencyContainer) {
          data.competencies = [
            ...competencyContainer.querySelectorAll("div"),
          ].map(el => el.textContent.trim());
        }
        data.companyName = document
          .querySelector(
            "#the-company-section .sc-bXCLTC.eHPkNS.sc-fPrdXf.NUjSe"
          )
          ?.textContent?.trim();
        data.companyWebsite = document.querySelector(
          "#the-company-section .sc-hoLEA.kZWmKd.sc-bOhtcR.hGGksy"
        )?.href;
        return data;
      });
      job = Object.assign(job, data);
    }
    await sendResults(jobList);
  } catch (error) {
    console.error(error);
  } finally {
    if (browser) await browser.close();
  }
};

module.exports = scraper;
