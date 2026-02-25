import { useState, useEffect } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { doc, getDoc, collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase/config';
import FormBuilder from '../components/FormBuilder/FormBuilder';

export default function EditForm() {
    const { formId } = useParams();
    const [searchParams] = useSearchParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [savedBanner, setSavedBanner] = useState(searchParams.get('saved') === '1');

    useEffect(() => {
        if (savedBanner) {
            const t = setTimeout(() => setSavedBanner(false), 3000);
            return () => clearTimeout(t);
        }
    }, [savedBanner]);

    useEffect(() => {
        const load = async () => {
            try {
                const formSnap = await getDoc(doc(db, 'forms', formId));
                if (!formSnap.exists()) { setError('Form not found.'); return; }
                const formData = { id: formSnap.id, ...formSnap.data() };

                const qSnap = await getDocs(query(collection(db, 'forms', formId, 'questions'), orderBy('order')));
                const questions = qSnap.docs.map(d => ({ id: d.id, ...d.data() }));
                setData({ ...formData, questions });
            } catch (e) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
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

    if (error) return (
        <div style={{ padding: 40, textAlign: 'center' }}>
            <p className="text-error">{error}</p>
            <Link to="/" className="primary-button" style={{ marginTop: 16 }}>← Home</Link>
        </div>
    );

    return (
        <div style={{ minHeight: '100vh' }}>
            <nav className="navbar">
                <Link to="/" className="navbar-brand">
                    <div className="navbar-logo">F</div>
                    <span>Formi<span style={{ color: 'var(--accent-primary)' }}>qx</span></span>
                </Link>
                <div className="navbar-actions">
                    <Link to={`/preview/${formId}`} className="primary-button btn-sm">Preview</Link>
                    <Link to={`/exam/${formId}`} className="primary-button btn-sm" style={{ borderColor: 'var(--accent-primary)', color: 'var(--text-primary)', background: 'var(--accent-glow)' }}>Exam Link</Link>
                    <Link to={`/responses/${formId}`} className="primary-button btn-sm">Responses</Link>
                </div>
            </nav>

            {savedBanner && (
                <div className="toast toast-success">✅ Form saved successfully!</div>
            )}

            <div style={{ padding: '4px 0' }}>
                <div style={{ padding: '16px 24px 0', maxWidth: 900, margin: '0 auto' }}>
                    <Link to="/" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.95rem', transition: 'color 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                    >
                        ← Back
                    </Link>
                </div>
                <FormBuilder initialForm={data} formId={formId} />
            </div>
        </div>
    );
}
