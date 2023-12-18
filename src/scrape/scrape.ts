import puppeteer, { Browser } from "puppeteer";

async function scrape(browser: Browser, url: string) {
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: "networkidle2" });
  const title = page.$eval(
    "[class*='recipeDetails__title']",
    (e) => (e as any).innerText
  );
  const image = page.$eval(
    "[class*='recipeDetails__image'] > picture > img",
    (e) => e.src
  );
  const steps = page.$eval("[class*='recipeIngredients__']", (e) =>
    (e as any).innerText.split("\n").slice(1)
  );
  const complexity = page.$$eval(
    "[class*='recipeDetails__complexity'] > span",
    (e) => e.map((x) => x.textContent)
  );
  return await Promise.all([title, image, steps, complexity]).finally(() =>
    page.close()
  );
}

const browser = await puppeteer.launch({ headless: "new" });
const martini = await scrape(
  browser,
  "https://www.traderjoes.com/home/recipes/jeans-favorite-martini"
);
const fettuccine = await scrape(
  browser,
  "https://www.traderjoes.com/home/recipes/chimichurri-fettuccine"
);
console.log(martini);
console.log(fettuccine);
process.exit();

// add a db on top to reduce the time to scrape
// front end 
// 1. get all the urls
// 2. convert them to recipe and servings
// 3. allow anji to edit text in client
// 4. save edits in db and links to the original recipes
// 5. generate weekly buying ingredients and print recipes  
