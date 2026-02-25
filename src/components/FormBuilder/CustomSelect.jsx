import { useState, useRef, useEffect } from 'react';

export default function CustomSelect({ value, onChange, options, placeholder = "Select..." }) {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (ref.current && !ref.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find(o => o.value === value) || { label: placeholder };

    return (
        <div ref={ref} style={{ position: 'relative', width: '100%' }}>
            <div
                className="input-field"
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    userSelect: 'none',
                    background: isOpen ? '#f9fafb' : '#ffffff',
                    boxShadow: isOpen ? '0 0 0 4px rgba(245, 158, 11, 0.1)' : '0 1px 2px rgba(0, 0, 0, 0.02)',
                    borderColor: isOpen ? '#f59e0b' : '#d1d5db'
                }}
                onClick={() => setIsOpen(!isOpen)}
            >
                <span style={{ color: value ? '#111827' : '#9ca3af', fontWeight: 500 }}>{selectedOption.label}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }}>
                    <path d="M6 9l6 6 6-6" />
                </svg>
            </div>
            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: '100%', left: 0, right: 0,
                    marginTop: 6, zIndex: 100,
                    background: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: 12,
                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                    maxHeight: 280,
                    overflowY: 'auto',
                    padding: '6px 0'
                }}>
                    {options.map((opt, i) => {
                        const isSelected = opt.value === value;
                        return (
                            <div
                                key={i}
                                style={{
                                    padding: '10px 16px',
                                    cursor: 'pointer',
                                    transition: 'background 0.15s ease',
                                    background: isSelected ? '#fff8eb' : 'transparent',
                                    color: isSelected ? '#d97706' : '#374151',
                                    fontWeight: isSelected ? 600 : 400,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between'
                                }}
                                onMouseOver={e => {
                                    if (!isSelected) {
                                        e.currentTarget.style.background = '#f3f4f6';
                                        e.currentTarget.style.color = '#111827';
                                    }
                                }}
                                onMouseOut={e => {
                                    if (!isSelected) {
                                        e.currentTarget.style.background = 'transparent';
                                        e.currentTarget.style.color = '#374151';
                                    }
                                }}
                                onClick={() => { onChange(opt.value); setIsOpen(false); }}
                            >
                                <span>{opt.label}</span>
                                {isSelected && (
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                        <polyline points="20 6 9 17 4 12"></polyline>
                                    </svg>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
