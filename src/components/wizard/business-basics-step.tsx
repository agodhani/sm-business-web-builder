import type { FieldErrors, WizardFormState } from "./types";

type BusinessBasicsStepProps = {
  state: WizardFormState;
  onChange: (field: keyof WizardFormState, value: string) => void;
  errors: FieldErrors;
};

export function BusinessBasicsStep({ state, onChange, errors }: BusinessBasicsStepProps) {
  return (
    <section className="wizard-step">
      <h2>Business Basics</h2>
      <p className="step-copy">Add core details used for brand voice and section copy.</p>

      <label className="field">
        <span>Business Name</span>
        <input
          value={state.businessName}
          onChange={(event) => onChange("businessName", event.target.value)}
          placeholder="Blue Peak Dental"
        />
      </label>
      {errors.businessName ? <p className="field-error">{errors.businessName}</p> : null}

      <label className="field">
        <span>Business Category</span>
        <input
          value={state.businessCategory}
          onChange={(event) => onChange("businessCategory", event.target.value)}
          placeholder="Dental Clinic"
        />
      </label>
      {errors.businessCategory ? <p className="field-error">{errors.businessCategory}</p> : null}

      <label className="field">
        <span>Business Description</span>
        <textarea
          value={state.businessDescription}
          onChange={(event) => onChange("businessDescription", event.target.value)}
          placeholder="Family dentistry and preventive care."
          rows={4}
        />
      </label>
      {errors.businessDescription ? <p className="field-error">{errors.businessDescription}</p> : null}
    </section>
  );
}
