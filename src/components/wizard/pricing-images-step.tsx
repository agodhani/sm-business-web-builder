import type { FieldErrors, WizardFormState } from "./types";

type PricingImagesStepProps = {
  state: WizardFormState;
  onChange: (field: keyof WizardFormState, value: string) => void;
  onImagesChange: (images: File[]) => void;
  errors: FieldErrors;
};

export function PricingImagesStep({
  state,
  onChange,
  onImagesChange,
  errors
}: PricingImagesStepProps) {
  return (
    <section className="wizard-step">
      <h2>Pricing and Images</h2>
      <p className="step-copy">
        Pricing and images are optional in Phase 1. Add them only if you want those sections included.
      </p>

      <label className="field">
        <span>Pricing Notes (optional)</span>
        <textarea
          value={state.pricing}
          onChange={(event) => onChange("pricing", event.target.value)}
          rows={4}
          placeholder="Starting at $129 per service, custom plans available."
        />
      </label>

      <label className="field">
        <span>Images (optional, multiple)</span>
        <input
          type="file"
          multiple
          onChange={(event) => onImagesChange(Array.from(event.target.files ?? []))}
        />
      </label>

      {state.selectedImages.length > 0 ? (
        <ul className="image-list">
          {state.selectedImages.map((file) => (
            <li key={file.name}>{file.name}</li>
          ))}
        </ul>
      ) : null}

      {errors.images ? <p className="field-error">{errors.images}</p> : null}
    </section>
  );
}
