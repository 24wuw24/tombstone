import { createClient } from "@/lib/supabase/server";

type SubmissionSummary = { questionId: string; score: number; createdAt: string; trapsTriggered: string[] };
const isSolved = (submission: SubmissionSummary) => submission.score >= 80 && submission.trapsTriggered.length === 0;
const dayKey = (date: Date) => date.toISOString().slice(0, 10);
function trapsFrom(evaluation: unknown) { if (!evaluation || typeof evaluation !== "object") return []; const traps = (evaluation as { trapsTriggered?: unknown }).trapsTriggered; return Array.isArray(traps) ? traps.filter((trap): trap is string => typeof trap === "string") : []; }

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ authenticated: false, solvedQuestionIds: [], activityDates: [], streak: 0, submissions: [] });
  const { data, error } = await supabase.from("submissions").select("question_id, score, created_at, evaluation").eq("user_id", user.id);
  if (error) return Response.json({ error: "Unable to load saved progress." }, { status: 500 });
  const submissions: SubmissionSummary[] = (data ?? []).map((submission) => ({ questionId: submission.question_id, score: submission.score, createdAt: submission.created_at, trapsTriggered: trapsFrom(submission.evaluation) }));
  const solvedQuestionIds = [...new Set(submissions.filter(isSolved).map((submission) => submission.questionId))];
  const activityDates = [...new Set(submissions.filter(isSolved).map((submission) => dayKey(new Date(submission.createdAt))))];
  const activeDays = new Set(activityDates); let streak = 0; const today = new Date();
  while (activeDays.has(dayKey(new Date(today.getTime() - streak * 86_400_000)))) streak += 1;
  return Response.json({ authenticated: true, solvedQuestionIds, activityDates, streak, submissions });
}
