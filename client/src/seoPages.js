// Page titles, descriptions and the plain text search engines see for each public page.
// Used in two places: scripts/prerender.mjs writes it into the HTML at build time (so Google, link previews and
// tools that don't run JavaScript see real content), and App.jsx sets the browser tab title while browsing.
export const SITE_URL = "https://www.ampexworldrecords.com";
export const SITE_NAME = "AMPEX World Records";
export const DEFAULT_TITLE = "AMPEX World Records | ampexworldrecords.com";
export const DEFAULT_DESCRIPTION =
  "AMPEX World Records at ampexworldrecords.com: submit, verify and break world records, follow the rankings, challenge record holders and watch live record attempts.";

const t = (name) => `${name} | AMPEX World Records`;

export const PAGES = {
  "/": {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    h1: "AMPEX World Records",
    text: [
      "Set a record, break a record, go live. AMPEX World Records is the home of verified world records for athletes and record breakers everywhere.",
      "Submit your record attempt with video evidence, have it reviewed by our adjudication team, and earn an official AMPEX World Record certificate. Challenge existing record holders, climb the global and local rankings, and watch live record attempts.",
    ],
  },
  "/explore-records": {
    title: t("Explore Records"),
    description: "Explore verified AMPEX World Records by category: strength, endurance, balance, flexibility, talent, fitness, sports and more. Search records, see new and beaten records, and find one to challenge.",
    h1: "Explore Records",
    text: ["Browse every verified AMPEX World Record. Search by name or category, see the newest and most viewed records, and the records that were beaten by a winning challenge."],
  },
  "/try-these-records": {
    title: t("Try These Records"),
    description: "Record ideas waiting for their first official AMPEX record holder. Choose an open record, follow the rules, submit your evidence and make AMPEX history.",
    h1: "Try These Records",
    text: ["These records are waiting for their first official record holder. Choose an open record, follow the rules, submit your evidence, and become the first person to make AMPEX history."],
  },
  "/verify": {
    title: t("Submit a Record"),
    description: "Submit your world record attempt to AMPEX World Records. Upload your video evidence and get it verified by our adjudication team.",
    h1: "Submit a Record",
    text: ["Create a free account, choose your category, upload your video evidence and submit. Our adjudicators review every attempt and verified records receive an official AMPEX certificate."],
  },
  "/challenge": {
    title: t("Challenge a Record"),
    description: "Think you can do better? Challenge an existing AMPEX World Record: watch the record video, submit your attempt, and take the title if you beat it.",
    h1: "Challenge a Record",
    text: ["Pick a verified record, watch the record holder's video, then submit your own attempt. If your challenge is verified and beats the record, you become the new record holder."],
  },
  "/leaderboard": {
    title: t("Rankings"),
    description: "AMPEX World Records rankings: the top record holders and athletes by points, verified records and world records.",
    h1: "Rankings",
    text: ["See who leads the AMPEX World Records rankings. Members earn points for every verified record and climb the global and local leaderboards."],
  },
  "/global-leaderboard": {
    title: t("Global Leaderboard"),
    description: "The AMPEX World Records global leaderboard: the best record holders from every country.",
    h1: "Global Leaderboard",
    text: ["The top AMPEX record holders worldwide, ranked by points and verified records."],
  },
  "/local-leaderboards": {
    title: t("Local Leaderboards"),
    description: "AMPEX World Records local leaderboards: the top record holders in your country, state and city.",
    h1: "Local Leaderboards",
    text: ["Find the best record holders near you, by country, state and city."],
  },
  "/events": {
    title: t("Live Events"),
    description: "Watch live world record attempts on AMPEX World Records. Free events are open to everyone; paid events need a spectator pass.",
    h1: "Live Events",
    text: ["Watch record attempts live, chat with other fans, and replay paid events for 24 hours with your spectator pass."],
  },
  "/streams": {
    title: t("Live Streams"),
    description: "All AMPEX World Records live streams and replays.",
    h1: "Live Streams",
    text: ["Live and upcoming AMPEX record attempts, and replays of past events."],
  },
  "/shop": {
    title: t("Shop"),
    description: "The official AMPEX World Records shop: apparel, medals, trophies, championship belts and more. Members earn reward points on every purchase.",
    h1: "AMPEX Shop",
    text: ["Official AMPEX World Records apparel, awards and collectibles. Members earn reward points on purchases and can spend them in the shop."],
  },
  "/categories": {
    title: t("Record Categories"),
    description: "All AMPEX World Records categories: strength, endurance, balance, flexibility, talent, fitness, sports, entertainment, creative skills, food challenges and more.",
    h1: "Record Categories",
    text: ["Find the category for your record attempt and see the records already set in it."],
  },
  "/elite": {
    title: t("Elite Membership"),
    description: "AMPEX World Records membership plans: more record submissions each month, member benefits and rewards.",
    h1: "Membership",
    text: ["Choose the AMPEX membership plan that fits how often you break records."],
  },
  "/about": { title: t("About Us"), description: "About AMPEX World Records: who we are and how we verify world records.", h1: "About AMPEX World Records", text: ["AMPEX World Records verifies and celebrates record-breaking performances from athletes around the world."] },
  "/contact": { title: t("Contact Us"), description: "Contact AMPEX World Records with questions about records, verification, events, sponsorship or your account.", h1: "Contact Us", text: ["Questions about a record, your account, events or sponsorship? Send us a message."] },
  "/faq": { title: t("FAQ"), description: "Frequently asked questions about AMPEX World Records: submitting records, verification, fees, certificates and challenges.", h1: "Frequently Asked Questions", text: ["Answers to the most common questions about submitting, verifying and challenging AMPEX World Records."] },
  "/rules": { title: t("Rules"), description: "The official rules for AMPEX World Records submissions and challenges.", h1: "Rules", text: ["The rules every AMPEX record attempt and challenge must follow."] },
  "/process": { title: t("Verification Process"), description: "How AMPEX World Records verifies a record: submission, evidence review, adjudication and certification.", h1: "Verification Process", text: ["Every AMPEX record goes through evidence review and adjudication before it is verified and certified."] },
  "/appeals": { title: t("Appeals"), description: "Appeal an AMPEX World Records verification decision.", h1: "Appeals", text: ["If you disagree with a verification decision, you can appeal it here."] },
  "/certificate": { title: t("Verify a Certificate"), description: "Check that an AMPEX World Records certificate is genuine by its certificate number.", h1: "Verify a Certificate", text: ["Enter a certificate number to confirm it was issued by AMPEX World Records."] },
  "/submit-evidence-info": { title: t("Submitting Evidence"), description: "What video evidence AMPEX World Records needs for a record attempt.", h1: "Submitting Evidence", text: ["How to film and submit evidence so your record attempt can be verified."] },
  "/global-recognition-info": { title: t("Global Recognition"), description: "How AMPEX World Records recognises record holders worldwide.", h1: "Global Recognition", text: ["Verified AMPEX records are listed publicly and ranked on the global leaderboards."] },
  "/adjudication-info": { title: t("Expert Adjudication"), description: "How AMPEX World Records adjudicators review record attempts.", h1: "Expert Adjudication", text: ["Our adjudicators review every record attempt against the rules before it is verified."] },
  "/verification-protocol-info": { title: t("Verification Protocol"), description: "The AMPEX World Records verification protocol.", h1: "Verification Protocol", text: ["The checks every AMPEX record attempt goes through before it is verified."] },
  "/login": { title: t("Log In"), description: "Log in to your AMPEX World Records account.", h1: "Log In", text: ["Log in to submit records, challenge record holders and manage your account."] },
  "/signup": { title: t("Sign Up"), description: "Create your free AMPEX World Records account to submit and challenge world records.", h1: "Sign Up", text: ["Create your free athlete profile to submit records, take on challenges and earn rewards."] },
  "/terms": { title: t("Terms of Service"), description: "AMPEX World Records terms of service.", h1: "Terms of Service", text: ["The terms that apply when you use AMPEX World Records."] },
  "/privacy": { title: t("Privacy Policy"), description: "How AMPEX World Records collects and uses your information.", h1: "Privacy Policy", text: ["How we collect, use and protect your information."] },
  "/cookies": { title: t("Cookie Policy"), description: "How AMPEX World Records uses cookies.", h1: "Cookie Policy", text: ["How and why we use cookies on ampexworldrecords.com."] },
};

// The main links every static page shows (so search engines can find all pages)
export const NAV_LINKS = [
  ["/", "Home"], ["/explore-records", "Explore Records"], ["/leaderboard", "Rankings"], ["/challenge", "Challenge a Record"],
  ["/verify", "Submit a Record"], ["/events", "Live Events"], ["/shop", "Shop"], ["/categories", "Categories"],
  ["/faq", "FAQ"], ["/about", "About Us"], ["/contact", "Contact Us"],
];

export const titleFor = (pathname) => (PAGES[pathname] ? PAGES[pathname].title : null);
