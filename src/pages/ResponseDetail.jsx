import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { doc, getDoc, collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase/config';
import ResponseViewer from '../components/ResponseViewer/ResponseViewer';

export default function ResponseDetail() {
    const { formId, responseId } = useParams();
    const [form, setForm] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [response, setResponse] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            const [formSnap, responseSnap, qSnap] = await Promise.all([
                getDoc(doc(db, 'forms', formId)),
                getDoc(doc(db, 'responses', responseId)),
                getDocs(query(collection(db, 'forms', formId, 'questions'), orderBy('order'))),
            ]);

            if (formSnap.exists()) setForm({ id: formSnap.id, ...formSnap.data() });
            if (responseSnap.exists()) setResponse({ id: responseSnap.id, ...responseSnap.data() });
            setQuestions(qSnap.docs.map(d => ({ id: d.id, ...d.data() })));
            setLoading(false);
        };
        load();
    }, [formId, responseId]);

    const formatTime = (ts) => {
        if (!ts) return '—';
        const d = ts.toDate ? ts.toDate() : new Date(ts);
        return d.toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    if (loading) return (
        <div className="loader-dots">
            <div className="dot"></div>
            <div className="dot"></div>
            <div className="dot"></div>
        </div>
    );

    return (
        <div style={{ minHeight: '100vh' }}>
            <nav className="navbar">
                <Link to="/" className="navbar-brand"><div className="navbar-logo">F</div><span>Formi<span style={{ color: 'var(--accent-primary)' }}>qx</span></span></Link>
                <div className="navbar-actions">
                    <Link to={`/responses/${formId}`} className="primary-button btn-sm">← All Responses</Link>
                </div>
            </nav>

            <div className="page-container">
                <div style={{ marginBottom: 24 }}>
                    <Link to={`/responses/${formId}`} style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.95rem', transition: 'color 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                    >
                        ← Back to Responses
                    </Link>
                </div>

                {/* Response header */}
                <div className="content-card" style={{ padding: '24px 28px', marginBottom: 28 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                        <div>
                            <h2 style={{ marginBottom: 4 }}>{response?.studentName}</h2>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                Submitted: {formatTime(response?.submittedAt)}
                            </p>
                        </div>
                        {response?.violations > 0 && (
                            <span className="badge badge-red">⚠ {response.violations} violation{response.violations !== 1 ? 's' : ''}</span>
                        )}
                    </div>
                </div>

                {/* ResponseViewer (admin-only scored breakdown) */}
                <ResponseViewer response={response} questions={questions} />
            </div>
        </div>
    );
}
