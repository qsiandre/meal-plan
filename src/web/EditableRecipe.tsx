import { useRef } from "react";
import { Recipe } from "./Core";

export function RecipeComplexity(props: { recipe: Recipe }) {
  if (props.recipe.serves == null && props.recipe.time == null) {
    return null;
  }
  if (props.recipe.serves == null) {
    return null;
  }
  return (
    <h4>
      {props.recipe.serves}
      {props.recipe.time == null ? "" : ` - ${props.recipe.time}`}
    </h4>
  );
}

export function EditableRecipe(props: {
  recipe: Recipe;
  onSave: (r: Recipe) => void;
}) {
  const ingredients = props.recipe.ingredients;
  const inputsRef = useRef<Array<HTMLTextAreaElement | null>>([]);
  return (
    <div className="editableRecipe_root">
      <div
        className="editableRecipe_header"
        style={{ backgroundImage: `url(${props.recipe.image})` }}
      >
        <div className="editableRecipe_header_title">
          <h3>{props.recipe.title} </h3>
          <RecipeComplexity recipe={props.recipe} />
        </div>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (ingredients == null) {
            return;
          }
          const edited: string[] = [];
          for (let ix = 0; ix < ingredients.length; ix++) {
            edited.push(inputsRef.current[ix]?.value || ingredients[ix]);
          }
          props.onSave({ ...props.recipe, ingredients: edited });
        }}
      >
        {ingredients?.map((i, ix) => (
          <textarea
            className="editableRecipe_ingredient"
            key={`${i}-${ix}`}
            ref={(e) => {
              if (inputsRef.current) {
                inputsRef.current[ix] = e;
              }
            }}
            defaultValue={i}
          ></textarea>
        ))}
        <div>
          <button>Save</button>
        </div>
      </form>
    </div>
  );
}
