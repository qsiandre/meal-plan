import { createYoga } from "graphql-yoga";
import { schema } from "./schema";

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

  /** @gqlField */
  greet(args: { greeting: string }): string {
    return `${args.greeting}, ${this.name}`;
  }
}

/** @gqlField */
export function allUsers(_: Query): User[] {
  return [new User("me")];
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
