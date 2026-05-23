import type { FieldErrors, WizardFormState } from "./types";

type ReviewGenerateStepProps = {
  state: WizardFormState;
  onSubmit: () => Promise<void>;
  onRetry: () => Promise<void>;
  submitting: boolean;
  submitError: string | null;
  generationStatusMessage: string | null;
  failedStage: string | null;
  canRetry: boolean;
  errors: FieldErrors;
};

export function ReviewGenerateStep({
  state,
  onSubmit,
  onRetry,
  submitting,
  submitError,
  generationStatusMessage,
  failedStage,
  canRetry,
  errors
}: ReviewGenerateStepProps) {
  return (
    <section className="wizard-step">
      <h2>Review and Create Project</h2>
      <p className="step-copy">Confirm details, then create the project workspace for generation.</p>

      <dl className="review-grid">
        <dt>Project Name</dt>
        <dd>{state.projectName.trim() || state.businessName.trim() || "—"}</dd>

        <dt>Business</dt>
        <dd>{state.businessName || "—"}</dd>

        <dt>Category</dt>
        <dd>{state.businessCategory || "—"}</dd>

        <dt>Services</dt>
        <dd>{state.services.filter((item) => item.trim().length > 0).join(", ") || "—"}</dd>

        <dt>Location</dt>
        <dd>
          {[state.city, state.state].filter((item) => item.trim().length > 0).join(", ") || "—"}
        </dd>

        <dt>Style</dt>
        <dd>{state.styleId || "—"}</dd>

        <dt>Images</dt>
        <dd>{state.selectedImageNames.length > 0 ? state.selectedImageNames.join(", ") : "None selected"}</dd>
      </dl>

      {errors.submit ? <p className="field-error">{errors.submit}</p> : null}
      {submitError ? <p className="field-error">{submitError}</p> : null}
      {generationStatusMessage ? <p className="field-success">{generationStatusMessage}</p> : null}
      {failedStage ? <p className="field-error">Generation failed at stage: {failedStage}</p> : null}

      <button type="button" onClick={() => void onSubmit()} disabled={submitting} className="primary-button">
        {submitting ? "Running Generation..." : "Create And Generate"}
      </button>
      {canRetry ? (
        <button type="button" onClick={() => void onRetry()} disabled={submitting} className="secondary-button">
          Retry Generation
        </button>
      ) : null}
    </section>
  );
}
