// Base API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

interface RequestOptions extends RequestInit {
  params?: Record<string, string>
}

class ApiService {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  private getToken(): string | null {
    return localStorage.getItem('token')
  }

  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { params, ...fetchOptions } = options
    
    let url = `${this.baseUrl}${endpoint}`
    if (params) {
      const searchParams = new URLSearchParams(params)
      url += `?${searchParams.toString()}`
    }

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    const token = this.getToken()
    if (token) {
      ;(headers as Record<string, string>)['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(url, {
      ...fetchOptions,
      headers,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }))
      throw new Error(error.message || `HTTP error! status: ${response.status}`)
    }

    // Handle empty responses (like 204 No Content)
    const text = await response.text()
    if (!text) {
      return undefined as T
    }
    return JSON.parse(text)
  }

  get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' })
  }

  post<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  patch<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' })
  }
}

export const api = new ApiService(API_BASE_URL)
export default api
