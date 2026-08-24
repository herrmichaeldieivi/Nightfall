import { ArrowRight, Loader2, LockKeyhole, Send, Star } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { FormEvent, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { LanguageToggle, usePublicLanguage } from "@/components/LanguageToggle";
import { consultantInputQuality, consultantSummaryGroups, emptyWarmInterviewDraft, fitProfileFromInterview, type WarmInterviewDraft } from "@/lib/consultantOnboarding";
import { shouldRedirectCompletedProfile } from "@/lib/consultantResume";
import { clearPendingConsultantInterview, readPendingConsultantInterview, storePendingConsultantInterview } from "@/lib/pendingConsultantInterview";

const ease = [0.23, 1, 0.32, 1] as const;
type Turn = "name" | "direction" | "level" | "budget" | "funding" | "sponsor" | "nationality" | "diploma" | "average" | "scale" | "language" | "priorities" | "phone" | "consent" | "email" | "ready";
const turns: Turn[] = ["name", "direction", "level", "budget", "funding", "sponsor", "nationality", "diploma", "average", "scale", "language", "priorities", "phone", "consent", "email", "ready"];

// Phase 2 — the assessment reads as three comprehensible chapters, not one long
// undifferentiated form. Contact details (phone, email) are deliberately the
// last chapter: a secure handoff after the student has already experienced
// the assessment's value, not a cold ask up front.
type Chapter = "direction" | "reality" | "practical" | "handoff";
const chapterForTurn: Record<Turn, Chapter> = {
  name: "direction", direction: "direction", level: "direction",
  nationality: "reality", diploma: "reality", average: "reality", scale: "reality", language: "reality",
  budget: "practical", funding: "practical", sponsor: "practical", priorities: "practical",
  phone: "handoff", consent: "handoff", email: "handoff", ready: "handoff",
};
const chapterOrder: Chapter[] = ["direction", "reality", "practical", "handoff"];

const copy = {
  en: {
    label: "FREE CONSULTING SESSION", intro: "A proper first assessment, one useful question at a time.", note: "We ask only what can change your research path. Your answers stay on this device until you choose to unlock them.",
    chapterDirection: "Direction", chapterReality: "Reality", chapterPractical: "Practical path", chapterHandoff: "Secure handoff",
    name: "First, what should I call you?", direction: "What would you genuinely like to study?", level: "Which level are you planning for?", budget: "How does tuition feel for your family right now?", funding: "How do you expect to fund this path?", sponsor: "Would a sponsor be part of your funding plan?", nationality: "What is your nationality?", diploma: "Where did you receive—or expect to receive—your high-school diploma?", average: "What is your average or most recent result?", scale: "And what scale is that on?", language: "Which languages could you realistically study in?", priorities: "When you look at a university, what matters most to you?", phone: "What is the best phone number for your private Nightfall space?", consent: "May I use this context to prepare reviewable research signals? Never an eligibility, admission, visa, or funding decision.", email: "Last thing: what email should we verify before this assessment becomes a saved research set?", ready: "I have enough to prepare your first focused research set.",
    typed: "Type your reply…", continue: "Send", nameHint: "For example, Rania", directionHint: "For example, Architecture", nationalityHint: "For example, Syrian", diplomaHint: "For example, Syria", averageHint: "For example, 89", scaleHint: "For example, out of 100", languageHint: "For example, English and German", prioritiesHint: "For example, cost, city, language", phoneHint: "+961 …", emailHint: "you@example.com",
    signalsLabel: "Research signals", preparationLabel: "Preparation to check", cannotDecideLabel: "What Nightfall cannot decide",
    clarifyDirection: "I could not recognise that as a study direction yet. Try a field like Architecture or Medicine, or choose that you are still exploring.", clarify: "I need a little more than that to make this useful. Try a short, real answer and we can keep going.", emailInvalid: "Please use an email format we can verify at the final unlock step.", budgetChoices: ["Tight", "Considered", "Flexible"], levelChoices: ["Bachelor’s", "Master’s", "Still deciding"], fundingChoices: ["Self-funded", "Sponsor", "Scholarship", "Mixed", "Still working it out"], sponsorChoices: ["Yes, likely", "No / not relying on one"], suggestion: "A few useful starting fields", exploring: "I’m still exploring", yes: "Yes, use it for research", no: "Not yet", local: "Held on this device", unlock: "Continue to account unlock", summary: "YOUR LOCAL ASSESSMENT", account: "Nothing above is saved until you continue through the existing account unlock.",
  },
  ar: {
    label: "جلسة استشارة مجانية", intro: "تقييم أول محترم، سؤال مفيد بكل مرة.", note: "بنسأل بس عن الأشياء اللي ممكن تغيّر طريق بحثك. أجوبتك بتضلّ على جهازك لحد ما تختار تفتحها.",
    chapterDirection: "الاتجاه", chapterReality: "الواقع", chapterPractical: "المسار العملي", chapterHandoff: "التسليم الآمن",
    name: "أول شي، شو بتحب نناديك؟", direction: "شو المجال اللي فعلاً حابب تدرسه؟", level: "لأي مستوى عم تخطّط؟", budget: "كيف بتحسّ ميزانية الرسوم لعيلتك هالفترة؟", funding: "كيف متوقع تموّل هالطريق؟", sponsor: "هل الكفيل أو الـ sponsor جزء من خطتك؟", nationality: "شو جنسيتك؟", diploma: "وين أخدت—or رح تاخد—شهادة الثانوية؟", average: "شو معدلك أو آخر نتيجة إلك؟", scale: "وعلى أي سلم علامات؟", language: "بأي لغات فيك تدرس بشكل واقعي؟", priorities: "لما تطلّع على جامعة، شو أهم شي إلك؟", phone: "شو أفضل رقم لمساحتك الخاصة بنايتفول؟", consent: "بتوافق نستخدم هالسياق لإشارات بحث قابلة للمراجعة؟ مش لقرار أهلية أو قبول أو فيزا أو تمويل.", email: "آخر شغلة: على أي إيميل بدك نتحقق قبل ما يصير هالتقييم مجموعة بحث محفوظة؟", ready: "صار عندي كفاية أجهّزلك أول مجموعة بحث مركّزة.",
    typed: "اكتب جوابك…", continue: "إرسال", nameHint: "مثلاً، رانيا", directionHint: "مثلاً، عمارة", nationalityHint: "مثلاً، سوري", diplomaHint: "مثلاً، سوريا", averageHint: "مثلاً، ٨٩", scaleHint: "مثلاً، من ١٠٠", languageHint: "مثلاً، إنجليزي وألماني", prioritiesHint: "مثلاً، الرسوم والمدينة واللغة", phoneHint: "+٩٦١ …", emailHint: "you@example.com",
    signalsLabel: "إشارات البحث", preparationLabel: "شغلات لازم تتأكد منها", cannotDecideLabel: "أشياء ما فينا نايتفول يقررها",
    clarifyDirection: "هالكلام ما باين إنه مجال دراسة بعد. جرّب مجال مثل عمارة أو طب، أو اختار إنك بعدك عم تستكشف.", clarify: "بدي جواب أوضح شوي حتى يضل هالحديث مفيد. جرّب جواب قصير وحقيقي ونكمّل.", emailInvalid: "اكتب إيميل بصيغة فينا نتحقق منها بآخر خطوة.", budgetChoices: ["محدودة", "مدروسة", "مرنة"], levelChoices: ["بكالوريوس", "ماجستير", "لسه بقرّر"], fundingChoices: ["تمويل شخصي", "كفيل / Sponsor", "منحة", "مختلط", "لسه عم برتّبها"], sponsorChoices: ["نعم، غالباً", "لا / مو معتمد عليه"], suggestion: "كم بداية ممكنة", exploring: "بعدني عم استكشف", yes: "نعم، استخدمه للبحث", no: "مش هلق", local: "محفوظة بهالجهاز", unlock: "كمّل لفتح الحساب", summary: "تقييمك المحلي", account: "ولا شي فوق بينحفظ قبل ما تكمّل من خلال فتح الحساب الموجود.",
  },
} as const;

function Mark() { return <span className="grid h-10 w-10 place-items-center border border-white/60"><Star className="h-3.5 w-3.5 fill-white text-white" /></span>; }

function answerFor(turn: Turn, draft: WarmInterviewDraft, language: "en" | "ar") {
  const t = copy[language];
  if (turn === "name") return draft.preferredName;
  if (turn === "direction") return draft.studyDirection;
  if (turn === "level") return draft.studyLevel;
  if (turn === "budget") return draft.tuitionBudgetBand === "unsure" ? "" : t.budgetChoices[["low", "medium", "flexible"].indexOf(draft.tuitionBudgetBand)];
  if (turn === "funding") return draft.fundingRoute === "unsure" ? t.fundingChoices[4] : t.fundingChoices[["self_funded", "sponsor", "scholarship", "mixed"].indexOf(draft.fundingRoute)];
  if (turn === "sponsor") return draft.hasSponsor ? t.sponsorChoices[0] : t.sponsorChoices[1];
  if (turn === "nationality") return draft.nationality;
  if (turn === "diploma") return draft.highSchoolDiplomaOrigin;
  if (turn === "average") return draft.academicAverage;
  if (turn === "scale") return draft.gradeScale;
  if (turn === "language") return draft.languageComfort;
  if (turn === "priorities") return draft.priorities;
  if (turn === "phone") return draft.phoneNumber;
  if (turn === "consent") return draft.consent ? t.yes : "";
  if (turn === "email") return draft.contactEmail;
  return "";
}

function inputMeta(turn: Turn, t: typeof copy.en | typeof copy.ar) {
  const map: Partial<Record<Turn, string>> = { name: t.nameHint, direction: t.directionHint, nationality: t.nationalityHint, diploma: t.diplomaHint, average: t.averageHint, scale: t.scaleHint, language: t.languageHint, priorities: t.prioritiesHint, phone: t.phoneHint, email: t.emailHint };
  return { placeholder: map[turn] ?? t.typed, type: turn === "email" ? "email" : turn === "phone" ? "tel" : "text" };
}

function TypedConversation({ draft, setDraft, language, isArabic, onUnlock, resumed }: { draft: WarmInterviewDraft; setDraft: React.Dispatch<React.SetStateAction<WarmInterviewDraft>>; language: "en" | "ar"; isArabic: boolean; onUnlock: () => void; resumed: boolean }) {
  const t = copy[language];
  const reduceMotion = useReducedMotion();
  const [turnIndex, setTurnIndex] = useState(resumed ? turns.length - 1 : 0);
  const [value, setValue] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const turn = turns[turnIndex];
  const previousTurns = turns.slice(0, turnIndex).filter((item) => item !== "ready");

  useEffect(() => { setValue(""); setFeedback(null); if (turn !== "ready") setTimeout(() => inputRef.current?.focus(), 40); }, [turn]);
  const saveTextAnswer = (next: string) => {
    const setters: Partial<Record<Turn, keyof WarmInterviewDraft>> = { name: "preferredName", direction: "studyDirection", level: "studyLevel", nationality: "nationality", diploma: "highSchoolDiplomaOrigin", average: "academicAverage", scale: "gradeScale", language: "languageComfort", priorities: "priorities", phone: "phoneNumber", email: "contactEmail" };
    const field = setters[turn];
    if (field) setDraft((current) => ({ ...current, [field]: next }));
  };
  const advance = (event?: FormEvent) => {
    event?.preventDefault();
    if (turn === "ready") return onUnlock();
    if ((["budget", "funding", "sponsor", "consent"] as Turn[]).includes(turn)) return;
    const kind = turn === "name" ? "name" : turn === "direction" ? "direction" : turn === "average" || turn === "scale" ? "grades" : turn === "phone" ? "phone" : "context";
    const quality = consultantInputQuality(kind, value);
    const invalidEmail = turn === "email" && !/^\S+@\S+\.\S+$/.test(value.trim());
    if (quality !== "usable" || invalidEmail) { setFeedback(turn === "direction" ? t.clarifyDirection : invalidEmail ? t.emailInvalid : t.clarify); return; }
    saveTextAnswer(value.trim());
    setTurnIndex((current) => current + 1);
  };
  const chooseDirection = (studyDirection: string) => { setDraft((current) => ({ ...current, studyDirection })); setTurnIndex((current) => current + 1); };
  const chooseLevel = (studyLevel: string) => { setDraft((current) => ({ ...current, studyLevel })); setTurnIndex((current) => current + 1); };
  const chooseBudget = (tuitionBudgetBand: "low" | "medium" | "flexible") => { setDraft((current) => ({ ...current, tuitionBudgetBand })); setTurnIndex((current) => current + 1); };
  const chooseFunding = (fundingRoute: WarmInterviewDraft["fundingRoute"]) => { setDraft((current) => ({ ...current, fundingRoute })); setTurnIndex((current) => current + 1); };
  const chooseSponsor = (hasSponsor: boolean) => { setDraft((current) => ({ ...current, hasSponsor })); setTurnIndex((current) => current + 1); };
  const chooseConsent = (consent: boolean) => { if (!consent) { setFeedback(t.clarify); return; } setDraft((current) => ({ ...current, consent })); setTurnIndex((current) => current + 1); };

  return <section className="relative overflow-hidden border border-white/15 bg-white/[.025] shadow-[0_24px_80px_rgba(0,0,0,.38)]"><div className="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-4"><div className="flex flex-wrap items-center gap-x-4 gap-y-1">{chapterOrder.map((chapter) => { const chapterLabel = chapter === "direction" ? t.chapterDirection : chapter === "reality" ? t.chapterReality : chapter === "practical" ? t.chapterPractical : t.chapterHandoff; const isCurrent = chapterForTurn[turn] === chapter; const isPast = chapterOrder.indexOf(chapterForTurn[turn]) > chapterOrder.indexOf(chapter); return <span key={chapter} className={`nf-label text-[8px] tracking-[.1em] ${isCurrent ? "text-white" : isPast ? "text-white/45" : "text-white/25"}`}>{chapterLabel}</span>; })}</div><span className="inline-flex shrink-0 items-center gap-2 text-[10px] text-white/55"><LockKeyhole className="h-3.5 w-3.5" />{t.local}</span></div><div className="max-h-[60vh] overflow-y-auto p-5 sm:p-7"><AnimatePresence initial={false}>{previousTurns.map((item) => <motion.div key={item} initial={reduceMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-7"><div className="max-w-[88%] rounded-sm border border-white/12 bg-[#171b1c] p-4 text-sm leading-6 text-white/82">{t[item]}</div><div className="ml-auto mt-2 max-w-[78%] bg-[#f5f4f0] px-4 py-3 text-sm leading-6 text-[#111]">{answerFor(item, draft, language)}</div></motion.div>)}</AnimatePresence><motion.div key={turn} initial={reduceMotion ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .22, ease }}><div className="max-w-[88%] rounded-sm border border-white/12 bg-[#171b1c] p-4 text-base leading-7 text-white/88">{t[turn]}</div>{turn === "direction" && <><p className="mt-5 nf-label text-[8px] text-white/45">{t.suggestion}</p><div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">{(language === "ar" ? ["عمارة", "طب", "هندسة", "علوم حاسوب", "أعمال", "قانون"] : ["Architecture", "Medicine", "Engineering", "Computer Science", "Business", "Law"]).map((option) => <button type="button" key={option} onClick={() => chooseDirection(option)} className="nf-button border border-white/15 px-3 py-3 text-left text-xs text-white/75 hover:border-white">{option}</button>)}<button type="button" onClick={() => chooseDirection(language === "ar" ? "عم استكشف مجالات الدراسة" : "Exploring possible study directions")} className="nf-button col-span-2 border border-white/15 px-3 py-3 text-left text-xs text-white/75 hover:border-white sm:col-span-3">{t.exploring}</button></div></>}{turn === "level" && <div className="mt-5 grid grid-cols-3 gap-2">{t.levelChoices.map((option) => <button type="button" key={option} onClick={() => chooseLevel(option)} className="nf-button border border-white/15 px-3 py-4 text-xs text-white/75 hover:border-white">{option}</button>)}</div>}{turn === "budget" && <div className="mt-5 grid grid-cols-3 gap-2">{(["low", "medium", "flexible"] as const).map((value, index) => <button type="button" key={value} onClick={() => chooseBudget(value)} className="nf-button border border-white/15 px-3 py-4 text-xs text-white/75 hover:border-white">{t.budgetChoices[index]}</button>)}</div>}{turn === "funding" && <div className="mt-5 grid gap-2 sm:grid-cols-2">{(["self_funded", "sponsor", "scholarship", "mixed", "unsure"] as const).map((value, index) => <button type="button" key={value} onClick={() => chooseFunding(value)} className="nf-button border border-white/15 px-3 py-3 text-left text-xs text-white/75 hover:border-white">{t.fundingChoices[index]}</button>)}</div>}{turn === "sponsor" && <div className="mt-5 flex flex-wrap gap-2">{([true, false] as const).map((value, index) => <button type="button" key={String(value)} onClick={() => chooseSponsor(value)} className="nf-button border border-white/15 px-4 py-3 text-xs text-white/75 hover:border-white">{t.sponsorChoices[index]}</button>)}</div>}{turn === "consent" && <div className="mt-5 flex flex-wrap gap-2"><button type="button" onClick={() => chooseConsent(true)} className="nf-button border border-white bg-white px-4 py-3 text-[10px] font-bold uppercase tracking-[.08em] text-black">{t.yes}</button><button type="button" onClick={() => chooseConsent(false)} className="nf-button border border-white/20 px-4 py-3 text-[10px] font-bold uppercase tracking-[.08em] text-white/70">{t.no}</button></div>}{turn === "ready" && <><div className="mt-5 space-y-5">{(() => { const groups = consultantSummaryGroups(draft, language); return <><div className="border border-white/12 bg-black/20 p-4"><p className="nf-label text-[8px] text-white/45">{t.signalsLabel}</p><ul className="mt-3 space-y-1.5 text-sm leading-6 text-white/80">{groups.signals.length ? groups.signals.map((line) => <li key={line}>{line}</li>) : <li className="text-white/40">{"—"}</li>}</ul></div><div className="border border-white/12 bg-black/20 p-4"><p className="nf-label text-[8px] text-white/45">{t.preparationLabel}</p><ul className="mt-3 space-y-1.5 text-sm leading-6 text-white/70">{groups.preparation.length ? groups.preparation.map((line) => <li key={line}>{line}</li>) : <li className="text-white/40">{"—"}</li>}</ul></div><div className="border border-white/12 bg-black/20 p-4"><p className="nf-label text-[8px] text-white/45">{t.cannotDecideLabel}</p><ul className="mt-3 space-y-1.5 text-sm leading-6 text-white/55">{groups.cannotDecide.map((line) => <li key={line}>{line}</li>)}</ul></div></>; })()}<p className="text-xs leading-5 text-white/50">{t.account}</p></div><button type="button" onClick={onUnlock} className="nf-button mt-5 inline-flex items-center gap-2 bg-[#f5f4f0] px-5 py-3.5 text-[10px] font-bold uppercase tracking-[.08em] text-[#111]">{t.unlock}<ArrowRight className={isArabic ? "h-4 w-4 rotate-180" : "h-4 w-4"} /></button></>}</motion.div>{feedback && <p role="alert" className="mt-4 border-l border-white/35 pl-3 text-xs leading-5 text-white/65">{feedback}</p>}</div>{!(["budget", "funding", "sponsor", "consent", "ready"] as Turn[]).includes(turn) && <form onSubmit={advance} className="flex gap-3 border-t border-white/10 p-4"><input ref={inputRef} type={inputMeta(turn, t).type} value={value} onChange={(event) => setValue(event.target.value)} placeholder={inputMeta(turn, t).placeholder} className="min-w-0 flex-1 bg-transparent text-base text-white outline-none placeholder:text-white/30" /><button className="nf-button grid h-10 w-10 place-items-center border border-white bg-white text-black" aria-label={t.continue}><Send className="h-4 w-4" /></button></form>}</section>;
}

export default function ConsultantOnboarding() {
  const [, setLocation] = useLocation();
  const { user, loading } = useAuth();
  const { language, isArabic, toggleLanguage } = usePublicLanguage();
  const t = copy[language];
  const profile = trpc.student.profile.useQuery(undefined, { enabled: !!user });
  const complete = trpc.student.completeOnboarding.useMutation();
  const saveFitProfile = trpc.student.saveFitProfile.useMutation();
  const beginConsultation = trpc.student.beginConsultation.useMutation();
  const pendingInterview = readPendingConsultantInterview();
  const hasPendingInterview = Boolean(pendingInterview);
  const [draft, setDraft] = useState<WarmInterviewDraft>(() => ({ ...emptyWarmInterviewDraft, ...(pendingInterview?.draft ?? {}) }));
  useEffect(() => { if (user?.email) setDraft((current) => current.contactEmail ? current : { ...current, contactEmail: user.email ?? "" }); }, [user?.email]);
  useEffect(() => { if (shouldRedirectCompletedProfile(Boolean(profile.data?.onboardingComplete), hasPendingInterview)) setLocation(`/dashboard?tab=discover&mode=recommendations&lang=${language}`); }, [hasPendingInterview, language, profile.data?.onboardingComplete, setLocation]);
  const unlock = async () => {
    storePendingConsultantInterview(draft, language);
    if (!user) { setLocation(`/signup?lang=${language}&entry=consultant`); return; }
    const safeEmail = user.email ?? draft.contactEmail.trim();
    await complete.mutateAsync({ preferredName: draft.preferredName.trim(), contactEmail: safeEmail, phoneNumber: draft.phoneNumber.trim(), destination: "Germany", graduationYear: String(new Date().getFullYear()), highSchoolDiplomaOrigin: draft.highSchoolDiplomaOrigin.trim(), preferredLanguage: language });
    await saveFitProfile.mutateAsync(fitProfileFromInterview(draft));
    await beginConsultation.mutateAsync();
    clearPendingConsultantInterview();
    setLocation(`/dashboard?tab=discover&mode=recommendations&lang=${language}`);
  };
  if (loading || (user && profile.isLoading)) return <div className="nf-shell grid min-h-screen place-items-center text-white"><Loader2 className="h-5 w-5 animate-spin" /></div>;
  return <div dir={isArabic ? "rtl" : "ltr"} className="night-bloom min-h-screen bg-[#111] text-[#f5f4f0]"><header className="flex items-center justify-between border-b border-white/10 px-5 py-4"><div className="flex items-center gap-3"><Mark /><span><span className="block text-sm font-semibold tracking-[.16em]">NIGHTFALL</span><span className="nf-label mt-1 block text-[8px] text-white/45">{user ? "SECURE RESEARCH UNLOCK" : "LOCAL-ONLY ASSESSMENT"}</span></span></div><LanguageToggle language={language} onToggle={toggleLanguage} /></header><main className="mx-auto grid max-w-[1120px] gap-10 px-5 py-8 lg:min-h-[calc(100vh-73px)] lg:grid-cols-[.76fr_1.24fr] lg:items-center lg:px-10"><section><p className="nf-label text-white/45">// {t.label}</p><h1 className="mt-5 max-w-md text-5xl font-semibold leading-[.9] tracking-[-.075em] sm:text-6xl">{t.intro}</h1><p className="mt-6 max-w-md text-base leading-7 text-white/58">{t.note}</p><div className="mt-8 inline-flex items-center gap-2 border border-white/15 px-3 py-2 text-[10px] text-white/70"><LockKeyhole className="h-3.5 w-3.5" />{language === "ar" ? "تقييمك قبل الفتح ما بيطلع من جهازك" : "Before unlock, your assessment stays in this browser."}</div></section><TypedConversation draft={draft} setDraft={setDraft} language={language} isArabic={isArabic} onUnlock={() => void unlock()} resumed={Boolean(user && pendingInterview)} /></main></div>;
}
