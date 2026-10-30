"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const PSYCHOLOGIST_ID = process.env.NEXT_PUBLIC_PSYCHOLOGIST_ID ?? "";

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [credentials, setCredentials] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [individualPrice, setIndividualPrice] = useState("");
  const [couplesPrice, setCouplesPrice] = useState("");
  const [cancellationPolicy, setCancellationPolicy] = useState("");
  const [notificationEmail, setNotificationEmail] = useState("");

  useEffect(() => {
    supabase
      .from("psychologists")
      .select("name, bio, credentials, default_meeting_link, individual_price, couples_price, cancellation_policy, notification_email")
      .eq("id", PSYCHOLOGIST_ID)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setName(data.name ?? "");
          setBio(data.bio ?? "");
          setCredentials(data.credentials ?? "");
          setMeetingLink(data.default_meeting_link ?? "");
          setIndividualPrice(data.individual_price ?? "");
          setCouplesPrice(data.couples_price ?? "");
          setCancellationPolicy(data.cancellation_policy ?? "");
          setNotificationEmail(data.notification_email ?? "");
        }
        setLoading(false);
      });
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    await supabase
      .from("psychologists")
      .update({
        name,
        bio,
        credentials,
        default_meeting_link: meetingLink,
        individual_price: individualPrice,
        couples_price: couplesPrice,
        cancellation_policy: cancellationPolicy,
        notification_email: notificationEmail,
      })
      .eq("id", PSYCHOLOGIST_ID);
    setSaving(false);
    setSaved(true);
  }

  const inputClass =
    "w-full rounded-lg border border-pine/15 dark:border-sage/15 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-pine dark:focus:border-sage";

  if (loading) return <p className="text-sm text-ink/50 dark:text-mist/50">Loading...</p>;

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl mb-8 text-ink dark:text-mist">Settings</h1>
      <form onSubmit={handleSave} className="space-y-5">
        <div>
          <label className="block text-xs text-ink/50 dark:text-mist/50 mb-1">Name</label>
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs text-ink/50 dark:text-mist/50 mb-1">Bio</label>
          <textarea
            className={`${inputClass} min-h-[100px]`}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs text-ink/50 dark:text-mist/50 mb-1">Credentials</label>
          <textarea
            className={`${inputClass} min-h-[80px]`}
            value={credentials}
            onChange={(e) => setCredentials(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs text-ink/50 dark:text-mist/50 mb-1">
            Video call link (Zoom / Google Meet — used for every video booking)
          </label>
          <input
            className={inputClass}
            placeholder="https://meet.google.com/xxx-xxxx-xxx"
            value={meetingLink}
            onChange={(e) => setMeetingLink(e.target.value)}
          />
          <p className="text-xs text-ink/40 dark:text-mist/40 mt-1">
            Use a personal recurring meeting room link — the same one gets sent to every patient
            who books a video session.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-ink/50 dark:text-mist/50 mb-1">Individual session price</label>
            <input
              className={inputClass}
              placeholder="e.g. €35 per session"
              value={individualPrice}
              onChange={(e) => setIndividualPrice(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs text-ink/50 dark:text-mist/50 mb-1">Couples session price</label>
            <input
              className={inputClass}
              placeholder="e.g. €50 per session"
              value={couplesPrice}
              onChange={(e) => setCouplesPrice(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-ink/50 dark:text-mist/50 mb-1">
            Notification email (where you'll get "new message" alerts)
          </label>
          <input
            className={inputClass}
            type="email"
            placeholder="you@example.com"
            value={notificationEmail}
            onChange={(e) => setNotificationEmail(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-xs text-ink/50 dark:text-mist/50 mb-1">Cancellation policy</label>
          <textarea
            className={`${inputClass} min-h-[90px]`}
            placeholder="e.g. Cancellations made at least 24 hours in advance are free of charge..."
            value={cancellationPolicy}
            onChange={(e) => setCancellationPolicy(e.target.value)}
          />
          <p className="text-xs text-ink/40 dark:text-mist/40 mt-1">
            Shown on the public Services page. Leave blank to show a placeholder instead.
          </p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-pine text-linen dark:bg-sage dark:text-charcoalGreen px-6 py-3 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save"}
        </button>
        {saved && <span className="ml-3 text-sm text-pine dark:text-sage">Saved</span>}
      </form>
    </div>
  );
}
