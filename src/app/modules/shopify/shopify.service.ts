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

interface IProductResult {
  handle: string;
  title: string;
  success: boolean;
  shopifyProductId?: number;
  adminUrl?: string;
  metafieldResults?: (IShopifyMetafield & { success: boolean; error?: any })[];
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

const getOptionNames = (mainRow: ShopifyCsvRow) =>
  [1, 2, 3]
    .map((n) => mainRow[`Option${n} name`])
    .filter(Boolean)
    .map((name) => ({ name }));

const buildVariant = (row: ShopifyCsvRow) => {
  const optionValues: Record<string, string> = {};
  [1, 2, 3].forEach((n) => {
    const value = row[`Option${n} value`];
    if (value) optionValues[`option${n}`] = value;
  });

  return {
    ...optionValues,
    sku: row["SKU"] || undefined,
    barcode: row["Barcode"] || undefined,
    price: row["Price"] || "0.00",
    compare_at_price: row["Compare-at price"] || undefined,
    taxable: row["Charge tax"] ? toBoolean(row["Charge tax"]) : true,
    weight: toNumber(row["Weight value (grams)"]),
    weight_unit: (row["Weight unit for display"] || "g").toLowerCase(),
    requires_shipping: row["Requires shipping"]
      ? toBoolean(row["Requires shipping"])
      : true,
    inventory_management: row["Inventory tracker"] || undefined,
    // "Continue selling when out of stock" TRUE -> Shopify inventory_policy "continue"
    inventory_policy: toBoolean(row["Continue selling when out of stock"])
      ? "continue"
      : "deny",
    inventory_quantity: toNumber(row["Inventory quantity"]) ?? 0,
    fulfillment_service: row["Fulfillment service"] || "manual",
  };
};

const buildProductPayload = (groupRows: ShopifyCsvRow[]) => {
  const mainRow = groupRows[0];
  const variantRows = groupRows.filter(isVariantRow);
  const imageRows = groupRows.filter(isImageRow);

  const options = getOptionNames(mainRow);
  const variants = (variantRows.length ? variantRows : [mainRow]).map(buildVariant);

  const images = imageRows
    .map((row) => ({
      src: row["Product image URL"],
      position: toNumber(row["Image position"]),
      alt: row["Image alt text"] || undefined,
    }))
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

  const statusRaw = (mainRow["Status"] || "draft").toLowerCase();
  const status = ["active", "draft", "archived"].includes(statusRaw)
    ? statusRaw
    : "draft";

  return {
    title: mainRow["Title"],
    handle: mainRow["URL handle"] || undefined,
    body_html: mainRow["Description"] || "",
    vendor: mainRow["Vendor"] || undefined,
    product_type: mainRow["Type"] || undefined,
    tags: mainRow["Tags"] || "",
    status,
    // Setting published_at is what actually makes it visible on the Online
    // Store channel; `status: active` alone only means "available for sale".
    published_at:
      mainRow["Published on online store"] &&
      toBoolean(mainRow["Published on online store"])
        ? new Date().toISOString()
        : null,
    options: options.length ? options : undefined,
    variants,
    images: images.length ? images : undefined,
  };
};

// Matches any "... (product.metafields.<namespace>.<key>)" column header and
// turns it into a Shopify metafield candidate. Columns under the "shopify"
// namespace (e.g. Color -> shopify.color-pattern) are Shopify's own standard
// metafields backed by metaobject references / taxonomy IDs that must already
// exist in the store — resolving those isn't in scope here, so they're
// skipped rather than sent with a guessed, likely-invalid value.
const METAFIELD_COLUMN_REGEX = /\(product\.metafields\.([a-zA-Z0-9_-]+)\.([a-zA-Z0-9_-]+)\)$/;

interface IMetafieldCandidate {
  namespace: string;
  key: string;
  rawValue: string;
}

const extractMetafieldCandidates = (mainRow: ShopifyCsvRow): IMetafieldCandidate[] => {
  const candidates: IMetafieldCandidate[] = [];

  Object.entries(mainRow).forEach(([column, value]) => {
    if (!value) return;

    const match = column.match(METAFIELD_COLUMN_REGEX);
    if (!match) return;

    const [, namespace, key] = match;
    if (namespace === "shopify") return;

    candidates.push({ namespace, key, rawValue: value });
  });

  if (mainRow["SEO title"]) {
    candidates.push({ namespace: "global", key: "title_tag", rawValue: mainRow["SEO title"] });
  }

  if (mainRow["SEO description"]) {
    candidates.push({
      namespace: "global",
      key: "description_tag",
      rawValue: mainRow["SEO description"],
    });
  }

  return candidates;
};

// The store may already have metafield *definitions* for these namespace/key
// pairs (created earlier by hand or by a prior CSV import), and Shopify
// rejects a metafield whose "type" doesn't match its definition's type
// (e.g. it requires "list.single_line_text_field" but we sent a plain
// string). Fetching the real definitions up front — instead of guessing the
// type from whether the CSV value contains a ";" — avoids that mismatch.
// Metafield definitions are only exposed via GraphQL, not the REST Admin API
// (confirmed: /metafield_definitions.json 404s), so this is the one call in
// the module that goes through /graphql.json instead of a REST resource.
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

const buildMetafields = async (
  client: AxiosInstance,
  mainRow: ShopifyCsvRow,
): Promise<IShopifyMetafield[]> => {
  const candidates = extractMetafieldCandidates(mainRow);
  if (!candidates.length) return [];

  const namespaces = Array.from(new Set(candidates.map((c) => c.namespace)));
  const definitionTypes = await fetchMetafieldDefinitionTypes(client, namespaces);

  return candidates.map((candidate) => finalizeMetafield(candidate, definitionTypes));
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

// Metafields are created one call at a time (after the product exists) so a
// single bad/unsupported field can't fail the whole product creation.
const createProductMetafields = async (
  client: AxiosInstance,
  productId: number,
  metafields: IShopifyMetafield[],
) => {
  return Promise.all(
    metafields.map(async (metafield) => {
      try {
        await client.post(`/products/${productId}/metafields.json`, {
          metafield,
        });
        return { ...metafield, success: true };
      } catch (error: any) {
        return {
          ...metafield,
          success: false,
          error: error?.response?.data || error.message,
        };
      }
    }),
  );
};

// Cost per item lives on the InventoryItem resource, not the variant payload,
// so it has to be set via a follow-up call once the variant (and its
// inventory item) has been created.
const setVariantCost = async (
  client: AxiosInstance,
  inventoryItemId: number,
  cost: string,
) => {
  try {
    await client.put(`/inventory_items/${inventoryItemId}.json`, {
      inventory_item: { cost },
    });
  } catch (error: any) {
    console.error(
      "Failed to set variant cost on Shopify:",
      error?.response?.data || error.message,
    );
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
  const results: IProductResult[] = [];

  for (const groupRows of productGroups) {
    const mainRow = groupRows[0];

    try {
      const payload = buildProductPayload(groupRows);

      const { data } = await client.post("/products.json", { product: payload });
      const createdProduct = data.product;

      const metafields = await buildMetafields(client, mainRow);
      const metafieldResults = metafields.length
        ? await createProductMetafields(client, createdProduct.id, metafields)
        : [];

      const cost = mainRow["Cost per item"];
      const inventoryItemId = createdProduct.variants?.[0]?.inventory_item_id;
      if (cost && inventoryItemId) {
        await setVariantCost(client, inventoryItemId, cost);
      }

      results.push({
        handle: mainRow["URL handle"],
        title: mainRow["Title"],
        success: true,
        shopifyProductId: createdProduct.id,
        adminUrl: `${config.shopify.storeUrl}/admin/products/${createdProduct.id}`,
        metafieldResults,
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
  uploadMultipleProductsCsv
};
