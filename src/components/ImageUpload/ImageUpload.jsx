import { useState, useRef } from 'react';
import { uploadToCloudinary } from '../../cloudinary/upload';

/**
 * Reusable image uploader — uploads to Cloudinary, returns secure_url.
 * @param {string} folder - Cloudinary folder path
 * @param {string} value  - Current image URL (from Firestore)
 * @param {function} onChange - Called with new secure_url after upload
 * @param {string} label - Optional label
 * @param {string} placeholder - Placeholder text
 */
export default function ImageUpload({ folder, value, onChange, label = 'Image', placeholder = 'Click or drag to upload' }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [preview, setPreview] = useState(value || '');
    const inputRef = useRef();

    const handleFile = async (file) => {
        if (!file) return;
        if (!file.type.startsWith('image/')) { setError('Please select an image file.'); return; }
        if (file.size > 10 * 1024 * 1024) { setError('Image must be under 10MB.'); return; }

        setError('');
        setLoading(true);
        const localPreview = URL.createObjectURL(file);
        setPreview(localPreview);

        try {
            const url = await uploadToCloudinary(file, folder);
            setPreview(url);
            onChange && onChange(url);
        } catch (e) {
            setError(e.message || 'Upload failed');
            setPreview(value || '');
        } finally {
            setLoading(false);
        }
    };

    const onDrop = (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        handleFile(file);
    };

    const onDragOver = (e) => e.preventDefault();

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {label && <label className="form-label">{label}</label>}
            <div
                className="content-card"
                style={{
                    border: '2px dashed var(--glass-border-strong)',
                    borderRadius: 'var(--radius-md)',
                    padding: preview ? 0 : '28px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'var(--transition)',
                    overflow: 'hidden',
                    position: 'relative',
                    minHeight: preview ? 'auto' : '120px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
                onDrop={onDrop}
                onDragOver={onDragOver}
                onClick={() => !loading && inputRef.current?.click()}
            >
                {loading && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2, borderRadius: 'var(--radius-md)' }}>
                        <div className="spinner" />
                    </div>
                )}
                {preview ? (
                    <div style={{ position: 'relative', width: '100%' }}>
                        <img src={preview} alt="upload preview" style={{ width: '100%', maxHeight: 200, objectFit: 'cover', display: 'block' }} />
                        <button
                            className="primary-button btn-sm"
                            style={{ position: 'absolute', top: 8, right: 8 }}
                            onClick={(e) => { e.stopPropagation(); setPreview(''); onChange && onChange(''); }}
                        >
                            ✕ Remove
                        </button>
                    </div>
                ) : (
                    <div>
                        <div style={{ fontSize: '2rem', marginBottom: 8 }}>📷</div>
                        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>{placeholder}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>PNG, JPG, WEBP up to 10MB</p>
                    </div>
                )}
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => handleFile(e.target.files?.[0])}
                />
            </div>
            {error && <p className="text-error" style={{ fontSize: '0.82rem' }}>{error}</p>}
        </div>
    );
}
