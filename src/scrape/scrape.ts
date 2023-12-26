import puppeteer, { Browser } from "puppeteer";

export type ParsedRecipe = {
  title: string;
  image: string;
  ingredients: string[] | null;
  serves: string | null;
  time: string | null;
  url: string;
};

async function scrape(browser: Browser, url: string): Promise<ParsedRecipe> {
  const page = await browser.newPage();
  await page.goto(url);
  const title = page.$eval(
    "[class*='recipeDetails__title']",
    (e) => (e as any).innerText
  );
  const image = page.$eval(
    "[class*='recipeDetails__image'] > picture > img",
    (e) => e.src
  );
  const ingredients = page.$eval("[class*='recipeIngredients__']", (e) =>
    (e as any).innerText.split("\n").slice(1)
  );
  const complexity = page.$$eval(
    "[class*='recipeDetails__complexity'] > span",
    (e) => e.map((x) => x.textContent)
  );
  return await Promise.all([title, image, ingredients, complexity])
    .then(([title, image, ingredients, [serves, time]]) => {
      return {
        title,
        image,
        ingredients: ingredients || null,
        serves,
        time,
        url: page.url(),
      };
    })
    .finally(() => page.close());
}
export async function parseURLs(browser: Browser, urls: string[]) {
  const scrapes = urls.map((url) => scrape(browser, url));
  return Promise.all(scrapes);
}

// add a db on top to reduce the time to scrape
// front end
// 1. get all the urls
// 2. convert them to recipe and servings
// 3. allow anji to edit text in client
// 4. save edits in db and links to the original recipes
// 5. generate weekly buying ingredients and print recipes
