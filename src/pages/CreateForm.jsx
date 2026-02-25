import { Link, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import FormBuilder from '../components/FormBuilder/FormBuilder';
import { useAuth } from '../contexts/AuthContext';

export default function CreateForm() {
    const { user, loading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!loading && !user) navigate('/');
    }, [user, loading, navigate]);

    if (loading) return null;

    return (
        <div style={{ minHeight: '100vh' }}>
            <nav className="navbar">
                <Link to="/" className="navbar-brand">
                    <div className="navbar-logo">F</div>
                    <span>Formi<span style={{ color: 'var(--accent-primary)' }}>qx</span></span>
                </Link>
                <div className="navbar-actions">
                    <Link to="/" className="primary-button btn-sm">← Back to Home</Link>
                </div>
            </nav>
            <div style={{ padding: '8px 0' }}>
                <div style={{ padding: '16px 24px 0', maxWidth: 900, margin: '0 auto' }}>
                    <Link to="/" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.95rem', transition: 'color 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                    >
                        ← Back
                    </Link>
                </div>
                <FormBuilder />
            </div>
        </div>
    );
}
