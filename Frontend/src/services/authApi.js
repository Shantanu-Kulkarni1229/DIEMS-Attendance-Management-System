const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export const API_BASE_URL = rawBaseUrl.replace(/\/$/, '');

export const loginUser = async ({ email, password }) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || 'Unable to sign in.');
  }

  return data;
};