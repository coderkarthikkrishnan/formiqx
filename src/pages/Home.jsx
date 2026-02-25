import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, getDocs, deleteDoc, doc, orderBy, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';

export default function Home() {
    const { user, login, logout, loading: authLoading } = useAuth();
    const [forms, setForms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const navigate = useNavigate();

    const loadForms = async () => {
        if (!user) {
            setForms([]);
            setLoading(false);
            return;
        }
        try {
            const q = query(
                collection(db, 'forms'),
                where('ownerId', '==', user.uid),
            );
            const snap = await getDocs(q);
            const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            docs.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
            setForms(docs);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!authLoading) loadForms();
    }, [user, authLoading]);

    const handleLogin = async () => {
        setIsLoggingIn(true);
        try {
            await login();
        } catch (e) {
            console.error("Login failed:", e);
        } finally {
            setIsLoggingIn(false);
        }
    };

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        if (!window.confirm('Delete this form? This action cannot be undone.')) return;
        await deleteDoc(doc(db, 'forms', id));
        setForms(prev => prev.filter(f => f.id !== id));
    };

    const formatDate = (ts) => {
        if (!ts) return '';
        const d = ts.toDate ? ts.toDate() : new Date(ts);
        return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    return (
        <div style={{ minHeight: '100vh' }}>
            {/* Navbar */}
            <nav className="navbar">
                <Link to="/" className="navbar-brand">
                    <div className="navbar-logo">F</div>
                    <span>Formi<span style={{ color: 'var(--accent-primary)' }}>qx</span></span>
                </Link>
                <div className="navbar-actions">
                    {user ? (
                        <>
                            <span className="navbar-link">{user.email}</span>
                            <button onClick={logout} className="primary-button btn-sm">Sign Out</button>
                        </>
                    ) : (
                        <button onClick={handleLogin} disabled={isLoggingIn} className={`primary-button ${isLoggingIn ? 'btn-loading' : ''}`}>
                            {isLoggingIn ? 'Redirecting...' : 'Sign In with Google'}
                        </button>
                    )}
                </div>
            </nav>

            <div className="page-container">
                {/* Hero Section */}
                <div className="hero-section animate-fade-up">
                    <h1 className="hero-headline">Seamless Forms & <br /><span className="pill-highlight">Intelligent Exams</span></h1>
                    <p className="hero-subtitle mb-4">
                        Build powerful logic-gated assessments, track live proctored sessions, and export seamlessly to your Google Sheets.
                    </p>
                    {!user && (
                        <button onClick={handleLogin} disabled={isLoggingIn} className={`primary-button ${isLoggingIn ? 'btn-loading' : ''}`} style={{ padding: '16px 36px', fontSize: '1.1rem' }}>
                            {isLoggingIn ? 'Please wait...' : 'Get Started Now →'}
                        </button>
                    )}
                </div>

                {/* Template Gallery */}
                {user && !loading && (
                    <div className="mb-5 animate-fade-up delay-100">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)' }}>Start a new form</h2>
                        </div>

                        <div style={{ display: 'flex', gap: 24, overflowX: 'auto', paddingBottom: 12, WebkitOverflowScrolling: 'touch' }}>
                            {/* Blank Form */}
                            <div
                                onClick={() => navigate('/create')}
                                style={{ cursor: 'pointer', flexShrink: 0, width: 160, display: 'flex', flexDirection: 'column', gap: 12 }}
                            >
                                <div style={{
                                    width: 160, height: 160, borderRadius: 16, border: '1px solid #e5e7eb', background: '#ffffff',
                                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.02)', transition: 'all 0.2s',
                                    padding: 24
                                }}
                                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
                                    onMouseLeave={e => e.currentTarget.style.borderColor = '#e5e7eb'}
                                >
                                    <div style={{ width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(245, 158, 11, 0.25))' }}>
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                                    </div>
                                </div>
                                <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', textAlign: 'center' }}>Blank Form</span>
                            </div>

                            {/* Template 1: Quiz */}
                            <div
                                onClick={() => navigate('/create?template=quiz')}
                                style={{ cursor: 'pointer', flexShrink: 0, width: 160, display: 'flex', flexDirection: 'column', gap: 12 }}
                            >
                                <div style={{
                                    width: 160, height: 160, borderRadius: 16, border: '1px solid #e5e7eb', background: '#ffffff',
                                    overflow: 'hidden', position: 'relative', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', transition: 'all 0.2s'
                                }}
                                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
                                    onMouseLeave={e => e.currentTarget.style.borderColor = '#e5e7eb'}
                                >
                                    <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #fef3c7, #fde68a)', padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        <div style={{ width: '40%', height: 8, background: 'rgba(255,255,255,0.7)', borderRadius: 4 }}></div>
                                        <div style={{ width: '80%', height: 8, background: 'rgba(255,255,255,0.7)', borderRadius: 4 }}></div>
                                        <div style={{ width: '60%', height: 8, background: 'rgba(255,255,255,0.7)', borderRadius: 4 }}></div>

                                        <div style={{ display: 'flex', gap: 8, marginTop: 'auto', alignItems: 'center' }}>
                                            <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#d97706' }}></div>
                                            <div style={{ width: 16, height: 16, borderRadius: '50%', background: 'rgba(255,255,255,0.9)' }}></div>
                                            <div style={{ width: 16, height: 16, borderRadius: '50%', background: 'rgba(255,255,255,0.9)' }}></div>
                                        </div>
                                    </div>
                                </div>
                                <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', textAlign: 'center' }}>Quiz / Exam</span>
                            </div>

                            {/* Template 2: Contact Form */}
                            <div
                                onClick={() => navigate('/create?template=contact')}
                                style={{ cursor: 'pointer', flexShrink: 0, width: 160, display: 'flex', flexDirection: 'column', gap: 12 }}
                            >
                                <div style={{
                                    width: 160, height: 160, borderRadius: 16, border: '1px solid #e5e7eb', background: '#ffffff',
                                    overflow: 'hidden', position: 'relative', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', transition: 'all 0.2s'
                                }}
                                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
                                    onMouseLeave={e => e.currentTarget.style.borderColor = '#e5e7eb'}
                                >
                                    <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #f0fdf4, #bbf7d0)', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                                        <div style={{ flex: 1, background: 'rgba(255,255,255,0.8)', borderRadius: 8 }}></div>
                                        <div style={{ flex: 1.5, background: 'rgba(255,255,255,0.8)', borderRadius: 8 }}></div>
                                    </div>
                                </div>
                                <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', textAlign: 'center' }}>Contact Info</span>
                            </div>
                        </div>
                    </div>
                )}



                {/* Loading */}
                {loading && (
                    <div className="loader-dots inline animate-fade-up delay-200">
                        <div className="dot"></div>
                        <div className="dot"></div>
                        <div className="dot"></div>
                    </div>
                )}

                {/* Empty state */}
                {!loading && forms.length === 0 && user && (
                    <div className="content-card floating-card animate-fade-up delay-200 text-center" style={{ maxWidth: 600, margin: '0 auto', padding: '60px 40px' }}>
                        <h2 className="card-title">Ready for Takeoff</h2>
                        <p className="card-text mb-4">You haven't created any forms yet. Start building your first intelligent assessment.</p>
                        <Link to="/create" className="primary-button" style={{ padding: '16px 36px', fontSize: '1.1rem' }}>+ Create New Form</Link>
                    </div>
                )}

                {/* Forms grid */}
                {!loading && forms.length > 0 && (
                    <div className="feature-grid animate-fade-up delay-200">
                        {forms.map(form => (
                            <div key={form.id} className="content-card floating-card" onClick={() => navigate(`/edit/${form.id}`)} style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column' }}>
                                {form.headerImage && (
                                    <img src={form.headerImage} alt="" style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: '12px', marginBottom: 16 }} />
                                )}

                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                                    <h3 className="card-title" style={{ margin: 0 }}>{form.title || 'Untitled Form'}</h3>
                                    {form.examMode && <span style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--accent-primary)', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600, border: '1px solid rgba(245, 158, 11, 0.3)' }}>Exam</span>}
                                </div>

                                {form.description && (
                                    <p className="card-text mb-3" style={{ overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                        {form.description}
                                    </p>
                                )}

                                <div style={{ marginTop: 'auto', paddingTop: 16 }}>
                                    {form.examMode && form.duration && (
                                        <p className="card-text" style={{ fontSize: '0.85rem', marginBottom: 8 }}>
                                            {form.duration} min duration
                                        </p>
                                    )}
                                    <p className="card-text" style={{ fontSize: '0.85rem', marginBottom: 20 }}>
                                        Created {formatDate(form.createdAt)}
                                    </p>

                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }} onClick={e => e.stopPropagation()}>
                                        <Link to={`/edit/${form.id}`} className="secondary-button btn-sm">Edit</Link>
                                        <Link to={`/preview/${form.id}`} className="secondary-button btn-sm">Preview</Link>
                                        <Link to={`/responses/${form.id}`} className="primary-button btn-sm">Results</Link>
                                        <div style={{ flex: 1 }}></div>
                                        <button className="danger-icon-button" title="Delete Form" onClick={(e) => handleDelete(form.id, e)}>
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path></svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
