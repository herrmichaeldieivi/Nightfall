import { useAuth } from "@/_core/hooks/useAuth";
import { JourneyHome } from "@/components/JourneyHome";
import { DecisionRoom, type DecisionRoomMatch } from "@/components/DecisionRoom";
import { LanguageToggle, usePublicLanguage } from "@/components/LanguageToggle";
import { resolveJourneyDestination, resolveJourneyHome, type JourneyAction, type JourneyDestination } from "@/lib/journeyStage";
import { journeyTabFromSearch } from "@/lib/journeyTabs";
import { trpc } from "@/lib/trpc";
import JourneyToolsLegacy from "@/screens/JourneyToolsLegacy";
import { ChevronDown, Heart, Loader2, Wrench } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";

const labels = {
  en: { tools: "MY TOOLS", close: "Close", fallback: "Nightfall brought you to the step that makes this useful first.", tab: { consult: "Consultant", discover: "Explore options", compare: "Compare", reach: "Reach university", calendar: "Dates", watch: "Source watch", documents: "Documents" } },
  ar: { tools: "ط£ط¯ظˆط§طھظٹ", close: "ط¥ط؛ظ„ط§ظ‚", fallback: "ظ†ط§ظٹطھظپظˆظ„ ط±ط¬ظ‘ط¹طھظƒ ظ„ظ„ط®ط·ظˆط© ط§ظ„ظ„ظٹ ط¨طھط®ظ„ظٹ ظ‡ط§ظ„ط£ط¯ط§ط© ظ…ظپظٹط¯ط© ط¨ط§ظ„ط£ظˆظ„.", tab: { consult: "ط§ظ„ظ…ط³طھط´ط§ط±", discover: "ط§ط³طھظƒط´ظپ ط®ظٹط§ط±ط§طھ", compare: "ظ‚ط§ط±ظ†", reach: "طھظˆط§طµظ„ ظ…ط¹ ط§ظ„ط¬ط§ظ…ط¹ط©", calendar: "ط§ظ„ظ…ظˆط§ط¹ظٹط¯", watch: "ظ…ط±ط§ظ‚ط¨ط© ط§ظ„ظ…طµط§ط¯ط±", documents: "ط§ظ„ط£ظˆط±ط§ظ‚" } },
} as const;

function dashboardLocation(destination: JourneyDestination) {
  const params = new URLSearchParams(window.location.search);
  if (destination === "home") params.delete("tab");
  else params.set("tab", destination);
  const search = params.toString();
  return `/dashboard${search ? `?${search}` : ""}`;
}

export default function JourneyTools() {
  const [, setLocation] = useLocation();
  const { user, loading } = useAuth();
  const { language, isArabic, setLanguage } = usePublicLanguage();
  const t = labels[language];
  const [toolsOpen, setToolsOpen] = useState(false);

  const profile = trpc.student.profile.useQuery(undefined, { enabled: !!user });
  const fitProfile = trpc.student.fitProfile.useQuery(undefined, { enabled: !!user });
  const consultationCycle = trpc.student.consultationCycle.useQuery(undefined, { enabled: !!user });
  const savedGermanyProgrammes = trpc.student.savedGermanyProgrammes.useQuery(undefined, { enabled: !!user });
  const universities = trpc.student.universities.useQuery(undefined, { enabled: !!user });
  const documents = trpc.student.documents.useQuery(undefined, { enabled: !!user });
  const deadlineHandoffs = trpc.student.germanyProgrammeDeadlineHandoffs.useQuery(undefined, { enabled: !!user });
  const relationship = trpc.student.universityRelationshipWorkspace.useQuery(undefined, { enabled: !!user });
  const germanyProgrammeMatches = trpc.student.germanyProgrammeMatches.useQuery(undefined, { enabled: !!user });
  const utils = trpc.useUtils();
  const saveGermanyProgramme = trpc.student.saveGermanyProgramme.useMutation({ onSuccess: () => void utils.student.savedGermanyProgrammes.invalidate() });

  useEffect(() => {
    if (!loading && !user) setLocation(`/login?lang=${language}`);
    if (!loading && user && !profile.isLoading && !profile.data?.onboardingComplete) setLocation(`/student-onboarding?lang=${language}`);
  }, [language, loading, profile.data, profile.isLoading, setLocation, user]);

  const journeyContext = useMemo(() => {
    const programmes = savedGermanyProgrammes.data ?? [];
    const contacts = relationship.data?.contacts ?? [];
    const communications = relationship.data?.communications ?? [];
    const followUps = relationship.data?.followUpPlans ?? [];
    const fallbackUniversityCount = (universities.data ?? []).length;
    return {
      hasMatchingContext: Boolean(fitProfile.data?.matchingConsentAt && fitProfile.data.studyDirection.trim()),
      savedProgrammeCount: programmes.length || fallbackUniversityCount,
      priorityProgrammeCount: programmes.filter((programme) => programme.isPinned || (programme.priorityRank !== null && programme.priorityRank !== undefined)).length,
      confirmedDeadlineCount: (deadlineHandoffs.data ?? []).length,
      documentCount: (documents.data ?? []).length,
      confirmedContactCount: contacts.filter((contact) => Boolean(contact.studentConfirmedAt)).length,
      unreadReplyCount: communications.filter((communication) => communication.direction === "inbound" && communication.status === "needs_review").length,
      draftCount: communications.filter((communication) => communication.direction === "outbound" && ["draft", "ready_for_review", "student_approved"].includes(communication.status)).length,
      dueFollowUpCount: followUps.filter((plan) => plan.status === "draft_ready").length,
      activeWatchCount: 0,
      remainingConsultations: consultationCycle.data?.remainingUses ?? 0,
    };
  }, [consultationCycle.data, deadlineHandoffs.data, documents.data, fitProfile.data, relationship.data, savedGermanyProgrammes.data, universities.data]);

  const state = useMemo(() => resolveJourneyHome(journeyContext), [journeyContext]);
  const search = typeof window === "undefined" ? "" : window.location.search;
  const requestedTab = journeyTabFromSearch(search);
  const hasRequestedTool = new URLSearchParams(search).has("tab");
  const requestedDestination: { destination: JourneyDestination; fallback?: JourneyAction } = hasRequestedTool ? resolveJourneyDestination(journeyContext, requestedTab) : { destination: "home" };
  const discoveryMode = new URLSearchParams(search).get("mode");
  const showDecisionRoom = requestedDestination.destination === "discover" && !requestedDestination.fallback && discoveryMode !== "explore";
  const journeyDataLoading = fitProfile.isLoading || savedGermanyProgrammes.isLoading || universities.isLoading || documents.isLoading || deadlineHandoffs.isLoading || relationship.isLoading || consultationCycle.isLoading;

  useEffect(() => {
    if (!journeyDataLoading && requestedDestination.fallback) setLocation(dashboardLocation(requestedDestination.destination));
  }, [journeyDataLoading, requestedDestination.destination, requestedDestination.fallback, setLocation]);

  const go = (destination: JourneyDestination) => {
    setToolsOpen(false);
    setLocation(dashboardLocation(destination));
  };
  const onAction = (action: JourneyAction) => {
    if (action.reason === "compare_options" && (savedGermanyProgrammes.data ?? []).length >= 2) {
      const params = new URLSearchParams(window.location.search);
      params.set("tab", "discover");
      params.set("mode", "explore");
      params.set("compare", "all");
      setLocation(`/dashboard?${params.toString()}`);
      return;
    }
    go(action.destination);
  };
  const programmes = useMemo(() => {
    const germany = (savedGermanyProgrammes.data ?? []).map((programme) => ({ id: programme.programmeId, programme: programme.programmeName, university: programme.officialName, city: programme.city, isPriority: Boolean(programme.isPinned || programme.priorityRank !== null), sourceUrl: programme.officialProgrammeUrl ?? programme.programmeEvidenceUrl }));
    if (germany.length) return germany;
    return (universities.data ?? []).map((university) => ({ id: String(university.id), programme: university.program, university: university.university, city: university.location, isPriority: false, sourceUrl: null }));
  }, [savedGermanyProgrammes.data, universities.data]);
  const attentionItems = useMemo(() => {
    const communications = relationship.data?.communications ?? [];
    const followUps = relationship.data?.followUpPlans ?? [];
    const messages = communications.filter((communication) => communication.direction === "inbound" && communication.status === "needs_review").map((communication) => ({ id: `reply-${communication.id}`, kind: "reply" as const, title: language === "ar" ? "ظˆطµظ„ ط±ط¯ ظ…ظ† ط¬ط§ظ…ط¹ط©" : "A university reply is ready to review", detail: communication.subject }));
    const drafts = communications.filter((communication) => communication.direction === "outbound" && ["ready_for_review", "student_approved"].includes(communication.status)).map((communication) => ({ id: `draft-${communication.id}`, kind: "draft" as const, title: language === "ar" ? "ظ…ط³ظˆط¯ط© ط¨ط§ظ†طھط¸ط§ط±ظƒ" : "A draft is waiting", detail: communication.subject }));
    const due = followUps.filter((plan) => plan.status === "draft_ready").map((plan) => ({ id: `follow-up-${plan.id}`, kind: "follow_up" as const, title: language === "ar" ? "ظ…طھط§ط¨ط¹ط© ط¬ط§ظ‡ط²ط© ظ„ظ„ظ…ط±ط§ط¬ط¹ط©" : "A follow-up is ready for review", detail: plan.university }));
    const dates = (deadlineHandoffs.data ?? []).slice(0, 2).map((handoff) => ({ id: `deadline-${handoff.programmeId}`, kind: "deadline" as const, title: language === "ar" ? "ظ…ظˆط¹ط¯ ظ…ط­ظپظˆط¸" : "A saved programme date", detail: handoff.programmeName }));
    return [...messages, ...drafts, ...due, ...dates];
  }, [deadlineHandoffs.data, language, relationship.data]);
  const openExploration = () => {
    const params = new URLSearchParams(window.location.search);
    params.set("tab", "discover");
    params.set("mode", "explore");
    setLocation(`/dashboard?${params.toString()}`);
  };
  const decisionMatches = (germanyProgrammeMatches.data?.decisionRoom?.matches ?? []) as DecisionRoomMatch[];

  if (loading || profile.isLoading || journeyDataLoading || !user || !profile.data?.onboardingComplete) return <div className="nf-shell grid min-h-screen place-items-center text-white"><Loader2 className="h-5 w-5 animate-spin" /></div>;

  if (requestedDestination.destination !== "home" && !requestedDestination.fallback && !showDecisionRoom) return <JourneyToolsLegacy />;

  const name = user.name?.split(" ")[0] ?? (language === "ar" ? "طµط¯ظٹظ‚ظٹ" : "there");
  // Consult's availability is fully governed by resolveJourneyHome/enabledToolsFor now
  // (stage === "orient", or remainingConsultations > 0) â€” it is a bounded, permanent
  // safety net rather than a step that vanishes the instant onboarding finishes.
  const toolEntries = state.enabledTools;
  return <div dir={isArabic ? "rtl" : "ltr"} className="night-bloom min-h-screen overflow-x-hidden text-white">
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0b0d0e]/92 px-5 py-4 backdrop-blur-xl sm:px-8"><div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4"><button onClick={() => go("home")} className="flex items-center gap-3 text-left"><span className="grid h-9 w-9 place-items-center border border-white/65"><Heart className="h-3.5 w-3.5 fill-white text-white" /></span><span><span className="block text-sm font-semibold tracking-[.16em]">NIGHTFALL</span><span className="nf-label mt-1 block text-[8px] text-[#909a94]">{language === "ar" ? "ط±ط­ظ„طھظٹ" : "MY JOURNEY"}</span></span></button><div className="flex items-center gap-2"><div className="relative"><button type="button" onClick={() => setToolsOpen((open) => !open)} aria-expanded={toolsOpen} className="nf-button inline-flex items-center gap-2 border border-white/15 px-3 py-2 text-[10px] font-semibold tracking-[.07em] text-[#d7dfda] hover:border-white/45"><Wrench className="h-3.5 w-3.5" />{t.tools}<ChevronDown className={`h-3 w-3 transition-transform ${toolsOpen ? "rotate-180" : ""}`} /></button>{toolsOpen && <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-56 border border-white/20 bg-[#171717] p-1.5 shadow-[0_22px_60px_rgba(0,0,0,.48)]"><p className="px-2.5 pb-1.5 pt-1 nf-label text-[8px] text-white/42">{t.tools}</p>{toolEntries.map((tab) => <button key={tab} type="button" onClick={() => { if (tab === "discover") openExploration(); else if (tab === "compare") onAction({ destination: "compare", reason: "compare_options" }); else go(tab); }} className="block w-full px-2.5 py-2.5 text-left text-[11px] font-semibold text-white/70 transition-colors hover:bg-white/[.07] hover:text-white">{t.tab[tab]}</button>)}{!toolEntries.length && <p className="px-2.5 py-3 text-xs leading-5 text-white/45">{t.fallback}</p>}</div>}</div><LanguageToggle language={language} onChange={setLanguage} /></div></div></header>
    <main className="mx-auto max-w-[1400px] px-5 py-8 sm:px-8 sm:py-10 lg:px-12">{showDecisionRoom ? <DecisionRoom language={language} matches={decisionMatches} savedProgrammeIds={new Set((savedGermanyProgrammes.data ?? []).map((programme) => programme.programmeId))} isSavingProgrammeId={saveGermanyProgramme.isPending ? saveGermanyProgramme.variables?.programmeId : undefined} onKeep={(programmeId) => saveGermanyProgramme.mutate({ programmeId }, { onSuccess: () => setLocation(dashboardLocation("home")) })} onExplore={openExploration} onAdjustDirection={() => go("consult")} /> : <JourneyHome language={language} name={name} state={state} programmes={programmes} attentionItems={attentionItems} onAction={onAction} onOpenTools={() => setToolsOpen(true)} />}</main>
  </div>;
}