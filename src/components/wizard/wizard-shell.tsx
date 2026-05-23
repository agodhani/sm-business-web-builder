"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BusinessBasicsStep } from "./business-basics-step";
import { ContactLocationStep } from "./contact-location-step";
import { PricingImagesStep } from "./pricing-images-step";
import { ProjectStep } from "./project-step";
import { ReviewGenerateStep } from "./review-generate-step";
import { ServicesStep } from "./services-step";
import { StylePreferencesStep } from "./style-preferences-step";
import type { FieldErrors, StyleOption, WizardFormState } from "./types";

type WizardShellProps = {
  styles: StyleOption[];
};

const stepTitles = [
  "Project",
  "Business",
  "Services",
  "Contact",
  "Pricing + Images",
  "Style",
  "Review"
] as const;

function createInitialState(styles: StyleOption[]): WizardFormState {
  return {
    projectName: "",
    businessName: "",
    businessCategory: "",
    businessDescription: "",
    services: [""],
    phone: "",
    email: "",
    website: "",
    socialLinks: "",
    city: "",
    state: "",
    fullAddress: "",
    pricing: "",
    selectedImageNames: [],
    styleId: styles[0]?.styleId ?? "",
    preferences: ""
  };
}

function requireText(value: string): boolean {
  return value.trim().length > 0;
}

function parseSocialLinks(value: string): string[] {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

export function WizardShell({ styles }: WizardShellProps) {
  const router = useRouter();
  const [state, setState] = useState<WizardFormState>(() => createInitialState(styles));
  const [projectNameEdited, setProjectNameEdited] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [generationStatusMessage, setGenerationStatusMessage] = useState<string | null>(null);
  const [failedStage, setFailedStage] = useState<string | null>(null);
  const [activeProjectSlug, setActiveProjectSlug] = useState<string | null>(null);

  const stepTitle = stepTitles[stepIndex];
  const progressText = `Step ${stepIndex + 1} of ${stepTitles.length}: ${stepTitle}`;

  const populatedServices = useMemo(
    () => state.services.map((service) => service.trim()).filter((service) => service.length > 0),
    [state.services]
  );

  function onChange(field: keyof WizardFormState, value: string) {
    setState((current) => {
      const next = { ...current, [field]: value };
      if (field === "businessName" && !projectNameEdited) {
        next.projectName = value;
      }
      return next;
    });
    setErrors((current) => ({ ...current, [field]: "" }));
  }

  function onProjectNameChange(value: string) {
    setProjectNameEdited(true);
    onChange("projectName", value);
  }

  function onServiceChange(index: number, value: string) {
    setState((current) => {
      const nextServices = [...current.services];
      nextServices[index] = value;
      return {
        ...current,
        services: nextServices
      };
    });
    setErrors((current) => ({ ...current, services: "" }));
  }

  function onAddService() {
    setState((current) => ({
      ...current,
      services: [...current.services, ""]
    }));
  }

  function onRemoveService(index: number) {
    setState((current) => {
      if (current.services.length === 1) {
        return current;
      }

      return {
        ...current,
        services: current.services.filter((_, itemIndex) => itemIndex !== index)
      };
    });
  }

  function onImageNamesChange(imageNames: string[]) {
    setState((current) => ({
      ...current,
      selectedImageNames: imageNames
    }));
  }

  function validateCurrentStep(currentStep: number): FieldErrors {
    const nextErrors: FieldErrors = {};

    if (currentStep === 1) {
      if (!requireText(state.businessName)) {
        nextErrors.businessName = "Business name is required.";
      }
      if (!requireText(state.businessCategory)) {
        nextErrors.businessCategory = "Business category is required.";
      }
      if (!requireText(state.businessDescription)) {
        nextErrors.businessDescription = "Business description is required.";
      }
    }

    if (currentStep === 2 && populatedServices.length === 0) {
      nextErrors.services = "Add at least one service.";
    }

    if (currentStep === 3) {
      if (!requireText(state.phone)) {
        nextErrors.phone = "Phone is required.";
      }
      if (!requireText(state.email)) {
        nextErrors.email = "Email is required.";
      }
      if (!requireText(state.city)) {
        nextErrors.city = "City is required.";
      }
      if (!requireText(state.state)) {
        nextErrors.state = "State is required.";
      }
    }

    if (currentStep === 5 && !requireText(state.styleId)) {
      nextErrors.styleId = "A style selection is required.";
    }

    return nextErrors;
  }

  function goNextStep() {
    const nextErrors = validateCurrentStep(stepIndex);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setStepIndex((current) => Math.min(current + 1, stepTitles.length - 1));
  }

  function goPreviousStep() {
    setStepIndex((current) => Math.max(current - 1, 0));
  }

  async function submitProject() {
    const finalErrors = validateCurrentStep(1);
    if (populatedServices.length === 0) {
      finalErrors.services = "Add at least one service.";
    }
    if (!requireText(state.styleId)) {
      finalErrors.styleId = "A style selection is required.";
    }

    if (Object.keys(finalErrors).length > 0) {
      setErrors(finalErrors);
      setSubmitError("Please resolve required fields before submit.");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    setGenerationStatusMessage(null);
    setFailedStage(null);
    setErrors((current) => ({ ...current, submit: "" }));

    try {
      const socialLinks = parseSocialLinks(state.socialLinks);
      const payload = {
        projectName: state.projectName.trim(),
        businessName: state.businessName.trim(),
        businessCategory: state.businessCategory.trim(),
        businessDescription: state.businessDescription.trim(),
        services: populatedServices,
        contact: {
          phone: state.phone.trim(),
          email: state.email.trim(),
          website: state.website.trim() || undefined,
          socialLinks: socialLinks.length > 0 ? socialLinks : undefined
        },
        location: {
          city: state.city.trim(),
          state: state.state.trim(),
          fullAddress: state.fullAddress.trim() || undefined
        },
        pricing: state.pricing.trim() || undefined,
        styleId: state.styleId.trim(),
        preferences: state.preferences.trim() || undefined
      };

      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const responseBody = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(responseBody?.error ?? "Project creation failed.");
      }

      const responseBody = (await response.json()) as { projectSlug: string };
      const projectSlug = responseBody.projectSlug;
      setActiveProjectSlug(projectSlug);
      setGenerationStatusMessage("Project created. Generation pipeline is running...");

      const generationResponse = await fetch(`/api/projects/${projectSlug}/generate`, {
        method: "POST"
      });
      const generationBody = (await generationResponse.json().catch(() => null)) as
        | { failedStage?: string; message?: string; previewPath?: string }
        | null;

      if (!generationResponse.ok) {
        const stage = generationBody?.failedStage ?? "unknown";
        setFailedStage(stage);
        setSubmitError(generationBody?.message ?? "Generation failed.");
        setGenerationStatusMessage(null);
        return;
      }

      setGenerationStatusMessage("Generation completed. Opening preview...");
      router.push(`/projects/${projectSlug}`);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Project creation or generation failed.");
      setGenerationStatusMessage(null);
    } finally {
      setSubmitting(false);
    }
  }

  async function retryGeneration() {
    if (!activeProjectSlug) {
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    setGenerationStatusMessage("Retrying full generation pipeline...");
    setFailedStage(null);

    try {
      const response = await fetch(`/api/projects/${activeProjectSlug}/retry`, {
        method: "POST"
      });
      const responseBody = (await response.json().catch(() => null)) as
        | { failedStage?: string; message?: string }
        | null;

      if (!response.ok) {
        const stage = responseBody?.failedStage ?? "unknown";
        setFailedStage(stage);
        setSubmitError(responseBody?.message ?? "Retry failed.");
        setGenerationStatusMessage(null);
        return;
      }

      setGenerationStatusMessage("Retry succeeded. Opening preview...");
      router.push(`/projects/${activeProjectSlug}`);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Retry failed.");
      setGenerationStatusMessage(null);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="wizard-shell">
      <header className="wizard-header">
        <h1>New Website Project</h1>
        <p className="step-copy">
          Multi-step setup for Phase 1. Provide business details, choose a style, and create a project workspace.
        </p>
        <p className="wizard-progress">{progressText}</p>
      </header>

      {stepIndex === 0 ? (
        <ProjectStep state={state} onChange={(field, value) => (field === "projectName" ? onProjectNameChange(value) : onChange(field, value))} errors={errors} />
      ) : null}
      {stepIndex === 1 ? <BusinessBasicsStep state={state} onChange={onChange} errors={errors} /> : null}
      {stepIndex === 2 ? (
        <ServicesStep
          state={state}
          onServiceChange={onServiceChange}
          onAddService={onAddService}
          onRemoveService={onRemoveService}
          errors={errors}
        />
      ) : null}
      {stepIndex === 3 ? <ContactLocationStep state={state} onChange={onChange} errors={errors} /> : null}
      {stepIndex === 4 ? (
        <PricingImagesStep
          state={state}
          onChange={onChange}
          onImageNamesChange={onImageNamesChange}
          errors={errors}
        />
      ) : null}
      {stepIndex === 5 ? (
        <StylePreferencesStep state={state} styles={styles} onChange={onChange} errors={errors} />
      ) : null}
      {stepIndex === 6 ? (
        <ReviewGenerateStep
          state={state}
          onSubmit={submitProject}
          onRetry={retryGeneration}
          submitting={submitting}
          submitError={submitError}
          generationStatusMessage={generationStatusMessage}
          failedStage={failedStage}
          canRetry={Boolean(activeProjectSlug && failedStage)}
          errors={errors}
        />
      ) : null}

      <footer className="wizard-nav">
        <button type="button" onClick={goPreviousStep} disabled={stepIndex === 0} className="ghost-button">
          Back
        </button>
        {stepIndex < stepTitles.length - 1 ? (
          <button type="button" onClick={goNextStep} className="primary-button">
            Next
          </button>
        ) : null}
      </footer>
    </section>
  );
}
