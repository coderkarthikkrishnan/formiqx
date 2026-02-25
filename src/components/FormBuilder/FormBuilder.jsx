
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    collection, addDoc, updateDoc, doc, setDoc, deleteDoc, serverTimestamp
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import ImageUpload from '../ImageUpload/ImageUpload';
import QuestionEditor from './QuestionEditor';
import { useAuth } from '../../contexts/AuthContext';

const newQuestion = (order) => ({
    id: `q_${Date.now()}_${order}`,
    type: 'short_answer',
    label: '',
    options: [],
    required: false,
    image: '',
    points: 1,
    correctAnswer: '',
    order,
});

export default function FormBuilder({ initialForm = null, formId = null }) {
    const navigate = useNavigate();
    const { user } = useAuth();
    const isEdit = !!formId;

    const [form, setForm] = useState({
        title: initialForm?.title || '',
        description: initialForm?.description || '',
        headerImage: initialForm?.headerImage || '',
        examMode: initialForm?.examMode ?? false,
        duration: initialForm?.duration || 30,
        shuffleQuestions: initialForm?.shuffleQuestions ?? false,
    });

    const [questions, setQuestions] = useState(
        initialForm?.questions?.length
            ? initialForm.questions
            : [newQuestion(0)]
    );

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('questions');
    const [draggedIdx, setDraggedIdx] = useState(null);
    const [isUploadingHeader, setIsUploadingHeader] = useState(false);

    const updateForm = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

    const addQuestion = () => setQuestions(prev => [...prev, newQuestion(prev.length)]);

    const updateQuestion = (idx, updated) => {
        setQuestions(prev => prev.map((q, i) => i === idx ? { ...updated, order: i } : q));
    };

    const deleteQuestion = (idx) => {
        if (questions.length === 1) return;
        setQuestions(prev => prev.filter((_, i) => i !== idx).map((q, i) => ({ ...q, order: i })));
    };

    const duplicateQuestion = (idx) => {
        const clone = { ...questions[idx], id: `q_${Date.now()}`, order: idx + 1 };
        setQuestions(prev => {
            const arr = [...prev];
            arr.splice(idx + 1, 0, clone);
            return arr.map((q, i) => ({ ...q, order: i }));
        });
    };

    const moveUp = (idx) => {
        if (idx === 0) return;
        setQuestions(prev => {
            const arr = [...prev];
            [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
            return arr.map((q, i) => ({ ...q, order: i }));
        });
    };

    const moveDown = (idx) => {
        if (idx === questions.length - 1) return;
        setQuestions(prev => {
            const arr = [...prev];
            [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
            return arr.map((q, i) => ({ ...q, order: i }));
        });
    };

    const handleDragStart = (e, idx) => {
        setDraggedIdx(idx);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e, idx) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        if (draggedIdx === null || draggedIdx === idx) return;

        setQuestions(prev => {
            const arr = [...prev];
            const item = arr.splice(draggedIdx, 1)[0];
            arr.splice(idx, 0, item);
            return arr.map((q, i) => ({ ...q, order: i }));
        });
        setDraggedIdx(idx);
    };

    const handleDragEnd = () => {
        setDraggedIdx(null);
    };

    const handleSave = async () => {
        if (!form.title.trim()) { setError('Form title is required.'); return; }
        setSaving(true);
        setError('');

        try {
            const formData = {
                ...form,
                updatedAt: serverTimestamp(),
            };

            let fId = formId;

            if (isEdit) {
                await updateDoc(doc(db, 'forms', fId), formData);
            } else {
                formData.createdAt = serverTimestamp();
                formData.ownerId = user?.uid || 'anonymous';
                const ref = await addDoc(collection(db, 'forms'), formData);
                fId = ref.id;
            }

            // Save questions as subcollection
            const qColl = collection(db, 'forms', fId, 'questions');
            for (const q of questions) {
                await setDoc(doc(qColl, q.id), q);
            }

            // Remove deleted questions (edit mode only — compare by id)
            if (isEdit && initialForm?.questions) {
                const currentIds = new Set(questions.map(q => q.id));
                for (const oldQ of initialForm.questions) {
                    if (!currentIds.has(oldQ.id)) {
                        await deleteDoc(doc(qColl, oldQ.id));
                    }
                }
            }

            navigate(`/edit/${fId}?saved=1`);
        } catch (e) {
            setError(e.message || 'Save failed. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div style={{ padding: '32px 24px', maxWidth: 900, margin: '0 auto' }}>
            {/* Tab bar */}
            <div style={{ textAlign: 'center' }}>
                <div className="tab-container">
                    {['questions', 'settings'].map(tab => (
                        <button key={tab} className={`tab-button ${activeTab === tab ? 'active' : ''} `} onClick={() => setActiveTab(tab)}>
                            {tab === 'questions' ? 'Questions' : 'Settings'}
                        </button>
                    ))}
                </div>
            </div>

            {activeTab === 'settings' && (
                <div className="content-card" style={{ padding: 28, marginBottom: 20 }}>
                    <h3 style={{ marginBottom: 20 }}>Form Settings</h3>

                    <div className="form-group">
                        <label className="form-label">Form Title *</label>
                        <input className="input-field" type="text" placeholder="Untitled Form" value={form.title} onChange={e => updateForm('title', e.target.value)} />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Description</label>
                        <textarea className="input-field" rows={3} placeholder="Describe this form..." value={form.description} onChange={e => updateForm('description', e.target.value)} style={{ resize: 'vertical' }} />
                    </div>

                    <hr className="divider" />

                    <div className="toggle-wrap" style={{ marginBottom: 16 }}>
                        <label className="toggle">
                            <input type="checkbox" checked={form.examMode} onChange={e => updateForm('examMode', e.target.checked)} />
                            <span className="toggle-slider" />
                        </label>
                        <div>
                            <span style={{ fontWeight: 600 }}>Exam Mode</span>
                            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>Enables timer, proctoring, and individual student sessions</p>
                        </div>
                    </div>

                    {form.examMode && (
                        <div className="form-group">
                            <label className="form-label">Exam Duration (minutes)</label>
                            <input className="input-field" type="number" min={1} max={360} value={form.duration} onChange={e => updateForm('duration', parseInt(e.target.value) || 30)} style={{ maxWidth: 180 }} />
                        </div>
                    )}

                    <div className="toggle-wrap">
                        <label className="toggle">
                            <input type="checkbox" checked={form.shuffleQuestions} onChange={e => updateForm('shuffleQuestions', e.target.checked)} />
                            <span className="toggle-slider" />
                        </label>
                        <span style={{ fontWeight: 500 }}>Shuffle Questions</span>
                    </div>
                </div>
            )}

            {activeTab === 'questions' && (
                <>
                    {/* Form title preview at top of questions tab */}
                    <div className="content-card" style={{ padding: '24px 32px', marginBottom: 24 }}>
                        {form.headerImage && (
                            <div style={{ position: 'relative', marginBottom: 16 }}>
                                <img src={form.headerImage} alt="header" style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: '12px' }} />
                                <button type="button" className="btn-icon danger" style={{ position: 'absolute', top: 12, right: 12, width: 32, height: 32, background: 'rgba(255,255,255,0.9)', color: '#ef4444' }} onClick={() => updateForm('headerImage', '')}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                </button>
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                            <div style={{ flex: 1 }}>
                                <input
                                    className="input-field"
                                    type="text"
                                    placeholder="Form Title"
                                    value={form.title}
                                    onChange={e => updateForm('title', e.target.value)}
                                    style={{ fontSize: '1.6rem', fontWeight: 800, background: 'transparent', border: 'none', borderBottom: '2px solid #e5e7eb', borderRadius: 0, padding: '0 0 10px 0', marginBottom: 16, color: '#111827' }}
                                />
                                <input
                                    className="input-field"
                                    type="text"
                                    placeholder="Form description (optional)"
                                    value={form.description}
                                    onChange={e => updateForm('description', e.target.value)}
                                    style={{ background: 'transparent', border: 'none', borderRadius: 0, padding: 0, color: '#4b5563', fontSize: '1.05rem' }}
                                />
                            </div>

                            {!form.headerImage && (
                                <div style={{ display: 'flex', alignItems: 'center', paddingTop: 8 }}>
                                    <button
                                        type="button"
                                        className="btn-icon"
                                        style={{ width: 40, height: 40 }}
                                        title="Add Header Image"
                                        onClick={() => document.getElementById('header-img-icon-upload')?.click()}
                                        disabled={isUploadingHeader}
                                    >
                                        {isUploadingHeader ? (
                                            <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                                        ) : (
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                                        )}
                                    </button>
                                    <input
                                        id="header-img-icon-upload"
                                        type="file"
                                        accept="image/*"
                                        style={{ display: 'none' }}
                                        onChange={async (e) => {
                                            const f = e.target.files?.[0];
                                            if (!f) return;
                                            try {
                                                setIsUploadingHeader(true);
                                                const { uploadToCloudinary } = await import('../../cloudinary/upload');
                                                const url = await uploadToCloudinary(f, `forms/${formId || 'draft'}/headers`);
                                                updateForm('headerImage', url);
                                            } catch (err) {
                                                console.error('Upload failed:', err);
                                                setError('Failed to upload image.');
                                            } finally {
                                                setIsUploadingHeader(false);
                                            }
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Questions list */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {questions.map((q, idx) => (
                            <QuestionEditor
                                key={q.id}
                                question={q}
                                formId={formId || 'draft'}
                                index={idx}
                                total={questions.length}
                                isDragged={draggedIdx === idx}
                                onDragStart={(e) => handleDragStart(e, idx)}
                                onDragOver={(e) => handleDragOver(e, idx)}
                                onDragEnd={handleDragEnd}
                                onChange={(updated) => updateQuestion(idx, updated)}
                                onDelete={() => deleteQuestion(idx)}
                                onDuplicate={() => duplicateQuestion(idx)}
                                onMoveUp={() => moveUp(idx)}
                                onMoveDown={() => moveDown(idx)}
                            />
                        ))}
                    </div>

                    <button type="button" className="primary-button" style={{ marginTop: 16, width: '100%' }} onClick={addQuestion}>
                        + Add Question
                    </button>
                </>
            )}

            {/* Error */}
            {error && (
                <div className="content-card" style={{ borderColor: 'var(--error-color)', marginTop: 16, padding: '12px 16px' }}>
                    <p className="text-error" style={{ fontSize: '0.88rem' }}>⚠ {error}</p>
                </div>
            )}

            {/* Save button */}
            <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'flex-end' }}>
                <button type="button" className="primary-button" onClick={() => navigate('/')}>Cancel</button>
                <button type="button" className={`primary-button btn-lg ${saving ? 'btn-loading' : ''} `} onClick={handleSave} disabled={saving}>
                    {saving ? '' : (isEdit ? 'Save Changes' : 'Create Form')}
                </button>
            </div>
        </div>
    );
}
