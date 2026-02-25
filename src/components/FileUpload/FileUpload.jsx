import { useState, useRef } from 'react';
import { uploadToCloudinary } from '../../cloudinary/upload';

/**
 * Student file upload for file-upload question type.
 * Uploads to Cloudinary and calls onChange with secure_url.
 *
 * @param {string} folder   - Cloudinary folder
 * @param {string} value    - Current uploaded URL (if any)
 * @param {function} onChange - Called with secure_url after upload
 * @param {string[]} accept - Accepted MIME types (e.g. ['image/*', 'application/pdf'])
 */
export default function FileUpload({ folder, value, onChange, accept = ['image/*', 'application/pdf', '.doc', '.docx'] }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [uploaded, setUploaded] = useState(value || null);
    const [fileName, setFileName] = useState('');
    const inputRef = useRef();

    const handleFile = async (file) => {
        if (!file) return;
        if (file.size > 20 * 1024 * 1024) { setError('File must be under 20MB.'); return; }

        setError('');
        setLoading(true);
        setFileName(file.name);

        try {
            const url = await uploadToCloudinary(file, folder);
            setUploaded(url);
            onChange && onChange(url);
        } catch (e) {
            setError(e.message || 'Upload failed');
        } finally {
            setLoading(false);
        }
    };

    const onDrop = (e) => {
        e.preventDefault();
        handleFile(e.dataTransfer.files?.[0]);
    };

    if (uploaded) {
        return (
            <div className="content-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: '1.4rem' }}>📎</span>
                    <div>
                        <p style={{ fontSize: '0.88rem', color: 'var(--text-primary)', fontWeight: 600 }}>{fileName || 'File uploaded'}</p>
                        <a href={uploaded} target="_blank" rel="noreferrer" style={{ fontSize: '0.78rem', color: 'var(--neon-green)' }}>View file ↗</a>
                    </div>
                </div>
                <button
                    className="primary-button btn-sm"
                    onClick={() => { setUploaded(null); setFileName(''); onChange && onChange(''); }}
                >
                    Remove
                </button>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div
                className="content-card"
                style={{
                    border: '2px dashed var(--glass-border-strong)',
                    borderRadius: 'var(--radius-md)',
                    padding: '28px',
                    textAlign: 'center',
                    cursor: loading ? 'progress' : 'pointer',
                    minHeight: 100,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    gap: 8,
                }}
                onDrop={onDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => !loading && inputRef.current?.click()}
            >
                {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                        <div className="spinner" />
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Uploading {fileName}...</p>
                    </div>
                ) : (
                    <>
                        <span style={{ fontSize: '2rem' }}>📁</span>
                        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>Click or drag to upload</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Max 20MB · PDF, DOC, Images accepted</p>
                    </>
                )}
                <input
                    ref={inputRef}
                    type="file"
                    accept={accept.join(',')}
                    style={{ display: 'none' }}
                    onChange={(e) => handleFile(e.target.files?.[0])}
                />
            </div>
            {error && <p className="text-error" style={{ fontSize: '0.82rem' }}>{error}</p>}
        </div>
    );
}
