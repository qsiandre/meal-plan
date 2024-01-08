import {
  genBrowser,
  parseDetailURLs,
  parseGalleryURLs,
  scrapeGalleryPagesCount,
} from "../scrape/scrape";

const type = Bun.argv[2];
const url = Bun.argv[3];
const browser = await genBrowser();
if (type == "recipe") {
  const entries = await parseDetailURLs(browser, [url]);
  console.log(JSON.stringify(entries, null, 4));
} else if (type == "gallery") {
  const entries = await parseGalleryURLs(browser, [url]);
  console.log(JSON.stringify(entries, null, 4));
} else {
  const n = await scrapeGalleryPagesCount(browser, url);
  console.log(n);
}

process.exit(0);
