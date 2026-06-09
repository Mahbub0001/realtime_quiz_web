import React, { useState } from 'react';
import client from '../api/client';

export default function ImageUpload({ value, onChange, label = "Question Image" }) {
  const [preview, setPreview] = useState(value || null);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    setError('');
    setUploading(true);

    try {
      // Build a FormData object and send to the backend upload endpoint
      const formData = new FormData();
      formData.append('file', file);

      const response = await client.post('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const publicUrl = response.data.url;
      setPreview(publicUrl);
      onChange(publicUrl);
    } catch (err) {
      const detail = err.response?.data?.detail || 'Upload failed. Please try again.';
      setError(detail);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onChange(null);
    setError('');
  };

  return (
    <div className="w-full">
      <label className="font-semibold text-slate-700 text-sm mb-2 block">{label} (Optional)</label>

      {!preview ? (
        <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${uploading ? 'border-indigo-300 bg-indigo-50' : 'border-slate-300 hover:border-indigo-400'}`}>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            id={`image-upload-${label}`}
            disabled={uploading}
          />
          <label
            htmlFor={`image-upload-${label}`}
            className={`flex flex-col items-center gap-2 ${uploading ? 'cursor-wait' : 'cursor-pointer'}`}
          >
            {uploading ? (
              <>
                <div className="text-4xl animate-spin">⏳</div>
                <span className="text-indigo-600 font-semibold">Uploading...</span>
              </>
            ) : (
              <>
                <div className="text-4xl">📷</div>
                <span className="text-slate-600 font-medium">Click to upload an image</span>
                <span className="text-slate-400 text-sm">PNG, JPG, GIF, WebP up to 5MB</span>
              </>
            )}
          </label>
        </div>
      ) : (
        <div className="relative">
          <img
            src={preview}
            alt="Question preview"
            className="w-full max-h-64 object-contain rounded-xl border border-slate-200"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
          >
            ✕
          </button>
        </div>
      )}

      {error && (
        <div className="mt-2 text-red-600 text-sm font-semibold">{error}</div>
      )}
    </div>
  );
}
