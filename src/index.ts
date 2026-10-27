export * from "./types";
export { validateManifest, validateAbsenceReport } from "./validate";
export * from "./registry";

/** Global the bundle IIFE assigns its module namespace to; connector is at `.connector`. */
export const BUNDLE_GLOBAL = "FaltasmasConnector";
