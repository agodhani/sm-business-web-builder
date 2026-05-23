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
  - Generate and persist the normalized site brief
  - Generate and persist the page plan from the brief and selected style reference
  - Generate and persist story requirements from the page plan
  - Build the shared internal runtime and component/template engine for generated sites
  - Define and validate the fixed page-data schema for generated output
  - Generate and persist structured page data for the runtime from the accumulated artifacts
  - Render the generated project through the shared runtime
  - Serve one active local preview on a fixed port through the builder app
  - Build the project reopen list with lightweight metadata and preview relaunch support
  - Expose generation-stage failure states to the user
  - Allow retrying generation from the same saved project after failure
  - Verify the generated site is responsive, coherent, and factually grounded
- Phase 2: Iteration, editing, multi-page support, and versioning
  - Reopen projects for continued editing
  - Add post-generation editing workflows
  - Add user review and editing of intermediate artifacts
  - Add multi-page site generation
  - Add real versioned regeneration and comparison flows
- Phase 3: Non-static capabilities such as contact forms
  - Add working contact forms and supporting non-static interactions
- Release Phase: Guardrails, export UX, and production readiness
  - Add production guardrails for direct customer usage
  - Add in-app export and download flows
  - Add hosted deployment and release-readiness workflows

Each phase should be written as concrete build tasks in dependency order.
