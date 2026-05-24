# Project PRD Phases

## Status

Draft in progress.

Detailed Phase 1 implementation breakdown: `development_documentation/phase1_implementation_plan.md`

Agent-ready Phase 1 execution queue: `development_documentation/phase1_agent_execution_tasks.md`

## Phase Plan

- Phase 1: Form to first generated local site
  - Start with builder app shell and project workspace structure
  - Define the form schema and project data model before building the UI
  - Build style-reference loading, lightweight parsing, and validation before finishing the form UI
  - Build the multi-step form UI with a final confirmation summary
  - Create the project folder and persist inputs before generation starts
  - Create a lightweight project manifest for indexing project metadata and latest build state
  - Build the provider-agnostic LLM connector with Ollama as the first implementation
  - Deterministically generate and persist the normalized site brief from validated form input
  - Deterministically generate and persist generation context from the brief, selected style, preferences, and image metadata
  - Make one primary Qwen call to generate and persist a standalone `Next.js` site file bundle
  - Write generated site code under the active version's `site/` folder
  - Install per-project dependencies for the generated site with `npm`
  - Validate generated sites with install, build, and preview-start checks
  - Preserve visible install/build failure logs
  - Run limited Qwen repair attempts for generated-site install/build failures
  - Launch one active generated-site preview at a time as a separate local process
  - Auto-start preview after successful generation and validation
  - Do not auto-respawn previews after the builder app restarts
  - Build the project reopen list with lightweight metadata and preview relaunch support
  - Add a `Start Preview` action for generated projects that are not currently running
  - Add a `Stop Preview` action for running generated-site previews
  - Add form-based `Edit + Regenerate` as the primary regeneration path
  - Store each regeneration in a new version folder such as `v2` or `v3`
  - Expose generation-stage failure states to the user
  - Allow retrying generation from the same saved project after failure
  - Verify the generated site is responsive, coherent, and factually grounded
- Phase 2: Iteration, editing, multi-page support, and versioning
  - Add richer project iteration workflows beyond form-based regeneration
  - Add direct generated-code editing or structured content editing if needed
  - Add user review and editing of intermediate artifacts
  - Add multi-page site generation
  - Add version comparison, restore, and review flows
- Phase 3: Non-static capabilities such as contact forms
  - Add working contact forms and supporting non-static interactions
  - Add `Postgres` where needed for submissions, generation run history, project indexes, and operational state
- Release Phase: Guardrails, export UX, and production readiness
  - Add production guardrails for direct customer usage
  - Add malicious prompt and generated-code safety checks
  - Add dependency and package-policy controls
  - Add in-app export and download flows
  - Add hosted deployment and release-readiness workflows

Each phase should be written as concrete build tasks in dependency order.
