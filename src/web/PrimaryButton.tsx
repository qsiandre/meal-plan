export function PrimaryButton(props: {
  disabled?: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      disabled={props.disabled || false}
      className="primaryButton"
      onClick={props.onClick}
    >
      {props.label}
    </button>
  );
}
