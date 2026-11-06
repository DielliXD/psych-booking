// Privacy Policy and Terms of Use content, in Albanian and English.
//
// ⚠️ This is a solid starting point written against Kosovo's Law No. 06/L-082
// on the Protection of Personal Data (which follows the EU GDPR), but it is
// not legal advice. Have a lawyer or the Information and Privacy Agency
// review it before the site is used with real patients.
//
// Practice details live in one place — update PRACTICE when the business is
// registered (add the business name and registration number) and bump
// LAST_UPDATED whenever the text changes.

import { PRACTICE } from "@/lib/practice";
export { PRACTICE };

export const LAST_UPDATED = "2026-11-01";

export type LegalBlock = string | { list: string[] };
export interface LegalSection {
  heading: string;
  body: LegalBlock[];
}
export interface LegalDoc {
  intro: string;
  sections: LegalSection[];
}

const P = PRACTICE;

const privacySq: LegalDoc = {
  intro: `Kjo politikë shpjegon cilat të dhëna personale mbledhim kur përdor këtë faqe dhe rezervon seanca, pse i mbledhim, kush ka qasje në to dhe cilat janë të drejtat e tua. E kemi shkruar sa më thjesht, sepse besimi është pjesë e terapisë.`,
  sections: [
    {
      heading: "1. Kush i përpunon të dhënat",
      body: [
        `Kontrolluese e të dhënave është ${P.name}, ${P.roleSq}, me seli në ${P.city}. Për çdo pyetje rreth privatësisë na shkruaj në ${P.email}.`,
      ],
    },
    {
      heading: "2. Cilat të dhëna mbledhim",
      body: [
        {
          list: [
            "Të dhënat e kontaktit: emri, email-i dhe, nëse e jep, numri i telefonit.",
            "Të dhënat e rezervimit: lloji i seancës (individuale ose për çifte), formati (video, bisedë ose mesazhe), data dhe ora.",
            "Shënimin opsional që shkruan gjatë rezervimit dhe mesazhet që shkëmben me terapisten përmes faqes.",
            "Shënimet klinike që terapistja mban për seancat. Këto janë private dhe nuk shfaqen te llogaria jote.",
            "Mesazhet që dërgon përmes formës së kontaktit.",
            "Të dhëna teknike minimale: një cookie për të mbajtur të kyçur llogarinë tënde, preferenca e gjuhës dhe e pamjes (e çelët/e errët), dhe adresa IP që përdoret përkohësisht për të parandaluar abuzimin me formularët.",
          ],
        },
        "Nuk përdorim mjete analitike, reklama apo gjurmues të palëve të treta.",
      ],
    },
    {
      heading: "3. Pse i përdorim dhe mbi çfarë baze ligjore",
      body: [
        {
          list: [
            "Për të rezervuar, menaxhuar dhe zhvilluar seancat, si dhe për të të dërguar konfirmime, kujtesa dhe njoftime për mesazhe. Kjo është e nevojshme për ofrimin e shërbimit që kërkon.",
            "Të dhënat që lidhen me shëndetin tënd mendor (shënimi yt, mesazhet, shënimet klinike) janë të dhëna të ndjeshme. I përpunojmë vetëm me pëlqimin tënd të qartë, që e jep gjatë rezervimit, dhe për qëllime të kujdesit psikologjik nga një profesioniste e detyruar me sekret profesional.",
            "Për të përmbushur detyrimet ligjore dhe profesionale, p.sh. ruajtjen e dokumentacionit.",
            "Për sigurinë e faqes dhe parandalimin e abuzimit (p.sh. kufizimi i numrit të kërkesave), që është interes i ligjshëm.",
          ],
        },
        "Mund ta tërheqësh pëlqimin në çdo kohë duke na shkruar. Kjo nuk ndikon në ligjshmërinë e përpunimit të bërë më parë.",
      ],
    },
    {
      heading: "4. Konfidencialiteti",
      body: [
        "Çdo gjë që ndan në seancë mbetet konfidenciale, sipas etikës profesionale të psikologëve. Përjashtimet janë vetëm ato që i kërkon ligji, për shembull kur ekziston rrezik serioz dhe i menjëhershëm për jetën tënde ose të dikujt tjetër, ose kur e urdhëron gjykata.",
      ],
    },
    {
      heading: "5. Kush ka qasje në të dhëna",
      body: [
        "Qasje të plotë ka vetëm terapistja. Për ta bërë faqen të funksionojë përdorim këta ofrues shërbimesh, të cilët i përpunojnë të dhënat vetëm sipas udhëzimeve tona:",
        {
          list: [
            "Supabase: databaza ku ruhen rezervimet, mesazhet dhe shënimet. Serverët ndodhen në Bashkimin Evropian (Paris, Francë).",
            "Resend: dërgimi i email-eve (konfirmime, kujtesa, njoftime). Të dhënat e llogarisë dhe regjistrat e dërgimit ruhen në Shtetet e Bashkuara.",
            "Vercel: hostimi i faqes.",
            "Zoom ose Google Meet, nëse zgjedh seancë me video. Thirrja zhvillohet në platformën e tyre, sipas politikave të tyre të privatësisë.",
          ],
        },
        "Transferimet jashtë Kosovës bëhen vetëm drejt vendeve me nivel të përshtatshëm mbrojtjeje ose me masa mbrojtëse të përshtatshme, siç e kërkon ligji. Të dhënat e tua nuk i shesim dhe nuk i ndajmë për reklama.",
      ],
    },
    {
      heading: "6. Sa kohë i ruajmë",
      body: [
        {
          list: [
            "Shënimet klinike dhe historiku i seancave ruhen për aq kohë sa e kërkojnë rregullat ligjore dhe profesionale për dokumentacionin shëndetësor.",
            "Të dhënat e kontaktit dhe mesazhet ruhen gjatë kohës që je klient/e, dhe më pas fshihen ose anonimizohen me kërkesën tënde, përveç nëse ligji kërkon t'i ruajmë.",
            "Lidhjet e hyrjes skadojnë pas 1 ore. Sesioni i kyçur zgjat deri në 30 ditë, ose deri sa të dalësh nga llogaria.",
          ],
        },
      ],
    },
    {
      heading: "7. Siguria",
      body: [
        "Faqja përdor lidhje të enkriptuar (HTTPS). Qasja në databazë është e kufizuar me rregulla strikte, paneli i terapistes mbrohet me hyrje të verifikuar, dhe lidhjet e hyrjes për pacientët punojnë vetëm një herë. Nëse ndodh ndonjë shkelje që rrezikon të drejtat e tua, do ta njoftojmë Agjencinë për Informim dhe Privatësi brenda 72 orëve dhe ty pa vonesë, siç e kërkon ligji.",
      ],
    },
    {
      heading: "8. Të drejtat e tua",
      body: [
        "Sipas Ligjit nr. 06/L-082 për Mbrojtjen e të Dhënave Personale ke të drejtë:",
        {
          list: [
            "të dish cilat të dhëna kemi për ty dhe të marrësh një kopje të tyre;",
            "të kërkosh korrigjimin e të dhënave të pasakta;",
            "të kërkosh fshirjen e të dhënave, përveç atyre që ligji na detyron t'i ruajmë;",
            "të kufizosh ose të kundërshtosh përpunimin;",
            "të marrësh të dhënat në një format që mund t'ia japësh dikujt tjetër (bartshmëria);",
            "të tërheqësh pëlqimin në çdo kohë.",
          ],
        },
        `Për t'i ushtruar këto të drejta, shkruaj në ${P.email}. Do të përgjigjemi brenda 30 ditëve. Nëse mendon se të dhënat e tua nuk po trajtohen si duhet, ke të drejtë të paraqesësh ankesë në Agjencinë për Informim dhe Privatësi (aip.rks-gov.net).`,
      ],
    },
    {
      heading: "9. Të miturit",
      body: [
        "Shërbimi është i destinuar për persona mbi 18 vjeç. Për të miturit, rezervimi dhe pëlqimi duhet të bëhen nga prindi ose kujdestari ligjor.",
      ],
    },
    {
      heading: "10. Cookies",
      body: [
        "Përdorim vetëm cookies dhe ruajtje lokale të domosdoshme: për të mbajtur të kyçur llogarinë tënde dhe për të mbajtur mend gjuhën dhe pamjen që zgjodhe. Nuk përdorim cookies për analitikë ose reklama, prandaj nuk kërkojmë pëlqim të veçantë për to.",
      ],
    },
    {
      heading: "11. Ndryshimet e kësaj politike",
      body: [
        "Nëse e ndryshojmë këtë politikë, versionin e ri do ta publikojmë në këtë faqe me datën e përditësimit. Për ndryshime të rëndësishme do të njoftojmë me email klientët aktivë.",
      ],
    },
  ],
};

const privacyEn: LegalDoc = {
  intro: `This policy explains what personal data we collect when you use this site and book sessions, why we collect it, who can access it, and what your rights are. We've kept it as plain as possible, because trust is part of therapy.`,
  sections: [
    {
      heading: "1. Who is responsible for your data",
      body: [
        `The data controller is ${P.name}, ${P.roleEn}, based in ${P.cityEn}. For any privacy question, write to ${P.email}.`,
      ],
    },
    {
      heading: "2. What we collect",
      body: [
        {
          list: [
            "Contact details: your name, email and, if you provide it, phone number.",
            "Booking details: session type (individual or couples), format (video, chat or messaging), date and time.",
            "The optional note you write when booking, and the messages you exchange with your therapist through the site.",
            "Clinical notes the therapist keeps about sessions. These are private and are not shown in your account.",
            "Messages you send through the contact form.",
            "Minimal technical data: a cookie that keeps you signed in, your language and light/dark preference, and your IP address, used briefly to prevent abuse of forms.",
          ],
        },
        "We don't use analytics, advertising or third-party trackers.",
      ],
    },
    {
      heading: "3. Why we use it, and on what legal basis",
      body: [
        {
          list: [
            "To book, manage and hold sessions, and to send you confirmations, reminders and message notifications. This is necessary to provide the service you ask for.",
            "Information about your mental health (your note, messages, clinical notes) is sensitive data. We process it only with your explicit consent, given when you book, and for the purpose of psychological care by a professional bound by confidentiality.",
            "To meet legal and professional obligations, such as keeping records.",
            "To keep the site secure and prevent abuse (e.g. limiting repeated requests), which is a legitimate interest.",
          ],
        },
        "You can withdraw your consent at any time by writing to us. This doesn't affect processing that happened before.",
      ],
    },
    {
      heading: "4. Confidentiality",
      body: [
        "Everything you share in sessions stays confidential, in line with psychologists' professional ethics. The only exceptions are those required by law — for example, when there is a serious and immediate risk to your life or someone else's, or when ordered by a court.",
      ],
    },
    {
      heading: "5. Who can access your data",
      body: [
        "Only the therapist has full access. To run the site we use these service providers, who process data only on our instructions:",
        {
          list: [
            "Supabase — the database that stores bookings, messages and notes. Servers are in the European Union (Paris, France).",
            "Resend — sending emails (confirmations, reminders, notifications). Account data and sending logs are stored in the United States.",
            "Vercel — website hosting.",
            "Zoom or Google Meet, if you choose a video session. The call takes place on their platform, under their own privacy policies.",
          ],
        },
        "Transfers outside Kosovo only go to countries with an adequate level of protection or with appropriate safeguards, as the law requires. We never sell your data or share it for advertising.",
      ],
    },
    {
      heading: "6. How long we keep it",
      body: [
        {
          list: [
            "Clinical notes and session history are kept for as long as legal and professional rules for health records require.",
            "Contact details and messages are kept while you are a client, and afterwards deleted or anonymised on request, unless the law requires us to keep them.",
            "Login links expire after 1 hour. A signed-in session lasts up to 30 days, or until you sign out.",
          ],
        },
      ],
    },
    {
      heading: "7. Security",
      body: [
        "The site uses encrypted connections (HTTPS). Database access is restricted by strict rules, the therapist's panel is protected by verified login, and patient login links work only once. If a breach occurs that puts your rights at risk, we will notify the Information and Privacy Agency within 72 hours and you without undue delay, as the law requires.",
      ],
    },
    {
      heading: "8. Your rights",
      body: [
        "Under Kosovo's Law No. 06/L-082 on the Protection of Personal Data, you have the right to:",
        {
          list: [
            "know what data we hold about you and get a copy of it;",
            "have inaccurate data corrected;",
            "have your data deleted, except what the law requires us to keep;",
            "restrict or object to processing;",
            "receive your data in a format you can give to someone else (portability);",
            "withdraw your consent at any time.",
          ],
        },
        `To exercise these rights, write to ${P.email}. We will reply within 30 days. If you believe your data isn't being handled properly, you can file a complaint with the Information and Privacy Agency (aip.rks-gov.net).`,
      ],
    },
    {
      heading: "9. Minors",
      body: [
        "The service is intended for people aged 18 and over. For minors, booking and consent must be done by a parent or legal guardian.",
      ],
    },
    {
      heading: "10. Cookies",
      body: [
        "We only use essential cookies and local storage: to keep you signed in, and to remember your chosen language and theme. We don't use cookies for analytics or advertising, so no separate consent is needed for them.",
      ],
    },
    {
      heading: "11. Changes to this policy",
      body: [
        "If we change this policy, we'll publish the new version on this page with its update date. For significant changes we'll also email active clients.",
      ],
    },
  ],
};

const termsSq: LegalDoc = {
  intro: `Këto kushte rregullojnë përdorimin e kësaj faqeje dhe rezervimin e seancave psikologjike online me ${P.name}. Duke rezervuar një seancë, pranon këto kushte dhe Politikën e Privatësisë.`,
  sections: [
    {
      heading: "1. Shërbimi",
      body: [
        `Përmes kësaj faqeje mund të rezervosh seanca psikologjike individuale ose për çifte me ${P.name}, ${P.roleSq} në ${P.city}. Seancat zhvillohen online, me video-thirrje, bisedë të drejtpërdrejtë ose me mesazhe.`,
      ],
    },
    {
      heading: "2. Nuk është shërbim emergjence",
      body: [
        "Kjo faqe dhe mesazhet përmes saj nuk janë për situata urgjente, dhe mesazhet nuk lexohen menjëherë. Nëse je në rrezik të menjëhershëm ose mendon të lëndosh veten apo dikë tjetër, thirr menjëherë 112 (numri i emergjencës në Kosovë) ose shko në emergjencën e spitalit më të afërt.",
      ],
    },
    {
      heading: "3. Kush mund ta përdorë",
      body: [
        "Shërbimi është për persona mbi 18 vjeç. Për të miturit, rezervimi duhet të bëhet nga prindi ose kujdestari ligjor, me pëlqimin e tij/saj.",
      ],
    },
    {
      heading: "4. Rezervimi",
      body: [
        {
          list: [
            "Gjatë rezervimit duhet të japësh të dhëna të sakta, sidomos email-in, sepse aty dërgohen konfirmimi, lidhja e seancës dhe lidhja për menaxhimin e rezervimit.",
            "Rezervimi konfirmohet kur merr email-in e konfirmimit.",
            "Mbaje private lidhjen për menaxhim që merr me email, sepse kushdo që e ka mund ta anulojë ose ta riplanifikojë rezervimin.",
          ],
        },
      ],
    },
    {
      heading: "5. Anulimi dhe riplanifikimi",
      body: [
        "Mund ta anulosh ose ta riplanifikosh seancën vetë, përmes lidhjes në email-in e konfirmimit, deri para fillimit të saj. Politika e anulimit (p.sh. afati për anulim pa pagesë) shfaqet te faqja Shërbimet dhe vlen për çdo rezervim.",
        "Nëse terapistja duhet të anulojë një seancë, do të njoftohesh me email dhe mund të zgjedhësh një kohë tjetër.",
      ],
    },
    {
      heading: "6. Çmimet dhe pagesa",
      body: [
        "Çmimet e seancave shfaqen te faqja Shërbimet. Pagesa online përmes faqes ende nuk ofrohet; mënyra e pagesës komunikohet drejtpërdrejt me terapisten.",
      ],
    },
    {
      heading: "7. Seancat online",
      body: [
        {
          list: [
            "Zgjidh një vend të qetë dhe privat, ku askush nuk të dëgjon, dhe një lidhje të qëndrueshme interneti.",
            "Seancat nuk incizohen nga asnjëra palë pa pëlqimin e të dyjave.",
            "Nëse lidhja ndërpritet, terapistja do të përpiqet të rikthehet në kontakt përmes të njëjtës lidhje ose me email.",
          ],
        },
      ],
    },
    {
      heading: "8. Kufijtë e shërbimit",
      body: [
        "Terapia psikologjike online nuk zëvendëson kujdesin mjekësor ose psikiatrik kur ai nevojitet. Nëse terapistja vlerëson se të duhet një lloj tjetër ndihme, mund të të rekomandojë një profesionist tjetër. Asnjë terapi nuk garanton një rezultat të caktuar.",
      ],
    },
    {
      heading: "9. Përdorimi i faqes",
      body: [
        "Faqen mund ta përdorësh vetëm për qëllimin e saj. Nuk lejohet përdorimi i saj për mesazhe abuzive, spam, rezervime të rreme ose përpjekje për të cenuar sigurinë e saj. Në raste të tilla, qasja mund të kufizohet.",
      ],
    },
    {
      heading: "10. Privatësia",
      body: ["Mënyra si i trajtojmë të dhënat e tua shpjegohet në Politikën e Privatësisë."],
    },
    {
      heading: "11. Ligji i zbatueshëm",
      body: [
        "Për këto kushte zbatohet ligji i Republikës së Kosovës. Çdo mosmarrëveshje përpiqemi ta zgjidhim fillimisht me marrëveshje; në të kundërt, kompetente janë gjykatat në Prishtinë.",
      ],
    },
    {
      heading: "12. Ndryshimet dhe kontakti",
      body: [
        `Këto kushte mund të përditësohen herë pas here, dhe versioni aktual është gjithmonë ky në këtë faqe. Për pyetje na shkruaj në ${P.email}.`,
      ],
    },
  ],
};

const termsEn: LegalDoc = {
  intro: `These terms govern your use of this site and booking online psychological sessions with ${P.name}. By booking a session, you accept these terms and the Privacy Policy.`,
  sections: [
    {
      heading: "1. The service",
      body: [
        `Through this site you can book individual or couples psychological sessions with ${P.name}, ${P.roleEn} in ${P.cityEn}. Sessions take place online, by video call, live chat or messaging.`,
      ],
    },
    {
      heading: "2. Not an emergency service",
      body: [
        "This site and its messages are not for emergencies, and messages are not read immediately. If you are in immediate danger or thinking about harming yourself or someone else, call 112 (Kosovo's emergency number) right away or go to the nearest hospital emergency department.",
      ],
    },
    {
      heading: "3. Who can use it",
      body: [
        "The service is for people aged 18 and over. For minors, booking must be made by a parent or legal guardian, with their consent.",
      ],
    },
    {
      heading: "4. Booking",
      body: [
        {
          list: [
            "You must give accurate details when booking — especially your email, which receives the confirmation, the session link and the link to manage your booking.",
            "A booking is confirmed when you receive the confirmation email.",
            "Keep the manage link from your email private: anyone who has it can cancel or reschedule the booking.",
          ],
        },
      ],
    },
    {
      heading: "5. Cancelling and rescheduling",
      body: [
        "You can cancel or reschedule a session yourself, using the link in your confirmation email, up until it starts. The cancellation policy (for example, the deadline for free cancellation) is shown on the Services page and applies to every booking.",
        "If the therapist has to cancel a session, you'll be notified by email and can choose another time.",
      ],
    },
    {
      heading: "6. Prices and payment",
      body: [
        "Session prices are shown on the Services page. Online payment through the site isn't available yet; the payment method is arranged directly with the therapist.",
      ],
    },
    {
      heading: "7. Online sessions",
      body: [
        {
          list: [
            "Choose a quiet, private place where no one can overhear you, and a stable internet connection.",
            "Sessions are not recorded by either side without the consent of both.",
            "If the connection drops, the therapist will try to reconnect through the same link or by email.",
          ],
        },
      ],
    },
    {
      heading: "8. Limits of the service",
      body: [
        "Online psychological therapy doesn't replace medical or psychiatric care when that is needed. If the therapist believes you need a different kind of help, she may refer you to another professional. No therapy can guarantee a particular outcome.",
      ],
    },
    {
      heading: "9. Using the site",
      body: [
        "You may only use the site for its intended purpose. Using it for abusive messages, spam, fake bookings or attempts to compromise its security is not allowed, and may lead to access being restricted.",
      ],
    },
    {
      heading: "10. Privacy",
      body: ["How we handle your data is explained in the Privacy Policy."],
    },
    {
      heading: "11. Governing law",
      body: [
        "These terms are governed by the law of the Republic of Kosovo. We'll always try to resolve any dispute by agreement first; otherwise, the courts in Prishtina have jurisdiction.",
      ],
    },
    {
      heading: "12. Changes and contact",
      body: [
        `These terms may be updated from time to time; the current version is always the one on this page. For questions, write to ${P.email}.`,
      ],
    },
  ],
};

export const legalContent = {
  privacy: { sq: privacySq, en: privacyEn },
  terms: { sq: termsSq, en: termsEn },
} as const;
