import { pageMetadata, type LocaleParams } from "@/lib/pageMetadata";

// The page itself is a client component, so its <title> is set here.
export const generateMetadata = ({ params: { locale } }: LocaleParams) => pageMetadata(locale, { title: "nav.contact", description: "contactPage.lead" });

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
