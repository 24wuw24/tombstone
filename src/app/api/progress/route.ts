import { createClient } from "@/lib/supabase/server";
import { dayKeyInTimeZone, streakFromActivityDates } from "@/lib/progress-time";

type SubmissionSummary = { questionId: string; score: number; createdAt: string; trapsTriggered: string[] };
const isSolved = (submission: SubmissionSummary) => submission.score >= 80 && submission.trapsTriggered.length === 0;
function trapsFrom(evaluation: unknown) { if (!evaluation || typeof evaluation !== "object") return []; const traps = (evaluation as { trapsTriggered?: unknown }).trapsTriggered; return Array.isArray(traps) ? traps.filter((trap): trap is string => typeof trap === "string") : []; }
function requestedTimeZone(request: Request) { const value = new URL(request.url).searchParams.get("timeZone") ?? "UTC"; try { Intl.DateTimeFormat(undefined, { timeZone: value }).format(); return value; } catch { return "UTC"; } }

export async function GET(request: Request) {
  const timeZone = requestedTimeZone(request);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ authenticated: false, solvedQuestionIds: [], activityDates: [], streak: 0, submissions: [] });
  const { data, error } = await supabase.from("submissions").select("question_id, score, created_at, evaluation").eq("user_id", user.id);
  if (error) return Response.json({ error: "Unable to load saved progress." }, { status: 500 });
  const submissions: SubmissionSummary[] = (data ?? []).map((submission) => ({ questionId: submission.question_id, score: submission.score, createdAt: submission.created_at, trapsTriggered: trapsFrom(submission.evaluation) }));
  const solvedQuestionIds = [...new Set(submissions.filter(isSolved).map((submission) => submission.questionId))];
  const activityDates = [...new Set(submissions.filter(isSolved).map((submission) => dayKeyInTimeZone(new Date(submission.createdAt), timeZone)))];
  const streak = streakFromActivityDates(activityDates, timeZone);
  return Response.json({ authenticated: true, solvedQuestionIds, activityDates, streak, submissions });
}
