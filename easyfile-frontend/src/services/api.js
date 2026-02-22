const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const getOrders = async () => {
  const response = await fetch(`${API_BASE_URL}/orders`);
  if (!response.ok) throw new Error('Failed to fetch orders');
  return response.json();
};

export const createDocument = async (formData) => {
  const response = await fetch(`${API_BASE_URL}/documents`, {
    method: 'POST',
    // Do NOT manually set 'Content-Type' headers when sending FormData.
    // The browser handles the multipart boundary automatically. 
    body: formData
  });
  if (!response.ok) throw new Error('Failed to upload document');
  return response.json();
};