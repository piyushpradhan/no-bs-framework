import {
  CustomDomainRules,
  DataShape,
  DataType,
  DomainSuggestion,
  FieldSchema,
} from "./types";

/**
 * Figure out the type of the provided value
 */
function detectDataType(value: any): DataType {
  // Null and undefined values
  if (value === null || value === undefined) {
    return DataType.PRIMITIVE;
  }

  // Javascript primitives
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return DataType.PRIMITIVE;
  }

  // Arrays
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return DataType.ARRAY_OF_PRIMITIVES;
    }

    let item = value[0];

    // Handle the arrays that have the first few
    // items as null or undefined values
    if (item === null || item === undefined) {
      const truthyItem = value.find((v) => v !== null && v !== undefined);
      if (truthyItem === undefined) {
        return DataType.ARRAY_OF_PRIMITIVES;
      } else {
        return DataType.ARRAY_OF_OBJECTS;
      }
    }

    if (typeof item === "object") {
      return DataType.ARRAY_OF_OBJECTS;
    } else {
      return DataType.ARRAY_OF_PRIMITIVES;
    }
  }

  // Objects
  if (typeof value === "object") {
    return DataType.NESTED_OBJECT;
  }

  return DataType.UNKNOWN;
}

/**
 * Define the field schema from the provided data
 */
export function inferFieldSchema(name: string, value: any): FieldSchema {
  const type = detectDataType(value);

  const fieldSchema: FieldSchema = {
    name,
    type,
    value,
  };

  // Define the itemSchema for arrays of objects
  if (
    type === DataType.ARRAY_OF_OBJECTS &&
    Array.isArray(value) &&
    value.length > 0
  ) {
    const firstItem = value[0];
    const itemFields: FieldSchema[] = [];

    for (const [key, value] of Object.entries(firstItem)) {
      itemFields.push(inferFieldSchema(key, value));
    }

    fieldSchema.itemSchema = itemFields;
  }

  return fieldSchema;
}

function inferDataShape(data: any): DataShape {
  if (!data && typeof data !== "object") {
    throw new Error("Input data must be a non-empty object");
  }

  const fields: FieldSchema[] = [];

  for (const [fieldName, fieldValue] of Object.entries(data)) {
    fields.push(inferFieldSchema(fieldName, fieldValue));
  }

  return {
    fields,
  };
}

/**
 * Generate domain names from the data
 */
export function suggestDomains(data: any): DomainSuggestion {
  const dataShape = inferDataShape(data);
  const suggestions: DomainSuggestion = {};

  // Identify array fields - collections
  const arrayFields: FieldSchema[] = [];
  const primitiveFields: FieldSchema[] = [];
  const nestedObjectFields: FieldSchema[] = [];

  // Categorize based on the type of field
  for (const field of dataShape.fields) {
    if (field.type === DataType.ARRAY_OF_OBJECTS) {
      arrayFields.push(field);
    } else if (field.type === DataType.NESTED_OBJECT) {
      nestedObjectFields.push(field);
    } else {
      primitiveFields.push(field);
    }
  }

  // Create domains for arrays
  for (const field of arrayFields) {
    const domainName = field.name;
    suggestions[domainName] = {
      fields: [field.name],
      type: "collection",
      isNormalized: true,
    };
  }

  // All primitives go into one common domain
  if (primitiveFields.length > 0) {
    const primitiveFieldNames = primitiveFields.map((field) => field.name);
    suggestions.root = {
      fields: primitiveFieldNames,
      type: "single",
      isNormalized: false,
    };
  }

  // Create domains for the objects
  for (const field of nestedObjectFields) {
    suggestions[field.name] = {
      fields: [field.name],
      type: "single",
      isNormalized: false,
    };
  }

  return suggestions;
}

/**
 * Restructure the data by generated domains
 */
export function restructureDataByDomains(
  data: any,
  domains: DomainSuggestion,
): Record<string, any> {
  const restructured: Record<string, any> = {};

  for (const [domainName, domainConfig] of Object.entries(domains)) {
    if (domainConfig.type === "collection") {
      restructured[domainName] = data[domainName];
    } else {
      restructured[domainName] = {};
      for (const field of domainConfig.fields) {
        restructured[domainName][field] = data[field];
      }
    }
  }

  return restructured;
}

/**
 * Merge custom domain rules with generated auto-suggestions
 */
export function mergeDomainRules(
  autoSuggestions: DomainSuggestion,
  customRules?: CustomDomainRules,
): DomainSuggestion {
  if (!customRules || Object.keys(customRules).length === 0) {
    return autoSuggestions;
  }

  const merged: DomainSuggestion = JSON.parse(JSON.stringify(autoSuggestions));
  const fieldsToRemove = new Set<string>();

  // Identify all the fields that will be moved to custom domains
  for (const [_domainName, ruleConfig] of Object.entries(customRules)) {
    if (ruleConfig.fields) {
      for (const field of ruleConfig.fields) {
        fieldsToRemove.add(field);
      }
    }
  }

  // Remove those fields from the auto-suggestions
  for (const domain of Object.values(merged)) {
    domain.fields = domain.fields.filter((f) => !fieldsToRemove.has(f));
  }

  // Merge the custom rules
  for (const [domainName, ruleConfig] of Object.entries(customRules)) {
    if (ruleConfig.fields) {
      merged[domainName] = {
        fields: ruleConfig.fields,
        type: ruleConfig.type || "single",
        isNormalized: false,
      };
    } else if (ruleConfig.type) {
      const existing = autoSuggestions[domainName];
      merged[domainName] = {
        fields: existing?.fields || [domainName],
        type: ruleConfig.type,
        isNormalized: existing?.isNormalized || false,
      };
    }
  }

  return merged;
}

/**
 * Validate if the custom rules actually references the fields
 * present in the provided data
 */
export function validateCustomRules(data: any, customRules: CustomDomainRules) {
  const errors: string[] = [];
  const availableFields = Object.keys(data);

  for (const [domainName, ruleConfig] of Object.entries(customRules)) {
    if (ruleConfig.fields) {
      for (const field of ruleConfig.fields) {
        if (!availableFields.includes(field)) {
          errors.push(
            `Domain '${domainName}' references field '${field}' which doesn't exist in the provided data`,
          );
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Clean up empty domains - removes the empty domains
 * Empty domains - the domains without any fields
 */
export function cleanupEmptyDomains(
  domains: DomainSuggestion,
): DomainSuggestion {
  const cleaned: DomainSuggestion = {};

  for (const [domainName, config] of Object.entries(domains)) {
    if (config.fields.length > 0) {
      cleaned[domainName] = config;
    }
  }

  return cleaned;
}
