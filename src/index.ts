import puppeteer from 'puppeteer';

function wait(milliseconds) {
  return new Promise(resolve => {
    setTimeout(resolve, milliseconds);
  });
}

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(
    'https://www2.commsec.com.au/secure/login?LoginResult=LoginRequired&r=https%3a%2f%2fwww2.commsec.com.au%2f',
    {
      waitUntil: 'networkidle2',
    },
  );

  // Set screen size
  await page.setViewport({ width: 1080, height: 1024 });

  // login flow
  await page.focus('#username');
  await page.keyboard.type('55775338');

  await wait(1000);
  await page.focus('#password');
  await page.keyboard.type('#100KGoals');

  await wait(1000);
  const loginButton = '#login';
  await page.waitForSelector(loginButton);
  await page.click(loginButton);

  async function checkTickers(ticker: string[]) {
    const keepTrackCalls: any = [];
    const keepTrackPuts: any = [];
    const noPriceCalls: any = [];
    const noPricePuts: any = [];
    for (let i = 0; i < ticker.length; i++) {
      await wait(1000);
      await page.goto(
        `https://www2.commsec.com.au/quotes/derivatives?stockCode=${ticker[i]}&exchangeCode=ASX`,
        {
          waitUntil: 'networkidle2',
        },
      );

      console.log(`Going through: ${ticker[i]}`);

      // Go to derviatives section
      // const derivativesLink = await page.$x("//a[contains(., 'Derivatives')]")
      // await clickByText(page, `Derivatives`);
      const derivativesLink =
        'body > app-root > div > div > sub-nav > nav > ul > li:nth-child(10) > a';
      // const derivativesLink = 'body > app-root > div > div > sub-nav > nav > ul > li:nth-child(3) > a';  //XJO
      await page.waitForSelector(derivativesLink);
      await page.click(derivativesLink);

      // click on the strike filters
      const strikes =
        'body > app-root > div > div > div > div.subnav-content__inner.section.section--width-max > derivatives-container > div > div > div > options > div > div.subnav-content-container__head.ng-star-inserted > div.subnav-content-container__filters.ng-star-inserted > filter-drop-down:nth-child(2) > div > div > div.filter-drop-down__selected-wrapper > div.filter-drop-down__button-wrapper > button';
      await page.waitForSelector(strikes);
      await page.click(strikes);

      await wait(1000);
      await page.click('#filter_options_strike3');

      async function checkMultipleExpiry(
        number: number,
        callsArray: string[],
        putsArray: string[],
      ) {
        // click on the expiry filters
        const expiry =
          'body > app-root > div > div > div > div.subnav-content__inner.section.section--width-max > derivatives-container > div > div > div > options > div > div.subnav-content-container__head.ng-star-inserted > div.subnav-content-container__filters.ng-star-inserted > filter-drop-down-multi-level > div > div > div.filter-drop-down__selected-wrapper > div.filter-drop-down__button-wrapper > button';
        await page.waitForSelector(expiry);
        await page.click(expiry);

        await wait(1000);
        await page.click(
          'xpath/' +
            `/html/body/app-root/div/div/div/div[1]/derivatives-container/div/div/div/options/div/div[1]/div[2]/filter-drop-down-multi-level/div/div/div[2]/div/div[1]/ul/li[${number}]`,
        );

        await wait(1000);
        const tableSelector =
          'body > app-root > div > div > div > div.subnav-content__inner.section.section--width-max > derivatives-container > div > div > div > options > div > div.subnav-content-container__body > table > tbody';
        // const countriesLength = await page.$$eval(`${tableSelector} > tr`, el => el.length);
        // console.log(countriesLength);

        const tableData = await page.evaluate(() => {
          const tableRows = Array.from(document.querySelectorAll(`tr`));
          return tableRows.map(row => {
            const columns = Array.from(row.querySelectorAll('td'));
            return columns.map(column => {
              console.log(column.innerText);
              return column.innerText;
            });
          });
        });

        for (let i = 0; i < tableData.length; i++) {
          const currentRow = tableData[i];
          if (currentRow !== undefined && currentRow.length > 0) {
            const checkCallSales = currentRow[4];
            const checkPutSales = currentRow[11];
            if (!isNaN(parseInt(checkCallSales))) {
              if (+currentRow[5] <= 0.2 && +currentRow[5] > 0.02) {
                callsArray.push(currentRow[0]);
              }
              if (+currentRow[5] === 0) {
                noPriceCalls.push(currentRow[0]);
              }
            }
            if (!isNaN(parseInt(checkPutSales))) {
              if (+currentRow[12] <= 0.2 && +currentRow[12] > 0.02) {
                putsArray.push(currentRow[7]);
              }
              if (+currentRow[12] === 0) {
                noPricePuts.push(currentRow[7]);
              }
            }
          }
        }
      }

      await checkMultipleExpiry(2, keepTrackCalls, keepTrackPuts);
      await checkMultipleExpiry(3, keepTrackCalls, keepTrackPuts);
      await checkMultipleExpiry(4, keepTrackCalls, keepTrackPuts);
      await checkMultipleExpiry(5, keepTrackCalls, keepTrackPuts);
    }

    console.log('====== Calls ========');
    console.log(keepTrackCalls);

    console.log('====== PUTS ========');
    console.log(keepTrackPuts);

    console.log('====== Zero $$ Calls ========');
    console.log(noPriceCalls);

    console.log('====== Zero $$ PUTS ========');
    console.log(noPricePuts);
  }

  // STW AND XJO??
  await checkTickers(['BHP', 'WOW', 'CBA', 'RIO', 'ANZ', 'NAB', 'WES', 'MQG']);
  // await checkTickers(['AGL', 'ORG', 'GMG', 'IAG', 'MPL', 'SUN', 'BEN', 'BOQ', 'QBE']);
  // await checkTickers(['SCG', 'GMG', 'TCL', 'APA', 'BXB', 'RHC', 'ANN', 'CWY', 'SDF', 'ALL']);

  console.log('####### FINISH ##########');
  await browser.close();

  // iterate over tr:nth-child(${i}) on all rows
  // for (let i = 1; i < countriesLength + 1; i++) {
  //   const id = i;
  //   const test = await page.evaluate(el => el?.innerText, await page.$(`${tableSelector} > tr:nth-child(${i}) > td`));
  //   const test2 = await page.$$eval(`${tableSelector} > tr:nth-child(${i}) > td:nth-child(3)`, el => el?.innerText);
  //   await wait(1000);
  //   console.log({test, test2});

  //   // const name = await page.evaluate(el => el.innerText, await page.$(`${tableSelector} > tr:nth-child(${i}) > td:nth-child(2)`));
  //   // const population = await page.evaluate(el => el.innerText, await page.$(`${tableSelector} > tr:nth-child(${i}) > td:nth-child(3)`));
  //   // const percentage = await page.evaluate(el => el.innerText, await page.$(`${tableSelector} > tr:nth-child(${i}) > td:nth-child(4)`));
  //   // const date = await page.evaluate(el => el.innerText, await page.$(`${tableSelector} > tr:nth-child(${i}) > td:nth-child(5)`));
  //   // const source = await page.evaluate(el => el.innerText, await page.$(`${tableSelector} > tr:nth-child(${i}) > td:nth-child(6)`));

  //   // console.log(id, name, population, percentage, date, source);
  //   return;
  //   // const actualCountryItem = new CountryItem(id, name, population, percentage, date, source)
  //   // countries.push(actualCountryItem)
  // }
  // console.log(countries)

  // Type into search box
  // await page.type('.search-box__input', 'automate beyond recorder');

  // Wait and click on first result
  // const searchResultSelector = '.search-box__link';
  // await page.waitForSelector(searchResultSelector);
  // await page.click(searchResultSelector);

  // // Locate the full title with a unique string
  // const textSelector = await page.waitForSelector(
  //   'text/Customize and automate'
  // );
  // const fullTitle = await textSelector?.evaluate((el) => el.textContent);

  // Print the full title
  // console.log('The title of this blog post is "%s".', fullTitle);

  // await browser.close();
})();
