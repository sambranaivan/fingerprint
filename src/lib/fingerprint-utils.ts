
export interface DeviceFingerprint {
  // Screen Information
  ScreenResolution: string;
  ColorDepth: number;

  // Timezone Information
  Timezone: string;

  // Language Information
  Language: string;

  // Canvas Fingerprint
  CanvasFingerprint: string | null;

  // WebGL Information
  WebGLVendor: string | null;
  WebGLRenderer: string | null;

  // Browser Information
  UserAgent: string;
  Platform: string;
  CookiesEnabled: boolean;
  DoNotTrack: string | null;

  // Hardware Information
  CpuCores?: number;
  DeviceMemory?: number; // In GB
}

// Updated asynchronous hashString function
async function hashString(str: string): Promise<string> {
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    // Fallback for environments without crypto.subtle (e.g., non-secure contexts or older Node.js)
    // This is a simple non-cryptographic hash, not as robust as SHA-256
    console.warn("crypto.subtle not available, using fallback hashing. Fingerprint hash will be less secure.");
    let hash = 0;
    if (str.length === 0) {
      return hash.toString(16);
    }
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(16);
  }
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Helper to get Canvas Fingerprint
function getCanvasFingerprintInternal(): string | null {
  if (typeof document === 'undefined') return null;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 60;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return null;
    }

    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const text = "BrowserCanvasTest! 🎨";
    ctx.textBaseline = 'alphabetic';
    ctx.font = '16pt "Arial"';
    ctx.fillStyle = '#069';
    ctx.fillText(text, 5, 25);

    ctx.fillStyle = 'rgba(255, 0, 255, 0.7)';
    ctx.fillRect(10, 30, 75, 15);
    ctx.fillStyle = 'rgba(0, 255, 0, 0.6)';
    ctx.beginPath();
    ctx.arc(150, 30, 15, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.fill();
    
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    gradient.addColorStop(0, "magenta");
    gradient.addColorStop(0.5 ,"blue");
    gradient.addColorStop(1.0, "red");
    ctx.fillStyle = gradient;
    ctx.fillText("More text for fingerprinting.", 5, 50);

    const dataURL = canvas.toDataURL();
    // For canvas fingerprint, we use a synchronous simple hash because crypto.subtle is async
    // and getDeviceFingerprint needs to remain synchronous for now.
    // A more robust solution might involve making getDeviceFingerprint async.
    let hash = 0;
    if (dataURL.length === 0) return hash.toString(16);
    for (let i = 0; i < dataURL.length; i++) {
      const char = dataURL.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(16);
  } catch (e) {
    return null;
  }
}

// Helper to get WebGL Information
interface WebGLInfo {
  webGLVendor: string | null;
  webGLRenderer: string | null;
}

function getWebGLInfoInternal(): WebGLInfo {
  if (typeof document === 'undefined') return { webGLVendor: null, webGLRenderer: null };
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    if (gl && gl instanceof WebGLRenderingContext) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      const vendor = debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : null;
      const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : null;
      return {
        webGLVendor: typeof vendor === 'string' ? vendor : null,
        webGLRenderer: typeof renderer === 'string' ? renderer : null,
      };
    }
  } catch (e) {
    // Error retrieving WebGL info
  }
  return { webGLVendor: null, webGLRenderer: null };
}

// Helper for Screen Information
function getScreenInfo(): { screenResolution: string; colorDepth: number } {
  if (typeof window === 'undefined' || !window.screen) return { screenResolution: 'N/A', colorDepth: 0};
  return {
    screenResolution: `${window.screen.width}x${window.screen.height}`,
    colorDepth: window.screen.colorDepth,
  };
}

// Helper for Timezone Information
function getTimezoneInfo(): { timezone: string } {
  if (typeof Intl === 'undefined' || !Intl.DateTimeFormat) return { timezone: 'N/A'};
  return {
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
}

// Helper for Language Information
function getLanguageInfo(): { language: string } {
  if (typeof navigator === 'undefined' || !navigator.language) return { language: 'N/A'};
  return {
    language: navigator.language,
  };
}

// Helper for Browser Information
function getBrowserInfo(): { userAgent: string; platform: string; cookiesEnabled: boolean; doNotTrack: string | null; } {
  if (typeof navigator === 'undefined') return { userAgent: 'N/A', platform: 'N/A', cookiesEnabled: false, doNotTrack: null};
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    cookiesEnabled: navigator.cookieEnabled,
    doNotTrack: navigator.doNotTrack === "1" ? "Enabled" : navigator.doNotTrack === "0" ? "Disabled" : "Unspecified",
  };
}

// Helper for Hardware Information
function getHardwareInfo(): { cpuCores?: number; deviceMemory?: number } {
  if (typeof navigator === 'undefined') return { cpuCores: undefined, deviceMemory: undefined};
  return {
    cpuCores: navigator.hardwareConcurrency,
    deviceMemory: (navigator as any).deviceMemory,
  };
}


export function getDeviceFingerprint(): DeviceFingerprint | null {
  if (typeof window === 'undefined' || typeof navigator === 'undefined' || typeof document === 'undefined') {
    return null;
  }

  const screenInfo = getScreenInfo();
  const timezoneInfo = getTimezoneInfo();
  const languageInfo = getLanguageInfo();
  const canvasFingerprint = getCanvasFingerprintInternal();
  const webGLInfo = getWebGLInfoInternal();
  const browserInfo = getBrowserInfo();
  const hardwareInfo = getHardwareInfo();

  return {
    // Screen Information
    ScreenResolution: screenInfo.screenResolution,
    ColorDepth: screenInfo.colorDepth,
    // Timezone Information
    Timezone: timezoneInfo.timezone,
    // Language Information
    Language: languageInfo.language,
    // Canvas Fingerprint
    CanvasFingerprint: canvasFingerprint,
    // WebGL Information
    WebGLVendor: webGLInfo.webGLVendor,
    WebGLRenderer: webGLInfo.webGLRenderer,
    // Browser Information
    UserAgent: browserInfo.userAgent,
    Platform: browserInfo.platform,
    CookiesEnabled: browserInfo.cookiesEnabled,
    DoNotTrack: browserInfo.doNotTrack,
    // Hardware Information
    CpuCores: hardwareInfo.cpuCores,
    DeviceMemory: hardwareInfo.deviceMemory,
  };
}

// Updated to be an async function
export async function generateFingerprintHash(fingerprint: DeviceFingerprint | null): Promise<string | null> {
  if (!fingerprint) return null;
  // Define a specific order of keys to ensure consistent hash generation
  const orderedKeys: (keyof DeviceFingerprint)[] = [
    'ScreenResolution', 'ColorDepth', 'Timezone', 'Language',
    'CanvasFingerprint', 'WebGLVendor', 'WebGLRenderer', 'UserAgent',
    'Platform', 'CookiesEnabled', 'DoNotTrack', 'CpuCores', 'DeviceMemory'
  ];

  const components = orderedKeys.map(key => {
    const value = fingerprint[key];
    if (value === null || typeof value === 'undefined') {
      return 'null'; // Consistent representation for null/undefined
    }
    return String(value);
  });

  const fingerprintString = components.join('|');
  return await hashString(fingerprintString); // Await the async hashString
}
