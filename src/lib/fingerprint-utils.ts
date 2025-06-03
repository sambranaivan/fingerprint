export interface DeviceFingerprint {
  UserAgent: string;
  ScreenResolution: string;
  ColorDepth: number;
  Timezone: string;
  Language: string;
  Platform: string;
  CpuCores?: number;
  DeviceMemory?: number; // In GB
  CookiesEnabled: boolean;
  DoNotTrack?: string | null;
}

export function getDeviceFingerprint(): DeviceFingerprint | null {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return null;
  }
  return {
    UserAgent: navigator.userAgent,
    ScreenResolution: `${window.screen.width}x${window.screen.height}`,
    ColorDepth: window.screen.colorDepth,
    Timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    Language: navigator.language,
    Platform: navigator.platform,
    CpuCores: navigator.hardwareConcurrency,
    DeviceMemory: (navigator as any).deviceMemory,
    CookiesEnabled: navigator.cookieEnabled,
    DoNotTrack: navigator.doNotTrack === "1" ? "Enabled" : navigator.doNotTrack === "0" ? "Disabled" : "Unspecified",
  };
}
