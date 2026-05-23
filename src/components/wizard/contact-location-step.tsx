import type { FieldErrors, WizardFormState } from "./types";

type ContactLocationStepProps = {
  state: WizardFormState;
  onChange: (field: keyof WizardFormState, value: string) => void;
  errors: FieldErrors;
};

export function ContactLocationStep({ state, onChange, errors }: ContactLocationStepProps) {
  return (
    <section className="wizard-step">
      <h2>Contact and Location</h2>
      <p className="step-copy">These values become the canonical contact facts in generated content.</p>

      <label className="field">
        <span>Phone</span>
        <input
          value={state.phone}
          onChange={(event) => onChange("phone", event.target.value)}
          placeholder="555-123-4567"
        />
      </label>
      {errors.phone ? <p className="field-error">{errors.phone}</p> : null}

      <label className="field">
        <span>Email</span>
        <input
          value={state.email}
          onChange={(event) => onChange("email", event.target.value)}
          placeholder="hello@bluepeakdental.com"
        />
      </label>
      {errors.email ? <p className="field-error">{errors.email}</p> : null}

      <label className="field">
        <span>Website (optional)</span>
        <input
          value={state.website}
          onChange={(event) => onChange("website", event.target.value)}
          placeholder="https://www.bluepeakdental.com"
        />
      </label>

      <label className="field">
        <span>Social Links (optional, comma separated)</span>
        <input
          value={state.socialLinks}
          onChange={(event) => onChange("socialLinks", event.target.value)}
          placeholder="https://instagram.com/bluepeak, https://facebook.com/bluepeak"
        />
      </label>

      <label className="field">
        <span>City</span>
        <input value={state.city} onChange={(event) => onChange("city", event.target.value)} placeholder="Austin" />
      </label>
      {errors.city ? <p className="field-error">{errors.city}</p> : null}

      <label className="field">
        <span>State</span>
        <input value={state.state} onChange={(event) => onChange("state", event.target.value)} placeholder="TX" />
      </label>
      {errors.state ? <p className="field-error">{errors.state}</p> : null}

      <label className="field">
        <span>Full Address (optional)</span>
        <input
          value={state.fullAddress}
          onChange={(event) => onChange("fullAddress", event.target.value)}
          placeholder="123 Main St, Austin, TX 78701"
        />
      </label>
    </section>
  );
}
