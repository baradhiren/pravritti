// Single source of truth for page copy. Edit here to update the site.
// Copy is Hiren's own; structure adds project status + signature stats.

export const meta = {
  name: "Hiren Barad",
  kicker: "Code Entomologist",
  role: "QA Automation Lead",
  location: "Sutrapada, Gujarat, India",
  years: "",
  // Hero supporting line (tagline + the one fact that matters: QA → builder).
  lead:
    "QA lead turned builder. Ten+ years of industry experience. Now building my own products under Pravritti.",
  // Availability status shown on the home screen. Flip `available` by hand:
  //   true  → green "Open to projects"
  //   false → red   "Busy"
  available: true,
};

export const contact = {
  email: "baradhiren@hotmail.com",
  whatsappLabel: "+91 83475 50409",
  whatsappHref: "https://wa.me/918347550409",
  linkedin: "https://www.linkedin.com/in/baradhiren/",
  github: "https://github.com/baradhiren",
};

export const bio: string[] = [
  "A Kshatriya by caste, Farmer by heritage and an Engineer by experience. More than once I've been privileged to be the first dedicated QA hire. Leaving behind the frameworks, CI pipelines, and triage workflows that outlasted me.",
  "My work runs from manual testing to Playwright automation, CI/CD on-prem and in the cloud, and lately incorporating AI agents that help me write and maintain tests.",
  "Outside of Computers, I cycle, play games, and read books.",
];

export const tools: string[] = [
  "TypeScript",
  "Python",
  "Playwright",
  "Cypress",
  "Selenium",
  "REST API",
  "Agents",
  "CI/CD",
  "Docker",
  "Kubernetes",
  "AWS",
  "Azure",
  "GCP",
  "Flutter",
];

export type Stat = { value: string; label: string };

export type Role = {
  company: string;
  title: string;
  period: string;
  place: string;
  blurb: string;
  bullets?: string[];
  stat?: Stat;
};

export const experience: Role[] = [
  {
    company: "Vividly",
    title: "QA Lead",
    period: "Apr 2024 – Apr 2026",
    place: "Remote",
    blurb:
      'Got exposed to the world of "TPM". A challenging space to work in and grateful for the experience.',
    stat: { value: "AI-first", label: "test generation in QA" },
    bullets: [
      "First dedicated QA engineer; built the quality processes, entry/exit criteria, and bug-triage workflows adopted across all engineering teams.",
      "Co-built a Playwright end-to-end automation framework from scratch, wired into CI.",
      "Pioneered AI in QA — agents that auto-generate and maintain tests, cutting authoring time and lifting regression coverage.",
    ],
  },
  {
    company: "TestGorilla",
    title: "Senior Quality Engineer",
    period: "Sep 2021 – Mar 2023",
    place: "Remote",
    blurb:
      "A revolutionary take on hiring with a supportive culture to complement it. This place taught me to think about the culture of quality and how to effectively work remotely.",
    stat: { value: "0 → 40%", label: "automated coverage, solo" },
    bullets: [
      "Standalone QA at first; drafted the QA framework from scratch and grew the function as the org scaled.",
      "Took the core platform to 40% automated coverage with Playwright in CI/CD.",
      "Stood up TestRail for central, real-time release-quality visibility.",
    ],
  },
  {
    company: "Blackhawk Network",
    title: "SDET II",
    period: "Jun 2020 – Sep 2021",
    place: "Bengaluru",
    blurb:
      "This is where I learned to lead. I designed an automation framework from scratch, got it to 84% coverage across the critical flows, and embedded the tests into the deployment pipeline so regressions got caught at the door, not in production.",
    stat: { value: "84%", label: "coverage · led a team of 4" },
    bullets: [
      "Built an automation framework from scratch to 84% coverage across critical flows.",
      "Embedded automated tests into deployment pipelines, cutting regression cycle time.",
      "Led and mentored a team of 4 QA engineers.",
    ],
  },
  {
    company: "Technicolor",
    title: "Automation Test Engineer",
    period: "Mar 2019 – Jun 2020",
    place: "Bengaluru",
    blurb:
      "Learned about computer graphics pipelines, built a Python/Django app to visualise performance-test data so results were actually readable across teams, and standardised GUI test automation on Linux after putting the open-source options (Xnee, ldtp2, dogtail) through their paces.",
    bullets: [
      "Built a Python/Django app to visualise performance-test data across teams.",
      "Standardised Linux GUI test automation after evaluating open-source tooling.",
      "Set up CI/CD with Git + Jenkins; supported VCS migrations.",
    ],
  },
  {
    company: "UST Global",
    title: "Where the decade started",
    period: "2015 – 2019",
    place: "Bengaluru / India",
    blurb:
      "At UST Global I wrote PowerShell + AutoIt automation that added ~20% coverage and ran System Integration Testing inside a Scrum team. Before that, at Capgemini, I built and maintained Selenium WebDriver suites across client engagements and pushed overall coverage to 85%.",
  },
  {
    company: "Capgemini",
    title: "Where the decade started",
    period: "2015 – 2019",
    place: "Bengaluru / India",
    blurb:
      "At UST Global I wrote PowerShell + AutoIt automation that added ~20% coverage and ran System Integration Testing inside a Scrum team. Before that, at Capgemini, I built and maintained Selenium WebDriver suites across client engagements and pushed overall coverage to 85%.",
  },
];

export type ProjectStatus = "building" | "learning" | "soon" | "shipped";

export type Project = {
  name: string;
  kind: string;
  status: ProjectStatus;
  blurb: string;
  href?: string; // present for context, only linked when live === true
  live?: boolean;
};

export const projects: Project[] = [
  {
    name: "Tithi",
    kind: "Android / iOS app",
    status: "building",
    href: "https://tithi.pravritti.org",
    live: false,
    blurb:
      "My take on a calendar app that is more India-centric — an attempt to build a tool that enables people with a specific belief system. I started it for my father, but I'm hoping it can help more people.",
  },
  {
    name: "Saptapar",
    kind: "Open-world action-adventure game",
    status: "learning",
    href: "https://saptapar.pravritti.org",
    live: false,
    blurb:
      "When I returned to my hometown after Covid it felt like I had entered a new world. I knew the people, places, and customs. But I had been away for so long that all of it seemed remote. At first I tried to fight it but then started understanding the nuances of the culture. Saptapar is my attempt to capture these nuances in a 3D open world adventure game set in my village.",
  },
  {
    name: "Pravritti",
    kind: "Culture Engineering",
    status: "soon",
    href: "https://pravritti.org",
    live: false,
    blurb: "Pravritti is an ever evolving project. Will post more updates on what this is about.",
  },
  {
    name: "Cold Storage Monitor",
    kind: "Raspberry Pi",
    status: "shipped",
    blurb:
      "A real-time cold-storage monitor on a Raspberry Pi with camera, motion, and thermal sensors — live temperature alerts and entrance motion capture.",
  },
  {
    name: "Telegram Bot",
    kind: "Python",
    status: "shipped",
    blurb:
      "Interactive messaging workflows built on the Telegram Bot API. Helped me fetch excerpts from Wikipedia before the AI age.",
  },
  {
    name: "VM Deployer",
    kind: "vSphere helper",
    status: "shipped",
    blurb:
      "A helper to manage vSphere VMs hosting a web app that a Selenium framework had to validate. Before it, our team manually deployed VMs before triggering automation (oh, the irony).",
  },
];

export const statusMeta: Record<ProjectStatus, { label: string; tone: string }> = {
  building: { label: "Building", tone: "coral" },
  learning: { label: "Learning", tone: "sun" },
  soon: { label: "Coming soon", tone: "muted" },
  shipped: { label: "Shipped", tone: "leaf" },
};

// Company logo files — DROP REAL LOGOS HERE (svg/png) to replace the monogram
// placeholders. Keyed by experience[].company. See public/logos/companies/.
export const companyLogos: Record<string, string> = {
  Vividly: "/logos/companies/vividly.svg",
  TestGorilla: "/logos/companies/testgorilla.svg",
  "Blackhawk Network": "/logos/companies/blackhawk.svg",
  Technicolor: "/logos/companies/technicolor.svg",
  "UST Global": "/logos/companies/ust.svg",
  Capgemini: "/logos/companies/capgemini.svg",
};

// Photos for the About pop-up marquee. Swap the placeholder files in
// public/photos/ for your own shots (update src/alt here as needed).
export const photos: { src: string; alt: string }[] = [
  { src: "/photos/lens-01.webp", alt: "A photo taken by Hiren" },
  { src: "/photos/lens-02.webp", alt: "A photo taken by Hiren" },
  { src: "/photos/lens-03.webp", alt: "A photo taken by Hiren" },
  { src: "/photos/lens-04.webp", alt: "A photo taken by Hiren" },
  { src: "/photos/lens-05.webp", alt: "A photo taken by Hiren" },
  { src: "/photos/lens-06.webp", alt: "A photo taken by Hiren" },
  { src: "/photos/lens-07.webp", alt: "A photo taken by Hiren" },
  { src: "/photos/lens-08.webp", alt: "A photo taken by Hiren" },
  { src: "/photos/lens-09.webp", alt: "A photo taken by Hiren" },
  { src: "/photos/lens-10.webp", alt: "A photo taken by Hiren" },
  { src: "/photos/lens-11.webp", alt: "A photo taken by Hiren" },
  { src: "/photos/lens-12.webp", alt: "A photo taken by Hiren" },
  { src: "/photos/lens-13.webp", alt: "A photo taken by Hiren" },
  { src: "/photos/lens-14.webp", alt: "A photo taken by Hiren" },
];

// Project logos — either a "/logos/projects/*" image path or an Iconify "logos"
// slug. Anything undefined renders a citrus monogram from the project's initial.
// Keyed by name.
export const projectLogos: Record<string, string | undefined> = {
  Tithi: "/logos/projects/tithi.webp",
  Saptapar: "/logos/projects/saptapar.webp",
  "Pravritti": "/logos/projects/pravritti.webp",
  "Cold Storage Monitor": "raspberry-pi",
  "Telegram Bot": "telegram",
  "VM Deployer": "vmware",
};
