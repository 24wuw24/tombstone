import Link from "next/link";
import { notFound } from "next/navigation";
import { getQuestion } from "@/data/mockQuestions";
import DrillWorkspace from "./drill-workspace";

export default async function DrillPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const question = getQuestion(id);
  if (!question) notFound();
  return <main className="min-h-screen px-5 py-6 sm:px-8"><nav className="mx-auto mb-6 flex max-w-7xl items-center justify-between"><Link href="/" className="font-mono font-bold text-white">TOMBSTONE<span className="text-cyan-400">.</span></Link><Link href="/" className="text-sm text-zinc-400 hover:text-white">← All questions</Link></nav><DrillWorkspace question={question} /></main>;
}
