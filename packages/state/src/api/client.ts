/**
 * HTTP Client
 *
 * Thin wrapper around native fetch API with:
 * - Automatic JSON serialization/deserialization
 * - Base URL configuration
 * - Request/response interceptors
 * - Error normalization
 * - AbortController integration
 */

import { ApiClientConfig, ApiError, HttpMethod } from "./types"

class ApiClient {
  private config: ApiClientConfig

  constructor(config: ApiClientConfig = {}) {
    this.config = {
      baseURL: "",
      headers: {},
      timeout: 30000,
      ...config,
    }
  }

  /**
   * Configure or update the API client
   */
  configure(config: Partial<ApiClientConfig>): void {
    this.config = {
      ...this.config,
      ...config,
      headers: {
        ...this.config.headers,
        ...config.headers,
      },
    }
  }

  /**
   * GET request
   */
  async get<T>(url: string, options?: RequestInit): Promise<T> {
    return this.request<T>("GET", url, undefined, options)
  }

  /**
   * POST request
   */
  async post<T>(url: string, data?: any, options?: RequestInit): Promise<T> {
    return this.request<T>("POST", url, data, options)
  }

  /**
   * PATCH request
   */
  async patch<T>(url: string, data?: any, options?: RequestInit): Promise<T> {
    return this.request<T>("PATCH", url, data, options)
  }

  /**
   * PUT request
   */
  async put<T>(url: string, data?: any, options?: RequestInit): Promise<T> {
    return this.request<T>("PUT", url, data, options)
  }

  /**
   * DELETE request
   */
  async delete<T>(url: string, options?: RequestInit): Promise<T> {
    return this.request<T>("DELETE", url, undefined, options)
  }

  /**
   * Core request method
   */
  private async request<T>(
    method: HttpMethod,
    url: string,
    data?: any,
    options: RequestInit = {}
  ): Promise<T> {
    const fullUrl = this.buildUrl(url)
    const requestOptions = this.buildRequestOptions(method, data, options)

    // Request interceptor
    if (this.config.onRequest) {
      await this.config.onRequest(fullUrl, requestOptions)
    }

    try {
      // Make request with timeout
      const response = await this.fetchWithTimeout(fullUrl, requestOptions)

      // Handle non-OK responses
      if (!response.ok) {
        await this.handleErrorResponse(response, fullUrl)
      }

      // Parse response
      const responseData = await this.parseResponse<T>(response)

      // Response interceptor
      if (this.config.onResponse) {
        return await this.config.onResponse(response, responseData)
      }

      return responseData
    } catch (error) {
      // Handle network errors and timeout
      if (error instanceof ApiError) {
        if (this.config.onError) {
          await this.config.onError(error)
        }
        throw error
      }

      // Convert unknown errors to ApiError
      const apiError = new ApiError(
        error instanceof Error ? error.message : "Network request failed",
        0,
        "Network Error",
        fullUrl
      )

      if (this.config.onError) {
        await this.config.onError(apiError)
      }

      throw apiError
    }
  }

  /**
   * Build full URL from base URL and path
   */
  private buildUrl(url: string): string {
    // If URL is absolute, use it directly
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url
    }

    // Combine baseURL with path
    const baseURL = this.config.baseURL || ""
    const path = url.startsWith("/") ? url : `/${url}`

    return `${baseURL}${path}`
  }

  /**
   * Build request options with headers and body
   */
  private buildRequestOptions(
    method: HttpMethod,
    data?: any,
    options: RequestInit = {}
  ): RequestInit {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...this.config.headers,
      ...(options.headers as Record<string, string>),
    }

    const requestOptions: RequestInit = {
      ...options,
      method,
      headers,
    }

    // Add body for non-GET requests
    if (data !== undefined && method !== "GET") {
      requestOptions.body = JSON.stringify(data)
    }

    return requestOptions
  }

  /**
   * Fetch with timeout support
   */
  private async fetchWithTimeout(
    url: string,
    options: RequestInit
  ): Promise<Response> {
    const timeout = this.config.timeout || 30000

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      return response
    } catch (error) {
      clearTimeout(timeoutId)

      if (error instanceof Error && error.name === "AbortError") {
        throw new ApiError("Request timeout", 408, "Request Timeout", url)
      }

      throw error
    }
  }

  /**
   * Parse response body
   */
  private async parseResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get("content-type")

    // Handle empty responses
    if (response.status === 204 || response.headers.get("content-length") === "0") {
      return undefined as T
    }

    // Parse JSON
    if (contentType?.includes("application/json")) {
      return response.json()
    }

    // Return text for non-JSON responses
    const text = await response.text()
    return text as T
  }

  /**
   * Handle error responses
   */
  private async handleErrorResponse(response: Response, url: string): Promise<never> {
    let errorData: any

    try {
      const contentType = response.headers.get("content-type")
      if (contentType?.includes("application/json")) {
        errorData = await response.json()
      } else {
        errorData = await response.text()
      }
    } catch {
      errorData = null
    }

    const message =
      errorData?.message ||
      errorData?.error ||
      (typeof errorData === "string" ? errorData : null) ||
      `HTTP ${response.status}: ${response.statusText}`

    throw new ApiError(message, response.status, response.statusText, url, errorData)
  }
}

// ============================================================================
// Global Instance
// ============================================================================

export const apiClient = new ApiClient()

/**
 * Configure the global API client
 */
export function configureApi(config: ApiClientConfig): void {
  apiClient.configure(config)
}

export { ApiClient }
