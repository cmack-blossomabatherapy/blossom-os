/**
 * resourceCollections — public alias for the smart-collection engine.
 *
 * The Resource Library smart collections were originally built in
 * `smartCollections.ts`. This file re-exports the same API under the
 * `resourceCollections` name so external prompts/docs that reference
 * `src/lib/resources/resourceCollections.ts` resolve to the real
 * implementation without duplicating logic.
 *
 * Always import smart collection helpers from this module going forward.
 */
export * from "./smartCollections";