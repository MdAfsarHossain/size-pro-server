import axios, { AxiosInstance } from "axios";
import httpStatus from "http-status";
import config from "../../../config";
import ApiError from "../../errors/ApiError";

const SHOPIFY_API_VERSION = "2024-10";

type ShopifyCsvRow = Record<string, string>;

interface IShopifyMetafield {
  namespace: string;
  key: string;
  value: string;
  type: string;
}

interface ISkippedMetafield {
  namespace: string;
  key: string;
  reason: string;
}

interface IProductResult {
  handle: string;
  title: string;
  success: boolean;
  shopifyProductId?: number;
  adminUrl?: string;
  metafieldResults?: (IShopifyMetafield & { success: true })[];
  droppedMetafields?: { metafield: IShopifyMetafield; reason: string }[];
  skippedMetafields?: ISkippedMetafield[];
  publish?: { success: boolean; message?: string };
  error?: any;
}

// Same quote/comma/newline aware parser used in the csv module, kept generic
// here (no header filtering) since Shopify's export uses every column.
const parseCsv = (csvContent: string): ShopifyCsvRow[] => {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentEntry = "";
  let insideQuote = false;

  for (let i = 0; i < csvContent.length; i++) {
    const char = csvContent[i];
    const nextChar = csvContent[i + 1];

    if (char === '"') {
      if (insideQuote && nextChar === '"') {
        currentEntry += '"';
        i++;
      } else {
        insideQuote = !insideQuote;
      }
    } else if (char === "," && !insideQuote) {
      currentRow.push(currentEntry);
      currentEntry = "";
    } else if ((char === "\r" || char === "\n") && !insideQuote) {
      currentRow.push(currentEntry);
      currentEntry = "";
      if (currentRow.length > 0 && (currentRow.length > 1 || currentRow[0] !== "")) {
        rows.push(currentRow);
      }
      currentRow = [];
      if (char === "\r" && nextChar === "\n") i++;
    } else {
      currentEntry += char;
    }
  }

  if (currentEntry || currentRow.length > 0) {
    currentRow.push(currentEntry);
    if (currentRow.length > 0 && (currentRow.length > 1 || currentRow[0] !== "")) {
      rows.push(currentRow);
    }
  }

  if (rows.length === 0) return [];

  const headers = rows[0].map((h) => h.trim());
  return rows.slice(1).map((row) => {
    const obj: ShopifyCsvRow = {};
    headers.forEach((header, index) => {
      obj[header] = row[index] !== undefined ? row[index].trim() : "";
    });
    return obj;
  });
};

// In Shopify's product CSV format, only the first row of a product carries
// the shared fields (title, description, ...); later rows for the same
// "URL handle" only add extra variants and/or extra images.
const groupRowsByHandle = (rows: ShopifyCsvRow[]): ShopifyCsvRow[][] => {
  const groups = new Map<string, ShopifyCsvRow[]>();

  rows.forEach((row) => {
    const handle = row["URL handle"];
    if (!handle) return;
    if (!groups.has(handle)) groups.set(handle, []);
    groups.get(handle)!.push(row);
  });

  return Array.from(groups.values());
};

const toBoolean = (value: string) => value?.trim().toUpperCase() === "TRUE";

const toNumber = (value: string): number | undefined =>
  value && !isNaN(Number(value)) ? Number(value) : undefined;

const isVariantRow = (row: ShopifyCsvRow) =>
  Boolean(row["Option1 value"] || row["SKU"] || row["Price"]);

const isImageRow = (row: ShopifyCsvRow) => Boolean(row["Product image URL"]);

const WEIGHT_UNIT_MAP: Record<string, string> = {
  g: "GRAMS",
  kg: "KILOGRAMS",
  lb: "POUNDS",
  lbs: "POUNDS",
  oz: "OUNCES",
};

const getShopifyClient = (): AxiosInstance => {
  const { storeUrl, adminApiToken } = config.shopify;

  if (!storeUrl || !adminApiToken) {
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Shopify store URL or Admin API token is not configured",
    );
  }

  return axios.create({
    baseURL: `${storeUrl.replace(/\/$/, "")}/admin/api/${SHOPIFY_API_VERSION}`,
    headers: {
      "X-Shopify-Access-Token": adminApiToken,
      "Content-Type": "application/json",
    },
  });
};

// productSet needs a location to assign "Inventory quantity" to. The GraphQL
// `locations` query needs a `read_locations` scope this app doesn't have, but
// the REST shop resource returns the primary location id without any extra
// scope — used here purely as a location-id lookup, everything else in this
// module goes through GraphQL.
const getPrimaryLocationGid = async (client: AxiosInstance): Promise<string | undefined> => {
  try {
    const { data } = await client.get("/shop.json");
    const locationId = data?.shop?.primary_location_id;
    return locationId ? `gid://shopify/Location/${locationId}` : undefined;
  } catch (error: any) {
    console.error(
      "Failed to resolve primary location for inventory quantities:",
      error?.response?.data || error.message,
    );
    return undefined;
  }
};

// Product options must be pre-declared with every value any variant will use
// (productSet's variants reference them by name via optionValues), so this
// collects the distinct set of values per option across all variant rows,
// not just the main row.
const buildProductOptions = (mainRow: ShopifyCsvRow, variantRows: ShopifyCsvRow[]) => {
  return [1, 2, 3]
    .map((n) => {
      const name = mainRow[`Option${n} name`];
      if (!name) return null;

      const values = Array.from(
        new Set(variantRows.map((row) => row[`Option${n} value`]).filter(Boolean)),
      );

      return values.length ? { name, values: values.map((v) => ({ name: v })) } : null;
    })
    .filter(Boolean);
};

const buildProductSetVariant = (
  row: ShopifyCsvRow,
  mainRow: ShopifyCsvRow,
  locationGid: string | undefined,
) => {
  const optionValues = [1, 2, 3]
    .map((n) => {
      const optionName = mainRow[`Option${n} name`];
      const value = row[`Option${n} value`];
      return optionName && value ? { optionName, name: value } : null;
    })
    .filter(Boolean);

  const weightValue = toNumber(row["Weight value (grams)"]);
  const weightUnit =
    WEIGHT_UNIT_MAP[(row["Weight unit for display"] || "g").toLowerCase()] || "GRAMS";

  const variant: Record<string, any> = {
    optionValues,
    price: row["Price"] || "0.00",
    sku: row["SKU"] || undefined,
    barcode: row["Barcode"] || undefined,
    compareAtPrice: row["Compare-at price"] || undefined,
    taxable: row["Charge tax"] ? toBoolean(row["Charge tax"]) : true,
    inventoryPolicy: toBoolean(row["Continue selling when out of stock"]) ? "CONTINUE" : "DENY",
    inventoryItem: {
      tracked: row["Inventory tracker"] ? true : undefined,
      requiresShipping: row["Requires shipping"] ? toBoolean(row["Requires shipping"]) : true,
      cost: row["Cost per item"] || undefined,
      // Shopify rejects weight.value without weight.unit (and vice versa) —
      // always send both together, never just the raw number.
      measurement:
        weightValue !== undefined ? { weight: { value: weightValue, unit: weightUnit } } : undefined,
    },
  };

  if (locationGid) {
    variant.inventoryQuantities = [
      { locationId: locationGid, name: "available", quantity: toNumber(row["Inventory quantity"]) ?? 0 },
    ];
  }

  // productSet accepts a variant-specific image directly (unlike the old REST
  // flow, which needed a separate "match URL to uploaded media id" step).
  if (row["Variant image URL"]) {
    variant.file = { originalSource: row["Variant image URL"], contentType: "IMAGE" };
  }

  return variant;
};

const STATUS_MAP: Record<string, string> = {
  active: "ACTIVE",
  draft: "DRAFT",
  archived: "ARCHIVED",
};

const buildProductSetInput = (
  groupRows: ShopifyCsvRow[],
  locationGid: string | undefined,
): Record<string, any> => {
  const mainRow = groupRows[0];
  const variantRows = groupRows.filter(isVariantRow);
  const effectiveVariantRows = variantRows.length ? variantRows : [mainRow];
  const imageRows = groupRows.filter(isImageRow);

  const productOptions = buildProductOptions(mainRow, effectiveVariantRows);
  const variants = effectiveVariantRows.map((row) =>
    buildProductSetVariant(row, mainRow, locationGid),
  );

  const files = imageRows
    .map((row) => ({ row, position: toNumber(row["Image position"]) ?? 0 }))
    .sort((a, b) => a.position - b.position)
    .map(({ row }) => ({
      originalSource: row["Product image URL"],
      alt: row["Image alt text"] || undefined,
      contentType: "IMAGE",
    }));

  const statusRaw = (mainRow["Status"] || "draft").toLowerCase();
  const status = STATUS_MAP[statusRaw] || "DRAFT";

  const seoTitle = mainRow["SEO title"];
  const seoDescription = mainRow["SEO description"];

  return {
    title: mainRow["Title"],
    handle: mainRow["URL handle"] || undefined,
    descriptionHtml: mainRow["Description"] || "",
    vendor: mainRow["Vendor"] || undefined,
    productType: mainRow["Type"] || mainRow["Product category"] || undefined,
    tags: mainRow["Tags"]
      ? mainRow["Tags"].split(",").map((t) => t.trim()).filter(Boolean)
      : [],
    status,
    seo:
      seoTitle || seoDescription
        ? { title: seoTitle || undefined, description: seoDescription || undefined }
        : undefined,
    giftCard: mainRow["Gift card"] ? toBoolean(mainRow["Gift card"]) : undefined,
    productOptions: productOptions.length ? productOptions : undefined,
    variants,
    files: files.length ? files : undefined,
  };
};

// Matches any "... (product.metafields.<namespace>.<key>)" column header and
// turns it into a Shopify metafield candidate.
const METAFIELD_COLUMN_REGEX = /\(product\.metafields\.([a-zA-Z0-9_-]+)\.([a-zA-Z0-9_-]+)\)$/;

interface IMetafieldCandidate {
  namespace: string;
  key: string;
  rawValue: string;
}

// Columns under the "shopify" namespace (Color, Fabric, ...) and Google
// Shopping Gender all resolve to Shopify's standard, taxonomy-driven
// metaobject_reference metafields — these are pushed as normal candidates
// here and resolved to a real metaobject GID in resolveShopifyMetaobjectMetafields
// (needs read_metaobjects/read_metaobject_definitions scopes, granted 2026-07-22).
//
// Google Shopping / Condition is different: it maps to a real, simple field
// — mm-google-shopping.condition (confirmed live: type single_line_text_field,
// not metaobject-based, installed by the Google & YouTube channel app) — so
// it's added as a normal candidate below and goes through the same
// definition-type lookup as the "custom" namespace fields.
const extractMetafieldCandidates = (
  mainRow: ShopifyCsvRow,
): { candidates: IMetafieldCandidate[]; skipped: ISkippedMetafield[] } => {
  const candidates: IMetafieldCandidate[] = [];
  const skipped: ISkippedMetafield[] = [];

  Object.entries(mainRow).forEach(([column, value]) => {
    if (!value) return;

    const match = column.match(METAFIELD_COLUMN_REGEX);
    if (!match) return;

    const [, namespace, key] = match;

    candidates.push({ namespace, key, rawValue: value });
  });

  if (mainRow["Google Shopping / Gender"]) {
    candidates.push({
      namespace: "shopify",
      key: "target-gender",
      rawValue: mainRow["Google Shopping / Gender"],
    });
  }

  if (mainRow["Google Shopping / Condition"]) {
    candidates.push({
      namespace: "mm-google-shopping",
      key: "condition",
      rawValue: mainRow["Google Shopping / Condition"].trim().toLowerCase(),
    });
  }

  return { candidates, skipped };
};

// The store may already have metafield *definitions* for these namespace/key
// pairs (created earlier by hand or by a prior CSV import), and Shopify
// rejects a metafield whose "type" doesn't match its definition's type
// (e.g. it requires "list.single_line_text_field" but we sent a plain
// string). Fetching the real definitions up front — instead of guessing the
// type from whether the CSV value contains a ";" — avoids that mismatch.
// Metafield definitions are only exposed via GraphQL, not the REST Admin API
// (confirmed: /metafield_definitions.json 404s).
const METAFIELD_DEFINITIONS_QUERY = `
  query MetafieldDefinitions($namespace: String) {
    metafieldDefinitions(ownerType: PRODUCT, namespace: $namespace, first: 100) {
      nodes {
        key
        type {
          name
        }
      }
    }
  }
`;

const fetchMetafieldDefinitionTypes = async (
  client: AxiosInstance,
  namespaces: string[],
): Promise<Map<string, string>> => {
  const typeByNamespaceKey = new Map<string, string>();

  await Promise.all(
    namespaces.map(async (namespace) => {
      try {
        const { data } = await client.post("/graphql.json", {
          query: METAFIELD_DEFINITIONS_QUERY,
          variables: { namespace },
        });

        const nodes = data?.data?.metafieldDefinitions?.nodes || [];
        nodes.forEach((node: any) => {
          typeByNamespaceKey.set(`${namespace}.${node.key}`, node.type.name);
        });
      } catch (error: any) {
        console.error(
          `Failed to fetch metafield definitions for namespace "${namespace}":`,
          error?.response?.data || error.message,
        );
      }
    }),
  );

  return typeByNamespaceKey;
};

const finalizeMetafield = (
  candidate: IMetafieldCandidate,
  definitionTypes: Map<string, string>,
): IShopifyMetafield => {
  const definedType = definitionTypes.get(`${candidate.namespace}.${candidate.key}`);
  const isList = definedType ? definedType.startsWith("list.") : candidate.rawValue.includes(";");
  const type = definedType || (isList ? "list.single_line_text_field" : "single_line_text_field");

  const value = isList
    ? JSON.stringify(
        candidate.rawValue
          .split(";")
          .map((v) => v.trim())
          .filter(Boolean),
      )
    : candidate.rawValue;

  return { namespace: candidate.namespace, key: candidate.key, value, type };
};

// "shopify" namespace metafields (Color, Fabric, Gender, ...) are
// list.metaobject_reference — each CSV value (e.g. "black") has to be
// resolved to the GID of an existing metaobject entry, not sent as a plain
// string. Resolution is 3 steps, each confirmed live on 2026-07-22:
//   1. metafieldDefinitions(namespace: "shopify").validations gives the
//      linked metaobject_definition_id for each key.
//   2. metaobjectDefinition(id).type gives the metaobject type string
//      (e.g. "shopify--color-pattern").
//   3. metaobjects(type).field(key:"label") lists the existing entries to
//      match against, case-insensitively.
// This store's entries are a mix of localized (Polish) and English labels —
// a CSV value with no matching label (in whatever language) is reported in
// `skipped` rather than guessed, and doesn't block the other values in the
// same field (e.g. 2 of 3 colors matching still produces a metafield with
// those 2, not a dropped field).
const SHOPIFY_METAFIELD_VALIDATIONS_QUERY = `
  query ShopifyMetafieldValidations {
    metafieldDefinitions(ownerType: PRODUCT, namespace: "shopify", first: 100) {
      nodes {
        key
        validations {
          name
          value
        }
      }
    }
  }
`;

const METAOBJECT_DEFINITION_TYPE_QUERY = `
  query MetaobjectDefinitionType($id: ID!) {
    metaobjectDefinition(id: $id) {
      type
    }
  }
`;

const METAOBJECTS_QUERY = `
  query Metaobjects($type: String!) {
    metaobjects(type: $type, first: 250) {
      nodes {
        id
        field(key: "label") {
          value
        }
      }
    }
  }
`;

const resolveShopifyMetaobjectMetafields = async (
  client: AxiosInstance,
  candidates: IMetafieldCandidate[],
): Promise<{ resolved: IShopifyMetafield[]; skipped: ISkippedMetafield[] }> => {
  const resolved: IShopifyMetafield[] = [];
  const skipped: ISkippedMetafield[] = [];

  const metaobjectDefinitionIdByKey = new Map<string, string>();
  try {
    const { data } = await client.post("/graphql.json", {
      query: SHOPIFY_METAFIELD_VALIDATIONS_QUERY,
    });
    (data?.data?.metafieldDefinitions?.nodes || []).forEach((node: any) => {
      const validation = (node.validations || []).find(
        (v: any) => v.name === "metaobject_definition_id",
      );
      if (validation) metaobjectDefinitionIdByKey.set(node.key, validation.value);
    });
  } catch (error: any) {
    console.error(
      "Failed to fetch shopify metafield validations:",
      error?.response?.data || error.message,
    );
  }

  const uniqueKeys = Array.from(new Set(candidates.map((c) => c.key)));
  const typeByDefinitionId = new Map<string, string>();

  await Promise.all(
    uniqueKeys.map(async (key) => {
      const definitionId = metaobjectDefinitionIdByKey.get(key);
      if (!definitionId || typeByDefinitionId.has(definitionId)) return;

      try {
        const { data } = await client.post("/graphql.json", {
          query: METAOBJECT_DEFINITION_TYPE_QUERY,
          variables: { id: definitionId },
        });
        const type = data?.data?.metaobjectDefinition?.type;
        if (type) typeByDefinitionId.set(definitionId, type);
      } catch (error: any) {
        console.error(
          `Failed to resolve metaobject type for key "${key}":`,
          error?.response?.data || error.message,
        );
      }
    }),
  );

  const uniqueTypes = Array.from(new Set(Array.from(typeByDefinitionId.values())));
  const labelMapByType = new Map<string, Map<string, string>>();

  await Promise.all(
    uniqueTypes.map(async (type) => {
      try {
        const { data } = await client.post("/graphql.json", {
          query: METAOBJECTS_QUERY,
          variables: { type },
        });
        const map = new Map<string, string>();
        (data?.data?.metaobjects?.nodes || []).forEach((node: any) => {
          const label = node.field?.value;
          if (label) map.set(label.toLowerCase(), node.id);
        });
        labelMapByType.set(type, map);
      } catch (error: any) {
        console.error(
          `Failed to fetch metaobjects for type "${type}":`,
          error?.response?.data || error.message,
        );
      }
    }),
  );

  candidates.forEach((candidate) => {
    const definitionId = metaobjectDefinitionIdByKey.get(candidate.key);
    const type = definitionId ? typeByDefinitionId.get(definitionId) : undefined;
    const labelMap = type ? labelMapByType.get(type) : undefined;

    if (!labelMap) {
      skipped.push({
        namespace: candidate.namespace,
        key: candidate.key,
        reason:
          "Could not resolve this field's linked metaobject type (definition lookup failed).",
      });
      return;
    }

    const values = candidate.rawValue
      .split(";")
      .map((v) => v.trim())
      .filter(Boolean);
    const matchedGids: string[] = [];
    const unmatched: string[] = [];

    values.forEach((value) => {
      const gid = labelMap.get(value.toLowerCase());
      if (gid) matchedGids.push(gid);
      else unmatched.push(value);
    });

    if (matchedGids.length) {
      resolved.push({
        namespace: candidate.namespace,
        key: candidate.key,
        type: "list.metaobject_reference",
        value: JSON.stringify(matchedGids),
      });
    }

    if (unmatched.length) {
      skipped.push({
        namespace: candidate.namespace,
        key: candidate.key,
        reason: `No existing metaobject found for value(s): ${unmatched.join(", ")} (labels are often localized, e.g. Polish — may need creating in Shopify Admin first).`,
      });
    }
  });

  return { resolved, skipped };
};

const buildMetafields = async (
  client: AxiosInstance,
  mainRow: ShopifyCsvRow,
): Promise<{ metafields: IShopifyMetafield[]; skipped: ISkippedMetafield[] }> => {
  const { candidates, skipped } = extractMetafieldCandidates(mainRow);
  if (!candidates.length) return { metafields: [], skipped };

  const shopifyCandidates = candidates.filter((c) => c.namespace === "shopify");
  const otherCandidates = candidates.filter((c) => c.namespace !== "shopify");

  const metafields: IShopifyMetafield[] = [];

  if (otherCandidates.length) {
    const namespaces = Array.from(new Set(otherCandidates.map((c) => c.namespace)));
    const definitionTypes = await fetchMetafieldDefinitionTypes(client, namespaces);
    metafields.push(...otherCandidates.map((c) => finalizeMetafield(c, definitionTypes)));
  }

  if (shopifyCandidates.length) {
    const { resolved, skipped: metaobjectSkipped } = await resolveShopifyMetaobjectMetafields(
      client,
      shopifyCandidates,
    );
    metafields.push(...resolved);
    skipped.push(...metaobjectSkipped);
  }

  return { metafields, skipped };
};

const PRODUCT_SET_MUTATION = `
  mutation ProductSet($input: ProductSetInput!, $synchronous: Boolean!) {
    productSet(input: $input, synchronous: $synchronous) {
      product {
        id
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const MAX_METAFIELD_RETRY_ATTEMPTS = 3;

// productSet is atomic: if ANY part of the input is rejected — including a
// single metafield whose definition has constraints this product doesn't
// satisfy (e.g. a category-restricted field like shoe_insert_length) — the
// whole call fails and no product is created (confirmed live: `product`
// comes back null). Shopify reports every failing metafield's array index in
// one pass, so on a metafield-only failure this strips those entries out and
// retries, rather than losing the entire product over one bad field.
const createProductViaGraphQL = async (
  client: AxiosInstance,
  input: Record<string, any>,
): Promise<{ product: any; droppedMetafields: { metafield: IShopifyMetafield; reason: string }[] }> => {
  let metafields: IShopifyMetafield[] = input.metafields || [];
  const droppedMetafields: { metafield: IShopifyMetafield; reason: string }[] = [];

  for (let attempt = 0; attempt < MAX_METAFIELD_RETRY_ATTEMPTS; attempt++) {
    const { data } = await client.post("/graphql.json", {
      query: PRODUCT_SET_MUTATION,
      variables: {
        input: { ...input, metafields: metafields.length ? metafields : undefined },
        synchronous: true,
      },
    });

    if (data.errors?.length) {
      throw new Error(data.errors.map((e: any) => e.message).join("; "));
    }

    const { product, userErrors } = data.data.productSet;

    if (!userErrors?.length) {
      return { product, droppedMetafields };
    }

    const metafieldErrorIndexes: (number | null)[] = userErrors.map((e: any) =>
      e.field?.[0] === "input" && e.field?.[1] === "metafields" && !Number.isNaN(Number(e.field[2]))
        ? Number(e.field[2])
        : null,
    );

    const allAreMetafieldErrors = metafieldErrorIndexes.every((idx) => idx !== null);

    if (!allAreMetafieldErrors || !metafields.length) {
      throw new Error(
        userErrors.map((e: any) => `${(e.field || []).join(".")}: ${e.message}`).join("; "),
      );
    }

    userErrors.forEach((e: any, i: number) => {
      droppedMetafields.push({ metafield: metafields[metafieldErrorIndexes[i]!], reason: e.message });
    });

    const droppedIndexes = new Set(metafieldErrorIndexes as number[]);
    metafields = metafields.filter((_, idx) => !droppedIndexes.has(idx));
  }

  throw new Error("Exceeded metafield retry attempts while creating the product");
};

const PUBLICATIONS_QUERY = `
  query { publications(first: 10) { nodes { id name } } }
`;

const PUBLISH_MUTATION = `
  mutation PublishablePublish($id: ID!, $input: [PublicationInput!]!) {
    publishablePublish(id: $id, input: $input) {
      userErrors {
        field
        message
      }
    }
  }
`;

// Needs read_publications (to find the Online Store channel's id) and
// write_publications (to actually publish) — neither currently granted to
// this app (confirmed live: publications query 403s), so this reliably
// reports "not published yet" today but will start working automatically
// once those scopes are added, with no code change needed.
const publishToOnlineStore = async (
  client: AxiosInstance,
  productGid: string,
): Promise<{ success: boolean; message?: string }> => {
  try {
    const pubRes = await client.post("/graphql.json", { query: PUBLICATIONS_QUERY });

    if (pubRes.data.errors?.length) {
      return { success: false, message: pubRes.data.errors[0].message };
    }

    const onlineStore = (pubRes.data.data?.publications?.nodes || []).find(
      (p: any) => p.name === "Online Store",
    );

    if (!onlineStore) {
      return { success: false, message: "Online Store publication not found" };
    }

    const publishRes = await client.post("/graphql.json", {
      query: PUBLISH_MUTATION,
      variables: { id: productGid, input: [{ publicationId: onlineStore.id }] },
    });

    const userErrors = publishRes.data.data?.publishablePublish?.userErrors;
    if (userErrors?.length) {
      return { success: false, message: userErrors.map((e: any) => e.message).join("; ") };
    }

    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      message: error?.response?.data?.errors?.[0]?.message || error.message,
    };
  }
};

const TAXONOMY_CATEGORY_QUERY = `
  query TaxonomyCategory($search: String!) {
    taxonomy {
      categories(search: $search, first: 1) {
        nodes {
          id
        }
      }
    }
  }
`;

// Several "custom" namespace metafield definitions (sk_ad, hip_width,
// collar_circumference, shoe_insert_length, ...) are restricted to specific
// standardized product categories (confirmed live via
// metafieldDefinitions.constraints.values) — with no `category` ever set on
// the product, they always fail with "Owner subtype does not match", no
// matter the actual product type. `taxonomy.categories(search:)` resolves
// free text (e.g. the CSV's "Apparel & Accessories") to the matching
// category GID and needs no extra scope (confirmed live), so this is set
// whenever a match is found rather than leaving `category` unset.
const resolveTaxonomyCategoryId = async (
  client: AxiosInstance,
  categoryText: string,
): Promise<string | undefined> => {
  try {
    const { data } = await client.post("/graphql.json", {
      query: TAXONOMY_CATEGORY_QUERY,
      variables: { search: categoryText },
    });
    return data?.data?.taxonomy?.categories?.nodes?.[0]?.id;
  } catch (error: any) {
    console.error(
      `Failed to resolve taxonomy category for "${categoryText}":`,
      error?.response?.data || error.message,
    );
    return undefined;
  }
};

const createProductsFromCsv = async (
  file?: Express.Multer.File,
): Promise<IProductResult[]> => {
  if (!file) {
    throw new ApiError(httpStatus.BAD_REQUEST, "CSV file is required");
  }

  const csvContent = file.buffer.toString("utf-8");
  const rows = parseCsv(csvContent);

  if (!rows.length) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Uploaded CSV has no product rows");
  }

  const productGroups = groupRowsByHandle(rows);

  if (!productGroups.length) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Could not find a 'URL handle' column to group product rows by",
    );
  }

  const client = getShopifyClient();
  const locationGid = await getPrimaryLocationGid(client);
  const results: IProductResult[] = [];
  // Most rows in a batch share the same category text (e.g. every row here
  // says "Apparel & Accessories") — cache the resolution per file instead of
  // re-querying taxonomy for every product.
  const categoryIdCache = new Map<string, string | undefined>();

  for (const groupRows of productGroups) {
    const mainRow = groupRows[0];

    try {
      const input = buildProductSetInput(groupRows, locationGid);
      const { metafields, skipped } = await buildMetafields(client, mainRow);
      input.metafields = metafields;

      const categoryText = mainRow["Product category"] || mainRow["Type"];
      if (categoryText) {
        if (!categoryIdCache.has(categoryText)) {
          categoryIdCache.set(categoryText, await resolveTaxonomyCategoryId(client, categoryText));
        }
        input.category = categoryIdCache.get(categoryText);
      }

      const { product, droppedMetafields } = await createProductViaGraphQL(client, input);
      const numericId = product.id.match(/(\d+)$/)?.[0];

      const survivingMetafields = metafields.filter(
        (m) => !droppedMetafields.some((d) => d.metafield === m),
      );

      let publish: { success: boolean; message?: string } | undefined;
      if (mainRow["Published on online store"] && toBoolean(mainRow["Published on online store"])) {
        publish = await publishToOnlineStore(client, product.id);
      }

      results.push({
        handle: mainRow["URL handle"],
        title: mainRow["Title"],
        success: true,
        shopifyProductId: numericId ? Number(numericId) : undefined,
        adminUrl: numericId ? `${config.shopify.storeUrl}/admin/products/${numericId}` : undefined,
        metafieldResults: survivingMetafields.map((m) => ({ ...m, success: true as const })),
        droppedMetafields: droppedMetafields.length ? droppedMetafields : undefined,
        skippedMetafields: skipped.length ? skipped : undefined,
        publish,
      });
    } catch (error: any) {
      results.push({
        handle: mainRow["URL handle"],
        title: mainRow["Title"],
        success: false,
        error: error?.response?.data || error.message,
      });
    }
  }

  return results;
};

// Processed one file at a time (not Promise.all) so this doesn't multiply
// Shopify's per-shop rate limit beyond what a single file's product loop in
// createProductsFromCsv already causes.
const uploadMultipleProductsCsv = async (
  files: Express.Multer.File[],
): Promise<IProductResult[]> => {
  const results: IProductResult[] = [];

  for (const file of files) {
    const fileResults = await createProductsFromCsv(file);
    results.push(...fileResults);
  }

  return results;
};

export const ShopifyService = {
  createProductsFromCsv,
  uploadMultipleProductsCsv,
};
