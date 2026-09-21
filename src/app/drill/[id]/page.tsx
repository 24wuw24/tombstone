import { notFound } from "next/navigation";
import AppHeader from "@/components/layout/AppHeader";
import { getQuestion } from "@/data/mockQuestions";
import DrillWorkspace from "./drill-workspace";

export default async function DrillPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const question = getQuestion(id);
  if (!question) notFound();
  return <main className="min-h-screen bg-[#121316]"><AppHeader /><div className="px-5 py-6 sm:px-8"><DrillWorkspace question={question} /></div></main>;
}
