import type { FieldErrors, WizardFormState } from "./types";

type ServicesStepProps = {
  state: WizardFormState;
  onServiceChange: (index: number, value: string) => void;
  onAddService: () => void;
  onRemoveService: (index: number) => void;
  errors: FieldErrors;
};

export function ServicesStep({
  state,
  onServiceChange,
  onAddService,
  onRemoveService,
  errors
}: ServicesStepProps) {
  return (
    <section className="wizard-step">
      <h2>Services</h2>
      <p className="step-copy">List the services you want highlighted on the generated page.</p>

      <div className="field-stack">
        {state.services.map((service, index) => (
          <div key={`service-${index}`} className="service-row">
            <label className="field">
              <span>Service {index + 1}</span>
              <input
                value={service}
                onChange={(event) => onServiceChange(index, event.target.value)}
                placeholder="Teeth cleaning"
              />
            </label>
            <button
              type="button"
              onClick={() => onRemoveService(index)}
              disabled={state.services.length === 1}
              className="ghost-button"
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <button type="button" onClick={onAddService} className="secondary-button">
        Add Service
      </button>
      {errors.services ? <p className="field-error">{errors.services}</p> : null}
    </section>
  );
}
