/**
 * Full lesson content for the Intake Department onboarding journey.
 * Keyed by `${academyModuleId}::${lessonId}` (academy id = `intake::intake-w{n}d{n}`).
 * Consumed by getLessonContent in lessonContent.ts and rendered by
 * TrainingLessonRuntime. Trained on today's Blossom intake process
 * (Monday, phone/CTM, Outlook, PandaDoc, Retell after-hours, VOB readiness).
 */

import type { LessonContent } from "./lessonContent";

function mk(
  objective: string,
  whyItMatters: string,
  sections: { heading: string; body: string }[],
  extras: Partial<LessonContent> = {},
): LessonContent {
  return { objective, whyItMatters, sections, ...extras };
}

export const INTAKE_LESSON_CONTENT: Record<string, LessonContent> = {
  // ===== WEEK 1 =====
  "intake::intake-w1d2::w1d2-l1": mk(
    "Use the Monday Leads Board as today's intake source of truth.",
    "Every other team assumes Monday is accurate. If Monday is wrong, they act on wrong information.",
    [
      { heading: "Plain-English explanation", body: "Monday is where every lead lives today. Before you touch a lead, look at it in Monday. After you touch it, update Monday. If it isn't in Monday, it didn't happen." },
      { heading: "Step-by-step", body: "1) Open the correct Leads view.\n2) Search before creating or editing.\n3) Review state, source, owner, contact info, insurance, form status, missing items, next action.\n4) After any action, update status and add a note.\n5) Set the next follow-up date." },
      { heading: "What good looks like", body: "Any teammate can open the lead and understand what happened last, what's missing, who owns the next step, and when it's due — without asking you." },
    ],
    {
      examples: [
        { heading: "Good update", body: '"7/15 called mom, no answer, left VM, sent text requesting insurance card + Dx report. Follow-up 7/17."' },
        { heading: "Bad update", body: '"Called."' },
      ],
      commonMistakes: ["Forgetting to update status after a call.", "Changing status without a note.", "Creating a duplicate instead of searching.", "Stale follow-up dates."],
      practiceActivity: { prompt: "Open 3 sample leads. For each, list what is missing to meet owner / status / next action / follow-up date." },
      knowledgeCheck: [
        { q: "What is today's Intake source of truth?", options: ["Monday", "CentralReach", "Outlook"], answer: 0 },
        { q: "Should you create a new lead before searching Monday?", options: ["Yes", "No — always search first"], answer: 1 },
      ],
      checklist: ["I can find the Leads board.", "I update status + notes after every action.", "I set the next follow-up date."],
    },
  ),
  "intake::intake-w1d2::w1d2-l2": mk(
    "Understand where phone calls come from and what must be logged after each call.",
    "Calls are the fastest way to lose lead context if you don't log them. CTM preserves source and campaign — Marketing depends on it.",
    [
      { heading: "Where calls originate", body: "CTM captures inbound calls tied to marketing sources (Facebook, Google, website, LeadTrap, referrals, direct). After-hours calls flow through the Retell AI spreadsheet. Never overwrite source unless correcting a clear error." },
      { heading: "Step-by-step after a call", body: "1) Log the attempt on the lead.\n2) Add outcome (answered / VM / no answer / disconnected).\n3) Note what was discussed and what's missing.\n4) Set the next follow-up.\n5) Preserve the source." },
    ],
    {
      examples: [{ heading: "Good log", body: '"Inbound from FB Ad. Spoke with mom re: 6yo son in GA. BCBS. Missing card + Dx report. Follow-up 7/17."' }],
      commonMistakes: ["Marking every source as 'phone'.", "Not logging voicemails.", "Deleting the campaign field."],
      practiceActivity: { prompt: "Match 5 sample calls to the correct source label (Facebook, Google, website, referral, direct, after-hours)." },
      knowledgeCheck: [{ q: "If a Facebook ad lead calls, what source should the lead show?", options: ["Phone", "Facebook / campaign", "Direct"], answer: 1 }],
      checklist: ["I log every call.", "I preserve lead source."],
    },
  ),
  "intake::intake-w1d2::w1d2-l3": mk(
    "Use Outlook / shared inbox correctly for family email.",
    "Family email is a written record. Sloppy threads and missing logs slow handoffs and cause duplicate outreach.",
    [
      { heading: "Plain-English", body: "Confirm the correct family email. Use the shared inbox rules your team follows today. Keep the thread going — don't start new threads for the same family." },
      { heading: "Step-by-step", body: "1) Confirm guardian email.\n2) Send approved template / form.\n3) Update Monday with what was sent.\n4) Log the family reply.\n5) Follow up if incomplete." },
    ],
    {
      examples: [{ heading: "Good note", body: '"Initial forms sent 7/15. Mom confirmed received. Follow-up 7/17 if incomplete."' }],
      commonMistakes: ["Wrong email.", "Not logging what was sent.", "New thread every time."],
      practiceActivity: { prompt: "Draft an email requesting the missing insurance card and diagnosis report." },
      checklist: ["I send from the right inbox.", "I log every send."],
    },
  ),
  "intake::intake-w1d2::w1d2-l4": mk(
    "Know how forms flow and how to preserve lead source across channels.",
    "Forms are the biggest cause of intake delays. If you can't answer 'was it sent, was it completed, what's missing?', the lead is stuck.",
    [
      { heading: "Plain-English", body: "Forms are sent through today's approved tool (PandaDoc / current process). Track sent → viewed → partial → complete. Never assume the family did it — check." },
      { heading: "Step-by-step", body: "1) Send forms from the approved tool.\n2) Update form status in Monday.\n3) Log the family response.\n4) Follow up on incomplete forms.\n5) Preserve the lead source." },
    ],
    {
      commonMistakes: ["Sending forms and not tracking status.", "Assuming 'viewed' = 'complete'.", "Losing source when a form is submitted."],
      practiceActivity: { prompt: "For 3 sample leads, identify current form status and the next follow-up action." },
      knowledgeCheck: [{ q: "'Viewed' means the form is complete.", options: ["True", "False"], answer: 1 }],
      checklist: ["I track form status.", "I follow up on incomplete forms."],
    },
  ),

  // W1D3
  "intake::intake-w1d3::w1d3-l1": mk(
    "Decide when a call or form actually becomes a new lead.",
    "Not every call is a lead. Creating leads for staff, vendors, or wrong numbers creates noise and duplicates.",
    [
      { heading: "Plain-English", body: "A lead is a family or referral contact asking about ABA services. Existing clients, staff, vendors, wrong numbers, and general questions are NOT new leads — route them correctly." },
      { heading: "Step-by-step", body: "1) Identify caller/contact type.\n2) Search existing records.\n3) Confirm new vs duplicate vs existing vs staff vs vendor vs wrong number.\n4) Route or create." },
    ],
    {
      practiceActivity: { prompt: "Classify 8 sample interactions: new lead, duplicate, existing family, staff, vendor, wrong number, general question." },
      knowledgeCheck: [{ q: "A parent of an existing client calls to reschedule. Is this a new lead?", options: ["Yes", "No — route to the right team"], answer: 1 }],
      checklist: ["I can identify a real new lead.", "I route non-lead calls."],
    },
  ),
  "intake::intake-w1d3::w1d3-l2": mk(
    "Prevent duplicate lead records with a proper search-first workflow.",
    "Duplicates fracture history. The next teammate contacts the family twice.",
    [{ heading: "Step-by-step", body: "1) Search guardian name.\n2) Search child name.\n3) Search phone.\n4) Search email.\n5) Check alternate spellings.\n6) Update existing record instead of creating." }],
    {
      examples: [{ heading: "Good outcome", body: '"Found existing lead under mother\'s phone. Updated existing record with new website form."' }],
      commonMistakes: ["Only searching one field.", "Creating duplicates from after-hours calls.", "Ignoring closed leads."],
      practiceActivity: { prompt: "Practice duplicate search on 5 sample names with misspellings." },
      knowledgeCheck: [{ q: "Which is NOT part of duplicate search?", options: ["Phone", "Email", "Guardian name", "Referring pediatrician"], answer: 3 }],
      checklist: ["I search before I create.", "I check alternate spellings."],
    },
  ),
  "intake::intake-w1d3::w1d3-l3": mk(
    "Confirm the required lead basics before the lead moves forward.",
    "Every downstream team relies on the basics. Missing basics = rework.",
    [
      { heading: "Required basics", body: "Guardian name + contact · Child name + DOB/age · State · Insurance if available · Diagnosis status · Lead source · Reason for inquiry." },
      { heading: "Step-by-step", body: "1) Review the lead.\n2) List what's missing.\n3) Contact family to fill gaps.\n4) Update Monday.\n5) Route to next action." },
    ],
    {
      commonMistakes: ["Moving forward without insurance.", "Skipping state.", "Not confirming guardian relationship."],
      practiceActivity: { prompt: "For a sample lead, list every required basic that is missing." },
      checklist: ["I know the basics.", "I confirm state and guardian."],
    },
  ),
  "intake::intake-w1d3::w1d3-l4": mk(
    "Choose the correct first action after reviewing a new lead.",
    "The first action sets the cadence. Wrong action = lead stalls or frustrates family.",
    [{ heading: "Possible first actions", body: "Call family · Send forms · Request missing info · Prepare for benefits/VOB review · Route to manager · Mark cannot reach · Disqualify/close with reason." }],
    {
      practiceActivity: { prompt: "Given 6 lead scenarios, choose the correct first action and justify it in one sentence." },
      knowledgeCheck: [{ q: "Lead has basics + forms complete. Correct first action?", options: ["Call again", "Prepare for benefits/VOB review", "Close as duplicate"], answer: 1 }],
      checklist: ["I can pick the correct first action."],
    },
  ),

  // W1D4
  "intake::intake-w1d4::w1d4-l1": mk(
    "Deliver a warm, organized first family call.",
    "The first call sets trust. Families remember whether they felt guided or rushed.",
    [{ heading: "Call flow", body: "1) Introduce yourself and Blossom.\n2) Confirm guardian.\n3) Acknowledge the inquiry.\n4) Ask what they're looking for.\n5) Confirm child / state / insurance / diagnosis basics.\n6) Explain next steps.\n7) Confirm best contact method.\n8) Log the call." }],
    {
      examples: [{ heading: "Opening script", body: '"Hi, this is [Name] from Blossom ABA Therapy. I\'m reaching out about your request for services. I\'ll help gather the information we need so our team can review the next step."' }],
      commonMistakes: ["Sounding rushed.", "Using internal jargon.", "Not logging."],
      practiceActivity: { prompt: "Role-play a first call using the flow." },
      checklist: ["I introduce warmly.", "I collect basics.", "I log the call."],
    },
  ),
  "intake::intake-w1d4::w1d4-l2": mk(
    "Handle missed calls with a documented cadence that respects the family.",
    "One missed call isn't the end. No follow-up is a broken promise.",
    [{ heading: "Step-by-step", body: "1) Leave voicemail if appropriate.\n2) Send approved text or email.\n3) Log the attempt.\n4) Set next follow-up date.\n5) Continue cadence." }],
    {
      examples: [{ heading: "Text template", body: '"Hi, this is [Name] from Blossom ABA Therapy. We received your request for services and would love to help. Please call or text me back at [number]."' }],
      commonMistakes: ["One call then leaving lead alone.", "Not logging voicemail.", "No next follow-up."],
      practiceActivity: { prompt: "Write a missed-call follow-up (voicemail + text)." },
      checklist: ["I follow a cadence.", "I document every attempt."],
    },
  ),
  "intake::intake-w1d4::w1d4-l3": mk(
    "Write emails and texts that sound warm and make one clear ask.",
    "Vague requests slow the family down. Warm + specific = faster response.",
    [{ heading: "Plain-English", body: "One ask per message, always. Use the parent's name. Explain why you need it. State what happens next." }],
    {
      examples: [
        { heading: "Bad", body: '"Please send docs."' },
        { heading: "Better", body: '"Hi Mrs. Cohen — to prepare your benefits review we still need the front/back of your insurance card and your child\'s diagnosis report. You can reply here or email them. I\'ll follow up Thursday if I don\'t see them."' },
      ],
      practiceActivity: { prompt: "Rewrite 3 vague family messages into warm, specific ones." },
      checklist: ["One ask per message.", "Warm tone.", "Clear next step."],
    },
  ),
  "intake::intake-w1d4::w1d4-l4": mk(
    "Document contact attempts so the next teammate can act without asking questions.",
    "Bad notes force the next person to redo work. Good notes are a gift.",
    [{ heading: "Good note formula", body: "Date + method + outcome + family response + next action + follow-up date." }],
    {
      examples: [
        { heading: "Good", body: '"7/15 text sent to mom requesting Dx report and insurance card. Mom replied she will send tonight. Follow-up 7/16."' },
        { heading: "Bad", body: '"Texted."' },
      ],
      practiceActivity: { prompt: "Fix 5 bad notes using the formula." },
      checklist: ["Every attempt logged.", "Every note has next action + date."],
    },
  ),

  // W1D5
  "intake::intake-w1d5::w1d5-l1": mk(
    "Confirm Week 1 knowledge with a short scenario quiz.",
    "You can't own live work until the basics are automatic.",
    [{ heading: "Scope", body: "Systems, owner/status/next/follow-up, duplicates, first family contact, boundaries." }],
    {
      knowledgeCheck: [
        { q: "What four things must every lead carry?", options: ["Owner, status, next action, follow-up date", "Name, phone, email, address"], answer: 0 },
        { q: "Monday is today's intake source of truth.", options: ["True", "False"], answer: 0 },
        { q: "Intake owns final benefits approval.", options: ["True", "False"], answer: 1 },
      ],
      checklist: ["I passed the Week 1 quiz."],
    },
  ),
  "intake::intake-w1d5::w1d5-l2": mk(
    "Walk the boundary line between Intake and other departments.",
    "Boundaries protect trust. When Intake stays in its lane, other teams move faster.",
    [{ heading: "Boundary map", body: "Intake: leads, contact, basics, forms, missing info, insurance collection, VOB readiness handoff.\nRCM/Benefits: benefits determination, financial acceptance.\nAuth: authorization workflows.\nScheduling: staffing, session scheduling.\nClinical: assessments, treatment, session documentation." }],
    {
      practiceActivity: { prompt: "For 5 scenarios, decide: Intake owns, Intake supports, or Intake hands off." },
      checklist: ["I can name what Intake owns and does not own."],
    },
  ),
  "intake::intake-w1d5::w1d5-l3": mk(
    "Absorb structured mentor feedback on Week 1.",
    "The point of Week 1 is to surface gaps early — while there's time to fix them.",
    [{ heading: "Feedback structure", body: "What went well · What to sharpen · One specific practice area · Any blockers." }],
    { reflectionPrompt: "What is one thing your mentor called out that you want to improve?", checklist: ["I received feedback.", "I named my sharpening area."] },
  ),
  "intake::intake-w1d5::w1d5-l4": mk(
    "Watch how an experienced teammate closes the day cleanly.",
    "End-of-day cleanup is what keeps the board trustworthy for tomorrow.",
    [{ heading: "What to watch for", body: "Every assigned lead has owner/status/next action/follow-up date. Stale items escalated or updated. Missing-info notes specific." }],
    { reflectionPrompt: "What did your mentor do differently than you would have?", checklist: ["I can replicate end-of-day cleanup."] },
  ),

  // ===== WEEK 2 =====
  // W2D1 Forms & Consent
  "intake::intake-w2d1::w2d1-l1": mk(
    "Understand the purpose and flow of initial intake forms.",
    "Forms collect the basic information every next team needs.",
    [{ heading: "Step-by-step", body: "1) Confirm correct guardian email.\n2) Send approved initial forms.\n3) Track status: sent → viewed → partial → complete.\n4) Follow up on incomplete." }],
    { practiceActivity: { prompt: "Identify current form status for 5 sample leads and the correct next action." }, checklist: ["I know what initial forms include."] },
  ),
  "intake::intake-w2d1::w2d1-l2": mk(
    "Handle consent forms carefully — verbal is never enough.",
    "Consents unlock next steps. Skipping creates compliance risk and rework.",
    [{ heading: "Step-by-step", body: "1) Confirm which consents are needed.\n2) Send correct forms.\n3) Track completion.\n4) Ask manager if unclear." }],
    {
      commonMistakes: ["Assuming verbal consent is enough.", "Moving forward before consent completed.", "Losing signed forms."],
      knowledgeCheck: [{ q: "Verbal consent is enough for signed consent forms.", options: ["True", "False"], answer: 1 }],
      checklist: ["I confirm the right consents.", "I track completion."],
    },
  ),
  "intake::intake-w2d1::w2d1-l3": mk(
    "Track form status accurately so no lead stalls silently.",
    "'Sent' is not 'complete'. Without tracking you can't follow up.",
    [{ heading: "Statuses", body: "Sent · Viewed · Partial · Complete · Missing · Bounced." }],
    { practiceActivity: { prompt: "For 5 leads, mark correct form status and next action." }, checklist: ["I use the correct status."] },
  ),
  "intake::intake-w2d1::w2d1-l4": mk(
    "Write warm, specific form reminders that don't feel like nagging.",
    "Families are busy. Warm + specific reminders get faster action.",
    [{ heading: "Template", body: '"We are still missing the signed consent form and insurance card front/back. Once we have those we can continue the review."' }],
    { practiceActivity: { prompt: "Rewrite 4 vague reminders into warm, specific ones." }, checklist: ["Warm.", "Specific.", "One ask."] },
  ),

  // W2D2 Missing Info
  "intake::intake-w2d2::w2d2-l1": mk(
    "Write missing-info notes a stranger could act on.",
    "'Need docs' means nothing. Specific missing items get filled.",
    [{ heading: "Common missing items", body: "Diagnosis report · Insurance card front/back · Guardian info · Consent forms · Intake forms · Preferred schedule · Service location · Secondary insurance." }],
    { practiceActivity: { prompt: "Mark specific missing items from 2 sample leads." }, checklist: ["Every missing note names the exact item."] },
  ),
  "intake::intake-w2d2::w2d2-l2": mk(
    "Ask families for missing information clearly and warmly.",
    "Clear asks save the family time.",
    [{ heading: "Step-by-step", body: "1) List exact missing items.\n2) Ask clearly.\n3) Explain why.\n4) Set follow-up.\n5) Update Monday." }],
    { examples: [{ heading: "Template", body: '"To keep your intake moving, we still need [items]. You can send them to [email/contact]."' }], practiceActivity: { prompt: "Draft 3 missing-info messages using the template." }, checklist: ["I explain why.", "I set a follow-up."] },
  ),
  "intake::intake-w2d2::w2d2-l3": mk(
    "Keep every missing item on a real follow-up cadence.",
    "Leads shouldn't sit indefinitely.",
    [{ heading: "Cadence", body: "1) Follow up by due date.\n2) Vary contact method if needed.\n3) Escalate if urgent or stale.\n4) Move to Can't Reach only when criteria met." }],
    { practiceActivity: { prompt: "For 5 stale leads, choose the next action and justify it." }, checklist: ["Every missing item has a next step and date."] },
  ),
  "intake::intake-w2d2::w2d2-l4": mk(
    "Escalate same-day when missing information blocks care.",
    "Some missing info blocks a family — sitting on it is not neutral.",
    [{ heading: "Escalate when", body: "Urgent care need · payer requires fast turn · manager review triggers · compliance risk." }],
    { practiceActivity: { prompt: "Write an escalation note: Issue + why it matters + what is needed + owner + due date." }, checklist: ["I know when to escalate."] },
  ),

  // W2D3 Insurance / VOB
  "intake::intake-w2d3::w2d3-l1": mk(
    "Collect complete insurance information — not just the carrier name.",
    "Benefits/RCM can't do their job without every field.",
    [{ heading: "Collect", body: "Carrier · Member ID · Group # · Policyholder name/DOB · Card front/back · Primary/secondary · State." }],
    { commonMistakes: ["Only carrier name.", "No card images.", "No policyholder details."], practiceActivity: { prompt: "For 2 sample leads, list what insurance fields are missing." }, checklist: ["I collect every field."] },
  ),
  "intake::intake-w2d3::w2d3-l2": mk(
    "Run a Ready vs Not-Ready check before handoff to Benefits/RCM.",
    "A dirty handoff wastes RCM time and pushes the family back.",
    [{ heading: "Ready checklist", body: "Insurance complete · Diagnosis status known · Forms/consents complete · State clear · Missing items listed · Notes readable." }],
    { practiceActivity: { prompt: "Complete a supervised readiness check on 2 sample leads." }, checklist: ["I never send Not-Ready."] },
  ),
  "intake::intake-w2d3::w2d3-l3": mk(
    "Use the Lead Benefits Cheat Sheet as internal guidance — never to quote families.",
    "Cheat sheets help Intake understand payers. They are NOT permission to promise coverage.",
    [{ heading: "Rules", body: "If insurance matches a cheat sheet, attach/use internally. If unknown, flag for RCM/Benefits review. Never promise coverage or approval." }],
    { practiceActivity: { prompt: "Match 5 sample insurance names to cheat sheet or 'unknown payer' action." }, knowledgeCheck: [{ q: "Can Intake quote coverage to a family?", options: ["Yes", "No"], answer: 1 }], checklist: ["I never quote coverage."] },
  ),
  "intake::intake-w2d3::w2d3-l4": mk(
    "Build a clean VOB readiness handoff.",
    "Benefits/RCM owns the decision — Intake owns the readiness of the packet.",
    [{ heading: "Handoff includes", body: "Family/child info · State · Insurance details · Diagnosis status · Forms/consents status · Missing items · Questions/risks." }],
    { practiceActivity: { prompt: "Build a VOB readiness handoff for a sample lead." }, checklist: ["I know what belongs in the handoff."] },
  ),

  // W2D4 Retell
  "intake::intake-w2d4::w2d4-l1": mk(
    "Understand what Retell AI does today — and what it does not.",
    "Retell captures calls when a human can't. It doesn't finish intake.",
    [{ heading: "Plain-English", body: "Retell answers phones after hours or overflow. It captures the call and hands the transcript to us via a daily spreadsheet. Intake reviews and follows up during business hours." }],
    { knowledgeCheck: [{ q: "Does Retell complete intake?", options: ["Yes", "No — humans follow up"], answer: 1 }], checklist: ["I know what Retell does."] },
  ),
  "intake::intake-w2d4::w2d4-l2": mk(
    "Review the daily Retell spreadsheet row by row.",
    "Skipping rows loses leads and creates duplicates.",
    [{ heading: "Step-by-step", body: "1) Open daily Retell spreadsheet.\n2) Review each call row.\n3) Identify caller type.\n4) Search existing Monday records.\n5) Create/update record.\n6) Call back or route." }],
    { practiceActivity: { prompt: "Process 5 sample spreadsheet rows under supervision." }, checklist: ["I go row by row.", "I search before creating."] },
  ),
  "intake::intake-w2d4::w2d4-l3": mk(
    "Classify every after-hours caller before acting.",
    "Classification prevents duplicates and wrong routing.",
    [{ heading: "Caller types", body: "New family · Existing family/client · Staff · Vendor · Wrong number · Unclear." }],
    { practiceActivity: { prompt: "Classify 8 sample after-hours calls." }, checklist: ["I classify first, act second."] },
  ),
  "intake::intake-w2d4::w2d4-l4": mk(
    "Update Monday and follow up same or next business day.",
    "The Retell spreadsheet is a to-do list, not a filing cabinet.",
    [{ heading: "Step-by-step", body: "1) Search before creating.\n2) Update existing lead if found.\n3) Add call summary.\n4) Set owner and next action.\n5) Call/text back during business hours." }],
    { practiceActivity: { prompt: "For 3 after-hours rows, complete the Monday update and set follow-up." }, checklist: ["Every after-hours call reaches Monday."] },
  ),

  // W2D5 Review
  "intake::intake-w2d5::w2d5-l1": mk("Review forms handling with a mentor on live leads.", "Live review catches execution gaps.",
    [{ heading: "Focus", body: "Form status accuracy · reminders sent · follow-up dates." }],
    { practiceActivity: { prompt: "Mentor assigns 3 leads. Identify form status, missing items, next follow-up." }, checklist: ["I can defend my status calls."] }),
  "intake::intake-w2d5::w2d5-l2": mk("Review missing-info notes and cadence with a mentor.", "Missing info is where leads die silently.",
    [{ heading: "Focus", body: "Specific missing items · warm asks · next follow-up date · escalation calls." }],
    { practiceActivity: { prompt: "Fix missing-info notes on 3 leads with mentor review." }, checklist: ["My missing notes are specific."] }),
  "intake::intake-w2d5::w2d5-l3": mk("Run a supervised VOB readiness check on 2 leads.", "First look at what 'clean handoff' really means.",
    [{ heading: "Focus", body: "Insurance completeness · diagnosis status · forms complete · missing items listed · risks flagged." }],
    { practiceActivity: { prompt: "Complete VOB readiness for 2 leads with mentor." }, checklist: ["I can build a Ready handoff."] }),
  "intake::intake-w2d5::w2d5-l4": mk("Process an after-hours spreadsheet sample under supervision.", "Live practice against the actual Retell workflow.",
    [{ heading: "Focus", body: "Row-by-row · classify · search first · Monday update · same/next-day follow-up." }],
    { practiceActivity: { prompt: "Process 3 real spreadsheet rows with mentor review." }, checklist: ["I can handle a Retell sample end-to-end."] }),

  // ===== WEEK 3 =====
  // W3D1 Review Packet
  "intake::intake-w3d1::w3d1-l1": mk("Understand why packet review prevents rework.", "Last chance to catch problems before Benefits/Auth/Scheduling touch a lead.",
    [{ heading: "Plain-English", body: "The next team assumes the packet is complete. If it isn't, they bounce it back or make wrong decisions." }],
    { checklist: ["I understand who reads the packet next.", "I can name the impact of a bad packet."] }),
  "intake::intake-w3d1::w3d1-l2": mk("Run the required packet elements checklist.", "One missing element blocks the packet.",
    [{ heading: "Checklist", body: "Guardian info · Child info · DOB/age · Diagnosis status · Insurance · Forms · Consents · State/location · Preferred schedule · Missing items · Notes · Next action." }],
    { practiceActivity: { prompt: "Review a sample packet against the checklist and mark pass/block." }, checklist: ["I can run the checklist from memory."] }),
  "intake::intake-w3d1::w3d1-l3": mk("Recognize what blocks a packet and how to unblock it.", "Blockers repeat. Learn the patterns.",
    [{ heading: "Common blockers", body: "Missing diagnosis · missing insurance card · unclear guardian · unsigned forms · no contact · financial/benefits issue · unclear state." }],
    { practiceActivity: { prompt: "For 5 packets, decide pass or block and name the blocker." }, checklist: ["I can name the top blockers."] }),
  "intake::intake-w3d1::w3d1-l4": mk("Write handoff notes the next teammate can act on immediately.", "The next team shouldn't have to call you.",
    [{ heading: "Note formula", body: "Who + what + why + owner + due + blocker." }],
    { practiceActivity: { prompt: "Rewrite 3 weak handoff notes using the formula." }, checklist: ["My handoff notes stand alone."] }),

  // W3D2 VOB
  "intake::intake-w3d2::w3d2-l1": mk("Confirm packet readiness before VOB submission.", "Submitting Not-Ready packets makes RCM slow down for everyone.",
    [{ heading: "Ready before submit", body: "Insurance complete · Diagnosis status known · Forms/consents complete · Missing items listed · Questions flagged." }],
    { checklist: ["I never submit Not-Ready."] }),
  "intake::intake-w3d2::w3d2-l2": mk("Send Benefits/RCM exactly what they need — no more, no less.", "Extra noise slows RCM. Missing detail bounces the handoff.",
    [{ heading: "Include", body: "Family info · insurance card · policyholder info · diagnosis status · state · forms status · missing items · payer questions." }],
    { practiceActivity: { prompt: "Build a VOB handoff message for a sample lead." }, checklist: ["I include everything RCM needs."] }),
  "intake::intake-w3d2::w3d2-l3": mk("Track VOB status accurately once it's out of Intake's hands.", "The family will ask. You should be able to answer without pinging RCM.",
    [{ heading: "Statuses", body: "Submitted · Pending · Returned · Needs more info · Complete." }],
    { checklist: ["I know the VOB status on my leads."] }),
  "intake::intake-w3d2::w3d2-l4": mk("Ask RCM/manager for help before you guess.", "Guessing at benefits questions gives families wrong information.",
    [{ heading: "Ask when", body: "Insurance unknown · benefits look unusual · family asks cost · payer guidance unclear · No OON risk · payment plan question." }],
    { checklist: ["I escalate benefits questions correctly."] }),

  // W3D3 Can't Reach
  "intake::intake-w3d3::w3d3-l1": mk("Follow the full contact cadence before Can't Reach.", "Can't Reach after one attempt is giving up.",
    [{ heading: "Cadence", body: "Multiple attempts across call · text · email, spread across days, documented each time." }],
    { checklist: ["I follow the cadence before Can't Reach."] }),
  "intake::intake-w3d3::w3d3-l2": mk("Document every attempt so Can't Reach can be defended.", "If questioned, the notes must prove the effort.",
    [{ heading: "Good example", body: '"Attempt 3: called and texted 7/15. No response. Final follow-up 7/18 before Can\'t Reach review."' }],
    { practiceActivity: { prompt: "Fix 5 incomplete attempt notes." }, checklist: ["Every attempt is detailed."] }),
  "intake::intake-w3d3::w3d3-l3": mk("Move a lead to Can't Reach only after criteria are met.", "Moving early loses families we could have reached.",
    [{ heading: "Before moving", body: "Confirm attempts · dates · methods · no new response · manager criteria · send final message if appropriate." }],
    { checklist: ["I move to Can't Reach only when criteria are met."] }),
  "intake::intake-w3d3::w3d3-l4": mk("Keep the door open with respectful final communication.", "Families come back. Warm closure keeps that possible.",
    [{ heading: "Tone", body: "Warm, respectful, no blame. Invite them to reach out again when ready." }],
    { practiceActivity: { prompt: "Write a warm final message for a Can't Reach lead." }, checklist: ["I keep the door open."] }),

  // W3D4 Disqual / Need Diagnosis
  "intake::intake-w3d4::w3d4-l1": mk("Handle 'need diagnosis' without making the family feel dismissed.", "Explain what's required clearly and warmly.",
    [{ heading: "Plain-English", body: "If diagnosis is missing or incomplete, explain what's required to move forward and how they can get it." }],
    { checklist: ["I can explain need-diagnosis warmly."] }),
  "intake::intake-w3d4::w3d4-l2": mk("Disqualify only for real reasons — and document them.", "Disqualification without a reason is chaos.",
    [{ heading: "Common reasons", body: "Out of service area · insurance not accepted · not an ABA need · age/program mismatch · duplicate · family chose not to proceed." }],
    { checklist: ["Every disqualification has a documented reason."] }),
  "intake::intake-w3d4::w3d4-l3": mk("Document reason, next step, and whether we can revisit.", "Future teammates may pick this lead up again.",
    [{ heading: "Include", body: "Reason · date · who decided · revisit-ability." }],
    { checklist: ["Notes cover reason and revisit-ability."] }),
  "intake::intake-w3d4::w3d4-l4": mk("Send respectful closure communication.", "How we say no matters.",
    [{ heading: "Template", body: '"Based on [reason], Blossom is not able to move forward at this time. Thank you for reaching out, and we wish you the best."' }],
    { practiceActivity: { prompt: "Write 3 respectful closures for different reasons." }, checklist: ["My closures are respectful."] }),

  // W3D5 Handoffs
  "intake::intake-w3d5::w3d5-l1": mk("Build handoffs the receiving team can act on.", "Vague handoffs create ping-pong.",
    [{ heading: "Good handoff includes", body: "Who · what · why · owner · due date · blocker · link/context." }],
    { practiceActivity: { prompt: "Draft 3 handoffs and get them reviewed." }, checklist: ["My handoffs are complete."] }),
  "intake::intake-w3d5::w3d5-l2": mk("Route handoffs to the correct owner.", "Routing wrong wastes a day.",
    [{ heading: "Examples", body: "Benefits/RCM: benefits/VOB review.\nAuth: auth path info.\nScheduling: family availability.\nState Ops: state-specific blocker." }],
    { practiceActivity: { prompt: "Route 6 scenarios to the correct department." }, checklist: ["I know who owns what."] }),
  "intake::intake-w3d5::w3d5-l3": mk("Escalate same-day when patient care or compliance is involved.", "Some issues shouldn't wait until tomorrow.",
    [{ heading: "Same-day triggers", body: "Patient care · compliance · billing · staffing · urgent family issues." }],
    { checklist: ["I know what triggers same-day."] }),
  "intake::intake-w3d5::w3d5-l4": mk("Avoid dumping normal intake execution onto State Directors.", "SDs unblock — they don't replace department process.",
    [{ heading: "Plain-English", body: "SDs help with state health issues. They shouldn't do normal Intake execution because Intake didn't finish." }],
    { practiceActivity: { prompt: "For 6 scenarios, choose the correct owner." }, checklist: ["I don't overload SDs."] }),

  // ===== WEEK 4 =====
  // W4D1 Queue Part 1
  "intake::intake-w4d1::w4d1-l1": mk("Start the day with a clean queue review.", "Morning review sets the whole day.",
    [{ heading: "Step-by-step", body: "1) Review assigned leads.\n2) Sort urgent/new/overdue/missing info.\n3) Identify first actions.\n4) Ask mentor about unclear items." }],
    { checklist: ["I start the day with review."] }),
  "intake::intake-w4d1::w4d1-l2": mk("Prioritize by risk, not arrival time.", "Wrong order = stale leads and frustrated families.",
    [{ heading: "Priority order", body: "1) New untouched leads\n2) Overdue follow-ups\n3) Family responses\n4) Missing info close to ready\n5) VOB-ready leads\n6) Stale cleanup." }],
    { checklist: ["I prioritize by risk."] }),
  "intake::intake-w4d1::w4d1-l3": mk("Keep Monday accurate after every touched lead.", "Quality shows up here.",
    [{ heading: "After every touch", body: "Owner · Status · Next action · Follow-up date · Note explaining what happened." }],
    { checklist: ["Every touched lead is updated."] }),
  "intake::intake-w4d1::w4d1-l4": mk("End the day with nothing stale or unowned.", "Your promise to tomorrow.",
    [{ heading: "Before leaving", body: "Every assigned lead has owner, status, next action, follow-up date, and a clear note." }],
    { checklist: ["Nothing stale or unowned when I leave."] }),

  // W4D2 Queue Part 2
  "intake::intake-w4d2::w4d2-l1": mk("Follow up when you promised.", "Following up on time builds trust.",
    [{ heading: "Plain-English", body: "If you said Thursday, follow up Thursday. If you can't, update the note and reset the date." }],
    { checklist: ["No stale follow-ups on my queue."] }),
  "intake::intake-w4d2::w4d2-l2": mk("Clear old missing-info items decisively.", "Old drift kills queue health.",
    [{ heading: "Step-by-step", body: "1) List old missing-info items.\n2) Ask family one more time.\n3) Escalate or close with reason if no response after cadence." }],
    { checklist: ["I clear old missing-info items decisively."] }),
  "intake::intake-w4d2::w4d2-l3": mk("Log call/email outcome every time.", "Notes are the audit trail.",
    [{ heading: "After every contact", body: "Outcome + next step + follow-up date." }],
    { checklist: ["I log every contact."] }),
  "intake::intake-w4d2::w4d2-l4": mk("Write escalations a manager can act on immediately.", "Vague escalations waste manager time.",
    [{ heading: "Format", body: "Issue + why it matters + what is needed + owner + due date." }],
    { examples: [{ heading: "Good", body: '"Insurance is unknown payer. Need RCM review before family can be told next step. Owner: RCM. Due: 7/16."' }], checklist: ["My escalations are actionable."] }),

  // W4D3 Family Comms Quality
  "intake::intake-w4d3::w4d3-l1": mk("Sound warm in every family communication.", "Warm = human, calm, respectful.",
    [{ heading: "Plain-English", body: "Use the family's name. Skip internal jargon. Slow down. Read the message back before sending." }],
    { checklist: ["My tone is warm."] }),
  "intake::intake-w4d3::w4d3-l2": mk("Make one clear request per message.", "One ask = higher family follow-through.",
    [{ heading: "Examples", body: 'Bad: "Need packet completed."\nGood: "We still need the signed consent form and a copy of your insurance card front and back."' }],
    { practiceActivity: { prompt: "Rewrite 3 multi-ask messages into single-ask." }, checklist: ["One ask per message."] }),
  "intake::intake-w4d3::w4d3-l3": mk("Stay calm and clear with difficult family calls.", "Frustrated families need clarity — not defensiveness.",
    [{ heading: "Approach", body: "Stay calm · acknowledge frustration · clarify next step · don't promise what you can't control · document carefully." }],
    { practiceActivity: { prompt: "Role-play 3 difficult calls with your mentor." }, checklist: ["I stay calm.", "I document carefully."] }),
  "intake::intake-w4d3::w4d3-l4": mk("Make sure notes match reality after every contact.", "Notes that don't match reality mislead the next teammate.",
    [{ heading: "After every contact", body: "Update Monday immediately — outcome, next step, follow-up." }],
    { checklist: ["My notes always match reality."] }),

  // W4D4 Simulation
  "intake::intake-w4d4::w4d4-l1": mk("Process a simulated new lead end-to-end.", "Tests whether the basics are automatic.",
    [{ heading: "Steps", body: "Duplicate search · review source · create/update record · choose first action." }],
    { practiceActivity: { prompt: "Take a simulated new lead from zero." }, checklist: ["I can process a new lead solo."] }),
  "intake::intake-w4d4::w4d4-l2": mk("Simulate first call plus follow-up cadence.", "Live-like practice = fewer mistakes on real leads.",
    [{ heading: "Focus", body: "Warm intro · basics · next step · documentation · missed-call cadence." }],
    { practiceActivity: { prompt: "Complete a full first-call + cadence simulation." }, checklist: ["I can run first-call flow."] }),
  "intake::intake-w4d4::w4d4-l3": mk("Simulate forms and missing-info handling.", "Biggest drift areas — practice matters.",
    [{ heading: "Focus", body: "Send · track status · warm reminder · escalate if blocked." }],
    { practiceActivity: { prompt: "Simulate 2 forms/missing-info flows to completion." }, checklist: ["I can run forms + missing info."] }),
  "intake::intake-w4d4::w4d4-l4": mk("Prepare and send a clean VOB readiness handoff.", "The graduation-level test.",
    [{ heading: "Focus", body: "Family + insurance + diagnosis + forms + missing + questions." }],
    { practiceActivity: { prompt: "Build and send a clean VOB handoff for mentor review." }, checklist: ["I can build a Ready handoff solo."] }),

  // W4D5 Graduation
  "intake::intake-w4d5::w4d5-l1": mk("Pass the final knowledge review.", "Confirms readiness for independent work.",
    [{ heading: "Scope", body: "Lead source · duplicate search · family contact · missing info · forms · insurance · VOB readiness · Retell AI · Can't Reach · handoffs · boundaries." }],
    { knowledgeCheck: [
        { q: "Does Intake own final financial approval?", options: ["Yes", "No"], answer: 1 },
        { q: "Monday is today's intake source of truth.", options: ["True", "False"], answer: 0 },
        { q: "Can't Reach can be used after one missed call.", options: ["True", "False"], answer: 1 },
        { q: "Every escalation note should include owner and due date.", options: ["True", "False"], answer: 0 },
      ], checklist: ["I passed the final review."] }),
  "intake::intake-w4d5::w4d5-l2": mk("Have a frank readiness conversation with your manager.", "Readiness is a conversation, not a checkbox.",
    [{ heading: "Manager decides", body: "Ready for controlled queue · Ready with review · Needs more shadowing · Blocked and why." }],
    { reflectionPrompt: "What are you ready to own, and what still needs supervision?", checklist: ["I had the readiness conversation."] }),
  "intake::intake-w4d5::w4d5-l3": mk("Name 2 strengths and 2 coaching areas.", "Naming both keeps growth honest.",
    [{ heading: "Prompt", body: "What are you strong at? What still needs sharpening? Where do you want help?" }],
    { reflectionPrompt: "Two strengths, two coaching areas.", checklist: ["I named my strengths and coaching areas."] }),
  "intake::intake-w4d5::w4d5-l4": mk("Build a concrete 30-day growth plan.", "The next 30 days are where confidence gets built.",
    [{ heading: "Plan includes", body: "What you own independently · what still needs review · weekly check-ins · accuracy goals · communication goals · speed/queue goals." }],
    { practiceActivity: { prompt: "Draft your 30-day plan with your manager." }, checklist: ["My 30-day plan is written and shared."] }),
};
