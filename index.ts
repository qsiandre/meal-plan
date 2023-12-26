import { createYoga } from "graphql-yoga";
import { schema } from "./schema";
import { ParsedRecipe, parseURLs } from "./src/scrape/scrape";
import puppeteer from "puppeteer";

/** @gqlType */
export type Query = unknown;

/** @gqlField */
export function me(_: Query): User {
  return new User("me");
}

/** @gqlType */
class User {
  constructor(name: string) {
    this.name = name;
  }
  /** @gqlField */
  name!: string;
}

/** @gqlType */
class Recipe {
  constructor(props: ParsedRecipe) {
    this.url = props.url;
    this.title = props.title;
    this.ingredients = props.ingredients;
    this.serves = props.serves;
    this.time = props.time;
    this.image = props.image;
  }
  /**
   * @gqlField
   */
  image: string | null;
  /**
   * @gqlField
   */
  serves: string | null;

  /**
   * @gqlField
   */
  time: string | null;

  /**
   * @gqlField
   */
  ingredients: string[] | null;
  /**
   * @gqlField
   * @killsParentOnException
   */
  url: string;
  /**
   * @gqlField
   * @killsParentOnException
   */
  title: string;
}

/** @gqlType */
export type Mutation = unknown;

const browser = await puppeteer.launch({ headless: "new" });
/** @gqlField */
export async function build_recipes(
  _: Mutation,
  args: { urls: Array<string> }
): Promise<Recipe[]> {
  const parsed = await parseURLs(browser, args.urls);
  return parsed.map((r) => new Recipe(r));
}

const yoga = createYoga({ schema });

const index = {
  matcher: (r: Request) => r.method === "GET",
  response: async (_: Request) => new Response(Bun.file("./src/index.html")),
};

const appjs = {
  matcher: (r: Request) => r.url.endsWith("app.js"),
  response: async (_: Request) =>
    new Response(Bun.file("./build/app.js"), {
      headers: { "X-SourceMap": "app.js.map" },
    }),
};
const appjsmap = {
  matcher: (r: Request) => r.url.endsWith("app.js.map"),
  response: async (_: Request) => new Response(Bun.file("./build/app.js.map")),
};

const graphql = {
  matcher: (r: Request) => r.url.includes("/graphql"),
  response: async (r: Request) => await yoga.handle(r),
};
const handlers = [graphql, appjs, appjsmap, index];

const server = Bun.serve({
  port: 3000,
  fetch(req) {
    const handler = handlers.find((e) => e.matcher(req));
    if (handler == null) {
      return new Response("404 not found!");
    }
    return handler.response(req);
  },
});

console.log(`Listening on http://localhost:${server.port} ...`);

process.on("SIGINT", () => {
  process.exit(0);
});
