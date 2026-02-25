import { Link } from 'react-router-dom';

export default function NotFound() {
    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', textAlign: 'center' }}>
            <div className="floating-card" style={{ padding: '60px 48px', maxWidth: 480, width: '100%' }}>
                <div style={{ fontSize: '5rem', marginBottom: 20 }}>🔍</div>
                <h1 style={{ fontSize: '5rem', fontWeight: 900, color: 'var(--neon-green)', lineHeight: 1, marginBottom: 8 }}>404</h1>
                <h2 style={{ marginBottom: 12 }}>Page Not Found</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: 36 }}>
                    The page you're looking for doesn't exist or has been moved.
                </p>
                <Link to="/" className="primary-button btn-lg">← Go Home</Link>
            </div>
        </div>
    );
}
