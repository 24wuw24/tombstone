import { createClient } from "@/lib/supabase/server";

function dayKey(date: Date) { return date.toISOString().slice(0, 10); }
function daysBefore(date: Date, amount: number) { const copy = new Date(date); copy.setUTCDate(copy.getUTCDate() - amount); return dayKey(copy); }

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ authenticated: false, solvedQuestionIds: [], activityDates: [], streak: 0 });
  const { data, error } = await supabase.from("submissions").select("question_id, created_at").eq("user_id", user.id);
  if (error) return Response.json({ error: "Unable to load saved progress." }, { status: 500 });
  const activityDates = [...new Set((data ?? []).map((submission) => dayKey(new Date(submission.created_at))))];
  const days = new Set(activityDates); let streak = 0;
  while (days.has(daysBefore(new Date(), streak))) streak += 1;
  return Response.json({ authenticated: true, solvedQuestionIds: [...new Set((data ?? []).map((submission) => submission.question_id))], activityDates, streak });
}
