import { useState, useEffect, useRef } from "react";

// ─── SYSTEM PROMPT ───────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are SAGE, an AI wellness coaching companion built on the methodology of a certified Harvard lifestyle and wellness coach.

Your approach blends:
- The COACH framework (Curiosity, Openness, Appreciation, Compassion, Honesty)
- The Six Pillars of Lifestyle Medicine: nutrition, physical activity, sleep, stress management, substance avoidance, and social connection
- Breathwork and mindset practices
- Food-as-medicine principles

Your tone is:
- Warm but direct — never fluffy or generic
- Confident and grounding
- Editorial and intentional — you choose words carefully
- You ask one powerful question at a time, never overwhelming

Your role is to:
1. Check in on how the user is feeling (body, mind, energy)
2. Offer one insight, reframe, or micro-practice based on what they share
3. Guide them toward one small, meaningful action today
4. Always close with an empowering reflection or question

Keep responses concise — 3 to 5 sentences max unless the user asks for more. You are not a therapist. If serious mental health concerns arise, gently refer them to a professional.`;

// ─── DATA ─────────────────────────────────────────────────────────────────────
const PILLARS = [
  { icon: "🥗", label: "Nutrition" },
  { icon: "🏃", label: "Movement" },
  { icon: "🌙", label: "Sleep" },
  { icon: "🧘", label: "Stress" },
  { icon: "💞", label: "Connection" },
  { icon: "✨", label: "Mindset" },
];

const MOODS = [
  { emoji: "😔", label: "Low" },
  { emoji: "😐", label: "Okay" },
  { emoji: "🙂", label: "Good" },
  { emoji: "😊", label: "Great" },
  { emoji: "🔥", label: "Thriving" },
];

const HABITS = [
  { id: "h1", icon: "💧", label: "Hydration",      target: "8 glasses"  },
  { id: "h2", icon: "🥗", label: "Healing Meal",   target: "1 today"    },
  { id: "h3", icon: "🏃", label: "Movement",       target: "30 min"     },
  { id: "h4", icon: "🌙", label: "8hrs Sleep",     target: "Last night" },
  { id: "h5", icon: "🧘", label: "Breathwork",     target: "1 session"  },
  { id: "h6", icon: "📓", label: "Journal",        target: "5 min"      },
  { id: "h7", icon: "📵", label: "Screen Break",   target: "1 hr off"   },
  { id: "h8", icon: "☀️", label: "Morning Ritual", target: "Complete"   },
];

const BW_TECHNIQUES = [
  {
    id: "478", name: "4-7-8", subtitle: "Calm & Sleep",
    description: "Activates the parasympathetic nervous system. Perfect before sleep or in moments of anxiety.",
    phases: [
      { label: "Inhale",  duration: 4, color: "#c9a96e" },
      { label: "Hold",    duration: 7, color: "#8a7a6a" },
      { label: "Exhale",  duration: 8, color: "#5a8a7a" },
    ], rounds: 4,
  },
  {
    id: "box", name: "Box Breath", subtitle: "Focus & Reset",
    description: "Used by Navy SEALs and high performers. Equalises your nervous system and sharpens focus.",
    phases: [
      { label: "Inhale",  duration: 4, color: "#c9a96e" },
      { label: "Hold",    duration: 4, color: "#8a7a6a" },
      { label: "Exhale",  duration: 4, color: "#5a8a7a" },
      { label: "Hold",    duration: 4, color: "#6a5a8a" },
    ], rounds: 4,
  },
  {
    id: "coherent", name: "Coherent", subtitle: "Balance & Flow",
    description: "5-5 breathing creates heart rate variability and a deep sense of inner coherence.",
    phases: [
      { label: "Inhale",  duration: 5, color: "#c9a96e" },
      { label: "Exhale",  duration: 5, color: "#5a8a7a" },
    ], rounds: 6,
  },
  {
    id: "energize", name: "Energize", subtitle: "Morning & Energy",
    description: "A gentle activation breath. Clears the mind and body for a focused, intentional day.",
    phases: [
      { label: "Inhale",  duration: 3, color: "#c9a96e" },
      { label: "Hold",    duration: 1, color: "#8a7a6a" },
      { label: "Exhale",  duration: 6, color: "#5a8a7a" },
    ], rounds: 5,
  },
];

const todayKey = () => new Date().toISOString().slice(0, 10);
const fmt = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

// ─── GLOBAL CSS ───────────────────────────────────────────────────────────────
const GCss = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Jost:wght@300;400;500&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #0b0906; }
    ::-webkit-scrollbar { width: 3px; }
    ::-webkit-scrollbar-thumb { background: #2a2018; border-radius: 2px; }
    textarea, input { outline: none; }
    @keyframes fadeUp  { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
    @keyframes pulse   { 0%,100%{ opacity:.3; } 50%{ opacity:1; } }
    .fu  { animation: fadeUp .5s ease both; }
    .fu1 { animation: fadeUp .5s .08s ease both; }
    .fu2 { animation: fadeUp .5s .18s ease both; }
    .fu3 { animation: fadeUp .5s .30s ease both; }
    .fu4 { animation: fadeUp .5s .44s ease both; }
    .gold-btn:hover  { background: #b8925a !important; }
    .ghost-btn:hover { background: #181208 !important; }
    .card-btn:hover  { background: #181208 !important; border-color: #2a2018 !important; }
    .mood-btn:hover  { border-color: #c9a96e !important; transform: translateY(-2px); }
    .habit-row:hover { background: #181208 !important; }
    .msg { animation: fadeUp .3s ease both; }
    .hist-card:hover { border-color: #3a3028 !important; }
  `}</style>
);

// ─── BOTTOM NAV ───────────────────────────────────────────────────────────────
const TABS = [
  { id: "home",       icon: "⌂",  label: "Home"    },
  { id: "breathwork", icon: "◎",  label: "Breathe" },
  { id: "habits",     icon: "◈",  label: "Habits"  },
  { id: "history",    icon: "◷",  label: "History" },
];

function Nav({ screen, go }) {
  if (screen === "chat" || screen === "checkin") return null;
  return (
    <nav style={s.nav}>
      {TABS.map(t => (
        <button key={t.id} onClick={() => go(t.id)}
          style={{ ...s.navBtn, color: screen === t.id ? "#c9a96e" : "#3a2a1a" }}>
          <span style={{ fontSize: 20 }}>{t.icon}</span>
          <span style={{ fontSize: 9, letterSpacing: 2, marginTop: 2 }}>{t.label}</span>
        </button>
      ))}
    </nav>
  );
}

// ─── HOME ─────────────────────────────────────────────────────────────────────
function Home({ go, sessions }) {
  const streak = (() => {
    let n = 0, d = new Date();
    while (sessions.find(x => x.date === d.toISOString().slice(0, 10))) {
      n++; d.setDate(d.getDate() - 1);
    }
    return n;
  })();

  return (
    <div style={{ ...s.screen, paddingBottom: 90 }}>
      <div style={s.center}>
        <div className="fu" style={s.logoWrap}>
          <div style={s.star}>✦</div>
          <div style={s.logo}>SAGE</div>
          <div style={s.logoSub}>AI Wellness Coach</div>
        </div>

        {streak > 0 && (
          <div className="fu1" style={s.streak}>🔥 {streak}-day streak</div>
        )}

        <div className="fu2" style={s.quote}>
          "Healing is not a destination.<br/>It's a daily practice."
        </div>

        <div className="fu3" style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%" }}>
          <button className="gold-btn"  style={s.goldBtn}  onClick={() => go("checkin")}>BEGIN TODAY'S SESSION</button>
          <button className="ghost-btn" style={s.ghostBtn} onClick={() => go("breathwork")}>◎  BREATHWORK</button>
          <button className="ghost-btn" style={s.ghostBtn} onClick={() => go("habits")}>◈  HABIT TRACKER</button>
        </div>

        <div className="fu4" style={s.pillarsRow}>
          {PILLARS.map(p => (
            <div key={p.label} style={s.pChip}>
              <span style={{ fontSize: 18 }}>{p.icon}</span>
              <span style={{ fontSize: 9, color: "#3a2a1a", letterSpacing: 1, marginTop: 2 }}>{p.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── CHECK-IN ─────────────────────────────────────────────────────────────────
function Checkin({ go, onStart }) {
  const [mood, setMood]       = useState(null);
  const [focus, setFocus]     = useState([]);
  const [note, setNote]       = useState("");
  const toggle = l => setFocus(p => p.includes(l) ? p.filter(x => x !== l) : [...p, l]);

  return (
    <div style={{ ...s.screen, paddingBottom: 40 }}>
      <div style={s.colWrap}>

        <div className="fu" style={{ display: "flex", alignItems: "center", gap: 12, width: "100%" }}>
          <button style={s.backBtn} onClick={() => go("home")}>←</button>
          <div>
            <div style={s.label}>DAILY CHECK-IN</div>
            <div style={s.h2}>How are you today?</div>
          </div>
        </div>

        <div className="fu1" style={s.moodRow}>
          {MOODS.map(m => (
            <button key={m.emoji} className="mood-btn" onClick={() => setMood(m.emoji)}
              style={{ ...s.moodBtn, borderColor: mood === m.emoji ? "#c9a96e" : "#1e1810", background: mood === m.emoji ? "#181208" : "transparent" }}>
              <span style={{ fontSize: 24 }}>{m.emoji}</span>
              <span style={{ fontSize: 9, color: "#4a3a2a", marginTop: 3, letterSpacing: 1 }}>{m.label}</span>
            </button>
          ))}
        </div>

        <div className="fu2" style={{ ...s.label, alignSelf: "flex-start" }}>FOCUS AREAS</div>
        <div className="fu2" style={s.pillarGrid}>
          {PILLARS.map(p => (
            <button key={p.label} className="card-btn" onClick={() => toggle(p.label)}
              style={{ ...s.pillarBtn, borderColor: focus.includes(p.label) ? "#c9a96e" : "#1e1810", background: focus.includes(p.label) ? "#181208" : "transparent" }}>
              <span style={{ fontSize: 18 }}>{p.icon}</span>
              <span style={{ fontSize: 10, marginTop: 4, letterSpacing: 1 }}>{p.label}</span>
            </button>
          ))}
        </div>

        <textarea className="fu3" value={note} onChange={e => setNote(e.target.value)}
          placeholder="Anything specific on your mind? (optional)"
          style={s.textarea} rows={2} />

        <button className="fu4 gold-btn"
          style={{ ...s.goldBtn, opacity: mood ? 1 : 0.35, cursor: mood ? "pointer" : "not-allowed" }}
          onClick={() => mood && onStart(mood, focus, note)}>
          START MY SESSION
        </button>
      </div>
    </div>
  );
}

// ─── CHAT ─────────────────────────────────────────────────────────────────────
function Chat({ initMood, initPillars, initNote, go, onEnd }) {
  const [msgs, setMsgs]     = useState([]);
  const [input, setInput]   = useState("");
  const [loading, setLoad]  = useState(true);
  const bottom = useRef(null);

  useEffect(() => { bottom.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, loading]);

  useEffect(() => {
    const mLabel = MOODS.find(m => m.emoji === initMood)?.label || "okay";
    const pList  = initPillars.join(", ") || "general wellness";
    const nText  = initNote.trim() ? ` They shared: "${initNote}"` : "";
    const open   = `I'm feeling ${mLabel} today. Focus: ${pList}.${nText} Open with a grounding reflection and one powerful question.`;
    callSage([{ role: "user", content: open }], true);
  }, []);

  const callSage = async (history, isOpen = false) => {
    setLoad(true);
    try {
      const res  = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, system: SYSTEM_PROMPT, messages: history }),
      });
      const data  = await res.json();
      const reply = data.content?.[0]?.text || "I'm here. Keep going.";
      if (isOpen) {
        setMsgs([{ role: "assistant", content: reply }]);
      } else {
        setMsgs([...history, { role: "assistant", content: reply }]);
      }
    } catch {
      setMsgs(p => [...p, { role: "assistant", content: "Something went wrong. Please try again." }]);
    }
    setLoad(false);
  };

  const send = () => {
    if (!input.trim()) return;
    const uMsg    = { role: "user", content: input };
    const history = [...msgs, uMsg];
    setMsgs(history);
    setInput("");
    callSage(history);
  };

  const endSession = () => { onEnd(msgs); go("home"); };

  return (
    <div style={s.chatScreen}>
      <div style={s.chatHead}>
        <button style={s.backBtn} onClick={endSession}>←</button>
        <div style={{ textAlign: "center" }}>
          <div style={s.chatTitle}>SAGE</div>
          <div style={s.chatSub}>Wellness Session</div>
        </div>
        <div style={s.live} />
      </div>

      <div style={s.feed}>
        {msgs.map((m, i) => (
          <div key={i} className="msg" style={{
            ...s.bubble,
            alignSelf:   m.role === "user" ? "flex-end" : "flex-start",
            background:  m.role === "user" ? "#181208"  : "#111008",
            borderColor: m.role === "user" ? "#c9a96e"  : "#1e1810",
            maxWidth:    m.role === "user" ? "74%"      : "88%",
          }}>
            {m.role === "assistant" && <div style={s.sageTag}>✦ SAGE</div>}
            <p style={s.bubbleTxt}>{m.content}</p>
          </div>
        ))}
        {loading && (
          <div style={{ ...s.bubble, alignSelf: "flex-start", background: "#111008", borderColor: "#1e1810" }}>
            <div style={s.sageTag}>✦ SAGE</div>
            <div style={{ display: "flex", gap: 6, height: 18, alignItems: "center" }}>
              {[0,1,2].map(i => <span key={i} style={{ ...s.dot, animationDelay: `${i*.2}s` }} />)}
            </div>
          </div>
        )}
        <div ref={bottom} />
      </div>

      <div style={s.inputRow}>
        <textarea value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Share what's on your mind…" style={s.chatInput} rows={1} />
        <button className="gold-btn" onClick={send} disabled={loading || !input.trim()}
          style={{ ...s.sendBtn, opacity: loading || !input.trim() ? 0.3 : 1 }}>↑</button>
      </div>
    </div>
  );
}

// ─── BREATHWORK ───────────────────────────────────────────────────────────────
function Breathwork() {
  const [sel, setSel]       = useState(null);
  const [state, setState]   = useState("idle");
  const [pIdx, setPIdx]     = useState(0);
  const [tLeft, setTLeft]   = useState(0);
  const [round, setRound]   = useState(1);
  const [totLeft, setTotL]  = useState(0);
  const pRef = useRef(0), rRef = useRef(1), intRef = useRef(null);

  const tech   = BW_TECHNIQUES.find(t => t.id === sel);
  const totDur = tech ? tech.phases.reduce((a, p) => a + p.duration, 0) * tech.rounds : 0;

  const start = () => {
    pRef.current = 0; rRef.current = 1;
    setPIdx(0); setRound(1);
    setTLeft(tech.phases[0].duration);
    setTotL(totDur);
    setState("active");
  };

  const stop = () => { clearInterval(intRef.current); setState("idle"); setPIdx(0); setRound(1); };

  useEffect(() => {
    if (state !== "active") return;
    intRef.current = setInterval(() => {
      setTLeft(prev => {
        if (prev <= 1) {
          const next = (pRef.current + 1) % tech.phases.length;
          const newR = next === 0 ? rRef.current + 1 : rRef.current;
          if (next === 0 && rRef.current >= tech.rounds) { clearInterval(intRef.current); setState("done"); return 0; }
          pRef.current = next;
          if (next === 0) rRef.current = newR;
          setPIdx(next); setRound(newR);
          setTotL(v => Math.max(0, v - 1));
          return tech.phases[next].duration;
        }
        setTotL(v => Math.max(0, v - 1));
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intRef.current);
  }, [state, sel]);

  const phase = tech?.phases[pIdx];
  const prog  = phase ? (phase.duration - tLeft) / phase.duration : 0;
  const scale = phase?.label === "Inhale" ? 0.72 + prog * 0.52 : phase?.label === "Exhale" ? 1.24 - prog * 0.52 : 1;

  if (!sel) return (
    <div style={{ ...s.screen, paddingBottom: 90 }}>
      <div style={s.colWrap}>
        <div className="fu" style={{ alignSelf: "flex-start" }}>
          <div style={s.label}>BREATHWORK</div>
          <div style={s.h2}>Choose your practice</div>
        </div>
        {BW_TECHNIQUES.map((t, i) => (
          <button key={t.id} className={`fu${i+1} card-btn`} onClick={() => setSel(t.id)} style={s.bwCard}>
            <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
              <div>
                <div style={s.bwName}>{t.name}</div>
                <div style={s.bwSub}>{t.subtitle}</div>
              </div>
              <div style={s.badge}>{t.rounds} rounds</div>
            </div>
            <div style={s.bwDesc}>{t.description}</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {t.phases.map((p, j) => (
                <span key={j} style={{ ...s.pill, borderColor: p.color, color: p.color }}>{p.label} {p.duration}s</span>
              ))}
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ ...s.screen, paddingBottom: 90 }}>
      <div style={{ ...s.colWrap, alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
          <button style={s.backBtn} onClick={() => { stop(); setSel(null); }}>←</button>
          <div style={{ textAlign: "center" }}>
            <div style={s.label}>{tech.name}</div>
            <div style={{ fontSize: 9, color: "#4a3a2a", letterSpacing: 3 }}>{tech.subtitle.toUpperCase()}</div>
          </div>
          <div style={{ width: 32 }} />
        </div>

        {state === "idle" && <>
          <div style={s.bwQuote}>{tech.description}</div>
          <div style={s.phaseList}>
            {tech.phases.map((p, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: p.color, flexShrink: 0 }} />
                <span style={{ color: "#e8ddd0", fontSize: 13 }}>{p.label}</span>
                <span style={{ color: "#4a3a2a", fontSize: 13, marginLeft: "auto" }}>{p.duration}s</span>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 10, color: "#2a1a0a", letterSpacing: 2 }}>Total · {fmt(totDur)} · {tech.rounds} rounds</div>
          <button className="gold-btn" style={s.goldBtn} onClick={start}>BEGIN BREATHWORK</button>
        </>}

        {state === "active" && <>
          <div style={s.orbArea}>
            <div style={{
              ...s.orbOuter, transform: `scale(${scale})`,
              borderColor: phase?.color || "#c9a96e",
              boxShadow: `0 0 60px ${phase?.color || "#c9a96e"}28`,
              transition: "transform 1s ease-in-out, border-color .8s, box-shadow .8s",
            }}>
              <div style={{ ...s.orbInner, background: `${phase?.color || "#c9a96e"}10` }}>
                <div style={{ fontSize: 9, letterSpacing: 4, color: phase?.color, fontFamily: "'Jost',sans-serif" }}>{phase?.label}</div>
                <div style={s.countdown}>{tLeft}</div>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {Array.from({ length: tech.rounds }).map((_, i) => (
              <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: i < round ? "#c9a96e" : "#1e1810", transition: "background .3s" }} />
            ))}
          </div>
          <div style={{ fontSize: 10, color: "#3a2a1a", letterSpacing: 1 }}>Round {round} of {tech.rounds} · {fmt(totLeft)} remaining</div>
          <div style={s.progTrack}><div style={{ ...s.progFill, width: `${prog * 100}%`, background: phase?.color, transition: "width 1s linear" }} /></div>
          <button style={s.stopBtn} onClick={stop}>Stop Session</button>
        </>}

        {state === "done" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, paddingTop: 40, textAlign: "center" }}>
            <div style={{ fontSize: 44, color: "#c9a96e" }}>✦</div>
            <div style={s.h2}>Session Complete</div>
            <div style={{ fontSize: 13, color: "#5a4a3a", lineHeight: 1.8, maxWidth: 280 }}>
              You completed {tech.rounds} rounds of {tech.name} breathing.<br />Take a moment. Notice how you feel.
            </div>
            <button className="gold-btn" style={{ ...s.goldBtn, marginTop: 8 }} onClick={() => setState("idle")}>BREATHE AGAIN</button>
            <button style={s.backBtn} onClick={() => { setSel(null); setState("idle"); }}>Choose Another</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── HABITS ───────────────────────────────────────────────────────────────────
function Habits({ log, setLog }) {
  const today = todayKey();
  const done  = log[today] || [];
  const pct   = Math.round((done.length / HABITS.length) * 100);

  const toggle = id => setLog(prev => {
    const cur  = prev[today] || [];
    const next = cur.includes(id) ? cur.filter(x => x !== id) : [...cur, id];
    return { ...prev, [today]: next };
  });

  const streak = (() => {
    let n = 0, d = new Date(); d.setDate(d.getDate() - 1);
    while ((log[d.toISOString().slice(0, 10)] || []).length > 0) { n++; d.setDate(d.getDate() - 1); }
    return n;
  })();

  const C  = 2 * Math.PI * 38;
  const off = C * (1 - pct / 100);

  return (
    <div style={{ ...s.screen, paddingBottom: 90 }}>
      <div style={s.colWrap}>
        <div className="fu" style={{ alignSelf: "flex-start" }}>
          <div style={s.label}>HABIT TRACKER</div>
          <div style={s.h2}>Today's Rituals</div>
        </div>

        <div className="fu1" style={s.habitSummary}>
          <svg width="88" height="88" viewBox="0 0 88 88" style={{ flexShrink: 0 }}>
            <circle cx="44" cy="44" r="38" fill="none" stroke="#1a1208" strokeWidth="6" />
            <circle cx="44" cy="44" r="38" fill="none" stroke="#c9a96e" strokeWidth="6"
              strokeDasharray={C} strokeDashoffset={off} strokeLinecap="round"
              transform="rotate(-90 44 44)" style={{ transition: "stroke-dashoffset .6s ease" }} />
            <text x="44" y="48" textAnchor="middle" fill="#e8ddd0" style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 17 }}>{pct}%</text>
          </svg>
          <div>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 24, color: "#e8ddd0" }}>
              {done.length} <span style={{ color: "#2a1a0a" }}>/ {HABITS.length}</span>
            </div>
            <div style={{ fontSize: 9, color: "#3a2a1a", letterSpacing: 2, marginTop: 4 }}>COMPLETED TODAY</div>
            {streak > 0 && <div style={{ fontSize: 11, color: "#c9a96e", marginTop: 6 }}>🔥 {streak} day streak</div>}
          </div>
        </div>

        <div className="fu2" style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
          {HABITS.map(h => {
            const isDone = done.includes(h.id);
            return (
              <button key={h.id} className="habit-row" onClick={() => toggle(h.id)}
                style={{ ...s.habitRow, borderColor: isDone ? "#c9a96e22" : "#111008", background: isDone ? "#161008" : "#0e0c08" }}>
                <span style={{ fontSize: 20 }}>{h.icon}</span>
                <div style={{ flex: 1, textAlign: "left" }}>
                  <div style={{ fontSize: 13, color: isDone ? "#d8c8a8" : "#5a4a3a" }}>{h.label}</div>
                  <div style={{ fontSize: 10, color: "#2a1a0a", marginTop: 2, letterSpacing: 1 }}>{h.target}</div>
                </div>
                <div style={{
                  width: 22, height: 22, borderRadius: "50%",
                  border: `1.5px solid ${isDone ? "#c9a96e" : "#2a1a0a"}`,
                  background: isDone ? "#c9a96e" : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, color: "#0b0906", flexShrink: 0,
                  transition: "all .2s ease",
                }}>{isDone ? "✓" : ""}</div>
              </button>
            );
          })}
        </div>

        {pct === 100 && (
          <div className="fu" style={s.celebrate}>
            ✦ Perfect day — every ritual complete ✦
          </div>
        )}
      </div>
    </div>
  );
}

// ─── HISTORY ──────────────────────────────────────────────────────────────────
function History({ sessions }) {
  const [open, setOpen] = useState(null);

  if (sessions.length === 0) return (
    <div style={s.screen}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, textAlign: "center" }}>
        <div style={{ fontSize: 42, color: "#1e1810" }}>◷</div>
        <div style={s.h2}>No sessions yet</div>
        <div style={{ fontSize: 13, color: "#3a2a1a", lineHeight: 1.8 }}>Your coaching sessions will<br />appear here after you complete them.</div>
      </div>
    </div>
  );

  const grouped = sessions.reduce((acc, ss) => {
    const month = new Date(ss.timestamp).toLocaleString("default", { month: "long", year: "numeric" });
    (acc[month] = acc[month] || []).push(ss);
    return acc;
  }, {});

  return (
    <div style={{ ...s.screen, paddingBottom: 90, justifyContent: "flex-start" }}>
      <div style={{ ...s.colWrap, paddingTop: 28 }}>
        <div className="fu" style={{ alignSelf: "flex-start" }}>
          <div style={s.label}>SESSION HISTORY</div>
          <div style={s.h2}>{sessions.length} session{sessions.length !== 1 ? "s" : ""}</div>
        </div>

        {Object.entries(grouped).map(([month, list]) => (
          <div key={month} style={{ width: "100%" }}>
            <div style={s.monthLabel}>{month}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {list.map((ss, i) => {
                const d      = new Date(ss.timestamp);
                const isOpen = open === ss.timestamp;
                return (
                  <div key={i} className="hist-card" style={{ ...s.histCard, borderColor: isOpen ? "#2a2018" : "#181208" }}>
                    <button style={s.histBtn} onClick={() => setOpen(isOpen ? null : ss.timestamp)}>
                      <div style={{ textAlign: "left" }}>
                        <div style={{ fontSize: 13, color: "#c8b89a" }}>
                          {d.toLocaleDateString("default", { weekday: "long", month: "short", day: "numeric" })}
                        </div>
                        <div style={{ fontSize: 10, color: "#3a2a1a", marginTop: 3, letterSpacing: 1 }}>
                          {ss.mood} · {ss.pillars?.join(", ") || "General"} · {ss.messages.filter(m => m.role === "user").length} exchanges
                        </div>
                      </div>
                      <div style={{ color: "#3a2a1a", fontSize: 15, transition: "transform .2s", transform: isOpen ? "rotate(180deg)" : "none" }}>⌄</div>
                    </button>

                    {isOpen && (
                      <div style={{ borderTop: "1px solid #181208", margin: "0 16px", paddingBottom: 16 }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 14 }}>
                          {ss.messages.map((m, j) => (
                            <div key={j} style={{
                              padding: "11px 14px",
                              background: m.role === "user" ? "#161008" : "#0e0c08",
                              borderLeft: `2px solid ${m.role === "user" ? "#c9a96e" : "#2a2018"}`,
                            }}>
                              <div style={{ fontSize: 9, letterSpacing: 3, color: m.role === "user" ? "#c9a96e" : "#3a2a1a", marginBottom: 6 }}>
                                {m.role === "user" ? "YOU" : "✦ SAGE"}
                              </div>
                              <p style={{ fontSize: 12, color: "#7a6a58", lineHeight: 1.75 }}>{m.content}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen]   = useState("home");
  const [iMood, setIMood]     = useState(null);
  const [iPillars, setIPil]   = useState([]);
  const [iNote, setINote]     = useState("");
  const [sessions, setSess]   = useState([]);
  const [habitLog, setHLog]   = useState({});

  const go = (sc) => setScreen(sc);

  const handleStart = (mood, pillars, note) => {
    setIMood(mood); setIPil(pillars); setINote(note);
    setScreen("chat");
  };

  const handleEnd = (messages) => {
    if (!messages.length) return;
    const mLabel = MOODS.find(m => m.emoji === iMood)?.label || "";
    setSess(prev => [{
      timestamp: new Date().toISOString(),
      date:      todayKey(),
      mood:      `${iMood} ${mLabel}`,
      pillars:   iPillars,
      messages,
    }, ...prev]);
  };

  return (
    <div style={s.root}>
      <GCss />
      {screen === "home"       && <Home        go={go} sessions={sessions} />}
      {screen === "checkin"    && <Checkin     go={go} onStart={handleStart} />}
      {screen === "chat"       && <Chat        initMood={iMood} initPillars={iPillars} initNote={iNote} go={go} onEnd={handleEnd} />}
      {screen === "breathwork" && <Breathwork />}
      {screen === "habits"     && <Habits      log={habitLog} setLog={setHLog} />}
      {screen === "history"    && <History     sessions={sessions} />}
      <Nav screen={screen} go={go} />
    </div>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const s = {
  root:        { minHeight:"100vh", background:"#0b0906", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Jost',sans-serif", color:"#e8ddd0" },
  screen:      { width:"100%", maxWidth:440, minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"40px 22px" },
  center:      { display:"flex", flexDirection:"column", alignItems:"center", gap:26, width:"100%" },
  colWrap:     { display:"flex", flexDirection:"column", alignItems:"flex-start", gap:18, width:"100%", paddingTop:24 },

  // Logo
  logoWrap:    { display:"flex", flexDirection:"column", alignItems:"center", gap:6 },
  star:        { fontSize:26, color:"#c9a96e" },
  logo:        { fontFamily:"'Cormorant Garamond',serif", fontSize:56, fontWeight:300, letterSpacing:18, color:"#e8ddd0", lineHeight:1 },
  logoSub:     { fontSize:10, letterSpacing:4, color:"#3a2a1a", textTransform:"uppercase", marginTop:4 },
  streak:      { fontSize:11, color:"#c9a96e", border:"1px solid #2a1a0a", padding:"6px 18px", letterSpacing:2 },
  quote:       { fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", fontSize:18, color:"#c9a96e88", textAlign:"center", lineHeight:1.7 },
  pillarsRow:  { display:"flex", gap:16, flexWrap:"wrap", justifyContent:"center" },
  pChip:       { display:"flex", flexDirection:"column", alignItems:"center", gap:2 },

  // Buttons
  goldBtn:     { background:"#c9a96e", color:"#0b0906", border:"none", padding:"15px 24px", fontSize:11, letterSpacing:2.5, fontFamily:"'Jost',sans-serif", fontWeight:500, cursor:"pointer", transition:"all .25s ease", width:"100%" },
  ghostBtn:    { background:"transparent", color:"#c9a96e66", border:"1px solid #1e1810", padding:"13px 24px", fontSize:11, letterSpacing:2, fontFamily:"'Jost',sans-serif", cursor:"pointer", transition:"all .25s ease", width:"100%" },
  backBtn:     { background:"transparent", border:"none", color:"#3a2a1a", fontSize:18, cursor:"pointer", padding:"4px 8px 4px 0", fontFamily:"'Jost',sans-serif" },
  stopBtn:     { background:"transparent", border:"1px solid #1e1810", color:"#3a2a1a", padding:"11px 28px", fontSize:10, letterSpacing:2, cursor:"pointer", fontFamily:"'Jost',sans-serif" },

  // Type
  label:       { fontSize:10, letterSpacing:4, color:"#c9a96e", marginBottom:2 },
  h2:          { fontFamily:"'Cormorant Garamond',serif", fontSize:28, fontWeight:300, lineHeight:1.2, color:"#e8ddd0" },

  // Check-in
  moodRow:     { display:"flex", gap:8, width:"100%" },
  moodBtn:     { display:"flex", flexDirection:"column", alignItems:"center", padding:"12px 4px", border:"1px solid", background:"transparent", color:"#e8ddd0", cursor:"pointer", transition:"all .2s ease", flex:1, fontFamily:"'Jost',sans-serif" },
  pillarGrid:  { display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, width:"100%" },
  pillarBtn:   { display:"flex", flexDirection:"column", alignItems:"center", padding:"14px 6px", border:"1px solid", background:"transparent", color:"#e8ddd0", cursor:"pointer", transition:"all .2s ease", fontFamily:"'Jost',sans-serif", letterSpacing:1 },
  textarea:    { width:"100%", background:"#0e0c08", border:"1px solid #1a1208", color:"#e8ddd0", padding:"12px 14px", fontFamily:"'Jost',sans-serif", fontSize:13, resize:"none", lineHeight:1.65 },

  // Chat
  chatScreen:  { width:"100%", maxWidth:480, height:"100vh", display:"flex", flexDirection:"column", background:"#0b0906" },
  chatHead:    { display:"flex", alignItems:"center", justifyContent:"space-between", padding:"18px 20px 14px", borderBottom:"1px solid #181208" },
  chatTitle:   { fontFamily:"'Cormorant Garamond',serif", fontSize:20, letterSpacing:8, color:"#e8ddd0" },
  chatSub:     { fontSize:9, letterSpacing:3, color:"#3a2a1a", marginTop:2 },
  live:        { width:7, height:7, borderRadius:"50%", background:"#c9a96e", animation:"pulse 2s infinite" },
  feed:        { flex:1, overflowY:"auto", padding:"20px 18px", display:"flex", flexDirection:"column", gap:12 },
  bubble:      { border:"1px solid", padding:"14px 16px" },
  sageTag:     { fontSize:9, letterSpacing:3, color:"#c9a96e66", marginBottom:7 },
  bubbleTxt:   { fontSize:13, lineHeight:1.8, color:"#b8a890", fontWeight:300 },
  dot:         { width:5, height:5, borderRadius:"50%", background:"#c9a96e", display:"inline-block", animation:"pulse 1.2s infinite" },
  inputRow:    { display:"flex", gap:8, padding:"14px 18px", borderTop:"1px solid #181208", alignItems:"flex-end" },
  chatInput:   { flex:1, background:"#0e0c08", border:"1px solid #181208", color:"#e8ddd0", padding:"11px 14px", fontFamily:"'Jost',sans-serif", fontSize:13, resize:"none", lineHeight:1.6 },
  sendBtn:     { background:"#c9a96e", border:"none", color:"#0b0906", width:42, height:42, fontSize:17, cursor:"pointer", transition:"all .2s ease", fontWeight:600, flexShrink:0 },

  // Breathwork
  bwCard:      { background:"transparent", border:"1px solid #181208", color:"#e8ddd0", padding:"18px", cursor:"pointer", display:"flex", flexDirection:"column", gap:10, width:"100%", fontFamily:"'Jost',sans-serif", transition:"all .2s ease" },
  bwName:      { fontFamily:"'Cormorant Garamond',serif", fontSize:22, fontWeight:300, color:"#e8ddd0" },
  bwSub:       { fontSize:9, letterSpacing:3, color:"#c9a96e", marginTop:2 },
  bwDesc:      { fontSize:12, color:"#5a4a3a", lineHeight:1.65 },
  badge:       { fontSize:9, letterSpacing:2, color:"#3a2a1a", border:"1px solid #181208", padding:"4px 8px", alignSelf:"flex-start" },
  pill:        { fontSize:9, border:"1px solid", padding:"3px 8px", letterSpacing:1 },
  bwQuote:     { fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", fontSize:17, color:"#c9a96e88", lineHeight:1.75, maxWidth:300, textAlign:"center", alignSelf:"center" },
  phaseList:   { display:"flex", flexDirection:"column", gap:12, width:"100%", background:"#0e0c08", padding:"18px 20px", border:"1px solid #181208" },
  orbArea:     { display:"flex", alignItems:"center", justifyContent:"center", height:240, width:"100%" },
  orbOuter:    { width:175, height:175, borderRadius:"50%", border:"2px solid", display:"flex", alignItems:"center", justifyContent:"center" },
  orbInner:    { width:135, height:135, borderRadius:"50%", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:4 },
  countdown:   { fontFamily:"'Cormorant Garamond',serif", fontSize:54, fontWeight:300, color:"#e8ddd0", lineHeight:1 },
  progTrack:   { width:"100%", height:1, background:"#181208" },
  progFill:    { height:"100%" },

  // Habits
  habitSummary:{ display:"flex", alignItems:"center", gap:20, width:"100%", background:"#0e0c08", border:"1px solid #181208", padding:"18px 20px" },
  habitRow:    { display:"flex", alignItems:"center", gap:14, padding:"14px 16px", border:"1px solid", background:"transparent", cursor:"pointer", transition:"all .15s ease", width:"100%", fontFamily:"'Jost',sans-serif" },
  celebrate:   { width:"100%", textAlign:"center", padding:"14px", border:"1px solid #2a1a0a", color:"#c9a96e88", fontSize:11, letterSpacing:2, fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic" },

  // History
  monthLabel:  { fontSize:9, letterSpacing:4, color:"#2a1a0a", marginBottom:8, marginTop:4 },
  histCard:    { border:"1px solid", width:"100%", transition:"border-color .2s" },
  histBtn:     { display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 16px", background:"transparent", border:"none", cursor:"pointer", width:"100%", fontFamily:"'Jost',sans-serif", color:"#e8ddd0" },

  // Nav
  nav:         { position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:480, background:"#090705", borderTop:"1px solid #141008", display:"flex", justifyContent:"space-around", padding:"10px 0 20px", zIndex:100 },
  navBtn:      { background:"transparent", border:"none", display:"flex", flexDirection:"column", alignItems:"center", cursor:"pointer", fontFamily:"'Jost',sans-serif", transition:"color .2s ease", padding:"4px 20px" },
};
