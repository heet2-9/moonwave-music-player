import { siteConfig } from "@/config/site";

export interface ShareOptions {
  blob: Blob;
  songTitle: string;
  artist: string;
  onSuccess?: () => void;
  onError?: (err: string) => void;
}

export interface ShareResult {
  success: boolean;
  method: "web-share" | "whatsapp-fallback" | "unsupported";
  message: string;
}

/**
 * Executes two-level sharing logic for karaoke audio recordings:
 * Level A: Browser Web Share API (navigator.share with File object)
 * Level B: WhatsApp URL fallback with prefilled text and manual attachment guidance
 */
export async function shareKaraokeRecording({
  blob,
  songTitle,
  artist,
}: ShareOptions): Promise<ShareResult> {
  const sanitizeName = (str: string) => str.replace(/[^a-zA-Z0-9_-]/g, "_");
  const ext = blob.type.includes("mp4") ? "m4a" : blob.type.includes("ogg") ? "ogg" : "webm";
  const fileName = `${siteConfig.girlfriendName} - ${sanitizeName(songTitle)} - Karaoke.${ext}`;
  const shareText = `Hey ❤️ I just recorded myself singing "${songTitle}" by ${artist} 🎤 on ${siteConfig.appName}!`;

  // Create File instance from Blob
  const file = new File([blob], fileName, {
    type: blob.type || "audio/webm",
    lastModified: Date.now(),
  });

  // Level A: Web Share API check for file support
  if (
    typeof navigator !== "undefined" &&
    navigator.share &&
    navigator.canShare &&
    navigator.canShare({ files: [file] })
  ) {
    try {
      await navigator.share({
        title: `${siteConfig.appName} Karaoke`,
        text: shareText,
        files: [file],
      });
      return {
        success: true,
        method: "web-share",
        message: "Recording shared successfully!",
      };
    } catch (err: any) {
      if (err.name === "AbortError") {
        return {
          success: false,
          method: "web-share",
          message: "Share cancelled by user.",
        };
      }
      console.warn("Web Share API failed, falling back to WhatsApp link:", err);
    }
  }

  // Level B: WhatsApp Fallback prefilled message
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
    `${shareText}\n\n(I've downloaded the recording "${fileName}" to my phone—attaching it here now!)`
  )}`;

  // Trigger file download automatically if fallback is used so user has the file ready to attach
  triggerFileDownload(blob, fileName);

  if (typeof window !== "undefined") {
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  }

  return {
    success: true,
    method: "whatsapp-fallback",
    message:
      "Opened WhatsApp with prefilled message! The audio file was downloaded to your device so you can attach it directly to the chat.",
  };
}

/**
 * Downloads recorded audio file locally to user's device
 */
export function downloadRecording(blob: Blob, songTitle: string) {
  const sanitizeName = (str: string) => str.replace(/[^a-zA-Z0-9_-]/g, "_");
  const ext = blob.type.includes("mp4") ? "m4a" : blob.type.includes("ogg") ? "ogg" : "webm";
  const fileName = `${siteConfig.girlfriendName} - ${sanitizeName(songTitle)} - Karaoke.${ext}`;
  triggerFileDownload(blob, fileName);
}

function triggerFileDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.style.display = "none";
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 1000);
}
