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
  { id: "chad-kaufman", name: "Chad Kaufman", title: "Chief Executive Officer", blurb: "Executive leadership for Blossom's multi-state operating system.", department: "operations", states: ["GA", "NC", "TN", "VA", "MD"], leadership: true, photo: chadKaufman },
  { id: "mordy-gobioff", name: "Mordy Gobioff", title: "Chief Operating Officer", blurb: "Operational leadership across workflows, staffing, and growth readiness.", department: "operations", states: ["GA", "NC", "TN", "VA", "MD"], leadership: true, photo: mordyGobioff },
  { id: "eli-berman", name: "Eli Berman", title: "Operations Leadership", blurb: "Supports operational clarity and cross-functional execution.", department: "operations", states: ["GA", "NC", "TN", "VA", "MD"], leadership: true, photo: eliBerman },
  { id: "levi-garfunkel", name: "Levi Garfunkel", title: "Systems & Operations", blurb: "Keeps operational systems aligned with team workflows.", department: "operations", states: ["GA", "NC", "TN", "VA", "MD"], leadership: true, photo: leviGarfunkel },
  { id: "yosef-aharonoff", name: "Yosef Aharonoff", title: "Systems & Software", blurb: "Supports Blossom's internal systems and technology operations.", department: "operations", states: ["GA", "NC", "TN", "VA", "MD"], photo: yosefAharonoff },

  { id: "kayla-brown", name: "Kayla Brown", title: "State Director", blurb: "State-level operational leadership and escalation support.", department: "state-directors", states: ["GA"], leadership: true, photo: kaylaBrown },
  { id: "nicky-newman", name: "Nicky Newman", title: "State Director", blurb: "State-level operational leadership and family support coordination.", department: "state-directors", states: ["NC"], leadership: true, photo: nickyNewman },
  { id: "sarah-rebuelta", name: "Sarah Rebuelta", title: "State Director", blurb: "State-level operational leadership for clinical and staffing workflows.", department: "state-directors", states: ["TN"], leadership: true, photo: sarahRebuelta },
  { id: "jessica-labrovic", name: "Jessica Labrovic", title: "State Director", blurb: "State-level operational leadership and local team coordination.", department: "state-directors", states: ["VA"], leadership: true, photo: jessicaLabrovic },
  { id: "moipa-olentiki", name: "Moipa Olentiki", title: "State Director", blurb: "State-level leadership and operational visibility.", department: "state-directors", states: ["MD"], leadership: true, photo: moipaOlentiki },
  { id: "hannah-hayes", name: "Hannah Hayes", title: "Assistant State Director", blurb: "Supports state operations, escalations, and team follow-through.", department: "asst-state-directors", states: ["NC"], leadership: true, photo: hannahHayes },
  { id: "michelle-mckenzie", name: "Michelle McKenzie", title: "Assistant State Director", blurb: "Supports state-level execution and operational coordination.", department: "asst-state-directors", states: ["GA"], leadership: true, photo: michelleMckenzie },
  { id: "taylor-oliver", name: "Taylor Oliver", title: "Assistant State Director", blurb: "Supports state team workflows and operational follow-up.", department: "asst-state-directors", states: ["TN"], leadership: true, photo: taylorOliver },

  { id: "ahuva-florans", name: "Ahuva Florans", title: "Intake Coordinator", blurb: "Welcomes new families and moves leads through intake readiness.", department: "intake", states: ["GA"], supportsOnboarding: true, photo: ahuvaFlorans },
  { id: "aliza-rubnitz", name: "Aliza Rubnitz", title: "Intake Coordinator", blurb: "Supports intake communication, forms, and follow-up workflows.", department: "intake", states: ["NC"], supportsOnboarding: true, photo: alizaRubnitz },
  { id: "amanda-avalos", name: "Amanda Avalos", title: "Intake Coordinator", blurb: "Supports family intake and service-readiness coordination.", department: "intake", states: ["TN"], supportsOnboarding: true, photo: amandaAvalos },
  { id: "chanie-chernitzky", name: "Chanie Chernitzky", title: "Intake Coordinator", blurb: "Coordinates intake follow-ups and family handoffs.", department: "intake", states: ["VA"], supportsOnboarding: true, photo: chanieChernitzky },
  { id: "gabi-kaweblum", name: "Gabi Kaweblum", title: "Intake Coordinator", blurb: "Supports new-family intake and operational follow-through.", department: "intake", states: ["MD"], supportsOnboarding: true, photo: gabiKaweblum },
  { id: "miriam-metzger", name: "Miriam Metzger", title: "Intake Support", blurb: "Supports intake coordination and family communication.", department: "intake", states: ["GA", "NC"], photo: miriamMetzger },
  { id: "raizy-folger", name: "Raizy Folger", title: "Intake Support", blurb: "Supports intake workflows and lead follow-up.", department: "intake", states: ["TN", "VA"], photo: raizyFolger },

  { id: "nikki-goldenberg", name: "Nikki Goldenberg", title: "HR Director", blurb: "Leads HR operations, people workflows, and employee support.", department: "hr-payroll", states: ["GA", "NC", "TN", "VA", "MD"], leadership: true, supportsOnboarding: true, photo: nikkiGoldenberg },
  { id: "becca-bailey", name: "Becca Bailey", title: "HR Admin Assistant", blurb: "Supports onboarding, HR requests, training, and employee enablement.", department: "hr-payroll", states: ["GA", "NC", "TN", "VA", "MD"], supportsOnboarding: true, photo: beccaBailey },
  { id: "baila-friedman", name: "Baila Friedman", title: "Payroll Specialist", blurb: "Supports payroll operations and employee pay workflows.", department: "hr-payroll", states: ["GA", "NC", "TN", "VA", "MD"], photo: bailaFriedman },
  { id: "devorah-benenfeld", name: "Devorah Benenfeld", title: "HR & Payroll Support", blurb: "Supports HR records, onboarding details, and payroll coordination.", department: "hr-payroll", states: ["GA", "NC", "TN", "VA", "MD"], supportsOnboarding: true, photo: devorahBenenfeld },

  { id: "corey-mack", name: "Corey Mack", title: "Marketing Lead", blurb: "Supports growth, campaigns, content, and market visibility.", department: "marketing", states: ["GA", "NC", "TN", "VA", "MD"], leadership: true, photo: coreyMack },
  { id: "michal-silberberg", name: "Michal Silberberg", title: "Recruiting Coordinator", blurb: "Supports recruiting pipeline, interviews, and candidate follow-up.", department: "recruiting", states: ["GA", "NC", "TN", "VA", "MD"], photo: michalSilberberg },
  { id: "rivky-weissman", name: "Rivky Weissman", title: "Recruiting Coordinator", blurb: "Supports hiring workflows and candidate onboarding coordination.", department: "recruiting", states: ["GA", "NC", "TN", "VA", "MD"], photo: rivkyWeissman },

  { id: "breanna-dodson", name: "Breanna Dodson", title: "Scheduling Coordinator", blurb: "Supports schedules, coverage, and staffing coordination.", department: "scheduling-rbt", states: ["GA"], photo: breannaDodson },
  { id: "daylis-yepez", name: "Daylis Yepez", title: "Scheduling Coordinator", blurb: "Coordinates scheduling coverage and service continuity.", department: "scheduling-rbt", states: ["NC", "TN"], photo: daylisYepez },
  { id: "sara-uhr", name: "Sara Uhr", title: "Scheduling & Staffing Lead", blurb: "Supports staffing decisions, schedule coverage, and RBT coordination.", department: "scheduling-rbt", states: ["GA", "NC", "TN", "VA", "MD"], leadership: true, photo: saraUhr },
  { id: "rachel-greenspan", name: "Rachel Greenspan", title: "Case Management", blurb: "Supports family coordination and case-level operational follow-through.", department: "ga-case-management", states: ["GA"], photo: rachelGreenspan },

  { id: "riki-wallach", name: "Riki Wallach", title: "QA Specialist", blurb: "Supports documentation quality, compliance, and review workflows.", department: "qa", states: ["GA", "NC", "TN", "VA", "MD"], photo: rikiWallach },
  { id: "rochel-walzman", name: "Rochel Walzman", title: "QA Specialist", blurb: "Supports QA reviews and compliance follow-up.", department: "qa", states: ["GA", "NC", "TN", "VA", "MD"], photo: rochelWalzman },
  { id: "surie-goldstein", name: "Surie Goldstein", title: "QA Specialist", blurb: "Supports quality assurance and clinical documentation readiness.", department: "qa", states: ["GA", "NC", "TN", "VA", "MD"], photo: surieGoldstein },
  { id: "rochell-coulson", name: "Rochell Coulson", title: "Authorizations Coordinator", blurb: "Supports authorization workflows, payer follow-up, and PR readiness.", department: "authorizations", states: ["GA", "NC", "TN", "VA", "MD"], photo: rochellCoulson },

  { id: "anje-grobler", name: "Anje Grobler", title: "Regional BCBA", blurb: "Clinical support, supervision visibility, and BCBA enablement.", department: "regional-bcbas", states: ["GA"], credential: "BCBA", photo: anjeGrobler },
  { id: "ashley-conklin", name: "Ashley Conklin", title: "Regional BCBA", blurb: "Clinical leadership and BCBA workflow support.", department: "regional-bcbas", states: ["NC"], credential: "BCBA", photo: ashleyConklin },
  { id: "cymbre-brumbeloe", name: "Cymbre Brumbeloe", title: "Regional BCBA", blurb: "Supports clinical quality, supervision, and training workflows.", department: "regional-bcbas", states: ["TN"], credential: "BCBA", photo: cymbreBrumbeloe },
  { id: "hannah-sandidge", name: "Hannah Sandidge", title: "Regional BCBA", blurb: "Supports BCBA development and clinical operations.", department: "regional-bcbas", states: ["VA"], credential: "BCBA", photo: hannahSandidge },
  { id: "jameka-dixon", name: "Jameka Dixon", title: "Regional BCBA", blurb: "Clinical support and regional BCBA coordination.", department: "regional-bcbas", states: ["MD"], credential: "BCBA", photo: jamekaDixon },
  { id: "julia-pinder", name: "Julia Pinder", title: "BCBA Training Support", blurb: "Supports BCBA training, readiness, and operational learning.", department: "regional-bcbas", states: ["GA", "NC"], credential: "BCBA", photo: juliaPinder },
  { id: "julianne-rodriguez", name: "Julianne Rodriguez", title: "BCBA Training Support", blurb: "Supports BCBA enablement and clinical learning workflows.", department: "regional-bcbas", states: ["TN", "VA"], credential: "BCBA", photo: julianneRodriguez },
  { id: "nicholas-schlotterer", name: "Nicholas Schlotterer", title: "BCBA", blurb: "Supports clinical services, supervision, and care-team coordination.", department: "regional-bcbas", states: ["MD"], credential: "BCBA", photo: nicholasSchlotterer },
  { id: "sam-perlow", name: "Sam Perlow", title: "BCBA", blurb: "Supports clinical operations, supervision, and training readiness.", department: "regional-bcbas", states: ["GA", "NC", "TN", "VA", "MD"], credential: "BCBA", photo: samPerlow },
  { id: "eli-millman", name: "Eli Millman", title: "Behavioral Support", blurb: "Senior clinical guidance and behavioral support for complex needs.", department: "behavioral-support", states: ["GA", "NC", "TN", "VA", "MD"], credential: "BCBA", photo: eliMillman },
  { id: "gary-frank", name: "Gary Frank", title: "Behavioral Support", blurb: "Supports clinical problem-solving and behavioral guidance.", department: "behavioral-support", states: ["GA", "NC", "TN", "VA", "MD"], credential: "BCBA", photo: garyFrank },
];

export function membersByDepartment(id: DepartmentId): TeamMember[] {
  return TEAM_MEMBERS.filter((m) => m.department === id);
}

export const ALL_STATES = ["GA", "NC", "TN", "VA", "MD"] as const;

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
