import { useState, useCallback, useRef } from "react";

// ── Types ────────────────────────────────────────────────────────────────────

export type FieldValue = string | number | boolean | null | undefined;

export type FieldValues = Record<string, FieldValue>;

export interface ValidationRule<T extends FieldValues, K extends keyof T = keyof T> {
  required?: boolean | string;
  minLength?: { value: number; message: string };
  maxLength?: { value: number; message: string };
  min?: { value: number; message: string };
  max?: { value: number; message: string };
  pattern?: { value: RegExp; message: string };
  validate?: (value: T[K], allValues: T) => string | true | undefined;
}

export type FormSchema<T extends FieldValues> = {
  [K in keyof T]?: ValidationRule<T, K>;
};

export interface FieldState {
  touched: boolean;
  error: string | undefined;
}

export interface FieldRegistration<
  T extends FieldValues,
  K extends keyof T = keyof T,
> {
  name: K;
  value: T[K];
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> | FieldValue) => void;
  onBlur: () => void;
}

export interface UseFormResult<T extends FieldValues> {
  /** Current form values */
  values: T;
  /** Whether any field has changed from its initial value */
  isDirty: boolean;
  /** Whether the form has no validation errors */
  isValid: boolean;
  /** Whether handleSubmit has been called at least once */
  isSubmitted: boolean;
  /** Register a field — spread the result onto an <input> */
  register: <K extends keyof T>(name: K) => FieldRegistration<T, K>;
  /** Imperatively set a field value */
  setValue: <K extends keyof T>(name: K, value: T[K]) => void;
  /** Run validation for one or all fields. Returns true if valid. */
  trigger: (name?: keyof T) => boolean;
  /** Reset the form to its initial values, clearing all errors */
  reset: (newValues?: Partial<T>) => void;
  /** Wrap your submit handler — validates first, calls fn only if valid */
  handleSubmit: (fn: (values: T) => void | Promise<void>) => (e?: React.FormEvent) => void;
  /** Get the error message for a field (only shown after touched or submit) */
  getError: (name: keyof T) => string | undefined;
}

// ── Validation ───────────────────────────────────────────────────────────────

function runValidation<T extends FieldValues>(
  _name: keyof T,
  value: FieldValue,
  allValues: T,
  rule: ValidationRule<T> | undefined,
): string | undefined {
  if (!rule) return undefined;

  if (rule.required) {
    const isEmpty =
      value === undefined ||
      value === null ||
      value === "" ||
      (typeof value === "string" && value.trim() === "");
    if (isEmpty) {
      return typeof rule.required === "string" ? rule.required : "This field is required";
    }
  }

  if (rule.minLength && typeof value === "string" && value.length < rule.minLength.value) {
    return rule.minLength.message;
  }

  if (rule.maxLength && typeof value === "string" && value.length > rule.maxLength.value) {
    return rule.maxLength.message;
  }

  if (rule.min && typeof value === "number" && value < rule.min.value) {
    return rule.min.message;
  }

  if (rule.max && typeof value === "number" && value > rule.max.value) {
    return rule.max.message;
  }

  if (rule.pattern && typeof value === "string" && !rule.pattern.value.test(value)) {
    return rule.pattern.message;
  }

  if (rule.validate) {
    const result = rule.validate(value as any, allValues);
    if (result && result !== true) return result;
  }

  return undefined;
}

// ── useForm ───────────────────────────────────────────────────────────────────

/**
 * Lightweight form state manager with optional schema validation.
 *
 * @example
 * const { register, handleSubmit, getError } = useForm(
 *   { title: "", priority: "medium" },
 *   {
 *     title: { required: "Title is required", minLength: { value: 3, message: "Too short" } },
 *   }
 * );
 *
 * <input {...register("title")} />
 * <span>{getError("title")}</span>
 * <button onClick={handleSubmit((values) => console.log(values))}>Submit</button>
 */
export function useForm<T extends FieldValues>(
  initialValues: T,
  schema?: FormSchema<T>,
): UseFormResult<T> {
  const initialRef = useRef(initialValues);

  const [values, setValues] = useState<T>(initialValues);
  const [fieldStates, setFieldStates] = useState<Record<keyof T, FieldState>>(
    () =>
      Object.fromEntries(
        Object.keys(initialValues).map((k) => [k, { touched: false, error: undefined }]),
      ) as Record<keyof T, FieldState>,
  );
  const [isSubmitted, setIsSubmitted] = useState(false);

  // ── Derived state ──────────────────────────────────────────────────────────

  const isDirty = Object.keys(values).some(
    (k) => values[k] !== initialRef.current[k as keyof T],
  );

  const isValid = schema
    ? Object.keys(schema).every((k) => {
        const key = k as keyof T;
        return !runValidation(key, values[key], values, schema[key]);
      })
    : true;

  // ── Helpers ────────────────────────────────────────────────────────────────

  const validateField = useCallback(
    (name: keyof T, currentValues: T): string | undefined => {
      if (!schema) return undefined;
      return runValidation(name, currentValues[name], currentValues, schema[name as keyof T]);
    },
    [schema],
  );

  // ── API ────────────────────────────────────────────────────────────────────

  const setValue = useCallback(<K extends keyof T>(name: K, value: T[K]) => {
    setValues((prev) => {
      const next = { ...prev, [name]: value };
      setFieldStates((fs) => ({
        ...fs,
        [name]: {
          touched: true,
          error: schema ? runValidation(name, value, next, schema[name as keyof T]) : undefined,
        },
      }));
      return next;
    });
  }, [schema]);

  const register = useCallback(
    <K extends keyof T>(name: K): FieldRegistration<T, K> => ({
      name,
      value: values[name],
      onChange: (e) => {
        const raw =
          e !== null && typeof e === "object" && "target" in e
            ? (e as React.ChangeEvent<HTMLInputElement>).target.value
            : (e as FieldValue);
        setValue(name, raw as T[K]);
      },
      onBlur: () => {
        setFieldStates((fs) => ({
          ...fs,
          [name]: {
            touched: true,
            error: validateField(name, values),
          },
        }));
      },
    }),
    [values, setValue, validateField],
  );

  const trigger = useCallback(
    (name?: keyof T): boolean => {
      if (name !== undefined) {
        const error = validateField(name, values);
        setFieldStates((fs) => ({
          ...fs,
          [name]: { touched: true, error },
        }));
        return !error;
      }

      // Validate all fields
      const newStates = { ...fieldStates };
      let allValid = true;
      for (const key of Object.keys(values) as Array<keyof T>) {
        const error = validateField(key, values);
        newStates[key] = { touched: true, error };
        if (error) allValid = false;
      }
      setFieldStates(newStates);
      return allValid;
    },
    [values, fieldStates, validateField],
  );

  const reset = useCallback((newValues?: Partial<T>) => {
    const next = newValues ? { ...initialRef.current, ...newValues } : initialRef.current;
    if (newValues) initialRef.current = next;
    setValues(next);
    setFieldStates(
      Object.fromEntries(
        Object.keys(next).map((k) => [k, { touched: false, error: undefined }]),
      ) as Record<keyof T, FieldState>,
    );
    setIsSubmitted(false);
  }, []);

  const handleSubmit = useCallback(
    (fn: (values: T) => void | Promise<void>) =>
      (e?: React.FormEvent) => {
        e?.preventDefault();
        setIsSubmitted(true);
        const valid = trigger();
        if (valid) {
          fn(values);
        }
      },
    [values, trigger],
  );

  const getError = useCallback(
    (name: keyof T): string | undefined => {
      const fs = fieldStates[name];
      if (!fs) return undefined;
      // Show error only after the user has touched the field or tried to submit
      return fs.touched || isSubmitted ? fs.error : undefined;
    },
    [fieldStates, isSubmitted],
  );

  return {
    values,
    isDirty,
    isValid,
    isSubmitted,
    register,
    setValue,
    trigger,
    reset,
    handleSubmit,
    getError,
  };
}
