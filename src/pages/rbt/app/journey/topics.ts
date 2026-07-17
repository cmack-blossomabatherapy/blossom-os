export interface TopicDef {
  key: string;
  prompt: string;
  helper?: string;
  /** How to phrase the two ends of the 1-5 scale */
  minLabel: string;
  maxLabel: string;
  /** Which direction is "healthy" — helps supportive phrasing but is NOT shown as a score */
  positive: "high" | "low";
}

export const TOPIC_DEFS: Record<string, TopicDef> = {
  confidence:               { key:"confidence", prompt:"How confident do you feel right now?", minLabel:"Not yet", maxLabel:"Very", positive:"high" },
  case_fit:                 { key:"case_fit", prompt:"How well does this case feel like a fit?", minLabel:"Not a fit", maxLabel:"Great fit", positive:"high" },
  schedule_accuracy:        { key:"schedule_accuracy", prompt:"How accurate has your schedule been?", minLabel:"Very off", maxLabel:"On point", positive:"high" },
  travel_burden:            { key:"travel_burden", prompt:"How manageable is your travel?", helper:"1 = easy, 5 = a lot", minLabel:"Easy", maxLabel:"A lot", positive:"low" },
  centralreach_access:      { key:"centralreach_access", prompt:"Is CentralReach working for you?", minLabel:"Blocked", maxLabel:"Working well", positive:"high" },
  bcba_direction_clarity:   { key:"bcba_direction_clarity", prompt:"How clear is your BCBA's direction?", minLabel:"Unclear", maxLabel:"Very clear", positive:"high" },
  bcba_support:             { key:"bcba_support", prompt:"How supported do you feel by your BCBA?", minLabel:"Not much", maxLabel:"Very", positive:"high" },
  family_barriers:          { key:"family_barriers", prompt:"How much are family/caregiver barriers getting in the way?", helper:"1 = none, 5 = a lot", minLabel:"None", maxLabel:"A lot", positive:"low" },
  training_needs:           { key:"training_needs", prompt:"How much extra training would help you feel ready?", helper:"1 = none, 5 = a lot", minLabel:"None", maxLabel:"A lot", positive:"low" },
  documentation_confidence: { key:"documentation_confidence", prompt:"How confident are you writing your session notes?", minLabel:"Not yet", maxLabel:"Very", positive:"high" },
  supervision_received:     { key:"supervision_received", prompt:"How supported have you felt in your supervision?", minLabel:"Not much", maxLabel:"Very", positive:"high" },
  payroll_concerns:         { key:"payroll_concerns", prompt:"Any concerns with hours or pay?", helper:"1 = none, 5 = major", minLabel:"None", maxLabel:"Major", positive:"low" },
  sense_of_belonging:       { key:"sense_of_belonging", prompt:"Do you feel like you belong here?", minLabel:"Not yet", maxLabel:"Absolutely", positive:"high" },
  intent_to_stay:           { key:"intent_to_stay", prompt:"Do you see yourself continuing here?", minLabel:"Unsure", maxLabel:"Definitely", positive:"high" },
  career_interest:          { key:"career_interest", prompt:"How interested are you in growing your career here?", minLabel:"Not sure yet", maxLabel:"Very interested", positive:"high" },
};

export const CAREER_INTERESTS = [
  { key: "senior_rbt", label: "Senior RBT" },
  { key: "lead_rbt", label: "Lead RBT" },
  { key: "trainer", label: "Trainer" },
  { key: "rbt_supervisor", label: "RBT Supervisor" },
  { key: "bcba_pathway", label: "BCBA pathway (Fellowship)" },
  { key: "case_coordination", label: "Case coordination" },
  { key: "clinic_admin", label: "Clinic administration" },
  { key: "stay_rbt", label: "Grow as a great RBT" },
];