/* ============================================================
   DK ASSISTANT — a retrieval bot that answers questions about
   Divyanshu Kumar strictly from the portfolio data (CV facts).
   Used directly as an offline fallback and to seed the LLM route.
   ============================================================ */

import { PROJECTS, TECH, techById, CHAPTERS, EMAIL, PHONE, projById } from './data'

export type BotReply = { text: string; chips?: string[] }

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 .+#/-]/g, ' ').replace(/\s+/g, ' ').trim()

const PROJECT_LIST = PROJECTS.map((p, i) => `P-${String(i + 1).padStart(2, '0')} ${p.t} — ${p.d}`).join('\n')

export const BOT_FACTS = `NAME: Divyanshu Kumar — Full Stack Developer, Lucknow, India.
CURRENT JOB: RMS Technosolution, Lucknow · August 2024 – present. ASP.NET, C#, MVC web apps, SQL Server CRUD + APIs, performance work, cross-functional teamwork.
EDUCATION: B.Tech at Bengal College of Engineering and Technology, Durgapur (CGPA 8.0, discipline/dates being verified). Intermediate PCM at Chauhan Public School, Bhagalpur (80%, 2019–2021). Matriculation at DAV Public School, Bhagalpur (85%, 2018–2019). Certification: Software Developer Trainee, ARDENT, September 2024. Core skill: Data Structures and Algorithms.
CONTACT: ${EMAIL} · ${PHONE}.
PROJECTS (${PROJECTS.length}):\n${PROJECT_LIST}
FLAGSHIP: AttendanceMaster (in development) — reads scanned exam attendance sheets: finds the table, crops each handwritten Copy No cell, reads it with a CRNN (CNN + BiLSTM + CTC, PyTorch), falls back to a Tesseract-based reader, verifies rolls against the master list, humans re-check, verified entries fine-tune the model. Reported handwriting accuracy is about 20–40% but the metric/test set are not yet defined, so it is not presented as a benchmark.
STACK (${TECH.length} technologies): grouped by evidence — listed in CV, used in a project, or exploring. C, C#, Java, HTML, CSS, Bootstrap, JavaScript, MySQL, ASP.NET MVC are in the CV; ASP.NET Core, Web Forms, SQL Server, React, Node.js, Express, Expo, SQLite, WPF, WinForms, MinIO, IronBarcode, ZXing, Python, OpenCV, OCR, PyTorch, Tesseract, Flask are used in projects; image preprocessing and CRNN are being explored.
JOURNEY (7 stops): KM 0 DAV Public School (85%) → KM 1 Chauhan Public School (80%) → KM 2 Bengal CET (CGPA 8.0) → KM 3 Full Stack Developer at RMS Technosolution → KM 4 university/ERP/data-processing app portfolio → KM 5 AttendanceMaster computer vision → KM 6 current direction: CRNN training + evaluation discipline.
THIS WEBSITE: a scroll portfolio with a drivable top-down "Atlas" map (drive mode: car, six districts, 7 journey stops, 20 exhibit pads, 31 technology pads, data shards, boost pads, six expeditions, day/night map themes), a walk-through 3D "Museum" gallery of all 20 projects in 8 halls with exhibit labels and dossiers, a stack network graph and the AttendanceMaster Cell Lab.`

/* ---------- helpers ---------- */

function findProjects(q: string): { p: (typeof PROJECTS)[number]; hit: boolean }[] {
  return PROJECTS.map(p => ({ p, hit: norm(p.t).includes(q) || q.split(' ').some(w => w.length > 2 && norm(p.t).includes(w)) }))
}

function projectBlock(p: (typeof PROJECTS)[number]): string {
  const tech = p.tech.map(t => techById.get(t)?.name ?? t).join(', ')
  let s = `${p.t} — ${p.d}\nStack: ${tech} · Hall: ${p.c}`
  if (p.feat?.length) s += `\nFeatures: ${p.feat.join(' · ')}`
  if (p.limit?.length) s += `\nLimits: ${p.limit.join(' ')}`
  if (p.ident) s += `\nNote: ${p.ident}`
  if (p.conf) s += `\nNote: ${p.conf}`
  return s
}

const RE = (words: string[]) => new RegExp('(' + words.join('|') + ')')

/* ---------- intent table ---------- */

type Intent = { test: RegExp; run: (q: string) => BotReply; chips?: string[] }

const INTENTS: Intent[] = [
  {
    test: /^(hi|hello|hey|yo|namaste|good (morning|afternoon|evening))\b/,
    run: () => ({
      text: `Hey! I am DK Assistant — I answer questions about Divyanshu Kumar from his CV and project data. Ask about his projects, stack, journey, AttendanceMaster, or how to reach him.`,
      chips: ['Tell me about him', 'Best project?', 'What is his stack?', 'How to contact?'],
    }),
  },
  {
    test: /(who (is|are|r)|about (him|you|divyanshu)|introduce|bio|profile|yourself)/,
    run: () => ({
      text: `Divyanshu Kumar is a full stack developer in Lucknow, India, working at RMS Technosolution since August 2024 on ASP.NET, C#, MVC, and SQL Server applications. He has shipped around 20 projects across university ERP, enterprise tools, desktop, web, mobile — and is teaching a CRNN model to read handwritten copy numbers for AttendanceMaster. B.Tech CGPA 8.0, strong in data structures and algorithms.`,
      chips: ['His journey', 'AttendanceMaster', 'What is his stack?', 'How to contact?'],
    }),
  },
  {
    test: /(contact|email|mail|phone|call|reach|hire|freelance|available|resume|cv\b)/,
    run: () => ({
      text: `Direct lines: email ${EMAIL} · phone ${PHONE}. He is based in Lucknow, India, currently full-time at RMS Technosolution (since Aug 2024). If you are hiring or building something where reading messy real-world documents matters, email is the fastest way.`,
      chips: ['Copy email', 'Tell me about him', 'Best project?'],
    }),
  },
  {
    test: /(education|college|school|study|degree|b ?tech|cgpa|gpa|matric|intermediate|certification|ardent)/,
    run: () => ({
      text: `Education: B.Tech at Bengal College of Engineering and Technology, Durgapur — CGPA 8.0 (discipline and dates are being verified). Intermediate PCM at Chauhan Public School, Bhagalpur — 80% (2019-2021). Matriculation at DAV Public School, Bhagalpur — 85% (2018-2019). Certified Software Developer Trainee (ARDENT, September 2024). Core skill: Data Structures and Algorithms.`,
      chips: ['His journey', 'What is his stack?', 'How to contact?'],
    }),
  },
  {
    test: /(journey|timeline|story|career|experience|work history|stops|km ?[0-6])/,
    run: () => ({
      text: `The 7-stop journey: KM 0 — DAV Public School, Bhagalpur (85%). KM 1 — Chauhan Public School, PCM (80%). KM 2 — Bengal CET, Durgapur (CGPA 8.0). KM 3 — Full Stack Developer at RMS Technosolution, Lucknow (Aug 2024-). KM 4 — university ERP and data-processing applications (LNMU, DDU, examiner allotment, e-library...). KM 5 — AttendanceMaster, computer vision. KM 6 — now: continuing CRNN training and building proper evaluation evidence.`,
      chips: ['AttendanceMaster', 'University projects', 'How to contact?'],
    }),
  },
  {
    test: /(attendance ?master|crnn|copy ?no|handwrit|ocr|sheet|vision|cv model)/,
    run: () => ({
      text: `AttendanceMaster is the flagship (in development): scans exam attendance sheets, finds the table, crops each handwritten Copy No cell. A CRNN (conv stack → 2× BiLSTM → CTC decode, PyTorch) reads first; a Tesseract-based engine handles uncertain rows; rolls are checked against the master list; operators verify and re-checkers audit; verified rows become new training data. Honest status: reported ~20-40% accuracy, but no held-out test set yet, so it is not a benchmark.`,
      chips: ['How does the CRNN work?', 'His journey', 'Best project?'],
    }),
  },
  {
    test: /(crnn.*(work|archit|layer)|archit|bilstm|ctc|model.*(work|layer|archit))/,
    run: () => ({
      text: `The CRNN reader: input is a 32px-high grayscale strip → Conv64 → Conv128 → Conv256×2 → Conv512×2 → collapse to one row (each 4 px of width = one time step) → 2 bidirectional LSTM layers (256 units each way) → per-column scores for digits 0-9 + blank → greedy CTC decoding collapses repeats and drops blanks, so no per-digit labelling is needed.`,
      chips: ['AttendanceMaster', 'What is his stack?', 'His journey'],
    }),
  },
  {
    test: /(all projects|every project|list.*project|project.*list|show.*project|portfolio|work\b.*project)/,
    run: () => ({
      text: `All ${PROJECTS.length} projects:\n` + PROJECT_LIST + `\nAsk me about any one by name.`,
      chips: ['AttendanceMaster', 'University projects', 'Best project?'],
    }),
  },
  {
    test: /(university|erp|result|lnmu|ddu|exam)/,
    run: () => ({
      text: `University work (ASP.NET Core MVC): Result Management for LNMU and for DDU, DDU ERP workflows, and a Result Search/Display Portal. Production university data and source code stay private, so those cards say what can honestly be said. Related: Examiner Allotment (Web Forms, online TR + bulk email) and the E-Library system.`,
      chips: ['E-Library', 'All projects', 'His journey'],
    }),
  },
  {
    test: /(stack|technolog|skills|skill|knows|tech\b|tools)/,
    run: () => ({
      text: `Stack, grouped by evidence (not self-rated scores): in CV — C, C#, Java, HTML, CSS, JavaScript, Bootstrap, MySQL, ASP.NET MVC. Used in projects — ASP.NET Core, Web Forms, SQL Server, React, Node.js, Express, Expo, SQLite, WPF, WinForms, MinIO, IronBarcode, ZXing, Python, OpenCV, OCR, PyTorch, Tesseract, Flask. Exploring — image preprocessing, CRNN. Ask "what did he build with React?" for the cross-map.`,
      chips: ['What did he build with React?', 'Best project?', 'Tell me about him'],
    }),
  },
  {
    test: /(best|favourite|favorite|proud|flagship|main|top|signature)/,
    run: () => ({
      text: `AttendanceMaster is the flagship — a real computer-vision pipeline (CRNN + Tesseract fallback + human review loop) built for reading handwritten copy numbers on exam attendance sheets. Beyond it, the university result-management systems (LNMU/DDU) are the most production-adjacent work.`,
      chips: ['AttendanceMaster', 'University projects', 'How does the CRNN work?'],
    }),
  },
  {
    test: /(drive|drive mode|game|map|atlas|grid|\bcar\b|world)/,
    run: () => ({
      text: `Drive mode is the Atlas: a top-down map you drive a car across (W A S D or arrow keys, Space to brake, Shift to boost, E to open what you park on, M for expeditions, Esc to exit). It has six districts — Core Nexus, the Journey Quarter with all 7 stops, the Museum District with 20 exhibit pads, the Stack Gardens with 31 technology pads, the Vision Lab (AttendanceMaster) and Contact Harbour — plus data shards, boost pads and six expeditions. The map follows the site theme: neon night or paper-atlas daylight. On phones there is an on-screen joystick.`,
      chips: ['How do expeditions work?', 'How to contact?'],
    }),
  },
  {
    test: /(mission|expedition|xp)/,
    run: () => ({
      text: `There are six expeditions: Grand Tour (enter all six districts), Data Hunter (collect shards), Full Throttle (boost pads), Curator (visit exhibit pads), Polyglot (visit technology pads) and Storyteller (drive all seven Journey stops). Each pays XP; press M in drive mode to see progress.`,
      chips: ['Tell me about drive mode', 'All projects'],
    }),
  },
  {
    test: /(museum|lab\b|gallery|exhibit)/,
    run: () => ({
      text: `The Museum is a walk-through 3D gallery of all 20 projects, laid out as 8 halls by category (Vision, University ERP, Enterprise, Web, Desktop, Mobile, Dev Tools, Workflow). Each exhibit hangs in a frame with a museum-style label; click one to open its dossier with the full record: description, features, honest limits, stack and related exhibits. Open it from the Projects section, the top bar, or the command palette.`,
      chips: ['All projects', 'AttendanceMaster'],
    }),
  },
  {
    test: /(where|location|based|city|lives)/,
    run: () => ({ text: `He is based in Lucknow, India (origin Bhagalpur, Bihar — that is where the school stops of the journey are).`, chips: ['His journey', 'How to contact?'] }),
  },
  {
    test: /(site|website|navigate|how.*use|help|what can)/,
    run: () => ({
      text: `This site: scroll the Journey, browse Projects, walk the Museum for dossiers, explore the Stack graph (Ctrl K opens the command palette and travels anywhere), read the AttendanceMaster case study, or press Drive to take the car out on the Atlas map. The day/night toggle is in the top bar. I sit in the bottom-right corner — ask me anything about Divyanshu.`,
      chips: ['Tell me about him', 'All projects', 'How to contact?'],
    }),
  },
]

/* ---------- main entry ---------- */

export function answerLocally(raw: string): BotReply {
  const q = norm(raw)
  if (!q) return { text: 'Ask me anything about Divyanshu — projects, stack, journey, education, contact.', chips: ['Tell me about him', 'All projects', 'What is his stack?'] }

  for (const it of INTENTS) if (it.test.test(q)) return it.run(q)

  /* exact project by name */
  const byName = findProjects(q).filter(x => x.hit)
  if (byName.length === 1) return { text: projectBlock(byName[0].p), chips: ['All projects', 'What is his stack?'] }
  if (byName.length > 1) return { text: `A few projects match:\n` + byName.slice(0, 4).map(x => '· ' + x.p.t + ' — ' + x.p.d).join('\n'), chips: byName.slice(0, 3).map(x => x.p.t) }

  /* exact tech */
  const tech = TECH.find(t => q.includes(norm(t.name)) || norm(t.name).split(' ').some(w => w.length > 2 && q.includes(w)))
  if (tech) {
    const used = PROJECTS.filter(p => p.tech.includes(tech.id))
    const ev = tech.evidence.map(e => e === 'cv' ? 'listed in CV' : e === 'project' ? 'used in projects' : 'exploring').join(' · ')
    return {
      text: `${tech.name} — ${tech.summary} Evidence: ${ev}.${used.length ? `\nProjects using it: ${used.map(p => p.t).join(', ')}.` : '\nNo shipped project uses it yet.'}`,
      chips: ['What is his stack?', 'All projects'],
    }
  }

  /* project chip follow-ups ("AttendanceMaster" already caught above) */
  const chipHit = [...projById.keys()].find(id => q.includes(norm(projById.get(id)!.t)))
  if (chipHit) return { text: projectBlock(projById.get(chipHit)!), chips: ['All projects'] }

  return {
    text: `I did not find that in the portfolio data. I can answer about: his profile, the ${PROJECTS.length} projects, the ${TECH.length}-technology stack, the 7-stop journey, education, AttendanceMaster and the CRNN, drive mode + expeditions, or contact details.`,
    chips: ['Tell me about him', 'All projects', 'What is his stack?', 'How to contact?'],
  }
}
