import {
  Sparkles, Heart, Compass, Users, GraduationCap, BookOpen, ShieldCheck, ClipboardCheck, Award,
  Building2, UserCheck, Eye, MonitorPlay, Workflow, Database, MapPin, Briefcase, Megaphone,
  CalendarDays, BarChart3, MessageSquare, Target, Rocket, Trophy, FileText, PlayCircle, Wand2,
  Network, Phone, Building, ListChecks, Mail, Inbox, Folder, Headphones, type LucideIcon,
} from "lucide-react";
import introVideoAsset from "@/assets/intro-video-1.1.mp4.asset.json";

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
  kind: "content" | "leader" | "letter" | "shadowing" | "system" | "checkin" | "outcome" | "department" | "video";
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
    objective: "Universal onboarding for every new Blossom employee. Get grounded in who we are, what we believe, and how the company actually works — before your role-specific training begins.",
    icon: Sparkles,
    path: "/onboarding/phase/welcome",
    modules: [
      { key: "welcome-video-from-blossom", title: "Welcome Video from Blossom", blurb: "A short welcome from Blossom leadership. Sets the tone: calm, practical, family-centered, and serious about doing the work well.", icon: PlayCircle, estMinutes: 4, kind: "video",
        video: { url: introVideoAsset.url, presenter: "Blossom", duration: "~3 min" },
        actions: [
          { id: "watch", label: "Watch the welcome video", icon: PlayCircle },
          { id: "reflect", label: "What's one thing that stood out to you?", prompt: true, promptPlaceholder: "Share a sentence or two — there are no wrong answers.", icon: MessageSquare },
        ] },
      { key: "welcome-mission-vision", title: "Mission & Vision", blurb: "Why Blossom exists and where we're going. Read it, rewrite it in your own words, and connect it to one operational metric you'll watch.", icon: Heart, estMinutes: 8, kind: "content",
        actions: [
          { id: "read", label: "Read the Mission & Vision section", icon: BookOpen, href: "/training/welcome" },
          { id: "rewrite", label: "Rewrite the mission in your own words", icon: FileText, prompt: true, promptPlaceholder: "One sentence is plenty." },
        ] },
      { key: "welcome-core-values", title: "Core Values", blurb: "The standards we use when the day gets complicated. Pick one that comes naturally and one that will take discipline.", icon: Compass, estMinutes: 8, kind: "content",
        actions: [
          { id: "read", label: "Read each core value", icon: BookOpen, href: "/training/welcome" },
          { id: "pick", label: "Pick a value that comes naturally and one that will take discipline", icon: Target, prompt: true, promptPlaceholder: "Which two values, and why?" },
        ] },
      { key: "welcome-meet-the-team", title: "Meet the Team", blurb: "Who owns what at Blossom — leadership, departments, and the partners you'll lean on most. Identify your mentor and first three department partners.", icon: Users, estMinutes: 8, kind: "content",
        actions: [
          { id: "read", label: "Review the leadership and department map", icon: Network, href: "/training/welcome" },
          { id: "mentor", label: "Identify your mentor and first three department partners", icon: Users, prompt: true, promptPlaceholder: "Mentor + 3 partners + one question for each." },
        ] },
      { key: "welcome-how-blossom-works", title: "How Blossom Works", blurb: "The 11-step Blossom flow from family interest to active care. Read it, draw it from memory, and mark the three places a state is most likely to get stuck.", icon: Workflow, estMinutes: 10, kind: "content",
        actions: [
          { id: "read", label: "Read the Blossom flow", icon: BookOpen, href: "/training/welcome" },
          { id: "draw", label: "Draw the flow from memory and mark three risk points", icon: FileText, prompt: true, promptPlaceholder: "List the three places a state is most likely to get stuck." },
        ] },
      { key: "welcome-letter-chad", title: "Welcome Letter from Chad", blurb: "A personal letter from our CEO — read it, do not skim. Capture one sentence that resonated.", icon: UserCheck, estMinutes: 5, kind: "letter",
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
      { key: "welcome-letter-shira", title: "Welcome Letter from Shira", blurb: "A personal letter from our Director of Operations — read it, do not skim. Bring one question for her team to your first mentor check-in.", icon: UserCheck, estMinutes: 5, kind: "letter",
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
    objective: "4 hrs/day. No experience needed — this week is just about getting comfortable. You'll meet the team, learn how Blossom thinks, and take a guided tour of every system you'll use. Nothing to memorize yet — just look, click, and ask questions.",
    icon: Building2,
    path: "/onboarding/week/1",
    modules: [
      { key: "w1.daily-structure", title: "Your daily 4-hour structure", blurb: "For the first 4 weeks you'll work 4 hrs/day. Here's exactly how to spend each hour so you're never wondering 'what should I do right now?'", icon: CalendarDays, estMinutes: 15, kind: "content",
        actions: [
          { id: "h1", label: "Hour 1 — Training modules & SOP review (read & learn)", icon: BookOpen },
          { id: "h2", label: "Hour 2 — Shadowing Nikki or a teammate (watch & ask)", icon: Eye },
          { id: "h3", label: "Hour 3 — Hands-on practice (try it yourself, with backup)", icon: ClipboardCheck },
          { id: "h4", label: "Hour 4 — Wrap up tasks, ask questions, log what you learned", icon: MessageSquare },
          { id: "save", label: "Save this 4-hour rhythm to your calendar", icon: CalendarDays },
        ] },
      { key: "w1.mission", title: "Mission, Vision & Core Values", blurb: "Why Blossom exists, where we're going, and the 4 values we live by. Knowing this helps you make good decisions when no one's looking.", icon: Heart, estMinutes: 20, kind: "content",
        actions: [
          { id: "mission", label: "Read the Mission & Vision page", icon: BookOpen, href: "/onboarding/mission" },
          { id: "values", label: "Read the Core Values page", icon: Compass, href: "/onboarding/values" },
          { id: "pick", label: "Pick the value that speaks to you most", prompt: true, promptPlaceholder: "Which value, and why?", icon: Target },
        ] },
      { key: "w1.team", title: "Meet the team & org chart", blurb: "Who's who at Blossom — leadership, HR, and the departments you'll talk to every day. You don't need to memorize names; just know where to look them up.", icon: Users, estMinutes: 30, kind: "content",
        actions: [
          { id: "team", label: "Open the Team page", icon: Users, href: "/onboarding/team" },
          { id: "org", label: "Open the Org Chart", icon: Network, href: "/onboarding/org-chart" },
          { id: "intro", label: "Say hi in the HR Teams channel", icon: MessageSquare },
          { id: "save5", label: "Save 5 names you think you'll talk to most", icon: FileText, prompt: true, promptPlaceholder: "Who are they? (Just guess — there's no wrong answer.)" },
        ] },
      { key: "w1.lead.nikki", title: "Kick-off with Nikki Goldenberg", blurb: "Your supervisor walks you through the role, the 4-week plan, and what 'doing a good job' actually looks like. Bring questions — there are no dumb ones.", icon: UserCheck, estMinutes: 45, kind: "leader",
        leader: { ...LEADERS.nikki, message: "Welcome! Let's walk through your 4-week plan, the systems you'll own, how we communicate, and what success looks like in week 4." },
        actions: [
          { id: "schedule", label: "Confirm the kick-off on your calendar", icon: CalendarDays },
          { id: "prep", label: "Write down 3 questions to ask Nikki", icon: FileText, prompt: true, promptPlaceholder: "Anything you want to understand better — role, schedule, who to ask for what." },
          { id: "after", label: "Capture 1 thing you learned in the meeting", icon: ClipboardCheck, prompt: true, promptPlaceholder: "One sentence is plenty." },
        ] },
      { key: "w1.comms", title: "Communication standards", blurb: "How we talk to each other and to employees. Professional, clear, kind. This is one of the most important habits to build early.", icon: MessageSquare, estMinutes: 25, kind: "content",
        actions: [
          { id: "outlook", label: "Email is for outside-Blossom and formal stuff", icon: Mail },
          { id: "teams", label: "Teams chat is for quick questions to coworkers", icon: MessageSquare },
          { id: "phones", label: "Phones — always answer with a friendly greeting", icon: Phone },
          { id: "respond", label: "Respond within 1 business day, even if just to say 'I'm on it'", icon: ClipboardCheck },
          { id: "confidential", label: "Never share employee info outside of who needs it", icon: ShieldCheck },
        ] },
      { key: "w1.sys.viventium", title: "Viventium tour (payroll & HRIS)", blurb: "Viventium is where every employee's paperwork lives — pay info, tax forms, hire dates, benefits. Today you're just looking around. Don't change anything.", icon: MonitorPlay, estMinutes: 45, kind: "system",
        system: { name: "Viventium", sopLabel: "View Viventium SOP" },
        actions: [
          { id: "login", label: "Log in to Viventium with your new credentials", icon: MonitorPlay },
          { id: "sop", label: "Skim the Viventium SOP (just the headings)", icon: FileText },
          { id: "explore", label: "Open one employee record and find their hire date", icon: ClipboardCheck },
          { id: "where", label: "Find where pay stubs live (employees ask this a lot)", icon: FileText },
        ] },
      { key: "w1.sys.tapcheck", title: "Tapcheck tour (early wage access)", blurb: "Tapcheck lets employees pull part of their pay before payday. Most employee questions you'll get are about Tapcheck enrollment — get familiar with it.", icon: MonitorPlay, estMinutes: 30, kind: "system",
        system: { name: "Tapcheck", sopLabel: "View Tapcheck SOP" },
        actions: [
          { id: "login", label: "Log in to the Tapcheck admin portal", icon: MonitorPlay },
          { id: "sop", label: "Read the Tapcheck SOP end-to-end", icon: FileText },
          { id: "find", label: "Find where you'd check if an employee is enrolled", icon: ClipboardCheck },
        ] },
      { key: "w1.sys.monday", title: "Monday.com tour (workflows & boards)", blurb: "Monday is where work lives — boards, requests, and tasks. Think of it like a to-do list everyone can see. You'll work out of it daily.", icon: Workflow, estMinutes: 40, kind: "system",
        system: { name: "Monday.com", sopLabel: "View Monday.com SOP" },
        actions: [
          { id: "login", label: "Log in to Monday.com", icon: MonitorPlay },
          { id: "boards", label: "Find the HR boards you'll work from", icon: Folder },
          { id: "item", label: "Open one item and read the comments", icon: MessageSquare },
          { id: "sop", label: "Skim the Monday.com SOP", icon: FileText },
        ] },
      { key: "w1.sys.jivetel", title: "Jivetel tour (phone system)", blurb: "Jivetel runs our phones — extensions, voicemail, and call routing. You'll answer the HR line and run audits on it later.", icon: Phone, estMinutes: 30, kind: "system",
        system: { name: "Jivetel", sopLabel: "View Jivetel SOP" },
        actions: [
          { id: "login", label: "Log in to the Jivetel admin portal", icon: Phone },
          { id: "sop", label: "Read the Jivetel SOP", icon: FileText },
          { id: "ext", label: "Find your own extension and voicemail", icon: ClipboardCheck },
        ] },
      { key: "w1.sys.collab", title: "Outlook, Teams & SharePoint", blurb: "Microsoft 365 = your daily desk. Outlook for email, Teams for chat & meetings, SharePoint for files & SOPs. Spend time clicking around so it's not scary later.", icon: Folder, estMinutes: 45, kind: "system",
        system: { name: "Microsoft 365", sopLabel: "View M365 SOP" },
        actions: [
          { id: "outlook", label: "Sign in to Outlook & set up your signature", icon: Mail },
          { id: "teams", label: "Sign in to Teams & join the HR channel", icon: MessageSquare },
          { id: "sp", label: "Open the HR SharePoint site & bookmark it", icon: Folder },
          { id: "sop", label: "Find the HR SOPs folder on SharePoint", icon: FileText },
        ] },
      { key: "w1.sys.cr", title: "CentralReach quick tour (read-only)", blurb: "CentralReach (CR) is the clinical system our therapists use with families. You won't work in it — but knowing what it is helps you understand questions employees ask.", icon: Database, estMinutes: 20, kind: "system",
        system: { name: "CentralReach", sopLabel: "View CR overview" },
        actions: [
          { id: "watch", label: "Watch the 5-min CR overview video", icon: PlayCircle },
          { id: "who", label: "Note who in HR you'd escalate CR questions to", icon: FileText },
        ] },
      { key: "w1.sys.academy", title: "Blossom Academy tour", blurb: "Blossom Academy is where all employee training lives — including this onboarding. Get comfortable assigning and tracking modules; you'll do this for new hires.", icon: GraduationCap, estMinutes: 25, kind: "system",
        system: { name: "Blossom Academy", sopLabel: "View Academy SOP" },
        actions: [
          { id: "login", label: "Log in to Blossom Academy", icon: GraduationCap },
          { id: "browse", label: "Browse the new-hire training catalog", icon: BookOpen, href: "/onboarding/academy-preview" },
          { id: "track", label: "Find where you can see if a training is complete", icon: ClipboardCheck },
        ] },
      { key: "w1.sys.access", title: "How we set up new employees (overview)", blurb: "When someone's hired, HR sets up their phone, email, system logins, and permissions. This week you just watch — next week you'll do practice runs.", icon: ShieldCheck, estMinutes: 45, kind: "system",
        system: { name: "Access Provisioning", sopLabel: "View provisioning SOP" },
        actions: [
          { id: "sop", label: "Read the new-hire access SOP", icon: FileText },
          { id: "checklist", label: "Save the new-hire setup checklist somewhere easy to find", icon: ListChecks },
        ] },
      { key: "w1.shadow", title: "Shadow Nikki all week", blurb: "The most valuable thing you'll do this week. Just watch how she handles questions, calls, and requests. Take notes — don't worry about understanding everything.", icon: Eye, estMinutes: 240, kind: "shadowing",
        shadowing: {
          assignee: "Nikki Goldenberg",
          goals: [
            "Watched Nikki answer 5 employee questions",
            "Watched Nikki handle 3 phone calls",
            "Watched Nikki process 2 HR Request Forms",
            "Watched at least 1 new-hire onboarding step",
            "Asked Nikki at least 3 questions during shadowing",
          ],
        } },
      { key: "w1.depts", title: "How departments connect", blurb: "Plain English: HR isn't an island. Recruiting hires people, HR sets them up, Scheduling books their work, Payroll pays them, Clinical runs the therapy. When you understand the chain, you stop feeling lost.", icon: Network, estMinutes: 20, kind: "content",
        actions: [
          { id: "draw", label: "Sketch how a new hire flows from offer → first paycheck", icon: FileText, prompt: true, promptPlaceholder: "Just list the steps in your own words." },
        ] },
    ],
    outcome: {
      title: "Week One Outcome",
      bullets: [
        "Know Blossom's mission, vision, and 4 core values",
        "Logged in to Viventium, Tapcheck, Jivetel, Monday, Outlook, Teams, SharePoint, Academy & CR",
        "Shadowed Nikki on real questions, calls, requests, and onboarding",
        "Understand the 4-hour daily rhythm and Blossom's communication standards",
        "Know how HR connects to Recruiting, Scheduling, Payroll, and Clinical",
      ],
    },
  },
  {
    id: "w2",
    index: 2,
    weekLabel: "Week 2",
    title: "Employee Support & Access Management",
    objective: "4 hrs/day. This week you start doing — not just watching. You'll answer employee questions, take phone calls, process HR Request Forms, and practice setting up brand-new employees. Nikki is right next to you the whole time.",
    icon: Headphones,
    path: "/onboarding/week/2",
    modules: [
      { key: "w2.questions", title: "Common employee questions (and how to answer)", blurb: "The same 10 questions come up over and over: pay stubs, PTO, schedules, benefits, Tapcheck. Learn the answers — and learn what to escalate vs. handle yourself.", icon: MessageSquare, estMinutes: 60, kind: "content",
        actions: [
          { id: "sop", label: "Read the employee Q&A playbook (top 10 questions)", icon: FileText },
          { id: "what-hr", label: "Learn what's HR vs. payroll vs. operations", icon: BookOpen },
          { id: "escalate", label: "Memorize: when in doubt, escalate to Nikki", icon: ShieldCheck },
          { id: "shadow", label: "Sit with Nikki on 5 live questions", icon: Eye },
          { id: "answer", label: "Answer 3 questions yourself with Nikki listening", icon: Headphones },
        ] },
      { key: "w2.phones", title: "Answering phone calls professionally", blurb: "First impressions matter. Use the greeting script, smile while you talk (people hear it), and never make someone feel dumb for asking.", icon: Phone, estMinutes: 60, kind: "system",
        system: { name: "Jivetel — Calls", sopLabel: "View call-handling SOP" },
        actions: [
          { id: "script", label: "Memorize the greeting script word-for-word", icon: BookOpen },
          { id: "transfer", label: "Practice transferring a call (without dropping it)", icon: Phone },
          { id: "vm", label: "Practice taking and routing a voicemail", icon: Inbox },
          { id: "live", label: "Take 3 supervised live calls", icon: Headphones },
          { id: "log", label: "Write down anything you weren't sure how to handle", icon: FileText, prompt: true, promptPlaceholder: "Be honest — these become great training moments." },
        ] },
      { key: "w2.hrforms", title: "HR Request Forms — monitor & respond", blurb: "Employees submit HR Request Forms for things like name changes, address updates, time-off questions. Your job: read it, route it, follow up, close it out.", icon: ClipboardCheck, estMinutes: 60, kind: "system",
        system: { name: "HR Request Forms", sopLabel: "View HR Forms SOP" },
        actions: [
          { id: "sop", label: "Read the HR Request Forms SOP", icon: FileText },
          { id: "where", label: "Find where new requests show up (Monday board)", icon: Workflow },
          { id: "process", label: "Process 2 forms end-to-end with Nikki watching", icon: ClipboardCheck },
          { id: "respond", label: "Practice the 'I got your request, working on it' reply", icon: MessageSquare },
        ] },
      { key: "w2.tap-viv", title: "Tapcheck & Viventium — the questions you'll get", blurb: "Pay stubs, direct deposit, missing hours, Tapcheck enrollment. Know exactly where to click in each system to answer fast.", icon: MonitorPlay, estMinutes: 60, kind: "system",
        system: { name: "Tapcheck & Viventium", sopLabel: "View payroll SOPs" },
        actions: [
          { id: "sop", label: "Read both SOPs end-to-end", icon: FileText },
          { id: "stub", label: "Show Nikki where to find a pay stub in Viventium", icon: MonitorPlay },
          { id: "tap-enroll", label: "Walk through a fake Tapcheck enrollment", icon: ClipboardCheck },
          { id: "answer", label: "Answer 3 sample employee questions out loud", icon: MessageSquare },
        ] },
      { key: "w2.newhire", title: "New employee setup — full process", blurb: "Setting up a new hire: phone extension, email, system logins, permissions, welcome email. Use the checklist every time so nothing slips.", icon: UserCheck, estMinutes: 90, kind: "system",
        system: { name: "New Hire Setup", sopLabel: "View new-hire setup checklist" },
        actions: [
          { id: "checklist", label: "Walk through the new-hire checklist top to bottom", icon: ListChecks },
          { id: "shadow", label: "Shadow Nikki on a live new-hire setup", icon: Eye },
          { id: "permissions", label: "Learn what permissions each role needs (don't over-grant)", icon: ShieldCheck },
          { id: "welcome", label: "Draft a sample welcome email", icon: Mail },
        ] },
      { key: "w2.mock", title: "Practice: create a mock employee account", blurb: "Safe sandbox — make a fake employee, give them email and access, then delete it. The point is muscle memory, not a real person.", icon: UserCheck, estMinutes: 60, kind: "content",
        actions: [
          { id: "mock1", label: "Create mock employee #1 with full access setup", icon: UserCheck },
          { id: "mock2", label: "Create mock employee #2 with limited (clinical-only) access", icon: ShieldCheck },
          { id: "review", label: "Have Nikki review what you set up before deleting", icon: Eye },
        ] },
      { key: "w2.docs", title: "Documentation standards", blurb: "If it's not written down, it didn't happen. Learn what to document in Monday, what to log in Viventium, and what stays in HR notes.", icon: FileText, estMinutes: 30, kind: "content",
        actions: [
          { id: "what", label: "Read 'what to document and where' SOP", icon: FileText },
          { id: "practice", label: "Document one task you did today the right way", icon: ClipboardCheck },
        ] },
      { key: "w2.checkin.nikki", title: "Daily check-ins with Nikki", blurb: "10 minutes a day. Tell her what you did, what got stuck, and what you're confused about. This is how you grow fast.", icon: MessageSquare, estMinutes: 75, kind: "checkin",
        actions: [
          { id: "recurring", label: "Set a recurring daily 10-minute slot", icon: CalendarDays },
          { id: "format", label: "Use this format: 1 win, 1 blocker, 1 question", icon: FileText },
        ] },
    ],
    outcome: {
      title: "Week Two Outcome",
      bullets: [
        "Comfortably answer the top 10 employee questions",
        "Take, transfer, and voicemail-route phone calls without panic",
        "Triage and close out HR Request Forms",
        "Run a new-hire setup with Nikki nearby",
        "Created mock employee accounts to build muscle memory",
        "Documenting work the Blossom way",
      ],
    },
  },
  {
    id: "w3",
    index: 3,
    weekLabel: "Week 3",
    title: "Audits, Organization & Operational Support",
    objective: "4 hrs/day. The 'keep the house clean' week. You'll learn the recurring audits, organize SharePoint and Outlook, handle daily mail, and start owning small organizational tasks on your own.",
    icon: Inbox,
    path: "/onboarding/week/3",
    modules: [
      { key: "w3.audit.jivetel", title: "Jivetel audits — full walkthrough", blurb: "An 'audit' just means: check the list, fix anything wrong. For Jivetel: are extensions assigned to the right people? Any phantom users? Anything broken?", icon: Phone, estMinutes: 75, kind: "system",
        system: { name: "Jivetel Audits", sopLabel: "View Jivetel audit SOP" },
        actions: [
          { id: "sop", label: "Read the Jivetel audit SOP step-by-step", icon: FileText },
          { id: "shadow", label: "Watch Nikki run an audit once", icon: Eye },
          { id: "first", label: "Run your first audit pass yourself", icon: ClipboardCheck },
          { id: "report", label: "Document findings and fixes in Monday", icon: FileText },
        ] },
      { key: "w3.audit.email", title: "Email audits & organization", blurb: "Make sure mailboxes, distribution lists, and shared inboxes are right. Old employees off, new ones on, no one missing important emails.", icon: Mail, estMinutes: 60, kind: "system",
        system: { name: "Email Audits", sopLabel: "View email audit SOP" },
        actions: [
          { id: "sop", label: "Read the email audit SOP", icon: FileText },
          { id: "lists", label: "Check distribution lists vs. current employees", icon: ListChecks },
          { id: "first", label: "Complete your first email audit", icon: ClipboardCheck },
          { id: "organize", label: "Set up folders/rules for the HR shared inbox", icon: Folder },
        ] },
      { key: "w3.sharepoint", title: "SharePoint organization & SOP storage", blurb: "SharePoint is HR's filing cabinet. Folders need to be predictable so anyone can find anything. Use the standard structure — don't invent your own.", icon: Folder, estMinutes: 90, kind: "system",
        system: { name: "SharePoint — HR", sopLabel: "View HR SharePoint SOP" },
        actions: [
          { id: "sop", label: "Read the SharePoint organization SOP", icon: FileText },
          { id: "structure", label: "Memorize the standard HR folder structure", icon: Folder },
          { id: "tidy", label: "Tidy one HR folder end-to-end", icon: ClipboardCheck },
          { id: "sops", label: "Make sure all current SOPs are in the SOP folder", icon: FileText },
        ] },
      { key: "w3.naming", title: "Naming conventions (boring but critical)", blurb: "How we name files: LastName_FirstName_DocType_YYYY-MM-DD. Boring? Yes. Saves hours of searching later? Also yes.", icon: FileText, estMinutes: 20, kind: "content",
        actions: [
          { id: "rule", label: "Read the naming convention SOP", icon: FileText },
          { id: "rename", label: "Rename 5 messy files using the convention", icon: ClipboardCheck },
        ] },
      { key: "w3.mail", title: "Daily mail — scan, sort, route", blurb: "Physical mail comes in daily. Open, scan, save to SharePoint with the right name, and email the owner. Don't let mail pile up — that's how things get lost.", icon: Inbox, estMinutes: 45, kind: "system",
        system: { name: "Daily Mail", sopLabel: "View daily mail SOP" },
        actions: [
          { id: "sop", label: "Read the daily mail SOP", icon: FileText },
          { id: "scanner", label: "Learn how to use the scanner & save as PDF", icon: MonitorPlay },
          { id: "run", label: "Run a full mail-and-scan cycle yourself", icon: ClipboardCheck },
          { id: "route", label: "Email the right owner with the scanned attachment", icon: Mail },
        ] },
      { key: "w3.solo-tasks", title: "Start owning small organizational tasks", blurb: "By end of week, Nikki should be able to say 'handle the mail and the email audit' and walk away. That's the goal.", icon: Target, estMinutes: 60, kind: "content",
        actions: [
          { id: "list", label: "List the recurring tasks you can now do solo", icon: ListChecks, prompt: true, promptPlaceholder: "Be honest about what you've actually done at least twice." },
          { id: "calendar", label: "Add the recurring tasks to your calendar", icon: CalendarDays },
        ] },
      { key: "w3.checkin.nikki", title: "Mid-program check-in with Nikki", blurb: "Halfway point. Honest conversation about what's clicking, what isn't, and what to push harder on in Week 4.", icon: MessageSquare, estMinutes: 30, kind: "checkin",
        actions: [
          { id: "agenda", label: "Bring an agenda: wins, blockers, asks, gaps", icon: FileText },
          { id: "selfrate", label: "Self-rate yourself on each Week 1–3 outcome", icon: ClipboardCheck },
        ] },
    ],
    outcome: {
      title: "Week Three Outcome",
      bullets: [
        "Jivetel and email audits run cleanly on cadence",
        "HR SharePoint stays organized using the standard structure",
        "Naming conventions used on every new file",
        "Daily mail handled reliably with no backlog",
        "Owning at least 3 organizational tasks independently",
      ],
    },
  },
  {
    id: "w4",
    index: 4,
    weekLabel: "Week 4",
    title: "Independent Workflow Execution",
    objective: "4 hrs/day. The big leap. You'll add workers comp, run new-hire onboarding solo, hold the HR desk by yourself, and complete the competency evaluation that unlocks the move to 8 hrs/day.",
    icon: ShieldCheck,
    path: "/onboarding/week/4",
    modules: [
      { key: "w4.wc.overview", title: "Workers comp claims — what it actually is", blurb: "Workers comp = when an employee gets hurt at work. Insurance pays their medical and lost wages. Your job in HR: collect the right info, file fast, document everything.", icon: ShieldCheck, estMinutes: 60, kind: "content",
        actions: [
          { id: "sop", label: "Read the workers comp SOP", icon: FileText },
          { id: "lifecycle", label: "Map the claim lifecycle in your own words", icon: FileText, prompt: true, promptPlaceholder: "Step 1: employee reports injury → ... → final close-out" },
          { id: "forms", label: "Find where workers comp forms live in SharePoint", icon: Folder },
          { id: "who", label: "Know who to call: insurance carrier, Nikki, supervisor", icon: Phone },
        ] },
      { key: "w4.wc.live", title: "Open & follow up on a real claim", blurb: "Walk a real (or recent) claim with Nikki: intake call, documentation, filing, follow-up. Slow is smooth, smooth is fast.", icon: ClipboardCheck, estMinutes: 90, kind: "system",
        system: { name: "Workers Comp", sopLabel: "View workers comp SOP" },
        actions: [
          { id: "shadow", label: "Shadow opening one claim", icon: Eye },
          { id: "intake", label: "Practice the injury-intake conversation script", icon: Headphones },
          { id: "doc", label: "Document the claim with full detail", icon: FileText },
          { id: "followup", label: "Run a follow-up touchpoint with the employee", icon: MessageSquare },
        ] },
      { key: "w4.solo.newhire", title: "Run a real new-hire setup solo", blurb: "Phone, email, accesses, welcome — start to finish, no hand-holding. Nikki reviews after, not during.", icon: UserCheck, estMinutes: 90, kind: "content",
        actions: [
          { id: "checklist", label: "Open the new-hire checklist", icon: ListChecks },
          { id: "complete", label: "Complete a real setup independently", icon: ClipboardCheck },
          { id: "academy", label: "Assign their first Blossom Academy modules", icon: GraduationCap },
          { id: "review", label: "Have Nikki review your work after, not during", icon: Eye },
        ] },
      { key: "w4.solo.day", title: "Independent 4-hour shift on the HR desk", blurb: "Hold the desk by yourself: phones, HR Request Forms, employee questions, mail. Nikki is reachable but not next to you.", icon: Headphones, estMinutes: 240, kind: "content",
        actions: [
          { id: "shift", label: "Run an independent 4-hour shift", icon: Target },
          { id: "log", label: "Log every call, request, and task you handled", icon: FileText },
          { id: "stuck", label: "Note what you weren't sure about (no shame)", icon: MessageSquare, prompt: true, promptPlaceholder: "These become next-week training topics." },
        ] },
      { key: "w4.values", title: "Core Values in action", blurb: "Show, don't tell. Pick one example from this week for each value: Data Over Emotion, Extreme Ownership, Always Improving, Family First Always.", icon: Compass, estMinutes: 20, kind: "content",
        actions: [
          { id: "data", label: "Data Over Emotion — when did you use facts to solve something?", icon: BarChart3, prompt: true, promptPlaceholder: "One example." },
          { id: "ownership", label: "Extreme Ownership — what did you take responsibility for?", icon: Target, prompt: true, promptPlaceholder: "One example." },
          { id: "improve", label: "Always Improving — what did you make better?", icon: Sparkles, prompt: true, promptPlaceholder: "One example." },
          { id: "family", label: "Family First — how did your work help a family?", icon: Heart, prompt: true, promptPlaceholder: "Even indirectly counts." },
        ] },
      { key: "w4.competency", title: "Onboarding competency evaluation", blurb: "Final check-in with Nikki to confirm you're ready to step into the full role at 8 hrs/day. This is a conversation, not a test — but it's real.", icon: ClipboardCheck, estMinutes: 60, kind: "content",
        actions: [
          { id: "selfeval", label: "Complete the self-evaluation form", icon: FileText },
          { id: "review", label: "Sit down with Nikki for the formal evaluation", icon: UserCheck },
          { id: "gaps", label: "Agree on a plan for any remaining gaps", icon: Target },
        ] },
      { key: "w4.checkin.nikki", title: "Accountability check-in with Nikki", blurb: "Review the solo day and competency results. Confirm readiness to step up to 8 hrs/day.", icon: MessageSquare, estMinutes: 30, kind: "checkin",
        actions: [
          { id: "agenda", label: "Bring wins, gaps, questions, and your competency form", icon: FileText },
        ] },
      { key: "w4.reflect", title: "Reflection & move to 8 hrs/day", blurb: "Lock in the habits that worked. Plan the jump to a full 8-hour schedule. You earned this.", icon: Trophy, estMinutes: 30, kind: "content",
        actions: [
          { id: "reflect", label: "Write a 1-page reflection: what worked, what was hard, what you're proud of", icon: FileText, prompt: true, promptPlaceholder: "No format required — just be honest." },
          { id: "schedule", label: "Confirm the new 8-hr schedule with Nikki", icon: CalendarDays },
          { id: "thanks", label: "Thank one person who helped you most these 4 weeks", icon: Heart },
        ] },
    ],
    outcome: {
      title: "Ownership Milestone",
      bullets: [
        "Comfortable opening and following up on workers comp claims",
        "Running real new-hire setups solo, end-to-end",
        "Holding the HR desk independently for a full 4-hour shift",
        "Living the 4 Core Values in real, specific work moments",
        "Passed the onboarding competency evaluation",
        "Ready to move to 8 hrs/day with confidence",
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