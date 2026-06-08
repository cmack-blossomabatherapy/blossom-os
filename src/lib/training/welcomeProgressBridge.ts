import { markModuleComplete } from "@/lib/onboarding/storage";
import {
  getProgress,
  markTrainingComplete,
  SD_JOURNEY_MODULE_IDS,
} from "@/lib/training/academyData";
import { WELCOME_TO_BLOSSOM_MODULES } from "@/lib/training/welcomeToBlossomContent";

export const WELCOME_TO_SD_TRAINING_ID: Record<string, string> = {
  "welcome-video-from-blossom": "sd-w1d1-welcome-video-from-blossom",
  "welcome-mission-vision": "sd-w1d1-mission-vision",
  "welcome-core-values": "sd-w1d1-core-values",
  "welcome-meet-the-team": "sd-w1d1-meet-the-team",
  "welcome-how-blossom-works": "sd-w1d1-how-blossom-works",
  "welcome-letter-chad": "sd-w1d1-welcome-from-chad-kaufman",
  "welcome-letter-shira": "sd-w1d1-a-note-from-shira-lasry",
};

export const SD_TRAINING_TO_WELCOME_ID: Record<string, string> = Object.fromEntries(
  Object.entries(WELCOME_TO_SD_TRAINING_ID).map(([welcomeId, trainingId]) => [trainingId, welcomeId]),
);

export function isWelcomeModuleComplete(welcomeId: string, modulesComplete: string[] = []) {
  const sdTrainingId = WELCOME_TO_SD_TRAINING_ID[welcomeId];
  return modulesComplete.includes(welcomeId) || Boolean(sdTrainingId && getProgress(sdTrainingId).status === "completed");
}

export function completeWelcomeModuleEverywhere(welcomeId: string) {
  markModuleComplete(welcomeId);
  const sdTrainingId = WELCOME_TO_SD_TRAINING_ID[welcomeId];
  if (sdTrainingId) markTrainingComplete(sdTrainingId);
}

export function completeWelcomeTrainingEverywhere(trainingId: string) {
  const welcomeId = SD_TRAINING_TO_WELCOME_ID[trainingId];
  if (welcomeId) markModuleComplete(welcomeId);
  markTrainingComplete(trainingId);
}

export function getNextStateDirectorTrainingPath() {
  const nextWelcomeModule = WELCOME_TO_BLOSSOM_MODULES.find(
    (module) => getProgress(WELCOME_TO_SD_TRAINING_ID[module.id]).status !== "completed",
  );
  if (nextWelcomeModule) return `/training/${WELCOME_TO_SD_TRAINING_ID[nextWelcomeModule.id]}`;

  const welcomeTrainingIds = new Set(Object.values(WELCOME_TO_SD_TRAINING_ID));
  const nextSdModule = SD_JOURNEY_MODULE_IDS.find(
    (id) => !welcomeTrainingIds.has(id) && getProgress(id).status !== "completed",
  );
  return nextSdModule ? `/training/${nextSdModule}` : "/training";
}