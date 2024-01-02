import { AppBuildRecipesMutation } from "./__generated__/AppBuildRecipesMutation.graphql";

export type Recipe = NonNullable<
  AppBuildRecipesMutation["response"]["build_recipes"]
>[number];

export type Ingredient = {
  name: string;
  recipes: Recipe[];
};
export type Review = {
  step: "review";
  recipes: Recipe[];
  ingredients: Ingredient[];
};
export type SelectRecipes = { step: "select_recipes"; urls: Array<string> };
export type EditIngredients = {
  step: "edit_ingredients";
  recipes: Array<Recipe>;
};
export type Node = SelectRecipes | EditIngredients | Review;
