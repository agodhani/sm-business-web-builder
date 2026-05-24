# Project MVP

## Status

Not started.

## MVP Goal

Let a customer fill out a form, choose one style reference, generate a single-page static business website in code, and run it locally for interaction.

## Must Have

- Create a new project
- Fill out the business info form
- Choose one local style reference
- Run the generation pipeline
- Save artifacts and generated code into a project folder
- Generate a standalone `Next.js` site under the active project version
- Install per-project dependencies for the generated site with `npm`
- Show install/build failure state and logs when generated-site validation fails
- Run a limited Qwen repair attempt for failed generated-site install/build validation
- Launch the generated site as a separate local preview process after successful generation
- Let the user explicitly start and stop the generated-site preview after generation
- Reopen an existing project to start the preview again when it is not running
- Reopen the saved form, edit submitted values including images, and regenerate into a new version folder
- Show which stage failed if generation breaks

## Nice to Have

- Optional image uploads
- Lightweight project metadata in the reopen list
- Additional freeform user preferences field
- Clean saved intermediate artifacts for debugging
- Regenerate without changes to create another version from the active version's existing form input

## Out of Scope

- Multi-page sites
- Working contact forms
- Hosted deployment
- Multiple concurrent previews
- Automatic preview respawn after the builder app restarts
- In-app export or download
- Review or edit of intermediate artifacts
- Direct generated-code editing
- Visual version comparison and restore workflows
- Multiple model providers in active use
- Guardrails for production release

## Success Criteria

A user can fill out the form once and get a polished, locally running single-page business website without touching code.

The generated site must be:

- Coherent
- Visually polished
- Factually grounded in the provided input
- Responsive on desktop and mobile
- Complete enough to serve as a plausible first draft for a real small business

Images should be used contextually across the generated site as the model sees fit. A gallery is allowed when it improves the page, but it must not be forced by default.
