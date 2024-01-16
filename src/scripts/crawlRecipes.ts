import { leftpad } from "../core";
import { genBrowser, scrapeDetails } from "../scrape/scrape";
import { sql } from "../sql";
import { throttle } from "./job";

process.on("SIGINT", () => {
  process.exit(0);
});

async function crawlRecipes(limit: number = 15): Promise<void> {
  const date = new Date();
  const ds = `${date.getFullYear()}-${leftpad(date.getMonth() + 1)}-${leftpad(
    date.getDate() + 1
  )}`;
  const jobID = crypto.randomUUID();
  console.log(`Running ${jobID} in ${Bun.env.HOST}`);
  const result: [{ id: number; url: string }] = await sql.execute(
    `select id, url from to_scrape 
      where status in ('ready', 'retry')
      limit :limit`,
    {
      limit,
    }
  );
  const browser = await genBrowser();
  await throttle(
    result,
    async (e) => {
      await sql.execute(
        `update to_scrape 
          set status = 'ongoing' 
          where id = :id`,
        {
          id: e.id,
        }
      );
      return await scrapeDetails(browser, e.url);
    },
    async (s, f) => {
      if (s.length > 0) {
        await sql.execute(
          `update to_scrape 
          set status = 'success' 
          where id in (:ids)`,
          { ids: s.map((e) => e[0].id) }
        );
        await sql.batch(
          `insert into dim_recipes
            (ds, url, type, description, directions, tags, ingredients, title, image, serves, time, host, job_id) 
            values 
            (:ds, :url, :type, :description, :directions, :tags, :ingredients, :title, :image, :serves, :time, :host, :job_id)`,
          s.map(([_, e]) => {
            return { ds, ...e, job_id: jobID, host: Bun.env.HOST };
          })
        );
      }
      if (f.length > 0) {
        await sql.execute(
          `update to_scrape 
          set status = 'retry' 
          where id in (:ids)`,
          { id: f.map((e) => e.id) }
        );
      }
    }
  );
}

console.log(Bun.argv);
await crawlRecipes(parseInt(Bun.argv[2], 10));
process.exit(0);
