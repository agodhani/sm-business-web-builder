# Phase 1 Agent Execution Tasks

> **For agentic workers:** Execute one task packet at a time. Do not start the next packet until the current packet's checks pass. Keep commits small and use the suggested commit messages unless the implementation differs materially.

**Primary references:**
- `development_documentation/project_overview.md`
- `development_documentation/project_mvp.md`
- `development_documentation/project_prd_phases.md`
- `development_documentation/phase1_implementation_plan.md`

**Phase 1 objective:** A local `Next.js` builder app lets a user complete a multi-step small-business form, choose one local `DESIGN.md` style, generate structured artifacts through an `Ollama` pipeline, persist the project under `generated_projects/<project-slug>/v1/`, and preview the generated single-page site through the builder app.

---

## Execution Rules

- Use `TypeScript` for all source files.
- Use `Zod` for runtime validation.
- Keep `DESIGN.md` files as the style source of truth.
- Persist artifacts to disk; do not keep generated output only in memory.
- Use one configured default `Ollama` model.
- Use fixed page-data schema and fixed Phase 1 section types.
- Do not implement post-generation editing, multi-page output, contact-form submission, hosted deployment, in-app export, or multiple model providers.
- After each task, run the task-specific checks and record any failures in the final task note or commit body.

---

## Environment Assumptions

- Repo root: `/Users/xdpanda/Documents/Development/website-builder`
- Style source: `designs/awesome-design-md/design-md/**/DESIGN.md`
- Generated project root: `generated_projects/`
- Builder preview route shape: `/projects/<projectSlug>`
- Default local builder URL: `http://localhost:3000`
- Default `Ollama` URL: `http://localhost:11434`

---

## Task Packet 01: Bootstrap Next.js App

**Depends on:** none

**Goal:** Create the runnable builder app foundation.

**Files to create:**
- `package.json`
- `next.config.ts`
- `tsconfig.json`
- `src/app/layout.tsx`
- `src/app/page.tsx`
- `src/app/globals.css`
- `src/lib/config.ts`

**Steps:**
- [x] Create a `Next.js` app using the App Router and TypeScript.
- [x] Add scripts: `dev`, `build`, `start`, `lint`, `test`.
- [x] Configure `src/lib/config.ts` with:
  - `APP_PORT = 3000`
  - `OLLAMA_BASE_URL = "http://localhost:11434"`
  - `DEFAULT_OLLAMA_MODEL`, read from env with a local fallback
  - `DESIGN_ROOT = "designs/awesome-design-md/design-md"`
  - `GENERATED_PROJECTS_ROOT = "generated_projects"`
- [x] Build a minimal homepage with an inactive wizard entry panel and an empty project-list state.
- [x] Add global CSS sufficient for readable local development.

**Acceptance checks:**
- [x] `npm install` completes.
- [x] `npm run dev` starts the app.
- [x] `http://localhost:3000` renders without runtime errors.
- [x] `npm run build` completes.

**Commit:**
- `feat: bootstrap next builder app`

---

## Task Packet 02: Add Test and Validation Tooling

**Depends on:** Task Packet 01

**Goal:** Establish the test harness before implementing shared contracts.

**Files to create or modify:**
- `vitest.config.ts`
- `src/test/setup.ts`
- `package.json`

**Steps:**
- [x] Install test dependencies for unit/component tests.
- [x] Configure `vitest` with TypeScript support.
- [x] Configure a DOM test environment for React component tests.
- [x] Add `npm test` script.
- [x] Add a smoke test if the framework requires at least one test file.

**Acceptance checks:**
- [x] `npm test` runs successfully.
- [x] `npm run build` still passes.

**Commit:**
- `test: configure phase one test harness`

---

## Task Packet 03: Define Domain Types and Wizard Schema

**Depends on:** Task Packet 02

**Goal:** Define the canonical form input contract.

**Files to create:**
- `src/lib/types/project.ts`
- `src/lib/validation/wizard-schema.ts`
- `src/lib/validation/__tests__/wizard-schema.test.ts`

**Required schema shape:**
- `projectName`: optional user override
- `businessName`: required string
- `businessCategory`: required string
- `businessDescription`: required string
- `services`: required non-empty list
- `contact`: structured phone/email/website/social fields
- `location`: required city/state, optional full address
- `pricing`: optional text
- `images`: optional list of uploaded image metadata
- `styleId`: required string
- `preferences`: optional text

**Steps:**
- [x] Define `WizardInput` TypeScript type from the Zod schema.
- [x] Enforce required fields with clear validation messages.
- [x] Enforce at least one service.
- [x] Allow optional pricing, images, full address, website, social links, and preferences.
- [x] Add tests for valid minimum input.
- [x] Add tests for missing business name, missing services, missing city/state, and missing style.

**Acceptance checks:**
- [x] `npm test -- wizard-schema` passes.
- [x] `npm run build` passes.

**Commit:**
- `feat: define wizard input schema`

---

## Task Packet 04: Define Style and Page Data Schemas

**Depends on:** Task Packet 03

**Goal:** Create fixed runtime contracts for styles and generated page data.

**Files to create:**
- `src/lib/types/style.ts`
- `src/lib/types/page-data.ts`
- `src/lib/validation/style-schema.ts`
- `src/lib/validation/page-data-schema.ts`
- `src/lib/validation/__tests__/page-data-schema.test.ts`

**Required page sections:**
- `hero`
- `services`
- `about`
- `pricing`
- `gallery`
- `contact`
- `footer`

**Steps:**
- [x] Define `StyleDefinition` with `version`, `name`, `description`, `colors`, `typography`, `rounded`, `spacing`, and `components`.
- [x] Define discriminated union types for all supported page sections.
- [x] Define `GeneratedPageData` with `site`, `theme`, and ordered `sections`.
- [x] Validate that unsupported section types are rejected.
- [x] Validate ordering rules:
  - `hero` must be first.
  - `footer` must be last.
  - `contact` must appear before `footer` when present.
- [x] Validate that `pricing` and `gallery` can be omitted.
- [x] Add tests for valid full page data, valid no-pricing/no-gallery data, invalid section type, and invalid ordering.

**Acceptance checks:**
- [x] `npm test -- page-data-schema` passes.
- [x] `npm run build` passes.

**Commit:**
- `feat: define generated page data schema`

---

## Task Packet 05: Implement Style Discovery and Parsing

**Depends on:** Task Packet 04

**Goal:** Load all local `DESIGN.md` styles for the picker and generator.

**Files to create:**
- `src/lib/styles/discover-styles.ts`
- `src/lib/styles/load-style.ts`
- `src/lib/styles/resolve-style-tokens.ts`
- `src/lib/styles/__tests__/load-style.test.ts`

**Steps:**
- [x] Recursively discover `DESIGN.md` files under `DESIGN_ROOT`.
- [x] Use each folder name as the stable `styleId`.
- [x] Parse the YAML-style frontmatter content into a style object.
- [x] Validate parsed content with `style-schema`.
- [x] Resolve string token references like `"{colors.primary}"`.
- [x] Return style summaries for UI use: `styleId`, `name`, `description`, `path`.
- [x] Add tests using fixture style data.

**Acceptance checks:**
- [x] `npm test -- load-style` passes.
- [x] A local script or test confirms the real style directory returns many styles.
- [x] `npm run build` passes.

**Commit:**
- `feat: load local design style references`

---

## Task Packet 06: Implement Project Paths and Manifest

**Depends on:** Task Packet 03

**Goal:** Create stable project folder and manifest conventions.

**Files to create:**
- `src/lib/projects/project-paths.ts`
- `src/lib/projects/project-manifest.ts`
- `src/lib/projects/__tests__/project-manifest.test.ts`

**Manifest fields:**
- `projectName`
- `projectSlug`
- `businessName`
- `selectedStyleId`
- `version`
- `status`
- `currentStage`
- `failedStage`
- `createdAt`
- `updatedAt`
- `previewPath`

**Steps:**
- [x] Implement slug creation from project name.
- [x] Default project name to business name when no override is provided.
- [x] Define paths for:
  - project root
  - `v1`
  - raw input
  - manifest
  - artifacts
  - assets
  - page data
  - preview metadata
- [x] Implement manifest creation.
- [x] Implement manifest status updates.
- [x] Add tests for slugging, default project name, path construction, and status transitions.

**Acceptance checks:**
- [x] `npm test -- project-manifest` passes.
- [x] `npm run build` passes.

**Commit:**
- `feat: add project manifest conventions`

---

## Task Packet 07: Implement Project Storage

**Depends on:** Task Packet 06

**Goal:** Persist project inputs, artifacts, assets, and manifest state.

**Files to create or modify:**
- `src/lib/projects/project-storage.ts`
- `src/lib/projects/project-query.ts`
- `src/lib/projects/__tests__/project-storage.test.ts`

**Steps:**
- [x] Create project and `v1` directories.
- [x] Write raw form input to disk.
- [x] Write and update manifest.
- [x] Copy uploaded images into the project `assets` directory.
- [x] Write stage artifacts under `v1/artifacts/`.
- [x] Write final page data under `v1/page-data.json`.
- [x] Preserve artifacts from failed attempts.
- [x] Query existing projects by reading manifests.
- [x] Sort project list by `updatedAt` descending.
- [x] Add storage tests using a temporary directory.

**Acceptance checks:**
- [x] `npm test -- project-storage` passes.
- [x] `npm run build` passes.

**Commit:**
- `feat: persist generated project workspaces`

---

## Task Packet 08: Build Project Creation API

**Depends on:** Task Packet 07

**Goal:** Persist a submitted wizard payload before generation starts.

**Files to create:**
- `src/app/api/projects/route.ts`
- `src/app/api/projects/__tests__/projects-route.test.ts`

**Steps:**
- [x] Implement `POST /api/projects`.
- [x] Validate request body with `wizard-schema`.
- [x] Create project workspace and manifest.
- [x] Save raw input and copied images.
- [x] Return `projectSlug` and manifest summary.
- [x] Implement `GET /api/projects` for reopen list data.
- [x] Add route tests for create success, invalid payload, and list projects.

**Acceptance checks:**
- [x] `npm test -- projects-route` passes.
- [x] Manual `POST` creates `generated_projects/<project-slug>/v1/`.

**Commit:**
- `feat: add project creation api`

---

## Task Packet 09: Build Multi-Step Wizard UI

**Depends on:** Task Packet 05 and Task Packet 08

**Goal:** Build the full user input flow.

**Files to create or modify:**
- `src/components/wizard/wizard-shell.tsx`
- `src/components/wizard/project-step.tsx`
- `src/components/wizard/business-basics-step.tsx`
- `src/components/wizard/services-step.tsx`
- `src/components/wizard/contact-location-step.tsx`
- `src/components/wizard/pricing-images-step.tsx`
- `src/components/wizard/style-preferences-step.tsx`
- `src/components/wizard/review-generate-step.tsx`
- `src/app/page.tsx`

**Steps:**
- [x] Render steps in the agreed order.
- [x] Validate each step before allowing next-step navigation.
- [x] Keep wizard state in the browser until submit.
- [x] Default project name from business name, but allow override.
- [x] Support add/remove service rows.
- [x] Support multiple optional image selections.
- [x] Load all discovered styles into the style picker.
- [x] Add preferences text area.
- [x] Render a final confirmation summary.
- [x] Submit to `POST /api/projects`.

**Acceptance checks:**
- [x] User can complete the wizard with minimum required data.
- [x] User cannot advance past a step with missing required data.
- [x] Submit creates project files on disk.
- [x] `npm run build` passes.

**Commit:**
- `feat: build phase one project wizard`

---

## Task Packet 10: Implement LLM Connector

**Depends on:** Task Packet 02

**Goal:** Add a swappable model boundary with `Ollama` as the first provider.

**Files to create:**
- `src/lib/llm/connector.ts`
- `src/lib/llm/ollama-connector.ts`
- `src/lib/llm/__tests__/ollama-connector.test.ts`

**Steps:**
- [x] Define `LLMConnector` interface with a structured JSON generation method.
- [x] Implement `OllamaConnector` using `OLLAMA_BASE_URL` and `DEFAULT_OLLAMA_MODEL`.
- [x] Send prompts to Ollama with JSON output requested.
- [x] Parse JSON responses.
- [x] Return typed success and failure results.
- [x] Normalize provider errors into app-level error objects.
- [x] Add tests with mocked fetch for success, invalid JSON, non-200 response, and network failure.

**Acceptance checks:**
- [x] `npm test -- ollama-connector` passes.
- [x] `npm run build` passes.

**Commit:**
- `feat: add ollama llm connector`

---

## Task Packet 11: Implement Generation Prompts and Stage Contracts

**Depends on:** Task Packet 04 and Task Packet 10

**Goal:** Define typed inputs and outputs for every generation stage.

**Files to create:**
- `src/lib/generation/prompts/brief-prompt.ts`
- `src/lib/generation/prompts/page-plan-prompt.ts`
- `src/lib/generation/prompts/story-prompt.ts`
- `src/lib/generation/prompts/page-data-prompt.ts`
- `src/lib/generation/types.ts`

**Steps:**
- [x] Define `SiteBrief`, `PagePlan`, `StoryRequirements`, and `StageResult` types.
- [x] Write brief prompt using raw wizard input.
- [x] Write page plan prompt using brief and selected style.
- [x] Write story prompt using page plan.
- [x] Write page-data prompt using all prior artifacts.
- [x] In every prompt, require factual grounding and no invented contact facts.
- [x] In page-data prompt, require fixed section types and ordering rules.

**Acceptance checks:**
- [x] `npm run build` passes.
- [x] Prompt files export pure functions with typed inputs and string output.

**Commit:**
- `feat: define generation prompt contracts`

---

## Task Packet 12: Implement Brief Stage

**Depends on:** Task Packet 11 and Task Packet 07

**Goal:** Generate and persist the normalized site brief.

**Files to create:**
- `src/lib/generation/stages/create-brief.ts`

**Files to modify:**
- `src/lib/projects/project-storage.ts`

**Steps:**
- [x] Read raw project input from disk.
- [x] Call the connector with the brief prompt.
- [x] Validate the brief contains business facts, services, contact, location, selected style, and optional fields.
- [x] Persist `brief.json`.
- [x] Update manifest stage status.
- [x] On failure, persist error metadata and failed stage.

**Acceptance checks:**
- [x] Unit test or mocked pipeline run creates `brief.json`.
- [x] Failed connector response marks `failedStage = "brief"`.
- [x] `npm run build` passes.

**Commit:**
- `feat: add site brief generation stage`

---

## Task Packet 13: Implement Page Plan Stage

**Depends on:** Task Packet 12 and Task Packet 05

**Goal:** Generate section plan from brief plus selected style.

**Files to create:**
- `src/lib/generation/stages/create-page-plan.ts`

**Steps:**
- [x] Load `brief.json`.
- [x] Load the selected style.
- [x] Generate a page plan with selected sections and ordering.
- [x] Omit `pricing` if no pricing input exists.
- [x] Omit `gallery` if no images exist.
- [x] Validate section types and ordering.
- [x] Persist `page-plan.json`.
- [x] Update manifest stage status.

**Acceptance checks:**
- [x] No-pricing input omits `pricing`.
- [x] No-image input omits `gallery`.
- [x] Invalid ordering fails the stage.
- [x] `npm run build` passes.

**Commit:**
- `feat: add page plan generation stage`

---

## Task Packet 14: Implement Story Requirements Stage

**Depends on:** Task Packet 13

**Goal:** Generate copy intent and narrative requirements before final page data.

**Files to create:**
- `src/lib/generation/stages/create-story-requirements.ts`

**Steps:**
- [x] Load `page-plan.json`.
- [x] Generate story requirements per planned section.
- [x] Require each section to include copy intent and factual constraints.
- [x] Persist `story-requirements.json`.
- [x] Update manifest stage status.
- [x] Mark `failedStage = "story-requirements"` on failure.

**Acceptance checks:**
- [x] Mocked stage persists story requirements.
- [x] Every planned section has a corresponding story requirement.
- [x] `npm run build` passes.

**Commit:**
- `feat: add story requirements generation stage`

---

## Task Packet 15: Implement Final Page Data Stage

**Depends on:** Task Packet 14 and Task Packet 04

**Goal:** Produce validated structured page data for runtime rendering.

**Files to create:**
- `src/lib/generation/stages/create-page-data.ts`

**Steps:**
- [x] Load brief, page plan, story requirements, and selected style.
- [x] Generate final `GeneratedPageData`.
- [x] Validate against `page-data-schema`.
- [x] Reject unsupported sections.
- [x] Reject invalid ordering.
- [x] Persist `page-data.json`.
- [x] Update manifest status to generated when successful.
- [x] Mark `failedStage = "page-data"` on failure.

**Acceptance checks:**
- [x] Valid mocked response persists `page-data.json`.
- [x] Invalid section type fails validation.
- [x] Invalid section order fails validation.
- [x] `npm run build` passes.

**Commit:**
- `feat: add final page data generation stage`

---

## Task Packet 16: Compose End-to-End Pipeline and Retry

**Depends on:** Task Packet 15

**Goal:** Run all generation stages through a single orchestration entry point.

**Files to create:**
- `src/lib/generation/pipeline.ts`
- `src/lib/generation/__tests__/pipeline.test.ts`
- `src/app/api/projects/[projectSlug]/generate/route.ts`
- `src/app/api/projects/[projectSlug]/retry/route.ts`
- `src/app/api/projects/__tests__/generate-route.test.ts`
- `src/app/api/projects/__tests__/retry-route.test.ts`

**Steps:**
- [x] Compose stages in this order: brief, page plan, story requirements, page data.
- [x] Update manifest before and after each stage.
- [x] Return generated status and preview path on success.
- [x] Return failed stage on failure.
- [x] Preserve successful artifacts from stages before the failure.
- [x] Implement retry as full pipeline rerun from the beginning.
- [x] Add API route for first generation.
- [x] Add API route for retry.
- [x] Add tests for successful pipeline, each stage failure, and retry.

**Acceptance checks:**
- [x] `npm test -- pipeline generate-route retry-route` passes.
- [x] Failed run records failed stage in manifest.
- [x] Retry reruns all stages.

**Commit:**
- `feat: orchestrate generation pipeline`

---

## Task Packet 17: Build Shared Preview Runtime

**Depends on:** Task Packet 04 and Task Packet 05

**Goal:** Render fixed page data using shared components and style tokens.

**Files to create:**
- `src/components/preview/generated-page.tsx`
- `src/components/preview/sections/hero-section.tsx`
- `src/components/preview/sections/services-section.tsx`
- `src/components/preview/sections/about-section.tsx`
- `src/components/preview/sections/pricing-section.tsx`
- `src/components/preview/sections/gallery-section.tsx`
- `src/components/preview/sections/contact-section.tsx`
- `src/components/preview/sections/footer-section.tsx`
- `src/components/preview/__tests__/generated-page.test.tsx`

**Steps:**
- [x] Create one React component per supported section type.
- [x] Render sections in the order provided by page data.
- [x] Apply colors, typography, spacing, and component hints from selected style.
- [x] Allow missing optional sections.
- [x] Render user images from project assets.
- [x] Ensure desktop and mobile layouts are responsive.
- [x] Add component tests for full page, no-pricing, and no-gallery cases.

**Acceptance checks:**
- [x] `npm test -- generated-page` passes.
- [x] `npm run build` passes.

**Commit:**
- `feat: render generated page data`

---

## Task Packet 18: Serve Preview from Builder App

**Depends on:** Task Packet 16 and Task Packet 17

**Goal:** Reopen and preview generated projects through builder routes.

**Files to create or modify:**
- `src/app/projects/[projectSlug]/page.tsx`
- `src/app/api/projects/[projectSlug]/preview/route.ts`
- `src/lib/projects/project-query.ts`

**Steps:**
- [x] Load manifest, selected style, and `page-data.json` from disk.
- [x] Render `/projects/<projectSlug>` using `GeneratedPage`.
- [x] Serve assets from the project workspace or expose a route that reads project assets.
- [x] Return a useful empty/error state if page data is missing.
- [x] Ensure only the builder app serves previews.

**Acceptance checks:**
- [x] Existing generated project opens at `/projects/<projectSlug>`.
- [x] Refreshing the preview page loads from disk.
- [x] Missing page data shows a clear status state.
- [x] `npm run build` passes.

**Commit:**
- `feat: serve generated previews from builder`

---

## Task Packet 19: Wire Wizard Submit to Generation

**Depends on:** Task Packet 09 and Task Packet 16

**Goal:** Make the wizard create a project, run generation, and navigate to preview.

**Files to modify:**
- `src/components/wizard/review-generate-step.tsx`
- `src/components/wizard/wizard-shell.tsx`
- `src/app/page.tsx`

**Steps:**
- [x] On final submit, call `POST /api/projects`.
- [x] Use returned `projectSlug` to call generate route.
- [x] Show active generation status while pipeline runs.
- [x] On success, navigate to `/projects/<projectSlug>`.
- [x] On failure, show failed stage and retry action.
- [x] Do not expose intermediate artifact editing.

**Acceptance checks:**
- [x] Happy path goes from wizard submit to preview.
- [x] Failed generation shows failed stage.
- [x] Retry action reruns generation.
- [x] `npm run build` passes.

**Commit:**
- `feat: connect wizard submit to generation`

---

## Task Packet 20: Build Reopen Project List

**Depends on:** Task Packet 08 and Task Packet 18

**Goal:** Show existing generated projects and allow preview relaunch.

**Files to create or modify:**
- `src/components/projects/project-list.tsx`
- `src/app/page.tsx`
- `src/lib/projects/project-query.ts`

**Steps:**
- [x] Load project summaries from manifests.
- [x] Show project name, selected style, last updated time, and latest build status.
- [x] Link generated projects to `/projects/<projectSlug>`.
- [x] Show retry action for failed projects.
- [x] Keep project list lightweight; do not add editing controls.

**Acceptance checks:**
- [x] Homepage shows generated projects.
- [x] Reopen link renders preview from disk.
- [x] Failed project shows retry option.
- [x] `npm run build` passes.

**Commit:**
- `feat: list and reopen generated projects`

---

## Task Packet 21: Add Status and Failure UX

**Depends on:** Task Packet 19 and Task Packet 20

**Goal:** Make generation state visible and actionable.

**Files to modify:**
- `src/components/wizard/review-generate-step.tsx`
- `src/components/projects/project-list.tsx`
- `src/app/projects/[projectSlug]/page.tsx`
- `src/lib/projects/project-manifest.ts`

**Steps:**
- [x] Display `currentStage` while generation is running.
- [x] Display `failedStage` after failure.
- [x] Display retry action after failed generation.
- [x] Display generated status after success.
- [x] Ensure UI reads persisted manifest state.

**Acceptance checks:**
- [x] Simulated failure shows failed stage.
- [x] Retry updates manifest state.
- [x] Successful generation shows generated status and preview.
- [x] `npm run build` passes.

**Commit:**
- `feat: expose generation status`

---

## Task Packet 22: End-to-End Manual Verification

**Depends on:** Task Packet 21

**Goal:** Confirm the MVP behavior matches the documents.

**Files to modify:**
- Only modify files needed to fix defects found during verification.

**Test scenarios:**
- [x] Generate a project with required fields only.
- [x] Generate a project with pricing and images.
- [x] Generate a project without pricing and confirm no `pricing` section.
- [x] Generate a project without images and confirm no `gallery` section.
- [x] Reopen a generated project from the homepage.
- [x] Refresh a preview route and confirm it loads from disk.
- [x] Simulate an `Ollama` failure and confirm failed stage is visible.
- [x] Retry failed generation and confirm full pipeline reruns.
- [x] Check desktop layout.
- [x] Check mobile layout.

**Acceptance checks:**
- [x] `npm test` passes.
- [x] `npm run build` passes.
- [x] Manual happy path succeeds.
- [x] Manual failure/retry path succeeds.

**Commit:**
- `test: verify phase one generated site flow`

---

## Final Phase 1 Completion Criteria

- [x] Local builder app runs.
- [x] User can complete the wizard.
- [x] User can select any discovered local style.
- [x] Project workspace is created under `generated_projects/<project-slug>/v1/`.
- [x] Raw input, manifest, artifacts, page data, assets, and preview metadata persist to disk.
- [x] `Ollama` pipeline runs through all stages.
- [x] Failed stage is visible when generation fails.
- [x] Retry reruns the full pipeline.
- [x] Preview renders through the builder app.
- [x] Existing projects can be reopened for preview.
- [x] No Phase 2 or Release Phase features are included.
