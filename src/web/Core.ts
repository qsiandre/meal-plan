export type Recipe = Readonly<{
  id: string;
  url: string;
  title: string;
  image: string | null | undefined;
  ingredients: readonly string[] | null | undefined;
  serves: string | null | undefined;
  time: string | null | undefined;
}>;

export type Ingredient = {
  name: string;
  recipes: Recipe[];
};
export type Review = {
  step: "review";
  recipes: Recipe[];
  ingredients: Ingredient[];
};
export type SelectRecipes = {
  step: "select_recipes";
  recipes: Array<{ recipe_id: number; title: string }>;
};
export type EditIngredients = {
  step: "edit_ingredients";
  recipes: Array<Recipe>;
};
export type Node = SelectRecipes | EditIngredients | Review;
