import { ArrowRight, BellRing, CalendarDays, CheckCircle2, Compass, FileText, ListChecks, Radio, Sparkles } from "lucide-react";
import type { JourneyAction, JourneyHomeState } from "@/lib/journeyStage";

type ActiveProgramme = {
  id: string;
  programme: string;
  university: string;
  city?: string | null;
  isPriority: boolean;
  sourceUrl?: string | null;
};

type AttentionItem = {
  id: string;
  kind: "reply" | "draft" | "follow_up" | "deadline" | "document" | "watch";
  title: string;
  detail: string;
};

const copy = {
  en: {
    kicker: "MY JOURNEY / APPLICATION PULSE",
    title: {
      orient: "Let’s make the first options make sense.",
      review_options: "Your first options are ready.",
      build_shortlist: "You have a start. Let’s make it a real list.",
      choose: "You have options. Here is what separates them.",
      prepare: "Your chosen path is taking shape.",
      communicate: "A university relationship needs your attention.",
      monitor: "Nothing urgent is waiting on you.",
    },
    body: {
      orient: "A short private conversation gives Nightfall enough direction to make the first research set useful.",
      review_options: "Review a small, source-linked starting set. You do not need to search the whole world again.",
      build_shortlist: "Keep one more considered option before you ask yourself to compare anything.",
      choose: "Compare only the choices you already care about, then make your own priority order.",
      prepare: "The next useful detail is now tied to a path you chose—not another generic task list.",
      communicate: "Read the original message, confirm the facts, and decide the next move yourself.",
      monitor: "Your saved path is being held together. You can check a source or expand only when you choose to.",
    },
    pulse: { shortlist: "OPTIONS KEPT", deadline: "CONFIRMED DATES", attention: "NEEDS YOUR REVIEW", sources: "SOURCES WATCHED" },
    empty: { shortlist: "None yet", deadline: "None yet", attention: "Clear", sources: "Not yet" },
    next: "YOUR NEXT MOVE",
    action: {
      needs_direction: "Continue the Consultant",
      review_first_options: "Review my first options",
      build_shortlist: "Keep one more option",
      compare_options: "Compare my options",
      prepare_next_item: "Continue preparing",
      review_communication: "Review what is waiting",
      review_sources: "Check the latest source",
    },
    reason: {
      needs_direction: "Nightfall needs your direction before it narrows the research responsibly.",
      review_first_options: "A contained starting set is ready; broad exploration can wait until you ask for it.",
      build_shortlist: "One option is a start, but two considered options make comparison useful.",
      compare_options: "Your saved options are ready to be seen in the same frame.",
      prepare_next_item: "The next preparation step is tied to something you chose.",
      review_communication: "There is real university communication or a planned follow-up for you to review.",
      review_sources: "Your active source or university relationship is quiet, but available when you want to check it.",
    },
    active: "YOUR ACTIVE PATH",
    priority: "PRIORITY",
    saved: "SAVED",
    nothingActive: "Your active path will appear after you keep an option from your first research set.",
    attention: "WHAT IS WAITING",
    noAttention: "Nothing needs your attention right now. That is a real status—not an empty dashboard.",
    tools: "My tools",
    adjust: "Adjust my direction",
    expand: "Explore another option",
  },
  ar: {
    kicker: "رحلتي / نبض التقديم",
    title: {
      orient: "خلّينا نرتّب أول خياراتك بطريقة منطقية.",
      review_options: "أول خياراتك صاروا جاهزين.",
      build_shortlist: "عندك بداية. خلّينا نخليها قائمة حقيقية.",
      choose: "عندك خيارات. هاد اللي بيفرّق بينهم.",
      prepare: "الطريق اللي اخترته عم ياخد شكل.",
      communicate: "في علاقة مع جامعة بدها انتباهك.",
      monitor: "ما في شي مستعجل ناطر منك.",
    },
    body: {
      orient: "حديث خاص قصير بيعطي نايتفول اتجاه كافي حتى تكون أول مجموعة بحث مفيدة.",
      review_options: "راجع نقطة بداية صغيرة ومربوطة بالمصادر. ما لازم تدوّر بالعالم كله مرة تانية.",
      build_shortlist: "احتفظ بخيار مدروس كمان قبل ما تطلب من حالك تقارن أي شي.",
      choose: "قارن بس الخيارات اللي بتهمّك فعلاً، وبعدها رتّب أولوياتك بطريقتك.",
      prepare: "الخطوة المفيدة الجاية مرتبطة بطريق إنت اخترته، مش بقائمة مهام عامة.",
      communicate: "اقرأ الرسالة الأصلية، تأكد من الحقائق، وقرّر الخطوة الجاية بنفسك.",
      monitor: "طريقك المحفوظ مرتب. فيك تراجع مصدر أو توسّع بس لما إنت تختار.",
    },
    pulse: { shortlist: "خيارات محفوظة", deadline: "مواعيد مؤكدة", attention: "بدها مراجعتك", sources: "مصادر مراقبة" },
    empty: { shortlist: "ولا خيار لسه", deadline: "ولا موعد لسه", attention: "الوضع هادي", sources: "مو مفعّلة" },
    next: "خطوتك الجاية",
    action: {
      needs_direction: "كمّل مع المستشار",
      review_first_options: "راجع أول خياراتي",
      build_shortlist: "احتفظ بخيار كمان",
      compare_options: "قارن خياراتي",
      prepare_next_item: "كمّل التحضير",
      review_communication: "راجع اللي ناطر",
      review_sources: "راجع آخر مصدر",
    },
    reason: {
      needs_direction: "نايتفول بدها اتجاهك قبل ما تضيّق البحث بمسؤولية.",
      review_first_options: "نقطة بداية مركّزة جاهزة؛ الاستكشاف الواسع بيستنى لوقت تطلبه.",
      build_shortlist: "خيار واحد بداية، بس خيارين مدروسين بيخلّوا المقارنة مفيدة.",
      compare_options: "خياراتك المحفوظة جاهزة تنشاف بنفس الإطار.",
      prepare_next_item: "خطوة التحضير الجاية مرتبطة بشي إنت اخترته.",
      review_communication: "في تواصل حقيقي مع جامعة أو متابعة مخططة لازم تراجعها.",
      review_sources: "مصدرك النشط أو علاقتك مع الجامعة هادية، بس موجودة وقت تحب تراجعها.",
    },
    active: "طريقك النشط",
    priority: "أولوية",
    saved: "محفوظ",
    nothingActive: "طريقك النشط بيظهر بعد ما تحتفظ بخيار من أول مجموعة بحث.",
    attention: "شو ناطر",
    noAttention: "ما في شي بدو انتباهك هلق. هاد وضع حقيقي، مش داشبورد فاضي.",
    tools: "أدواتي",
    adjust: "عدّل اتجاهي",
    expand: "استكشف خيار تاني",
  },
} as const;

function pulseValue(value: number, empty: string) {
  return value > 0 ? String(value).padStart(2, "0") : empty;
}

function IconForAttention({ kind }: { kind: AttentionItem["kind"] }) {
  const Icon = kind === "reply" ? Radio : kind === "deadline" ? CalendarDays : kind === "document" ? FileText : kind === "watch" ? Compass : kind === "draft" ? Sparkles : BellRing;
  return <Icon className="h-4 w-4" />;
}

export function JourneyHome({ language, name, state, programmes, attentionItems, onAction, onOpenTools }: { language: "en" | "ar"; name: string; state: JourneyHomeState; programmes: ActiveProgramme[]; attentionItems: AttentionItem[]; onAction: (action: JourneyAction) => void; onOpenTools: () => void }) {
  const t = copy[language];
  const isArabic = language === "ar";
  const stageTitle = t.title[state.stage];
  const stageBody = t.body[state.stage];

  return <section className="pb-12" aria-labelledby="journey-heading">
    <div className="border-b border-white/10 pb-8 sm:pb-10">
      <p className="nf-label text-[9px] text-[#99a49d]">// {t.kicker}</p>
      <div className="mt-5 grid gap-7 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-end">
        <div>
          <p className="nf-label text-[9px] text-white/45">{isArabic ? "مرحباً" : "HELLO"} / {name}</p>
          <h1 id="journey-heading" className="mt-3 max-w-3xl text-4xl font-semibold leading-[.88] tracking-[-.07em] sm:text-6xl">{stageTitle}</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-[#aeb8b1] sm:text-lg">{stageBody}</p>
        </div>
        <div className="border border-white/15 bg-white/[.025] p-4">
          <p className="nf-label text-[8px] text-[#9ca69f]">{isArabic ? "مرحلتك الحالية" : "CURRENT STAGE"}</p>
          <p className="mt-5 flex items-center gap-2 text-sm font-semibold"><span className="h-2 w-2 rounded-full bg-white" />{stageTitle}</p>
        </div>
      </div>
    </div>

    <div className="mt-5 grid gap-px border border-white/15 bg-white/10 sm:grid-cols-2 xl:grid-cols-4">
      {state.pulse.map((item) => <article key={item.kind} className="bg-[#111516] p-4"><p className="nf-label text-[8px] text-[#929d96]">{t.pulse[item.kind]}</p><p className={`mt-5 text-2xl font-semibold tracking-[-.06em] ${item.status === "attention" ? "text-white" : "text-[#e5eae7]"}`}>{pulseValue(item.value, t.empty[item.kind])}</p><p className={`mt-2 text-[10px] ${item.status === "attention" ? "text-white/80" : "text-[#87918b]"}`}>{item.status === "attention" ? (isArabic ? "في شي بدو مراجعتك" : "Something is waiting") : item.value ? (isArabic ? "مربوط بطريقك" : "Connected to your path") : (isArabic ? "بيظهر وقت يصير إلو معنى" : "Shown when it becomes useful")}</p></article>)}
    </div>

    <section className="mt-5 overflow-hidden border border-white/20 bg-[#f5f4f0] p-5 text-[#111] sm:p-7">
      <p className="nf-label text-[9px] text-black/55">// {t.next}</p>
      <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div><h2 className="text-2xl font-semibold tracking-[-.055em] sm:text-3xl">{t.action[state.primaryAction.reason]}</h2><p className="mt-3 max-w-xl text-sm leading-6 text-black/65">{t.reason[state.primaryAction.reason]}</p></div>
        <button type="button" onClick={() => onAction(state.primaryAction)} className="nf-button inline-flex shrink-0 items-center justify-center gap-2 bg-[#111] px-4 py-3 text-[10px] font-bold uppercase tracking-[.08em] text-white hover:bg-black"><span>{t.action[state.primaryAction.reason]}</span><ArrowRight className={`h-3.5 w-3.5 ${isArabic ? "rotate-180" : ""}`} /></button>
      </div>
      {state.secondaryAction && <button type="button" onClick={() => onAction(state.secondaryAction!)} className="nf-button mt-5 text-xs font-semibold text-black/60 underline underline-offset-4">{state.secondaryAction.destination === "consult" ? t.adjust : t.expand}</button>}
    </section>

    <section className="mt-8"><div className="flex items-end justify-between gap-4"><div><p className="nf-label text-[9px] text-[#9da79f]">// {t.active}</p><h2 className="mt-2 text-2xl font-semibold tracking-[-.05em]">{programmes.length ? (isArabic ? "اختياراتك اللي عم تشتغل عليها." : "The choices you are carrying forward.") : (isArabic ? "اختيارك الجاي بيبدأ ببساطة." : "Your next choice starts simply.")}</h2></div>{programmes.length > 0 && <button type="button" onClick={() => onAction({ destination: programmes.length >= 2 ? "compare" : "discover", reason: programmes.length >= 2 ? "compare_options" : "build_shortlist" })} className="nf-button text-xs font-semibold text-[#b9c2bc] underline underline-offset-4">{programmes.length >= 2 ? t.action.compare_options : t.expand}</button>}</div>
      {programmes.length ? <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{programmes.slice(0, 3).map((programme) => <article key={programme.id} className="border border-white/15 bg-[#111516] p-4"><p className="nf-label text-[8px] text-[#909b94]">{programme.isPriority ? `★ ${t.priority}` : t.saved}{programme.city ? ` / ${programme.city}` : ""}</p><h3 className="mt-3 text-lg font-semibold leading-tight">{programme.programme}</h3><p className="mt-2 text-xs leading-5 text-[#a6b0a9]">{programme.university}</p>{programme.sourceUrl && <a href={programme.sourceUrl} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-1 text-[10px] font-semibold text-[#dfe6e1] underline underline-offset-4">{isArabic ? "المصدر الرسمي" : "Official source"}<ArrowRight className={`h-3 w-3 ${isArabic ? "rotate-180" : ""}`} /></a>}</article>)}</div> : <div className="mt-5 border border-dashed border-white/20 bg-white/[.018] p-5 text-sm leading-6 text-[#9ba59f]">{t.nothingActive}</div>}</section>

    <section className="mt-8 border-t border-white/10 pt-8"><p className="nf-label text-[9px] text-[#9da79f]">// {t.attention}</p>{attentionItems.length ? <div className="mt-4 grid gap-3 md:grid-cols-2">{attentionItems.slice(0, 4).map((item) => <article key={item.id} className="flex gap-3 border border-white/15 bg-[#111516] p-4"><span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center border border-white/20"><IconForAttention kind={item.kind} /></span><div><h3 className="text-sm font-semibold">{item.title}</h3><p className="mt-1 text-xs leading-5 text-[#9da79f]">{item.detail}</p></div></article>)}</div> : <div className="mt-4 flex gap-3 border border-white/10 bg-white/[.015] p-4 text-sm leading-6 text-[#9ba59f]"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-white" />{t.noAttention}</div>}</section>

    <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-white/10 pt-6"><button type="button" onClick={onOpenTools} className="nf-button inline-flex items-center gap-2 text-xs font-semibold text-[#d7dfda] underline underline-offset-4"><ListChecks className="h-3.5 w-3.5" />{t.tools}</button><button type="button" onClick={() => onAction({ destination: "consult", reason: "needs_direction" })} className="nf-button text-xs text-[#969f99] hover:text-white">{t.adjust}</button><button type="button" onClick={() => onAction({ destination: "discover", reason: "review_first_options" })} className="nf-button text-xs text-[#969f99] hover:text-white">{t.expand}</button></div>
  </section>;
}
