export type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
export type SessionSlot = "morning" | "afternoon";
export type Mode = "conversation" | "shadow" | "phrases";

export type Turn =
  | {
      role: "partner";
      text: string;
      hint?: string;
    }
  | {
      role: "you";
      prompt: string;
      suggested: string;
      alternatives?: string[];
    };

export type Dialogue = {
  id: string;
  title: string;
  context: string;
  turns: Turn[];
};

export type DayRoutine = {
  key: DayKey;
  label: string;
  focus: string;
  morning: Dialogue;
  afternoon: Dialogue;
  phrases: { text: string; use: string }[];
};

export const DAYS: DayRoutine[] = [
  {
    key: "mon",
    label: "Monday",
    focus: "Open the meeting & set the agenda",
    morning: {
      id: "mon-am",
      title: "Opening the standup",
      context: "You are hosting Monday standup. Greet the team and set the agenda.",
      turns: [
        {
          role: "partner",
          text: "Morning everyone. Thanks for jumping on. Bianconi, do you want to kick us off?",
          hint: "They invite you to open.",
        },
        {
          role: "you",
          prompt: "Open the meeting and list three agenda items.",
          suggested:
            "Sure. Thanks for joining. Today we'll cover three things: progress on the release, blockers, and Friday's demo plan.",
          alternatives: [
            "Absolutely. Quick agenda: status updates, risks, and next steps. Shall we start with progress?",
          ],
        },
        {
          role: "partner",
          text: "Sounds good. How long do we have?",
        },
        {
          role: "you",
          prompt: "Timebox the meeting.",
          suggested: "I'll keep us to twenty-five minutes so we can get back to deep work.",
        },
        {
          role: "partner",
          text: "Perfect. Who wants to go first?",
        },
        {
          role: "you",
          prompt: "Invite a teammate and transition.",
          suggested: "Sara, would you mind starting with your update?",
        },
      ],
    },
    afternoon: {
      id: "mon-pm",
      title: "Agenda negotiation",
      context: "A colleague wants to add an unplanned topic mid-meeting.",
      turns: [
        {
          role: "partner",
          text: "Before we move on — can we also talk about the vendor contract? It might slip.",
        },
        {
          role: "you",
          prompt: "Acknowledge, then protect the agenda.",
          suggested:
            "Good catch. Let's park the contract for a separate fifteen-minute call so we don't derail standup.",
        },
        {
          role: "partner",
          text: "Okay, but can we at least flag the risk now?",
        },
        {
          role: "you",
          prompt: "Allow a short flag, then close it.",
          suggested:
            "Absolutely — one sentence. What's the main risk in your view?",
        },
        {
          role: "partner",
          text: "Payment terms. Legal hasn't signed off yet.",
        },
        {
          role: "you",
          prompt: "Capture the action and move on.",
          suggested:
            "Got it. Action item: I'll schedule a contract sync with Legal today. Let's get back to updates.",
        },
      ],
    },
    phrases: [
      { text: "Thanks for making the time.", use: "Start politely" },
      { text: "The goal of this call is…", use: "Set purpose" },
      { text: "Shall we start with…?", use: "Open agenda" },
      { text: "I'll keep us to twenty-five minutes.", use: "Timebox" },
    ],
  },
  {
    key: "tue",
    label: "Tuesday",
    focus: "Give a clear status update",
    morning: {
      id: "tue-am",
      title: "Progress / Blockers / Next",
      context: "Your turn in standup. Keep it tight and structured.",
      turns: [
        {
          role: "partner",
          text: "You're up. Anything to share?",
        },
        {
          role: "you",
          prompt: "Give a Progress / Blockers / Next update.",
          suggested:
            "Quick update from my side. Progress: the API auth is done. Blocker: waiting on staging access. Next: I'll finish the integration tests once that's unlocked.",
        },
        {
          role: "partner",
          text: "When do you expect staging access?",
        },
        {
          role: "you",
          prompt: "Answer with a realistic estimate and a contingency.",
          suggested:
            "Infra said later today. If it slips past tomorrow, I'll mock the environment locally so we don't lose time.",
        },
        {
          role: "partner",
          text: "Any risk to the Friday demo?",
        },
        {
          role: "you",
          prompt: "Hedge honestly without sounding alarming.",
          suggested:
            "We're roughly on track. There's a slight risk if staging stays blocked, but I'm monitoring it closely.",
        },
      ],
    },
    afternoon: {
      id: "tue-pm",
      title: "Async update to your manager",
      context: "Your manager asks for a spoken summary before a client call.",
      turns: [
        {
          role: "partner",
          text: "Give me the thirty-second version before I join the client.",
        },
        {
          role: "you",
          prompt: "Deliver a crisp executive summary.",
          suggested:
            "We're on track for Friday. Auth is complete, UI is eighty percent, and the only open risk is staging access — I'm chasing that today.",
        },
        {
          role: "partner",
          text: "What should I promise the client?",
        },
        {
          role: "you",
          prompt: "Suggest a safe commitment.",
          suggested:
            "You can promise a working demo of login and the main dashboard. Full export can stay marked as in progress.",
        },
        {
          role: "partner",
          text: "Who owns the follow-up if staging fails?",
        },
        {
          role: "you",
          prompt: "Own it clearly.",
          suggested: "I do. I'll escalate to infra by end of day if we're still blocked.",
        },
      ],
    },
    phrases: [
      { text: "Quick update from my side…", use: "Start update" },
      { text: "We're on track for Friday.", use: "Progress" },
      { text: "The main blocker is…", use: "Problems" },
      { text: "Next I'll…", use: "Plan" },
    ],
  },
  {
    key: "wed",
    label: "Wednesday",
    focus: "Disagree politely & offer alternatives",
    morning: {
      id: "wed-am",
      title: "Soft pushback",
      context: "Someone proposes a deadline you think is unrealistic.",
      turns: [
        {
          role: "partner",
          text: "I think we can ship the full feature by Thursday. No problem.",
        },
        {
          role: "you",
          prompt: "Acknowledge, then gently push back.",
          suggested:
            "I see where you're coming from. I'd gently push back on Thursday — the QA window feels too tight.",
        },
        {
          role: "partner",
          text: "So what are you suggesting instead?",
        },
        {
          role: "you",
          prompt: "Offer a concrete alternative.",
          suggested:
            "Have we considered shipping the core path on Thursday and the edge cases on Monday?",
        },
        {
          role: "partner",
          text: "The client won't like a partial release.",
        },
        {
          role: "you",
          prompt: "Reframe the benefit.",
          suggested:
            "A stable partial release builds more trust than a rushed full release with bugs. We can be transparent about the follow-up.",
        },
      ],
    },
    afternoon: {
      id: "wed-pm",
      title: "Say no without sounding rude",
      context: "A teammate asks you to take on extra work mid-sprint.",
      turns: [
        {
          role: "partner",
          text: "Can you own the migration scripts as well? We're short-handed.",
        },
        {
          role: "you",
          prompt: "Decline while staying collaborative.",
          suggested:
            "I want to help, but if I take that on, the demo work slips. Could we park the migration until next sprint?",
        },
        {
          role: "partner",
          text: "What if it's only a couple of hours?",
        },
        {
          role: "you",
          prompt: "Hold the boundary with options.",
          suggested:
            "Even a couple of hours cuts into review time. I can review a draft if someone else writes it, or we revisit Friday afternoon.",
        },
        {
          role: "partner",
          text: "Alright. Thanks for being clear.",
        },
        {
          role: "you",
          prompt: "Close warmly.",
          suggested: "Appreciate it. Happy to jump in once the demo is locked.",
        },
      ],
    },
    phrases: [
      { text: "I see where you're coming from.", use: "Acknowledge" },
      { text: "I'd gently push back on that.", use: "Disagree" },
      { text: "Have we considered…?", use: "Offer alternative" },
      { text: "Could we park this and revisit?", use: "Defer" },
    ],
  },
  {
    key: "thu",
    label: "Thursday",
    focus: "Drive decisions & next steps",
    morning: {
      id: "thu-am",
      title: "Close with owners and deadlines",
      context: "You need to wrap a decision meeting cleanly.",
      turns: [
        {
          role: "partner",
          text: "Okay, I think we've talked enough. What's the call?",
        },
        {
          role: "you",
          prompt: "State the decision clearly.",
          suggested:
            "So, to wrap up: we're going with option B — the phased rollout.",
        },
        {
          role: "partner",
          text: "Who owns what?",
        },
        {
          role: "you",
          prompt: "Assign owners and deadlines.",
          suggested:
            "Action item: Sara owns the client note by tomorrow. Alex owns the rollout checklist by Monday. I'll send a short recap after this.",
        },
        {
          role: "partner",
          text: "Does everyone agree?",
        },
        {
          role: "you",
          prompt: "Confirm consensus.",
          suggested: "Quick check — does that sound right to everyone?",
        },
      ],
    },
    afternoon: {
      id: "thu-pm",
      title: "Follow-up call clarity",
      context: "Someone is confused after the meeting. Re-state next steps.",
      turns: [
        {
          role: "partner",
          text: "Sorry — I'm still unclear what I'm supposed to do first.",
        },
        {
          role: "you",
          prompt: "Rephrase next steps simply.",
          suggested:
            "No worries. First, draft the client note. Second, share it in Slack by noon tomorrow. I'll review within an hour.",
        },
        {
          role: "partner",
          text: "And if Legal disagrees?",
        },
        {
          role: "you",
          prompt: "Define the escalation path.",
          suggested:
            "Ping me immediately and we'll loop Legal into a fifteen-minute huddle. Don't wait until end of day.",
        },
        {
          role: "partner",
          text: "Got it. Thanks.",
        },
        {
          role: "you",
          prompt: "Close the loop.",
          suggested: "Perfect. I'll follow up over email so we have it in writing.",
        },
      ],
    },
    phrases: [
      { text: "So, to wrap up…", use: "Close" },
      { text: "Action item: Sara will…", use: "Assign" },
      { text: "Does everyone agree?", use: "Confirm" },
      { text: "I'll follow up over email.", use: "Next step" },
    ],
  },
  {
    key: "fri",
    label: "Friday",
    focus: "Small talk & networking",
    morning: {
      id: "fri-am",
      title: "Hallway chat before a meeting",
      context: "You arrive early. Make natural small talk.",
      turns: [
        {
          role: "partner",
          text: "Hey! How's your week going?",
        },
        {
          role: "you",
          prompt: "Answer and ask back.",
          suggested:
            "Pretty good — busy, but the release is almost locked. How about you?",
        },
        {
          role: "partner",
          text: "Same here. Any fun plans for the weekend?",
        },
        {
          role: "you",
          prompt: "Share a weekend plan and invite theirs.",
          suggested:
            "I'm hoping to get outside for a long walk and catch up on a show. What about you?",
        },
        {
          role: "partner",
          text: "Probably a family lunch. Oh — looks like people are joining.",
        },
        {
          role: "you",
          prompt: "Exit small talk smoothly.",
          suggested: "Nice chatting — shall we jump in?",
        },
      ],
    },
    afternoon: {
      id: "fri-pm",
      title: "Introduce yourself at a meetup",
      context: "Networking after a talk. Keep it natural.",
      turns: [
        {
          role: "partner",
          text: "Hi, I don't think we've met. I'm Jordan.",
        },
        {
          role: "you",
          prompt: "Introduce yourself and what you work on.",
          suggested:
            "Nice to meet you, Jordan. I'm Bianconi — I work on product engineering for web apps.",
        },
        {
          role: "partner",
          text: "Cool. What brought you to this talk?",
        },
        {
          role: "you",
          prompt: "Give a genuine reason + ask a question.",
          suggested:
            "I'm trying to get sharper at running meetings in English. What did you think of the speaker?",
        },
        {
          role: "partner",
          text: "Honestly? Really practical. We should stay in touch.",
        },
        {
          role: "you",
          prompt: "Close the networking moment.",
          suggested: "Definitely. Here's my LinkedIn — nice chatting, and enjoy the weekend.",
        },
      ],
    },
    phrases: [
      { text: "How's your week going?", use: "Small talk" },
      { text: "Any fun plans for the weekend?", use: "Casual" },
      { text: "I work on…", use: "Intro" },
      { text: "Nice chatting — see you Monday.", use: "Exit" },
    ],
  },
  {
    key: "sat",
    label: "Saturday",
    focus: "Daily life: café, shopping, errands",
    morning: {
      id: "sat-am",
      title: "Ordering at a café",
      context: "Busy Saturday café. Order clearly and handle a mix-up.",
      turns: [
        {
          role: "partner",
          text: "Hi there! What can I get started for you?",
        },
        {
          role: "you",
          prompt: "Order a drink and a pastry.",
          suggested:
            "Could I get a medium oat latte and a chocolate croissant, please?",
        },
        {
          role: "partner",
          text: "For here or to go?",
        },
        {
          role: "you",
          prompt: "Choose and ask about wait time.",
          suggested: "For here. How long will that take?",
        },
        {
          role: "partner",
          text: "About five minutes. That'll be eight fifty.",
        },
        {
          role: "you",
          prompt: "Pay and confirm.",
          suggested: "Perfect. Card is fine. Thanks!",
        },
      ],
    },
    afternoon: {
      id: "sat-pm",
      title: "Fixing a shopping mistake",
      context: "You received the wrong size. Handle it politely.",
      turns: [
        {
          role: "partner",
          text: "Hi, how can I help you today?",
        },
        {
          role: "you",
          prompt: "Explain the problem calmly.",
          suggested:
            "Hi — sorry, I think there's a mistake. I ordered a medium, but this is a small.",
        },
        {
          role: "partner",
          text: "Do you have the receipt?",
        },
        {
          role: "you",
          prompt: "Provide proof and ask for a swap.",
          suggested: "Yes, here it is. Could I exchange it for a medium?",
        },
        {
          role: "partner",
          text: "Of course. Let me grab that for you.",
        },
        {
          role: "you",
          prompt: "Thank them.",
          suggested: "Appreciate it — thanks for sorting that out.",
        },
      ],
    },
    phrases: [
      { text: "Could I get…?", use: "Order" },
      { text: "I'm looking for…", use: "Shop" },
      { text: "Sorry, I think there's a mistake.", use: "Fix issue" },
      { text: "How long will that take?", use: "Ask time" },
    ],
  },
  {
    key: "sun",
    label: "Sunday",
    focus: "Plans, stories & weekly preview",
    morning: {
      id: "sun-am",
      title: "Tell a short weekend story",
      context: "A friend asks what you've been up to.",
      turns: [
        {
          role: "partner",
          text: "So — what did you get up to yesterday?",
        },
        {
          role: "you",
          prompt: "Tell a short story with beginning, middle, end.",
          suggested:
            "Long story short: I went for a hike, got completely soaked in the rain, and somehow still had the best coffee of the week afterward.",
        },
        {
          role: "partner",
          text: "Ha! Were you alone?",
        },
        {
          role: "you",
          prompt: "Add a detail and ask back.",
          suggested:
            "With a friend. We laughed the whole way back. What about your weekend?",
        },
        {
          role: "partner",
          text: "Quiet one. Catching up on sleep.",
        },
        {
          role: "you",
          prompt: "Respond warmly.",
          suggested: "That sounds perfect. You definitely earned it.",
        },
      ],
    },
    afternoon: {
      id: "sun-pm",
      title: "Preview your week out loud",
      context: "Practice speaking your calendar like a professional.",
      turns: [
        {
          role: "partner",
          text: "What's your week looking like?",
        },
        {
          role: "you",
          prompt: "Outline priorities and availability.",
          suggested:
            "This week I'm focusing on the release. I'm pretty booked on Tuesday, but Wednesday afternoon is open for deep work.",
        },
        {
          role: "partner",
          text: "Any meetings you're nervous about?",
        },
        {
          role: "you",
          prompt: "Name one and how you'll prepare.",
          suggested:
            "The Thursday client sync. I'll walk through the demo once tonight so it feels automatic.",
        },
        {
          role: "partner",
          text: "You'll crush it.",
        },
        {
          role: "you",
          prompt: "Close with intention.",
          suggested: "Thanks. Let me walk you through the plan quickly if you want feedback later.",
        },
      ],
    },
    phrases: [
      { text: "This week I'm focusing on…", use: "Plans" },
      { text: "I'm pretty booked on Tuesday.", use: "Availability" },
      { text: "Let me walk you through what happened.", use: "Story" },
      { text: "Long story short…", use: "Summarize" },
    ],
  },
];

export function getTodayKey(date = new Date()): DayKey {
  const map: DayKey[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  return map[date.getDay()];
}

export function getDay(key: DayKey): DayRoutine {
  return DAYS.find((d) => d.key === key)!;
}

export function getDialogue(day: DayRoutine, slot: SessionSlot): Dialogue {
  return slot === "morning" ? day.morning : day.afternoon;
}
