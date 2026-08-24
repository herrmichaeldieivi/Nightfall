import { createHeartbeatJob, updateHeartbeatJob } from "../_core/heartbeat";
import {
  getReminderPreferences,
  saveReminderPreferences,
  setReminderScheduleTaskUid,
} from "../db";
import {
  getUniversityWatchPreferences,
  saveUniversityRequirementWatch,
  saveUniversityWatchPreferences,
  setUniversityWatchScheduleTaskUid,
} from "../universityWatch";
import { primeUniversityRequirementWatch } from "../requirementsWatchRunner";

type UserId = Parameters<typeof saveReminderPreferences>[0];


export type ReminderSettings = { enabled: boolean; remindSevenDays: boolean; remindThreeDays: boolean; remindOneDay: boolean; preferredHourUtc: number };
export type WatchSettings = { enabled: boolean; preferredHourUtc: number };

export async function updateReminderPreferencesWithSchedule(userId: UserId, input: ReminderSettings, sessionToken: string) {
  const preferences = await saveReminderPreferences(userId, input);
  const cron = `0 0 ${input.preferredHourUtc} * * *`;
  if (preferences?.scheduleCronTaskUid) {
    await updateHeartbeatJob(preferences.scheduleCronTaskUid, { cron, path: "/api/scheduled/deadline-nudges", description: "Nightfall deadline nudges", enable: input.enabled }, sessionToken);
  } else if (input.enabled) {
    const job = await createHeartbeatJob({ name: `nightfall-deadline-nudges-${userId}`, cron, path: "/api/scheduled/deadline-nudges", description: "Nightfall deadline nudges" }, sessionToken);
    await setReminderScheduleTaskUid(userId, job.taskUid);
  }
  return getReminderPreferences(userId);
}

export async function updateUniversityWatchPreferencesWithSchedule(userId: UserId, input: WatchSettings, sessionToken: string) {
  const preferences = await saveUniversityWatchPreferences(userId, input);
  const cron = `0 0 ${input.preferredHourUtc} * * 1`;
  if (preferences?.scheduleCronTaskUid) {
    await updateHeartbeatJob(preferences.scheduleCronTaskUid, { cron, path: "/api/scheduled/university-requirements", description: "Nightfall official-page requirements watch", enable: input.enabled }, sessionToken);
  } else if (input.enabled) {
    const job = await createHeartbeatJob({ name: `nightfall-university-watch-${userId}`, cron, path: "/api/scheduled/university-requirements", description: "Nightfall official-page requirements watch" }, sessionToken);
    await setUniversityWatchScheduleTaskUid(userId, job.taskUid);
  }
  return getUniversityWatchPreferences(userId);
}

export async function syncRequirementWatch(userId: UserId, input: Parameters<typeof saveUniversityRequirementWatch>[1]) {
  const watch = await saveUniversityRequirementWatch(userId, input);
  if (watch?.enabled) await primeUniversityRequirementWatch({ userId, watch });
  return watch;
}
