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

Generation should run as a small pipeline rather than a single end-to-end model call.

Phase 1 pipeline stages:

1. Normalize form input into a structured site brief
2. Build a page plan from the brief plus the selected style reference
3. Build story requirements for the page from the initial plan
4. Use the structured artifacts to drive a constrained final generation step
5. Generate the Next.js single-page site code through the internal component system
6. Run the generated site locally for preview

The LLM should generate polished website copy from factual business inputs supplied by the user.

Phase 1 should run the full generation pipeline automatically.

User review of intermediate artifacts is deferred to Phase 2.

Generated copy is not user-editable in Phase 1.

Intermediate artifacts should be persisted so generation is debuggable and repeatable.

## Project Storage

Each generated site should have its own managed workspace under a project folder such as `generated_projects/<project-slug>/`.

The project name should be provided by the user. The folder name should use a slug derived from that project name.

The project name should default to the business name but remain user-editable.

Each project workspace should contain:

- Project manifest
- Raw form data
- Normalized brief
- Page plan
- Story requirements
- Generated code
- Preview metadata

Failed generation artifacts should also be preserved within the project workspace for debugging.

Phase 1 should store the first build inside a version-ready structure such as `v1` within the project folder.

Full versioned regeneration workflows are deferred to Phase 2.

## Failure Handling

If generation fails in Phase 1, the system should expose the failed stage to the user.

Phase 1 should allow retrying generation from the same saved project after a failure.

In Phase 1, retry should rerun the full pipeline from the beginning rather than resuming from the failed stage.

## Project Access

Phase 1 should allow users to reopen existing generated projects for viewing and rerunning the local preview.

Reopening a project for continued editing or iteration is deferred to Phase 2.

When reopening projects in Phase 1, the app should provide a simple project list with lightweight metadata such as project name, selected style, and last updated time.

## Preview Runtime

Phase 1 supports one active local preview at a time on a fixed port.

The preview should be served by the builder app itself rather than by spawning a separate server process per generated project.

## Export

In Phase 1, it is enough for generated code to exist in the project folder on disk.

In-app download or export is deferred to the Release Phase.

## Output

Primary output:

- A complete exportable static website codebase generated in Next.js with static output
- A spawned local preview on a specific port so the user can interact with the generated site after creation

The generated site should be built from a reusable internal component system rather than fully unconstrained code generation.

The generated site should be assembled through a shared internal runtime or template engine managed by the builder, not as a fully independent handcrafted app architecture per project.

The final generation artifact should be structured page data rendered by the shared runtime, not freeform React component code generation.

The generated page data should follow a fixed validated schema in Phase 1.

Phase 1 should support a fixed set of section types.

Phase 1 section types:

- `hero`
- `services`
- `about`
- `pricing`
- `gallery`
- `contact`
- `footer`

The generator should include only the sections justified by the available input. Unsupported or empty sections should be omitted.

Section order should be chosen by the generator within allowed rules rather than fixed globally by the runtime.

Phase 1 ordering rules:

- `hero` first
- `contact` near the end
- `footer` last

More dynamic sectioning can be introduced in Phase 2 alongside multi-page support.

## Scope Boundary

Phase 1 covers the flow from form input to first generated site.

Post-generation editing is deferred to Phase 2.

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
