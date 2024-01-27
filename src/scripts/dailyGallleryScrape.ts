import { leftpad } from "../core";
import {
  genBrowser,
  scrapeGallery,
  scrapeGalleryPagesCount,
} from "../scrape/scrape";
import { sql } from "../sql";
import { throttle } from "./job";

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
  const date = new Date();
  const ds = `${date.getFullYear()}-${leftpad(date.getMonth() + 1)}-${leftpad(
    date.getDate() + 1
  )}`;
  await throttle(
    pages,
    async (e) => scrapeGallery(browser, e),
    async (s, _) => {
      try {
        await sql.batch(
          `insert into to_scrape(ds, url, kind, description, status, job_id, host) 
            values (:ds, :url, :kind, :description, :status, :job_id, :host)`,
          s
            .map(([_, xs]) =>
              xs.map((desc) => ({
                ds,
                url: desc.url,
                kind: desc.type,
                description: desc.name,
                status: "ready",
                job_id: jobID,
                host: Bun.env.HOST,
              }))
            )
            .flat()
        );
      } catch (e) {
        console.error(e);
      }
    }
  );
}
await dailyRun();
process.exit(0);
