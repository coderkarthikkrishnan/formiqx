import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { doc, getDoc, collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase/config';
import QuestionRenderer from '../components/QuestionRenderer/QuestionRenderer';

export default function PreviewForm() {
    const { formId } = useParams();
    const [form, setForm] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            const formSnap = await getDoc(doc(db, 'forms', formId));
            if (!formSnap.exists()) { setLoading(false); return; }
            setForm({ id: formSnap.id, ...formSnap.data() });
            const qSnap = await getDocs(query(collection(db, 'forms', formId, 'questions'), orderBy('order')));
            setQuestions(qSnap.docs.map(d => ({ id: d.id, ...d.data() })));
            setLoading(false);
        };
        load();
    }, [formId]);

    if (loading) return (
        <div className="loader-dots">
            <div className="dot"></div>
            <div className="dot"></div>
            <div className="dot"></div>
        </div>
    );
    if (!form) return <div style={{ padding: 40, textAlign: 'center' }}><p>Form not found.</p><Link to="/" className="primary-button" style={{ marginTop: 16 }}>← Home</Link></div>;

    return (
        <div style={{ minHeight: '100vh' }}>
            <nav className="navbar">
                <Link to="/" className="navbar-brand"><div className="navbar-logo">F</div><span>Formi<span style={{ color: 'var(--accent-primary)' }}>qx</span></span></Link>
                <div className="navbar-actions">
                    <span className="badge" style={{ background: 'rgba(255,255,255,0.1)', padding: '6px 12px', borderRadius: '20px', fontSize: '0.85rem' }}>Preview Mode</span>
                    <Link to={`/edit/${formId}`} className="primary-button btn-sm">Edit</Link>
                    <Link to={`/exam/${formId}`} className="primary-button btn-sm">Open Exam</Link>
                </div>
            </nav>

            <div className="page-container" style={{ maxWidth: 800 }}>
                {form.headerImage && <img src={form.headerImage} alt="" style={{ width: '100%', borderRadius: '20px', marginBottom: 24, maxHeight: 200, objectFit: 'cover' }} />}

                <div className="content-card" style={{ padding: 28, marginBottom: 24 }}>
                    <h1 style={{ marginBottom: 12, fontSize: '2rem' }}>{form.title}</h1>
                    {form.description && <p className="card-text">{form.description}</p>}
                    {form.examMode && (
                        <div style={{ marginTop: 20, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                            <span style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--accent-primary)', padding: '6px 14px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600, border: '1px solid rgba(245, 158, 11, 0.3)' }}>⏱ Exam Mode</span>
                            <span style={{ background: 'rgba(255, 255, 255, 0.1)', color: 'var(--text-primary)', padding: '6px 14px', borderRadius: '20px', fontSize: '0.85rem', border: '1px solid var(--glass-border)' }}>⏳ {form.duration} min</span>
                            <span style={{ background: 'rgba(255, 255, 255, 0.1)', color: 'var(--text-primary)', padding: '6px 14px', borderRadius: '20px', fontSize: '0.85rem', border: '1px solid var(--glass-border)' }}>🔒 Proctored</span>
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 32 }}>
                    {questions.map((q, idx) => (
                        <QuestionRenderer
                            key={q.id}
                            question={{ ...q, order: idx }}
                            value={answers[q.id]}
                            onChange={(qId, val) => setAnswers(prev => ({ ...prev, [qId]: val }))}
                            formId={formId}
                        />
                    ))}
                </div>

                <div className="content-card text-center" style={{ padding: 20, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    👁 This is a preview — submissions are disabled
                </div>
            </div>
        </div>
    );
}
