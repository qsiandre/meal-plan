import { Suspense, useRef, useState } from "react";
import { graphql, useMutation } from "react-relay";
import { AppBuildRecipesMutation } from "./__generated__/AppBuildRecipesMutation.graphql";
import {
  Recipe,
  Review,
  SelectRecipes,
  EditIngredients,
  Node,
  Ingredient,
} from "./Core";
import { EditableRecipe } from "./EditableRecipe";
import { PrimaryButton } from "./PrimaryButton";

function match<Resolved>(
  matchers: Partial<{
    select_recipes: (node: SelectRecipes) => Resolved;
    edit_ingredients: (node: EditIngredients) => Resolved;
    review: (node: Review) => Resolved;
  }>,
  node: Node
): Resolved | null | undefined {
  switch (node.step) {
    case "select_recipes":
      return matchers.select_recipes?.(node);
    case "edit_ingredients":
      return matchers.edit_ingredients?.(node);
    case "review":
      return matchers.review?.(node);
  }
  return null;
}

function SelectRecipes(props: {
  recipes: string[];
  onNextStep: (recipes: Recipe[]) => void;
}) {
  const [recipes, setRecipes] = useState<string[]>(props.recipes);
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [commit, isInFlight] = useMutation<AppBuildRecipesMutation>(graphql`
    mutation AppBuildRecipesMutation($urls: [String!]!) {
      build_recipes(urls: $urls) {
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
      <div>
        <ul>
          {recipes.map((r, ix) => (
            <li key={`${ix}-${r}`}>
              <span className="cx_rightpad_s">{r}</span>
              <button
                onClick={() => setRecipes((rs) => rs.filter((e) => e != r))}
              >
                x
              </button>
            </li>
          ))}
        </ul>
        <form
          ref={formRef}
          onSubmit={(e) => {
            e.preventDefault();
            const url = inputRef.current?.value;
            if (url != null && url.trim().length > 0) {
              setRecipes((r) => [...r, url.trim()]);
            }
            formRef.current?.reset();
          }}
        >
          {isInFlight ? null : (
            <div className="cx_fullwidth">
              <input
                className="recipeSelector_input"
                ref={inputRef}
                name="selection"
                placeholder="Enter URL"
              ></input>
              {isInFlight ? null : (
                <button className="recipeSelector_action">+</button>
              )}
            </div>
          )}
        </form>
        {isInFlight ? (
          "Saving..."
        ) : (
          <PrimaryButton
            disabled={recipes.length == 0}
            label="Next"
            onClick={() => {
              commit({
                variables: { urls: recipes },
                onCompleted: (data) => {
                  const responses = data.build_recipes;
                  if (responses == null) {
                    console.error("mutation failed");
                    return;
                  }
                  const recipes: Recipe[] = responses.map((r) => r);
                  props.onNextStep(recipes);
                },
              });
            }}
          />
        )}
      </div>
    </Suspense>
  );
}

function ReadOnlyRecipes(props: { recipes: string[]; onEdit: () => void }) {
  return (
    <div>
      {props.recipes.map((r, ix) => (
        <div key={`${ix}-${r}`} className="cx_padding_s">
          {r}
        </div>
      ))}
      <PrimaryButton label="Edit" onClick={props.onEdit} />
    </div>
  );
}

function toIngredients(recipes: Recipe[]): Ingredient[] {
  const ingredient_x_recipe = new Map();
  for (const r of recipes) {
    for (const i of r.ingredients || []) {
      const ingredient = ingredient_x_recipe.get(i) || { name: i, recipes: [] };
      ingredient.recipes.push(r);
      ingredient_x_recipe.set(i, ingredient);
    }
  }
  return Array.from(ingredient_x_recipe.values());
}

function MakeEdits(props: {
  edits: EditIngredients;
  onNext: (edits: EditIngredients) => void;
}) {
  const [draft, setDraft] = useState(props.edits.recipes);
  return (
    <div>
      {props.edits.recipes.map((r, ix) => (
        <EditableRecipe
          key={`${ix}-${r.title}`}
          recipe={r}
          onSave={(changed) =>
            setDraft((rs) => rs.map((r, i) => (ix === i ? changed : r)))
          }
        />
      ))}
      <PrimaryButton
        label="Next"
        onClick={() => props.onNext({ ...props.edits, recipes: draft })}
      />
    </div>
  );
}

function ReadOnlyEdit(props: { onEdit: () => void }) {
  return <PrimaryButton label="Edit" onClick={props.onEdit} />;
}

function ReviewGroceries(props: { review: Review }) {
  return (
    <ul>
      {props.review.ingredients.map((i) => (
        <li key={i.name}>{i.name}</li>
      ))}
    </ul>
  );
}

export function App() {
  const [node, setNode] = useState<Node>({ step: "select_recipes", urls: [] });
  const goToSelectRecipes = (urls: string[]) =>
    setNode({ step: "select_recipes", urls });
  return (
    <main>
      <h1> Trader Joe's Weekly </h1>
      <section>
        <h2> Step 1: Enter URLs </h2>
        {match(
          {
            edit_ingredients: (edit) => (
              <ReadOnlyRecipes
                recipes={edit.recipes.map((r) => r.url)}
                onEdit={() => goToSelectRecipes(edit.recipes.map((r) => r.url))}
              />
            ),
            select_recipes: (select) => (
              <SelectRecipes
                recipes={select.urls}
                onNextStep={(recipes) => {
                  setNode({
                    step: "edit_ingredients",
                    recipes,
                  });
                }}
              />
            ),
            review: (review) => (
              <ReadOnlyRecipes
                recipes={review.recipes.map((r) => r.url)}
                onEdit={() =>
                  goToSelectRecipes(review.recipes.map((r) => r.url))
                }
              />
            ),
          },
          node
        )}
      </section>
      <section>
        <h2> Step 2: Edit ingredients </h2>
        {match(
          {
            edit_ingredients: (edits) => (
              <MakeEdits
                edits={edits}
                onNext={(edit) =>
                  setNode({
                    step: "review",
                    ingredients: toIngredients(edit.recipes),
                    recipes: edit.recipes,
                  })
                }
              />
            ),
            review: (review) => (
              <ReadOnlyEdit
                onEdit={() =>
                  setNode({ step: "edit_ingredients", recipes: review.recipes })
                }
              />
            ),
          },
          node
        )}
      </section>
      <section>
        <h2> Step 3: Review grocery list</h2>
        {match(
          {
            review: (review) => <ReviewGroceries review={review} />,
          },
          node
        )}
      </section>
    </main>
  );
}
