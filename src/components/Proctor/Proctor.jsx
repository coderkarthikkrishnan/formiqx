import { useEffect, useRef, useState } from 'react';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../../firebase/config';
import '../../styles/Proctor.css';

const MAX_VIOLATIONS = 2;

/**
 * Proctoring component — detects cheating behaviors and enforces violation limits.
 * Violations persist in Firestore so they survive page refresh.
 *
 * Detects: tab switch, window blur, fullscreen exit, right-click, copy, paste, Ctrl+C/V
 *
 * @param {string}   sessionId        - examSessions Firestore doc ID
 * @param {number}   initialViolations - violations already in Firestore (from resumed session)
 * @param {function} onAutoSubmit     - called when violations reach MAX_VIOLATIONS
 */
export default function Proctor({ sessionId, initialViolations = 0, onAutoSubmit }) {
    const [violations, setViolations] = useState(initialViolations);
    const [showWarning, setShowWarning] = useState(false);
    const [lastReason, setLastReason] = useState('');
    const [autoSubmitCountdown, setAutoSubmitCountdown] = useState(null);
    const countdownRef = useRef(null);
    const submitCalledRef = useRef(false);

    const handleViolation = async (reason) => {
        if (submitCalledRef.current) return;

        setViolations(prev => {
            const next = prev + 1;
            recordViolation(next, reason);
            return next;
        });
    };

    const recordViolation = async (newCount, reason) => {
        setLastReason(reason);
        setShowWarning(true);

        // Update Firestore
        if (sessionId) {
            try {
                await updateDoc(doc(db, 'examSessions', sessionId), {
                    violations: increment(1),
                });
            } catch (e) {
                console.error('Failed to update violation in Firestore', e);
            }
        }

        if (newCount >= MAX_VIOLATIONS) {
            // Start auto-submit countdown (3 seconds)
            let secs = 3;
            setAutoSubmitCountdown(secs);
            clearInterval(countdownRef.current);
            countdownRef.current = setInterval(() => {
                secs -= 1;
                setAutoSubmitCountdown(secs);
                if (secs <= 0) {
                    clearInterval(countdownRef.current);
                    if (!submitCalledRef.current) {
                        submitCalledRef.current = true;
                        onAutoSubmit && onAutoSubmit('violations');
                    }
                }
            }, 1000);
        }
    };

    useEffect(() => {
        const onVisibilityChange = () => {
            if (document.hidden) handleViolation('Tab switching detected');
        };
        const onBlur = () => handleViolation('Window focus lost');
        const onContextMenu = (e) => { e.preventDefault(); handleViolation('Right-click detected'); };
        const onCopy = (e) => { e.preventDefault(); handleViolation('Copy attempt detected'); };
        const onPaste = (e) => { e.preventDefault(); handleViolation('Paste attempt detected'); };
        const onKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && ['c', 'v', 'u', 's'].includes(e.key.toLowerCase())) {
                e.preventDefault();
                handleViolation(`Keyboard shortcut (Ctrl+${e.key.toUpperCase()}) blocked`);
            }
        };
        const onFullscreenChange = () => {
            if (!document.fullscreenElement && !document.webkitFullscreenElement) {
                handleViolation('Fullscreen exited');
            }
        };

        document.addEventListener('visibilitychange', onVisibilityChange);
        window.addEventListener('blur', onBlur);
        document.addEventListener('contextmenu', onContextMenu);
        document.addEventListener('copy', onCopy);
        document.addEventListener('paste', onPaste);
        document.addEventListener('keydown', onKeyDown);
        document.addEventListener('fullscreenchange', onFullscreenChange);
        document.addEventListener('webkitfullscreenchange', onFullscreenChange);

        return () => {
            document.removeEventListener('visibilitychange', onVisibilityChange);
            window.removeEventListener('blur', onBlur);
            document.removeEventListener('contextmenu', onContextMenu);
            document.removeEventListener('copy', onCopy);
            document.removeEventListener('paste', onPaste);
            document.removeEventListener('keydown', onKeyDown);
            document.removeEventListener('fullscreenchange', onFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', onFullscreenChange);
            clearInterval(countdownRef.current);
        };
    }, [sessionId]);

    const isFinal = violations >= MAX_VIOLATIONS;

    if (!showWarning) return null;

    return (
        <div className="proctor-overlay">
            <div className={`proctor-warning-card ${isFinal ? 'final-warning' : ''}`}>
                <span className="proctor-warning-icon">{isFinal ? '🚫' : '⚠️'}</span>
                <h2>{isFinal ? 'Exam Terminated' : 'Violation Warning'}</h2>
                <div className={`proctor-violation-count ${isFinal ? 'danger' : ''}`}>
                    Violations: {violations} / {MAX_VIOLATIONS}
                </div>
                <p>
                    {isFinal
                        ? 'You have exceeded the maximum number of violations. Your exam will be auto-submitted immediately.'
                        : `${lastReason}. This is violation ${violations} of ${MAX_VIOLATIONS}. One more violation will auto-submit your exam.`}
                </p>
                {isFinal && autoSubmitCountdown !== null && (
                    <p className="proctor-submit-countdown">
                        Auto-submitting in <span>{autoSubmitCountdown}</span>s...
                    </p>
                )}
                {!isFinal && (
                    <button
                        className="primary-button btn-sm"
                        onClick={() => setShowWarning(false)}
                    >
                        I Understand — Back to Exam
                    </button>
                )}
            </div>
        </div>
    );
}
