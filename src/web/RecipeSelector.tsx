import { Suspense, useEffect, useRef, useState } from "react";
import { Recipe } from "./Core";
import {
  graphql,
  fetchQuery,
  useRelayEnvironment,
  useMutation,
} from "react-relay";
import { RecipeSelectorSearchQuery } from "./__generated__/RecipeSelectorSearchQuery.graphql";
import { PrimaryButton } from "./PrimaryButton";
import { RecipeSelectorMutation } from "./__generated__/RecipeSelectorMutation.graphql";

function filter_nulls<T>(iter: (T | null | undefined)[]): T[] {
  const answer: T[] = [];
  for (const e of iter) {
    if (e == null) {
      continue;
    }
    answer.push(e);
  }
  return answer;
}

type RecipeEntry = NonNullable<
  NonNullable<RecipeSelectorSearchQuery["response"]["me"]>["search_recipes"]
>[0];
function useRecipeRecommendations(query: string) {
  const [reqs, setReqs] = useState<readonly RecipeEntry[]>([]);
  const environment = useRelayEnvironment();
  useEffect(() => {
    const subscription = fetchQuery<RecipeSelectorSearchQuery>(
      environment,
      graphql`
        query RecipeSelectorSearchQuery($query: String!, $limit: Int!) {
          me {
            search_recipes(query: $query, limit: $limit) {
              title
              recipe_id
            }
          }
        }
      `,
      { query, limit: 10 }
    ).subscribe({
      next(value) {
        setReqs(value.me?.search_recipes || []);
      },
    });
    () => subscription.unsubscribe();
  }, [query]);
  return reqs;
}

function Typeahead(props: { addRecipe: (r: RecipeEntry) => void }) {
  const [query, setQuery] = useState<string>("");
  const reqs = useRecipeRecommendations(query);
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div>
      <input
        ref={inputRef}
        onKeyUp={(event) => {
          setQuery((q) => inputRef?.current?.value || "");
        }}
      ></input>
      <div>Search your recipe</div>
      <ul>
        {reqs.map((e) => (
          <li onClick={() => props.addRecipe(e)}>{e.title}</li>
        ))}
      </ul>
    </div>
  );
}

export function RecipeSelector(props: {
  recipes: RecipeEntry[];
  onNextStep: (recipes: Recipe[]) => void;
}) {
  const [recipes, setRecipes] = useState<RecipeEntry[]>(props.recipes);
  const [commit, inFlight] = useMutation<RecipeSelectorMutation>(graphql`
    mutation RecipeSelectorMutation($recipe_ids: [Int!]!) {
      build_recipes(recipe_ids: $recipe_ids) {
        id
        url
        title
        image
        ingredients
        serves
        time
      }
    }
  `);
  return (
    <Suspense fallback={"Loading..."}>
      <Typeahead addRecipe={(r) => setRecipes((prev) => [r, ...prev])} />
      <ul>
        {recipes.map((r, ix) => (
          <li key={`${ix}-${r.recipe_id}`}>
            <span className="cx_rightpad_s">{r.title}</span>
            <button
              onClick={() => setRecipes((rs) => rs.filter((e) => e != r))}
            >
              x
            </button>
          </li>
        ))}
      </ul>
      <PrimaryButton
        onClick={() =>
          commit({
            variables: {
              recipe_ids: filter_nulls(recipes.map((r) => r.recipe_id)),
            },
            onError(e) {
              console.log(e);
            },
            onCompleted(response) {
              console.log(response);
              if (response.build_recipes) {
                props.onNextStep([...response.build_recipes]);
              }
            },
          })
        }
        label="Next"
      />
    </Suspense>
  );
}
