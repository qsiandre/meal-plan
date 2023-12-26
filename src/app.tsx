import { createRoot } from "react-dom/client";
import { Suspense, useMemo } from "react";
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

function AppShell() {
  const environment = useMemo(() => {
    return createEnvironment();
  }, []);
  return (
    <RelayEnvironmentProvider environment={environment}>
      <Suspense fallback={"Loading..."}>
        <App />
      </Suspense>
    </RelayEnvironmentProvider>
  );
}

root.render(<AppShell />);
