/**
 * Orval input transformer. Runs on the parsed OpenAPI spec BEFORE generation.
 *
 * The bundled `api.yaml` is the full GitLab REST API (hundreds of endpoints,
 * thousands of schemas). Orval's built-in `filters` can only narrow by
 * tag/schema, not by individual path — and the relevant GitLab tags (Groups,
 * Members) would still pull in dozens of operations plus a huge schema graph.
 *
 * This transformer:
 *   1. Prunes `paths` to the exact 5 GET operations this tool needs.
 *   2. Wraps the list endpoints' 200 response in `array` (the spec declares them
 *      as a single entity $ref — a quirk — which would yield wrong return types).
 *   3. Prunes `components.schemas` to only those transitively reachable from the
 *      kept operations, so Orval doesn't try to generate (and choke on) the
 *      thousands of unrelated schemas.
 */

// Exact path keys to keep (as they appear in the spec, incl. the /api/v4 prefix).
const KEEP_PATHS = [
  "/api/v4/groups/{id}", // single group (object response — left as-is)
  "/api/v4/groups/{id}/descendant_groups", // list
  "/api/v4/groups/{id}/members", // list
  "/api/v4/groups/{id}/projects", // list
  "/api/v4/projects/{id}/members", // list
];

// Paths whose GET 200 response is a collection and must be wrapped in an array.
const LIST_PATHS = new Set([
  "/api/v4/groups/{id}/descendant_groups",
  "/api/v4/groups/{id}/members",
  "/api/v4/groups/{id}/projects",
  "/api/v4/projects/{id}/members",
]);

const SCHEMA_REF_PREFIX = "#/components/schemas/";

/** Recursively collect every `#/components/schemas/X` ref name inside a node. */
const collectRefs = (node, out) => {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node)) {
    for (const item of node) collectRefs(item, out);
    return;
  }
  for (const [key, value] of Object.entries(node)) {
    if (key === "$ref" && typeof value === "string" && value.startsWith(SCHEMA_REF_PREFIX)) {
      out.add(value.slice(SCHEMA_REF_PREFIX.length));
    } else {
      collectRefs(value, out);
    }
  }
};

module.exports = (spec) => {
  const prunedPaths = {};

  for (const path of KEEP_PATHS) {
    const pathItem = spec.paths[path];
    if (!pathItem || !pathItem.get) {
      throw new Error(`orval-transformer: expected GET ${path} in spec`);
    }

    // Keep only the GET operation — drop PUT/POST/DELETE we don't use.
    const get = pathItem.get;

    if (LIST_PATHS.has(path)) {
      const schema = get.responses?.["200"]?.content?.["application/json"]?.schema;
      if (!schema) {
        throw new Error(`orval-transformer: no 200 JSON schema for GET ${path}`);
      }
      get.responses["200"].content["application/json"].schema = {
        type: "array",
        items: schema,
      };
    }

    prunedPaths[path] = { get };
  }

  spec.paths = prunedPaths;

  // Transitively resolve which component schemas are still reachable.
  const allSchemas = spec.components?.schemas ?? {};
  const reachable = new Set();
  const queue = [];

  const seed = new Set();
  collectRefs(prunedPaths, seed);
  for (const name of seed) queue.push(name);

  while (queue.length > 0) {
    const name = queue.pop();
    if (reachable.has(name)) continue;
    reachable.add(name);
    const def = allSchemas[name];
    if (!def) continue; // ref to a missing schema — skip gracefully
    const refs = new Set();
    collectRefs(def, refs);
    for (const ref of refs) {
      if (!reachable.has(ref)) queue.push(ref);
    }
  }

  const prunedSchemas = {};
  for (const name of reachable) {
    if (allSchemas[name]) prunedSchemas[name] = allSchemas[name];
  }
  if (spec.components) spec.components.schemas = prunedSchemas;

  return spec;
};
