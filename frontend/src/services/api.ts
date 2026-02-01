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

    // Handle 401 Unauthorized - only redirect if not on login page
    if (response.status === 401) {
      // Don't redirect if we're on the login page (login failure)
      const isLoginPage = window.location.pathname === '/login'
      if (!isLoginPage) {
        this.handleUnauthorized()
        throw new Error('Session expired. Please login again.')
      }
      // For login failures, just throw the error message from API
      const error = await response.json().catch(() => ({ message: 'Invalid email or password' }))
      throw new Error(error.message || 'Invalid email or password')
    }

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

  private handleUnauthorized(): void {
    // Clear token and user data
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    
    // Redirect to login page
    window.location.href = '/login'
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

  private async requestFormData<T>(
    endpoint: string,
    method: string,
    formData: FormData,
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`

    const headers: Record<string, string> = {}
    const token = this.getToken()
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(url, {
      method,
      headers,
      body: formData,
    })

    // Handle 401 Unauthorized - session expired
    if (response.status === 401) {
      this.handleUnauthorized()
      throw new Error('Session expired. Please login again.')
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }))
      throw new Error(error.message || `HTTP error! status: ${response.status}`)
    }

    const text = await response.text()
    if (!text) {
      return undefined as T
    }
    return JSON.parse(text)
  }

  postFormData<T>(endpoint: string, formData: FormData): Promise<T> {
    return this.requestFormData<T>(endpoint, 'POST', formData)
  }

  patchFormData<T>(endpoint: string, formData: FormData): Promise<T> {
    return this.requestFormData<T>(endpoint, 'PATCH', formData)
  }
}

export const api = new ApiService(API_BASE_URL)
export default api
