import { formatClinicDateTime } from "./timezone";

interface BookingEmailData {
  name: string;
  sessionType: "individual" | "couples";
  format: "video" | "chat" | "async";
  scheduledAt: string; // ISO string
  meetingLink?: string | null;
  manageUrl: string;
}

const copy = {
  en: {
    subject: "Your session is confirmed",
    greeting: (name: string) => `Hi ${name},`,
    body: "Your session has been booked. Here are the details:",
    sessionTypeLabel: "Type",
    formatLabel: "Format",
    whenLabel: "When",
    linkLabel: "Join link",
    linkPending: "You'll receive the video call link by email closer to your session.",
    sessionTypes: { individual: "Individual", couples: "Couples" },
    formats: { video: "Video Call", chat: "Live Chat", async: "Messaging" },
    manageLinkText: "Need to cancel? Manage your booking here",
    footer: "If you need to reschedule or cancel, just reply to this email.",
  },
  sq: {
    subject: "Seanca jote është konfirmuar",
    greeting: (name: string) => `Përshëndetje ${name},`,
    body: "Seanca jote është rezervuar. Këtu janë detajet:",
    sessionTypeLabel: "Lloji",
    formatLabel: "Formati",
    whenLabel: "Kur",
    linkLabel: "Lidhja për t'u bashkuar",
    linkPending: "Do ta marrësh lidhjen e video-thirrjes me email para seancës.",
    sessionTypes: { individual: "Individuale", couples: "Për Çifte" },
    formats: { video: "Video-thirrje", chat: "Bisedë e Drejtpërdrejtë", async: "Mesazhe" },
    manageLinkText: "Ke nevojë të anulosh? Menaxho rezervimin këtu",
    footer: "Nëse ke nevojë të riplanifikosh ose anulosh, thjesht përgjigju këtij emaili.",
  },
} as const;

export function buildConfirmationEmail(locale: "en" | "sq", data: BookingEmailData) {
  const t = copy[locale] ?? copy.en;
  const when = formatClinicDateTime(data.scheduledAt, locale, { dateStyle: "full", timeStyle: "short" });

  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: auto; color: #23302B;">
      <p>${t.greeting(data.name)}</p>
      <p>${t.body}</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr><td style="padding: 6px 0; color: #666;">${t.sessionTypeLabel}</td><td>${t.sessionTypes[data.sessionType]}</td></tr>
        <tr><td style="padding: 6px 0; color: #666;">${t.formatLabel}</td><td>${t.formats[data.format]}</td></tr>
        <tr><td style="padding: 6px 0; color: #666;">${t.whenLabel}</td><td>${when}</td></tr>
        ${
          data.meetingLink
            ? `<tr><td style="padding: 6px 0; color: #666;">${t.linkLabel}</td><td><a href="${data.meetingLink}">${data.meetingLink}</a></td></tr>`
            : ""
        }
      </table>
      ${!data.meetingLink && data.format === "video" ? `<p style="color: #666; font-size: 14px;">${t.linkPending}</p>` : ""}
      <p style="margin-top: 24px;"><a href="${data.manageUrl}" style="color: #2F4F44;">${t.manageLinkText}</a></p>
      <p style="color: #999; font-size: 13px; margin-top: 32px;">${t.footer}</p>
    </div>
  `;

  return { subject: t.subject, html };
}

const reminderCopy = {
  en: {
    subject: "Reminder: your session is tomorrow",
    greeting: (name: string) => `Hi ${name},`,
    body: "Just a quick reminder that your session is coming up:",
    whenLabel: "When",
    formatLabel: "Format",
    linkLabel: "Join link",
    footer: "See you then. Reply to this email if anything's changed.",
  },
  sq: {
    subject: "Kujtesë: seanca jote është nesër",
    greeting: (name: string) => `Përshëndetje ${name},`,
    body: "Vetëm një kujtesë e shkurtër që seanca jote po afron:",
    whenLabel: "Kur",
    formatLabel: "Formati",
    linkLabel: "Lidhja për t'u bashkuar",
    footer: "Shihemi atëherë. Përgjigju këtij emaili nëse diçka ka ndryshuar.",
  },
} as const;

export function buildReminderEmail(
  locale: "en" | "sq",
  data: { name: string; format: "video" | "chat" | "async"; scheduledAt: string; meetingLink?: string | null }
) {
  const t = reminderCopy[locale] ?? reminderCopy.en;
  const formatLabels = locale === "sq"
    ? { video: "Video-thirrje", chat: "Bisedë e Drejtpërdrejtë", async: "Mesazhe" }
    : { video: "Video Call", chat: "Live Chat", async: "Messaging" };
  const when = formatClinicDateTime(data.scheduledAt, locale, { dateStyle: "full", timeStyle: "short" });

  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: auto; color: #23302B;">
      <p>${t.greeting(data.name)}</p>
      <p>${t.body}</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr><td style="padding: 6px 0; color: #666;">${t.whenLabel}</td><td>${when}</td></tr>
        <tr><td style="padding: 6px 0; color: #666;">${t.formatLabel}</td><td>${formatLabels[data.format]}</td></tr>
        ${
          data.meetingLink
            ? `<tr><td style="padding: 6px 0; color: #666;">${t.linkLabel}</td><td><a href="${data.meetingLink}">${data.meetingLink}</a></td></tr>`
            : ""
        }
      </table>
      <p style="color: #999; font-size: 13px; margin-top: 32px;">${t.footer}</p>
    </div>
  `;

  return { subject: t.subject, html };
}

const cancellationCopy = {
  en: {
    subject: "Your session has been cancelled",
    greeting: (name: string) => `Hi ${name},`,
    body: "This confirms your session has been cancelled:",
    whenLabel: "Was scheduled for",
    footer: "Whenever you're ready, you're welcome to book a new time.",
  },
  sq: {
    subject: "Seanca jote është anuluar",
    greeting: (name: string) => `Përshëndetje ${name},`,
    body: "Ky email konfirmon që seanca jote është anuluar:",
    whenLabel: "Ishte planifikuar për",
    footer: "Sa herë të jesh gati, je e/i mirëpritur të rezervosh një kohë të re.",
  },
} as const;

export function buildCancellationEmail(locale: "en" | "sq", data: { name: string; scheduledAt: string }) {
  const t = cancellationCopy[locale] ?? cancellationCopy.en;
  const when = formatClinicDateTime(data.scheduledAt, locale, { dateStyle: "full", timeStyle: "short" });

  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: auto; color: #23302B;">
      <p>${t.greeting(data.name)}</p>
      <p>${t.body}</p>
      <p style="font-weight: 600; margin: 16px 0;">${t.whenLabel}: ${when}</p>
      <p style="color: #999; font-size: 13px; margin-top: 24px;">${t.footer}</p>
    </div>
  `;

  return { subject: t.subject, html };
}

const newMessageCopy = {
  en: {
    subject: "New message about your session",
    greeting: (name: string) => `Hi ${name},`,
    bodyToPatient: "You've received a new message from your therapist:",
    bodyToAdmin: (patientName: string) => `You've received a new message from ${patientName}:`,
    button: "View and reply",
    footer: "Sessions using chat or messaging are checked periodically, not instantly — reply whenever suits you.",
  },
  sq: {
    subject: "Mesazh i ri për seancën tënde",
    greeting: (name: string) => `Përshëndetje ${name},`,
    bodyToPatient: "Ke marrë një mesazh të ri nga terapistja jote:",
    bodyToAdmin: (patientName: string) => `Ke marrë një mesazh të ri nga ${patientName}:`,
    button: "Shiko dhe përgjigju",
    footer: "Seancat me bisedë ose mesazhe kontrollohen periodikisht, jo menjëherë — përgjigju sa herë të përshtatet.",
  },
} as const;

export function buildNewMessageEmail(
  locale: "en" | "sq",
  data: { recipientName: string; messagePreview: string; link: string; isForAdmin: boolean; patientName?: string }
) {
  const t = newMessageCopy[locale] ?? newMessageCopy.en;
  const body = data.isForAdmin ? t.bodyToAdmin(data.patientName ?? "") : t.bodyToPatient;

  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: auto; color: #23302B;">
      <p>${t.greeting(data.recipientName)}</p>
      <p>${body}</p>
      <blockquote style="border-left: 3px solid #C08974; padding-left: 14px; color: #555; margin: 16px 0;">
        ${data.messagePreview}
      </blockquote>
      <p style="margin: 24px 0;"><a href="${data.link}" style="background:#2F4F44;color:#fff;padding:12px 24px;border-radius:999px;text-decoration:none;">${t.button}</a></p>
      <p style="color: #999; font-size: 13px;">${t.footer}</p>
    </div>
  `;

  return { subject: t.subject, html };
}
