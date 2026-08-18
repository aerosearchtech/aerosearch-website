/**
 * Single source of truth for all site copy.
 * Edit text here — components never hardcode strings.
 *
 * Two rules govern this file:
 *
 * 1. NO PAYLOAD DISCLOSURE. The public site never names an individual sensor,
 *    survey altitude, image resolution, or model detail. Capability is described
 *    as a "stabilised multi-sensor payload" and "AI-assisted detection". The
 *    specific stack is proprietary — see `_private/README.md`.
 *
 * 2. NO INVENTED NUMBERS. `crisis` figures are public humanitarian estimates
 *    (Landmine Monitor / UNMAS) and are labelled as such. `press` entries are
 *    externally reported facts. Aerosearch's own performance is deliberately
 *    qualitative — the product is at prototype stage, and claiming measured
 *    accuracy we cannot evidence would be worse than claiming nothing.
 */

export const brand = {
  /**
   * Always the full name in anything a reader sees. The short form exists only
   * for places where the name is a token rather than prose.
   */
  full: "Aerosearch Technologies",
  domain: "aerosearchtech.com",
  email: "aerosearchtech@gmail.com",
  /** Domain inbox, published second — the Gmail above is the one we watch. */
  emailAlt: "info@aerosearchtech.com",
  phone: "+91 99993 96306",
  /** Same number, dial-safe for the tel: scheme. */
  phoneHref: "+919999396306",
  location: "India",
  tagline: "Autonomous threat prediction for national defence.",
  product: "ClearLandMine",
} as const;

export const nav = {
  /** Order mirrors the page, so the nav doubles as a table of contents. */
  links: [
    { label: "Technology", href: "#technology" },
    { label: "Approach", href: "#approach" },
    { label: "Mission", href: "#mission" },
    { label: "Vision", href: "#horizon" },
    // Press is held back; restore this alongside <Press /> in page.tsx.
    // { label: "Press", href: "#press" },
  ],
  cta: { label: "Talk to us", href: "#contact" },
} as const;

export const hero = {
  kicker: "Tactical edge perception",
  /** Set as two lines; the break is deliberate, not a wrap. */
  title: ["Autonomous threat", "prediction."],
  /**
   * The hero states the company, not the product. No platform is named here —
   * the autonomy is the thing we sell, and it does not belong to one airframe.
   */
  body:
    "Aerosearch Technologies develops hardware-integrated autonomy for contested environments. We fuse raw multi-dimensional signals into real-time predictive threat intelligence - neutralizing risk before boots touch the ground.",
  primary: { label: "Our technology", href: "#technology" },
  secondary: { label: "Talk to us", href: "#contact" },
  status: "Search · active",
} as const;

/**
 * Everything from here to the end of `approach` is the ClearLandMine block. It
 * is the one programme discussed openly, and the kicker says so rather than
 * letting a reader assume it is all we do.
 */
export const crisis = {
  kicker: `${brand.product} · flagship programme`,
  title: "The threat doesn't wait for a war.",
  body:
    "Clearing ground by hand is slow, expensive, and dangerous. A deminer advances a few square metres an hour, on their knees, hoping the detector speaks first. There are not enough of them, and there is far too much ground.",
  stats: [
    { value: "60M+", label: "mines still buried worldwide" },
    { value: "2.5M", label: "people living with it across India's border regions" },
    { value: "13 / day", label: "killed or maimed" },
    { value: "43%", label: "of casualties are children" },
  ],
  source: "Widely cited estimates. Figures vary by source and reporting year.",
} as const;

export type ApproachStep = {
  readonly step: string;
  readonly title: string;
  readonly note: string;
};

export const approach = {
  id: "approach",
  kicker: "How it works",
  title: "Take the search off the ground.",
  body:
    "The search is the slowest, most dangerous part of clearing contaminated ground. It is also the part a machine can take over.",
  system: {
    label: "The system",
    name: brand.product,
    body: "The first application of our detection stack.",
  },
  steps: [
    { step: "Search", title: "The aircraft goes first", note: "No one enters the ground" },
    {
      step: "Detect",
      title: "The model reads what the eye misses",
      note: "Candidates, not conclusions",
    },
    { step: "Map", title: "A map a team can act on", note: "Handed to the team that acts on it" },
  ] satisfies readonly ApproachStep[],
  scanCaption:
    "Illustrative - three sensors over the same ground, each contact marked by whichever one calls it.",
} as const;

export type Capability = {
  readonly title: string;
  readonly body: string;
};

export const technology = {
  id: "technology",
  kicker: "Technology",
  title: "Intelligence for the missions that matter.",
  /**
   * Two cards on how the work is done, two on where it goes. The reach cards
   * state design intent, never a customer we do not have. The pillars are named
   * plainly; nothing here says which programme any of it currently flies on.
   */
  items: [
    {
      title: "Autonomous swarming",
      body:
        "Coordinated multi-aircraft coverage, so a large area is covered in one sortie rather than a season of them.",
    },
    {
      title: "Sensor fusion",
      body:
        "Several feeds read as one picture, so a contact that is ambiguous on its own becomes readable in combination.",
    },
    {
      title: "Across the services",
      body:
        "Built for the Army, Air Force, Navy and Coast Guard - and for the border and paramilitary forces holding the same ground.",
    },
    {
      title: "Beyond the frontline",
      body:
        "The same detection stack extends to port and logistics security, industrial site inspection, and agricultural and wildlife protection.",
    },
  ] satisfies readonly Capability[],
  swarmCaption:
    "Illustrative - a formation on station, each aircraft reading the ground its own way.",
  fusionCaption:
    "Illustrative - three channels of noise over the same ground; only what is really there survives the merge.",
  /** Says the obvious thing out loud so silence does not read as absence. */
  note: "Our other programmes are not discussed publicly.",
} as const;

export type HorizonStage = {
  readonly title: string;
  readonly body: string;
  /** Marks the one stage the company is actually at today. */
  readonly here?: boolean;
};

export const horizon = {
  id: "horizon",
  kicker: "What tomorrow holds",
  title: "From detection to prediction.",
  stages: [
    {
      title: "Detection",
      body: "Finding what is already buried, from the air.",
      here: true,
    },
    {
      title: "Autonomous clearance",
      body:
        "Closing the loop from detection to clearance. Our heroes must not risk their lives in a minefield.",
    },
    {
      title: "Threat anticipation",
      body: "Reading ground before anything is emplaced - knowing where the danger will be, not only where it is.",
    },
  ] satisfies readonly HorizonStage[],
} as const;

export type PressItem = {
  readonly date: string;
  readonly dateLabel: string;
  readonly title: string;
  /** Omitted where the headline already says everything the entry needs to. */
  readonly body?: string;
  readonly source: string;
  /** Omitted where no public page reports the item — a milestone still stands
   *  on its own, but we will not point at a citation that does not name us. */
  readonly href?: string;
};

export type PressEmbed = {
  /** Accessible name for the frame. */
  readonly title: string;
  /** Platform frame endpoint. */
  readonly src: string;
  /** Canonical post, for readers who would rather open it on the platform. */
  readonly href: string;
  readonly caption: string;
};

export const press = {
  id: "press",
  kicker: "Press & milestones",
  title: "The record so far.",
  featured: {
    date: "2026-08-06",
    dateLabel: "6 August 2026",
    title: "Aerosearch Technologies wins Boeing BUILD 2026",
    body:
      "Named among seven winners of the fifth edition of Boeing's University Innovation Leadership Development programme, from a field that has drawn more than 7,000 applications. The award carries a ₹10 lakh grant and a year of structured incubation.",
    source: "Boeing India",
    href: "https://www.boeing.co.in/boeing-in-india/build",
    image: "/press/boeing-build-2026.jpg",
    imageAlt:
      "The Aerosearch Technologies team receiving the winners' cheque for ₹10 lakh at the Boeing India programme announcement.",
    caption: "The award, 5 August 2026",
  },
  items: [
    {
      date: "2026-05-04",
      dateLabel: "May 2026",
      title: "Finalists, ILLUMIN8 founder bootcamp",
      source: "JITO JIIF",
      href: "https://www.instagram.com/reel/DX6kKTWIdWl/",
    },
    {
      date: "2026-01-07",
      dateLabel: "Jan 2026",
      title: "Second place, Himalayan Startup Trek",
      source: "IIT Mandi Catalyst",
      href: "https://www.linkedin.com/posts/iitmandicatalyst_iitmandicatalyst-iitmandi-humancomputerinteraction-activity-7414543225736273920-FSmF",
    },
    {
      date: "2024-11-18",
      dateLabel: "Nov 2024",
      title: "Aerosearch Technologies incorporated",
      body: "DPIIT-recognised. MSME-registered.",
      source: "Startin UP",
      href: "https://startinup.up.gov.in/",
    },
  ] satisfies readonly PressItem[],
  /**
   * Third-party posts, embedded from the platforms' own frame endpoints so the
   * page loads no external script of its own. Lazy so they cost nothing until
   * the reader reaches them.
   */
  embeds: {
    heading: "Seen elsewhere",
    items: [
      {
        title: "JITO JIIF on Aerosearch Technologies at ILLUMIN8",
        src: "https://www.instagram.com/reel/DX6kKTWIdWl/embed",
        href: "https://www.instagram.com/reel/DX6kKTWIdWl/",
        caption: "Instagram · JITO JIIF",
      },
      {
        title: "IIT Mandi Catalyst on the HST 2025–26 Grand Challenge finale",
        src: "https://www.linkedin.com/embed/feed/update/urn:li:activity:7414543225736273920",
        href: "https://www.linkedin.com/posts/iitmandicatalyst_iitmandicatalyst-iitmandi-humancomputerinteraction-activity-7414543225736273920-FSmF",
        caption: "LinkedIn · IIT Mandi Catalyst",
      },
    ] satisfies readonly PressEmbed[],
  },
  cta: { label: "Press enquiries", href: "#contact" },
} as const;

export type Partner = {
  readonly name: string;
  readonly src: string;
  /** Intrinsic pixel size of the file. */
  readonly width: number;
  readonly height: number;
  /** Rendered height in px, tuned per mark so the row reads optically even. */
  readonly displayHeight: number;
};

/**
 * Programmes and institutions Aerosearch is recognised by. Marks are used as
 * published; the FITT wordmark is its reversed form and the DPIIT lockup has had
 * its flat backing keyed out, and the nasscom DeepTech Club lockup has its
 * lower wordmark reversed to bone because the maroon it ships in is
 * unreadable on night. None of these alter the artwork itself.
 */
export const partners = {
  heading: "Supported by",
  items: [
    {
      name: "Boeing",
      src: "/logos/boeing.svg",
      width: 142,
      height: 33,
      displayHeight: 35,
    },
    {
      name: "DPIIT, Startup India - Government of India",
      src: "/logos/dpiit-startupindia.png",
      width: 391,
      height: 135,
      displayHeight: 55,
    },
    {
      name: "Startup India Seed Fund Scheme",
      src: "/logos/sisfs.png",
      width: 448,
      height: 352,
      displayHeight: 58,
    },
    {
      name: "FITT, IIT Delhi",
      src: "/logos/fitt.png",
      width: 235,
      height: 236,
      displayHeight: 53,
    },
    {
      name: "StartinUP - Government of Uttar Pradesh",
      src: "/logos/startinup.png",
      width: 184,
      height: 70,
      displayHeight: 43,
    },
    {
      name: "ILLUMIN8 by JITO",
      src: "/logos/illumin8.png",
      width: 176,
      height: 56,
      displayHeight: 43,
    },
    {
      name: "nasscom DeepTech Club",
      src: "/logos/deeptech.png",
      width: 152,
      height: 54,
      displayHeight: 44,
    },
  ] satisfies readonly Partner[],
} as const;

export const mission = {
  id: "mission",
  kicker: "Why we exist",
  title: "We put machines where the danger is, so people don't have to go there.",
  body:
    "It began with what one of us saw in service - ground that stays armed long after the fighting stops, and people sent to walk it anyway. Aerosearch Technologies exists to put a machine there first.",
} as const;

export type ContactDetail = {
  readonly label: string;
  readonly value: string;
  readonly href: string;
};

export const contact = {
  id: "contact",
  kicker: "Get in touch",
  title: "Let's make our homeland safe.",
  body:
    "Whether you are a defence partner, a mine action operator, a researcher, or a funder - we would like to hear from you.",
  cta: { label: "Email us", href: `mailto:${brand.email}` },
  details: [
    { label: "Direct", value: brand.email, href: `mailto:${brand.email}` },
    { label: "Alternate", value: brand.emailAlt, href: `mailto:${brand.emailAlt}` },
    { label: "Phone", value: brand.phone, href: `tel:${brand.phoneHref}` },
  ] satisfies readonly ContactDetail[],
  alt: "We reply to every enquiry.",
} as const;

export const footer = {
  columns: [
    {
      heading: "Explore",
      links: [
        { label: "Technology", href: "#technology" },
        { label: "Approach", href: "#approach" },
        { label: "Mission", href: "#mission" },
        { label: "Vision", href: "#horizon" },
        // { label: "Press", href: "#press" },
      ],
    },
    {
      heading: "Company",
      links: [
        { label: "Contact", href: "#contact" },
        { label: "Email", href: `mailto:${brand.email}` },
        { label: "Phone", href: `tel:${brand.phoneHref}` },
      ],
    },
  ],
  rights: `© ${new Date().getFullYear()} Aerosearch Technologies`,
} as const;
