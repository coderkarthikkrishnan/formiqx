import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    doc, getDoc, collection, getDocs, addDoc, updateDoc, orderBy, query, serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { calculateScore } from '../utils/scoring';
import Timer from '../components/Timer/Timer';
import Proctor from '../components/Proctor/Proctor';
import QuestionRenderer from '../components/QuestionRenderer/QuestionRenderer';

const SESSION_KEY = (formId, name) => `fqx_session_${formId}_${name}`;

export default function ExamPage() {
    const { formId } = useParams();
    const navigate = useNavigate();

    const [form, setForm] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);

    // Student state
    const [studentName, setStudentName] = useState('');
    const [nameInput, setNameInput] = useState('');
    const [nameError, setNameError] = useState('');

    // Session state
    const [sessionId, setSessionId] = useState(null);
    const [startTime, setStartTime] = useState(null);
    const [initialViolations, setInitialViolations] = useState(0);
    const [examStarted, setExamStarted] = useState(false);

    // Exam state
    const [answers, setAnswers] = useState({});
    const [currentIndex, setCurrentIndex] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

    const submitCalledRef = useRef(false);

    // Load form + questions
    useEffect(() => {
        const load = async () => {
            const formSnap = await getDoc(doc(db, 'forms', formId));
            if (!formSnap.exists()) { setLoading(false); return; }
            const formData = { id: formSnap.id, ...formSnap.data() };
            setForm(formData);

            const qSnap = await getDocs(query(collection(db, 'forms', formId, 'questions'), orderBy('order')));
            let qs = qSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            if (formData.shuffleQuestions) qs = [...qs].sort(() => Math.random() - 0.5);
            setQuestions(qs);
            setLoading(false);
        };
        load();
    }, [formId]);

    const startExam = async () => {
        if (!nameInput.trim()) { setNameError('Please enter your name.'); return; }
        setNameError('');
        const name = nameInput.trim();
        setStudentName(name);

        // Attempt fullscreen first (requires user gesture)
        if (form.examMode) {
            try {
                const elem = document.documentElement;
                if (elem.requestFullscreen) {
                    elem.requestFullscreen().catch(err => console.error('requestFullscreen error:', err));
                } else if (elem.webkitRequestFullscreen) {
                    elem.webkitRequestFullscreen().catch(err => console.error('webkitRequestFullscreen error:', err));
                }
            } catch (err) {
                console.error('Fullscreen request failed', err);
            }
        }

        try {
            // Check if session exists in localStorage for resumption
            const key = SESSION_KEY(formId, name);
            const saved = localStorage.getItem(key);
            if (saved) {
                try {
                    const { sessionId: sid, startTime: st, violations } = JSON.parse(saved);
                    setSessionId(sid);
                    setStartTime(st);
                    setInitialViolations(violations || 0);
                    setExamStarted(true);
                    return; // Early exit, successfully resumed
                } catch { }
            }

            const now = Date.now();
            const endTime = now + (form.duration || 30) * 60 * 1000;

            const session = {
                formId,
                studentName: name,
                startTime: now,
                endTime,
                violations: 0,
                submittedAt: null,
            };

            const ref = await addDoc(collection(db, 'examSessions'), session);
            const sid = ref.id;

            setSessionId(sid);
            setStartTime(now);
            setExamStarted(true);

            localStorage.setItem(key, JSON.stringify({ sessionId: sid, startTime: now, violations: 0 }));
        } catch (err) {
            console.error('Error starting exam:', err);
            setNameError('System error: ' + (err.message || 'Could not start exam.'));
        }
    };

    const submitExam = useCallback(async (reason = 'manual') => {
        if (submitCalledRef.current || submitted) return;
        submitCalledRef.current = true;
        setSubmitting(true);

        try {
            const { questionScores, totalScore, totalPossibleScore } = calculateScore(questions, answers);

            await addDoc(collection(db, 'responses'), {
                formId,
                studentName,
                answers,
                questionScores,
                totalScore,
                totalPossibleScore,
                violations: initialViolations,
                submitReason: reason,
                submittedAt: serverTimestamp(),
                examSessionId: sessionId,
            });

            if (sessionId) {
                await updateDoc(doc(db, 'examSessions', sessionId), {
                    submittedAt: serverTimestamp(),
                });
            }

            localStorage.removeItem(SESSION_KEY(formId, studentName));
            setSubmitted(true);
            navigate('/success', { state: { studentName, formTitle: form?.title } });
        } catch (e) {
            console.error('Submit error', e);
            submitCalledRef.current = false;
            setSubmitting(false);
        }
    }, [formId, studentName, answers, questions, sessionId, initialViolations, submitted]);

    const handleAnswer = (qId, val) => setAnswers(prev => ({ ...prev, [qId]: val }));

    if (loading) return (
        <div className="loader-dots">
            <div className="dot"></div>
            <div className="dot"></div>
            <div className="dot"></div>
        </div>
    );
    if (!form) return <div style={{ padding: 40, textAlign: 'center' }}><p>Exam not found.</p></div>;

    // ——— Student Name Gate ———
    if (!examStarted) {
        return (
            <div className="exam-gate">
                <div className="content-card floating-card">
                    <span className="gate-icon">🎓</span>
                    <h1>{form.title}</h1>
                    {form.description && <p style={{ marginBottom: 16 }}>{form.description}</p>}

                    <div className="exam-rules">
                        <h4>Exam Rules</h4>
                        <ul>
                            {form.examMode && <li>Duration: {form.duration} minutes (individual timer)</li>}
                            <li>Maximum 2 violations allowed before auto-submit</li>
                            <li>Do not switch tabs or exit fullscreen</li>
                            <li>Do not copy, paste, or right-click</li>
                            <li>Timer continues after refresh</li>
                        </ul>
                    </div>

                    <div className="form-group" style={{ textAlign: 'left' }}>
                        <label className="form-label">Your Name</label>
                        <input
                            className="input-field"
                            type="text"
                            placeholder="Enter your full name"
                            value={nameInput}
                            onChange={e => setNameInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && startExam()}
                            autoFocus
                        />
                        {nameError && <p className="text-error" style={{ fontSize: '0.83rem', marginTop: 6 }}>{nameError}</p>}
                    </div>

                    <button className="primary-button btn-lg w-full" style={{ marginTop: 8 }} onClick={startExam}>
                        Start Exam →
                    </button>
                </div>
            </div>
        );
    }

    // ——— Exam View ———
    const current = questions[currentIndex];
    const answered = Object.keys(answers).filter(k => {
        const v = answers[k];
        return v !== undefined && v !== '' && !(Array.isArray(v) && v.length === 0);
    });

    return (
        <div className="no-select" style={{ minHeight: '100vh' }}>
            {/* Custom Submit Confirmation Modal */}
            {showSubmitConfirm && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="content-card floating-card" style={{ maxWidth: 400, width: '90%', textAlign: 'center' }}>
                        <h2 style={{ marginTop: 0 }}>Submit Exam?</h2>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>This action cannot be undone. Are you sure you are ready to submit your answers?</p>
                        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                            <button className="secondary-button" onClick={() => setShowSubmitConfirm(false)} disabled={submitting}>Cancel</button>
                            <button className={`primary-button ${submitting ? 'btn-loading' : ''}`} onClick={() => submitExam('manual')} disabled={submitting}>
                                {submitting ? 'Submitting...' : 'Yes, Submit'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Proctoring */}
            {form.examMode && !showSubmitConfirm && (
                <Proctor
                    sessionId={sessionId}
                    initialViolations={initialViolations}
                    onAutoSubmit={(reason) => submitExam(reason)}
                />
            )}

            {/* Exam header */}
            <div style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(11, 28, 180, 0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--glass-border)', padding: '12px 24px' }}>
                <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '1rem' }}>{form.title}</h3>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>👤 {studentName}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{answered.length}/{questions.length} answered</span>
                    </div>
                </div>
            </div>

            <div className="exam-layout">
                {/* Main questions */}
                <div className="exam-main">
                    {current && (
                        <QuestionRenderer
                            key={current.id}
                            question={{ ...current, order: currentIndex }}
                            value={answers[current.id]}
                            onChange={handleAnswer}
                            formId={formId}
                        />
                    )}

                    {/* Navigation */}
                    <div className="exam-nav">
                        <button
                            className="primary-button"
                            disabled={currentIndex === 0}
                            onClick={() => setCurrentIndex(i => i - 1)}
                        >
                            ← Previous
                        </button>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            {currentIndex + 1} of {questions.length}
                        </span>
                        {currentIndex < questions.length - 1 ? (
                            <button className="primary-button" onClick={() => setCurrentIndex(i => i + 1)}>
                                Next →
                            </button>
                        ) : (
                            <button
                                className={`primary-button ${submitting ? 'btn-loading' : ''}`}
                                onClick={() => setShowSubmitConfirm(true)}
                                disabled={submitting}
                            >
                                {submitting ? '' : 'Submit Exam ✓'}
                            </button>
                        )}
                    </div>
                </div>

                {/* Sidebar */}
                <div className="exam-sidebar">
                    {/* Timer */}
                    {form.examMode && startTime && (
                        <Timer
                            startTime={startTime}
                            duration={form.duration || 30}
                            onExpire={() => submitExam('timer_expired')}
                        />
                    )}

                    {/* Progress */}
                    <div className="section-progress">
                        <div className="section-progress-label">Progress</div>
                        <div className="progress-bar-wrap">
                            <div className="progress-bar-fill" style={{ width: `${(answered.length / questions.length) * 100}%` }} />
                        </div>
                        <div className="progress-text">{answered.length} / {questions.length}</div>
                    </div>

                    {/* Question navigator */}
                    <div className="content-card" style={{ padding: 12 }}>
                        <div className="form-label" style={{ marginBottom: 8 }}>Questions</div>
                        <div className="question-nav-grid">
                            {questions.map((q, i) => {
                                const isAnswered = answers[q.id] !== undefined && answers[q.id] !== '' && !(Array.isArray(answers[q.id]) && answers[q.id].length === 0);
                                return (
                                    <button
                                        key={q.id}
                                        className={`q-nav-dot ${i === currentIndex ? 'current' : isAnswered ? 'answered' : ''}`}
                                        onClick={() => setCurrentIndex(i)}
                                        title={`Q${i + 1}`}
                                    >
                                        {i + 1}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Submit from sidebar (when not on last q) */}
                    {answered.length === questions.length && (
                        <button
                            className={`primary-button w-full ${submitting ? 'btn-loading' : ''}`}
                            onClick={() => setShowSubmitConfirm(true)}
                            disabled={submitting}
                        >
                            {submitting ? '' : '✓ Submit Now'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
