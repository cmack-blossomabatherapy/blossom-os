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

export const TEAM_MEMBERS: TeamMember[] = [];

export function membersByDepartment(id: DepartmentId): TeamMember[] {
  return TEAM_MEMBERS.filter((m) => m.department === id);
}

export const ALL_STATES = []as const;

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
