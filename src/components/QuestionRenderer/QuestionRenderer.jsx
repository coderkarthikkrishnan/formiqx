import FileUpload from '../FileUpload/FileUpload';

/**
 * Renders any question type for student exam view.
 * Controlled via answers[question.id] → setAnswer callback.
 *
 * @param {Object} question - Question object from Firestore
 * @param {*} value - Current answer value
 * @param {function} onChange - (questionId, value) => void
 * @param {string} formId - For Cloudinary folder
 */
export default function QuestionRenderer({ question, value, onChange, formId }) {
    const q = question;
    const handleChange = (v) => onChange(q.id, v);

    const renderInput = () => {
        switch (q.type) {
            case 'short_answer':
                return (
                    <input
                        className="input-field"
                        type="text"
                        placeholder="Your answer"
                        value={value || ''}
                        onChange={(e) => handleChange(e.target.value)}
                        style={{ marginTop: 12 }}
                    />
                );

            case 'paragraph':
                return (
                    <textarea
                        className="input-field"
                        rows={4}
                        placeholder="Your answer"
                        value={value || ''}
                        onChange={(e) => handleChange(e.target.value)}
                        style={{ marginTop: 12, resize: 'vertical' }}
                    />
                );

            case 'multiple_choice':
                return (
                    <div className="answer-options">
                        {(q.options || []).map((opt, i) => (
                            <label key={i} className={`radio-option ${value === opt.text ? 'selected' : ''}`}>
                                <input
                                    type="radio"
                                    name={q.id}
                                    value={opt.text}
                                    checked={value === opt.text}
                                    onChange={() => handleChange(opt.text)}
                                />
                                {opt.image && <img src={opt.image} alt="" className="option-image" />}
                                <span className="option-label">{opt.text}</span>
                            </label>
                        ))}
                    </div>
                );

            case 'checkboxes': {
                const selected = Array.isArray(value) ? value : [];
                const toggle = (text) => {
                    const next = selected.includes(text) ? selected.filter(s => s !== text) : [...selected, text];
                    handleChange(next);
                };
                return (
                    <div className="answer-options">
                        {(q.options || []).map((opt, i) => (
                            <label key={i} className={`checkbox-option ${selected.includes(opt.text) ? 'selected' : ''}`}>
                                <input
                                    type="checkbox"
                                    checked={selected.includes(opt.text)}
                                    onChange={() => toggle(opt.text)}
                                />
                                {opt.image && <img src={opt.image} alt="" className="option-image" />}
                                <span className="option-label">{opt.text}</span>
                            </label>
                        ))}
                    </div>
                );
            }

            case 'dropdown':
                return (
                    <select
                        className="input-field"
                        value={value || ''}
                        onChange={(e) => handleChange(e.target.value)}
                        style={{ marginTop: 12 }}
                    >
                        <option value="">Select an option</option>
                        {(q.options || []).map((opt, i) => (
                            <option key={i} value={opt.text}>{opt.text}</option>
                        ))}
                    </select>
                );

            case 'linear_scale': {
                const min = q.scaleMin ?? 1;
                const max = q.scaleMax ?? 5;
                const steps = Array.from({ length: max - min + 1 }, (_, i) => min + i);
                return (
                    <div className="linear-scale">
                        <div className="linear-scale-labels">
                            <span>{q.scaleMinLabel || min}</span>
                            <span>{q.scaleMaxLabel || max}</span>
                        </div>
                        <div className="linear-scale-buttons">
                            {steps.map(n => (
                                <button
                                    key={n}
                                    type="button"
                                    className={`scale-btn ${String(value) === String(n) ? 'selected' : ''}`}
                                    onClick={() => handleChange(String(n))}
                                >
                                    {n}
                                </button>
                            ))}
                        </div>
                    </div>
                );
            }

            case 'date':
                return (
                    <input
                        className="input-field"
                        type="date"
                        value={value || ''}
                        onChange={(e) => handleChange(e.target.value)}
                        style={{ marginTop: 12 }}
                    />
                );

            case 'time':
                return (
                    <input
                        className="input-field"
                        type="time"
                        value={value || ''}
                        onChange={(e) => handleChange(e.target.value)}
                        style={{ marginTop: 12 }}
                    />
                );

            case 'file_upload':
                return (
                    <div style={{ marginTop: 12 }}>
                        <FileUpload
                            folder={`forms/${formId}/uploads`}
                            value={value}
                            onChange={handleChange}
                        />
                    </div>
                );

            default:
                return (
                    <input
                        className="input-field"
                        type="text"
                        placeholder="Your answer"
                        value={value || ''}
                        onChange={(e) => handleChange(e.target.value)}
                        style={{ marginTop: 12 }}
                    />
                );
        }
    };

    return (
        <div className="content-card" style={{ padding: '24px 32px' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>
                Question {q.order + 1}
                {q.required && <span style={{ color: '#ef4444', marginLeft: 4, fontSize: '1rem' }}>*</span>}
            </div>
            <div
                style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16, lineHeight: 1.5 }}
                dangerouslySetInnerHTML={{ __html: q.label || q.questionText }}
            />
            {q.image && (
                <img src={q.image} alt="question" style={{ width: '100%', maxHeight: 280, objectFit: 'cover', borderRadius: 12, marginBottom: 16, border: '1px solid #e5e7eb' }} />
            )}
            {renderInput()}
        </div>
    );
}
