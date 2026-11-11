// Admin Guide: how the admin panel works (linked from Dashboard → Need Help → View Admin Guide).
import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const SECTIONS = [
  {
    id: "verification",
    title: "Reviewing record submissions",
    body: [
      "Every new submission starts as Pending Review. Open it from Submissions or the Verification Queue.",
      "Pending Review means nobody has picked it up yet. Under Review means an adjudicator is working on it. Use Mark Under Review so other admins know it is taken.",
      "Needs More Information means you are waiting on the athlete. Send them a message from Communications explaining what is missing.",
      "Priority is for submissions that should be checked first, for example from members on a plan with priority review (Silver, Gold, Diamond, VIP Package).",
      "Approving sets the record to Verified, saves the Date Verified shown on the record page, awards the athlete's points and updates the rankings. Denying sets it to Rejected and awards nothing.",
    ],
  },
  {
    id: "points",
    title: "Points, rankings and tiers",
    body: [
      "A verified record is worth 10 points. A record marked as a world record type earns an extra 25. Live event wins (50) and first place in a category (30) can be awarded from Leaderboards → Ranking panel.",
      "Point values live in the points rules (Leaderboards tab) and can be changed there. On 9 Nov 2026 every existing balance was divided by 10 to match the new 10-point scale, so athletes kept their order.",
      "Global rank is the athlete's position by total points, recalculated automatically after every award. Athletes with equal points share a place.",
      "Category rank compares athletes inside one category, by their verified records there. #1 in a category counts as a first-place category on the profile, and a top-10 position counts as a top-10 placement.",
      "W.R. (world records) on rankings and profiles is the number of the athlete's verified records: every verified record is an official AMPEX world record, as the certificate states.",
      "Tier badges: Challenger (under 500 points), Pro Competitor (500+), Elite Master (2,000+), Grand Champion (5,000+).",
    ],
  },
  {
    id: "vip",
    title: "VIP competitors",
    body: [
      "VIP status is a recognition you grant by hand in the VIP Competitors tab: Elite or Legend, plus an optional verified tick. It shows as a gold 'VIP Elite' / 'VIP Legend' badge (and '✓ Verified') next to the athlete's tier on their public profile.",
      "Members on a plan with the VIP profile benefit (Diamond and VIP Package) get a gold 'VIP' badge automatically while that plan is active. The benefit is switched on per plan in Memberships → Plans.",
      "VIP status does not change points or ranks. Rankings are always based only on points from verified records and awards.",
    ],
  },
  {
    id: "memberships",
    title: "Membership plans and upgrades",
    body: [
      "Memberships → Plans holds every plan: price, monthly / yearly / one-time billing, submissions per month (empty = unlimited), the benefit list, priority review and VIP profile. Changes show on the Membership page immediately.",
      "Current plans: Free (3 submissions), Bronze $10.99 / month (10), Silver $20 / month (15), Gold $50 / month (unlimited), Diamond $200 / month (unlimited, priority review and VIP profile), VIP Package $250 one-time (lifetime, unlimited, priority review and VIP profile).",
      "Until Stripe is connected, nothing is charged online. A member who chooses a paid plan creates an upgrade request, which appears under Memberships → Plans → Upgrade requests. Confirm their payment, then press Activate: their plan and submission limit change straight away.",
      "Subscribers lists every membership with its plan, status and renewal date. You can change a member's plan or cancel it there. Payments lists every recorded membership payment.",
    ],
  },
  {
    id: "coupons",
    title: "Coupons",
    body: [
      "Each coupon can have a total redemption limit (all customers together) and a uses-per-account limit (1 by default). Leave a field empty for no limit.",
      "Both limits are checked again at checkout, so a coupon cannot be used past its limit even if two people use it at the same time.",
      "The coupon list shows uses against the limit, how many different accounts used it and the total discount given.",
    ],
  },
  {
    id: "certificates",
    title: "Certificates",
    body: [
      "Certificates are never issued automatically. Shop Catalog → Certificate & Award Control Suite → Certificates shows an approval queue of verified records that have no certificate yet.",
      "Review & issue opens the certificate with the athlete's details filled in. Check the name, record, value and dates, choose a template and approve. Each certificate gets a unique number (AMPEX-YYYY-XXXXXX) that anyone can check at /certificate/<number>.",
      "Profile badges (Pro Competitor, Top 10 Rank, AMPEX Ambassador…) can be printed by the member as an AMPEX award certificate from the badge on their profile.",
      "Athletes download their certificate as a PDF from their profile. You can download, copy the verify link or revoke a certificate from the Issued list. A revoked certificate shows as revoked on the verify page.",
      "Templates: upload your own certificate or award design, pick a text layout (AMPEX landscape / portrait for the official designs, or Generic for a blank design) and choose a default.",
    ],
  },
  {
    id: "belts",
    title: "Championship belts and approvals",
    body: [
      "Products in the Championship Belts category always require approval. Any other product can require it too: tick 'Requires admin approval to buy' on the product.",
      "A competitor asks for approval on the product page. You approve, deny or revoke it in Shop Catalog → Certificate & Award Control Suite → Belt Approvals, or grant it directly to a competitor.",
      "Checkout refuses a restricted product unless that buyer is approved for it. Once they buy it, the approval is marked Purchased.",
    ],
  },
  {
    id: "rewards",
    title: "Rewards & referrals",
    body: [
      "Reward points are separate from competition ranking points. Members earn them for referrals and shop purchases, and the points are never spent: reaching a level unlocks its shop discount automatically.",
      "Levels (editable in Admin → Rewards & Referrals → Settings): Member 0+ (0%), Bronze Reward 100+ (5%), Silver Reward 250+ (10%), Gold Reward 500+ (20%), AMPEX Ambassador 1,000+ (40%). The top level shows an AMPEX Ambassador badge on the member's profile.",
      "Referrals: every member has a referral link under Profile → My Rewards. When someone joins with it, the member who shared it earns 10 points once the new member's first record is verified (you can switch this to 'when they create their account'). Nobody can refer themselves or be referred twice, and many sign-ups from one member in a day, or from one network, are held as Flagged for you to approve or reject.",
      "Purchases: 1 point per $1 paid (after discounts), once the order is paid. Refunded, failed or cancelled orders lose their points automatically. You can set a different rate per shop section, fixed points for a product, products or sections that earn nothing, and promotions such as double points.",
      "At checkout the member sees the original price, their reward discount and what they save. Coupons and reward discounts don't combine unless you allow it: the bigger discount is used. Tickets get no reward discount by default.",
      "Members tab: search a member, see their points and level, and add or remove points with a reason. Every change is kept in the Points ledger and can't be edited or deleted; to correct a mistake add another adjustment.",
    ],
  },
  {
    id: "ai",
    title: "AI Controls",
    body: [
      "AI Scan Results lists a scan for each record, with checks for the face match, deepfake signs, video edits and audio edits, plus a confidence score.",
      "Important: no AI video-analysis provider is connected yet. The scores shown are generated demo values, not a real analysis of the video. Use them only to try the screens, and always judge the evidence yourself.",
      "If the automatic check flags an attempt, the athlete can still submit it, and it waits in the Verification Queue for a person to review.",
      "Nothing is approved or rejected automatically. The thresholds in AI Configuration (auto-approve above, flag below, auto-reject below) and the detection switches are saved settings, ready for when a real provider is connected.",
      "Admin Overrides: approving a scan verifies the record (same result as approving in the Verification Queue, including points). Rejecting it rejects the record.",
      "Fraud Detection and Flagged Items let you mark a record as suspicious with a reason, so other admins see it before approving.",
    ],
  },
  {
    id: "divisions",
    title: "Categories and divisions",
    body: [
      "Categories (Admin menu → Categories) are the real categories used across the site, including the list athletes pick from when they submit or challenge a record. Add a category, or a subcategory by choosing a parent. Hide one to remove it from the site without deleting it.",
      "Deleting a category keeps its records. Its subcategories move up one level.",
      "Divisions shows the live category tree and the weight classes. Weight classes take any custom range: leave the minimum or the maximum empty for an open-ended class, in lbs or kg, for all categories or one.",
    ],
  },
  {
    id: "content",
    title: "Sponsors, media, messages and SEO",
    body: [
      "Sponsorships: each placement shows its recommended banner size. Homepage, events, shop and livestream strips are 1920 × 400 px (4.8:1). On a computer the strip is about 1,200–1,400 px wide and up to 360 px tall. 'Show the whole banner' never crops it, and a narrower banner gets a blurred copy of itself on the sides instead of black. 'Fill the space' covers the area and may crop the edges around the focus point you choose.",
      "Sponsor video: paste a YouTube / Vimeo link or upload an MP4 (up to 50 MB). It plays muted on a loop beside the banner, or below it on phones.",
      "Media Library: upload images, videos (up to 50 MB) and PDFs, copy a file's link, rename or delete it.",
      "Communications: New Message sends to one member or to everyone. Members see it under Messages on their profile. Members also get a message automatically when a certificate is issued to them or when a belt approval is decided.",
      "Users: click a member's name to open their full profile (records, membership and payments, orders with their comments, certificates, rewards and messages). Message sends to their site inbox. Email opens your own email program until an email service is connected to the site.",
      "Shop orders: what the buyer typed in a product's comment box (for example the name and record to print on a certificate) shows under that item in Shop Orders.",
      "Products: choose the shop section for every product (Apparel for clothing). Add up to 4 side pictures next to the main picture. Each size can have its own price and stock; remove a size with its Remove button.",
      "System Settings → Global SEO: the site title and description used in browser tabs and search results.",
    ],
  },
];

export default function AdminGuide() {
  return (
    <div style={{ background: "#0A0A0A", color: "white", minHeight: "100vh", fontFamily: "'Inter', sans-serif" }}>
      <Navbar />
      <main style={{ maxWidth: "980px", margin: "0 auto", padding: "140px 16px 80px" }}>
        <Link to="/admin?tab=dashboard" style={{ color: "#888", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: 700, marginBottom: "24px" }}>
          <ArrowLeft size={16} /> Back to admin dashboard
        </Link>
        <div style={{ color: "#FF5500", fontSize: "12px", fontWeight: 900, letterSpacing: "1px", textTransform: "uppercase", marginBottom: "8px" }}>AMPEX World Records</div>
        <h1 style={{ fontSize: "clamp(32px, 6vw, 48px)", fontWeight: 950, margin: "0 0 12px 0", letterSpacing: "-1px" }}>Admin Guide</h1>
        <p style={{ color: "#999", fontSize: "16px", lineHeight: 1.6, margin: "0 0 32px 0", maxWidth: "680px" }}>
          How the admin panel works: verification, points and rankings, memberships, certificates, belts, AI Controls and site content.
        </p>

        <nav aria-label="Guide sections" style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "40px" }}>
          {SECTIONS.map((s) => (
            <a key={s.id} href={`#${s.id}`} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#ddd", padding: "8px 14px", borderRadius: "100px", fontSize: "13px", fontWeight: 700, textDecoration: "none" }}>{s.title}</a>
          ))}
        </nav>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {SECTIONS.map((s) => (
            <section key={s.id} id={s.id} style={{ background: "#121212", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "18px", padding: "clamp(20px, 4vw, 32px)", scrollMarginTop: "120px" }}>
              <h2 style={{ fontSize: "22px", fontWeight: 900, margin: "0 0 16px 0" }}>{s.title}</h2>
              <ul style={{ margin: 0, paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
                {s.body.map((line, i) => (
                  <li key={i} style={{ color: "#c8c8c8", fontSize: "15px", lineHeight: 1.65 }}>{line}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
