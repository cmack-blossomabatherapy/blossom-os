/**
 * Blossom team directory — sourced from "Meet the Team" brochure (4.30.26).
 * Photo paths reference src/assets/team/*.jpg when available; falls back to
 * gradient-initial avatars when `photo` is undefined.
 */
export type TeamMember = {
  id: string;
  name: string;
  title: string;
  blurb: string;
  department: DepartmentId;
  states?: string[];        // e.g. ["MD"], ["GA"]
  leadership?: boolean;
  supportsOnboarding?: boolean;
  credential?: string;      // e.g. "BCBA"
  photo?: string;           // import path (e.g. "/src/assets/team/chad-kaufman.jpg")
};

export type DepartmentId =
  | "operations" | "state-directors" | "asst-state-directors"
  | "intake" | "marketing" | "hr-payroll" | "qa"
  | "regional-bcbas" | "behavioral-support"
  | "scheduling-rbt" | "ga-case-management" | "recruiting" | "authorizations";

export const DEPARTMENTS: { id: DepartmentId; name: string; tagline: string; spotlight?: boolean }[] = [
  { id: "operations", name: "Operations", tagline: "The team setting direction and keeping Blossom running.", spotlight: true },
  { id: "state-directors", name: "State Directors", tagline: "Local leaders for each state we serve.", spotlight: true },
  { id: "asst-state-directors", name: "Assistant State Directors", tagline: "Right-hand support to our State Directors." },
  { id: "intake", name: "Intake", tagline: "Welcoming new families to Blossom." },
  { id: "marketing", name: "Marketing", tagline: "Telling Blossom's story to the world." },
  { id: "hr-payroll", name: "HR & Payroll", tagline: "Caring for the people who care for families.", spotlight: true },
  { id: "qa", name: "Quality Assurance", tagline: "Protecting clinical excellence across every case.", spotlight: true },
  { id: "regional-bcbas", name: "Regional BCBAs & Training", tagline: "Clinical leadership and BCBA development." },
  { id: "behavioral-support", name: "Behavioral Support", tagline: "Senior clinical guidance for our BCBAs." },
  { id: "scheduling-rbt", name: "Scheduling & RBT Reps", tagline: "Keeping sessions on the calendar and RBTs supported." },
  { id: "ga-case-management", name: "Georgia Case Management", tagline: "Day-to-day case ownership for our Georgia families." },
  { id: "recruiting", name: "Recruiting", tagline: "Finding the people who will join Blossom next." },
  { id: "authorizations", name: "Authorizations", tagline: "Insurance, eligibility, and credentialing." },
];

import chadKaufman from "@/assets/team/chad-kaufman.jpg";
import shiraLasry from "@/assets/team/shira-lasry.jpg";
import eliBerman from "@/assets/team/eli-berman.jpg";
import coreyMack from "@/assets/team/corey-mack.jpg";
import moipaOlentiki from "@/assets/team/moipa-olentiki.jpg";
import gabiKaweblum from "@/assets/team/gabi-kaweblum.jpg";
import ezraSopher from "@/assets/team/ezra-sopher.jpg";
import yosefAharonoff from "@/assets/team/yosef-aharonoff.jpg";
import garyFrank from "@/assets/team/gary-frank.jpg";
import eliMillman from "@/assets/team/eli-millman.jpg";
import leviGarfunkel from "@/assets/team/levi-garfunkel.jpg";
import mordyGobioff from "@/assets/team/mordy-gobioff.jpg";

export const TEAM_MEMBERS: TeamMember[] = [
  // Operations
  { id: "chad-kaufman", name: "Chad Kaufman", title: "CEO", blurb: "Chad leads the company's vision and keeps growth on track across all states.", department: "operations", leadership: true, supportsOnboarding: true, photo: chadKaufman },
  { id: "shira-lasry", name: "Shira Lasry", title: "Director of Operations & Company Experience", blurb: "Shira oversees daily operations and is responsible for company culture and experience.", department: "operations", leadership: true, supportsOnboarding: true, photo: shiraLasry },
  { id: "eli-berman", name: "Eli Berman", title: "Operations Manager", blurb: "Eli works on big-picture projects and helps bring new ideas to life.", department: "operations", leadership: true, photo: eliBerman },
  { id: "corey-mack", name: "Corey Mack", title: "Systems & Software Manager", blurb: "Corey optimizes the company's systems to increase efficiency and ease of use.", department: "operations", supportsOnboarding: true, photo: coreyMack },
  { id: "moipa-olentiki", name: "Moipa Olentiki", title: "Executive Assistant", blurb: "Moipa assists the CEO with administrative tasks.", department: "operations", photo: moipaOlentiki },
  { id: "gabi-kaweblum", name: "Gabi Kaweblum", title: "Director of Finance", blurb: "Gabi supports leadership and keeps company-wide projects moving forward.", department: "operations", leadership: true, photo: gabiKaweblum },

  // State Directors
  { id: "ezra-sopher", name: "Ezra Sopher", title: "State Director – MD", blurb: "Ezra leads services and staff in Maryland.", department: "state-directors", leadership: true, states: ["MD"], photo: ezraSopher },
  { id: "yosef-aharonoff", name: "Yosef Aharonoff", title: "State Director – VA", blurb: "Yosef leads services and staff in Virginia.", department: "state-directors", leadership: true, states: ["VA"], photo: yosefAharonoff },
  { id: "gary-frank", name: "Gary Frank", title: "State Director – TN", blurb: "Gary leads services and staff in Tennessee.", department: "state-directors", leadership: true, states: ["TN"], photo: garyFrank },
  { id: "eli-millman", name: "Eli Millman", title: "State Director – NC", blurb: "Eli leads services and staff in North Carolina.", department: "state-directors", leadership: true, states: ["NC"], photo: eliMillman },

  // Assistant State Directors
  { id: "levi-garfunkel", name: "Levi Garfunkel", title: "Assistant State Director – TN", blurb: "Levi assists in leading services and staff in Tennessee.", department: "asst-state-directors", states: ["TN"], photo: leviGarfunkel },
  { id: "mordy-gobioff", name: "Mordy Gobioff", title: "Assistant State Director – VA & Clinic Setup", blurb: "Mordy assists in leading services and staff in Virginia and assists with new clinic setup.", department: "asst-state-directors", states: ["VA"], photo: mordyGobioff },

  // Intake
  { id: "michal-silberberg", name: "Michal Silberberg", title: "Intake Coordinator", blurb: "Michal guides new families through the intake process.", department: "intake" },
  { id: "aliza-rubnitz", name: "Aliza Rubnitz", title: "Intake Coordinator", blurb: "Aliza guides new families through the intake process.", department: "intake" },
  { id: "michelle-mckenzie", name: "Michelle McKenzie", title: "Assistant Intake Coordinator", blurb: "Michelle supports intake after hours and on weekends.", department: "intake" },

  // Marketing
  { id: "nicholas-schlotterer", name: "Nicholas Schlotterer", title: "Marketing Director", blurb: "Nicholas leads strategy and execution across the company's marketing efforts.", department: "marketing", leadership: true },
  { id: "sam-perlow", name: "Sam Perlow", title: "Outreach Coordinator", blurb: "Sam leads outreach efforts.", department: "marketing" },

  // HR & Payroll
  { id: "nikki-goldenberg", name: "Nikki Goldenberg", title: "HR Manager", blurb: "Nikki handles all HR related issues.", department: "hr-payroll", leadership: true, supportsOnboarding: true },
  { id: "baila-friedman", name: "Baila Friedman", title: "Payroll Manager", blurb: "Baila handles all payroll related issues.", department: "hr-payroll", supportsOnboarding: true },

  // QA
  { id: "rochel-walzman", name: "Rochel Walzman", credential: "BCBA", title: "QA Director", blurb: "Rochel leads all quality assurance across the company.", department: "qa", leadership: true },
  { id: "amanda-avalos", name: "Amanda Avalos", credential: "BCBA", title: "QA – Initial Assessments", blurb: "Amanda reviews IAs, leads BCBA orientations, handles insurance denials, and assists with reports.", department: "qa", supportsOnboarding: true },
  { id: "julianne-rodriguez", name: "Julianne Rodriguez", credential: "BCBA", title: "QA Reviewer", blurb: "Julianne reviews progress reports, prepares insurance submissions, and evaluates learning trees.", department: "qa" },
  { id: "raizy-folger", name: "Raizy Folger", title: "QA Specialist", blurb: "Raizy supports new staff, maintains insurance standards, and manages Central Reach accounts.", department: "qa", supportsOnboarding: true },
  { id: "anje-grobler", name: "Anje Grobler", title: "QA Specialist", blurb: "Anje supports new staff, maintains insurance standards, and manages Central Reach accounts.", department: "qa", supportsOnboarding: true },

  // Regional BCBAs & Training
  { id: "becca-bailey", name: "Becca Bailey", credential: "BCBA", title: "Training, Support & Orientations", blurb: "Becca provides training and support for therapists and new BCBAs.", department: "regional-bcbas", supportsOnboarding: true },
  { id: "breanna-dodson", name: "BreAnna Dodson", credential: "BCBA", title: "RBT Orientations", blurb: "BreAnna provides orientation for new RBTs in Georgia.", department: "regional-bcbas", states: ["GA"], supportsOnboarding: true },
  { id: "hannah-hayes", name: "Hannah Hayes", credential: "BCBA", title: "Fellowship Lead", blurb: "Hannah mentors RBTs in their role as they become BCBAs.", department: "regional-bcbas", supportsOnboarding: true },
  { id: "jameka-dixon", name: "Jameka Dixon", credential: "BCBA", title: "BCBA Training – GA", blurb: "Jameka provides training for new BCBAs.", department: "regional-bcbas", states: ["GA"], supportsOnboarding: true },
  { id: "jessica-labrovic", name: "Jessica Labrovic", credential: "BCBA", title: "Regional BCBA – NC", blurb: "Jessica leads clinical support through training and events to ensure quality service delivery throughout North Carolina.", department: "regional-bcbas", states: ["NC"], leadership: true },
  { id: "taylor-oliver", name: "Taylor Oliver", credential: "BCBA", title: "Regional BCBA – TN", blurb: "Taylor leads clinical support through training and events to ensure quality service delivery throughout Tennessee.", department: "regional-bcbas", states: ["TN"], leadership: true },

  // Behavioral Support
  { id: "julia-pinder", name: "Julia Pinder", credential: "BCBA", title: "Behavioral Support Director", blurb: "Julia assists and supports BCBAs with clinical and day-to-day needs.", department: "behavioral-support", leadership: true, supportsOnboarding: true },
  { id: "ashley-conklin", name: "Ashley Conklin", credential: "BCBA", title: "Senior Behavioral Support Director", blurb: "Ashley supports BCBAs with high-level clinical needs.", department: "behavioral-support", leadership: true },
  { id: "cymbre-brumbeloe", name: "Cymbre Brumbeloe", credential: "BCBA", title: "Regional Clinical Director – GA", blurb: "Cymbre leads services and staff in our Georgia clinics.", department: "behavioral-support", leadership: true, states: ["GA"] },

  // Scheduling & RBT Reps
  { id: "daylis-yepez", name: "Daylis Yepez", title: "Scheduling Coordinator – MD, NC, TN, VA", blurb: "Daylis manages session scheduling, changes and updates.", department: "scheduling-rbt", states: ["MD", "NC", "TN", "VA"], supportsOnboarding: true },
  { id: "hannah-sandidge", name: "Hannah Sandidge", title: "Scheduling Coordinator – GA & RBT Representative", blurb: "Hannah manages session scheduling, changes and updates in GA. She is also a rep for our RBTs!", department: "scheduling-rbt", states: ["GA"], supportsOnboarding: true },
  { id: "sarah-rebuelta", name: "Sarah Rebuelta", credential: "BCBA", title: "RBT Representative (Clinical Support)", blurb: "Sarah assists in high-level training questions for our RBTs and sources materials for our staff.", department: "scheduling-rbt", supportsOnboarding: true },

  // Recruiting
  { id: "surie-goldstein", name: "Surie Goldstein", title: "Recruiting Coordinator – GA", blurb: "Surie oversees Recruiting in GA and hires top-notch BCBAs.", department: "recruiting", states: ["GA"], leadership: true },
  { id: "chanie-chernitzky", name: "Chanie Chernitzky", title: "Recruiting Assistant", blurb: "Chanie recruits and hires top-notch RBTs.", department: "recruiting" },
  { id: "rochell-coulson", name: "Rochell Coulson", title: "Recruiting Assistant", blurb: "Rochell recruits and hires top-notch RBTs.", department: "recruiting" },

  // Authorizations
  { id: "rachel-greenspan", name: "Rachel Greenspan", title: "Case Manager – GA", blurb: "Rachel oversees services and staff in Georgia.", department: "ga-case-management", states: ["GA"], leadership: true },
  { id: "nicky-newman", name: "Nicky Newman", title: "Case Manager – GA", blurb: "Nicky manages cases and communication for Georgia families.", department: "ga-case-management", states: ["GA"] },
  { id: "ahuva-florans", name: "Ahuva Florans", title: "Case Manager – GA", blurb: "Ahuva manages cases and communication for Georgia families.", department: "ga-case-management", states: ["GA"] },
  { id: "sara-uhr", name: "Sara Uhr", title: "RBT/BT & Staffing Coordinator – GA", blurb: "Sara manages case staffing, coordination and communication in Georgia.", department: "ga-case-management", states: ["GA"] },
  { id: "devorah-benenfeld", name: "Devorah Benenfeld", title: "Authorizations Manager", blurb: "Devorah oversees authorizations, denials, and eligibility.", department: "authorizations", leadership: true },
  { id: "miriam-metzger", name: "Miriam Metzger", title: "Authorizations Coordinator – GA", blurb: "Miriam manages Georgia's insurance submissions, follow-ups for IAs, initial treatment & progress reports.", department: "authorizations", states: ["GA"] },
  { id: "rivky-weissman", name: "Rivky Weissman", title: "Authorizations Coordinator – GA", blurb: "Rivky handles Georgia's insurance submissions and follow-ups for progress reports.", department: "authorizations", states: ["GA"] },
  { id: "kayla-brown", name: "Kayla Brown", title: "Authorizations Coordinator – MD, NC, TN, VA", blurb: "Kayla manages IA authorizations outside of Georgia and credentialing.", department: "authorizations", states: ["MD", "NC", "TN", "VA"] },
  { id: "riki-wallach", name: "Riki Wallach", title: "Authorizations Coordinator – MD, NC, TN, VA", blurb: "Riki manages all auths outside of Georgia for progress reports.", department: "authorizations", states: ["MD", "NC", "TN", "VA"] },
];

export function membersByDepartment(id: DepartmentId): TeamMember[] {
  return TEAM_MEMBERS.filter((m) => m.department === id);
}

export const ALL_STATES = ["MD", "VA", "TN", "NC", "GA"] as const;

/** Visual flow used by the optional ecosystem section. */
export const ORG_FLOW: { id: DepartmentId; label: string }[] = [
  { id: "marketing", label: "Marketing" },
  { id: "intake", label: "Intake" },
  { id: "authorizations", label: "Authorizations" },
  { id: "scheduling-rbt", label: "Scheduling" },
  { id: "regional-bcbas", label: "Clinical" },
  { id: "qa", label: "Quality" },
  { id: "ga-case-management", label: "Family Support" },
];
