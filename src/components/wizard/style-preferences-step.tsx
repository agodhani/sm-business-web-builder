import type { FieldErrors, StyleOption, WizardFormState } from "./types";

type StylePreferencesStepProps = {
  state: WizardFormState;
  styles: StyleOption[];
  onChange: (field: keyof WizardFormState, value: string) => void;
  errors: FieldErrors;
};

export function StylePreferencesStep({ state, styles, onChange, errors }: StylePreferencesStepProps) {
  const selectedStyle = styles.find((style) => style.styleId === state.styleId);

  return (
    <section className="wizard-step">
      <h2>Style and Preferences</h2>
      <p className="step-copy">Pick one local DESIGN style and add optional generation preferences.</p>

      <label className="field">
        <span>Style</span>
        <select value={state.styleId} onChange={(event) => onChange("styleId", event.target.value)}>
          <option value="">Select a style</option>
          {styles.map((style) => (
            <option key={style.styleId} value={style.styleId}>
              {style.name} ({style.styleId})
            </option>
          ))}
        </select>
      </label>
      {errors.styleId ? <p className="field-error">{errors.styleId}</p> : null}

      {selectedStyle ? (
        <div className="style-preview">
          <p>
            <strong>{selectedStyle.name}</strong>
          </p>
          <p>{selectedStyle.description}</p>
        </div>
      ) : null}

      <label className="field">
        <span>Preferences (optional)</span>
        <textarea
          value={state.preferences}
          onChange={(event) => onChange("preferences", event.target.value)}
          rows={4}
          placeholder="Keep copy short and direct. Emphasize family care and same-week availability."
        />
      </label>
    </section>
  );
}
