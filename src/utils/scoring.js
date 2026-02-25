/**
 * Calculate quiz scores for a student submission.
 * Scoring is stored in Firestore but NEVER shown to students.
 * Students only see "Your response has been recorded."
 *
 * @param {Array} questions - Array of question objects with { id, points, correctAnswer, type }
 * @param {Object} answers - Map of questionId → student answer value
 * @returns {{ questionScores, totalScore, totalPossibleScore }}
 */
export function calculateScore(questions, answers) {
    const questionScores = {};
    let totalScore = 0;
    let totalPossibleScore = 0;

    for (const q of questions) {
        const possible = q.points ?? 1;
        totalPossibleScore += possible;

        if (!q.correctAnswer) {
            // No correct answer defined (e.g. paragraph, date, file) — unscored
            questionScores[q.id] = { earned: null, possible };
            continue;
        }

        const studentAnswer = answers[q.id];
        let earned = 0;

        if (q.type === 'checkboxes') {
            // correctAnswer is an array, student answer is an array
            const correct = Array.isArray(q.correctAnswer) ? q.correctAnswer.map(s => s.trim().toLowerCase()) : [];
            const student = Array.isArray(studentAnswer) ? studentAnswer.map(s => s.trim().toLowerCase()) : [];
            const isCorrect =
                correct.length === student.length &&
                correct.every(c => student.includes(c));
            earned = isCorrect ? possible : 0;
        } else {
            // single-answer types: multiple_choice, dropdown, short_answer, linear_scale
            const correct = String(q.correctAnswer ?? '').trim().toLowerCase();
            const student = String(studentAnswer ?? '').trim().toLowerCase();
            earned = correct && correct === student ? possible : 0;
        }

        totalScore += earned;
        questionScores[q.id] = { earned, possible };
    }

    return { questionScores, totalScore, totalPossibleScore };
}
