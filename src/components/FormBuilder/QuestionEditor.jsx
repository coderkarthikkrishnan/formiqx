import { useState } from 'react';
import ImageUpload from '../ImageUpload/ImageUpload';
import CustomSelect from './CustomSelect';
import RichTextEditor from './RichTextEditor';

const QUESTION_TYPES = [
    { value: 'short_answer', label: 'Short Answer' },
    { value: 'paragraph', label: 'Paragraph' },
    { value: 'multiple_choice', label: 'Multiple Choice' },
    { value: 'checkboxes', label: 'Checkboxes' },
    { value: 'dropdown', label: 'Dropdown' },
    { value: 'linear_scale', label: 'Linear Scale' },
    { value: 'date', label: 'Date Picker' },
    { value: 'time', label: 'Time Picker' },
    { value: 'file_upload', label: 'File Upload' },
];

export default function QuestionEditor({
    question, formId, onChange, onDelete, onDuplicate, onMoveUp, onMoveDown, index, total,
    isDragged, onDragStart, onDragOver, onDragEnd
}) {
    const [collapsed, setCollapsed] = useState(false);
    const [isDraggable, setIsDraggable] = useState(false);

    const update = (field, value) => onChange({ ...question, [field]: value });

    const updateOption = (i, field, value) => {
        const opts = [...(question.options || [])];
        opts[i] = { ...opts[i], [field]: value };
        update('options', opts);
    };

    const addOption = () => update('options', [...(question.options || []), { text: `Option ${(question.options?.length || 0) + 1}`, image: '' }]);
    const removeOption = (i) => update('options', (question.options || []).filter((_, idx) => idx !== i));

    const hasOptions = ['multiple_choice', 'checkboxes', 'dropdown'].includes(question.type);
    const isScale = question.type === 'linear_scale';

    return (
        <div
            className={`content-card mb-4 ${collapsed ? '' : 'active'}`}
            draggable={isDraggable}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDragEnd={() => {
                setIsDraggable(false);
                if (onDragEnd) onDragEnd();
            }}
            style={{
                opacity: isDragged ? 0.4 : 1,
                transform: isDragged ? 'scale(0.98)' : 'scale(1)',
                transition: 'opacity 0.2s, transform 0.2s'
            }}
        >
            {/* Header row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: collapsed ? 0 : 16 }}>
                <div
                    onMouseEnter={() => setIsDraggable(true)}
                    onMouseLeave={() => setIsDraggable(false)}
                    style={{
                        cursor: 'grab',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#9ca3af'
                    }}
                    title="Drag to reorder"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <circle cx="9" cy="5" r="1.5"></circle>
                        <circle cx="9" cy="12" r="1.5"></circle>
                        <circle cx="9" cy="19" r="1.5"></circle>
                        <circle cx="15" cy="5" r="1.5"></circle>
                        <circle cx="15" cy="12" r="1.5"></circle>
                        <circle cx="15" cy="19" r="1.5"></circle>
                    </svg>
                </div>
                <div style={{ flex: 1, fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {collapsed ? (question.label || `Question ${index + 1}`) : `Q${index + 1}`}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                    {index > 0 && <button type="button" className="btn-icon" title="Move Up" onClick={onMoveUp}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 19V5M5 12l7-7 7 7" /></svg>
                    </button>}
                    {index < total - 1 && <button type="button" className="btn-icon" title="Move Down" onClick={onMoveDown}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12l7 7 7-7" /></svg>
                    </button>}
                    <button type="button" className="btn-icon" title="Duplicate" onClick={onDuplicate}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                    </button>
                    <button type="button" className="btn-icon danger" title="Delete" onClick={onDelete} style={{ color: '#ef4444' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path></svg>
                    </button>
                    <button type="button" className="btn-icon" title={collapsed ? 'Expand' : 'Collapse'} onClick={() => setCollapsed(v => !v)}>
                        {collapsed ? (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
                        ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 15l-6-6-6 6" /></svg>
                        )}
                    </button>
                </div>
            </div>

            {!collapsed && (
                <>
                    {/* Type + Label row */}
                    <div style={{ display: 'flex', gap: 16, marginBottom: 16, alignItems: 'flex-end' }}>
                        <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
                            <label className="form-label">Question Type</label>
                            <CustomSelect
                                value={question.type || 'short_answer'}
                                onChange={val => update('type', val)}
                                options={QUESTION_TYPES}
                            />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0, width: 120 }}>
                            <label className="form-label">Points</label>
                            <input
                                className="input-field"
                                type="number"
                                min="0"
                                step="0.5"
                                value={question.points ?? 1}
                                onChange={e => update('points', parseFloat(e.target.value) || 0)}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <label className="form-label" style={{ marginBottom: 0 }}>Question Text</label>
                            <button type="button" className="btn-icon" style={{ width: 32, height: 32 }} title="Add Question Image" onClick={() => document.getElementById(`q-img-${question.id}`)?.click()}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                            </button>
                            <input
                                id={`q-img-${question.id}`}
                                type="file"
                                accept="image/*"
                                style={{ display: 'none' }}
                                onChange={async (e) => {
                                    const f = e.target.files?.[0];
                                    if (!f) return;
                                    const { uploadToCloudinary } = await import('../../cloudinary/upload');
                                    const url = await uploadToCloudinary(f, `forms/${formId}/questions`);
                                    update('image', url);
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: question.image ? 12 : 0 }}>
                            <RichTextEditor
                                placeholder="Enter your question..."
                                value={question.label || ''}
                                onChange={val => update('label', val)}
                            />
                        </div>

                        {question.image && (
                            <div style={{ position: 'relative', display: 'inline-block', alignSelf: 'flex-start' }}>
                                <img src={question.image} alt="Question Context" style={{ maxHeight: 200, maxWidth: '100%', objectFit: 'contain', borderRadius: 8, border: '1px solid #e5e7eb' }} />
                                <button type="button" className="btn-icon danger" style={{ position: 'absolute', top: -12, right: -12, width: 26, height: 26, color: '#ef4444' }} onClick={() => update('image', '')}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Options for choice types */}
                    {hasOptions && (
                        <div className="form-group">
                            <label className="form-label">Options</label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {(question.options || []).map((opt, i) => (
                                    <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', minWidth: 20 }}>{i + 1}.</span>
                                        <input
                                            className="input-field"
                                            type="text"
                                            placeholder={`Option ${i + 1}`}
                                            value={opt.text || ''}
                                            onChange={e => updateOption(i, 'text', e.target.value)}
                                            style={{ flex: 1 }}
                                        />
                                        <button
                                            type="button"
                                            className="btn-icon"
                                            title="Add option image"
                                            onClick={() => document.getElementById(`opt-img-${question.id}-${i}`)?.click()}
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                                        </button>
                                        <input
                                            id={`opt-img-${question.id}-${i}`}
                                            type="file"
                                            accept="image/*"
                                            style={{ display: 'none' }}
                                            onChange={async (e) => {
                                                const f = e.target.files?.[0];
                                                if (!f) return;
                                                const { uploadToCloudinary } = await import('../../cloudinary/upload');
                                                const url = await uploadToCloudinary(f, `forms/${formId}/options`);
                                                updateOption(i, 'image', url);
                                            }}
                                        />
                                        {opt.image && <img src={opt.image} alt="" style={{ width: 40, height: 28, objectFit: 'cover', borderRadius: 5 }} />}
                                        <button type="button" className="btn-icon danger" onClick={() => removeOption(i)} style={{ color: '#ef4444' }}>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <button type="button" className="primary-button btn-sm" style={{ marginTop: 10, alignSelf: 'flex-start' }} onClick={addOption}>
                                + Add Option
                            </button>
                        </div>
                    )}

                    {/* Linear scale config */}
                    {isScale && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10, marginBottom: 14 }}>
                            <div>
                                <label className="form-label">Min</label>
                                <input className="input-field" type="number" value={question.scaleMin ?? 1} onChange={e => update('scaleMin', parseInt(e.target.value))} />
                            </div>
                            <div>
                                <label className="form-label">Max</label>
                                <input className="input-field" type="number" value={question.scaleMax ?? 5} onChange={e => update('scaleMax', parseInt(e.target.value))} />
                            </div>
                            <div>
                                <label className="form-label">Min Label</label>
                                <input className="input-field" type="text" placeholder="Low" value={question.scaleMinLabel || ''} onChange={e => update('scaleMinLabel', e.target.value)} />
                            </div>
                            <div>
                                <label className="form-label">Max Label</label>
                                <input className="input-field" type="text" placeholder="High" value={question.scaleMaxLabel || ''} onChange={e => update('scaleMaxLabel', e.target.value)} />
                            </div>
                        </div>
                    )}

                    {/* Correct answer */}
                    {['multiple_choice', 'dropdown', 'short_answer', 'linear_scale'].includes(question.type) && (
                        <div className="form-group">
                            <label className="form-label">Correct Answer (for scoring)</label>
                            {['multiple_choice', 'dropdown'].includes(question.type) && (question.options?.length > 0) ? (
                                <CustomSelect
                                    value={question.correctAnswer || ''}
                                    onChange={val => update('correctAnswer', val)}
                                    options={[
                                        { value: '', label: '— Not graded —' },
                                        ...(question.options || []).map(opt => ({ value: opt.text, label: opt.text }))
                                    ]}
                                />
                            ) : (
                                <input
                                    className="input-field"
                                    type="text"
                                    placeholder="Leave blank to skip scoring for this question"
                                    value={question.correctAnswer || ''}
                                    onChange={e => update('correctAnswer', e.target.value)}
                                />
                            )}
                        </div>
                    )}

                    {/* Checkboxes correct answers */}
                    {question.type === 'checkboxes' && (
                        <div className="form-group">
                            <label className="form-label">Correct Options (check all that apply)</label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {(question.options || []).map((opt, i) => {
                                    const correct = Array.isArray(question.correctAnswer) ? question.correctAnswer : [];
                                    const checked = correct.includes(opt.text);
                                    const toggle = () => {
                                        const next = checked ? correct.filter(c => c !== opt.text) : [...correct, opt.text];
                                        update('correctAnswer', next);
                                    };
                                    return (
                                        <label key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                                            <input type="checkbox" checked={checked} onChange={toggle} />
                                            {opt.text}
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Required toggle */}
                    <div className="toggle-wrap" style={{ marginTop: 6 }}>
                        <label className="toggle">
                            <input type="checkbox" checked={!!question.required} onChange={e => update('required', e.target.checked)} />
                            <span className="toggle-slider" />
                        </label>
                        <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>Required</span>
                    </div>
                </>
            )}
        </div>
    );
}
