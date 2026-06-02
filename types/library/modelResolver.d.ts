/**
 * Resolves device properties dynamically using similarity matching and heuristics.
 * @param {string} deviceClass - The 6-character class ID of the unknown device.
 * @param {Array<Object>} productIotMap - The loaded productIotMap JSON data.
 * @param {Object} allKnownDevices - All statically defined devices in models.js.
 * @returns {Object|null} The resolved device configuration object, or null if cannot be resolved.
 */
export function resolveDeviceProperties(deviceClass: string, productIotMap: Array<Object>, allKnownDevices: Object): Object | null;
/**
 * Calculates the technical similarity probability between two products.
 * @param {Object} p1 - The first product object.
 * @param {Object} p2 - The second product object.
 * @returns {number} Normalized similarity percentage (0 to 100).
 */
export function calculateModelSimilarity(p1: Object, p2: Object): number;
/**
 * Infers device capabilities and platform properties heuristically based on product info.
 * @param {Object} product - The product metadata.
 * @returns {Object} The inferred device configuration.
 */
export function inferPropertiesHeuristically(product: Object): Object;
/**
 * Extracts a platform codename from the model string.
 * Supports underscores and hyphens as delimiters.
 * Matches exact segments to avoid false substring positives.
 * @param {string} model - The model attribute.
 * @returns {string|null} The platform name, or null.
 */
export function extractPlatformCodename(model: string): string | null;
/**
 * Extracts a scientist codename from the model string (Alias for extractPlatformCodename).
 * @param {string} model - The model attribute.
 * @returns {string|null} The platform name, or null.
 */
export function extractScientist(model: string): string | null;
/**
 * Extracts the base UI logic prefix before the first underscore and normalizes it.
 * Normalization removes marketing suffixes to group variants into families.
 * @param {string} UILogicId - The UI Logic ID.
 * @returns {string|null} The normalized prefix, or null.
 */
export function extractUIBasePrefix(UILogicId: string): string | null;
/**
 * Extracts station keywords present in the product metadata.
 * @param {Object} product - The product object.
 * @returns {Array<string>} List of lowercase found keywords.
 */
export function getStationKeywords(product: Object): Array<string>;
/**
 * Checks whether a UILogicId uses a modern H5 plugin suffix.
 * @param {string} UILogicId - The UI Logic ID.
 * @returns {boolean} True if the final plugin segment ends with h5.
 */
export function hasH5PluginSuffix(UILogicId: string): boolean;
/**
 * Extracts the trailing hex/id value from an icon identifier or portal URL path.
 * @param {string} iconOrUrl - The icon field or iconUrl string.
 * @returns {string|null} The icon ID, or null.
 */
export function extractIconId(iconOrUrl: string): string | null;
/**
 * Classifies the manufacturer based on the product metadata.
 * @param {Object} product - The product object.
 * @returns {string} The manufacturer name ('yeedi' or 'ecovacs').
 */
export function getManufacturer(product: Object): string;
/**
 * Extracts a normalized series codename from the product metadata.
 * @param {Object} product - The product object.
 * @returns {string} The normalized series codename, or 'unknown'.
 */
export function getProductSeries(product: Object): string;
/**
 * Normalizes and completes the product name by adding missing brand prefixes (e.g. DEEBOT or yeedi).
 * @param {Object} product - The product object.
 * @returns {string} The normalized product name.
 */
export function getNormalizedProductName(product: Object): string;
//# sourceMappingURL=modelResolver.d.ts.map