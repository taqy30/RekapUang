export const DEFAULT_FEEDBACK_TO = "taqy.nabil.adriano@gmail.com";

export const FEEDBACK_TYPE_LABELS = {
  saran: "Saran fitur",
  masalah: "Laporkan masalah",
  lainnya: "Lainnya",
} as const;

export type FeedbackType = keyof typeof FEEDBACK_TYPE_LABELS;

export function getFeedbackRecipient(): string {
  return (
    process.env.FEEDBACK_TO?.trim() ||
    process.env.SMTP_USER?.trim() ||
    DEFAULT_FEEDBACK_TO
  );
}
