import { notFound } from "next/navigation";
// Any unknown address under /sq or /en shows our own 404 page (with the
// header, footer and language) instead of Next.js's plain default.
export default function CatchAll() {
  notFound();
}
