import prisma from "../../lib/prisma";

const parseAndLogCsv = async (file: Express.Multer.File) => {
  // console.log(file);

  const csvContent = file.buffer.toString("utf-8");

  // Custom CSV parser to handle quotes, escaped quotes, newlines, commas, etc.
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
        i++; // Skip the next quote
      } else {
        insideQuote = !insideQuote;
      }
    } else if (char === "," && !insideQuote) {
      currentRow.push(currentEntry);
      currentEntry = "";
    } else if ((char === "\r" || char === "\n") && !insideQuote) {
      currentRow.push(currentEntry);
      currentEntry = "";
      if (
        currentRow.length > 0 &&
        (currentRow.length > 1 || currentRow[0] !== "")
      ) {
        rows.push(currentRow);
      }
      currentRow = [];
      if (char === "\r" && nextChar === "\n") {
        i++; // Skip the newline char
      }
    } else {
      currentEntry += char;
    }
  }

  if (currentEntry || currentRow.length > 0) {
    currentRow.push(currentEntry);
    if (
      currentRow.length > 0 &&
      (currentRow.length > 1 || currentRow[0] !== "")
    ) {
      rows.push(currentRow);
    }
  }

  if (rows.length === 0) {
    console.log("Uploaded CSV is empty.");
    return { headers: [], data: [] };
  }

  const headers = rows[0].map((h) => h.trim());
  const data = rows.slice(1).map((row) => {
    const obj: Record<string, string> = {};
    // headers.forEach((header, index) => {
    //   obj[header] = row[index] !== undefined ? row[index].trim() : "";
    // });
    headers.forEach((header, index) => {
      if (header == "name" || header == "email" || header == "") {
        obj[header] = row[index] !== undefined ? row[index].trim() : "";
      }
    });
    return obj;
  });

  console.log("------------------ CSV PARSED DATA START ------------------");
  console.log("Headers:", headers);
  console.log("Rows Count:", data.length);
  console.log("Data:", JSON.stringify(data, null, 2));
  console.log("------------------- CSV PARSED DATA END -------------------");

  return { headers, data };
};

// Product vendor
const parseProductVendorsCsv = async (file: Express.Multer.File) => {
  const csvContent = file.buffer.toString("utf-8");

  // Custom CSV parser to handle quotes, escaped quotes, newlines, commas, etc.
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
        i++; // Skip the next quote
      } else {
        insideQuote = !insideQuote;
      }
    } else if (char === "," && !insideQuote) {
      currentRow.push(currentEntry);
      currentEntry = "";
    } else if ((char === "\r" || char === "\n") && !insideQuote) {
      currentRow.push(currentEntry);
      currentEntry = "";
      if (
        currentRow.length > 0 &&
        (currentRow.length > 1 || currentRow[0] !== "")
      ) {
        rows.push(currentRow);
      }
      currentRow = [];
      if (char === "\r" && nextChar === "\n") {
        i++; // Skip the newline char
      }
    } else {
      currentEntry += char;
    }
  }

  if (currentEntry || currentRow.length > 0) {
    currentRow.push(currentEntry);
    if (
      currentRow.length > 0 &&
      (currentRow.length > 1 || currentRow[0] !== "")
    ) {
      rows.push(currentRow);
    }
  }

  if (rows.length === 0) {
    console.log("Uploaded CSV is empty.");
    return { headers: [], data: [] };
  }

  const headers = rows[0].map((h) => h.trim());
  const data = rows.slice(1).map((row) => {
    const obj: Record<string, string> = {};
    headers.forEach((header, index) => {
      obj[header] = row[index] !== undefined ? row[index].trim() : "";
    });
    return obj;
  });

  const productVendors = data
    .map((row) => row["Product vendor"])
    .filter(Boolean);

  console.log("------------------ CSV PARSED DATA START ------------------");
  console.log("Headers:", headers);
  console.log("Rows Count:", data.length);
  console.log("Product Vendors Array:", productVendors);
  console.log("Data:", JSON.stringify(data, null, 2));
  console.log("------------------- CSV PARSED DATA END -------------------");

  // return { headers, data, productVendors };

  const result = await crateProductVendor(productVendors);
  return result;
};

const crateProductVendor = async (productVendors: string[]) => {
  const existingData = await prisma.productVendor.findFirst();

  // Clean the input to avoid empty strings/whitespaces
  const incomingVendors = productVendors
    ? productVendors.map((v) => v.trim()).filter(Boolean)
    : [];

  if (existingData) {
    // Filter out brand names that already exist in the database (case-insensitive check)
    const existingBrandsSet = new Set(
      existingData.brands_name.map((b) => b.toLowerCase())
    );

    const newVendors = incomingVendors.filter(
      (vendor) => !existingBrandsSet.has(vendor.toLowerCase())
    );

    // If no new brands are to be added, skip database update and return existing record
    if (newVendors.length === 0) {
      return existingData;
    }

    const updatedBrandsName = [...existingData.brands_name, ...newVendors];
    const result = await prisma.productVendor.update({
      where: { id: existingData.id },
      data: { brands_name: updatedBrandsName },
    });
    return result;
  } else {
    // For new creation, ensure uniqueness among incoming vendors (case-insensitively)
    const uniqueIncomingVendors: string[] = [];
    const seen = new Set<string>();
    for (const vendor of incomingVendors) {
      const lower = vendor.toLowerCase();
      if (!seen.has(lower)) {
        seen.add(lower);
        uniqueIncomingVendors.push(vendor);
      }
    }

    const result = await prisma.productVendor.create({
      data: { brands_name: uniqueIncomingVendors },
    });
    return result;
  }
};

// Get product vendor

const getProductVendor = async () => {
  const existingData = await prisma.productVendor.findFirst();
  return existingData ? existingData.brands_name : [];
};

const deleteProductVendor = async () => {
  const result = await prisma.productVendor.deleteMany({});
  return result;
};

export const CsvService = {
  parseAndLogCsv,
  parseProductVendorsCsv,
  crateProductVendor,
  getProductVendor,
  deleteProductVendor,
};
