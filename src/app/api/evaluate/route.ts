import { GoogleGenAI, Type } from "@google/genai";
import { getQuestion } from "@/data/mockQuestions";
import { createClient as createSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type MilestoneStatus = "passed" | "partial" | "missed";
type Evaluation = {
  score: number;
  milestones: { milestone: string; status: MilestoneStatus; userQuote: string | null; feedback: string }[];
  trapsTriggered: string[];
  summaryFeedback: string;
  deliveryRating: "concise" | "balanced" | "rambling" | "too_brief";
};

const evaluationSchema = {
  type: Type.OBJECT,
  properties: {
    score: { type: Type.INTEGER, minimum: 0, maximum: 100 },
    milestones: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          milestone: { type: Type.STRING },
          status: { type: Type.STRING, format: "enum", enum: ["passed", "partial", "missed"] },
          userQuote: { type: Type.STRING, nullable: true },
          feedback: { type: Type.STRING },
        },
        required: ["milestone", "status", "userQuote", "feedback"],
      },
    },
    trapsTriggered: { type: Type.ARRAY, items: { type: Type.STRING } },
    summaryFeedback: { type: Type.STRING },
    deliveryRating: { type: Type.STRING, format: "enum", enum: ["concise", "balanced", "rambling", "too_brief"] },
  },
  required: ["score", "milestones", "trapsTriggered", "summaryFeedback", "deliveryRating"],
};

const systemInstruction = `You are a rigorous senior investment banking interviewer evaluating a verbal technical answer.
Grade only the candidate's answer against the supplied prompt, model answer, required milestones, and common traps. Be exacting but fair.
If the answer is gibberish, filler (such as "this is a test" or "asdf"), or completely off-topic, score it 0; mark every milestone missed; set summaryFeedback exactly to "Response did not attempt the question."; use deliveryRating "too_brief"; and return no traps.
For a genuine attempt, assess every supplied required milestone as passed, partial, or missed. Preserve each supplied milestone verbatim. For passed or partial milestones, userQuote MUST be a short exact quote copied from the candidate answer; for missed milestones it MUST be null. Flag only common traps the candidate actually committed, using the exact supplied trap text. Score 0-100 based on milestone completion with material trap penalties. summaryFeedback must be 2-3 sentences in the voice of a senior investment banking interviewer, assessing clarity and technical precision. Return JSON only.`;

function isStatus(value: unknown): value is MilestoneStatus { return value === "passed" || value === "partial" || value === "missed"; }
function isDeliveryRating(value: unknown): value is Evaluation["deliveryRating"] { return value === "concise" || value === "balanced" || value === "rambling" || value === "too_brief"; }

function normalizeEvaluation(value: unknown, milestones: string[], commonTraps: string[]): Evaluation {
  if (!value || typeof value !== "object") throw new Error("Gemini returned an invalid evaluation.");
  const response = value as Partial<Evaluation>;
  if (!Array.isArray(response.milestones) || typeof response.score !== "number" || typeof response.summaryFeedback !== "string" || !isDeliveryRating(response.deliveryRating)) throw new Error("Gemini returned an incomplete evaluation.");
  const normalizedMilestones = milestones.map((milestone, index) => {
    const item = response.milestones?.[index];
    const status = isStatus(item?.status) ? item.status : "missed";
    return { milestone, status, userQuote: status === "missed" || typeof item?.userQuote !== "string" ? null : item.userQuote, feedback: typeof item?.feedback === "string" ? item.feedback : "No feedback provided." };
  });
  return {
    score: Math.round(Math.max(0, Math.min(100, response.score))),
    milestones: normalizedMilestones,
    trapsTriggered: Array.isArray(response.trapsTriggered) ? response.trapsTriggered.filter((trap): trap is string => typeof trap === "string" && commonTraps.includes(trap)) : [],
    summaryFeedback: response.summaryFeedback,
    deliveryRating: response.deliveryRating,
  };
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body?.questionId || typeof body.userAnswer !== "string") return Response.json({ error: "questionId and userAnswer are required." }, { status: 400 });
  const question = getQuestion(body.questionId);
  if (!question) return Response.json({ error: "Question not found." }, { status: 404 });
  if (!process.env.GEMINI_API_KEY) return Response.json({ error: "GEMINI_API_KEY is not configured on the server." }, { status: 500 });

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const prompt = JSON.stringify({ questionPrompt: question.prompt, idealResponse: question.idealResponse, requiredMilestones: question.rubric.requiredMilestones, commonTraps: question.rubric.commonTraps, candidateAnswer: body.userAnswer });
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: evaluationSchema,
        temperature: 0.2,
      },
    });
    if (!response.text) throw new Error("Gemini returned an empty evaluation.");
    const evaluation = normalizeEvaluation(JSON.parse(response.text), question.rubric.requiredMilestones, question.rubric.commonTraps);
    const supabase = await createSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { error: submissionError } = await supabase.from("submissions").insert({ user_id: user.id, question_id: question.id, score: evaluation.score, evaluation });
      if (submissionError) console.error("Failed to persist submission", submissionError);
    }
    return Response.json(evaluation);
  } catch (err: unknown) {
    console.error("Gemini Failure:", err);
    return Response.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
