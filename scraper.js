const puppeteer = require("puppeteer");
const moment = require("moment");
const nodemailer = require("nodemailer");

const scrap = async search => {
  try {
    var browser = await puppeteer.launch();
    console.log("Browser created.");
    const page = await browser.newPage();
    console.log("Page created.");
    await page.goto(search, { waitUntil: "networkidle2" });
    await page.setRequestInterception(true);
    page.on("request", request => {
      //   console.log(request, request.headers());
      console.log(request.resourceType());
      if (["stylesheet", "image", "font"].includes(request.resourceType()))
        request.abort();
      else request.continue();
    });

    // const totalJobs = await page.$eval(
    //   "div[data-testid='jobs-search-results-count']",
    //   el => {
    //     if (el) return Number(el.textContent.trim());
    //     return null;
    //   }
    // );
    const limitDate = moment().subtract(1, "days").toDate();
    const jobList = await page.$$eval(
      "li.ais-Hits-list-item",
      (arr, limitDate) => {
        return arr
          .map(el => {
            const url = el.querySelector("a")?.href;
            const title = el.querySelector("h4")?.textContent?.trim();
            const tags = Array.from(
              el.querySelectorAll("div.sc-dQEtJz.cJTvEr span")
            ).map(item => item?.textContent?.trim());
            const createdAt = el.querySelector("time").dateTime;
            return { url, title, tags, createdAt };
          })
          .filter(el => new Date(el.createdAt) >= new Date(limitDate));
      },
      limitDate
    );

    // await Promise.all([
    //   page.waitForNavigation(),
    //   page.click("li.ais-Hits-list-item a"),
    // ]);
    for (let job of jobList) {
      await page.goto(job.url, { waitUntil: "networkidle0" });

      const data = await page.evaluate(() => {
        const data = {};
        data.company = {
          name: document.querySelector(
            "div[data-testid='job-metadata-block'] a[href*='companies'] span"
          ).textContent,
          url: document.querySelector(
            "div[data-testid='job-metadata-block'] a[href*='companies']"
          )?.href,
        };

        data.tags = Array.from(
          document.querySelectorAll(
            "div[data-testid='job-metadata-block'] div.sc-dQEtJz.iIerXh"
          ) || []
        ).map(el => el.textContent?.trim());

        return data;
      });
      job = { ...job, ...data, tags: [...job.tags, ...data.tags] };
    }

    const transporter = nodemailer.createTransport({
      service: "Gmail",
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: "",
        pass: "",
      },
    });
    await transporter.verify();
    const res = await transporter.sendMail({
      to: "",
      from: { name: "", address: "" },
      subject: "Nouveaux posts WTTJ",
      html: `<div>
	${jobList.map(
    job => `<li>
		<h4>${job.title}</h4>
		<a href=${job.url}>Voir plus</a>
	</li>`
  )}
	</div>`,
    });
    console.log(res);
  } catch (error) {
    console.error(error);
  } finally {
    await browser.close();
  }
};

module.exports = scrap;
