"use client";

// Voice call overlays are now managed globally by VoiceCallProvider in AppLayout.
// This component returns null to prevent duplicate UI rendering or unmount cleanup issues.
export default function TogetherVoiceCall() {
  return null;
}
