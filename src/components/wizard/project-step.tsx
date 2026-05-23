import type { FieldErrors, WizardFormState } from "./types";

type ProjectStepProps = {
  state: WizardFormState;
  onChange: (field: keyof WizardFormState, value: string) => void;
  errors: FieldErrors;
};

export function ProjectStep({ state, onChange, errors }: ProjectStepProps) {
  return (
    <section className="wizard-step">
      <h2>Project Setup</h2>
      <p className="step-copy">
        Choose an internal project name. If left blank, it will default to your business name.
      </p>

      <label className="field">
        <span>Project Name (optional)</span>
        <input
          value={state.projectName}
          onChange={(event) => onChange("projectName", event.target.value)}
          placeholder="Blue Peak Dental Website"
        />
      </label>
      {errors.projectName ? <p className="field-error">{errors.projectName}</p> : null}
    </section>
  );
}
