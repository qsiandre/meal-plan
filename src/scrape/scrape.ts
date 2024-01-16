import puppeteer from "puppeteer-core";
import { Browser } from "puppeteer-core";
import { filterNull } from "../core";

export type ParsedRecipe = {
  type: string | null;
  title: string;
  description: string | null;
  image: string;
  ingredients: string[] | null;
  serves: string | null;
  time: string | null;
  url: string;
  tags: string[];
  directions: string[];
};

// module that runs this daily: k3s chron, configure to retry 3 times if failure happens, 1 hour after each failure time
// module that saves urls to db
// each day, get the number of pages and scrape all url's from each page
// save the urls to be scraped in db, these will be ready by details scrapper

// module that reads urls from db and saves recipes to table
// each 15 mins read a list of entries to scrape from pending table and perform an scrape
// save details inside the dim_daily_recipes table
// if scrape fails log error in pending table

export async function scrapeDetails(
  browser: Browser,
  url: string
): Promise<ParsedRecipe> {
  const page = await browser.newPage();
  await page.goto(url);
  await page.waitForSelector("[class*='recipeDetails__categoryItem']");
  const type = page.$eval(
    "[class*='recipeDetails__categoryItem']",
    (e) => e.textContent
  );
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
  const tags = page.$$eval("[class*='FunTag_tag__text']", (e) =>
    e.map((x) => x.textContent)
  );
  const description = page.$eval(
    "[class*='recipeDetails__description']",
    (e) => e.textContent
  );
  const directions = page.$$eval("[class*='Directions_steps__item']", (e) =>
    e.map((x) => x.textContent)
  );

  // field resilence, if one fails return null
  return await Promise.all([
    type,
    directions,
    title,
    image,
    ingredients,
    complexity,
    tags,
    description,
  ])
    .then(
      ([
        type,
        directions,
        title,
        image,
        ingredients,
        [serves, time],
        tags,
        description,
      ]) => {
        return {
          type,
          directions: filterNull(directions).map((e) => e.trim()),
          title,
          image,
          ingredients: ingredients || null,
          serves,
          time,
          url: page.url(),
          tags: filterNull(tags).map((e) => e.trim()),
          description: description?.replace("Read More", "").trim() || null,
        };
      }
    )
    .finally(() => page.close());
}

type RecipeDescriptor = {
  name: string | null;
  type: string | null;
  url: string;
};

export async function scrapeGalleryPagesCount(
  browser: Browser,
  url: string
): Promise<number> {
  const page = await browser.newPage();
  await page.goto(url);
  page.waitForNetworkIdle();
  await page.waitForSelector("[class*='Pagination_pagination__lastItem']");
  const pageCounts = await page.$eval(
    "[class*='Pagination_pagination__lastItem']",
    (e) => e.textContent
  );
  if (pageCounts == null) {
    throw Error("Page Counts not found");
  }
  const n = parseInt(pageCounts.substring("page ".length));
  if (isNaN(n)) {
    throw Error("Page Counts can't be parsed");
  }
  return n;
}

export async function scrapeGallery(
  browser: Browser,
  url: string
): Promise<RecipeDescriptor[]> {
  const page = await browser.newPage();
  await page.goto(url);
  page.waitForNetworkIdle();
  await page.waitForSelector("a[class*='RecipeGridCard_recipe']");
  const recipes = await page.$$eval("a[class*='RecipeGridCard_recipe']", (e) =>
    e.map((it) => {
      const [type, name] = Array.from(it.children)
        .map((ch) => ch.textContent)
        .filter((x) => x && x.trim().length != 0);
      const url = it.href;
      return { url, type, name };
    })
  );
  return recipes;
}

export async function parseDetailURLs(browser: Browser, urls: string[]) {
  const scrapes = urls.map((url) => scrapeDetails(browser, url));
  return Promise.all(scrapes);
}

export async function parseGalleryURLs(browser: Browser, urls: string[]) {
  const scrapes = urls.map((url) => scrapeGallery(browser, url));
  return Promise.all(scrapes);
}

export async function genBrowser(): Promise<Browser> {
  return await puppeteer.launch({
    headless: "new",
    executablePath: Bun.env["CHROME_PATH"],
    args: ["--no-sandbox"],
  });
}
