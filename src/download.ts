import { showToast } from "./state";

type NavigatorWithFiles = Navigator & {
  canShare?: (data: ShareData & { files?: File[] }) => boolean;
  share?: (data: ShareData & { files?: File[] }) => Promise<void>;
};

function isAppleTouchDevice(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function downloadWithAnchor(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function saveFile(blob: Blob, fileName: string, title: string, successMessage: string, appleMessage = "Choose Save to Files"): Promise<void> {
  const nav = navigator as NavigatorWithFiles;
  const file = new File([blob], fileName, { type: blob.type || "application/octet-stream" });
  if (isAppleTouchDevice() && nav.share && (!nav.canShare || nav.canShare({ files: [file] }))) {
    try {
      await nav.share({ title, files: [file] });
      showToast(appleMessage);
      return;
    } catch (error) {
      if ((error as Error).name === "AbortError") return;
    }
  }
  downloadWithAnchor(blob, fileName);
  showToast(successMessage);
}
