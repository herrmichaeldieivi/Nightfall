export function shouldResumePendingConsultantInterview(isAuthenticated: boolean, hasPendingInterview: boolean) {
  return isAuthenticated && hasPendingInterview;
}

export function shouldRedirectCompletedProfile(onboardingComplete: boolean, hasPendingInterview: boolean) {
  return onboardingComplete && !hasPendingInterview;
}
