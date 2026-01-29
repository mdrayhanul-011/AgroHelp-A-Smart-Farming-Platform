export async function uploadToCloudinary(file) {
  const CLOUD_NAME = import.meta.env.VITE_CLOUD_NAME
  const UPLOAD_PRESET = import.meta.env.VITE_CLOUD_PRESET
  if (!CLOUD_NAME || !UPLOAD_PRESET) throw new Error('Cloudinary env missing')

  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/upload`
  const fd = new FormData()
  fd.append('file', file)
  fd.append('upload_preset', UPLOAD_PRESET)

  const res = await fetch(url, { method: 'POST', body: fd })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error?.message || 'Cloudinary upload failed')
  return json.secure_url || json.url
}
