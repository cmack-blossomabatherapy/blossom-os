import {
  Sparkles, Heart, Compass, Users, GraduationCap, BookOpen, ShieldCheck, ClipboardCheck, Award,
  Building2, UserCheck, Eye, MonitorPlay, Workflow, Database, MapPin, Briefcase, Megaphone,
  CalendarDays, BarChart3, MessageSquare, Target, Rocket, Trophy, FileText, PlayCircle, Wand2,
  Network, Phone, Building, ListChecks, Mail, Inbox, Folder, Headphones, type LucideIcon,
} from "lucide-react";

export type OnboardingPath = "existing_state" | "new_state";

export interface ActionItem {
  id: string;
  label: string;
  hint?: string;
  href?: string;        // internal route or external URL
  external?: boolean;
  icon?: LucideIcon;
  optional?: boolean;
  /** When true, surfaces a textarea for the user to type a reflection.
   *  The action is only completable once they've typed something. */
  prompt?: boolean;
  /** Placeholder for the reflection textarea. */
  promptPlaceholder?: string;
}

export interface JourneyModule {
  key: string;                  // unique storage key, e.g. "w1.systems.cr"
  title: string;
  blurb: string;
  icon: LucideIcon;
  estMinutes: number;
  /** Module kind drives the rendered card variant. */
  kind: "content" | "leader" | "shadowing" | "system" | "checkin" | "outcome" | "department" | "video";
  /** For video kind — optional URL; leave empty to render the branded "coming soon" placeholder. */
  video?: { url?: string; poster?: string; duration?: string; presenter?: string };
  /** Optional details by kind */
  leader?: { name: string; role: string; message: string; initials: string; letter?: { greeting: string; paragraphs: string[]; signOff: string[] } };
  system?: { name: string; videoLabel?: string; sopLabel?: string; tangoLabel?: string };
  shadowing?: {
    /** Optional ordered stages — used for transition scenarios (e.g. shadow A, then Gary Frank). */
    stages?: { id: string; assignee: string; role: string; initials: string; days?: string; description?: string }[];
    /** Fallback single assignee when stages aren't used. */
    assignee?: string;
    /** Checkable observation goals — all must be checked to complete shadowing. */
    goals: string[];
  };
  outcomeBullets?: string[];
  /** Clickable, enriching to-dos. Completing all required actions can auto-complete the module. */
  actions?: ActionItem[];
  /** If set, only render when path matches. */
  pathOnly?: OnboardingPath;
}

export interface JourneyPhase {
  id: "welcome" | "w1" | "w2" | "w3" | "w4" | "graduation";
  index: number;
  weekLabel: string;          // e.g. "Phase 0", "Week 1"
  title: string;
  objective: string;
  icon: LucideIcon;
  path: string;
  modules: JourneyModule[];
  outcome?: { title: string; bullets: string[] };
}

const LEADERS = {
  chad: { name: "Chad Kaufman", role: "Leadership", initials: "CK" },
  shira: { name: "Shira Lasry", role: "ABA Operations", initials: "SL" },
  gary: { name: "Gary Frank", role: "Operations", initials: "GF" },
  daylis: { name: "Daylis", role: "Scheduling", initials: "DA" },
  nick: { name: "Nick", role: "Marketing", initials: "NK" },
  corey: { name: "Corey", role: "Tracking & Reporting", initials: "CO" },
  eli: { name: "Eli Berman", role: "CR Backend", initials: "EB" },
  nikki: { name: "Nikki Goldenberg", role: "HR Lead", initials: "NG" },
};

export const ONBOARDING_PHASES: JourneyPhase[] = [
  {
    id: "welcome",
    index: 0,
    weekLabel: "Phase 0",
    title: "Welcome to Blossom",
    objective: "Get grounded in who we are, what we believe, and what to expect over your first four weeks as an HR Admin Assistant.",
    icon: Sparkles,
    path: "/onboarding/phase/welcome",
    modules: [
      { key: "p0.intro-video", title: "Welcome video from Blossom!", blurb: "A quick personal intro to Blossom — what we do, how we work, and why you're going to love it here.", icon: PlayCircle, estMinutes: 4, kind: "video",
        video: { url: "/videos/intro-welcome.mp4", poster: "/videos/intro-welcome-poster.jpg", presenter: "Blossom", duration: "~3 min" },
        actions: [
          { id: "watch", label: "Watch the welcome video", icon: PlayCircle },
          { id: "reflect", label: "What's one thing that stood out to you?", prompt: true, promptPlaceholder: "Share a sentence or two — there are no wrong answers.", icon: MessageSquare },
        ] },
      { key: "p0.mission", title: "Mission & Vision", blurb: "Why we exist and where we're going.", icon: Heart, estMinutes: 5, kind: "content",
        actions: [
          { id: "read", label: "Read the Mission & Vision page", icon: BookOpen, href: "/onboarding/mission" },
          { id: "reflect", label: "Which part resonates with you most?", prompt: true, promptPlaceholder: "A sentence or two is plenty.", icon: MessageSquare },
        ] },
      { key: "p0.values", title: "Core Values", blurb: "The four values that guide every decision.", icon: Compass, estMinutes: 6, kind: "content",
        actions: [
          { id: "open", label: "Open the Core Values page", icon: Compass, href: "/onboarding/values" },
          { id: "pick", label: "Pick a value you'd like to live this week", icon: Target, prompt: true, promptPlaceholder: "Which value, and how will you live it?" },
        ] },
      { key: "p0.team", title: "Meet the Team", blurb: "Who you'll work with at Blossom.", icon: Users, estMinutes: 5, kind: "content",
        actions: [
          { id: "team-page", label: "Open the Team directory", icon: Users, href: "/onboarding/team" },
          { id: "org-chart", label: "Browse the Org Chart", icon: Network, href: "/onboarding/org-chart" },
          { id: "leaders", label: "Read the Meet the Team page", icon: BookOpen, href: "/onboarding/meet-the-team" },
        ] },
      { key: "p0.how", title: "How Blossom Works", blurb: "How learning, training, and growth fit together.", icon: GraduationCap, estMinutes: 5, kind: "content",
        actions: [
          { id: "how", label: "Read How Blossom Works", icon: BookOpen, href: "/onboarding/how-it-works" },
          { id: "academy", label: "Peek at the Operations Academy", icon: GraduationCap, href: "/onboarding/academy-preview" },
        ] },
      { key: "p0.chad", title: "Welcome from Chad Kaufman", blurb: "Leadership expectations, oversight, and company vision.", icon: UserCheck, estMinutes: 4, kind: "leader",
        leader: {
          ...LEADERS.chad,
          message: "A personal letter from our CEO/COO — open it to read the full message.",
          letter: {
            greeting: "Welcome to Blossom ABA Therapy.",
            paragraphs: [
              "First, I want to personally thank you for being here.",
              "Joining a company is more than accepting a position. You are choosing a team, a culture, and a mission to become part of every single day. At Blossom, we do not take that lightly.",
              "Everything we do is centered around supporting children and families through meaningful, compassionate ABA services. Behind every phone call, every schedule, every report, every authorization, every therapy session, and every workflow is a real family trusting us during an important time in their lives.",
              "That responsibility matters.",
              "As Blossom continues to grow, one of the things I am most proud of is the team we are building. We believe great care requires great people, strong communication, accountability, organization, and a willingness to continuously improve.",
              "No matter your role within the company, your work has an impact.",
              "Whether you are directly supporting families, helping behind the scenes operationally, leading a department, managing systems, recruiting staff, scheduling services, or supporting clinical quality, you are helping create the experience families have with Blossom.",
              "We are building a company that values compassion, professionalism, structure, teamwork, innovation, and growth.",
              "Most importantly, we are building a culture where people support one another and work together toward something bigger than themselves.",
              "As you begin your journey here, I encourage you to stay curious, ask questions, take ownership of your growth, and fully engage in the onboarding process. Blossom Academy was created to help you feel supported, confident, and prepared from day one.",
              "We are excited to grow with you and thankful to have you as part of the Blossom team.",
              "Welcome to Blossom.",
            ],
            signOff: ["Chad Kaufman", "CEO / COO", "Blossom ABA Therapy"],
          },
        },
        actions: [
          { id: "letter", label: "Open Chad's welcome letter", icon: BookOpen },
          { id: "note", label: "Jot down one expectation Chad mentioned", icon: FileText },
        ] },
      { key: "p0.shira", title: "A note from Shira Lasry", blurb: "This onboarding journey was designed for you.", icon: UserCheck, estMinutes: 4, kind: "leader",
        leader: {
          ...LEADERS.shira,
          message: "A personal letter from our Director of Operations & Company Experience — open it to read the full message.",
          letter: {
            greeting: "Welcome to Blossom.",
            paragraphs: [
              "I am truly excited to welcome you to our team.",
              "At Blossom, we believe that creating an incredible experience for families begins internally with communication, structure, teamwork, and support. Every department within the company plays an important role in helping children and families receive the care they deserve.",
              "As you move through onboarding, you will begin to see how deeply connected our operations truly are. Intake, scheduling, authorizations, recruiting, training, QA, clinical support, leadership, and operations all work together every single day to keep Blossom moving forward.",
              "One of the most important things to understand about Blossom is that we care deeply about both people and process.",
              "We believe strong systems create stronger support for families.",
              "We believe accountability creates trust.",
              "We believe communication solves problems.",
              "And we believe growth never stops.",
              "You are not expected to know everything immediately. This onboarding experience was intentionally designed to guide you step by step, introduce you to our systems and workflows, and help you understand not only what we do, but why we do it.",
              "As Director of Operations & Company Experience, one of my biggest priorities is creating an environment where employees feel supported, empowered, organized, and connected to the mission of the company.",
              "Please know: questions are encouraged, learning is expected, growth is supported, and teamwork matters.",
              "The work we do can be fast paced and highly operational, but at the center of everything are families relying on us to help guide and support them.",
              "That purpose should always remain at the heart of our work.",
              "Thank you for being part of Blossom. I am excited to watch you grow here and become part of the incredible team we are continuing to build together.",
              "Welcome to the Blossom family.",
            ],
            signOff: ["Shira Lasry", "Director of Operations & Company Experience", "Blossom ABA Therapy"],
          },
        },
        actions: [
          { id: "letter", label: "Open Shira's welcome letter", icon: BookOpen },
          { id: "save-num", label: "Save Shira's contact for daily check-ins", icon: Phone },
        ] },
    ],
  },
  {
    id: "w1",
    index: 1,
    weekLabel: "Week 1",
    title: "Foundation, Culture & Systems Tour",
    objective: "4 hrs/day. Get oriented to Blossom, meet the team, and tour every system the HR Admin Assistant uses day-to-day.",
    icon: Building2,
    path: "/onboarding/week/1",
    modules: [
      { key: "w1.team", title: "Meet the Team", blurb: "Who you'll partner with — Nikki, Shira, leadership, and your HR peers.", icon: Users, estMinutes: 30, kind: "content",
        actions: [
          { id: "team", label: "Open the Team page", icon: Users, href: "/onboarding/team" },
          { id: "org", label: "Open the Org Chart", icon: Network, href: "/onboarding/org-chart" },
          { id: "intro", label: "Say hi in the HR channel", icon: MessageSquare, optional: true },
        ] },
      { key: "w1.lead.nikki", title: "Kick-off with Nikki Goldenberg", blurb: "Your manager walks you through the role, the 4-week plan, and what success looks like.", icon: UserCheck, estMinutes: 45, kind: "leader",
        leader: { ...LEADERS.nikki, message: "Welcome! Let's walk through your 4-week plan, the systems you'll own, and how we work together." },
        actions: [
          { id: "schedule", label: "Confirm the kick-off on the calendar", icon: CalendarDays },
          { id: "prep", label: "Prep 3 questions about the role", icon: FileText },
          { id: "after", label: "Capture 1 takeaway after the meeting", icon: ClipboardCheck },
        ] },
      { key: "w1.sys.viventium", title: "Viventium tour", blurb: "Payroll & HRIS — where employee records live.", icon: MonitorPlay, estMinutes: 45, kind: "system",
        system: { name: "Viventium", sopLabel: "View Viventium SOP" },
        actions: [
          { id: "login", label: "Log in to Viventium", icon: MonitorPlay },
          { id: "sop", label: "Skim the Viventium SOP", icon: FileText },
          { id: "explore", label: "Open an employee record", icon: ClipboardCheck },
        ] },
      { key: "w1.sys.tapcheck", title: "Tapcheck tour", blurb: "Earned wage access — what employees ask about most.", icon: MonitorPlay, estMinutes: 30, kind: "system",
        system: { name: "Tapcheck", sopLabel: "View Tapcheck SOP" },
        actions: [
          { id: "login", label: "Log in to Tapcheck admin", icon: MonitorPlay },
          { id: "sop", label: "Read the Tapcheck SOP", icon: FileText },
        ] },
      { key: "w1.sys.jivetel", title: "Jivetel tour", blurb: "Phones — extensions, call routing, and audits.", icon: Phone, estMinutes: 30, kind: "system",
        system: { name: "Jivetel", sopLabel: "View Jivetel SOP" },
        actions: [
          { id: "login", label: "Log in to Jivetel admin", icon: Phone },
          { id: "sop", label: "Read the Jivetel SOP", icon: FileText },
        ] },
      { key: "w1.sys.collab", title: "Teams, Outlook & SharePoint", blurb: "Where we communicate, schedule, and store HR files.", icon: Folder, estMinutes: 45, kind: "system",
        system: { name: "Microsoft 365", sopLabel: "View M365 SOP" },
        actions: [
          { id: "teams", label: "Sign in to Teams", icon: MessageSquare },
          { id: "outlook", label: "Sign in to Outlook", icon: Mail },
          { id: "sp", label: "Open the HR SharePoint site", icon: Folder },
        ] },
      { key: "w1.sys.access", title: "Access provisioning walkthrough", blurb: "How we issue phone, email, and system access for new employees.", icon: ShieldCheck, estMinutes: 45, kind: "system",
        system: { name: "Access Provisioning", sopLabel: "View provisioning SOP" },
        actions: [
          { id: "sop", label: "Read the access provisioning SOP", icon: FileText },
          { id: "checklist", label: "Save the new-hire access checklist", icon: ListChecks },
        ] },
    ],
    outcome: {
      title: "Week One Outcome",
      bullets: [
        "Know the team and your manager Nikki",
        "Logged in to Viventium, Tapcheck, Jivetel, Teams, Outlook & SharePoint",
        "Understand how new-hire access is provisioned",
      ],
    },
  },
  {
    id: "w2",
    index: 2,
    weekLabel: "Week 2",
    title: "Answering Employees, Phones & New Hire Setup",
    objective: "4 hrs/day. Start handling employee questions, phones, HR Request Forms, and new-hire setups under guidance.",
    icon: Headphones,
    path: "/onboarding/week/2",
    modules: [
      { key: "w2.questions", title: "Answering employee questions", blurb: "Tone, escalation paths, and what's HR vs. payroll vs. ops.", icon: MessageSquare, estMinutes: 60, kind: "content",
        actions: [
          { id: "sop", label: "Read the employee Q&A playbook", icon: FileText },
          { id: "shadow", label: "Sit with Nikki on 5 live questions", icon: Eye },
        ] },
      { key: "w2.phones", title: "Answering phone calls", blurb: "Greeting script, transfers, voicemail, and Jivetel basics.", icon: Phone, estMinutes: 45, kind: "system",
        system: { name: "Jivetel — Calls", sopLabel: "View call-handling SOP" },
        actions: [
          { id: "script", label: "Memorize the greeting script", icon: BookOpen },
          { id: "live", label: "Take 3 supervised calls", icon: Headphones },
        ] },
      { key: "w2.hrforms", title: "HR Request Forms", blurb: "How requests come in, get triaged, and get closed out.", icon: ClipboardCheck, estMinutes: 45, kind: "system",
        system: { name: "HR Request Forms", sopLabel: "View HR Forms SOP" },
        actions: [
          { id: "sop", label: "Read the HR Request Forms SOP", icon: FileText },
          { id: "process", label: "Process 2 forms end-to-end with Nikki", icon: ClipboardCheck },
        ] },
      { key: "w2.tap-viv", title: "Tapcheck & Viventium SOPs", blurb: "Common employee asks: paystubs, direct deposit, Tapcheck enrollment.", icon: MonitorPlay, estMinutes: 60, kind: "system",
        system: { name: "Tapcheck & Viventium", sopLabel: "View payroll SOPs" },
        actions: [
          { id: "sop", label: "Read both SOPs end-to-end", icon: FileText },
          { id: "answer", label: "Answer 3 sample employee questions", icon: MessageSquare },
        ] },
      { key: "w2.newhire", title: "New employee setup", blurb: "Phone extension, email, system accesses, and welcome packet.", icon: UserCheck, estMinutes: 60, kind: "system",
        system: { name: "New Hire Setup", sopLabel: "View new-hire setup checklist" },
        actions: [
          { id: "checklist", label: "Walk through the new-hire checklist", icon: ListChecks },
          { id: "shadow", label: "Shadow Nikki on a live new-hire setup", icon: Eye },
        ] },
      { key: "w2.checkin.nikki", title: "Daily check-ins with Nikki", blurb: "Short daily touchpoints — wins, blockers, questions.", icon: MessageSquare, estMinutes: 75, kind: "checkin",
        actions: [
          { id: "recurring", label: "Set a recurring daily 10-minute slot", icon: CalendarDays },
        ] },
    ],
    outcome: {
      title: "Week Two Outcome",
      bullets: [
        "Comfortably answer common employee questions",
        "Take and route phone calls confidently",
        "Triage HR Request Forms",
        "Run a new-hire setup with guidance",
      ],
    },
  },
  {
    id: "w3",
    index: 3,
    weekLabel: "Week 3",
    title: "Audits, Mail & SharePoint Organization",
    objective: "4 hrs/day. Own the recurring audits, daily mail, and HR file organization that keep the back office clean.",
    icon: Inbox,
    path: "/onboarding/week/3",
    modules: [
      { key: "w3.audit.jivetel", title: "Jivetel audits", blurb: "Verify extensions, routing, and active users line up.", icon: Phone, estMinutes: 60, kind: "system",
        system: { name: "Jivetel Audits", sopLabel: "View Jivetel audit SOP" },
        actions: [
          { id: "sop", label: "Read the Jivetel audit SOP", icon: FileText },
          { id: "first", label: "Run your first audit pass", icon: ClipboardCheck },
        ] },
      { key: "w3.audit.email", title: "Email audits", blurb: "Confirm distribution lists, mailboxes, and access are accurate.", icon: Mail, estMinutes: 60, kind: "system",
        system: { name: "Email Audits", sopLabel: "View email audit SOP" },
        actions: [
          { id: "sop", label: "Read the email audit SOP", icon: FileText },
          { id: "first", label: "Complete your first email audit", icon: ClipboardCheck },
        ] },
      { key: "w3.sharepoint", title: "Organizing SharePoint / HR", blurb: "Folder structure, naming conventions, and retention.", icon: Folder, estMinutes: 90, kind: "system",
        system: { name: "SharePoint — HR", sopLabel: "View HR SharePoint SOP" },
        actions: [
          { id: "sop", label: "Read the SharePoint organization SOP", icon: FileText },
          { id: "tidy", label: "Tidy one HR folder end-to-end", icon: ClipboardCheck },
        ] },
      { key: "w3.mail", title: "Daily mail & scan mail", blurb: "Pick up, sort, scan, and route physical mail to the right owner.", icon: Inbox, estMinutes: 45, kind: "system",
        system: { name: "Daily Mail", sopLabel: "View daily mail SOP" },
        actions: [
          { id: "sop", label: "Read the daily mail SOP", icon: FileText },
          { id: "run", label: "Run a full mail-and-scan cycle", icon: ClipboardCheck },
        ] },
      { key: "w3.checkin.nikki", title: "Mid-program check-in with Nikki", blurb: "Calibrate on quality, speed, and what to push deeper next week.", icon: MessageSquare, estMinutes: 30, kind: "checkin",
        actions: [
          { id: "agenda", label: "Bring an agenda (wins, blockers, asks)", icon: FileText },
        ] },
    ],
    outcome: {
      title: "Week Three Outcome",
      bullets: [
        "Audits run on a clean cadence",
        "HR SharePoint stays organized",
        "Daily mail handled reliably",
      ],
    },
  },
  {
    id: "w4",
    index: 4,
    weekLabel: "Week 4",
    title: "Workers Comp & Independent Operations",
    objective: "4 hrs/day. Add workers comp, run the desk solo, and prepare to step up to 8 hrs/day.",
    icon: ShieldCheck,
    path: "/onboarding/week/4",
    modules: [
      { key: "w4.wc.overview", title: "Workers comp claims overview", blurb: "What a claim looks like end-to-end and where HR fits in.", icon: ShieldCheck, estMinutes: 60, kind: "content",
        actions: [
          { id: "sop", label: "Read the workers comp SOP", icon: FileText },
          { id: "lifecycle", label: "Map the claim lifecycle on paper", icon: FileText },
        ] },
      { key: "w4.wc.live", title: "Open & follow up on a claim", blurb: "Walk a real claim with Nikki — intake, documentation, follow-up cadence.", icon: ClipboardCheck, estMinutes: 90, kind: "system",
        system: { name: "Workers Comp", sopLabel: "View workers comp SOP" },
        actions: [
          { id: "shadow", label: "Shadow opening one claim", icon: Eye },
          { id: "followup", label: "Run a follow-up touchpoint", icon: MessageSquare },
        ] },
      { key: "w4.solo.newhire", title: "Run a new-hire setup solo", blurb: "Phone, email, accesses — start to finish without a hand-hold.", icon: UserCheck, estMinutes: 90, kind: "content",
        actions: [
          { id: "checklist", label: "Open the new-hire checklist", icon: ListChecks },
          { id: "complete", label: "Complete a setup independently", icon: ClipboardCheck },
        ] },
      { key: "w4.solo.day", title: "Independent day on phones & forms", blurb: "Own the desk for a 4-hour shift — calls, requests, audits.", icon: Headphones, estMinutes: 240, kind: "content",
        actions: [
          { id: "shift", label: "Run an independent 4-hour shift", icon: Target },
          { id: "log", label: "Log everything you handled", icon: FileText },
        ] },
      { key: "w4.checkin.nikki", title: "Accountability check-in with Nikki", blurb: "Review the solo day, gaps, and readiness to step up.", icon: MessageSquare, estMinutes: 30, kind: "checkin",
        actions: [
          { id: "agenda", label: "Bring wins, gaps, and questions", icon: FileText },
        ] },
      { key: "w4.reflect", title: "Reflection & move to 8 hrs/day", blurb: "Lock in the habits that made it work and plan the jump to full schedule.", icon: Trophy, estMinutes: 30, kind: "content",
        actions: [
          { id: "reflect", label: "Write a 1-page reflection", icon: FileText },
          { id: "schedule", label: "Confirm the new 8-hr schedule with Nikki", icon: CalendarDays },
        ] },
    ],
    outcome: {
      title: "Ownership Milestone",
      bullets: [
        "Comfortable with workers comp claims",
        "Running new-hire setups solo",
        "Holding the desk independently",
        "Ready to move to 8 hrs/day",
      ],
    },
  },
  {
    id: "graduation",
    index: 5,
    weekLabel: "Graduation",
    title: "Onboarding Complete",
    objective: "Celebrate, claim your certificate, and unlock the full Academy.",
    icon: Award,
    path: "/onboarding/graduation",
    modules: [
      { key: "grad.cert", title: "Claim your certificate", blurb: "Receive your Blossom Onboarding Certificate.", icon: Award, estMinutes: 5, kind: "content" },
    ],
  },
];

/** Returns modules for a phase, filtered by path. */
export function modulesForPath(phase: JourneyPhase, path: OnboardingPath): JourneyModule[] {
  return phase.modules.filter((m) => !m.pathOnly || m.pathOnly === path);
}

/** All required module keys across all phases for a given path (excludes graduation). */
export function requiredModuleKeys(path: OnboardingPath): string[] {
  return ONBOARDING_PHASES
    .filter((p) => p.id !== "graduation")
    .flatMap((p) => modulesForPath(p, path).map((m) => m.key));
}

export function getPhase(id: JourneyPhase["id"]): JourneyPhase | undefined {
  return ONBOARDING_PHASES.find((p) => p.id === id);
}

export function totalMinutes(path: OnboardingPath): number {
  return ONBOARDING_PHASES.flatMap((p) => modulesForPath(p, path)).reduce((s, m) => s + m.estMinutes, 0);
}