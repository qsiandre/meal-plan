import { expect, describe, it, beforeAll } from "bun:test";
import puppeteer, { Browser, Page } from "puppeteer-core";

async function navigateTo(browser: Browser | null, url: string): Promise<Page> {
  const page = await browser?.newPage();
  if (page == null) {
    throw Error("Couldn't navigate to page");
  }
  await page.goto(url);
  return page;
}

async function parse(page: Page, ...urls: string[]): Promise<void> {
  for (const url of urls) {
    await page.type("input[placeholder='Enter URL']", url);
    await page.click("button >>> ::-p-text('+')");
  }
  await page.click("button >>> ::-p-text(Next)");
}

describe("App", () => {
  let browser: Browser | null = null;
  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: "new",
      executablePath: Bun.env["CHROME_PATH"],
      args: ["--no-sandbox"],
    });
  });

  it("extracts multiple recipes from TJ's website", async () => {
    const page = await navigateTo(browser, "http:/localhost:3000");
    await parse(
      page,
      "https://www.traderjoes.com/home/recipes/veggie-chickpea-hash",
      "https://www.traderjoes.com/home/recipes/smoked-salmon-pasta-salad"
    );
    const veggie = await page.waitForSelector(
      "div >>> ::-p-text(Veggie Chickpea Hash)",
      { timeout: 10000 }
    );
    const veggieText = await veggie?.evaluate((e) => (e as any).innerText);
    expect(veggieText).toMatchSnapshot();
    const pasta = await page.waitForSelector(
      "div >>> ::-p-text(Smoked Salmon Pasta Salad)",
      { timeout: 10000 }
    );
    const pastaText = await pasta?.evaluate((e) => (e as any).innerText);
    expect(pastaText).toMatchSnapshot();
  });

  it.only("edits ingredients from a recipe", async () => {
    const page = await navigateTo(browser, "http:/localhost:3000");
    await parse(
      page,
      "https://www.traderjoes.com/home/recipes/veggie-chickpea-hash"
    );
    await page.waitForSelector("button >>> ::-p-text(Save)", {
      timeout: 10000,
    });
    await page.type("textarea >>> ::-p-text(Eggs)", "Edit ");
    await page.click("button >>> ::-p-text(Save)");
    await page.click("button >>> ::-p-text(Next)");
    const itemText = await page.$eval(
      "li >>> ::-p-text(Eggs)",
      (e) => (e as any).innerText
    );
    expect(itemText).toBe("Edit 4 TJ’s Eggs");
    const list = await page.$eval("ul", (e) => (e as any).innerText);
    expect(list).toMatchSnapshot();
  });
});
