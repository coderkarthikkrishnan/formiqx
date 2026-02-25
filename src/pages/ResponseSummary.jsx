import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
    doc, getDoc, collection, getDocs, orderBy, query, where
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';

export default function ResponseSummary() {
    const { formId } = useParams();
    const navigate = useNavigate();
    const { user, login } = useAuth();

    const [form, setForm] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [responses, setResponses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [exportMsg, setExportMsg] = useState('');
    const [sheetUrl, setSheetUrl] = useState('');

    useEffect(() => {
        const load = async () => {
            const formSnap = await getDoc(doc(db, 'forms', formId));
            if (!formSnap.exists()) { setLoading(false); return; }
            setForm({ id: formSnap.id, ...formSnap.data() });

            const qSnap = await getDocs(query(collection(db, 'forms', formId, 'questions'), orderBy('order')));
            const qs = qSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            setQuestions(qs);

            const rSnap = await getDocs(query(collection(db, 'responses'), where('formId', '==', formId)));
            const rs = rSnap.docs
                .map(d => ({ id: d.id, ...d.data() }))
                .sort((a, b) => (b.submittedAt?.toMillis?.() || 0) - (a.submittedAt?.toMillis?.() || 0));
            setResponses(rs);
            setLoading(false);
        };
        load();
    }, [formId]);

    const formatTime = (ts) => {
        if (!ts) return '—';
        const d = ts.toDate ? ts.toDate() : new Date(ts);
        return d.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    };

    const stripHtml = (html) => {
        if (!html) return '';
        const temp = document.createElement('div');
        temp.innerHTML = html;
        return temp.textContent || temp.innerText || '';
    };

    // CSV Export
    const exportCSV = () => {
        if (!responses.length) return;
        const headers = [
            'Student Name', 'Submission Time', 'Total Score', 'Total Possible', 'Violations',
            ...questions.map((q, i) => `Q${i + 1}: ${stripHtml(q.label) || 'Q'}`),
            ...questions.map((q, i) => `Q${i + 1} Points Earned`),
        ];

        const rows = responses.map(r => {
            const answers = questions.map(q => {
                const a = r.answers?.[q.id];
                if (Array.isArray(a)) return a.join('; ');
                return a ?? '';
            });
            const pts = questions.map(q => r.questionScores?.[q.id]?.earned ?? '');
            return [
                r.studentName,
                formatTime(r.submittedAt),
                r.totalScore ?? '',
                r.totalPossibleScore ?? '',
                r.violations ?? 0,
                ...answers,
                ...pts,
            ];
        });

        const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${form?.title || 'responses'}_${Date.now()}.csv`;
        a.click();
    };

    // Google Sheets Export via Direct OAuth API
    const exportToSheets = async (isRetry = false) => {
        let token = user?.googleToken;
        if (!token) {
            try {
                // If it's expired or missing, force a re-login
                const refreshedUser = await login();
                token = refreshedUser.googleToken;
            } catch (err) {
                setExportMsg('⚠ Please sign in with Google to export to Sheets.');
                return;
            }
        }

        if (!isRetry) {
            setExporting(true);
            setExportMsg('');
            setSheetUrl('');
        }

        try {
            // 1. Create Spreadsheet
            const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    properties: { title: `${form?.title || 'Formiqx'} Responses - ${new Date().toLocaleDateString()}` }
                })
            });

            if (!createRes.ok) {
                let apiError = '';
                try {
                    const errData = await createRes.json();
                    apiError = errData.error?.message || errData.error?.status || 'Unknown API Error';
                } catch { }

                if (createRes.status === 401 && !isRetry) {
                    console.log('Token expired, attempting refresh...');
                    const refreshedUser = await login();
                    if (refreshedUser && refreshedUser.googleToken) {
                        return exportToSheets(true); // Retry once with new token
                    }
                }
                throw new Error(`[${createRes.status}] ${apiError || 'Failed to create spreadsheet'}`);
            }

            const sheetData = await createRes.json();
            const spreadsheetId = sheetData.spreadsheetId;

            // 2. Prepare Data (Match CSV format)
            const headers = [
                'Student Name', 'Submission Time', 'Total Score', 'Total Possible', 'Violations',
                ...questions.map((q, i) => `Q${i + 1}: ${stripHtml(q.label) || 'Q'}`),
                ...questions.map((q, i) => `Q${i + 1} Points Earned`),
            ].map(String);

            const rows = responses.map(r => {
                const answers = questions.map(q => {
                    const a = r.answers?.[q.id];
                    if (Array.isArray(a)) return a.join('; ');
                    return a ?? '';
                });
                const pts = questions.map(q => r.questionScores?.[q.id]?.earned ?? '');
                const rowData = [
                    r.studentName || 'Anonymous',
                    formatTime(r.submittedAt),
                    r.totalScore ?? '',
                    r.totalPossibleScore ?? '',
                    r.violations ?? 0,
                    ...answers,
                    ...pts,
                ];
                // Ensure no undefined values are passed to Sheets API
                return rowData.map(val => val === undefined || val === null ? '' : String(val));
            });

            const values = [headers, ...rows];

            // 3. Populate Spreadsheet
            const updateRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A1:append?valueInputOption=USER_ENTERED`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    majorDimension: "ROWS",
                    values: values
                })
            });

            if (!updateRes.ok) throw new Error('Failed to populate spreadsheet');

            setSheetUrl(sheetData.spreadsheetUrl);
            setExportMsg('✅ Exported successfully!');
        } catch (e) {
            console.error(e);
            setExportMsg(`❌ Export failed: ${e.message}. You may need to sign out and sign back in.`);
        } finally {
            if (!isRetry) {
                setExporting(false);
                setTimeout(() => setExportMsg(''), 10000);
            }
        }
    };

    // Analytics: answer distribution per question
    const analytics = questions.map(q => {
        const counts = {};
        responses.forEach(r => {
            const a = r.answers?.[q.id];
            if (!a && a !== 0) return;
            const arr = Array.isArray(a) ? a : [a];
            arr.forEach(v => { counts[v] = (counts[v] || 0) + 1; });
        });
        return { question: q, counts };
    });

    if (loading) return (
        <div className="loader-dots">
            <div className="dot"></div>
            <div className="dot"></div>
            <div className="dot"></div>
        </div>
    );
    if (!form) return <div style={{ padding: 40, textAlign: 'center' }}><p>Form not found.</p><Link to="/" className="primary-button" style={{ marginTop: 16 }}>← Home</Link></div>;

    const avgScore = responses.length
        ? (responses.reduce((s, r) => s + (r.totalScore || 0), 0) / responses.length).toFixed(1)
        : '—';
    const maxPossible = responses[0]?.totalPossibleScore || 0;

    return (
        <div style={{ minHeight: '100vh' }}>
            <nav className="navbar">
                <Link to="/" className="navbar-brand"><div className="navbar-logo">F</div><span>Formi<span style={{ color: 'var(--accent-primary)' }}>qx</span></span></Link>
                <div className="navbar-actions">
                    <Link to={`/edit/${formId}`} className="primary-button btn-sm">Edit Form</Link>
                </div>
            </nav>

            <div className="page-container">
                <div style={{ marginBottom: 24 }}>
                    <Link to="/" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.95rem', transition: 'color 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                    >
                        ← Back
                    </Link>
                </div>

                <div className="page-header">
                    <h1>{form.title}</h1>
                    <p>{responses.length} response{responses.length !== 1 ? 's' : ''}</p>
                </div>

                {/* Stats row */}
                <div className="four-col" style={{ marginBottom: 32 }}>
                    <div className="stat-card">
                        <div className="stat-number">{responses.length}</div>
                        <div className="stat-label">Responses</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-number">{avgScore}</div>
                        <div className="stat-label">Avg Score{maxPossible ? ` / ${maxPossible}` : ''}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-number">{questions.length}</div>
                        <div className="stat-label">Questions</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-number">{responses.filter(r => r.violations > 0).length}</div>
                        <div className="stat-label">With Violations</div>
                    </div>
                </div>

                {/* Export buttons */}
                {responses.length > 0 && (
                    <div className="btn-group" style={{ marginBottom: 28 }}>
                        <button className="primary-button" onClick={exportToSheets} disabled={exporting}>
                            {exporting ? '⏳ Exporting...' : '📊 Export to Google Sheets'}
                        </button>
                        <button className="primary-button" onClick={exportCSV}>
                            ⬇ Export CSV
                        </button>
                    </div>
                )}

                {exportMsg && (
                    <div className="content-card" style={{ marginBottom: 20, padding: '16px 20px', borderLeft: exportMsg.includes('✅') ? '4px solid #10b981' : '4px solid #ef4444', borderRadius: '8px' }}>
                        <p style={{ fontSize: '0.95rem', margin: 0, fontWeight: 500, color: 'var(--text-secondary)' }}>
                            {exportMsg}{' '}
                            {sheetUrl && (
                                <a href={sheetUrl} target="_blank" rel="noreferrer" style={{ color: '#f59e0b', fontWeight: 600, marginLeft: 8, textDecoration: 'underline' }}>
                                    Open Sheet ↗
                                </a>
                            )}
                        </p>
                    </div>
                )}

                {/* Responses table */}
                {responses.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">📭</div>
                        <h3>No responses yet</h3>
                        <p style={{ marginBottom: 20 }}>Share the exam link with your students.</p>
                        <Link to={`/exam/${formId}`} className="primary-button">View Exam Link</Link>
                    </div>
                ) : (
                    <>
                        <div className="content-card" style={{ padding: 0, overflow: 'hidden', marginBottom: 36 }}>
                            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--glass-border)' }}>
                                <h3 style={{ margin: 0 }}>Individual Responses</h3>
                            </div>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                            {['Student Name', 'Submitted', 'Score', 'Violations', 'Details'].map(h => (
                                                <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: 700 }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {responses.map(r => (
                                            <tr key={r.id} style={{ borderBottom: '1px solid var(--glass-border)', transition: 'background 0.2s' }}
                                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                            >
                                                <td style={{ padding: '14px 20px', fontWeight: 600 }}>{r.studentName}</td>
                                                <td style={{ padding: '14px 20px', color: 'var(--text-muted)', fontSize: '0.88rem' }}>{formatTime(r.submittedAt)}</td>
                                                <td style={{ padding: '14px 20px' }}>
                                                    {r.totalScore !== undefined && r.totalPossibleScore !== undefined ? (
                                                        <span style={{ fontWeight: 700, color: 'var(--neon-green)' }}>
                                                            {r.totalScore} / {r.totalPossibleScore}
                                                        </span>
                                                    ) : '—'}
                                                </td>
                                                <td style={{ padding: '14px 20px' }}>
                                                    {r.violations > 0
                                                        ? <span className="badge badge-red">⚠ {r.violations}</span>
                                                        : <span className="badge badge-green">✓ Clean</span>}
                                                </td>
                                                <td style={{ padding: '14px 20px' }}>
                                                    <button
                                                        className="primary-button btn-sm"
                                                        onClick={() => navigate(`/responses/${formId}/${r.id}`)}
                                                    >
                                                        View →
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Analytics per question */}
                        <h2 style={{ marginBottom: 20 }}>Question Analytics</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            {analytics.map(({ question: q, counts }, idx) => {
                                const total = Object.values(counts).reduce((s, v) => s + v, 0);
                                const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8);
                                if (!entries.length) return (
                                    <div key={q.id} className="content-card" style={{ padding: '18px 22px' }}>
                                        <div className="exam-question-number">Q{idx + 1}</div>
                                        <div style={{ fontWeight: 600, marginBottom: 6 }} dangerouslySetInnerHTML={{ __html: q.label }} />
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Open-ended / No answers yet</p>
                                    </div>
                                );
                                return (
                                    <div key={q.id} className="content-card" style={{ padding: '18px 22px' }}>
                                        <div className="exam-question-number">Q{idx + 1} &nbsp;·&nbsp; {q.points ?? 1} pts</div>
                                        <div style={{ fontWeight: 600, marginBottom: 14 }} dangerouslySetInnerHTML={{ __html: q.label }} />
                                        {entries.map(([ans, count]) => {
                                            const pct = total > 0 ? ((count / total) * 100).toFixed(0) : 0;
                                            return (
                                                <div key={ans} style={{ marginBottom: 9 }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 4 }}>
                                                        <span style={{ color: 'var(--text-secondary)' }}>{ans}</span>
                                                        <span style={{ color: 'var(--text-muted)' }}>{count} ({pct}%)</span>
                                                    </div>
                                                    <div className="progress-bar-wrap">
                                                        <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
