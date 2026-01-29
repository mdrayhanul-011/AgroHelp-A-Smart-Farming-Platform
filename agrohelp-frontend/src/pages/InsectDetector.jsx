import { useRef, useState } from 'react';

export default function InsectDetector() {
  const inputRef = useRef(null);
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fileUrl, setFileUrl] = useState(''); // Store Cloudinary file URL
  const [preview, setPreview] = useState('');

  const triggerFile = () => { 
    setError(''); 
    setFileUrl('');
    inputRef.current?.click();
  };

  const onFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(file));

    setLoading(true);
    setError('');
    setFileUrl('');
    try {
      // Upload to Cloudinary
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', import.meta.env.VITE_CLOUD_PRESET);

      const cloudinaryRes = await fetch(
        `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUD_NAME}/image/upload`, 
        {
          method: 'POST',
          body: formData
        }
      );

      const cloudinaryData = await cloudinaryRes.json();
      if (!cloudinaryRes.ok) throw new Error(cloudinaryData.message || 'Upload failed.');

      setFileUrl(cloudinaryData.secure_url);  // Set the Cloudinary URL after upload

      // Now send the Cloudinary URL to the backend for insect detection
      const detectionRes = await fetch(`${import.meta.env.VITE_API_URL}/insects/detect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileUrl: cloudinaryData.secure_url }),
      });

      const detectionData = await detectionRes.json();
      if (detectionRes.ok) {
        setError(detectionData.message || 'Insect detection success');
      } else {
        setError(detectionData.message || 'Error detecting insect');
      }
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
      e.target.value = ''; // Reset file input
    }
  };

  return (
    <section className="py-14">
      <div className="mx-auto max-w-7xl px-6">
        <div className="rounded-3xl border border-emerald-100/70 dark:border-white/10 bg-white/80 dark:bg-white/5 shadow-glow p-6 md:p-8 backdrop-blur">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-emerald-900 dark:text-white">Insect Detector</h2>
              <p className="mt-2 text-emerald-800/90 dark:text-emerald-200 max-w-2xl">Upload a leaf/pest photo; we’ll identify it and suggest actions.</p>
            </div>
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-5">
            <div className="md:col-span-2">
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 dark:bg-white/5 dark:border-white/10 p-4">
                <div className="text-sm text-emerald-900 dark:text-emerald-200">Upload / Capture</div>
                <p className="text-xs text-emerald-700 dark:text-emerald-300">JPEG/PNG up to 4MB</p>

                <div className="mt-4 flex items-center gap-3">
                  <button 
                    onClick={triggerFile} 
                    className="inline-flex items-center gap-2 rounded-xl border border-black/10 dark:border-white/10 px-4 py-2 font-medium hover:bg-white/60 dark:hover:bg-white/10"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 7h2l2-3h10l2 3h2v13H3V7z" />
                      <circle cx="12" cy="13" r="3.25" strokeWidth="1.5" stroke="currentColor" fill="none"/>
                    </svg>
                    Choose Photo
                  </button>
                  <span className="text-sm text-emerald-900 dark:text-emerald-200">{fileName}</span>
                </div>

                <input 
                  ref={inputRef} 
                  type="file" 
                  accept="image/*" 
                  capture="environment" 
                  className="hidden" 
                  onChange={onFileChange} 
                />

                {preview && (
                  <div className="mt-4 rounded-xl overflow-hidden border border-black/10 dark:border-white/10 bg-white/50 dark:bg-white/5">
                    <img src={preview} alt="Selected" className="w-full h-40 object-cover" />
                  </div>
                )}

                {loading && (
                  <div className="mt-4">
                    <div className="flex items-center gap-3 text-emerald-800 dark:text-emerald-200">
                      <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v3a5 5 0 00-5 5H4z"></path>
                      </svg>
                      Processing image…
                    </div>
                    <div className="h-24 mt-3 rounded-xl shimmer"></div>
                  </div>
                )}

                {error && <div className="mt-3 text-sm text-red-600 font-medium">{error}</div>}
              </div>
            </div>

            <div className="md:col-span-3">
              <div className="rounded-2xl border border-black/10 dark:border-white/10 p-4 min-h-[160px] bg-white/70 dark:bg-white/5 backdrop-blur">
                {fileUrl && !loading && (
                  <div className="text-sm text-slate-600 dark:text-slate-300">Image uploaded successfully!</div>
                )}
                {fileUrl && <a href={fileUrl} target="_blank" rel="noopener noreferrer">View Image</a>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
