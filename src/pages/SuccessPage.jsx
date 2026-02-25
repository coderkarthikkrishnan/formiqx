import { useLocation, Link } from 'react-router-dom';

export default function SuccessPage() {
    const { state } = useLocation();
    const studentName = state?.studentName || 'Student';
    const formTitle = state?.formTitle || 'the exam';

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
            <div className="content-card floating-card" style={{ padding: '60px 48px', textAlign: 'center', maxWidth: 500, width: '100%' }}>
                {/* Animated checkmark */}
                <div style={{
                    width: 90, height: 90, background: 'rgba(6, 214, 160, 0.12)', border: '2px solid var(--success-color)',
                    borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 28px', fontSize: '2.5rem', animation: 'scaleIn 0.4s ease',
                }}>
                    ✅
                </div>

                <h1 style={{ fontSize: '1.8rem', marginBottom: 12, color: 'var(--success-color)' }}>Submitted!</h1>
                <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
                    Thank you, <strong style={{ color: 'var(--text-primary)' }}>{studentName}</strong>.
                </p>
                <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginBottom: 36 }}>
                    Your response has been recorded.
                </p>

                <div className="content-card" style={{ padding: '16px 20px', marginBottom: 32, textAlign: 'left' }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Form</div>
                    <div style={{ fontWeight: 600 }}>{formTitle}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 8 }}>
                        Submitted at {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                </div>

                <Link to="/" className="primary-button">← Back to Home</Link>
            </div>
        </div>
    );
}
