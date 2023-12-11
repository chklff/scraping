const functions = require('@google-cloud/functions-framework');
const puppeteer = require('puppeteer');

// This is the main function that will be triggered in Google Cloud Functions
async function scrapeData(req, res) {
    const url = req.body.url || req.query.url; // Get the URL from the request

    // Launch Puppeteer
    const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--headless', '--disable-gpu', '--disable-dev-shm-usage'],
    });
    const page = await browser.newPage();

    // Navigate to the URL
    await page.goto(url);
    await page.waitForSelector('#root > div > div > main > table > tbody > tr > td:nth-child(1) > a');

    // Scrape data as in your original function
    const paths = await page.$$eval('#root > div > div > main > table > tbody > tr > td:nth-child(1) > a', anchors => anchors.map(anchor => anchor.getAttribute('href')));
    let scrapedData = [];
    for (const path of paths) {
        const fullUrl = `https://obd.hcraontario.ca${path}`;
        await page.goto(fullUrl);

        await page.waitForSelector("#root > div.ProfileHeader_headerContainer__1mgG9 > header > div > div > div:nth-child(1) > div > h1");

        // Extract the data
        const companyName = await page.$eval('#root > div.ProfileHeader_headerContainer__1mgG9 > header > div > div > div:nth-child(1) > div > h1', el => el.innerText);
        const licenseNumber = await page.$eval('#root > div.ProfileHeader_headerContainer__1mgG9 > header > div > div > div:nth-child(2) > div > div:nth-child(2) > div:nth-child(2)', el => el.innerText);
        const licenseExpires = await page.$eval('#root > div.ProfileHeader_headerContainer__1mgG9 > header > div > div > div:nth-child(2) > div > div:nth-child(4) > div:nth-child(2) > time', el => el.innerText);
        const address = await page.$eval('#overview-tab > div:nth-child(4) > div > div > div > div:nth-child(1) > p', el => el.innerText);

        scrapedData.push({
            companyName,
            licenseNumber,
            licenseExpires,
            address
        });
    }

    await browser.close();

    // Send back the scraped data as a response
    res.status(200).send({ scrapedData });
}

// Export the function so Google Cloud Functions can use it
exports.scrapeData = scrapeData;
