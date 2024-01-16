import { leftpad } from "../core";
import {
  genBrowser,
  scrapeGallery,
  scrapeGalleryPagesCount,
} from "../scrape/scrape";
import { sql } from "../sql";

process.on("SIGINT", () => {
  process.exit(0);
});

async function dailyRun(): Promise<void> {
  const jobID = crypto.randomUUID();
  console.log(`Running ${jobID} in ${Bun.env.HOST}`);
  const browser = await genBrowser();
  const count = await scrapeGalleryPagesCount(
    browser,
    "https://www.traderjoes.com/home/recipes"
  );
  const pages = [];
  for (let ix = 1; ix <= count; ix++) {
    pages.push(`https://www.traderjoes.com/home/recipes?page=${ix}`);
  }
  let ix = 0;
  const date = new Date();
  const ds = `${date.getFullYear()}-${leftpad(date.getMonth() + 1)}-${leftpad(
    date.getDate() + 1
  )}`;
  while (ix < pages.length) {
    const batch = [];
    for (let r = 0; r < 4 && ix < pages.length; r++, ix++) {
      batch.push(scrapeGallery(browser, pages[ix]));
    }
    const results = await Promise.allSettled(batch);
    const rows = [];
    for (const r of results) {
      if (r.status == "fulfilled") {
        for (const desc of r.value) {
          rows.push({
            ds,
            url: desc.url,
            kind: desc.type,
            description: desc.name,
            status: "ready",
            job_id: jobID,
            host: Bun.env.HOST,
          });
        }
      }
    }
    try {
      await sql.batch(
        `insert into to_scrape(ds, url, kind, description, status, job_id, host) 
            values (:ds, :url, :kind, :description, :status, :job_id, :host)`,
        rows
      );
    } catch (e) {
      console.error(e);
    }
  }
}
await dailyRun();
process.exit(0);
