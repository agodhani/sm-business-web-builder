# Phase 1 Implementation Plan

> **For agentic workers:** Use one task at a time in dependency order. Do not skip verification steps. Steps use checkbox syntax for tracking.

**Goal:** Build a local `Next.js` website builder that collects small-business input, runs an `Ollama`-backed generation pipeline, persists project artifacts, and previews a generated single-page site through the builder app.

**Architecture:** The builder app owns the full workflow. Users fill out a multi-step wizard, submit once, and the app creates a project workspace under `generated_projects/<project-slug>/v1/`. Generation runs through a provider-agnostic LLM connector, produces persisted intermediate artifacts, then emits fixed-schema page data rendered by a shared internal runtime for preview.

**Tech Stack:** `Next.js`, `TypeScript`, `React`, `Zod`, local filesystem APIs, `Ollama` HTTP API

---

## Proposed File Structure

### App shell

- `package.json`
- `next.config.ts`
- `tsconfig.json`
- `src/app/layout.tsx`
- `src/app/page.tsx`
- `src/app/projects/[projectSlug]/page.tsx`
- `src/app/api/projects/route.ts`
- `src/app/api/projects/[projectSlug]/generate/route.ts`
- `src/app/api/projects/[projectSlug]/retry/route.ts`
- `src/app/api/projects/[projectSlug]/preview/route.ts`

### UI

- `src/components/wizard/project-step.tsx`
- `src/components/wizard/business-basics-step.tsx`
- `src/components/wizard/services-step.tsx`
- `src/components/wizard/contact-location-step.tsx`
- `src/components/wizard/pricing-images-step.tsx`
- `src/components/wizard/style-preferences-step.tsx`
- `src/components/wizard/review-generate-step.tsx`
- `src/components/wizard/wizard-shell.tsx`
- `src/components/projects/project-list.tsx`
- `src/components/preview/generated-page.tsx`
- `src/components/preview/sections/hero-section.tsx`
- `src/components/preview/sections/services-section.tsx`
- `src/components/preview/sections/about-section.tsx`
- `src/components/preview/sections/pricing-section.tsx`
- `src/components/preview/sections/gallery-section.tsx`
- `src/components/preview/sections/contact-section.tsx`
- `src/components/preview/sections/footer-section.tsx`

### Domain and validation

- `src/lib/config.ts`
- `src/lib/types/project.ts`
- `src/lib/types/style.ts`
- `src/lib/types/page-data.ts`
- `src/lib/validation/wizard-schema.ts`
- `src/lib/validation/page-data-schema.ts`
- `src/lib/validation/style-schema.ts`

### Styles and generation

- `src/lib/styles/discover-styles.ts`
- `src/lib/styles/load-style.ts`
- `src/lib/styles/resolve-style-tokens.ts`
- `src/lib/projects/project-paths.ts`
- `src/lib/projects/project-manifest.ts`
- `src/lib/projects/project-storage.ts`
- `src/lib/projects/project-query.ts`
- `src/lib/llm/connector.ts`
- `src/lib/llm/ollama-connector.ts`
- `src/lib/generation/prompts/brief-prompt.ts`
- `src/lib/generation/prompts/page-plan-prompt.ts`
- `src/lib/generation/prompts/story-prompt.ts`
- `src/lib/generation/prompts/page-data-prompt.ts`
- `src/lib/generation/pipeline.ts`
- `src/lib/generation/stages/create-brief.ts`
- `src/lib/generation/stages/create-page-plan.ts`
- `src/lib/generation/stages/create-story-requirements.ts`
- `src/lib/generation/stages/create-page-data.ts`

### Tests

- `src/lib/styles/__tests__/load-style.test.ts`
- `src/lib/projects/__tests__/project-storage.test.ts`
- `src/lib/projects/__tests__/project-manifest.test.ts`
- `src/lib/validation/__tests__/wizard-schema.test.ts`
- `src/lib/validation/__tests__/page-data-schema.test.ts`
- `src/lib/llm/__tests__/ollama-connector.test.ts`
- `src/lib/generation/__tests__/pipeline.test.ts`
- `src/components/preview/__tests__/generated-page.test.tsx`
- `src/app/api/projects/__tests__/projects-route.test.ts`
- `src/app/api/projects/__tests__/generate-route.test.ts`
- `src/app/api/projects/__tests__/retry-route.test.ts`

---

## Task 1: Bootstrap the Builder App

**Files:**
- Create: `package.json`
- Create: `next.config.ts`
- Create: `tsconfig.json`
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`
- Create: `src/lib/config.ts`

- [ ] Initialize a `Next.js` TypeScript app in the repo root.
- [ ] Configure a single local app port in `src/lib/config.ts`.
- [ ] Render a minimal landing page with two regions:
  - project creation entry point
  - empty existing-project list state
- [ ] Verify the app boots locally.

**Verification**
- Run: `npm install`
- Run: `npm run dev`
- Expected: homepage loads without errors

**Deliverable**
- A runnable builder app shell.

---

## Task 2: Define Core Data Contracts

**Files:**
- Create: `src/lib/types/project.ts`
- Create: `src/lib/types/style.ts`
- Create: `src/lib/types/page-data.ts`
- Create: `src/lib/validation/wizard-schema.ts`
- Create: `src/lib/validation/page-data-schema.ts`
- Create: `src/lib/validation/style-schema.ts`
- Create: `src/lib/validation/__tests__/wizard-schema.test.ts`
- Create: `src/lib/validation/__tests__/page-data-schema.test.ts`

- [ ] Define the wizard input schema with required fields:
  - project name
  - business category
  - business name
  - short business description
  - repeatable service list
  - structured contact fields
  - city and state
  - selected style
- [ ] Define optional fields:
  - full address
  - pricing text
  - image uploads
  - preferences text
- [ ] Define the fixed page-data schema with supported section types:
  - `hero`
  - `services`
  - `about`
  - `pricing`
  - `gallery`
  - `contact`
  - `footer`
- [ ] Encode ordering rules in validation or generation helpers:
  - `hero` first
  - `contact` near the end
  - `footer` last
- [ ] Add tests for valid and invalid payloads.

**Verification**
- Run: `npm test -- wizard-schema page-data-schema`
- Expected: validation tests pass

**Deliverable**
- Stable typed contracts for inputs, styles, and generated page data.

---

## Task 3: Implement Style Discovery and Validation

**Files:**
- Create: `src/lib/styles/discover-styles.ts`
- Create: `src/lib/styles/load-style.ts`
- Create: `src/lib/styles/resolve-style-tokens.ts`
- Create: `src/lib/styles/__tests__/load-style.test.ts`
- Modify: `src/lib/config.ts`

- [ ] Point the app at `designs/awesome-design-md/design-md/`.
- [ ] Discover every `DESIGN.md` file under that directory.
- [ ] Parse each file into a structured style object.
- [ ] Validate required top-level fields against the style schema.
- [ ] Resolve token references like `"{colors.primary}"` into usable values for runtime rendering.
- [ ] Return all discovered styles for the picker UI.
- [ ] Add tests covering:
  - successful load
  - missing required style fields
  - token reference resolution

**Verification**
- Run: `npm test -- load-style`
- Expected: style loader tests pass

**Deliverable**
- A style loader that treats local `DESIGN.md` files as the source of truth.

---

## Task 4: Build Project Pathing, Manifest, and Storage

**Files:**
- Create: `src/lib/projects/project-paths.ts`
- Create: `src/lib/projects/project-manifest.ts`
- Create: `src/lib/projects/project-storage.ts`
- Create: `src/lib/projects/project-query.ts`
- Create: `src/lib/projects/__tests__/project-storage.test.ts`
- Create: `src/lib/projects/__tests__/project-manifest.test.ts`

- [ ] Define project workspace paths under `generated_projects/<project-slug>/v1/`.
- [ ] Default project name from business name while allowing override.
- [ ] Create manifest structure with:
  - project name
  - project slug
  - business name
  - selected style
  - latest build status
  - last updated time
- [ ] Persist:
  - raw form input
  - manifest
  - intermediate artifacts
  - final page data
  - copied images
  - preview metadata
- [ ] Preserve failed generation artifacts instead of deleting them.
- [ ] Add query helpers for listing reopenable projects.
- [ ] Add tests for slugging, directory creation, manifest updates, and artifact persistence.

**Verification**
- Run: `npm test -- project-storage project-manifest`
- Expected: storage tests pass

**Deliverable**
- A self-contained project workspace model.

---

## Task 5: Build the Multi-Step Wizard UI

**Files:**
- Create: `src/components/wizard/wizard-shell.tsx`
- Create: `src/components/wizard/project-step.tsx`
- Create: `src/components/wizard/business-basics-step.tsx`
- Create: `src/components/wizard/services-step.tsx`
- Create: `src/components/wizard/contact-location-step.tsx`
- Create: `src/components/wizard/pricing-images-step.tsx`
- Create: `src/components/wizard/style-preferences-step.tsx`
- Create: `src/components/wizard/review-generate-step.tsx`
- Modify: `src/app/page.tsx`

- [ ] Build wizard steps in this order:
  - Project
  - Business Basics
  - Services
  - Contact and Location
  - Pricing and Images
  - Style and Preferences
  - Review and Generate
- [ ] Enforce per-step validation before advancing.
- [ ] Do not autosave progress.
- [ ] Default project name from business name.
- [ ] Support repeatable services input.
- [ ] Support multiple optional image uploads.
- [ ] Populate the style picker from discovered styles.
- [ ] Show a final confirmation summary before submit.

**Verification**
- Run: `npm run dev`
- Expected: user can complete the full wizard locally

**Deliverable**
- A working customer-facing input flow.

---

## Task 6: Add Project Creation and Submit-Time Persistence

**Files:**
- Create: `src/app/api/projects/route.ts`
- Modify: `src/components/wizard/review-generate-step.tsx`
- Modify: `src/lib/projects/project-storage.ts`
- Create: `src/app/api/projects/__tests__/projects-route.test.ts`

- [ ] Implement a create-project API route.
- [ ] On submit:
  - validate payload
  - create project folder
  - create `v1` folder
  - write manifest
  - write raw form data
  - copy uploaded images into the project workspace
- [ ] Return the created `projectSlug`.
- [ ] Add tests for valid and invalid requests.

**Verification**
- Run: `npm test -- projects-route`
- Expected: project creation route tests pass

**Deliverable**
- Submit-time project creation with persisted inputs.

---

## Task 7: Implement the Provider-Agnostic LLM Connector

**Files:**
- Create: `src/lib/llm/connector.ts`
- Create: `src/lib/llm/ollama-connector.ts`
- Create: `src/lib/llm/__tests__/ollama-connector.test.ts`
- Modify: `src/lib/config.ts`

- [ ] Define a connector interface that hides provider details from the pipeline.
- [ ] Implement an `Ollama` adapter using one configured default model.
- [ ] Support structured JSON output requests.
- [ ] Normalize connector errors into stable app-level failures.
- [ ] Add tests for:
  - successful structured response
  - malformed provider response
  - connection failure

**Verification**
- Run: `npm test -- ollama-connector`
- Expected: connector tests pass

**Deliverable**
- A swappable LLM boundary with `Ollama` as the first backend.

---

## Task 8: Implement Brief Generation Stage

**Files:**
- Create: `src/lib/generation/prompts/brief-prompt.ts`
- Create: `src/lib/generation/stages/create-brief.ts`
- Modify: `src/lib/projects/project-storage.ts`
- Modify: `src/lib/types/project.ts`

- [ ] Convert raw wizard input into the normalized site brief stage.
- [ ] Use the connector to generate or refine normalized brief output where needed.
- [ ] Persist the brief artifact to the project workspace.
- [ ] Record stage status in the manifest.

**Verification**
- Run: `npm test -- pipeline`
- Expected: brief stage test coverage passes after pipeline tests are added

**Deliverable**
- Persisted normalized brief artifact.

---

## Task 9: Implement Page Plan Generation Stage

**Files:**
- Create: `src/lib/generation/prompts/page-plan-prompt.ts`
- Create: `src/lib/generation/stages/create-page-plan.ts`
- Modify: `src/lib/styles/load-style.ts`

- [ ] Combine the normalized brief with the selected style object.
- [ ] Generate a page plan that decides:
  - which supported sections to include
  - section ordering within allowed rules
  - visual emphasis hints
  - copy direction
- [ ] Persist the page plan artifact.
- [ ] Fail if the plan violates section or ordering rules.

**Verification**
- Run: `npm test -- pipeline`
- Expected: page plan stage tests pass

**Deliverable**
- Persisted page plan tied to the selected style.

---

## Task 10: Implement Story Requirements Generation Stage

**Files:**
- Create: `src/lib/generation/prompts/story-prompt.ts`
- Create: `src/lib/generation/stages/create-story-requirements.ts`

- [ ] Generate story requirements from the page plan.
- [ ] Capture copy intent for each planned section.
- [ ] Persist story requirements to disk.
- [ ] Record success or failure in the manifest.

**Verification**
- Run: `npm test -- pipeline`
- Expected: story requirements stage tests pass

**Deliverable**
- Persisted story requirements artifact.

---

## Task 11: Build the Shared Runtime and Section Components

**Files:**
- Create: `src/components/preview/generated-page.tsx`
- Create: `src/components/preview/sections/hero-section.tsx`
- Create: `src/components/preview/sections/services-section.tsx`
- Create: `src/components/preview/sections/about-section.tsx`
- Create: `src/components/preview/sections/pricing-section.tsx`
- Create: `src/components/preview/sections/gallery-section.tsx`
- Create: `src/components/preview/sections/contact-section.tsx`
- Create: `src/components/preview/sections/footer-section.tsx`
- Create: `src/components/preview/__tests__/generated-page.test.tsx`

- [ ] Build a shared renderer that consumes fixed page-data schema.
- [ ] Map each section type to one section component.
- [ ] Apply style tokens from the selected style object.
- [ ] Ensure sections can be omitted safely when absent.
- [ ] Add rendering tests for valid combinations of supported sections.

**Verification**
- Run: `npm test -- generated-page`
- Expected: preview renderer tests pass

**Deliverable**
- A reusable runtime that can render generated site data.

---

## Task 12: Implement Final Page-Data Generation

**Files:**
- Create: `src/lib/generation/prompts/page-data-prompt.ts`
- Create: `src/lib/generation/stages/create-page-data.ts`
- Modify: `src/lib/validation/page-data-schema.ts`

- [ ] Generate final structured page data from:
  - brief
  - page plan
  - story requirements
  - selected style
- [ ] Validate the output against the fixed page-data schema.
- [ ] Reject invalid section types or invalid ordering.
- [ ] Persist validated page data into the project workspace.

**Verification**
- Run: `npm test -- page-data-schema pipeline`
- Expected: final stage validation tests pass

**Deliverable**
- Validated page data ready for preview rendering.

---

## Task 13: Implement the End-to-End Generation Pipeline

**Files:**
- Create: `src/lib/generation/pipeline.ts`
- Create: `src/lib/generation/__tests__/pipeline.test.ts`
- Create: `src/app/api/projects/[projectSlug]/generate/route.ts`
- Create: `src/app/api/projects/[projectSlug]/retry/route.ts`
- Create: `src/app/api/projects/__tests__/generate-route.test.ts`
- Create: `src/app/api/projects/__tests__/retry-route.test.ts`

- [ ] Compose the stages in this order:
  - create brief
  - create page plan
  - create story requirements
  - create page data
- [ ] Update manifest state per stage.
- [ ] Preserve stage outputs on success and failure.
- [ ] Return failed stage name on error.
- [ ] Retry should rerun the full pipeline from the beginning.
- [ ] Add tests for:
  - successful pipeline run
  - failure in each stage
  - retry after failed generation

**Verification**
- Run: `npm test -- pipeline generate-route retry-route`
- Expected: pipeline and API tests pass

**Deliverable**
- A debuggable end-to-end generation flow.

---

## Task 14: Serve Preview Through the Builder App

**Files:**
- Create: `src/app/api/projects/[projectSlug]/preview/route.ts`
- Create: `src/app/projects/[projectSlug]/page.tsx`
- Modify: `src/components/preview/generated-page.tsx`

- [ ] Serve one active preview through the builder app.
- [ ] Load persisted page data and selected style for the requested project.
- [ ] Render the preview route from project artifacts, not in-memory wizard state.
- [ ] Ensure reopening a project reproduces the same preview.

**Verification**
- Run: `npm run dev`
- Expected: `/projects/<projectSlug>` renders the saved generated site

**Deliverable**
- Stable local preview served by the builder app.

---

## Task 15: Build the Reopen Project List

**Files:**
- Create: `src/components/projects/project-list.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/lib/projects/project-query.ts`

- [ ] List existing generated projects on the homepage.
- [ ] Show lightweight metadata:
  - project name
  - selected style
  - last updated time
  - latest build state
- [ ] Add reopen actions for:
  - open preview
  - rerun preview
  - retry generation after failure

**Verification**
- Run: `npm run dev`
- Expected: homepage lists persisted projects and links into preview

**Deliverable**
- A minimal project index for phase 1 reopening.

---

## Task 16: Add Failure Visibility and Status UX

**Files:**
- Modify: `src/components/wizard/review-generate-step.tsx`
- Modify: `src/components/projects/project-list.tsx`
- Modify: `src/lib/projects/project-manifest.ts`

- [ ] Show active generation state in the UI.
- [ ] Show failed stage name when generation fails.
- [ ] Surface retry action for failed runs.
- [ ] Read status from persisted manifest data.

**Verification**
- Run: `npm run dev`
- Expected: failures are visible and retryable from saved project state

**Deliverable**
- Clear user-facing generation status and failure reporting.

---

## Task 17: Final Quality Verification

**Files:**
- Modify as needed based on defects discovered during verification.

- [ ] Run the complete happy path with a real project.
- [ ] Run a no-images case and confirm `gallery` is omitted.
- [ ] Run a no-pricing case and confirm `pricing` is omitted.
- [ ] Confirm responsive behavior on desktop and mobile widths.
- [ ] Confirm generated copy is factually grounded in the input.
- [ ] Confirm project reopen reproduces preview from disk.

**Verification**
- Run: `npm test`
- Run: `npm run dev`
- Expected:
  - tests pass
  - generation succeeds
  - preview is coherent and responsive

**Deliverable**
- A verified phase 1 MVP implementation.

---

## Agent Execution Order

1. Task 1
2. Task 2
3. Task 3
4. Task 4
5. Task 5
6. Task 6
7. Task 7
8. Task 8
9. Task 9
10. Task 10
11. Task 11
12. Task 12
13. Task 13
14. Task 14
15. Task 15
16. Task 16
17. Task 17

## Notes for the Implementing Agent

- Keep `DESIGN.md` files as the style source of truth.
- Do not add post-generation editing in phase 1.
- Do not add multi-page logic in phase 1.
- Do not add contact form submission in phase 1.
- Do not introduce multiple live preview servers.
- Do not replace fixed page-data schema with freeform generated code.
