/**
 * ResponseViewer — Admin-only view of a single exam response.
 * Shows per-question score breakdown. NEVER rendered on student-facing pages.
 *
 * @param {Object} response  - The full response document from Firestore
 * @param {Array}  questions - Questions array for the form
 */
export default function ResponseViewer({ response, questions }) {
    if (!response || !questions) return null;

    const { questionScores = {}, totalScore, totalPossibleScore, answers = {} } = response;

    const formatAnswer = (question, value) => {
        if (value === undefined || value === null || value === '') return <em style={{ color: 'var(--text-muted)' }}>No answer</em>;
        if (Array.isArray(value)) return value.join(', ') || <em style={{ color: 'var(--text-muted)' }}>No selection</em>;
        if (typeof value === 'string' && value.startsWith('http')) {
            return <a href={value} target="_blank" rel="noreferrer" style={{ color: 'var(--neon-green)' }}>View uploaded file ↗</a>;
        }
        return String(value);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Score summary */}
            <div className="content-card" style={{ padding: '24px', textAlign: 'center' }}>
                <p className="form-label" style={{ marginBottom: 6 }}>Total Score</p>
                <div style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--neon-green)', lineHeight: 1 }}>
                    {totalScore ?? '—'} <span style={{ fontSize: '1.5rem', color: 'var(--text-muted)', fontWeight: 400 }}>/ {totalPossibleScore ?? '—'}</span>
                </div>
                {totalPossibleScore > 0 && (
                    <div style={{ marginTop: 12 }}>
                        <div className="progress-bar-wrap">
                            <div
                                className="progress-bar-fill"
                                style={{ width: `${((totalScore / totalPossibleScore) * 100).toFixed(1)}%` }}
                            />
                        </div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 6 }}>
                            {((totalScore / totalPossibleScore) * 100).toFixed(1)}%
                        </p>
                    </div>
                )}
            </div>

            {/* Per-question breakdown */}
            {questions.map((q, idx) => {
                const score = questionScores[q.id];
                const answer = answers[q.id];
                const hasScore = score && score.earned !== null;

                return (
                    <div key={q.id} className="question-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                            <div style={{ flex: 1 }}>
                                <div className="exam-question-number">Question {idx + 1}</div>
                                <div
                                    className="exam-question-text"
                                    style={{ marginBottom: 8 }}
                                    dangerouslySetInnerHTML={{ __html: q.label || q.questionText }}
                                />

                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 4 }}>Student's Answer:</div>
                                <div style={{ fontSize: '0.95rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                                    {formatAnswer(q, answer)}
                                </div>

                                {q.correctAnswer && (
                                    <div style={{ marginTop: 8, fontSize: '0.82rem', color: 'var(--success-color)' }}>
                                        ✓ Correct: {Array.isArray(q.correctAnswer) ? q.correctAnswer.join(', ') : q.correctAnswer}
                                    </div>
                                )}
                            </div>

                            {/* Score chip */}
                            {hasScore && (
                                <div style={{
                                    textAlign: 'center',
                                    padding: '12px 18px',
                                    borderRadius: 'var(--radius-md)',
                                    background: score.earned > 0 ? 'rgba(6,214,160,0.12)' : 'rgba(255,77,109,0.12)',
                                    border: `1px solid ${score.earned > 0 ? 'rgba(6,214,160,0.35)' : 'rgba(255,77,109,0.35)'}`,
                                    minWidth: 80,
                                }}>
                                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: score.earned > 0 ? 'var(--success-color)' : 'var(--error-color)' }}>
                                        {score.earned}
                                    </div>
                                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>/ {score.possible} pts</div>
                                </div>
                            )}
                            {score && score.earned === null && (
                                <div style={{ padding: '10px 16px', borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)' }}>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>Unscored</div>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
