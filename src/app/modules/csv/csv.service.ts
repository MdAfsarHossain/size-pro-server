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

  return { headers, productVendors };
};

export const CsvService = {
  parseAndLogCsv,
  parseProductVendorsCsv,
};
