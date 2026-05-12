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

import ahuvaFlorans from "@/assets/team/ahuva-florans.jpg";
import alizaRubnitz from "@/assets/team/aliza-rubnitz.jpg";
import amandaAvalos from "@/assets/team/amanda-avalos.jpg";
import anjeGrobler from "@/assets/team/anje-grobler.jpg";
import ashleyConklin from "@/assets/team/ashley-conklin.jpg";
import bailaFriedman from "@/assets/team/baila-friedman.jpg";
import beccaBailey from "@/assets/team/becca-bailey.jpg";
import breannaDodson from "@/assets/team/breanna-dodson.jpg";
import chadKaufman from "@/assets/team/chad-kaufman.jpg";
import chanieChernitzky from "@/assets/team/chanie-chernitzky.jpg";
import coreyMack from "@/assets/team/corey-mack.jpg";
import cymbreBrumbeloe from "@/assets/team/cymbre-brumbeloe.jpg";
import daylisYepez from "@/assets/team/daylis-yepez.jpg";
import devorahBenenfeld from "@/assets/team/devorah-benenfeld.jpg";
import eliBerman from "@/assets/team/eli-berman.jpg";
import eliMillman from "@/assets/team/eli-millman.jpg";
import ezraSopher from "@/assets/team/ezra-sopher.jpg";
import gabiKaweblum from "@/assets/team/gabi-kaweblum.jpg";
import garyFrank from "@/assets/team/gary-frank.jpg";
import hannahHayes from "@/assets/team/hannah-hayes.jpg";
import hannahSandidge from "@/assets/team/hannah-sandidge.jpg";
import jamekaDixon from "@/assets/team/jameka-dixon.jpg";
import jessicaLabrovic from "@/assets/team/jessica-labrovic.jpg";
import juliaPinder from "@/assets/team/julia-pinder.jpg";
import julianneRodriguez from "@/assets/team/julianne-rodriguez.jpg";
import kaylaBrown from "@/assets/team/kayla-brown.jpg";
import leviGarfunkel from "@/assets/team/levi-garfunkel.jpg";
import michalSilberberg from "@/assets/team/michal-silberberg.jpg";
import michelleMckenzie from "@/assets/team/michelle-mckenzie.jpg";
import miriamMetzger from "@/assets/team/miriam-metzger.jpg";
import moipaOlentiki from "@/assets/team/moipa-olentiki.jpg";
import mordyGobioff from "@/assets/team/mordy-gobioff.jpg";
import nicholasSchlotterer from "@/assets/team/nicholas-schlotterer.jpg";
import nickyNewman from "@/assets/team/nicky-newman.jpg";
import nikkiGoldenberg from "@/assets/team/nikki-goldenberg.jpg";
import rachelGreenspan from "@/assets/team/rachel-greenspan.jpg";
import raizyFolger from "@/assets/team/raizy-folger.jpg";
import rikiWallach from "@/assets/team/riki-wallach.jpg";
import rivkyWeissman from "@/assets/team/rivky-weissman.jpg";
import rochelWalzman from "@/assets/team/rochel-walzman.jpg";
import rochellCoulson from "@/assets/team/rochell-coulson.jpg";
import samPerlow from "@/assets/team/sam-perlow.jpg";
import saraUhr from "@/assets/team/sara-uhr.jpg";
import sarahRebuelta from "@/assets/team/sarah-rebuelta.jpg";
import shiraLasry from "@/assets/team/shira-lasry.jpg";
import surieGoldstein from "@/assets/team/surie-goldstein.jpg";
import taylorOliver from "@/assets/team/taylor-oliver.jpg";
import yosefAharonoff from "@/assets/team/yosef-aharonoff.jpg";

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
  { id: "michal-silberberg", name: "Michal Silberberg", title: "Intake Coordinator", blurb: "Michal guides new families through the intake process.", department: "intake", photo: michalSilberberg },
  { id: "aliza-rubnitz", name: "Aliza Rubnitz", title: "Intake Coordinator", blurb: "Aliza guides new families through the intake process.", department: "intake", photo: alizaRubnitz },
  { id: "michelle-mckenzie", name: "Michelle McKenzie", title: "Assistant Intake Coordinator", blurb: "Michelle supports intake after hours and on weekends.", department: "intake", photo: michelleMckenzie },

  // Marketing
  { id: "nicholas-schlotterer", name: "Nicholas Schlotterer", title: "Marketing Director", blurb: "Nicholas leads strategy and execution across the company's marketing efforts.", department: "marketing", leadership: true, photo: nicholasSchlotterer },
  { id: "sam-perlow", name: "Sam Perlow", title: "Outreach Coordinator", blurb: "Sam leads outreach efforts.", department: "marketing", photo: samPerlow },

  // HR & Payroll
  { id: "nikki-goldenberg", name: "Nikki Goldenberg", title: "HR Manager", blurb: "Nikki handles all HR related issues.", department: "hr-payroll", leadership: true, supportsOnboarding: true, photo: nikkiGoldenberg },
  { id: "baila-friedman", name: "Baila Friedman", title: "Payroll Manager", blurb: "Baila handles all payroll related issues.", department: "hr-payroll", supportsOnboarding: true, photo: bailaFriedman },

  // QA
  { id: "rochel-walzman", name: "Rochel Walzman", credential: "BCBA", title: "QA Director", blurb: "Rochel leads all quality assurance across the company.", department: "qa", leadership: true, photo: rochelWalzman },
  { id: "amanda-avalos", name: "Amanda Avalos", credential: "BCBA", title: "QA – Initial Assessments", blurb: "Amanda reviews IAs, leads BCBA orientations, handles insurance denials, and assists with reports.", department: "qa", supportsOnboarding: true, photo: amandaAvalos },
  { id: "julianne-rodriguez", name: "Julianne Rodriguez", credential: "BCBA", title: "QA Reviewer", blurb: "Julianne reviews progress reports, prepares insurance submissions, and evaluates learning trees.", department: "qa", photo: julianneRodriguez },
  { id: "raizy-folger", name: "Raizy Folger", title: "QA Specialist", blurb: "Raizy supports new staff, maintains insurance standards, and manages Central Reach accounts.", department: "qa", supportsOnboarding: true, photo: raizyFolger },
  { id: "anje-grobler", name: "Anje Grobler", title: "QA Specialist", blurb: "Anje supports new staff, maintains insurance standards, and manages Central Reach accounts.", department: "qa", supportsOnboarding: true, photo: anjeGrobler },

  // Regional BCBAs & Training
  { id: "becca-bailey", name: "Becca Bailey", credential: "BCBA", title: "Training, Support & Orientations", blurb: "Becca provides training and support for therapists and new BCBAs.", department: "regional-bcbas", supportsOnboarding: true, photo: beccaBailey },
  { id: "breanna-dodson", name: "BreAnna Dodson", credential: "BCBA", title: "RBT Orientations", blurb: "BreAnna provides orientation for new RBTs in Georgia.", department: "regional-bcbas", states: ["GA"], supportsOnboarding: true, photo: breannaDodson },
  { id: "hannah-hayes", name: "Hannah Hayes", credential: "BCBA", title: "Fellowship Lead", blurb: "Hannah mentors RBTs in their role as they become BCBAs.", department: "regional-bcbas", supportsOnboarding: true, photo: hannahHayes },
  { id: "jameka-dixon", name: "Jameka Dixon", credential: "BCBA", title: "BCBA Training – GA", blurb: "Jameka provides training for new BCBAs.", department: "regional-bcbas", states: ["GA"], supportsOnboarding: true, photo: jamekaDixon },
  { id: "jessica-labrovic", name: "Jessica Labrovic", credential: "BCBA", title: "Regional BCBA – NC", blurb: "Jessica leads clinical support through training and events to ensure quality service delivery throughout North Carolina.", department: "regional-bcbas", states: ["NC"], leadership: true, photo: jessicaLabrovic },
  { id: "taylor-oliver", name: "Taylor Oliver", credential: "BCBA", title: "Regional BCBA – TN", blurb: "Taylor leads clinical support through training and events to ensure quality service delivery throughout Tennessee.", department: "regional-bcbas", states: ["TN"], leadership: true, photo: taylorOliver },

  // Behavioral Support
  { id: "julia-pinder", name: "Julia Pinder", credential: "BCBA", title: "Behavioral Support Director", blurb: "Julia assists and supports BCBAs with clinical and day-to-day needs.", department: "behavioral-support", leadership: true, supportsOnboarding: true, photo: juliaPinder },
  { id: "ashley-conklin", name: "Ashley Conklin", credential: "BCBA", title: "Senior Behavioral Support Director", blurb: "Ashley supports BCBAs with high-level clinical needs.", department: "behavioral-support", leadership: true, photo: ashleyConklin },
  { id: "cymbre-brumbeloe", name: "Cymbre Brumbeloe", credential: "BCBA", title: "Regional Clinical Director – GA", blurb: "Cymbre leads services and staff in our Georgia clinics.", department: "behavioral-support", leadership: true, states: ["GA"], photo: cymbreBrumbeloe },

  // Scheduling & RBT Reps
  { id: "daylis-yepez", name: "Daylis Yepez", title: "Scheduling Coordinator – MD, NC, TN, VA", blurb: "Daylis manages session scheduling, changes and updates.", department: "scheduling-rbt", states: ["MD", "NC", "TN", "VA"], supportsOnboarding: true, photo: daylisYepez },
  { id: "hannah-sandidge", name: "Hannah Sandidge", title: "Scheduling Coordinator – GA & RBT Representative", blurb: "Hannah manages session scheduling, changes and updates in GA. She is also a rep for our RBTs!", department: "scheduling-rbt", states: ["GA"], supportsOnboarding: true, photo: hannahSandidge },
  { id: "sarah-rebuelta", name: "Sarah Rebuelta", credential: "BCBA", title: "RBT Representative (Clinical Support)", blurb: "Sarah assists in high-level training questions for our RBTs and sources materials for our staff.", department: "scheduling-rbt", supportsOnboarding: true, photo: sarahRebuelta },

  // Recruiting
  { id: "surie-goldstein", name: "Surie Goldstein", title: "Recruiting Coordinator – GA", blurb: "Surie oversees Recruiting in GA and hires top-notch BCBAs.", department: "recruiting", states: ["GA"], leadership: true, photo: surieGoldstein },
  { id: "chanie-chernitzky", name: "Chanie Chernitzky", title: "Recruiting Assistant", blurb: "Chanie recruits and hires top-notch RBTs.", department: "recruiting", photo: chanieChernitzky },
  { id: "rochell-coulson", name: "Rochell Coulson", title: "Recruiting Assistant", blurb: "Rochell recruits and hires top-notch RBTs.", department: "recruiting", photo: rochellCoulson },

  // Authorizations
  { id: "rachel-greenspan", name: "Rachel Greenspan", title: "Case Manager – GA", blurb: "Rachel oversees services and staff in Georgia.", department: "ga-case-management", states: ["GA"], leadership: true, photo: rachelGreenspan },
  { id: "nicky-newman", name: "Nicky Newman", title: "Case Manager – GA", blurb: "Nicky manages cases and communication for Georgia families.", department: "ga-case-management", states: ["GA"], photo: nickyNewman },
  { id: "ahuva-florans", name: "Ahuva Florans", title: "Case Manager – GA", blurb: "Ahuva manages cases and communication for Georgia families.", department: "ga-case-management", states: ["GA"], photo: ahuvaFlorans },
  { id: "sara-uhr", name: "Sara Uhr", title: "RBT/BT & Staffing Coordinator – GA", blurb: "Sara manages case staffing, coordination and communication in Georgia.", department: "ga-case-management", states: ["GA"], photo: saraUhr },
  { id: "devorah-benenfeld", name: "Devorah Benenfeld", title: "Authorizations Manager", blurb: "Devorah oversees authorizations, denials, and eligibility.", department: "authorizations", leadership: true, photo: devorahBenenfeld },
  { id: "miriam-metzger", name: "Miriam Metzger", title: "Authorizations Coordinator – GA", blurb: "Miriam manages Georgia's insurance submissions, follow-ups for IAs, initial treatment & progress reports.", department: "authorizations", states: ["GA"], photo: miriamMetzger },
  { id: "rivky-weissman", name: "Rivky Weissman", title: "Authorizations Coordinator – GA", blurb: "Rivky handles Georgia's insurance submissions and follow-ups for progress reports.", department: "authorizations", states: ["GA"], photo: rivkyWeissman },
  { id: "kayla-brown", name: "Kayla Brown", title: "Authorizations Coordinator – MD, NC, TN, VA", blurb: "Kayla manages IA authorizations outside of Georgia and credentialing.", department: "authorizations", states: ["MD", "NC", "TN", "VA"], photo: kaylaBrown },
  { id: "riki-wallach", name: "Riki Wallach", title: "Authorizations Coordinator – MD, NC, TN, VA", blurb: "Riki manages all auths outside of Georgia for progress reports.", department: "authorizations", states: ["MD", "NC", "TN", "VA"], photo: rikiWallach },
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
