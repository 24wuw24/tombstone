import { getQuestion } from "@/data/mockQuestions";

const keywords: Record<string, string[]> = {
  "acc-001": ["tax", "net income", "add back", "cash", "retained earnings", "pp&e", "balance sheet"],
  "acc-002": ["deferred revenue", "liability", "cash", "recognition", "revenue"],
  "val-001": ["common shareholder", "operations", "debt", "cash", "enterprise value", "equity value"],
  "val-002": ["capital structure", "leverage", "interest", "tax", "equity"],
  "val-003": ["terminal value", "wacc", "growth", "multiple", "discount"],
  "lbo-001": ["40", "60", "1.5", "moic", "irr", "debt paydown"],
  "lbo-002": ["sources", "uses", "sponsor equity", "debt", "fees"],
  "lbo-003": ["ebitda", "debt paydown", "multiple", "margin", "growth"],
  "ma-001": ["earnings", "financing", "shares", "synergies", "eps"],
  "ma-002": ["stock", "p / e", "shares", "earnings", "accretion"],
};

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body?.questionId || typeof body.userAnswer !== "string") return Response.json({ error: "questionId and userAnswer are required." }, { status: 400 });
  const question = getQuestion(body.questionId);
  if (!question) return Response.json({ error: "Question not found." }, { status: 404 });
  const answer = body.userAnswer.toLowerCase();
  const hits = (keywords[question.id] ?? []).filter((term) => answer.includes(term));
  const score = Math.min(95, Math.max(35, 45 + hits.length * 8 + (body.userAnswer.trim().split(/\s+/).length > 60 ? 6 : 0)));
  const milestones = question.rubric.requiredMilestones.map((milestone, index) => ({ milestone, status: index < hits.length ? "passed" : index === hits.length ? "partial" : "missed" }));
  return Response.json({ score, summary: hits.length >= 3 ? "Strong logical framework. Tighten the numerical walk-through for an interview-ready answer." : "You have the start of an answer. Make each financial statement or bridge step explicit.", milestones, commonTraps: question.rubric.commonTraps, matchedTerms: hits });
}
