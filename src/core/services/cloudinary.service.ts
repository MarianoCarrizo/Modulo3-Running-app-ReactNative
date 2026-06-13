const CLOUD_NAME = 'dkel7o2jd';
const UPLOAD_PRESET = 'alamutt_profiles';

export async function uploadProfileImage(uri: string): Promise<string> {
  const formData = new FormData();
  formData.append('file', { uri, type: 'image/jpeg', name: 'profile.jpg' } as unknown as Blob);
  formData.append('upload_preset', UPLOAD_PRESET);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  );

  if (!response.ok) throw new Error('Cloudinary upload failed');

  const data = await response.json();
  return data.secure_url as string;
}
