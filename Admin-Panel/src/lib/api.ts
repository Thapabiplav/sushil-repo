const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api';

function getAuthToken(): string | null {
  // First try 'token' key, then fall back to 'authToken'
  const token = localStorage.getItem('token') || localStorage.getItem('authToken');
  if (!token) {
    // Try to get token from currentUser
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
      try {
        const user = JSON.parse(currentUser);
        return user.token || null;
      } catch {
        return null;
      }
    }
  }
  return token;
}

async function handleResponse<T>(response: Response): Promise<T> {
  // Handle 401 Unauthorized - redirect to login
  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    window.location.href = '/login';
    throw new Error('Session expired. Please log in again.');
  }

  // Handle 403 Forbidden
  if (response.status === 403) {
    throw new Error('You do not have permission to access this resource.');
  }

  // Handle 404 Not Found
  if (response.status === 404) {
    throw new Error('The requested resource was not found.');
  }

  // Handle 500 Internal Server Error
  if (response.status === 500) {
    throw new Error('Server error. Please try again later.');
  }

  if (!response.ok) {
    let message = 'Something went wrong';
    try {
      const data = await response.json();
      message = data?.message ?? message;
    } catch {
      // ignore
    }
    throw new Error(message);
  }
  return response.json() as Promise<T>;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
    ...options,
  });

  return handleResponse<T>(response);
}

export async function apiFetchFormData<T>(
  path: string,
  formData: FormData,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
    body: formData,
    ...options,
  });
  return handleResponse<T>(response);
}

export { API_BASE_URL };
