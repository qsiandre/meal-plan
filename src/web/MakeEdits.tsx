import { useState } from "react";
import { EditIngredients } from "./Core";
import { EditableRecipe } from "./EditableRecipe";
import { PrimaryButton } from "./PrimaryButton";

export function MakeEdits(props: {
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
