import { createClient } from "@/lib/supabase/server";
import { isSolved, type SubmissionSummary } from "@/lib/progress";

function dateKey(date: Date) { return date.toISOString().slice(0, 10); }
function trapsFrom(evaluation: unknown) {
  if (!evaluation || typeof evaluation !== "object") return [];
  const traps = (evaluation as { trapsTriggered?: unknown }).trapsTriggered;
  return Array.isArray(traps) ? traps.filter((trap): trap is string => typeof trap === "string") : [];
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ authenticated: false, submissions: [], activityDates: [], streak: 0 });
  const { data, error } = await supabase.from("submissions").select("question_id, score, created_at, evaluation").eq("user_id", user.id);
  if (error) return Response.json({ error: "Unable to load saved progress." }, { status: 500 });
  const submissions: SubmissionSummary[] = (data ?? []).map((submission) => ({ questionId: submission.question_id, score: submission.score, createdAt: submission.created_at, trapsTriggered: trapsFrom(submission.evaluation) }));
  const activityDates = [...new Set(submissions.filter(isSolved).map((submission) => dateKey(new Date(submission.createdAt))))];
  const days = new Set(activityDates); let streak = 0; const today = new Date();
  while (days.has(dateKey(new Date(today.getTime() - streak * 86_400_000)))) streak += 1;
  return Response.json({ authenticated: true, submissions, activityDates, streak });
}
