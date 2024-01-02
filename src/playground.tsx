import { createRoot } from "react-dom/client";
import { Suspense, useMemo, useRef, useState } from "react";
import { App } from "./web/App";
import {
  Store,
  RecordSource,
  Network,
  Observable,
  Environment,
} from "relay-runtime";
import type { IEnvironment, FetchFunction } from "relay-runtime";
import { RelayEnvironmentProvider } from "react-relay";
import { EditableRecipe } from "./web/EditableRecipe";
import { Recipe } from "./web/Core";

declare const body: Element;

const fetchFn: FetchFunction = (params, variables) => {
  const response = fetch("/graphql", {
    method: "POST",
    headers: [["Content-Type", "application/json"]],
    body: JSON.stringify({
      query: params.text,
      variables,
    }),
  });

  return Observable.from(response.then((data) => data.json()));
};

function createEnvironment(): IEnvironment {
  const network = Network.create(fetchFn);
  const store = new Store(new RecordSource());
  return new Environment({ store, network });
}

const root = createRoot(body);

function Example() {
  const recipe: Recipe = {
    image:
      "https://www.traderjoes.com/content/dam/trjo/context-images/60205-greek-chickpeas-2-pdp.jpg/jcr:content/renditions/cq5dam.web.1280.1280.jpeg",
    ingredients: [
      "1 can TJ’s Greek Chickpeas with Parsley & Cumin",
      "1 TJ’s Red Onion, chopped",
      "1 TJ’s Red Bell Pepper, chopped",
      "1 teaspoon TJ’s Smoked Paprika",
      "A few shakes of TJ’s 21 Seasoning Salute",
      "4 TJ’s Eggs",
    ],
    serves: "4 people",
    time: "25 mins",
    title: "Veggie Chickpea Hash",
    url: "https://www.traderjoes.com/home/recipes/veggie-chickpea-hash",
  };
  return (
    <section className="app_section">
      <EditableRecipe recipe={recipe} onSave={() => null} />
    </section>
  );
}

function AppShell() {
  const environment = useMemo(() => {
    return createEnvironment();
  }, []);
  return (
    <RelayEnvironmentProvider environment={environment}>
      <Suspense fallback={"Loading..."}>
        <Example />
      </Suspense>
    </RelayEnvironmentProvider>
  );
}

root.render(<AppShell />);
