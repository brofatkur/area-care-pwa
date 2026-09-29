// Insforge API Client Helper for Database and Storage
const BASE_URL = 'http://43.157.228.75:7130';
const ANON_KEY = 'anon_0a75c32f9a5fa623748cae8ca28764bf213bc112';

export async function runQuery<T = any>(sql: string): Promise<T[]> {
  try {
    const res = await fetch(`${BASE_URL}/api/database/sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ANON_KEY}`
      },
      body: JSON.stringify({ query: sql })
    });
    if (!res.ok) {
      console.warn('Insforge SQL query returned status:', res.status);
      return [];
    }
    const data = await res.json();
    return data.rows || [];
  } catch (err) {
    console.warn('Network error or offline mode, falling back to local store:', err);
    return [];
  }
}

export async function uploadPhotoToStorage(
  blob: Blob,
  fileName: string
): Promise<string> {
  const bucketName = 'area-care-photos';
  const objectKey = `${Date.now()}_${fileName}`;
  try {
    const res = await fetch(`${BASE_URL}/api/storage/buckets/${bucketName}/objects/${objectKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': blob.type || 'image/jpeg',
        'Authorization': `Bearer ${ANON_KEY}`
      },
      body: blob
    });
    if (res.ok) {
      return `${BASE_URL}/api/storage/buckets/${bucketName}/objects/${objectKey}`;
    }
  } catch (err) {
    console.warn('Storage upload error, using local data URL fallback:', err);
  }
  // Fallback to data URL
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
}
