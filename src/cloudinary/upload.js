/**
 * Upload a file to Cloudinary using unsigned upload preset.
 * @param {File} file - The file to upload
 * @param {string} folder - The folder path inside Cloudinary (e.g. forms/abc123/header)
 * @returns {Promise<string>} The secure_url of the uploaded asset
 */
export async function uploadToCloudinary(file, folder) {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    formData.append('folder', folder);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
        method: 'POST',
        body: formData,
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || 'Cloudinary upload failed');
    }

    const data = await res.json();
    return data.secure_url;
}
