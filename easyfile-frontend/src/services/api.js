const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const getOrders = async () => {
  const response = await fetch(`${API_BASE_URL}/orders`);
  if (!response.ok) throw new Error('Failed to fetch orders');
  return response.json();
};

export const loginUser = async (credentials) => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials)
  });
  if (!response.ok) throw new Error('Invalid credentials');
  return response.json();
};

export const createDocument = async (formData, token) => {
  const response = await fetch(`${API_BASE_URL}/documents`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    // Do NOT manually set 'Content-Type' headers when sending FormData.
    // The browser handles the multipart boundary automatically. 
    body: formData
  });
  if (!response.ok) throw new Error('Failed to upload document');
  return response.json();
};