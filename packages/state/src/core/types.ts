/**
 * Available data types
 */
export enum DataType {
  PRIMITIVE = "primitive",
  ARRAY_OF_OBJECTS = "array_of_objects",
  ARRAY_OF_PRIMITIVES = "array_of_primitives",
  NESTED_OBJECT = "nested_object",
  UNKNOWN = "unknown",
}

/**
 * Represents the inferred structure of a single field
 */
export interface FieldSchema {
  name: string;
  type: DataType;
  value: any;
  itemSchema?: FieldSchema[]; // For arrays of objects
}

/**
 * Represents the complete inferred schema
 */
export interface DataShape {
  fields: FieldSchema[];
}

/**
 * Represents the structure for the domain splitting
 */
export interface DomainSuggestion {
  [domainName: string]: {
    fields: string[];
    type: "single" | "collection";
    isNormalized: boolean;
  };
}

/**
 * Normalized store structure
 */
export interface NormalizedStore {
  [domainName: string]: any;
}

/**
 * Custom domain schema provided by the user
 */
export interface DomainRuleConfig {
  fields?: string[];
  type?: "single" | "collection";
}

/**
 * Custom domain rules
 * For the developer to override the auto-inference
 */
export interface CustomDomainRules {
  [domainName: string]: DomainRuleConfig;
}

/*
 * Normalized collection format
 */
export interface NormalizedCollection {
  [id: string]: any;
}
