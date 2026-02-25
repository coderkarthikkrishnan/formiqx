import { useRef, useEffect } from 'react';

export default function RichTextEditor({ value, onChange, placeholder, style }) {
    const editorRef = useRef(null);

    // Update internal content if value changes externally (e.g. initial load)
    useEffect(() => {
        if (editorRef.current && editorRef.current.innerHTML !== (value || '')) {
            editorRef.current.innerHTML = value || '';
        }
    }, [value]);

    const handleInput = () => {
        if (onChange && editorRef.current) {
            onChange(editorRef.current.innerHTML);
        }
    };

    const exec = (command) => {
        document.execCommand(command, false, null);
        editorRef.current.focus();
        handleInput();
    };

    return (
        <div style={{ border: '1px solid #d1d5db', borderRadius: '12px', overflow: 'hidden', background: '#fff', ...style }}>
            <div style={{ display: 'flex', gap: 4, padding: '6px 10px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                <button type="button" onClick={() => exec('bold')} title="Bold (Ctrl+B)" style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 'bold', borderRadius: 4 }} onMouseEnter={e => e.currentTarget.style.background = '#e5e7eb'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>B</button>
                <button type="button" onClick={() => exec('italic')} title="Italic (Ctrl+I)" style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', cursor: 'pointer', fontStyle: 'italic', fontFamily: 'serif', borderRadius: 4 }} onMouseEnter={e => e.currentTarget.style.background = '#e5e7eb'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>I</button>
                <button type="button" onClick={() => exec('underline')} title="Underline (Ctrl+U)" style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', cursor: 'pointer', textDecoration: 'underline', borderRadius: 4 }} onMouseEnter={e => e.currentTarget.style.background = '#e5e7eb'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>U</button>
            </div>
            <div
                ref={editorRef}
                contentEditable
                onInput={handleInput}
                onBlur={handleInput}
                style={{
                    padding: '12px 16px',
                    minHeight: '44px',
                    outline: 'none',
                    fontSize: '0.95rem',
                    color: '#111827'
                }}
                className="rich-text-content"
            />
            {/* CSS to show placeholder when empty */}
            <style>{`
                .rich-text-content:empty:before {
                    content: "${placeholder || ''}";
                    color: #9ca3af;
                    pointer-events: none;
                }
            `}</style>
        </div>
    );
}
