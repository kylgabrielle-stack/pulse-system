import { useState, useMemo, useEffect } from "react";
import {
  LogIn, User, Lock, ChevronDown, Calendar, MapPin,
  FileText, Printer, Download, Edit2, Trash2, Plus,
  Search, LogOut, Eye, EyeOff, X, CheckCircle,
  AlertTriangle, Shield, ChevronRight, LayoutDashboard,
  ClipboardList, Users, HeartPulse, ChevronLeft, LayoutGrid,
} from "lucide-react";

// ─── Geography ────────────────────────────────────────────────────────────────

const MUNICIPALITY_DATA: Record<string, { district: string; barangays: string[] }> = {
  "Cavite City":    { district: "I",   barangays: ["Barangay 1 (Pad)", "Barangay 2 (Caridad)", "Barangay 3 (Dalahican)", "Barangay 4 (Palico)", "Barangay 5 (Bankerohan)"] },
  "Kawit":          { district: "I",   barangays: ["Balsahan", "Binakayan", "Congbalay-Leat", "Gahak", "Kaingen", "Magdalo", "Magdiwang", "Marulas", "Pulvorista", "Samala-Marquez", "San Sebastian", "Santa Isabel", "Toclong", "Wakas I", "Wakas II"] },
  "Noveleta":       { district: "I",   barangays: ["Magdiwang", "Poblacion", "San Antonio I", "San Antonio II", "San Jose I", "San Jose II", "Santiago I", "Santiago II", "Santiago III"] },
  "Rosario":        { district: "I",   barangays: ["Bagbag I", "Bagbag II", "Kanluran", "Ligtong I", "Ligtong II", "Ligtong III", "Ligtong IV", "Saimsim", "Samala", "Sapa I", "Sapa II", "Sapa III", "Tejero", "Wawa"] },
  "Bacoor":         { district: "II",  barangays: ["Alima", "Aniban I", "Aniban II", "Aniban III", "Banalo", "Bayanan", "Campo Santo", "Digman", "Habay I", "Habay II", "Kaingin", "Molino I", "Molino II", "Molino III", "Molino IV", "Molino V", "Niog I", "Niog II", "Niog III", "Panapaan I", "Panapaan II", "Panapaan III", "Queens Row Central", "Real I", "Real II", "Salinas I", "Salinas II", "Talaba I", "Talaba II", "Talaba III", "Talaba IV", "Zapote I", "Zapote II", "Zapote III"] },
  "Imus":           { district: "II",  barangays: ["Alapan I-A", "Alapan I-B", "Alapan II-A", "Anabu I-A", "Anabu I-B", "Anabu II-A", "Anabu II-B", "Bagong Silang", "Buhay na Tubig", "Carsadang Bago I", "Carsadang Bago II", "Magdalo", "Maharlika", "Malagasang I-A", "Malagasang II-A", "Palico I", "Palico II", "Pasong Buaya I", "Pasong Buaya II", "Tanzang Luma I", "Tanzang Luma II", "Tanzang Luma III", "Toclong I-A", "Toclong I-B", "Toclong II-A"] },
  "Carmona":        { district: "III", barangays: ["Bancal", "Cabilang Baybay", "Lantic", "Mabuhay", "Maduya", "Milagrosa", "Poblacion"] },
  "Dasmariñas":    { district: "III", barangays: ["Burol I", "Burol II", "Burol III", "Fatima I", "Fatima II", "Fatima III", "Langkaan I", "Langkaan II", "Luzviminda I", "Luzviminda II", "Paliparan I", "Paliparan II", "Paliparan III", "Sabang", "Salawag", "Salitran I", "Salitran II", "Salitran III", "Salitran IV", "Sampaloc I", "Sampaloc II", "San Agustin I", "San Agustin II", "San Agustin III", "San Jose"] },
  "General Trias":  { district: "III", barangays: ["Alingaro", "Arnaldo", "Bacao I", "Bacao II", "Bagumbayan", "Biclatan", "Buenavista I", "Buenavista II", "Buenavista III", "Javalera", "Manggahan", "Navarro", "Pasong Camachile I", "Pasong Camachile II", "Pasong Kawayan I", "Pasong Kawayan II", "Poblacion I", "Poblacion II", "San Francisco", "San Gabriel", "San Juan I", "San Juan II", "Santa Clara", "Santiago", "Tejero"] },
  "Naic":           { district: "IV",  barangays: ["Bucana I", "Bucana II", "Humbac", "Labac", "Mabolo I", "Mabolo II", "Mabolo III", "Makina", "Palangue 1", "Palangue 2 & 3", "Sabang", "San Roque", "Santa Cruz I", "Santa Cruz II", "Timalan Concepcion", "Timalan San Francisco"] },
  "Tagaytay":       { district: "IV",  barangays: ["Asisan", "Bagong Tubig", "Calabuso", "Guinhawa North", "Guinhawa South", "Iruhin Central", "Iruhin East", "Iruhin West", "Kaybagal Central", "Kaybagal East", "Kaybagal South", "Kaybagal West", "Mag-asawang Ilat", "Maharlika East", "Maharlika West", "Maitim 2nd Central", "Maitim 2nd East", "Maitim 2nd West", "Neogan", "Sambong", "San Jose", "Sungay East", "Sungay West", "Tolentino East", "Tolentino West", "Zambal"] },
  "Tanza":          { district: "IV",  barangays: ["Amaya I", "Amaya II", "Amaya III", "Amaya IV", "Amaya V", "Amaya VI", "Amaya VII", "Bagtas", "Biga", "Bunga", "Calibuyo", "Capipisa", "Daang Amaya I", "Daang Amaya II", "Daang Amaya III", "Halayhay", "Julugan I", "Julugan II", "Julugan III", "Julugan IV", "Mulawin", "Paradahan I", "Paradahan II", "Punta I", "Punta II", "Sahud Ulan", "Santol", "Tanauan", "Tres Cruses"] },
  "Trece Martires": { district: "IV",  barangays: ["Aguado", "Cabezas", "Cabuco", "De Ocampo", "Gregorio", "Inocencio", "Lallana", "Luciano", "Osorio", "Palico", "Recodo", "San Agustin", "Santiago", "Tapia"] },
};

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

// ─── Report-type configuration ────────────────────────────────────────────────

type Category = "RPFP" | "AHD" | "GAD";

interface AgeBracketCfg { label: string; field: "ageBracket1" | "ageBracket2" | "ageBracket3" }
interface AccentCfg {
  chipBg: string; chipText: string;
  badgeBg: string; badgeText: string; badgeBorder: string;
  iconColor: string; headerBg: string;
}

interface FormConfig {
  category: Category;
  pageLabel: string;
  sessionTypeLabel: string;
  sessionTypeOptions: string[];
  sessionTypePlaceholder?: string;
  activityKeys: string[];
  activityLabels: Record<string, string>;
  ageBrackets: AgeBracketCfg[];
  accent: AccentCfg;
  codePrefix: string;
}

const CONFIGS: Record<Category, FormConfig> = {
  RPFP: {
    category: "RPFP",
    pageLabel: "RPFP · Encode Documentation Report",
    sessionTypeLabel: "Seminar Conducted",
    sessionTypeOptions: ["Profiling", "RPFP Seminar"],
    activityKeys: ["registration","openingRemarks","seminarProper","counseling","closingRemarks","evaluation","referrals"],
    activityLabels: {
      registration:  "Registration",
      openingRemarks:"Opening Remarks",
      seminarProper: "Seminar Proper",
      counseling:    "One-on-One Counseling / Interview",
      closingRemarks:"Closing Remarks",
      evaluation:    "Evaluation",
      referrals:     "Referrals",
    },
    ageBrackets: [
      { label:"10–14 yrs old", field:"ageBracket1" },
      { label:"15–19 yrs old", field:"ageBracket2" },
      { label:"20 & above",    field:"ageBracket3" },
    ],
    accent: {
      chipBg:"bg-teal-100",   chipText:"text-teal-700",
      badgeBg:"bg-teal-50",   badgeText:"text-teal-700", badgeBorder:"border-teal-200",
      iconColor:"text-teal-600", headerBg:"bg-teal-600",
    },
    codePrefix: "RPFP",
  },
  AHD: {
    category: "AHD",
    pageLabel: "AHD · Encode Documentation Report",
    sessionTypeLabel: "Seminar Conducted",
    sessionTypeOptions: ["AHD SF", "APPS", "PITT"],
    sessionTypePlaceholder: "Select seminar conducted…",
    activityKeys: ["registration","openingRemarks","healthTalk","openForum","peerCounseling","closingRemarks","evaluation","referrals"],
    activityLabels: {
      registration:  "Registration",
      openingRemarks:"Opening Remarks",
      healthTalk:    "Health Talk",
      openForum:     "Open Forum / Q&A",
      peerCounseling:"Peer Counseling",
      closingRemarks:"Closing Remarks",
      evaluation:    "Evaluation",
      referrals:     "Referrals",
    },
    ageBrackets: [
      { label:"10–14 yrs old", field:"ageBracket1" },
      { label:"15–19 yrs old", field:"ageBracket2" },
      { label:"20 & above",    field:"ageBracket3" },
    ],
    accent: {
      chipBg:"bg-orange-100", chipText:"text-orange-700",
      badgeBg:"bg-orange-50", badgeText:"text-orange-700", badgeBorder:"border-orange-200",
      iconColor:"text-orange-600", headerBg:"bg-orange-500",
    },
    codePrefix: "AHD",
  },
  GAD: {
    category: "GAD",
    pageLabel: "GAD · Encode Documentation Report",
    sessionTypeLabel: "Seminar Conducted",
    sessionTypeOptions: ["Gender Sensitivity Training","VAWC Orientation","GAD Focal Point Meeting","Women's Month Activity","Other"],
    activityKeys: ["registration","openingRemarks","sessionProper","workshop","openForum","closingRemarks","evaluation","referrals"],
    activityLabels: {
      registration:  "Registration",
      openingRemarks:"Opening Remarks",
      sessionProper: "Session Proper",
      workshop:      "Workshop / Group Activity",
      openForum:     "Open Forum",
      closingRemarks:"Closing Remarks",
      evaluation:    "Evaluation",
      referrals:     "Referrals",
    },
    ageBrackets: [
      { label:"18–29 yrs old", field:"ageBracket1" },
      { label:"30–49 yrs old", field:"ageBracket2" },
      { label:"50 & above",    field:"ageBracket3" },
    ],
    accent: {
      chipBg:"bg-violet-100", chipText:"text-violet-700",
      badgeBg:"bg-violet-50", badgeText:"text-violet-700", badgeBorder:"border-violet-200",
      iconColor:"text-violet-600", headerBg:"bg-violet-600",
    },
    codePrefix: "GAD",
  },
};

// ─── Matrix config ────────────────────────────────────────────────────────────

const MATRIX_CFG: Record<Category, {
  typeColumns: string[];
  typeLabels:  string[];
  ageBrackets: string[];
}> = {
  RPFP: {
    typeColumns: ["Profiling", "RPFP Seminar"],
    typeLabels:  ["Profiling", "RPFP Sem."],
    ageBrackets: ["10–14", "15–19", "20 & above"],
  },
  AHD: {
    typeColumns: ["AHD SF", "APPS", "PITT"],
    typeLabels:  ["AHD SF", "APPS", "PITT"],
    ageBrackets: ["10–14", "15–19", "20 & above"],
  },
  GAD: {
    typeColumns: ["Gender Sensitivity Training", "VAWC Orientation", "GAD Focal Point Meeting", "Women's Month Activity", "Other"],
    typeLabels:  ["GST", "VAWC", "Focal Pt.", "WMA", "Other"],
    ageBrackets: ["18–29", "30–49", "50 & above"],
  },
};

// ─── Data types ───────────────────────────────────────────────────────────────

interface Speaker { name: string; topic: string; rating: string }

interface DocRecord {
  id: number;
  code: string;
  category: Category;
  municipality: string;
  barangay: string;
  district: string;
  venue: string;
  sessionType: string;
  dateConduct: string;
  reportMonth: string;
  reportYear: string;
  targetParticipants: string;
  actualParticipants: string;
  male: number;
  female: number;
  ageBracket1: number;
  ageBracket2: number;
  ageBracket3: number;
  numSpeakers: string;
  speakers: Speaker[];
  activities: Record<string, boolean>;
  personsResponsible: Record<string, string>;
  remarks: string;
  documentedBy: string;
  dateDocumented: string;
  reviewedBy: string;
  approvedBy: string;
  status: "Pending" | "Reviewed" | "Approved";
}

const BLANK_SPEAKERS: Speaker[] = Array.from({ length: 8 }, () => ({ name: "", topic: "", rating: "" }));

function blankActivities(cfg: FormConfig) {
  return Object.fromEntries(cfg.activityKeys.map(k => [k, false]));
}
function blankPersons(cfg: FormConfig) {
  return Object.fromEntries(cfg.activityKeys.map(k => [k, ""]));
}

const INITIAL_RECORDS: DocRecord[] = [
  {
    id: 1, code: "RPFP-2025-001", category: "RPFP",
    municipality: "Tanza", barangay: "Daang Amaya I", district: "IV",
    venue: "Tanza", sessionType: "Profiling",
    dateConduct: "2025-03-24", reportMonth: "March", reportYear: "2025",
    targetParticipants: "N/A", actualParticipants: "65",
    male: 0, female: 65, ageBracket1: 0, ageBracket2: 4, ageBracket3: 61,
    numSpeakers: "N/A",
    speakers: Array.from({ length: 8 }, () => ({ name: "N/A", topic: "N/A", rating: "N/A" })),
    activities: { registration: false, openingRemarks: false, seminarProper: false, counseling: true, closingRemarks: false, evaluation: false, referrals: true },
    personsResponsible: { registration: "", openingRemarks: "", seminarProper: "", counseling: "Charmina N. Limbo, Mariebelle Joy Villaloros", closingRemarks: "", evaluation: "", referrals: "Mariebelle Joy T. Villaloros" },
    remarks: "65 participants are on their reproductive stage. Referrals: 4 Implant.",
    documentedBy: "Ariel G. Jarin", dateDocumented: "2025-03-26",
    reviewedBy: "Analiza N. Gumapac", approvedBy: "Eloisa L. Comia",
    status: "Approved",
  },
  {
    id: 2, code: "AHD-2025-001", category: "AHD",
    municipality: "Bacoor", barangay: "Molino III", district: "II",
    venue: "Barangay Hall, Molino III", sessionType: "Adolescent Health Education",
    dateConduct: "2025-03-05", reportMonth: "March", reportYear: "2025",
    targetParticipants: "40", actualParticipants: "38",
    male: 14, female: 24, ageBracket1: 10, ageBracket2: 22, ageBracket3: 6,
    numSpeakers: "2",
    speakers: [
      { name: "Dr. Maria Santos", topic: "Reproductive Health Awareness", rating: "5" },
      { name: "Nurse Ana Reyes",  topic: "Youth and Family Planning",      rating: "4" },
      ...Array.from({ length: 6 }, () => ({ name: "", topic: "", rating: "" })),
    ],
    activities: { registration: true, openingRemarks: true, healthTalk: true, openForum: true, peerCounseling: false, closingRemarks: true, evaluation: true, referrals: false },
    personsResponsible: { registration: "Paul Mark Feranil", openingRemarks: "Sherrilyn Yu", healthTalk: "Dr. Maria Santos", openForum: "Nurse Ana Reyes", peerCounseling: "", closingRemarks: "Paul Mark Feranil", evaluation: "Sherrilyn Yu", referrals: "" },
    remarks: "Participants actively engaged during open forum. Request for follow-up session noted.",
    documentedBy: "Paul Mark Feranil", dateDocumented: "2025-03-06",
    reviewedBy: "Analiza N. Gumapac", approvedBy: "Eloisa L. Comia",
    status: "Reviewed",
  },
  {
    id: 3, code: "GAD-2025-001", category: "GAD",
    municipality: "Dasmariñas", barangay: "Salawag", district: "III",
    venue: "Municipal Social Hall", sessionType: "Gender Sensitivity Training",
    dateConduct: "2025-03-12", reportMonth: "March", reportYear: "2025",
    targetParticipants: "50", actualParticipants: "47",
    male: 18, female: 29, ageBracket1: 12, ageBracket2: 25, ageBracket3: 10,
    numSpeakers: "1",
    speakers: [
      { name: "Atty. Liza Ramos", topic: "Understanding Gender Equality & VAWC", rating: "5" },
      ...Array.from({ length: 7 }, () => ({ name: "", topic: "", rating: "" })),
    ],
    activities: { registration: true, openingRemarks: true, sessionProper: true, workshop: true, openForum: true, closingRemarks: true, evaluation: true, referrals: false },
    personsResponsible: { registration: "Nicole Rafols", openingRemarks: "Arlene Salazar", sessionProper: "Atty. Liza Ramos", workshop: "Nicole Rafols", openForum: "Arlene Salazar", closingRemarks: "Nicole Rafols", evaluation: "Ariel Jarin", referrals: "" },
    remarks: "Workshop outputs to be compiled for the annual GAD report.",
    documentedBy: "Nicole Rafols", dateDocumented: "2025-03-13",
    reviewedBy: "Analiza N. Gumapac", approvedBy: "Eloisa L. Comia",
    status: "Pending",
  },
];

// ─── Shared UI primitives ─────────────────────────────────────────────────────


function CategoryBadge({ category }: { category: Category }) {
  const cfg = CONFIGS[category].accent;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border tracking-widest ${cfg.badgeBg} ${cfg.badgeText} ${cfg.badgeBorder}`}
      style={{ fontFamily: "'JetBrains Mono', monospace" }}>
      {category}
    </span>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground text-xs font-medium px-2 py-1 -ml-2 rounded-md hover:bg-accent transition-all print:hidden"
    >
      <ChevronLeft size={13} strokeWidth={2.5} />
      Back
    </button>
  );
}

function AppHeader({ user, onLogout, crumb }: {
  user: string; onLogout: () => void; crumb?: string;
}) {
  return (
    <header className="bg-primary text-primary-foreground h-14 flex items-center px-5 gap-3 shrink-0 print:hidden">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 bg-white/20 rounded flex items-center justify-center font-bold text-sm text-white">P</div>
        <span className="font-bold text-sm tracking-widest text-white" style={{ fontFamily: "'Barlow', sans-serif" }}>PULSE</span>
        <span className="text-white/40 text-[10px] tracking-widest hidden sm:inline uppercase">System</span>
      </div>
      {crumb && (
        <>
          <div className="h-4 w-px bg-white/20 mx-1" />
          <span className="text-white/60 text-xs hidden sm:block truncate max-w-xs">{crumb}</span>
        </>
      )}
      <div className="ml-auto flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-1.5 text-white/60 text-xs">
          <User size={12} /><span>{user}</span>
        </div>
        <button onClick={onLogout}
          className="flex items-center gap-1.5 text-white/60 hover:text-white text-xs transition-colors">
          <LogOut size={13} />
          <span className="hidden sm:block">Sign out</span>
        </button>
      </div>
    </header>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground border-b border-border pb-2 mb-4"
      style={{ fontFamily: "'Barlow', sans-serif" }}>
      {children}
    </h2>
  );
}

function FormInput({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input {...props}
      className={`w-full px-3 py-2.5 bg-input-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/50 transition-all ${className}`} />
  );
}

function FormSelect({ className = "", children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select {...props}
        className={`w-full appearance-none px-3 py-2.5 pr-8 bg-input-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/50 transition-all ${className}`}>
        {children}
      </select>
      <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
    </div>
  );
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────

function LoginView({ onLogin }: { onLogin: (name: string, role: string) => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);

  const USERS: Record<string, { name: string; role: string; pw: string }> = {
    "admin":    { name: "Ariel G. Jarin",    role: "MIS / Data Banking",      pw: "pulse2025" },
    "encoder":  { name: "Nicole Rafols",     role: "MIS / Data Banking",      pw: "oppo2025"  },
    "reviewer": { name: "Analiza N. Gumapac",role: "Technical Services Head", pw: "review2025"},
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const u = USERS[username.trim()];
    setLoading(true);
    setTimeout(() => {
      if (u && u.pw === password) { onLogin(u.name, u.role); }
      else { setError("Invalid credentials. Access is restricted to authorized government personnel."); setLoading(false); }
    }, 650);
  };

  return (
    <div className="min-h-screen flex bg-background" style={{ fontFamily: "'Source Sans 3', sans-serif" }}>
      <div className="hidden lg:flex lg:w-[44%] flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: "linear-gradient(160deg,#0f2347 0%,#1b3a6b 55%,#1e4a8a 100%)" }}>
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage:"linear-gradient(rgba(255,255,255,0.035) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.035) 1px,transparent 1px)", backgroundSize:"48px 48px" }} />
        <div className="absolute -bottom-20 -right-20 w-72 h-72 rounded-full bg-white/5 pointer-events-none" />
        <div className="relative z-10 flex items-center gap-2.5">
          <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center font-bold text-white text-lg">P</div>
          <div>
            <p className="font-bold text-white tracking-widest text-base" style={{ fontFamily:"'Barlow', sans-serif" }}>PULSE</p>
            <p className="text-white/40 text-[10px] uppercase tracking-[0.2em]">System</p>
          </div>
        </div>
        <div className="relative z-10 space-y-7">
          <div>
            <h1 className="text-white font-bold leading-snug mb-3"
              style={{ fontFamily:"'Barlow', sans-serif", fontSize:"clamp(1.5rem,2.8vw,2.1rem)" }}>
              Population Update<br />and Linking for<br />Sustainable<br />Empowerment
            </h1>
            <p className="text-white/55 text-sm italic leading-relaxed">"Empowering Communities through Population Insights."</p>
          </div>
          <div className="h-px bg-white/15" />
          <div>
            <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em]">Office of the Provincial Population Officer</p>
            <p className="text-white/80 text-sm font-semibold mt-0.5">Province of Cavite</p>
          </div>
        </div>
        <div className="relative z-10 flex items-center gap-2 text-white/30 text-xs">
          <Shield size={11} /><span>Authorized Government Personnel Only</span>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-[380px] space-y-7">
          <div className="lg:hidden flex flex-col items-center gap-3 mb-2">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-2xl"
              style={{ background:"linear-gradient(135deg,#0f2347,#1b3a6b)" }}>P</div>
            <p className="font-bold text-foreground" style={{ fontFamily:"'Barlow', sans-serif" }}>PULSE System — Province of Cavite</p>
          </div>
          <div>
            <h2 className="font-bold text-foreground" style={{ fontFamily:"'Barlow', sans-serif", fontSize:"1.5rem" }}>Sign In</h2>
            <p className="text-muted-foreground text-sm mt-1">Access restricted to authorized personnel.</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-start gap-3 p-3.5 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle size={15} className="text-red-500 mt-0.5 shrink-0" />
                <p className="text-red-700 text-sm leading-snug">{error}</p>
              </div>
            )}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-foreground">Username <span className="text-red-500">*</span></label>
              <div className="relative">
                <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <FormInput type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Enter username" className="pl-9" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-foreground">Password <span className="text-red-500">*</span></label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <FormInput type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="pl-9 pr-10" />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-primary text-primary-foreground font-bold text-sm py-2.5 rounded-lg hover:bg-primary/90 transition-all disabled:opacity-60 flex items-center justify-center gap-2 mt-1"
              style={{ fontFamily:"'Barlow', sans-serif" }}>
              {loading
                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <><LogIn size={14} /> Sign In to PULSE</>}
            </button>
          </form>
          <div className="border border-border rounded-lg p-3.5 bg-card space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Demo Credentials</p>
            <div className="space-y-1 text-xs font-mono">
              {[["admin","pulse2025"],["encoder","oppo2025"],["reviewer","review2025"]].map(([u,p]) => (
                <div key={u} className="flex gap-3 bg-muted rounded px-2 py-1">
                  <span className="text-primary font-semibold w-16">{u}</span>
                  <span className="text-muted-foreground">{p}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────

const REPORT_CARDS: { category: Category; icon: React.ReactNode; subtext: string }[] = [
  {
    category: "RPFP",
    icon: <ClipboardList size={22} />,
    subtext: "Reproductive & Population Family Planning profiling and seminars.",
  },
  {
    category: "AHD",
    icon: <HeartPulse size={22} />,
    subtext: "Adolescent Health and Development sessions.",
  },
  {
    category: "GAD",
    icon: <Users size={22} />,
    subtext: "Gender and Development activities.",
  },
];

function DashboardView({ user, role, onLogout, records, onEncode, onViewRecords, onViewRecordsForMonth, onViewMonthlySummary }: {
  user: string; role: string; onLogout: () => void;
  records: DocRecord[];
  onEncode: (cat: Category) => void;
  onViewRecords: () => void;
  onViewRecordsForMonth: (month: string) => void;
  onViewMonthlySummary: () => void;
}) {
  const now        = new Date();
  const thisMonth  = MONTHS[now.getMonth()];
  const thisYear   = now.getFullYear();
  const monthCount = records.filter(r => r.reportMonth === thisMonth).length;
  const totalPax   = records.reduce((s, r) => s + (parseInt(r.actualParticipants) || 0), 0);

  return (
    <div className="min-h-screen bg-background flex flex-col" style={{ fontFamily:"'Source Sans 3', sans-serif" }}>
      <AppHeader user={user} onLogout={onLogout} />
      <div className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">

          {/* Welcome */}
          <div className="rounded-xl overflow-hidden relative"
            style={{ background:"linear-gradient(120deg,#0f2347 0%,#1b3a6b 60%,#1e4a8a 100%)" }}>
            <div className="absolute inset-0 pointer-events-none opacity-10"
              style={{ backgroundImage:"linear-gradient(rgba(255,255,255,0.1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.1) 1px,transparent 1px)", backgroundSize:"32px 32px" }} />
            <div className="relative z-10 p-7 sm:p-9">
              <p className="text-white/50 text-xs uppercase tracking-[0.18em] font-semibold mb-1">Welcome back</p>
              <h1 className="text-white font-bold mb-0.5"
                style={{ fontFamily:"'Barlow', sans-serif", fontSize:"1.5rem" }}>{user}</h1>
              <p className="text-white/60 text-sm">{role} · Office of the Provincial Population Officer, Province of Cavite</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {/* Reports (this month) — clickable, navigates to filtered Records */}
            <button
              onClick={() => onViewRecordsForMonth(thisMonth)}
              className="bg-card border border-border rounded-xl p-4 text-left hover:border-primary/30 hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="w-9 h-9 bg-primary/8 rounded-lg flex items-center justify-center mb-3">
                <FileText size={17} className="text-primary" />
              </div>
              <p className="text-2xl font-bold text-primary" style={{ fontFamily:"'JetBrains Mono', monospace" }}>{monthCount}</p>
              <p className="text-xs text-muted-foreground mt-0.5 font-medium">Reports ({thisMonth})</p>
            </button>
            {/* Total Participants — non-interactive */}
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="w-9 h-9 bg-teal-50 rounded-lg flex items-center justify-center mb-3">
                <Users size={17} className="text-teal-600" />
              </div>
              <p className="text-2xl font-bold text-teal-600" style={{ fontFamily:"'JetBrains Mono', monospace" }}>{totalPax}</p>
              <p className="text-xs text-muted-foreground mt-0.5 font-medium">Total Participants</p>
            </div>
            {/* Monthly Summary — clickable */}
            <button
              onClick={onViewMonthlySummary}
              className="bg-card border border-border rounded-xl p-4 text-left hover:border-primary/30 hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="w-9 h-9 bg-indigo-50 rounded-lg flex items-center justify-center mb-3">
                <LayoutGrid size={17} className="text-indigo-600" />
              </div>
              <p className="text-lg font-bold text-indigo-600 leading-tight" style={{ fontFamily:"'JetBrains Mono', monospace" }}>
                {thisMonth.slice(0, 3)}<span className="text-sm ml-1 opacity-70">{thisYear}</span>
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 font-medium">Monthly Summary</p>
            </button>
          </div>

          {/* Three report-type cards */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground"
              style={{ fontFamily:"'Barlow', sans-serif" }}>Encode Documentation Report</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {REPORT_CARDS.map(({ category, icon, subtext }) => {
                const cfg = CONFIGS[category];
                const ac  = cfg.accent;
                return (
                  <div key={category}
                    className="bg-card border border-border rounded-xl p-5 flex flex-col gap-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-3">
                      <div className={`w-11 h-11 ${ac.chipBg} rounded-xl flex items-center justify-center shrink-0 ${ac.chipText}`}>
                        {icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-foreground text-sm leading-snug"
                          style={{ fontFamily:"'Barlow', sans-serif" }}>
                          {category} · Documentation Report
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 leading-snug">{subtext}</p>
                      </div>
                    </div>
                    <button onClick={() => onEncode(category)}
                      className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-all"
                      style={{ fontFamily:"'Barlow', sans-serif" }}>
                      <Plus size={14} /> Encode Report
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* View all */}
          <button onClick={onViewRecords}
            className="w-full flex items-center justify-between gap-3 bg-card border border-border rounded-xl px-5 py-4 hover:bg-accent transition-all group text-left">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-secondary rounded-lg flex items-center justify-center">
                <LayoutDashboard size={16} className="text-muted-foreground" />
              </div>
              <div>
                <p className="font-semibold text-foreground text-sm">View All Records</p>
                <p className="text-muted-foreground text-xs">{records.length} total entries across RPFP, AHD &amp; GAD</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-muted-foreground group-hover:text-foreground transition-colors" />
          </button>

          {/* Recent */}
          {records.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground" style={{ fontFamily:"'Barlow', sans-serif" }}>Recent Reports</h3>
                <button onClick={onViewRecords} className="text-xs text-primary hover:underline font-medium">View all</button>
              </div>
              <div className="bg-card border border-border rounded-xl overflow-hidden divide-y divide-border">
                {records.slice(0, 5).map(r => (
                  <div key={r.id} className="flex items-center gap-3 px-4 py-3 hover:bg-accent/40 transition-colors">
                    <CategoryBadge category={r.category} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{r.barangay}, {r.municipality}</p>
                      <p className="text-xs text-muted-foreground">{r.dateConduct} · {r.sessionType}</p>
                    </div>
                    <span className="text-xs text-muted-foreground font-mono shrink-0 hidden sm:block">{r.code}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── GENERIC DOCUMENTATION FORM ───────────────────────────────────────────────

type FormState = Omit<DocRecord, "id" | "code" | "status">;

function buildBlank(cfg: FormConfig, user: string): FormState {
  return {
    category: cfg.category,
    municipality: "", barangay: "", district: "", venue: "",
    sessionType: cfg.sessionTypePlaceholder ? "" : cfg.sessionTypeOptions[0],
    dateConduct: "", reportMonth: "March", reportYear: "2025",
    targetParticipants: "", actualParticipants: "",
    male: 0, female: 0, ageBracket1: 0, ageBracket2: 0, ageBracket3: 0,
    numSpeakers: "",
    speakers: [...BLANK_SPEAKERS],
    activities: blankActivities(cfg),
    personsResponsible: blankPersons(cfg),
    remarks: "",
    documentedBy: user, dateDocumented: new Date().toISOString().split("T")[0],
    reviewedBy: "Analiza N. Gumapac",
    approvedBy: "Eloisa L. Comia",
  };
}

function DocFormView({ category, user, onLogout, onSubmit, onCancel, onBack, editRecord }: {
  category: Category;
  user: string;
  onLogout: () => void;
  onSubmit: (data: FormState) => void;
  onCancel: () => void;
  onBack: () => void;
  editRecord?: DocRecord | null;
}) {
  const cfg = CONFIGS[category];
  const ac  = cfg.accent;

  const initial: FormState = editRecord
    ? (({ id: _i, code: _c, status: _s, ...rest }) => rest)(editRecord)
    : buildBlank(cfg, user);

  const [form, setForm] = useState<FormState>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (field: string, val: unknown) => setForm(p => ({ ...p, [field]: val }));

  const setMunicipality = (mun: string) => {
    const info = MUNICIPALITY_DATA[mun];
    setForm(p => ({ ...p, municipality: mun, district: info?.district ?? "", barangay: "" }));
  };

  const setSpeaker = (i: number, field: keyof Speaker, val: string) =>
    setForm(p => { const sp = [...p.speakers]; sp[i] = { ...sp[i], [field]: val }; return { ...p, speakers: sp }; });

  const setActivity = (key: string, checked: boolean) =>
    setForm(p => ({ ...p, activities: { ...p.activities, [key]: checked } }));

  const setPerson = (key: string, val: string) =>
    setForm(p => ({ ...p, personsResponsible: { ...p.personsResponsible, [key]: val } }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.municipality)  e.municipality = "Required";
    if (!form.barangay)      e.barangay     = "Required";
    if (!form.venue.trim())  e.venue        = "Required";
    if (!form.dateConduct)   e.dateConduct  = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) onSubmit(form);
  };

  const barangays = MUNICIPALITY_DATA[form.municipality]?.barangays ?? [];
  const errCls = (f: string) => errors[f] ? "border-red-300" : "border-border";

  return (
    <div className="min-h-screen bg-background flex flex-col" style={{ fontFamily:"'Source Sans 3', sans-serif" }}>
      <AppHeader user={user} onLogout={onLogout} crumb={`Dashboard / ${cfg.pageLabel}`} />

      <div className="flex-1 overflow-auto py-7 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <div className="mb-4 print:hidden">
            <BackButton onClick={onBack} />
          </div>
          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">

            {/* Category header strip */}
            <div className={`${ac.headerBg} px-6 py-3 flex items-center gap-3`}>
              <span className="bg-white/25 text-white text-xs font-bold px-2.5 py-1 rounded tracking-widest"
                style={{ fontFamily:"'JetBrains Mono', monospace" }}>{category}</span>
              <span className="text-white font-semibold text-sm"
                style={{ fontFamily:"'Barlow', sans-serif" }}>{cfg.pageLabel}</span>
            </div>

            {/* Sub-header */}
            <div className="border-b border-border px-6 py-4 bg-secondary/20">
              <p className="text-xs text-muted-foreground">
                Province of Cavite · Office of the Provincial Population Officer ·
                All <span className="text-red-500">*</span> fields required.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-8">

              {/* ── 1. Reporting Period ── */}
              <section>
                <SectionHeading>Reporting Period</SectionHeading>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-foreground">Month <span className="text-red-500">*</span></label>
                    <FormSelect value={form.reportMonth} onChange={e => set("reportMonth", e.target.value)}>
                      {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                    </FormSelect>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-foreground">Year <span className="text-red-500">*</span></label>
                    <FormSelect value={form.reportYear} onChange={e => set("reportYear", e.target.value)}>
                      {["2023","2024","2025","2026"].map(y => <option key={y} value={y}>{y}</option>)}
                    </FormSelect>
                  </div>
                </div>
              </section>

              {/* ── 2. Information ── */}
              <section>
                <SectionHeading>Information</SectionHeading>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4 items-end">
                    <div className="space-y-1.5">
                      <label className="block text-sm font-semibold text-foreground">City / Municipality <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        <select value={form.municipality} onChange={e => setMunicipality(e.target.value)}
                          className={`w-full appearance-none pl-9 pr-8 py-2.5 bg-input-background border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/50 transition-all ${errCls("municipality")}`}>
                          <option value="">Select municipality / city…</option>
                          {Object.keys(MUNICIPALITY_DATA).sort().map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                        <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                      </div>
                      {errors.municipality && <p className="text-red-500 text-xs mt-1">{errors.municipality}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-semibold text-foreground">District</label>
                      <div className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border min-w-[120px] ${form.district ? "bg-emerald-50 border-emerald-200" : "bg-muted border-border"}`}>
                        {form.district
                          ? <><CheckCircle size={13} className="text-emerald-600 shrink-0" /><span className="text-sm font-bold font-mono">Dist. {form.district}</span></>
                          : <span className="text-xs text-muted-foreground">Auto-filled</span>}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-sm font-semibold text-foreground">Barangay <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <select value={form.barangay} onChange={e => set("barangay", e.target.value)}
                          disabled={!form.municipality}
                          className={`w-full appearance-none px-3 py-2.5 pr-8 bg-input-background border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${errCls("barangay")}`}>
                          <option value="">{form.municipality ? "Select barangay…" : "Select municipality first"}</option>
                          {barangays.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                        <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                      </div>
                      {errors.barangay && <p className="text-red-500 text-xs mt-1">{errors.barangay}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-semibold text-foreground">Venue <span className="text-red-500">*</span></label>
                      <FormInput type="text" value={form.venue} onChange={e => set("venue", e.target.value)}
                        placeholder="e.g., Barangay Hall, Community Center"
                        className={errCls("venue")} />
                      {errors.venue && <p className="text-red-500 text-xs mt-1">{errors.venue}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-sm font-semibold text-foreground">{cfg.sessionTypeLabel} <span className="text-red-500">*</span></label>
                      <FormSelect value={form.sessionType} onChange={e => set("sessionType", e.target.value)}>
                        {cfg.sessionTypePlaceholder && (
                          <option value="" disabled>{cfg.sessionTypePlaceholder}</option>
                        )}
                        {cfg.sessionTypeOptions.map(o => <option key={o} value={o}>{o}</option>)}
                      </FormSelect>
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-semibold text-foreground">Date Conducted <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        <FormInput type="date" value={form.dateConduct} onChange={e => set("dateConduct", e.target.value)}
                          className={`pl-9 ${errCls("dateConduct")}`} />
                      </div>
                      {errors.dateConduct && <p className="text-red-500 text-xs mt-1">{errors.dateConduct}</p>}
                    </div>
                  </div>
                </div>
              </section>

              {/* ── 3. Participants ── */}
              <section>
                <SectionHeading>Participants &amp; Resource Persons</SectionHeading>
                <div className="space-y-5">
                  {/* Counts */}
                  <div>
                    <p className="text-sm font-semibold text-foreground mb-3">Participants' Profile</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { label:"Target",  field:"targetParticipants",  placeholder:"N/A" },
                        { label:"Actual",  field:"actualParticipants",  placeholder:"0"   },
                        { label:"Male",    field:"male",                placeholder:"0",  type:"number" },
                        { label:"Female",  field:"female",              placeholder:"0",  type:"number" },
                      ].map(({ label, field, placeholder, type }) => (
                        <div key={field} className="space-y-1">
                          <label className="text-xs font-semibold text-muted-foreground">{label}</label>
                          <input type={type || "text"} placeholder={placeholder}
                            value={(form as Record<string, unknown>)[field] as string}
                            onChange={e => set(field, type === "number" ? Number(e.target.value) : e.target.value)}
                            className="w-full px-3 py-2 bg-input-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/50 transition-all text-center font-mono" />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Age brackets */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-2">Age Brackets</p>
                    <div className="grid grid-cols-3 gap-3">
                      {cfg.ageBrackets.map(({ label, field }) => (
                        <div key={field} className="space-y-1">
                          <label className="text-xs font-semibold text-muted-foreground">{label}</label>
                          <input type="number" min={0} value={form[field]}
                            onChange={e => set(field, Number(e.target.value))}
                            className="w-full px-3 py-2 bg-input-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/50 transition-all text-center font-mono" />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* No. of speakers */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-foreground">No. of Speakers</label>
                    <input type="text" value={form.numSpeakers} onChange={e => set("numSpeakers", e.target.value)}
                      placeholder="N/A"
                      className="w-28 px-3 py-2 bg-input-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/50 transition-all font-mono" />
                  </div>

                  {/* Speakers table */}
                  <div>
                    <p className="text-sm font-semibold text-foreground mb-2">Name of Speakers / Topics Discussed / Rating</p>
                    <div className="border border-border rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-secondary/50 border-b border-border">
                            <th className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground w-8">#</th>
                            <th className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Name of Speaker</th>
                            <th className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Topic Discussed</th>
                            <th className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground w-24">Rating</th>
                          </tr>
                        </thead>
                        <tbody>
                          {form.speakers.map((sp, i) => (
                            <tr key={i} className="border-b border-border last:border-0">
                              <td className="px-3 py-1.5 text-xs text-muted-foreground font-mono">{i + 1}.</td>
                              {(["name","topic","rating"] as (keyof Speaker)[]).map(f => (
                                <td key={f} className="px-2 py-1.5">
                                  <input type="text" value={sp[f]}
                                    onChange={e => setSpeaker(i, f, e.target.value)}
                                    placeholder="N/A"
                                    className="w-full px-2 py-1 bg-transparent border border-transparent rounded hover:border-border focus:border-primary/50 focus:bg-input-background text-sm outline-none transition-all" />
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </section>

              {/* ── 4. Activities Undertaken ── */}
              <section>
                <SectionHeading>Activities Undertaken &amp; Persons Responsible</SectionHeading>
                <div className="border border-border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-secondary/50 border-b border-border">
                        <th className="px-4 py-2.5 w-8" />
                        <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Activity</th>
                        <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Person(s) Responsible</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cfg.activityKeys.map(key => (
                        <tr key={key} className="border-b border-border last:border-0 hover:bg-accent/30 transition-colors">
                          <td className="px-4 py-2.5">
                            <input type="checkbox" checked={!!form.activities[key]}
                              onChange={e => setActivity(key, e.target.checked)}
                              className="w-4 h-4 rounded border-border accent-primary cursor-pointer" />
                          </td>
                          <td className={`px-4 py-2.5 text-sm font-medium ${form.activities[key] ? "text-foreground" : "text-muted-foreground"}`}>
                            {cfg.activityLabels[key]}
                          </td>
                          <td className="px-3 py-1.5">
                            <input type="text" value={form.personsResponsible[key] ?? ""}
                              onChange={e => setPerson(key, e.target.value)}
                              placeholder="N/A"
                              className="w-full px-2 py-1.5 bg-transparent border border-transparent rounded hover:border-border focus:border-primary/50 focus:bg-input-background text-sm outline-none transition-all placeholder:text-muted-foreground/50" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* ── 5. Remarks ── */}
              <section>
                <SectionHeading>Remarks</SectionHeading>
                <textarea value={form.remarks} onChange={e => set("remarks", e.target.value)}
                  rows={3} placeholder="Enter any remarks or observations…"
                  className="w-full px-3 py-2.5 bg-input-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/50 transition-all resize-none" />
              </section>

              {/* ── 6. Signatories ── */}
              <section>
                <SectionHeading>Signatories</SectionHeading>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground block">Documented by</label>
                    <FormInput value={form.documentedBy} onChange={e => set("documentedBy", e.target.value)} />
                    <label className="text-xs font-semibold text-muted-foreground block mt-1">Date</label>
                    <FormInput type="date" value={form.dateDocumented} onChange={e => set("dateDocumented", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground block">Reviewed by</label>
                    <FormInput value={form.reviewedBy} onChange={e => set("reviewedBy", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground block">Approved by</label>
                    <FormInput value={form.approvedBy} onChange={e => set("approvedBy", e.target.value)} />
                  </div>
                </div>
              </section>

              {/* Submit */}
              <div className="flex justify-end gap-3 pt-1 border-t border-border">
                <button type="button" onClick={onCancel}
                  className="px-5 py-2.5 rounded-lg border border-border text-sm font-semibold text-foreground hover:bg-accent transition-all">
                  Cancel
                </button>
                <button type="submit"
                  className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-all"
                  style={{ fontFamily:"'Barlow', sans-serif" }}>
                  <CheckCircle size={15} />
                  {editRecord ? "Save Changes" : "Submit Report"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PRINT PREVIEW ────────────────────────────────────────────────────────────

type PreviewTarget =
  | { mode: "single"; record: DocRecord }
  | { mode: "summary"; records: DocRecord[]; filters: { cat: string; month: string; district: string } }
  | { mode: "matrix"; records: DocRecord[]; category: Category; month: string; year: string };

// Inline table styles for the paper document (not Tailwind — printed content)
const TH: React.CSSProperties = {
  padding: "4px 9px", textAlign: "left", fontSize: "8pt", fontWeight: 700,
  textTransform: "uppercase", letterSpacing: "0.07em", border: "1px solid #d1d8e5",
  color: "#6b7a90", whiteSpace: "nowrap", background: "#f0f2f7",
};
const TD: React.CSSProperties = { padding: "4px 9px", border: "1px solid #d1d8e5", fontSize: "9pt" };
const TDr: React.CSSProperties = { ...TD, textAlign: "right", fontFamily: "monospace" };

function DocSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "18px" }}>
      <p style={{ fontWeight: 700, fontSize: "8.5pt", textTransform: "uppercase", letterSpacing: "0.14em",
        color: "#6b7a90", borderBottom: "1px solid #d1d8e5", paddingBottom: "4px", marginBottom: "10px" }}>
        {title}
      </p>
      {children}
    </div>
  );
}

function DocRow2({ a, b }: { a: [string, string]; b: [string, string] }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "9px" }}>
      {[a, b].map(([label, val]) => (
        <div key={label}>
          <p style={{ fontSize: "7.5pt", color: "#6b7a90", marginBottom: "2px" }}>{label}</p>
          <p style={{ fontWeight: 600, fontSize: "10pt" }}>{val || "—"}</p>
        </div>
      ))}
    </div>
  );
}

function SingleRecordDocument({ record }: { record: DocRecord }) {
  const cfg = CONFIGS[record.category];
  const dash = (v: string | number | null | undefined) =>
    v === "" || v === undefined || v === null ? "—" : String(v);

  return (
    <div style={{ padding: "18mm 20mm", fontFamily: "'Source Sans 3', sans-serif",
      fontSize: "10pt", color: "#1a2332", lineHeight: 1.45 }}>

      {/* Government letterhead */}
      <div style={{ textAlign: "center", marginBottom: "18px" }}>
        <p style={{ fontSize: "8.5pt", color: "#6b7a90" }}>Republic of the Philippines</p>
        <p style={{ fontWeight: 700, fontSize: "13.5pt", margin: "2px 0" }}>Province of Cavite</p>
        <p style={{ fontSize: "9.5pt" }}>Office of the Provincial Population Officer</p>
        <div style={{ margin: "10px 0 0", borderTop: "2.5px solid #1b3a6b",
          borderBottom: "1px solid #1b3a6b", padding: "5px 0" }}>
          <p style={{ fontWeight: 700, fontSize: "11.5pt", textTransform: "uppercase",
            letterSpacing: "0.1em" }}>
            {record.category} Documentation Report
          </p>
        </div>
      </div>

      {/* Meta line */}
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "8.5pt",
        color: "#6b7a90", marginBottom: "18px", gap: "12px" }}>
        <span>Code: <strong style={{ color: "#1a2332", fontFamily: "monospace" }}>{record.code}</strong></span>
        <span>Period: <strong style={{ color: "#1a2332" }}>{record.reportMonth} {record.reportYear}</strong></span>
      </div>

      {/* ── Information ── */}
      <DocSection title="Information">
        <DocRow2 a={["City / Municipality", dash(record.municipality)]} b={["District", `District ${dash(record.district)}`]} />
        <DocRow2 a={["Barangay", dash(record.barangay)]} b={["Venue", dash(record.venue)]} />
        <DocRow2 a={[cfg.sessionTypeLabel, dash(record.sessionType)]} b={["Date Conducted", dash(record.dateConduct)]} />
      </DocSection>

      {/* ── Participants ── */}
      <DocSection title="Participants & Resource Persons">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px", marginBottom: "10px" }}>
          {[["Target", dash(record.targetParticipants)], ["Actual", dash(record.actualParticipants)],
            ["Male", dash(record.male)], ["Female", dash(record.female)]].map(([l, v]) => (
            <div key={l} style={{ border: "1px solid #d1d8e5", borderRadius: "4px",
              padding: "6px 8px", textAlign: "center" }}>
              <p style={{ fontSize: "7.5pt", color: "#6b7a90", marginBottom: "2px" }}>{l}</p>
              <p style={{ fontWeight: 700, fontFamily: "monospace", fontSize: "12pt" }}>{v}</p>
            </div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", marginBottom: "12px" }}>
          {cfg.ageBrackets.map((ab, i) => (
            <div key={ab.field} style={{ border: "1px solid #d1d8e5", borderRadius: "4px",
              padding: "6px 8px", textAlign: "center" }}>
              <p style={{ fontSize: "7.5pt", color: "#6b7a90", marginBottom: "2px" }}>{ab.label}</p>
              <p style={{ fontWeight: 700, fontFamily: "monospace", fontSize: "12pt" }}>
                {[record.ageBracket1, record.ageBracket2, record.ageBracket3][i]}
              </p>
            </div>
          ))}
        </div>
        <p style={{ fontSize: "9pt", marginBottom: "10px" }}>
          No. of Speakers: <strong>{dash(record.numSpeakers)}</strong>
        </p>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr><th style={TH}>#</th><th style={TH}>Name of Speaker</th>
              <th style={TH}>Topic Discussed</th><th style={{ ...TH, width: "60px" }}>Rating</th></tr>
          </thead>
          <tbody>
            {record.speakers.map((sp, i) => (
              <tr key={i}>
                <td style={{ ...TD, textAlign: "center", color: "#6b7a90", fontSize: "8pt" }}>{i + 1}.</td>
                <td style={TD}>{sp.name || "—"}</td>
                <td style={TD}>{sp.topic || "—"}</td>
                <td style={{ ...TD, textAlign: "center" }}>{sp.rating || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </DocSection>

      {/* ── Activities ── */}
      <DocSection title="Activities Undertaken">
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ ...TH, width: "22px", textAlign: "center" }}>✓</th>
              <th style={TH}>Activity</th>
              <th style={TH}>Person(s) Responsible</th>
            </tr>
          </thead>
          <tbody>
            {cfg.activityKeys.map(key => (
              <tr key={key}>
                <td style={{ ...TD, textAlign: "center", fontWeight: 700 }}>
                  {record.activities[key] ? "✓" : ""}
                </td>
                <td style={{ ...TD, fontWeight: record.activities[key] ? 600 : 400 }}>
                  {cfg.activityLabels[key]}
                </td>
                <td style={TD}>{record.personsResponsible[key] || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </DocSection>

      {/* ── Remarks ── */}
      <DocSection title="Remarks">
        <p style={{ minHeight: "36px", fontSize: "10pt", fontStyle: record.remarks ? "normal" : "italic",
          color: record.remarks ? "#1a2332" : "#9aa3b0" }}>
          {record.remarks || "No remarks entered."}
        </p>
      </DocSection>

      {/* ── Signatures ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginTop: "28px" }}>
        {[
          { label: "Documented by", name: record.documentedBy, sub: record.dateDocumented },
          { label: "Reviewed by",   name: record.reviewedBy },
          { label: "Approved by",   name: record.approvedBy || "Not yet signed" },
        ].map(({ label, name, sub }) => (
          <div key={label} style={{ borderTop: "2px solid #1b3a6b", paddingTop: "8px", textAlign: "center" }}>
            <p style={{ fontWeight: 700, fontSize: "10.5pt" }}>{name || "—"}</p>
            {sub && <p style={{ fontSize: "8.5pt", color: "#6b7a90", marginTop: "2px" }}>{sub}</p>}
            <p style={{ fontSize: "7.5pt", color: "#6b7a90", marginTop: "10px",
              textTransform: "uppercase", letterSpacing: "0.09em" }}>{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SummaryDocument({ records, filters }: {
  records: DocRecord[];
  filters: { cat: string; month: string; district: string };
}) {
  const now  = new Date().toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" });
  const totals = {
    actual: records.reduce((s, r) => s + (parseInt(r.actualParticipants) || 0), 0),
    male:   records.reduce((s, r) => s + r.male, 0),
    female: records.reduce((s, r) => s + r.female, 0),
    b1:     records.reduce((s, r) => s + r.ageBracket1, 0),
    b2:     records.reduce((s, r) => s + r.ageBracket2, 0),
    b3:     records.reduce((s, r) => s + r.ageBracket3, 0),
  };

  if (records.length === 0) {
    return (
      <div style={{ padding: "40mm 20mm", textAlign: "center", fontFamily: "'Source Sans 3', sans-serif",
        color: "#6b7a90" }}>
        <p style={{ fontSize: "14pt", marginBottom: "8px" }}>No records match the current filters.</p>
        <p style={{ fontSize: "10pt" }}>Adjust filters in the records list and try again.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "15mm 18mm", fontFamily: "'Source Sans 3', sans-serif",
      fontSize: "9.5pt", color: "#1a2332", lineHeight: 1.4 }}>

      {/* Letterhead */}
      <div style={{ textAlign: "center", marginBottom: "14px" }}>
        <p style={{ fontSize: "8pt", color: "#6b7a90" }}>Republic of the Philippines · Province of Cavite</p>
        <p style={{ fontWeight: 700, fontSize: "11pt", margin: "2px 0" }}>
          Office of the Provincial Population Officer
        </p>
        <div style={{ margin: "8px 0 0", borderTop: "2.5px solid #1b3a6b",
          borderBottom: "1px solid #1b3a6b", padding: "5px 0" }}>
          <p style={{ fontWeight: 700, fontSize: "11pt", textTransform: "uppercase",
            letterSpacing: "0.1em" }}>Documentation Reports Summary</p>
        </div>
        <p style={{ fontSize: "8pt", color: "#6b7a90", marginTop: "5px" }}>Generated: {now}</p>
      </div>

      {/* Active filters */}
      <div style={{ border: "1px solid #d1d8e5", borderRadius: "5px", padding: "8px 12px",
        marginBottom: "12px", fontSize: "8.5pt", display: "flex", gap: "20px", flexWrap: "wrap" }}>
        <span>Type: <strong>{filters.cat || "All"}</strong></span>
        <span>Month: <strong>{filters.month || "All"}</strong></span>
        <span>District: <strong>{filters.district ? `District ${filters.district}` : "All"}</strong></span>
        <span>Records: <strong>{records.length}</strong></span>
      </div>

      {/* Totals */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "7px", marginBottom: "14px" }}>
        {([
          ["Participants", totals.actual],
          ["Male",   totals.male],
          ["Female", totals.female],
          ["Bracket 1", totals.b1],
          ["Bracket 2", totals.b2],
          ["Bracket 3", totals.b3],
        ] as [string, number][]).map(([label, value]) => (
          <div key={label} style={{ border: "1px solid #d1d8e5", borderRadius: "4px",
            padding: "5px 6px", textAlign: "center" }}>
            <p style={{ fontSize: "7pt", color: "#6b7a90", marginBottom: "2px" }}>{label}</p>
            <p style={{ fontWeight: 700, fontFamily: "monospace", fontSize: "13pt" }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Records table */}
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            {["Type","Code","Date","Session","Dist.","Barangay","Municipality",
              "Actual","M","F","B1","B2","B3","Documented By"].map(h => (
              <th key={h} style={TH}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {records.map((r, i) => (
            <tr key={r.id} style={{ background: i % 2 === 1 ? "#f8f9fc" : "white" }}>
              <td style={TD}>{r.category}</td>
              <td style={{ ...TD, fontFamily: "monospace", fontSize: "8pt" }}>{r.code}</td>
              <td style={{ ...TD, fontFamily: "monospace", fontSize: "8pt", whiteSpace: "nowrap" }}>{r.dateConduct}</td>
              <td style={TD}>{r.sessionType}</td>
              <td style={{ ...TD, textAlign: "center" }}>{r.district}</td>
              <td style={TD}>{r.barangay}</td>
              <td style={TD}>{r.municipality}</td>
              <td style={TDr}>{r.actualParticipants}</td>
              <td style={TDr}>{r.male}</td>
              <td style={TDr}>{r.female}</td>
              <td style={TDr}>{r.ageBracket1}</td>
              <td style={TDr}>{r.ageBracket2}</td>
              <td style={TDr}>{r.ageBracket3}</td>
              <td style={TD}>{r.documentedBy}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr style={{ fontWeight: 700, background: "#eef0f5" }}>
            <td colSpan={7} style={{ ...TD, fontWeight: 700, fontSize: "8.5pt",
              textTransform: "uppercase", letterSpacing: "0.07em" }}>Total</td>
            <td style={TDr}>{totals.actual}</td>
            <td style={TDr}>{totals.male}</td>
            <td style={TDr}>{totals.female}</td>
            <td style={TDr}>{totals.b1}</td>
            <td style={TDr}>{totals.b2}</td>
            <td style={TDr}>{totals.b3}</td>
            <td style={TD} />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

// ─── Matrix document (landscape PDF layout) ───────────────────────────────────

function MatrixDocument({ records, category, month, year }: {
  records: DocRecord[]; category: Category; month: string; year: string;
}) {
  const cfg   = MATRIX_CFG[category];
  const acc   = CONFIGS[category].accent;
  const accentHex = category === "RPFP" ? "#0d9488" : category === "AHD" ? "#ea580c" : "#7c3aed";
  const districts = ["I", "II", "III", "IV"];

  const totTypeCol  = cfg.typeColumns.map(tc => records.filter(r => r.sessionType === tc).length);
  const totDistCol  = districts.map(d => records.filter(r => r.district === d).length);
  const totMale     = records.reduce((s, r) => s + r.male, 0);
  const totFemale   = records.reduce((s, r) => s + r.female, 0);
  const totPax      = records.reduce((s, r) => s + (parseInt(r.actualParticipants) || 0), 0);
  const totB1       = records.reduce((s, r) => s + r.ageBracket1, 0);
  const totB2       = records.reduce((s, r) => s + r.ageBracket2, 0);
  const totB3       = records.reduce((s, r) => s + r.ageBracket3, 0);

  const S: Record<string, React.CSSProperties> = {
    page:  { fontFamily: "'Source Sans 3', Arial, sans-serif", fontSize: "8pt", color: "#1a2332", padding: "10mm 10mm 8mm" },
    hdr:   { textAlign: "center", marginBottom: "6mm", borderBottom: "2px solid #1b3a6b", paddingBottom: "4mm" },
    title: { fontFamily: "'Barlow', sans-serif", fontSize: "13pt", fontWeight: 700, color: "#1b3a6b", letterSpacing: "0.05em", textTransform: "uppercase" as const },
    sub:   { fontSize: "8pt", color: "#6b7a90", marginTop: "2px" },
    tbl:   { width: "100%", borderCollapse: "collapse" as const, fontSize: "7.5pt" },
    th:    { border: "1px solid #c8cfe0", padding: "3px 4px", background: "#1b3a6b", color: "#fff", fontWeight: 700, textAlign: "center" as const, lineHeight: 1.2 },
    thAcc: { border: "1px solid #c8cfe0", padding: "3px 4px", background: accentHex, color: "#fff", fontWeight: 700, textAlign: "center" as const, lineHeight: 1.2 },
    td:    { border: "1px solid #dde2ec", padding: "2px 4px", verticalAlign: "middle" as const },
    tdc:   { border: "1px solid #dde2ec", padding: "2px 4px", textAlign: "center" as const, verticalAlign: "middle" as const },
    tdr:   { border: "1px solid #dde2ec", padding: "2px 4px", textAlign: "right" as const, verticalAlign: "middle" as const },
    totTh: { border: "1px solid #c8cfe0", padding: "3px 4px", background: "#eef0f5", fontWeight: 700, fontSize: "7.5pt", textAlign: "center" as const },
    totTd: { border: "1px solid #c8cfe0", padding: "3px 4px", background: "#eef0f5", fontWeight: 700, textAlign: "center" as const },
  };

  const typeColspan = cfg.typeColumns.length;
  const distColspan = 4;
  const ageColspan  = 3;

  return (
    <div style={S.page}>
      <div style={S.hdr}>
        <p style={S.title}>Office of the Provincial Population Officer — Province of Cavite</p>
        <p style={{ ...S.title, fontSize: "11pt", marginTop: "3px" }}>
          {category} Monthly Summary · {month.toUpperCase()} {year}
        </p>
        <p style={S.sub}>Population Update and Linking for Sustainable Empowerment (PULSE) System</p>
      </div>

      <table style={S.tbl}>
        <thead>
          {/* Row 1: group headers */}
          <tr>
            <th rowSpan={2} style={{ ...S.th, width: "22px" }}>#</th>
            <th rowSpan={2} style={{ ...S.th, width: "58px", whiteSpace: "nowrap" }}>Date of<br />Conduct</th>
            <th colSpan={typeColspan} style={S.thAcc}>Type of Conduct</th>
            <th colSpan={distColspan} style={S.th}>District</th>
            <th rowSpan={2} style={{ ...S.th, width: "70px" }}>Barangay</th>
            <th rowSpan={2} style={{ ...S.th, width: "70px" }}>Municipality</th>
            <th rowSpan={2} style={{ ...S.th, width: "22px" }}>M</th>
            <th rowSpan={2} style={{ ...S.th, width: "22px" }}>F</th>
            <th rowSpan={2} style={{ ...S.th, width: "28px" }}>Total</th>
            <th colSpan={ageColspan} style={S.th}>Age Bracket</th>
            <th rowSpan={2} style={{ ...S.th, width: "66px" }}>Documented By</th>
          </tr>
          {/* Row 2: sub-columns */}
          <tr>
            {cfg.typeLabels.map(l => <th key={l} style={{ ...S.thAcc, fontSize: "6.5pt" }}>{l}</th>)}
            {districts.map(d  => <th key={d}  style={{ ...S.th,    fontSize: "6.5pt" }}>Dist. {d}</th>)}
            {cfg.ageBrackets.map(a => <th key={a} style={{ ...S.th, fontSize: "6.5pt" }}>{a}</th>)}
          </tr>
        </thead>
        <tbody>
          {records.length === 0 ? (
            <tr>
              <td colSpan={3 + typeColspan + distColspan + ageColspan + 4}
                style={{ ...S.td, textAlign: "center", padding: "10mm", color: "#6b7a90", fontStyle: "italic" }}>
                No reports encoded for this period.
              </td>
            </tr>
          ) : records.map((r, i) => {
            const pax = parseInt(r.actualParticipants) || 0;
            return (
              <tr key={r.id} style={{ background: i % 2 === 1 ? "#f8f9fc" : "white" }}>
                <td style={{ ...S.tdc, fontSize: "7pt" }}>{i + 1}</td>
                <td style={{ ...S.tdc, fontFamily: "monospace", whiteSpace: "nowrap", fontSize: "6.5pt" }}>{r.dateConduct}</td>
                {cfg.typeColumns.map(tc => (
                  <td key={tc} style={S.tdc}>
                    {r.sessionType === tc ? <span style={{ fontWeight: 700, color: accentHex }}>1</span> : ""}
                  </td>
                ))}
                {districts.map(d => (
                  <td key={d} style={S.tdc}>
                    {r.district === d ? <span style={{ fontWeight: 700, color: "#1b3a6b" }}>1</span> : ""}
                  </td>
                ))}
                <td style={{ ...S.td, fontSize: "7pt" }}>{r.barangay}</td>
                <td style={{ ...S.td, fontSize: "7pt" }}>{r.municipality}</td>
                <td style={S.tdr}>{r.male}</td>
                <td style={S.tdr}>{r.female}</td>
                <td style={{ ...S.tdr, fontWeight: 600 }}>{pax}</td>
                <td style={S.tdr}>{r.ageBracket1}</td>
                <td style={S.tdr}>{r.ageBracket2}</td>
                <td style={S.tdr}>{r.ageBracket3}</td>
                <td style={{ ...S.td, fontSize: "7pt" }}>{r.documentedBy}</td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={2} style={{ ...S.totTh, textAlign: "right", letterSpacing: "0.05em", fontSize: "7pt" }}>TOTAL</td>
            {totTypeCol.map((v, i) => <td key={i} style={S.totTd}>{v || ""}</td>)}
            {totDistCol.map((v, i) => <td key={i} style={S.totTd}>{v || ""}</td>)}
            <td style={S.totTh} />
            <td style={S.totTh} />
            <td style={S.totTd}>{totMale}</td>
            <td style={S.totTd}>{totFemale}</td>
            <td style={{ ...S.totTd, fontWeight: 800 }}>{totPax}</td>
            <td style={S.totTd}>{totB1}</td>
            <td style={S.totTd}>{totB2}</td>
            <td style={S.totTd}>{totB3}</td>
            <td style={S.totTh} />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function PrintPreviewModal({ target, onClose, onToast }: {
  target: PreviewTarget;
  onClose: () => void;
  onToast: (msg: string) => void;
}) {
  const [ready, setReady]             = useState(false);
  const [pdfGenerating, setPdfGenerating] = useState(false);

  // Brief skeleton so the preview never flashes blank
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 380);
    return () => clearTimeout(t);
  }, []);

  // Inject print-isolation CSS: visibility trick hides everything except the A4 paper
  useEffect(() => {
    const style = document.createElement("style");
    style.id = "pulse-print-iso";
    style.textContent = `
      @media print {
        body * { visibility: hidden !important; }
        #pulse-print-root, #pulse-print-root * { visibility: visible !important; }
        #pulse-print-root {
          position: fixed !important; inset: 0 !important;
          width: 100vw !important; height: auto !important;
          overflow: visible !important; z-index: 99999 !important;
          background: white !important; margin: 0 !important; padding: 0 !important;
        }
      }
    `;
    document.head.appendChild(style);
    return () => { style.remove(); };
  }, []);

  const isSingle = target.mode === "single";
  const isMatrix = target.mode === "matrix";
  const matrixT  = isMatrix ? (target as { mode: "matrix"; records: DocRecord[]; category: Category; month: string; year: string }) : null;
  const isEmpty  = !isSingle && (target as { records: DocRecord[] }).records.length === 0;

  const title = isSingle
    ? (target as { record: DocRecord }).record.code
    : isMatrix
      ? `${matrixT!.category} Monthly Summary — ${matrixT!.month} ${matrixT!.year}`
      : "Documentation Reports Summary";
  const subtitle = isSingle
    ? `${(target as { record: DocRecord }).record.reportMonth} ${(target as { record: DocRecord }).record.reportYear} · ${(target as { record: DocRecord }).record.barangay}, ${(target as { record: DocRecord }).record.municipality}`
    : isMatrix
      ? `${matrixT!.records.length} record${matrixT!.records.length !== 1 ? "s" : ""} · ${matrixT!.category} · ${matrixT!.month} ${matrixT!.year}`
      : `${(target as { records: DocRecord[] }).records.length} record${(target as { records: DocRecord[] }).records.length !== 1 ? "s" : ""} · Generated ${new Date().toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })}`;

  const filename = isSingle
    ? `${(target as { record: DocRecord }).record.code}.pdf`
    : isMatrix
      ? `${matrixT!.category}-Monthly-Summary-${matrixT!.month}-${matrixT!.year}.pdf`
      : "Documentation-Reports-Summary.pdf";

  const pdfOrientation = isMatrix ? "landscape" : "portrait";
  const paperWidth     = isMatrix ? "min(1120px, 100%)" : "min(794px, 100%)";

  const handlePrint = () => {
    window.print();
    onToast("Sent to printer");
  };

  // Shared one-function PDF generation — used by both row-level and toolbar buttons
  const handleDownloadPDF = async () => {
    const el = document.getElementById("pulse-print-root");
    if (!el) return;
    setPdfGenerating(true);
    try {
      // Dynamic import keeps the library out of the initial bundle
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const html2pdf = ((await import("html2pdf.js")) as any).default;
      await html2pdf()
        .set({
          margin: 0,
          filename,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, logging: false },
          jsPDF: { unit: "mm", format: "a4", orientation: pdfOrientation },
          pagebreak: { mode: ["avoid-all", "css", "legacy"] },
        })
        .from(el)
        .save();
      onToast(`Downloaded ${filename}`);
    } catch {
      onToast("Couldn't generate PDF — try again");
    } finally {
      setPdfGenerating(false);
    }
  };

  const dlDisabled = isEmpty || pdfGenerating || !ready;

  return (
    <div className="fixed inset-0 z-[70] flex flex-col" style={{ fontFamily: "'Source Sans 3', sans-serif" }}>
      {/* Dim backdrop */}
      <div className="absolute inset-0 bg-black/65" onClick={onClose} />

      <div className="relative z-10 flex flex-col h-full">
        {/* ── Modal header (hidden on print) ── */}
        <div className="bg-white border-b border-zinc-200 px-5 py-3 flex items-center gap-3 shrink-0 shadow-sm"
          id="pulse-preview-header">
          {isSingle
            ? <CategoryBadge category={(target as { record: DocRecord }).record.category} />
            : <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border bg-primary/10 text-primary border-primary/20 tracking-widest"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}>ALL</span>}
          <div className="flex-1 min-w-0">
            <p className="font-bold text-foreground text-sm truncate" style={{ fontFamily: "'Barlow', sans-serif" }}>
              {title}
            </p>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button disabled={isEmpty} onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 text-sm font-semibold text-foreground hover:bg-zinc-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
              <Printer size={13} /> Print
            </button>
            <button disabled={dlDisabled} onClick={handleDownloadPDF}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed min-w-[130px] justify-center"
              style={{ fontFamily: "'Barlow', sans-serif" }}>
              {pdfGenerating
                ? <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" /> Generating…</>
                : <><Download size={13} /> Download PDF</>}
            </button>
            <button onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-500 hover:text-zinc-800 transition-colors ml-1">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* ── Scrollable gray backdrop ── */}
        <div className="flex-1 overflow-auto bg-zinc-400/60 py-8 px-4">
          {!ready ? (
            /* Skeleton */
            <div className="mx-auto bg-white shadow-xl rounded-sm animate-pulse"
              style={{ width: paperWidth, padding: "40px", minHeight: "500px" }}>
              <div className="space-y-3">
                <div className="h-3 bg-zinc-200 rounded w-1/3 mx-auto" />
                <div className="h-5 bg-zinc-200 rounded w-1/2 mx-auto" />
                <div className="h-3 bg-zinc-200 rounded w-2/5 mx-auto" />
                <div className="h-px bg-zinc-200 my-6" />
                {[100, 75, 85, 55, 90, 70, 80, 60].map((w, i) => (
                  <div key={i} className="h-3 bg-zinc-100 rounded" style={{ width: `${w}%` }} />
                ))}
              </div>
            </div>
          ) : (
            /* A4 paper */
            <div id="pulse-print-root" className="mx-auto bg-white shadow-xl rounded-sm"
              style={{ width: paperWidth, minHeight: isMatrix ? "auto" : "297mm", boxSizing: "border-box" }}>
              {isEmpty ? (
                <div style={{ padding: "40mm 20mm", textAlign: "center",
                  fontFamily: "'Source Sans 3', sans-serif", color: "#6b7a90" }}>
                  <p style={{ fontSize: "14pt", marginBottom: "8px" }}>No records match the current filters.</p>
                  <p style={{ fontSize: "10pt" }}>Adjust filters in the records list and try again.</p>
                </div>
              ) : isSingle ? (
                <SingleRecordDocument record={(target as { record: DocRecord }).record} />
              ) : isMatrix ? (
                <MatrixDocument
                  records={matrixT!.records}
                  category={matrixT!.category}
                  month={matrixT!.month}
                  year={matrixT!.year} />
              ) : (
                <SummaryDocument
                  records={(target as { records: DocRecord[] }).records}
                  filters={(target as { filters: { cat: string; month: string; district: string } }).filters} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── RECORDS LIST ─────────────────────────────────────────────────────────────

function RecordsView({ user, onLogout, records, onEdit, onDelete, onNewReport, onBack, initialFilterMonth = "" }: {
  user: string; onLogout: () => void;
  records: DocRecord[];
  onEdit: (r: DocRecord) => void;
  onDelete: (id: number) => void;
  onNewReport: (cat: Category) => void;
  onBack: () => void;
  initialFilterMonth?: string;
}) {
  const [search, setSearch]         = useState("");
  const [filterCat, setFilterCat]   = useState<Category | "">("");
  const [filterType, setFilterType] = useState("");
  const [filterDist, setFilterDist] = useState("");
  const [filterMonth, setFilterMonth] = useState(initialFilterMonth);
  const [deleteTarget, setDeleteTarget]   = useState<DocRecord | null>(null);
  const [viewTarget, setViewTarget]       = useState<DocRecord | null>(null);
  const [previewTarget, setPreviewTarget] = useState<PreviewTarget | null>(null);
  const [toast, setToast] = useState("");

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const filtered = useMemo(() => records.filter(r => {
    if (search && !`${r.code} ${r.barangay} ${r.municipality} ${r.documentedBy} ${r.venue} ${r.sessionType}`.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterCat   && r.category    !== filterCat)   return false;
    if (filterType  && r.sessionType !== filterType)  return false;
    if (filterDist  && r.district    !== filterDist)  return false;
    if (filterMonth && r.reportMonth !== filterMonth) return false;
    return true;
  }), [records, search, filterCat, filterType, filterDist, filterMonth]);

  const totals = useMemo(() => ({
    actual: filtered.reduce((s, r) => s + (parseInt(r.actualParticipants) || 0), 0),
    male:   filtered.reduce((s, r) => s + r.male, 0),
    female: filtered.reduce((s, r) => s + r.female, 0),
    b1:     filtered.reduce((s, r) => s + r.ageBracket1, 0),
    b2:     filtered.reduce((s, r) => s + r.ageBracket2, 0),
    b3:     filtered.reduce((s, r) => s + r.ageBracket3, 0),
  }), [filtered]);

  const confirmDelete = () => {
    if (!deleteTarget) return;
    onDelete(deleteTarget.id);
    showToast(`Record ${deleteTarget.code} deleted.`);
    setDeleteTarget(null);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col" style={{ fontFamily:"'Source Sans 3', sans-serif" }}>
      <AppHeader user={user} onLogout={onLogout} crumb="RPFP / AHD / GAD Records" />

      <div className="flex-1 overflow-auto">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-6 space-y-5">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <BackButton onClick={onBack} />
                <span className="text-muted-foreground/40 text-xs select-none">·</span>
                <LayoutDashboard size={11} className="text-muted-foreground" />
                <span className="text-muted-foreground text-xs">Dashboard</span>
                <ChevronRight size={11} className="text-muted-foreground" />
                <span className="text-xs text-foreground font-semibold">All Records</span>
              </div>
              <h1 className="font-bold text-foreground" style={{ fontFamily:"'Barlow', sans-serif", fontSize:"1.3rem" }}>
                Documentation Reports — RPFP · AHD · GAD
              </h1>
              <p className="text-sm text-muted-foreground">{filtered.length} of {records.length} records</p>
            </div>
            <div className="flex items-center gap-2 print:hidden shrink-0 flex-wrap">
              <button
                onClick={() => setPreviewTarget({ mode: "summary", records: filtered,
                  filters: { cat: filterCat, month: filterMonth, district: filterDist } })}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-border bg-card text-foreground text-sm font-semibold hover:bg-accent transition-all">
                <Printer size={14} /> Print
              </button>
              <button
                onClick={() => setPreviewTarget({ mode: "summary", records: filtered,
                  filters: { cat: filterCat, month: filterMonth, district: filterDist } })}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-border bg-card text-foreground text-sm font-semibold hover:bg-accent transition-all">
                <Download size={14} /> Export PDF
              </button>
              {(["RPFP","AHD","GAD"] as Category[]).map(cat => (
                <button key={cat} onClick={() => onNewReport(cat)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold transition-all ${CONFIGS[cat].accent.chipBg} ${CONFIGS[cat].accent.chipText} hover:opacity-90 border ${CONFIGS[cat].accent.badgeBorder}`}>
                  <Plus size={13} /> {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5 print:hidden">
            {[
              { label:"Participants", value:totals.actual, color:"text-primary",   bg:"bg-primary/5",  border:"border-primary/10" },
              { label:"Male",         value:totals.male,   color:"text-blue-600",  bg:"bg-blue-50",    border:"border-blue-100"   },
              { label:"Female",       value:totals.female, color:"text-pink-600",  bg:"bg-pink-50",    border:"border-pink-100"   },
              { label:"Bracket 1",    value:totals.b1,     color:"text-amber-600", bg:"bg-amber-50",   border:"border-amber-100"  },
              { label:"Bracket 2",    value:totals.b2,     color:"text-orange-600",bg:"bg-orange-50",  border:"border-orange-100" },
              { label:"Bracket 3",    value:totals.b3,     color:"text-teal-700",  bg:"bg-teal-50",    border:"border-teal-100"   },
            ].map(({ label, value, color, bg, border }) => (
              <div key={label} className={`${bg} ${border} border rounded-lg px-3.5 py-3`}>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
                <p className={`text-2xl font-bold mt-0.5 ${color}`} style={{ fontFamily:"'JetBrains Mono', monospace" }}>{value}</p>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-2 print:hidden flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search code, barangay, municipality, encoder…"
                className="w-full pl-9 pr-4 py-2 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/50 transition-all" />
            </div>
            <div className="flex gap-2 flex-wrap">
              {/* Category filter */}
              <div className="relative">
                <select value={filterCat} onChange={e => setFilterCat(e.target.value as Category | "")}
                  className="appearance-none bg-card border border-border rounded-lg px-3 py-2 pr-7 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/50 transition-all">
                  <option value="">All Types</option>
                  <option value="RPFP">RPFP</option>
                  <option value="AHD">AHD</option>
                  <option value="GAD">GAD</option>
                </select>
                <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              </div>
              <div className="relative">
                <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)}
                  className="appearance-none bg-card border border-border rounded-lg px-3 py-2 pr-7 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/50 transition-all">
                  <option value="">All Months</option>
                  {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              </div>
              <div className="relative">
                <select value={filterDist} onChange={e => setFilterDist(e.target.value)}
                  className="appearance-none bg-card border border-border rounded-lg px-3 py-2 pr-7 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/50 transition-all">
                  <option value="">All Districts</option>
                  {["I","II","III","IV"].map(d => <option key={d} value={d}>District {d}</option>)}
                </select>
                <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border" style={{ background:"#eef0f5" }}>
                    {[
                      { h:"Type",     cls:"text-left px-3 py-3" },
                      { h:"Code",     cls:"text-left px-3 py-3" },
                      { h:"Date",     cls:"text-left px-3 py-3" },
                      { h:"Session",  cls:"text-left px-3 py-3" },
                      { h:"District", cls:"text-center px-3 py-3" },
                      { h:"Barangay", cls:"text-left px-3 py-3" },
                      { h:"Municipality", cls:"text-left px-3 py-3" },
                      { h:"Actual",   cls:"text-right px-3 py-3" },
                      { h:"M",        cls:"text-right px-3 py-3" },
                      { h:"F",        cls:"text-right px-3 py-3" },
                      { h:"B1",       cls:"text-right px-3 py-3" },
                      { h:"B2",       cls:"text-right px-3 py-3" },
                      { h:"B3",       cls:"text-right px-3 py-3" },
                      { h:"Documented By", cls:"text-left px-3 py-3" },
                      { h:"Actions",  cls:"text-center px-3 py-3 print:hidden" },
                    ].map(({ h, cls }) => (
                      <th key={h} className={`${cls} text-[10px] font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap`}
                        style={{ fontFamily:"'Barlow', sans-serif" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={16} className="py-16 text-center text-muted-foreground text-sm">
                        <FileText size={28} className="mx-auto mb-3 opacity-25" />
                        <p className="font-semibold">No records found</p>
                        <p className="text-xs mt-1 opacity-70">Adjust filters or encode a new report.</p>
                      </td>
                    </tr>
                  ) : filtered.map((rec, i) => (
                    <tr key={rec.id}
                      className={`border-b border-border last:border-0 hover:bg-accent/50 transition-colors cursor-pointer ${i % 2 === 1 ? "bg-secondary/20" : ""}`}
                      onClick={() => setViewTarget(rec)}>
                      <td className="px-3 py-3"><CategoryBadge category={rec.category} /></td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className="font-semibold text-primary text-xs" style={{ fontFamily:"'JetBrains Mono', monospace" }}>{rec.code}</span>
                      </td>
                      <td className="px-3 py-3 text-xs whitespace-nowrap font-mono">{rec.dateConduct}</td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className="text-xs text-foreground">{rec.sessionType}</span>
                      </td>
                      <td className="px-3 py-3 text-center text-xs font-bold font-mono">{rec.district}</td>
                      <td className="px-3 py-3 text-sm whitespace-nowrap">{rec.barangay}</td>
                      <td className="px-3 py-3 text-sm whitespace-nowrap">{rec.municipality}</td>
                      {[rec.actualParticipants, rec.male, rec.female, rec.ageBracket1, rec.ageBracket2, rec.ageBracket3].map((v, vi) => (
                        <td key={vi} className={`px-3 py-3 text-right text-xs font-mono ${vi === 0 ? "font-bold text-foreground" : "text-muted-foreground"}`}>{v}</td>
                      ))}
                      <td className="px-3 py-3 text-xs whitespace-nowrap">{rec.documentedBy}</td>
                      <td className="px-3 py-3 print:hidden" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-0.5">
                          <button
                            onClick={() => setPreviewTarget({ mode: "single", record: rec })}
                            className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors" title="Print preview">
                            <Printer size={13} />
                          </button>
                          <button
                            onClick={() => setPreviewTarget({ mode: "single", record: rec })}
                            className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors" title="Export PDF">
                            <Download size={13} />
                          </button>
                          <div className="w-px h-3.5 bg-border mx-0.5" />
                          <button onClick={() => onEdit(rec)}
                            className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors" title="Edit">
                            <Edit2 size={13} />
                          </button>
                          <button onClick={() => setDeleteTarget(rec)}
                            className="p-1.5 rounded hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors" title="Delete">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                {filtered.length > 0 && (
                  <tfoot>
                    <tr className="border-t-2 border-primary/20 bg-primary/5">
                      <td colSpan={7} className="px-3 py-3 text-xs font-bold uppercase tracking-widest"
                        style={{ fontFamily:"'Barlow', sans-serif" }}>Total</td>
                      {[totals.actual, totals.male, totals.female, totals.b1, totals.b2, totals.b3].map((v, i) => (
                        <td key={i} className="px-3 py-3 text-right text-xs font-bold font-mono">{v}</td>
                      ))}
                      <td colSpan={2} />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* ── View detail modal ── */}
      {viewTarget && (() => {
        const cfg = CONFIGS[viewTarget.category];
        const ac  = cfg.accent;
        return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto"
            onClick={() => setViewTarget(null)}>
            <div className="bg-card rounded-xl border border-border shadow-2xl w-full max-w-2xl my-4 overflow-hidden"
              onClick={e => e.stopPropagation()}>
              <div className={`${ac.headerBg} px-6 py-3 flex items-center justify-between`}>
                <div className="flex items-center gap-3">
                  <span className="bg-white/25 text-white text-xs font-bold px-2.5 py-1 rounded tracking-widest font-mono">{viewTarget.category}</span>
                  <span className="text-white font-semibold text-sm">{viewTarget.code}</span>
                </div>
                <button onClick={() => setViewTarget(null)} className="text-white/70 hover:text-white transition-colors p-1"><X size={16} /></button>
              </div>
              <div className="px-6 py-5 space-y-5 overflow-y-auto max-h-[65vh] text-sm">
                <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
                  {[
                    ["Municipality / City", viewTarget.municipality],
                    ["Barangay",            viewTarget.barangay],
                    ["District",            `District ${viewTarget.district}`],
                    ["Venue",               viewTarget.venue],
                    [cfg.sessionTypeLabel,  viewTarget.sessionType],
                    ["Date Conducted",      viewTarget.dateConduct],
                    ["Report Period",       `${viewTarget.reportMonth} ${viewTarget.reportYear}`],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <dt className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{k}</dt>
                      <dd className="text-foreground font-medium mt-0.5">{v}</dd>
                    </div>
                  ))}
                </dl>
                <div className="h-px bg-border" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Participants' Profile</p>
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                    {[
                      { label:"Target", value:viewTarget.targetParticipants },
                      { label:"Actual", value:viewTarget.actualParticipants },
                      { label:"Male",   value:viewTarget.male },
                      { label:"Female", value:viewTarget.female },
                      ...cfg.ageBrackets.map((ab, i) => ({
                        label: ab.label.split(" ")[0],
                        value: [viewTarget.ageBracket1, viewTarget.ageBracket2, viewTarget.ageBracket3][i],
                      })),
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-muted rounded-lg px-2 py-2 text-center">
                        <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-wide leading-tight">{label}</p>
                        <p className="font-bold text-base font-mono text-foreground">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Activities Undertaken</p>
                  <div className="space-y-1">
                    {cfg.activityKeys.filter(k => viewTarget.activities[k]).map(k => (
                      <div key={k} className="flex items-start gap-3 py-0.5">
                        <CheckCircle size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold text-foreground">{cfg.activityLabels[k]}</span>
                          {viewTarget.personsResponsible[k] && (
                            <span className="text-muted-foreground ml-2 text-xs">— {viewTarget.personsResponsible[k]}</span>
                          )}
                        </div>
                      </div>
                    ))}
                    {cfg.activityKeys.every(k => !viewTarget.activities[k]) && (
                      <p className="text-muted-foreground text-xs italic">No activities checked.</p>
                    )}
                  </div>
                </div>
                {viewTarget.remarks && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Remarks</p>
                    <p className="text-foreground leading-relaxed">{viewTarget.remarks}</p>
                  </div>
                )}
                <div className="h-px bg-border" />
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label:"Documented by", value:viewTarget.documentedBy, sub:viewTarget.dateDocumented },
                    { label:"Reviewed by",   value:viewTarget.reviewedBy },
                    { label:"Approved by",   value:viewTarget.approvedBy },
                  ].map(({ label, value, sub }) => (
                    <div key={label} className="text-center border-t-2 border-foreground/20 pt-3">
                      <p className="font-semibold text-foreground text-sm">{value}</p>
                      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
                      <p className="text-[10px] text-muted-foreground mt-2 uppercase tracking-widest">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-between items-center px-6 py-4 border-t border-border bg-secondary/20 print:hidden">
                <div className="flex gap-2">
                  <button
                    onClick={() => { setPreviewTarget({ mode: "single", record: viewTarget }); setViewTarget(null); }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm font-semibold hover:bg-accent transition-all">
                    <Printer size={13} /> Print
                  </button>
                  <button
                    onClick={() => { setPreviewTarget({ mode: "single", record: viewTarget }); setViewTarget(null); }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm font-semibold hover:bg-accent transition-all">
                    <Download size={13} /> Export PDF
                  </button>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { onEdit(viewTarget); setViewTarget(null); }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border text-sm font-semibold hover:bg-accent transition-all">
                    <Edit2 size={13} /> Edit
                  </button>
                  <button onClick={() => setViewTarget(null)}
                    className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-all">
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Delete modal ── */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setDeleteTarget(null)}>
          <div className="bg-card rounded-xl border border-border shadow-2xl w-full max-w-[420px] p-6 space-y-5"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <AlertTriangle size={18} className="text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-foreground" style={{ fontFamily:"'Barlow', sans-serif" }}>Delete Record</h3>
                <p className="text-sm text-muted-foreground mt-1 leading-snug">
                  Permanently delete <span className="font-mono font-semibold text-foreground">{deleteTarget.code}</span>? This cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-lg border border-border text-sm font-semibold hover:bg-accent transition-all">Cancel</button>
              <button onClick={confirmDelete}
                className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-all">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Print Preview Modal ── */}
      {previewTarget && (
        <PrintPreviewModal
          target={previewTarget}
          onClose={() => setPreviewTarget(null)}
          onToast={showToast} />
      )}

      {toast && (
        <div className="fixed bottom-5 right-5 flex items-center gap-2.5 px-4 py-3 bg-emerald-600 text-white text-sm font-semibold rounded-lg shadow-lg z-50">
          <CheckCircle size={15} /> {toast}
        </div>
      )}
    </div>
  );
}

// ─── MONTHLY SUMMARY ──────────────────────────────────────────────────────────

function MonthlySummaryView({ user, onLogout, records, onBack }: {
  user: string; onLogout: () => void; records: DocRecord[]; onBack: () => void;
}) {
  const now = new Date();
  const [category, setCategory]       = useState<Category>("AHD");
  const [selMonth, setSelMonth]        = useState(MONTHS[now.getMonth()]);
  const [selYear, setSelYear]          = useState(String(now.getFullYear()));
  const [previewTarget, setPreviewTarget] = useState<PreviewTarget | null>(null);
  const [toast, setToast]              = useState("");

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const cfg        = MATRIX_CFG[category];
  const accentCfg  = CONFIGS[category].accent;
  const accentCls  = { RPFP: "text-teal-600", AHD: "text-orange-600", GAD: "text-violet-600" }[category];
  const accentMark = { RPFP: "bg-teal-100 text-teal-700", AHD: "bg-orange-100 text-orange-700", GAD: "bg-violet-100 text-violet-700" }[category];
  const districts  = ["I", "II", "III", "IV"];
  const years      = Array.from(new Set(records.map(r => r.reportYear))).sort().reverse();
  if (!years.includes(selYear)) years.unshift(selYear);

  const filtered = useMemo(() =>
    records
      .filter(r => r.category === category && r.reportMonth === selMonth && r.reportYear === selYear)
      .sort((a, b) => a.dateConduct.localeCompare(b.dateConduct)),
    [records, category, selMonth, selYear]
  );

  const totals = useMemo(() => ({
    type: cfg.typeColumns.map(tc => filtered.filter(r => r.sessionType === tc).length),
    dist: districts.map(d => filtered.filter(r => r.district === d).length),
    male:   filtered.reduce((s, r) => s + r.male, 0),
    female: filtered.reduce((s, r) => s + r.female, 0),
    pax:    filtered.reduce((s, r) => s + (parseInt(r.actualParticipants) || 0), 0),
    b1:     filtered.reduce((s, r) => s + r.ageBracket1, 0),
    b2:     filtered.reduce((s, r) => s + r.ageBracket2, 0),
    b3:     filtered.reduce((s, r) => s + r.ageBracket3, 0),
  }), [filtered, cfg, districts]);

  const openMatrix = () => setPreviewTarget({ mode: "matrix", records: filtered, category, month: selMonth, year: selYear });

  const catTabStyle = (c: Category) => {
    const active = c === category;
    const base = "px-4 py-1.5 text-xs font-bold rounded-lg transition-all border";
    if (!active) return `${base} border-border text-muted-foreground hover:bg-accent`;
    const map: Record<Category, string> = {
      RPFP: `${base} bg-teal-600 text-white border-teal-600`,
      AHD:  `${base} bg-orange-500 text-white border-orange-500`,
      GAD:  `${base} bg-violet-600 text-white border-violet-600`,
    };
    return map[c];
  };

  // sticky column style helpers
  const stickyLeft0 = "sticky left-0 z-10 bg-card";
  const stickyLeft8 = "sticky left-8 z-10 bg-card";

  return (
    <div className="min-h-screen bg-background flex flex-col" style={{ fontFamily: "'Source Sans 3', sans-serif" }}>
      <AppHeader user={user} onLogout={onLogout} crumb="Monthly Summary" />

      <div className="flex-1 overflow-auto">
        <div className="max-w-full px-4 sm:px-6 py-6 space-y-5">

          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-3">
            <BackButton onClick={onBack} />
            <div className="h-4 w-px bg-border mx-1" />
            <h1 className="text-base font-bold text-foreground" style={{ fontFamily: "'Barlow', sans-serif" }}>
              Monthly Summary
            </h1>
            <div className="flex-1" />
            <button onClick={openMatrix}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-sm font-semibold text-foreground hover:bg-accent transition-all">
              <Printer size={13} /> Print / Export PDF
            </button>
          </div>

          {/* Controls */}
          <div className="bg-card border border-border rounded-xl p-4 flex flex-wrap items-center gap-4">
            {/* Category tabs */}
            <div className="flex items-center gap-2">
              {(["RPFP", "AHD", "GAD"] as Category[]).map(c => (
                <button key={c} onClick={() => setCategory(c)} className={catTabStyle(c)}
                  style={{ fontFamily: "'Barlow', sans-serif" }}>{c}</button>
              ))}
            </div>
            <div className="h-6 w-px bg-border" />
            {/* Month */}
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground font-medium">Month</label>
              <div className="relative">
                <select value={selMonth} onChange={e => setSelMonth(e.target.value)}
                  className="appearance-none pl-3 pr-7 py-1.5 bg-input-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 transition-all">
                  {MONTHS.map(m => <option key={m}>{m}</option>)}
                </select>
                <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              </div>
            </div>
            {/* Year */}
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground font-medium">Year</label>
              <div className="relative">
                <select value={selYear} onChange={e => setSelYear(e.target.value)}
                  className="appearance-none pl-3 pr-7 py-1.5 bg-input-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 transition-all">
                  {years.map(y => <option key={y}>{y}</option>)}
                </select>
                <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              </div>
            </div>
            <div className="ml-auto text-xs text-muted-foreground font-medium">
              {filtered.length} record{filtered.length !== 1 ? "s" : ""} · {selMonth} {selYear}
            </div>
          </div>

          {/* Matrix table */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="text-xs border-collapse w-full" style={{ minWidth: "900px" }}>
                <thead>
                  {/* Row 1 — group labels */}
                  <tr className="bg-primary text-primary-foreground">
                    <th rowSpan={2} className={`border border-white/20 px-2 py-2 text-center font-bold w-8 ${stickyLeft0}`}
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}>#</th>
                    <th rowSpan={2} className={`border border-white/20 px-2 py-2 text-center font-bold w-20 ${stickyLeft8}`}>
                      Date of Conduct
                    </th>
                    <th colSpan={cfg.typeColumns.length}
                      className="border border-white/20 px-2 py-2 text-center font-bold"
                      style={{ background: category === "RPFP" ? "#0d9488" : category === "AHD" ? "#ea580c" : "#7c3aed" }}>
                      Type of Conduct
                    </th>
                    <th colSpan={4} className="border border-white/20 px-2 py-2 text-center font-bold">District</th>
                    <th rowSpan={2} className="border border-white/20 px-2 py-2 text-center font-bold">Barangay</th>
                    <th rowSpan={2} className="border border-white/20 px-2 py-2 text-center font-bold">Municipality</th>
                    <th rowSpan={2} className="border border-white/20 px-2 py-2 text-center font-bold w-9">M</th>
                    <th rowSpan={2} className="border border-white/20 px-2 py-2 text-center font-bold w-9">F</th>
                    <th rowSpan={2} className="border border-white/20 px-2 py-2 text-center font-bold w-12">Total</th>
                    <th colSpan={3} className="border border-white/20 px-2 py-2 text-center font-bold">Age Bracket</th>
                    <th rowSpan={2} className="border border-white/20 px-2 py-2 text-center font-bold">Documented By</th>
                  </tr>
                  {/* Row 2 — sub-columns */}
                  <tr className="bg-primary/90 text-primary-foreground text-[10px]">
                    {cfg.typeLabels.map(l => (
                      <th key={l} className="border border-white/20 px-1 py-1.5 text-center font-semibold"
                        style={{ background: category === "RPFP" ? "#0a7c72" : category === "AHD" ? "#c2410c" : "#6d28d9" }}>
                        {l}
                      </th>
                    ))}
                    {districts.map(d => (
                      <th key={d} className="border border-white/20 px-1 py-1.5 text-center font-semibold w-12">Dist. {d}</th>
                    ))}
                    {cfg.ageBrackets.map(a => (
                      <th key={a} className="border border-white/20 px-1 py-1.5 text-center font-semibold">{a}</th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={3 + cfg.typeColumns.length + 4 + cfg.ageBrackets.length + 4}
                        className="border border-border py-10 text-center text-muted-foreground italic">
                        No reports encoded for {selMonth} {selYear} · {category}
                      </td>
                    </tr>
                  ) : filtered.map((r, i) => {
                    const pax = parseInt(r.actualParticipants) || 0;
                    return (
                      <tr key={r.id} className={i % 2 === 1 ? "bg-background/60" : "bg-card"}>
                        <td className={`border border-border px-2 py-1.5 text-center text-muted-foreground font-mono ${stickyLeft0}`}>{i + 1}</td>
                        <td className={`border border-border px-2 py-1.5 text-center font-mono text-[10px] whitespace-nowrap ${stickyLeft8}`}>{r.dateConduct}</td>
                        {cfg.typeColumns.map(tc => (
                          <td key={tc} className="border border-border px-1 py-1.5 text-center">
                            {r.sessionType === tc
                              ? <span className={`inline-block w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center ${accentMark}`}>1</span>
                              : ""}
                          </td>
                        ))}
                        {districts.map(d => (
                          <td key={d} className="border border-border px-1 py-1.5 text-center">
                            {r.district === d
                              ? <span className="inline-block w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center bg-primary/10 text-primary">1</span>
                              : ""}
                          </td>
                        ))}
                        <td className="border border-border px-2 py-1.5 text-left text-[11px]">{r.barangay}</td>
                        <td className="border border-border px-2 py-1.5 text-left text-[11px]">{r.municipality}</td>
                        <td className="border border-border px-2 py-1.5 text-right font-mono">{r.male}</td>
                        <td className="border border-border px-2 py-1.5 text-right font-mono">{r.female}</td>
                        <td className="border border-border px-2 py-1.5 text-right font-mono font-semibold">{pax}</td>
                        <td className="border border-border px-2 py-1.5 text-right font-mono">{r.ageBracket1}</td>
                        <td className="border border-border px-2 py-1.5 text-right font-mono">{r.ageBracket2}</td>
                        <td className="border border-border px-2 py-1.5 text-right font-mono">{r.ageBracket3}</td>
                        <td className="border border-border px-2 py-1.5 text-left text-[11px]">{r.documentedBy}</td>
                      </tr>
                    );
                  })}
                </tbody>

                {/* Totals footer */}
                <tfoot>
                  <tr className="bg-primary/8 font-bold text-foreground">
                    <td colSpan={2} className={`border border-border px-2 py-2 text-right text-[10px] uppercase tracking-wider text-muted-foreground ${stickyLeft0}`}
                      style={{ minWidth: "104px" }}>Total</td>
                    {totals.type.map((v, i) => (
                      <td key={i} className={`border border-border px-1 py-2 text-center font-mono ${accentCls}`}>{v > 0 ? v : "—"}</td>
                    ))}
                    {totals.dist.map((v, i) => (
                      <td key={i} className="border border-border px-1 py-2 text-center font-mono text-primary">{v > 0 ? v : "—"}</td>
                    ))}
                    <td className="border border-border px-2 py-2" />
                    <td className="border border-border px-2 py-2" />
                    <td className="border border-border px-2 py-2 text-right font-mono">{totals.male}</td>
                    <td className="border border-border px-2 py-2 text-right font-mono">{totals.female}</td>
                    <td className="border border-border px-2 py-2 text-right font-mono text-primary">{totals.pax}</td>
                    <td className="border border-border px-2 py-2 text-right font-mono">{totals.b1}</td>
                    <td className="border border-border px-2 py-2 text-right font-mono">{totals.b2}</td>
                    <td className="border border-border px-2 py-2 text-right font-mono">{totals.b3}</td>
                    <td className="border border-border px-2 py-2" />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

        </div>
      </div>

      {previewTarget && (
        <PrintPreviewModal target={previewTarget} onClose={() => setPreviewTarget(null)} onToast={showToast} />
      )}

      {toast && (
        <div className="fixed bottom-5 right-5 flex items-center gap-2.5 px-4 py-3 bg-emerald-600 text-white text-sm font-semibold rounded-lg shadow-lg z-50">
          <CheckCircle size={15} /> {toast}
        </div>
      )}
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────

type View = "login" | "dashboard" | "doc-form" | "records" | "monthly-summary";

export default function App() {
  const [user, setUser]   = useState<string | null>(null);
  const [role, setRole]   = useState("");
  const [view, setView]   = useState<View>("login");
  const [activeCategory, setActiveCategory] = useState<Category>("RPFP");
  const [records, setRecords] = useState<DocRecord[]>(INITIAL_RECORDS);
  const [editRecord, setEditRecord] = useState<DocRecord | null>(null);
  const [nextIds, setNextIds] = useState<Record<Category, number>>({ RPFP: 2, AHD: 2, GAD: 2 });
  const [formSource, setFormSource]           = useState<View>("dashboard");
  const [recordsInitialMonth, setRecordsInitialMonth] = useState("");

  const logout = () => { setUser(null); setRole(""); setView("login"); setEditRecord(null); };

  const openForm = (cat: Category, rec?: DocRecord | null, from: View = "dashboard") => {
    setActiveCategory(cat);
    setEditRecord(rec ?? null);
    setFormSource(from);
    setView("doc-form");
  };

  const handleSubmit = (data: FormState) => {
    if (editRecord) {
      setRecords(prev => prev.map(r => r.id === editRecord.id ? { ...editRecord, ...data } : r));
    } else {
      const n   = nextIds[data.category];
      const code = `${data.category}-${data.reportYear}-${String(n).padStart(3, "0")}`;
      setRecords(prev => [...prev, { id: Date.now(), code, status: "Pending", ...data }]);
      setNextIds(prev => ({ ...prev, [data.category]: n + 1 }));
    }
    setEditRecord(null);
    setView("records");
  };

  if (!user) return <LoginView onLogin={(name, r) => { setUser(name); setRole(r); setView("dashboard"); }} />;

  if (view === "monthly-summary") return (
    <MonthlySummaryView user={user} onLogout={logout} records={records}
      onBack={() => setView("dashboard")} />
  );

  if (view === "dashboard") return (
    <DashboardView user={user} role={role} onLogout={logout} records={records}
      onEncode={cat => openForm(cat)}
      onViewRecords={() => { setRecordsInitialMonth(""); setView("records"); }}
      onViewRecordsForMonth={month => { setRecordsInitialMonth(month); setView("records"); }}
      onViewMonthlySummary={() => setView("monthly-summary")} />
  );

  if (view === "doc-form") return (
    <DocFormView
      category={activeCategory}
      user={user} onLogout={logout}
      onSubmit={handleSubmit}
      onCancel={() => setView(formSource)}
      onBack={() => setView(formSource)}
      editRecord={editRecord} />
  );

  return (
    <RecordsView
      user={user} onLogout={logout} records={records}
      onEdit={rec => openForm(rec.category, rec, "records")}
      onDelete={id => setRecords(prev => prev.filter(r => r.id !== id))}
      onNewReport={cat => openForm(cat, null, "records")}
      onBack={() => setView("dashboard")}
      initialFilterMonth={recordsInitialMonth} />
  );
}
