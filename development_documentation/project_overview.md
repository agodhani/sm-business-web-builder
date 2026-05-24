# Project Overview

## Status

Draft. Discovery in progress.

## Purpose

A small business static website builder inspired by Apple's website design language.

## Problem

Small business owners without a developer or designer need a simple way to publish a polished static website that presents core business information and gives customers a clear way to contact them.

## Users

Primary user: small business owners with no developer or designer.

User needs:

- Display pricing
- Display contact information
- Display pictures
- Display location
- Display business details
- Explain what the business does
- Give customers a way to contact and connect with the business

## Core Outcome

Publish a polished static marketing website that helps customers understand the business and contact it.

## Product Flow

The business owner answers a guided multi-step form or wizard, uploads a few assets, and the builder generates the site automatically.

Wizard progress does not autosave in Phase 1. Persistence begins on generation submit.

The wizard should include a final confirmation summary before generation starts.

The wizard should validate required inputs at each step rather than only at final submission.

Wizard steps should be organized around business data categories rather than final page sections.

Phase 1 wizard steps:

- Project
- Business Basics
- Services
- Contact and Location
- Pricing and Images
- Style and Preferences
- Review and Generate

The system decides the page layout from the provided business data.

The user may also provide additional preferences that are fed into generation as prompt input.

If user preferences conflict with the selected style reference or with strong layout decisions, style coherence and structural quality take priority. User preferences act as soft guidance.

The builder itself is a local web app with a form UI.

The Phase 1 builder app should also use Next.js.

## Generation Engine

Phase 1 site generation uses an LLM.

Preferred deployment shape:

- Support local inference first
- Use Ollama in Phase 1
- Use one configured default Ollama model in Phase 1
- Keep the integration layer provider-agnostic through a separate connector so the model runtime or API provider can be swapped later

Generation should keep deterministic preparation separate from the primary model call.

Phase 1 pipeline stages:

1. Validate wizard input with the form schema
2. Deterministically normalize form input into a structured site brief
3. Deterministically build a generation context from the brief, selected `DESIGN.md`, preferences, and available image metadata
4. Make one primary Qwen call to generate a standalone `Next.js` single-page site file bundle
5. Install the generated site's per-project dependencies with `npm`
6. Run build validation for the generated site
7. If install or build validation fails, run a limited repair attempt using the failure output
8. Launch the generated site as a separate local preview process after successful generation and validation

The LLM should generate polished website copy from factual business inputs supplied by the user.

Phase 1 should run the full generation pipeline automatically.

User review of intermediate artifacts is deferred to Phase 2.

Generated copy is not edited directly in Phase 1. The primary regeneration path is to reopen the saved form, edit the form values, and generate a new project version.

Intermediate artifacts should be persisted so generation is debuggable and repeatable. Phase 1 should persist deterministic `brief.json` and `generation-context.json`; it should not use Qwen to re-normalize already structured form data.

The generated code is assumed trusted in Phase 1 local development. Production-grade prompt safety, generated-code safety scanning, dependency allowlists, and malicious-input guardrails are deferred to the Release Phase.

## Project Storage

Each generated site should have its own managed workspace under a project folder such as `generated_projects/<project-slug>/`.

The project name should be provided by the user. The folder name should use a slug derived from that project name.

The project name should default to the business name but remain user-editable.

Each project workspace should contain:

- Project-level manifest
- Version folders such as `v1`, `v2`, and `v3`
- Per-version raw form data
- Per-version normalized brief
- Per-version generation context
- Per-version generated code under `site/`
- Per-version copied assets
- Per-version dependency, build, generation, and preview logs
- Preview metadata

Failed generation artifacts should also be preserved within the project workspace for debugging.

Phase 1 should store the first build inside `v1`. Every edit-and-regenerate action should create the next folder, such as `v2` or `v3`, instead of overwriting a prior version.

The project manifest should track `activeVersion`, `latestVersion`, and the status of each version. A failed new version should not replace the active successful version.

## Failure Handling

If generation fails in Phase 1, the system should expose the failed stage to the user.

Phase 1 should allow retrying generation from the same saved project after a failure.

In Phase 1, retry should rerun the full pipeline from the beginning rather than resuming from the failed stage.

The primary regeneration path should be `Edit + Regenerate`: the builder loads the active version's saved form input into the wizard, the user can change any field including images, and submission creates a new version folder. `Regenerate Without Changes` is a nice-to-have, not required for Phase 1.

Install and build failures should remain visible to the user. A repair attempt may ask Qwen to fix the generated file bundle using the exact install/build failure output, but the original failure and repair logs must be preserved.

## Project Access

Phase 1 should allow users to reopen existing generated projects for viewing and rerunning the local preview.

Reopening a project for form-based editing and regeneration is part of the revised Phase 1 direction. Rich version comparison, direct generated-code editing, and intermediate-artifact editing are deferred to Phase 2.

When reopening projects in Phase 1, the app should provide a simple project list with lightweight metadata such as project name, selected style, and last updated time.

## Preview Runtime

Phase 1 supports one active generated-site preview process at a time.

The builder app should launch the active generated version as a separate local `Next.js` process on an available local port, capture preview logs, and store the running URL in preview metadata. Successful generation should auto-start preview once validation passes. Reopening a generated project should provide mandatory `Start Preview` and `Stop Preview` actions.

Preview processes are ephemeral. Restarting the builder app must not automatically respawn generated-site previews; the user must explicitly start preview again after an app restart.

## Export

In Phase 1, it is enough for generated code to exist in the project folder on disk.

In-app download or export is deferred to the Release Phase.

## Output

Primary output:

- A complete exportable `Next.js` website codebase generated under the active version's `site/` folder
- A spawned local preview process on a local port so the user can interact with the generated site after creation

The generated site should be a standalone `Next.js` app. The model may create its own components, CSS, and package dependencies for that generated project.

The generated site should not be forced through the builder's shared preview runtime. The builder owns orchestration, persistence, dependency installation, validation, process management, and preview launch.

The final generation artifact should be a structured file bundle representing a standalone generated site, not fixed page data rendered by generic builder components.

The file bundle should be validated before writing files. Validation should at minimum ensure valid JSON bundle structure, safe relative paths, required generated app files, dependency metadata, and successful install/build/start checks.

Phase 1 generates a single-page site, but it should not force a fixed list of visual section types.

The deterministic generation context can describe likely content areas, such as:

- `hero`
- `services`
- `about`
- `pricing`
- `contact`
- `footer`

The generator should include only content justified by the available input. It may choose visual composition, section names, and component structure to match the selected `DESIGN.md`.

Images should be placed wherever they best support the site. The prompt must not require a photo gallery by default. Qwen may use images in hero, about, service, feature, location, visual-band, card, or gallery treatments when appropriate, and it may omit images that do not improve the page.

More dynamic sectioning and multi-page output can be introduced in Phase 2.

## Scope Boundary

Phase 1 covers the flow from form input to first generated site.

Direct generated-code editing and rich version comparison are deferred to Phase 2. Form-based `Edit + Regenerate` is part of Phase 1.

Release guardrails for direct customer use are deferred to a later Release Phase and are out of scope for today's work.

Today's target is a local application flow where a user fills out the form, the system generates the website code, and the generated site runs locally for interaction.

## Website Structure

Phase 1 generates a single-page website.

Multi-page support is deferred to Phase 2.

The generated phase 1 site displays contact details only.

Working contact forms and other non-static interaction are deferred to Phase 3.

## Design Direction

The generated site should follow a polished, premium visual style inspired by Apple's design language.

For v1, users can pick any one locally available design influence file at a time. Styles are not combined. The selected local `DESIGN.md` file shapes the generated output.

The `DESIGN.md` files are the source of truth for style data in Phase 1.

Phase 1 should only add lightweight parsing and validation for these files rather than introducing a second normalized style format.

Phase 1 should expose all discovered local styles in the picker. The user selects one style at a time.

## Constraints

Pending.

## Minimum Input Data

The minimum information required to generate a useful first site is:

- Business category
- Business name
- Short business description
- Services or offerings entered as a repeatable list
- Contact information entered as structured fields
- Location entered as structured city/state fields with optional full address
- Selected style reference

Optional input:

- Pricing or price range as a single optional text field
- Multiple images supplied by the user and copied into the project workspace

## Future Data Storage

Phase 1 should keep the filesystem as the source of truth for generated projects and generated code.

Future phases may introduce `Postgres` for project indexes, users, generation runs, version records, logs, deployment records, contact-form submissions, and guardrail audit results. Generated code and assets can remain on disk or object storage while metadata and operational state move into the database.
