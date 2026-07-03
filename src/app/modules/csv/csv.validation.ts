import { z } from "zod";

const createCsvValidationSchema = z.object({
  // TODO: add your fields here
  // name: z.string({ required_error: "Name is required." }),
});

const updateCsvValidationSchema = z.object({
  // TODO: add your fields here
  // name: z.string().optional(),
});

export const CsvValidation = {
  createCsvValidationSchema,
  updateCsvValidationSchema,
};
