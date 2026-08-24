import { ArrowRight, Check, ChevronDown, ExternalLink, Minus, Sparkles } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";

export type DecisionRoomMatch = {
  programmeId: string;
  programmeName: string;
  officialName: string;
  city: string;
  programmeLanguage: string | null;
  fitSignals: string[];
  verificationGaps: string[];
  sourceUrl: string;
};

const copy = {
  en: {
    kicker: "YOUR FIRST THREE / SOURCE-LINKED",
    title: "Start with three. Not a hundred.",
    body: "These are a contained research starting point based on the direction you chose. Keep what feels worth carrying forward; you can explore more later if you want to.",
    why: "WHY THIS APPEARED",
    keep: "Keep this option",
    kept: "Kept in my journey",
    no: "Not for me",
    source: "Open official source",
    explore: "Explore another option",
    adjust: "Adjust my direction",
    none: "There is not a useful three-option set to show yet.",
    noneBody: "Return to your direction when you are ready. Nightfall will not pretend a broad list is a recommendation.",
    evidence: "Research signals. Verify language, fees, qualifications, visa, and funding from the official source.",
  },
  ar: {
    kicker: "أول ٣ خيارات / مربوطة بالمصادر",
    title: "بلّش بثلاثة، مو بمية.",
    body: "هاي نقطة بداية بحث مركّزة حسب الاتجاه اللي اخترته. احتفظ باللي بتحسّه بستاهل يكمل معك؛ فيك تستكشف أكتر بعدين إذا حبيت.",
    why: "ليش ظهر هالخيار",
    keep: "احتفظ بهالخيار",
    kept: "انحفظ برحلتي",
    no: "مو إلي",
    source: "افتح المصدر الرسمي",
    explore: "استكشف خيار تاني",
    adjust: "عدّل اتجاهي",
    none: "ما في مجموعة ثلاث خيارات مفيدة نعرضها لسه.",
    noneBody: "ارجع لاتجاهك وقت تكون جاهز. نايتفول ما رح تتظاهر إن قائمة واسعة هي توصية.",
    evidence: "إشارات بحث. تأكد من اللغة، الرسوم، المؤهلات، الفيزا، والتمويل من المصدر الرسمي.",
  },
} as const;

// Phase 3 — a role label is only shown when the evidence actually justifies
// it. Earlier this always fell through to "Strong direction alignment" even
// when the top fit signal had nothing to do with direction strength (e.g. a
// match that only scored on budget/funding-route retention). Returning null
// here means the caller omits the role entirely, rather than showing an
// unjustified claim.
function roleFor(match: DecisionRoomMatch, isArabic: boolean): string | null {
  const primary = match.fitSignals[0] || "";
  const languageGap = match.verificationGaps.find((gap) => /language|لغة/i.test(gap));
  if (languageGap) return isArabic ? "لغة البرنامج بدها تخطيط" : "Language preparation to plan for";
  if (/tuition|fee|cost|رسوم/i.test(primary)) return isArabic ? "سياق تكلفة معروف" : "Known cost context";
  if (/subject evidence|study direction|اتجاهك|تقارب/i.test(primary)) return isArabic ? "تقارب مع اتجاهك الدراسي" : "Strong direction alignment";
  return null;
}

export function DecisionRoom({ language, matches, savedProgrammeIds, isSavingProgrammeId, onKeep, onExplore, onAdjustDirection }: { language: "en" | "ar"; matches: DecisionRoomMatch[]; savedProgrammeIds: Set<string>; isSavingProgrammeId?: string; onKeep: (programmeId: string) => void; onExplore: () => void; onAdjustDirection: () => void }) {
  const t = copy[language];
  const isArabic = language === "ar";
  const [dismissed, setDismissed] = useState<string[]>(() => {
    try { return JSON.parse(sessionStorage.getItem("nightfall-dismissed-first-options") || "[]") as string[]; } catch { return []; }
  });
  const [expanded, setExpanded] = useState<string | null>(null);
  const visible = useMemo(() => matches.filter((match) => !dismissed.includes(match.programmeId)).slice(0, 3), [dismissed, matches]);
  const dismiss = (programmeId: string) => {
    setDismissed((current) => {
      const next = [...new Set([...current, programmeId])];
      try { sessionStorage.setItem("nightfall-dismissed-first-options", JSON.stringify(next)); } catch { /* local preference is optional */ }
      return next;
    });
  };

  useEffect(() => {
    const allowed = new Set(matches.map((match) => match.programmeId));
    setDismissed((current) => current.filter((programmeId) => allowed.has(programmeId)));
  }, [matches]);

  return <section aria-labelledby="decision-room-heading" className="pb-12"><div className="max-w-3xl"><p className="nf-label text-[9px] text-[#99a49d]">// {t.kicker}</p><h1 id="decision-room-heading" className="mt-4 text-4xl font-semibold leading-[.88] tracking-[-.07em] sm:text-6xl">{t.title}</h1><p className="mt-5 max-w-2xl text-base leading-7 text-[#aeb8b1] sm:text-lg">{t.body}</p></div>
    {visible.length ? <div className="mt-9 grid gap-4 lg:grid-cols-3">{visible.map((match, index) => { const saved = savedProgrammeIds.has(match.programmeId); const open = expanded === match.programmeId; const role = roleFor(match, isArabic); return <article key={match.programmeId} className="flex flex-col border border-white/15 bg-[#111516] p-5"><div className="flex items-start justify-between gap-4"><p className="nf-label text-[9px] text-[#929d96]">0{index + 1}{role ? ` / ${role}` : ""}</p><Sparkles className="h-4 w-4 shrink-0 text-[#dce3de]" /></div><h2 className="mt-5 text-2xl font-semibold leading-[.98] tracking-[-.05em]">{match.programmeName}</h2><p className="mt-3 text-sm leading-6 text-[#a6b0a9]">{match.officialName} · {match.city}</p>{match.programmeLanguage && <p className="mt-5 border-y border-white/10 py-3 text-[11px] text-[#cbd4ce]">{isArabic ? "لغة البرنامج" : "Programme language"} / {match.programmeLanguage}</p>}<div className="mt-5"><button type="button" onClick={() => setExpanded(open ? null : match.programmeId)} aria-expanded={open} className="nf-button inline-flex items-center gap-2 text-[10px] font-semibold text-[#dce3de] underline underline-offset-4">{t.why}<ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} /></button>{open && <div className="mt-3 border-l border-white/20 pl-3 text-xs leading-5 text-[#aeb8b1]"><p>{match.fitSignals[0] || (isArabic ? "مرتبط باتجاه البحث اللي اخترته." : "Connected to the research direction you chose.")}</p>{match.verificationGaps[0] && <p className="mt-2 text-[#8f9a93]">{match.verificationGaps[0]}</p>}</div>}</div><div className="mt-auto pt-7"><button type="button" disabled={saved || isSavingProgrammeId === match.programmeId} onClick={() => onKeep(match.programmeId)} className="nf-button flex w-full items-center justify-center gap-2 border border-white bg-white px-3 py-3 text-[10px] font-bold uppercase tracking-[.07em] text-black disabled:opacity-60">{saved ? <><Check className="h-3.5 w-3.5" />{t.kept}</> : t.keep}</button><div className="mt-3 flex items-center justify-between gap-3"><button type="button" onClick={() => dismiss(match.programmeId)} className="nf-button inline-flex items-center gap-1.5 text-[10px] text-[#8e9992] hover:text-white"><Minus className="h-3 w-3" />{t.no}</button><a href={match.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-[#dce3de] underline underline-offset-4">{t.source}<ExternalLink className="h-3 w-3" /></a></div></div></article>; })}</div> : <div className="mt-9 max-w-xl border border-dashed border-white/20 bg-white/[.018] p-6"><h2 className="text-xl font-semibold">{t.none}</h2><p className="mt-3 text-sm leading-6 text-[#a3ada6]">{t.noneBody}</p></div>}
    <p className="mt-7 max-w-3xl text-[11px] leading-5 text-[#8e9992]">{t.evidence}</p><div className="mt-7 flex flex-wrap gap-x-5 gap-y-3"><button type="button" onClick={onExplore} className="nf-button inline-flex items-center gap-2 text-xs font-semibold text-[#dce3de] underline underline-offset-4">{t.explore}<ArrowRight className={`h-3.5 w-3.5 ${isArabic ? "rotate-180" : ""}`} /></button><button type="button" onClick={onAdjustDirection} className="nf-button text-xs text-[#929d96] hover:text-white">{t.adjust}</button></div>
  </section>;
}
