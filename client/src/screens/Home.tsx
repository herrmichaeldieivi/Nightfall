import { ArrowDown, ArrowRight, ArrowUp, Check, ChevronDown, ChevronRight, GripVertical, LockKeyhole, Sparkles, Volume2, VolumeX } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState, type DragEvent, type ReactNode } from "react";
import { useLocation } from "wouter";
import { LanguageToggle, usePublicLanguage } from "@/components/LanguageToggle";
import { DottedEarthHero, type EarthDensity } from "@/components/DottedEarthHero";

const HERO_AUDIO = "/files/nightfall-hero-soundscape_49d6dc6b.mp3";
const ease = [0.23, 1, 0.32, 1] as const;

const copy = {
  en: {
    nav: ["The journey", "What stays yours"], signIn: "Sign in", warm: "Meet the Consultant", scroll: "Take the walk", heroKicker: "NIGHTFALL / THE APPLICATION JOURNEY", hero: "Your future does not need to begin with a list.", heroBody: "It begins with a real conversation, a direction that feels like yours, and research you can actually trust.", heroFoot: "A private, source-linked companion for every student step.",
    sceneOneKicker: "01 / FIND YOUR DIRECTION", sceneOneTitle: "Someone starts by understanding where you are coming from.", sceneOneBody: "Not a cold form. Not a database asking for everything. Just the few things that help us see the road ahead: what you want to study, what your life needs to hold, and what your grades are saying today.", sceneOnePrompt: "What would you genuinely like to study?", typedLabel: "A thought in progress", consultantLabel: "NIGHTFALL / CONSULTANT", consultantProgress: "01 / YOUR FIRST QUESTION", consultantPace: "Your pace. Your answer.", consultantAction: "Begin a private conversation with the Consultant",
    sceneTwoKicker: "02 / SEE WHAT FITS", sceneTwoTitle: "Then the world gets smaller—in a good way.", sceneTwoBody: "Nightfall turns your direction into a reviewable research set. Every programme stays connected to its official source. No rankings pretending to know your future. No admissions promises.", source: "OPEN OFFICIAL SOURCE", save: "SAVE TO MY JOURNEY", priorityNote: "MY PRIORITY LIST / This preview keeps the order you choose while this page stays open.", researchSet: "YOUR FIRST RESEARCH SET", researchOptions: "OPTIONS", rank: "RANK THESE IN YOUR OWN ORDER", dragHint: "DRAG TO RANK", moveUp: "Move up", moveDown: "Move down", researchChoices: [{ name: "Architecture", context: "Germany / English & German" }, { name: "Urban Design", context: "Germany / English & German" }, { name: "Spatial Design", context: "Germany / English & German" }], sourceLinked: "SOURCE-LINKED",
    sceneThreeKicker: "03 / BUILD YOUR PATH", sceneThreeTitle: "Your choices stop living in ten open tabs.", sceneThreeBody: "Save what matters. Compare the details. Hold deadlines, documents, and thoughtful university conversations in one private place. Every meaningful action still waits for you.", ownership: "YOUR CONTROL", controlOne: "You approve every email", controlTwo: "You inspect every source", controlThree: "You choose every next step", journeyOverview: "MY JOURNEY / A QUIET OVERVIEW", savedPlaces: "SAVED PLACES", savedPlacesDetail: "Architecture options kept close", milestones: "MILESTONES", milestonesDetail: "Small work, visibly moving", nextReminder: "NEXT GENTLE REMINDER", nextReminderTitle: "Review programme language", nextReminderDetail: "Whenever you are ready",
    trustKicker: "WHAT STAYS YOURS", trustTitle: "The important decisions do not move away from you.", trustBody: "Nightfall can prepare research, organize context, and help you find the next question. It cannot make admissions decisions, decide eligibility, submit an application, or send a university message without your clear approval.",
    closeKicker: "WHEN YOU ARE READY", closeTitle: "Ready to start your journey?", closeBody: "Meet the Consultant. Share only what helps. See a first research set you can challenge, save, and make your own.", closePrimary: "Start my private conversation", closeSecondary: "I already have a Nightfall journey", footer: "NIGHTFALL / YOUR FUTURE, HELD WITH CARE", earlyList: "INSTAGRAM EARLY LIST →",
  },
  ar: {
    nav: ["الرحلة", "شو بيضل بإيدك"], signIn: "تسجيل الدخول", warm: "قابل المستشار", scroll: "خد اللفة", heroKicker: "نايتفول / رحلة التقديم", hero: "مستقبلك مش لازم يبلّش بقائمة.", heroBody: "بيبلّش بحديث حقيقي، باتجاه بتحسّه إلك، وببحث تقدر تثق فيه فعلاً.", heroFoot: "رفيق خاص ومربوط بالمصادر لكل خطوة بطريقك.",
    sceneOneKicker: "٠١ / لاقي اتجاهك", sceneOneTitle: "حدا بيبلّش بفهم من وين جاي.", sceneOneBody: "مش نموذج بارد. ومش قاعدة بيانات عم تطلب كل شي. بس الشغلات اللي بتساعدنا نشوف الطريق الجاي: شو حابب تدرس، شو حياتك بدها تتحمّل، وشو علاماتك عم تقول اليوم.", sceneOnePrompt: "شو المجال اللي فعلاً حابب تدرسه؟", typedLabel: "فكرة بعدها عم تتشكّل", consultantLabel: "نايتفول / المستشار", consultantProgress: "٠١ / أول سؤال إلك", consultantPace: "على مهلك. جوابك إلك.", consultantAction: "بلّش حديثك الخاص مع المستشار",
    sceneTwoKicker: "٠٢ / شوف شو بناسبك", sceneTwoTitle: "وبعدين العالم بيصغر—بطريقة حلوة.", sceneTwoBody: "نايتفول بتحوّل اتجاهك لمجموعة بحث قابلة للمراجعة. كل برنامج بيضل مربوط بمصدره الرسمي. ما في ترتيب عم يتظاهر بيعرف مستقبلك. وما في وعود قبول.", source: "افتح المصدر الرسمي", save: "احفظ برحلتي", priorityNote: "قائمة أولوياتي / هالمعاينة بتحفظ ترتيبك طول ما الصفحة مفتوحة.", researchSet: "أول مجموعة بحث إلك", researchOptions: "خيارات", rank: "رتّبهم بالطريقة اللي بتناسبك", dragHint: "اسحب لترتّب", moveUp: "حرّك لفوق", moveDown: "حرّك لتحت", researchChoices: [{ name: "الهندسة المعمارية", context: "ألمانيا / إنجليزي وألماني" }, { name: "التصميم الحضري", context: "ألمانيا / إنجليزي وألماني" }, { name: "التصميم المكاني", context: "ألمانيا / إنجليزي وألماني" }], sourceLinked: "مربوط بالمصدر",
    sceneThreeKicker: "٠٣ / ابنِ طريقك", sceneThreeTitle: "اختياراتك ما بتضل عايشة بعشر تبويبات.", sceneThreeBody: "احفظ اللي بيهمّك. قارن التفاصيل. خلّي المواعيد والأوراق وحديث الجامعة المدروس بمكان خاص واحد. كل خطوة مؤثرة بتضل مستنية موافقتك.", ownership: "تحكّمك", controlOne: "إنت بتوافق على كل إيميل", controlTwo: "إنت بتراجع كل مصدر", controlThree: "إنت بتختار كل خطوة جاية", journeyOverview: "رحلتي / نظرة هادية", savedPlaces: "الخيارات المحفوظة", savedPlacesDetail: "خيارات الهندسة المعمارية قريبة منك", milestones: "المحطات", milestonesDetail: "شغل صغير، وتقدّم واضح", nextReminder: "التذكير الجاي", nextReminderTitle: "راجع لغة البرنامج", nextReminderDetail: "وقت تكون جاهز",
    trustKicker: "شو بيضل بإيدك", trustTitle: "القرارات المهمة ما بتطلع من إيدك.", trustBody: "نايتفول بتقدر تجهّز البحث وترتّب السياق وتساعدك تلاقي السؤال الجاي. ما بتقدر تقرر القبول أو الأهلية، أو تقدّم طلب، أو تبعت رسالة لجامعة بدون موافقتك الواضحة.",
    closeKicker: "لما تكون جاهز", closeTitle: "جاهز تبلّش رحلتك؟", closeBody: "قابل المستشار. شارك بس اللي بيفيد. وشوف أول مجموعة بحث بتقدر تسأل عنها وتحفظها وتخليها إلك.", closePrimary: "بلّش حديثي الخاص", closeSecondary: "عندي رحلة بنايتفول من قبل", footer: "نايتفول / مستقبلك، ممسوك بعناية", earlyList: "قائمة إنستغرام المبكرة ←",
  },
} as const;

function Mark() {
  return <span aria-hidden className="relative grid h-9 w-9 place-items-center overflow-hidden border border-white/70"><span className="absolute h-4 w-4 rotate-45 border border-white/90" /><span className="absolute h-2 w-2 rotate-45 bg-white" /><span className="absolute h-px w-6 bg-white/65" /><span className="absolute h-6 w-px bg-white/65" /></span>;
}

function Reveal({ children, className = "" }: { children: ReactNode; className?: string }) {
  const reduced = useReducedMotion();
  return <motion.div initial={reduced ? false : { opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .22 }} transition={{ duration: .64, ease }} className={className}>{children}</motion.div>;
}

function TypedStudyField({ isArabic, label }: { isArabic: boolean; label: string }) {
  const reduced = useReducedMotion();
  const fields = isArabic ? ["طب", "هندسة مدنية", "قانون", "علوم حاسوب", "هندسة ميكانيكية"] : ["Medicine", "Civil Engineering", "Law", "Computer Science", "Mechanical Engineering"];
  const [fieldIndex, setFieldIndex] = useState(0);
  const [visible, setVisible] = useState("");
  const [deleting, setDeleting] = useState(false);
  useEffect(() => {
    if (reduced) { setVisible(fields[0]); return; }
    const target = fields[fieldIndex];
    const complete = visible === target;
    const empty = visible.length === 0;
    const timeout = window.setTimeout(() => {
      if (!deleting && !complete) setVisible(target.slice(0, visible.length + 1));
      else if (!deleting && complete) setDeleting(true);
      else if (deleting && !empty) setVisible(target.slice(0, visible.length - 1));
      else { setDeleting(false); setFieldIndex((current) => (current + 1) % fields.length); }
    }, complete && !deleting ? 950 : deleting ? 48 : 86);
    return () => window.clearTimeout(timeout);
  }, [deleting, fieldIndex, fields, reduced, visible]);
  return <div className="mt-9 border border-white/18 bg-black/35 p-4"><p className="nf-label text-[8px] text-white/45">// {label}</p><p className={`mt-4 min-h-9 text-2xl font-semibold tracking-[-.045em] text-white ${isArabic ? "text-right" : ""}`}>{visible}<span aria-hidden className={`${isArabic ? "mr-1" : "ml-1"} inline-block h-6 w-px animate-pulse bg-white align-middle`} /></p><p className="mt-3 text-[10px] text-white/45">{isArabic ? "بتكتب، بتمسح، وبتجرّب فكرة تانية." : "Writing, reconsidering, and trying another direction."}</p></div>;
}

function TypeInHeading({ text, className }: { text: string; className: string }) {
  const reduced = useReducedMotion();
  const [typed, setTyped] = useState("");
  useEffect(() => {
    setTyped("");
    if (reduced) { setTyped(text); return; }
    let cursor = 0;
    const interval = window.setInterval(() => {
      cursor += 1;
      setTyped(text.slice(0, cursor));
      if (cursor >= text.length) window.clearInterval(interval);
    }, 22);
    return () => window.clearInterval(interval);
  }, [reduced, text]);
  return <h2 aria-label={text} className={`${className} nf-type-heading`}><span aria-hidden>{typed}</span><span aria-hidden className="nf-type-cursor" /></h2>;
}

function ResearchSet({ choices, isArabic, language }: { choices: readonly { readonly name: string; readonly context: string }[]; isArabic: boolean; language: "en" | "ar" }) {
  const t = copy[language];
  const reduced = useReducedMotion();
  const [order, setOrder] = useState([...choices]);
  const [dragged, setDragged] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);
  useEffect(() => { setOrder([...choices]); }, [choices]);
  const move = (from: number, to: number) => {
    if (to < 0 || to >= order.length || from === to) return;
    setOrder((current) => { const next = [...current]; [next[from], next[to]] = [next[to], next[from]]; return next; });
  };
  const dropOn = (fromName: string, toName: string) => {
    setOrder((current) => {
      const from = current.findIndex((item) => item.name === fromName);
      const to = current.findIndex((item) => item.name === toName);
      if (from < 0 || to < 0 || from === to) return current;
      const next = [...current];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  };
  return <div className="nf-panel bg-[#101314] p-4"><div className="flex items-center justify-between border-b border-white/10 pb-3"><span className="nf-label text-[8px] text-white/45">{t.researchSet}</span><span className="nf-label text-[8px] text-white/45">{String(order.length).padStart(2, "0")} {t.researchOptions}</span></div><div className="mt-4 flex items-center justify-between gap-3"><p className="nf-label text-[8px] text-[#8be0da]">{t.rank}</p><p className="nf-label inline-flex items-center gap-1 text-[7px] text-white/40"><GripVertical className="h-3 w-3" />{t.dragHint}</p></div><div className="mt-1">{order.map((choice, index) => {
    const dragging = dragged === choice.name;
    const dragOver = over === choice.name && !dragging;
    return <motion.div key={choice.name} layout={!reduced} transition={{ layout: { duration: 0.24, ease } }}><div draggable onDragStart={(event: DragEvent<HTMLDivElement>) => { event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/plain", choice.name); setDragged(choice.name); }} onDragOver={(event: DragEvent<HTMLDivElement>) => { event.preventDefault(); event.dataTransfer.dropEffect = "move"; setOver(choice.name); }} onDrop={(event: DragEvent<HTMLDivElement>) => { event.preventDefault(); const from = event.dataTransfer.getData("text/plain") || dragged; if (from) dropOn(from, choice.name); setDragged(null); setOver(null); }} onDragEnd={() => { setDragged(null); setOver(null); }} className={`rank-row flex items-center justify-between gap-3 border-b border-white/10 py-4 ${dragging ? "rank-row-dragging" : ""} ${dragOver ? "rank-row-over" : ""}`}><div className="flex items-start gap-2"><span aria-hidden className="mt-2 cursor-grab text-white/32 active:cursor-grabbing"><GripVertical className="h-3.5 w-3.5" /></span><div><p className="nf-label text-[8px] text-white/38">{String(index + 1).padStart(2, "0")} / {t.sourceLinked}</p><p className="mt-2 text-lg font-semibold">{choice.name}</p><p className="mt-1 text-[11px] text-white/50">{choice.context}</p></div></div><div className="flex items-center gap-1"><div className="flex flex-col border border-white/15"><button type="button" aria-label={`${t.moveUp}: ${choice.name}`} disabled={index === 0} onClick={() => move(index, index - 1)} className="nf-button grid h-6 w-7 place-items-center border-b border-white/15 text-white/65 disabled:opacity-25 hover:bg-white hover:text-[#111]"><ArrowUp className="h-3 w-3" /></button><button type="button" aria-label={`${t.moveDown}: ${choice.name}`} disabled={index === order.length - 1} onClick={() => move(index, index + 1)} className="nf-button grid h-6 w-7 place-items-center text-white/65 disabled:opacity-25 hover:bg-white hover:text-[#111]"><ChevronDown className="h-3 w-3" /></button></div><ArrowRight className={`h-4 w-4 text-white/70 ${isArabic ? "rotate-180" : ""}`} /></div></div></motion.div>;
  })}</div><div className="mt-4 grid gap-2 sm:grid-cols-2"><button type="button" className="nf-button border border-white/25 px-3 py-3 text-[9px] font-semibold">{t.source}</button><button type="button" className="nf-button bg-gradient-to-r from-[#9fdcff] to-[#d2a4ff] px-3 py-3 text-[9px] font-semibold text-[#111]">{t.save}</button></div><p className="mt-4 border-t border-white/10 pt-4 text-[10px] leading-5 text-white/65">{t.priorityNote}</p></div>;
}

export default function Home() {
  const [, setLocation] = useLocation();
  const { language, isArabic, setLanguage } = usePublicLanguage();
  const t = copy[language];
  const reduceMotion = useReducedMotion();
  const audio = useRef<HTMLAudioElement>(null);
  const [ambientOn, setAmbientOn] = useState(false);
  const [earthAwake, setEarthAwake] = useState(false);
  const [earthDensity, setEarthDensity] = useState<EarthDensity>(() => typeof window !== "undefined" && window.innerWidth < 640 ? "mobile" : "desktop");
  const go = (path: string) => setLocation(`${path}${path.includes("?") ? "&" : "?"}lang=${language}`);
  useEffect(() => { if (audio.current) audio.current.volume = .055; }, []);
  useEffect(() => { const updateDensity = () => setEarthDensity(window.innerWidth < 640 ? "mobile" : "desktop"); updateDensity(); window.addEventListener("resize", updateDensity); return () => window.removeEventListener("resize", updateDensity); }, []);
  const toggleAmbient = async () => { const element = audio.current; if (!element) return; if (ambientOn) { element.pause(); setAmbientOn(false); return; } try { await element.play(); setAmbientOn(true); } catch { setAmbientOn(false); } };

  return <div dir={isArabic ? "rtl" : "ltr"} className="min-h-screen overflow-x-hidden bg-[#090b12] text-[#f7f5ef]">
    <audio ref={audio} loop preload="metadata" src={HERO_AUDIO} />
    <header className="fixed inset-x-0 top-0 z-40 border-b border-white/10 bg-[#090b12]/72 px-4 py-3 shadow-[0_18px_60px_rgba(0,0,0,.22)] backdrop-blur-2xl sm:px-7"><div className="mx-auto flex max-w-[1440px] items-center justify-between gap-3"><button onClick={() => go("/")} className="flex items-center gap-2.5 text-left"><Mark /><span><span className="block text-xs font-semibold tracking-[.18em]">NIGHTFALL</span><span className="nf-label mt-0.5 block text-[7px] text-white/45">{isArabic ? "رفيقك برحلة التقديم" : "YOUR APPLICATION COMPANION"}</span></span></button><nav className="hidden items-center gap-7 md:flex">{t.nav.map((item, index) => <button key={item} onClick={() => document.getElementById(index ? "trust" : "journey")?.scrollIntoView({ behavior: "smooth" })} className="text-[11px] text-white/55 transition-colors hover:text-white">{item}</button>)}</nav><div className="flex items-center gap-1.5"><button type="button" aria-label="Ambient sound" title="Ambient sound" onClick={() => void toggleAmbient()} className="nf-button grid h-8 w-8 place-items-center border border-white/15 text-white/55 hover:text-white">{ambientOn ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}</button><LanguageToggle language={language} onChange={setLanguage} /><button onClick={() => go("/login")} className="hidden px-2 text-[11px] text-white/70 sm:block">{t.signIn}</button><button onClick={() => go("/onboarding?entry=consult")} className="nf-button bg-gradient-to-r from-[#9fdcff] via-[#f7f5ef] to-[#d2a4ff] px-3 py-2 text-[9px] font-bold uppercase tracking-[.08em] text-[#111] shadow-[0_14px_48px_rgba(159,220,255,.22)]">{t.warm}</button></div></div></header>
    <main>
      <section onPointerDown={() => setEarthAwake(true)} className="hero-matrix relative flex min-h-[100svh] items-end overflow-hidden px-5 pb-11 pt-28 sm:px-8 sm:pb-14 lg:px-12"><DottedEarthHero direction={isArabic ? "rtl" : "ltr"} motion={reduceMotion ? "reduced" : "full"} density={earthDensity} active={!reduceMotion || earthAwake} />
        <div className="nf-orb nf-orb-a" /><div className="nf-orb nf-orb-b" /><div className="nf-orb nf-orb-c" /><div className="hero-shade absolute inset-0" />
        <div className="hero-lines absolute inset-0" />
        <div className={`relative z-10 mx-auto grid w-full max-w-[1440px] gap-10 lg:items-end ${isArabic ? "lg:grid-cols-[minmax(0,1fr)_minmax(0,500px)]" : "lg:grid-cols-[minmax(0,570px)_1fr]"}`}>
          <div className={`nf-hero-copy max-w-[570px] ${isArabic ? "text-right lg:col-start-1 lg:max-w-[500px] lg:justify-self-end" : ""}`}>
            <motion.div initial={reduceMotion ? false : { opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .8, ease }}>
              <p className="nf-label hero-kicker text-[9px] text-white/70">// {t.heroKicker}</p>
              <h1 className="nf-hero-title nf-gradient-text mt-5 text-[3.5rem] font-semibold leading-[.88] tracking-[-.075em] sm:text-[5.45rem] lg:text-[6.5rem]">{t.hero}</h1>
              <p className="mt-7 max-w-xl text-lg leading-8 text-white/84 sm:text-xl">{t.heroBody}</p>
              <p className="mt-5 text-[13px] font-semibold text-white/68">{t.heroFoot}</p>
            </motion.div>
          </div>
          <div className="relative hidden h-[440px] lg:block">
            <motion.div initial={reduceMotion ? false : { opacity: 0, x: isArabic ? -32 : 32 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: .72, delay: .13, ease }} className={`nf-panel absolute bottom-5 w-[298px] p-5 ${isArabic ? "left-0 text-right" : "right-0"}`}>
              <p className="nf-label text-[8px] text-white/45">{t.consultantLabel} / {isArabic ? "مثال توضيحي" : "ILLUSTRATIVE EXAMPLE"}</p>
              <p className="mt-5 text-xl font-semibold tracking-[-.045em]">{isArabic ? "مش متأكد وين بتناسب؟" : "Not sure where you fit?"}</p>
              <p className="mt-3 text-xs leading-5 text-white/55">{isArabic ? "حديثك الحقيقي بيبلّش لما تختار تقابل المستشار." : "Your real conversation begins when you choose to meet the Consultant."}</p>
              <div className={`mt-7 flex items-center gap-2 ${isArabic ? "justify-end" : ""}`}><span className="h-1.5 w-1.5 rounded-full bg-white" /><span className="nf-label text-[8px] text-white/45">{isArabic ? "مثال / ٠١" : "EXAMPLE / 01"}</span></div>
            </motion.div>
          </div>
        </div>
        <button onClick={() => document.getElementById("journey")?.scrollIntoView({ behavior: "smooth" })} className={`nf-button absolute bottom-5 inline-flex items-center gap-2 text-[10px] text-white/65 ${isArabic ? "right-5 sm:right-8 lg:right-12" : "left-5 sm:left-8 lg:left-12"}`}><ArrowDown className="h-3.5 w-3.5" />{t.scroll}</button>
      </section>

      <section id="journey" className="section-rule relative bg-white/[.015] px-5 py-20 sm:px-8 sm:py-28 lg:px-12"><div aria-hidden className={`absolute bottom-0 top-0 border-dashed border-white/15 ${isArabic ? "right-5 border-r sm:right-8 lg:right-12" : "left-5 border-l sm:left-8 lg:left-12"}`} /><div className="mx-auto grid max-w-[1240px] gap-12 lg:grid-cols-[.9fr_1.1fr] lg:items-center"><Reveal><p className="nf-label text-[9px] text-white/45">// {t.sceneOneKicker}</p><h2 className="mt-5 text-5xl font-semibold leading-[.86] tracking-[-.075em] sm:text-6xl">{t.sceneOneTitle}</h2><p className="mt-6 max-w-lg text-lg leading-8 text-white/70 sm:text-xl">{t.sceneOneBody}</p></Reveal><Reveal className="mx-auto w-full max-w-[430px]"><div className="nf-panel bg-[#0c0e0f] p-4 shadow-[0_30px_100px_rgba(0,0,0,.55)]"><div className="flex items-center justify-between border-b border-white/10 pb-3"><span className="nf-label text-[8px] text-white/45">{t.consultantLabel}</span><span className="nf-label text-[8px] text-white/45">{t.consultantProgress}</span></div><p className="mt-10 text-2xl font-semibold leading-[.95] tracking-[-.055em]">{t.sceneOnePrompt}</p><TypedStudyField isArabic={isArabic} label={t.typedLabel} /><div className="mt-5 flex items-center justify-between"><span className="text-[10px] text-white/48">{t.consultantPace}</span><button type="button" onClick={() => go("/onboarding?entry=consult")} aria-label={t.consultantAction} className="nf-button inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-r from-[#9fdcff] to-[#d2a4ff] text-[#111] hover:brightness-110"><ChevronRight className={`h-4 w-4 ${isArabic ? "rotate-180" : ""}`} /></button></div></div></Reveal></div></section>

      <section className="section-rule px-5 py-20 sm:px-8 sm:py-28 lg:px-12"><div className="mx-auto grid max-w-[1240px] gap-12 lg:grid-cols-2 lg:items-center"><Reveal className="order-2 lg:order-1"><ResearchSet choices={t.researchChoices} isArabic={isArabic} language={language} /></Reveal><Reveal className="order-1 lg:order-2"><p className="nf-label text-[9px] text-white/45">// {t.sceneTwoKicker}</p><TypeInHeading text={t.sceneTwoTitle} className="mt-5 max-w-xl text-5xl font-semibold leading-[.86] tracking-[-.075em] sm:text-6xl" /><p className="mt-6 max-w-lg text-base leading-7 text-white/62 sm:text-lg sm:leading-8">{t.sceneTwoBody}</p></Reveal></div></section>

      <section className="section-rule px-5 py-20 sm:px-8 sm:py-28 lg:px-12"><div className="mx-auto grid max-w-[1240px] gap-12 lg:grid-cols-2 lg:items-center"><Reveal><p className="nf-label text-[9px] text-white/45">// {t.sceneThreeKicker}</p><TypeInHeading text={t.sceneThreeTitle} className="mt-5 max-w-xl text-5xl font-semibold leading-[.86] tracking-[-.075em] sm:text-6xl" /><p className="mt-6 max-w-lg text-base leading-7 text-white/62 sm:text-lg sm:leading-8">{t.sceneThreeBody}</p></Reveal><Reveal><div className="nf-panel bg-[#0c0e0f] p-4"><div className="flex items-center justify-between border-b border-white/10 pb-3"><span className="nf-label text-[8px] text-white/45">{t.journeyOverview}</span><span className="h-2 w-2 rounded-full bg-white" /></div><div className="mt-4 grid gap-px border border-white/10 bg-white/10 sm:grid-cols-3"><div className="bg-[#0c0e0f] p-4"><p className="nf-label text-[8px] text-white/40">{t.savedPlaces}</p><p className="mt-6 text-xl font-semibold tracking-[-.06em]">03</p><p className="mt-2 text-[10px] leading-4 text-white/55">{t.savedPlacesDetail}</p></div><div className="bg-[#0c0e0f] p-4"><p className="nf-label text-[8px] text-white/40">{t.milestones}</p><p className="mt-6 text-xl font-semibold tracking-[-.06em]">02 / 05</p><p className="mt-2 text-[10px] leading-4 text-white/55">{t.milestonesDetail}</p></div><div className="bg-[#0c0e0f] p-4"><p className="nf-label text-[8px] text-white/40">{t.nextReminder}</p><p className="mt-6 text-xl font-semibold tracking-[-.06em]">{t.nextReminderTitle}</p><p className="mt-2 text-[10px] leading-4 text-white/55">{t.nextReminderDetail}</p></div></div><div className="ownership-strip mt-5 grid gap-2 sm:grid-cols-3">{[t.controlOne, t.controlTwo, t.controlThree].map((item, index) => <div key={item} className="flex items-center gap-3 p-3"><span className="grid h-6 w-6 shrink-0 place-items-center border border-white/50 bg-white text-[#111]"><Check className="h-3.5 w-3.5" /></span><span><span className="nf-label block text-[7px] text-[#8be0da]">{t.ownership} / 0{index + 1}</span><strong className="mt-1 block text-[11px] font-medium leading-4 text-white">{item}</strong></span></div>)}</div></div></Reveal></div></section>

      <section id="trust" className="px-5 py-24 sm:px-8 sm:py-32 lg:px-12"><Reveal className="mx-auto max-w-[920px] text-center"><LockKeyhole className="mx-auto h-5 w-5 text-white/65" /><p className="mt-7 nf-label text-[9px] text-white/45">// {t.trustKicker}</p><h2 className="mt-5 text-5xl font-semibold leading-[.86] tracking-[-.075em] sm:text-7xl">{t.trustTitle}</h2><p className="mx-auto mt-7 max-w-2xl text-base leading-7 text-white/62">{t.trustBody}</p></Reveal></section>
      <section className="px-5 pb-20 sm:px-8 sm:pb-28 lg:px-12"><Reveal className="mx-auto max-w-[1160px] overflow-hidden rounded-[32px] border border-white/25 bg-gradient-to-br from-[#f7f5ef] via-[#dff4ff] to-[#ecdfff] p-7 text-[#111] shadow-[0_30px_120px_rgba(159,220,255,.18)] sm:p-12"><p className="nf-label text-[9px] text-black/55">// {t.closeKicker}</p><h2 className="mt-5 max-w-2xl text-5xl font-semibold leading-[.86] tracking-[-.08em] sm:text-7xl">{t.closeTitle}</h2><p className="mt-7 max-w-xl text-base leading-7 text-black/65">{t.closeBody}</p><div className="mt-10 flex flex-wrap items-center gap-5"><button onClick={() => go("/onboarding?entry=consult")} className="nf-button inline-flex items-center gap-3 bg-[#090b12] px-5 py-4 text-[10px] font-bold uppercase tracking-[.08em] text-white shadow-[0_18px_50px_rgba(9,11,18,.22)]">{t.closePrimary}<Sparkles className="h-4 w-4" /></button><button onClick={() => go("/login")} className="nf-button text-xs font-semibold text-black/65 underline underline-offset-4">{t.closeSecondary}</button></div></Reveal></section>
    </main>
    <footer className="border-t border-white/10 px-5 py-5 sm:px-8 lg:px-12"><div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4"><span className="nf-label text-[8px] text-white/40">{t.footer}</span><button onClick={() => go("/waitlist")} className="nf-label text-[8px] text-white/50 hover:text-white">{t.earlyList}</button></div></footer>
  </div>;
}
