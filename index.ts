import { createYoga } from "graphql-yoga";
import { schema } from "./schema";
import { ParsedRecipe, genBrowser, parseDetailURLs } from "./src/scrape/scrape";
import { Int } from "grats";
import { sql } from "./src/sql";

declare module "bun" {
  interface Env {
    HOST: string;
  }
}

/** @gqlType */
export type Query = unknown;

/** @gqlField */
export function me(_: Query): User {
  return new User("me");
}

/** @gqlType */
class SearchResults {
  constructor(title: string, hint: string | undefined, id: number) {
    this.title = title;
    this.hint = hint;
    this.recipe_id = id;
  }

  /** @gqlField */
  title!: string;
  /** @gqlField */
  hint!: string | undefined;
  /** @gqlField */
  recipe_id!: Int | undefined;
}

/** @gqlType */
class User {
  constructor(name: string) {
    this.name = name;
  }
  /** @gqlField */
  name!: string;

  /** @gqlField */
  async search_recipes(args: {
    query: string;
    limit: Int;
  }): Promise<SearchResults[]> {
    const response = await fetch(
      `http://mp-ranker.avohome/search_recipe?q=${args.query}&limit=${args.limit}`
    );
    try {
      const results: {
        suffix_hint: string | undefined;
        features: { title: string };
        id: number;
      }[] = await response.json();
      console.log(results);
      return results.map(
        (entry) =>
          new SearchResults(entry.features.title, entry.suffix_hint, entry.id)
      );
    } catch {
      return [];
    }
  }
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
   * @killsParentOnException
   */
  id!: string;
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

/** @gqlField */
export async function build_recipes(
  _: Mutation,
  args: { recipe_ids: Array<Int> }
): Promise<Recipe[]> {
  const respose: Recipe[] = await sql.execute(
    `select id, url, title, ingredients, serves, time, image from dim_recipes 
      where id in (:ids)`,
    {
      ids: args.recipe_ids,
    }
  );
  return respose.map((r) => ({ ...r, id: r.id.toString() }));
}

const yoga = createYoga({ schema });

const index = {
  matcher: (r: Request) => r.method === "GET",
  response: async (_: Request) => new Response(Bun.file("./static/index.html")),
};
const playground = {
  matcher: (r: Request) => r.method === "GET" && r.url.endsWith("playground"),
  response: async (_: Request) =>
    new Response(Bun.file("./static/playground.html")),
};
const appjs = {
  matcher: (r: Request) => r.url.endsWith("app.js"),
  response: async (_: Request) =>
    new Response(Bun.file("./build/app.js"), {
      headers: { "X-SourceMap": "app.js.map" },
    }),
};
const playgroundjs = {
  matcher: (r: Request) => r.url.endsWith("playground.js"),
  response: async (_: Request) =>
    new Response(Bun.file("./build/playground.js"), {
      headers: { "X-SourceMap": "playground.js.map" },
    }),
};
const appcss = {
  matcher: (r: Request) => r.url.endsWith("app.css"),
  response: async (_: Request) => new Response(Bun.file("./static/app.css")),
};
const appjsmap = {
  matcher: (r: Request) => r.url.endsWith("app.js.map"),
  response: async (_: Request) => new Response(Bun.file("./build/app.js.map")),
};
const graphql = {
  matcher: (r: Request) => r.url.includes("/graphql"),
  response: async (r: Request) => await yoga.handle(r),
};
const handlers = [
  graphql,
  appjs,
  appcss,
  appjsmap,
  playgroundjs,
  playground,
  index,
];

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
