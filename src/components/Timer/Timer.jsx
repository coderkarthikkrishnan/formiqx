import { useState, useEffect, useRef } from 'react';
import '../../styles/Timer.css';

/**
 * Individual Student Timer — calculates remaining time from stored startTime.
 * Never resets on refresh. Always based on: endTime = startTime + duration.
 *
 * @param {number} startTime - Unix ms timestamp when student started exam
 * @param {number} duration  - Exam duration in minutes
 * @param {function} onExpire - Called when time runs out (triggers auto-submit)
 */
export default function Timer({ startTime, duration, onExpire }) {
    const endTime = startTime + duration * 60 * 1000;
    const CIRCUMFERENCE = 2 * Math.PI * 44; // radius=44 for the SVG circle

    const calcRemaining = () => Math.max(0, endTime - Date.now());

    const [remaining, setRemaining] = useState(calcRemaining);
    const expiredCalled = useRef(false);
    const intervalRef = useRef(null);

    useEffect(() => {
        intervalRef.current = setInterval(() => {
            const r = calcRemaining();
            setRemaining(r);
            if (r <= 0 && !expiredCalled.current) {
                expiredCalled.current = true;
                clearInterval(intervalRef.current);
                onExpire && onExpire();
            }
        }, 1000);

        return () => clearInterval(intervalRef.current);
    }, [startTime, duration]);

    const totalMs = duration * 60 * 1000;
    const pct = remaining / totalMs; // 1 → 0
    const dashOffset = CIRCUMFERENCE * (1 - pct);

    const hours = Math.floor(remaining / 3_600_000);
    const mins = Math.floor((remaining % 3_600_000) / 60_000);
    const secs = Math.floor((remaining % 60_000) / 1000);

    const display =
        hours > 0
            ? `${hours}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
            : `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    const state = pct < 0.1 ? 'danger' : pct < 0.25 ? 'warning' : 'ok';

    return (
        <div className="timer-panel">
            <span className="timer-panel-title">⏱ Time Remaining</span>
            <div className="timer-container">
                <div className="timer-ring-wrapper">
                    <svg className="timer-ring" viewBox="0 0 100 100">
                        <circle className="timer-ring-bg" cx="50" cy="50" r="44" />
                        <circle
                            className={`timer-ring-progress ${state}`}
                            cx="50" cy="50" r="44"
                            strokeDasharray={CIRCUMFERENCE}
                            strokeDashoffset={dashOffset}
                        />
                    </svg>
                    <div className="timer-center">
                        <span className={`timer-digits ${state}`}>{display}</span>
                        <span className="timer-label">left</span>
                    </div>
                </div>
            </div>
            {state === 'danger' && (
                <p className="timer-status-text" style={{ color: 'var(--error-color)', fontSize: '0.78rem' }}>
                    ⚠ Submit soon!
                </p>
            )}
        </div>
    );
}
