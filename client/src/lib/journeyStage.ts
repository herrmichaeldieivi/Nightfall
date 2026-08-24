import type { JourneyTab } from "./journeyTabs";

export type JourneyStage = "orient" | "review_options" | "build_shortlist" | "choose" | "prepare" | "communicate" | "monitor";
export type JourneyDestination = "home" | JourneyTab;
export type JourneyPulseKind = "shortlist" | "deadline" | "attention" | "sources";

export type JourneyContext = {
  hasMatchingContext: boolean;
  savedProgrammeCount: number;
  priorityProgrammeCount: number;
  confirmedDeadlineCount: number;
  documentCount: number;
  confirmedContactCount: number;
  unreadReplyCount: number;
  draftCount: number;
  dueFollowUpCount: number;
  activeWatchCount: number;
  remainingConsultations: number;
};

export type JourneyPulse = {
  kind: JourneyPulseKind;
  value: number;
  status: "clear" | "attention" | "waiting";
};

export type JourneyAction = {
  destination: JourneyDestination;
  reason: "needs_direction" | "review_first_options" | "build_shortlist" | "compare_options" | "prepare_next_item" | "review_communication" | "review_sources";
};

export type JourneyHomeState = {
  stage: JourneyStage;
  pulse: JourneyPulse[];
  primaryAction: JourneyAction;
  secondaryAction?: JourneyAction;
  enabledTools: JourneyTab[];
  unavailableToolFallbacks: Partial<Record<JourneyTab, JourneyAction>>;
};

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

function stageFor(context: JourneyContext): JourneyStage {
  const activeCommunication = context.unreadReplyCount + context.draftCount + context.dueFollowUpCount > 0;
  if (activeCommunication) return "communicate";
  if (!context.hasMatchingContext) return "orient";
  if (context.savedProgrammeCount === 0) return "review_options";
  if (context.priorityProgrammeCount > 0) return "prepare";
  if (context.savedProgrammeCount === 1) return "build_shortlist";
  if (context.savedProgrammeCount >= 2) return "choose";
  if (context.confirmedContactCount > 0 || context.activeWatchCount > 0) return "monitor";
  return "review_options";
}

function primaryActionFor(stage: JourneyStage, context: JourneyContext): JourneyAction {
  switch (stage) {
    case "orient": return { destination: "consult", reason: "needs_direction" };
    case "review_options": return { destination: "discover", reason: "review_first_options" };
    case "build_shortlist": return { destination: "discover", reason: "build_shortlist" };
    case "choose": return { destination: "compare", reason: "compare_options" };
    case "prepare": {
      if (context.confirmedDeadlineCount > 0) return { destination: "calendar", reason: "prepare_next_item" };
      if (context.documentCount === 0) return { destination: "documents", reason: "prepare_next_item" };
      return { destination: "watch", reason: "prepare_next_item" };
    }
    case "communicate": return { destination: "reach", reason: "review_communication" };
    case "monitor": return { destination: context.activeWatchCount > 0 ? "watch" : "reach", reason: "review_sources" };
  }
}

function enabledToolsFor(stage: JourneyStage, context: JourneyContext): JourneyTab[] {
  const tools: JourneyTab[] = [];
  // Consult is the permanent safety net, not a one-time onboarding gate: it stays
  // reachable at every stage as long as the student has a re-interview left in
  // their cycle. It is a bounded resource (see remainingConsultations), not an
  // ongoing chat channel, so it never disappears outright the way a "finished"
  // onboarding step would.
  if (stage === "orient" || context.remainingConsultations > 0) tools.push("consult");
  // Discover is a one-time reveal, not a catalogue to browse forever: it stays a
  // primary destination only while the student hasn't yet built a shortlist.
  // Once they have 2+ saved programmes, re-entering Discover is an explicit,
  // secondary action (see "review more options" handling in JourneyTools),
  // not something sitting in the persistent tool set alongside their real work.
  if (context.hasMatchingContext && context.savedProgrammeCount < 2) tools.push("discover");
  if (context.savedProgrammeCount >= 2) tools.push("compare");
  if (context.priorityProgrammeCount > 0 || context.confirmedDeadlineCount > 0) tools.push("calendar", "documents", "watch");
  if (context.confirmedContactCount > 0 || stage === "communicate") tools.push("reach");
  return unique(tools);
}

function fallbacksFor(context: JourneyContext, enabledTools: JourneyTab[]): JourneyHomeState["unavailableToolFallbacks"] {
  const has = (tool: JourneyTab) => enabledTools.includes(tool);
  const direction: JourneyAction = { destination: "consult", reason: "needs_direction" };
  const firstOptions: JourneyAction = { destination: "discover", reason: "review_first_options" };
  const home: JourneyAction = { destination: "home", reason: "prepare_next_item" };
  return {
    ...(has("consult") ? {} : { consult: home }),
    ...(has("discover") ? {} : { discover: context.hasMatchingContext ? home : direction }),
    ...(has("compare") ? {} : { compare: context.savedProgrammeCount ? { destination: "discover", reason: "build_shortlist" } : firstOptions }),
    ...(has("calendar") ? {} : { calendar: context.savedProgrammeCount ? { destination: "home", reason: "prepare_next_item" } : firstOptions }),
    ...(has("documents") ? {} : { documents: context.savedProgrammeCount ? { destination: "home", reason: "prepare_next_item" } : firstOptions }),
    ...(has("watch") ? {} : { watch: context.savedProgrammeCount ? { destination: "home", reason: "prepare_next_item" } : firstOptions }),
    ...(has("reach") ? {} : { reach: context.confirmedContactCount ? { destination: "home", reason: "review_communication" } : { destination: "home", reason: "prepare_next_item" } }),
  };
}

export function resolveJourneyHome(context: JourneyContext): JourneyHomeState {
  const stage = stageFor(context);
  const enabledTools = enabledToolsFor(stage, context);
  const attentionCount = context.unreadReplyCount + context.draftCount + context.dueFollowUpCount;
  const pulse: JourneyPulse[] = [
    { kind: "shortlist", value: context.savedProgrammeCount, status: context.savedProgrammeCount ? "clear" : "waiting" },
    { kind: "deadline", value: context.confirmedDeadlineCount, status: context.confirmedDeadlineCount ? "clear" : "waiting" },
    { kind: "attention", value: attentionCount, status: attentionCount ? "attention" : "clear" },
    { kind: "sources", value: context.activeWatchCount, status: context.activeWatchCount ? "clear" : "waiting" },
  ];
  const primaryAction = primaryActionFor(stage, context);
  const secondaryAction = enabledTools.includes("consult") && primaryAction.destination !== "consult"
    ? { destination: "consult" as const, reason: "needs_direction" as const }
    : undefined;
  return { stage, pulse, primaryAction, secondaryAction, enabledTools, unavailableToolFallbacks: fallbacksFor(context, enabledTools) };
}

export function resolveJourneyDestination(context: JourneyContext, requested: JourneyTab): { destination: JourneyDestination; fallback?: JourneyAction } {
  const state = resolveJourneyHome(context);
  if (state.enabledTools.includes(requested)) return { destination: requested };
  const fallback = state.unavailableToolFallbacks[requested] ?? state.primaryAction;
  return { destination: fallback.destination, fallback };
}
