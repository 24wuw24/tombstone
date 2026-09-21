export type SubmissionSummary = { questionId: string; score: number; trapsTriggered: string[]; createdAt: string };
export type QuestionCompletion = { bestScore: number; attempted: boolean; solved: boolean; perfect: boolean };

export function isSolved(submission: Pick<SubmissionSummary, "score" | "trapsTriggered">) { return submission.score >= 80 && submission.trapsTriggered.length === 0; }
export function isPerfect(submission: Pick<SubmissionSummary, "score" | "trapsTriggered">) { return submission.score === 100 && submission.trapsTriggered.length === 0; }
export function completionFor(questionId: string, submissions: SubmissionSummary[]): QuestionCompletion {
  const attempts = submissions.filter((submission) => submission.questionId === questionId);
  return { attempted: attempts.length > 0, bestScore: attempts.reduce((best, submission) => Math.max(best, submission.score), 0), solved: attempts.some(isSolved), perfect: attempts.some(isPerfect) };
}
