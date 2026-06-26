import { Parser } from "json2csv";

// ─── Convert a JSON array → CSV Buffer ──────────────────────────────────────
const convertToCSV = async (data: any) => {
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error("Data must be a non-empty array of objects.");
  }

  // Auto-detect fields from the first object's keys
  const fields = Object.keys(data[0]);

  const parser = new Parser({
    fields,
    delimiter: ",",
    header: true, // include header row
    quote: '"', // wrap values containing commas in quotes
  });

  const csvString = parser.parse(data);

  // Return as a Buffer so it can be streamed directly to Google Drive
  return Buffer.from(csvString, "utf-8");
};

export const CsvService = {
  convertToCSV,
};
