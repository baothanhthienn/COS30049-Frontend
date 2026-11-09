import './AboutPage.css'

const FEATURES = [
  {
    name: 'Realtime Detection',
    desc: 'Classifies prompts in under 500 ms using a two-stage ML pipeline.',
  },
  {
    name: 'Span Attribution',
    desc: 'Highlights the exact tokens that triggered each detection decision.',
  },
  {
    name: 'Session Trend',
    desc: 'Tracks block rate and attack-family distribution across your session.',
  },
  {
    name: 'Privacy First',
    desc: 'No prompt text is stored after classification. Only metadata is kept.',
  },
]

const FAMILIES = [
  {
    name: 'Instruction Override',
    tag: 'instruction_override',
    desc: 'Attempts to replace or ignore the original system prompt.',
  },
  {
    name: 'Role Play Jailbreak',
    tag: 'role_play_jailbreak',
    desc: 'Uses fictional personas (DAN, etc.) to bypass model restrictions.',
  },
  {
    name: 'Delimiter Escape',
    tag: 'delimiter_escape',
    desc: 'Injects structural tokens (</system>, ###) to break prompt boundaries.',
  },
  {
    name: 'Encoding Obfuscation',
    tag: 'encoding_obfuscation',
    desc: 'Hides malicious content via Base64, leetspeak, or unicode substitution.',
  },
  {
    name: 'Context Exfiltration',
    tag: 'context_exfiltration',
    desc: 'Attempts to extract the system prompt or private context window.',
  },
  {
    name: 'Indirect Injection',
    tag: 'indirect_injection',
    desc: 'Embeds injection payloads inside documents or external data sources.',
  },
]

const STACK = [
  'React 19', 'TypeScript', 'Vite', 'Zustand',
  'FastAPI', 'SQLAlchemy', 'Railway', 'Vercel',
]

export default function AboutPage() {
  return (
    <div className="about-page">
    <div className="about">

      <div className="about__hero">
        <div className="about__badge">
          <span className="about__badge-dot" aria-hidden="true" />
          v1.0 · COS30049 Assignment 3
        </div>
        <h1 className="about__title">Prompt Injection Detector</h1>
        <p className="about__subtitle">
          A research tool for detecting and analysing prompt injection attacks in
          large language model pipelines. Submit any text an LLM would receive
          the classifier labels it, identifies the attack family, and highlights the
          exact spans that triggered the decision.
        </p>
      </div>

      <div className="about__divider" />

      <div className="about__section">
        <p className="about__section-title">Capabilities</p>
        <div className="about__features">
          {FEATURES.map((f) => (
            <div key={f.name} className="about__feature-card">
              <p className="about__feature-name">{f.name}</p>
              <p className="about__feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="about__divider" />

      <div className="about__section">
        <p className="about__section-title">Attack Families</p>
        <div className="about__families">
          {FAMILIES.map((fam) => (
            <div key={fam.tag} className="about__family-row">
              <div>
                <p className="about__family-name">{fam.name}</p>
                <p className="about__family-desc">{fam.desc}</p>
              </div>
              <span className="about__family-tag">{fam.tag}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="about__divider" />

      <div className="about__section">
        <p className="about__section-title">Technology Stack</p>
        <div className="about__stack">
          {STACK.map((t) => (
            <span key={t} className="about__stack-chip">{t}</span>
          ))}
        </div>
      </div>

      <p className="about__footer-note">
        Built for academic research. Not intended for production security use without independent evaluation.
      </p>

    </div>
    </div>
  )
}
