import React, { useState, useEffect, useMemo } from "react";
import { LogIn, LogOut, Plus, Trash2, Pencil, Printer, FileDown, AlertTriangle, Users, ClipboardList, ChevronRight, X } from "lucide-react";

/* ---------- Reference data (inferred from OPPO's March 2025 tracking table — edit MUNI_DISTRICT if the office's official grouping differs) ---------- */
const MUNI_DISTRICT = {
  "Cavite City": "I", "Kawit": "I", "Noveleta": "I", "Rosario": "I", "Bacoor": "I",
  "Naic": "II", "Tanza": "II", "Trece Martires City": "II", "Dasmariñas": "II", "General Trias": "II", "Imus": "II",
  "Mendez": "III", "Amadeo": "III", "Alfonso": "III", "Tagaytay": "III", "General Emilio Aguinaldo": "III", "Magallanes": "III", "Maragondon": "III", "Ternate": "III",
  "GMA": "IV", "Indang": "IV", "Silang": "IV", "Carmona": "IV",
};
const MUNICIPALITIES = Object.keys(MUNI_DISTRICT).sort();
const BARANGAY_HINTS = {
  "Trece Martires City": ["Cabuco", "San Agustin", "Aguado", "Osorio", "Cabezas"],
  "Naic": ["Timalan Balsahan", "Ibayo Silangan"],
  "Dasmariñas": ["Burol"],
  "General Trias": ["Pasong Camachile II", "Buenavista"],
  "GMA": ["Poblacion I", "Poblacion"],
  "Indang": ["Poblacion", "Barangay IV"],
  "Tanza": ["Poblacion", "Daang Amaya"],
  "Mendez": ["Poblacion II", "Galicia II"],
  "Amadeo": ["Poblacion"],
  "Cavite City": ["Sta. Cruz", "San Antonio", "San Roque"],
  "Rosario": ["Muzon", "Ligtong"],
  "Noveleta": ["Poblacion I", "Poblacion"],
};

const CIVIL_STATUS = { 1: "Married", 2: "Single", 3: "Widow/Widower", 4: "Separated", 5: "Live-in" };
const EDUCATION = { 1: "No Education", 2: "Elementary Level", 3: "Elementary Graduate", 4: "High School Level", 5: "High School Graduate", 6: "Vocational", 7: "College Level", 8: "College Graduate", 9: "Post Graduate" };
const MODERN_METHOD = { 1: "Condom", 2: "IUD", 3: "Pills", 4: "Injectable", 5: "Vasectomy", 6: "Tubal Ligation", 7: "Implant", 8: "CMM/Billings", 9: "BBT", 10: "Sympto-Thermal", 11: "SDM", 12: "LAM" };
const TRAD_TYPE = { 1: "Withdrawal", 2: "Rhythm", 3: "Calendar", 4: "Abstinence", 5: "Herbal", 6: "No Method" };
const TRAD_STATUS = { A: "Expressing Intention to Use Modern FP", B: "Undecided", C: "Currently Pregnant", D: "No Intention to Use" };
const REASON = { 1: "Spacing", 2: "Limiting", 3: "Achieving" };

const ROLES = ["Field Encoder", "Technical Services Reviewer", "OPPO Approver", "Admin"];
const ACTIVITIES_LIST = ["Registration", "Opening Remarks", "Seminar Proper", "One-on-One Counseling/Interview", "Closing Remarks", "Evaluation", "Referrals"];

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const emptyParticipant = () => ({ id: crypto.randomUUID(), name: "", sex: "F", civilStatus: "2", birthdate: "", address: "", education: "4", children: "0", modernMethod: "", intentionShift: "", tradType: "", tradStatus: "", reason: "", signed: false });

function ageFromBirthdate(bd) {
  if (!bd) return null;
  const b = new Date(bd);
  if (isNaN(b)) return null;
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
  return age;
}
function bracket(age) {
  if (age == null) return null;
  if (age <= 14) return "10-14";
  if (age <= 19) return "15-19";
  return "20+";
}

function computeAggregate(record) {
  if (record.type === "Profiling") {
    let male = 0, female = 0, b1 = 0, b2 = 0, b3 = 0;
    record.participants.forEach((p) => {
      if (p.sex === "M") male++; else if (p.sex === "F") female++;
      const br = bracket(ageFromBirthdate(p.birthdate));
      if (br === "10-14") b1++; else if (br === "15-19") b2++; else if (br === "20+") b3++;
    });
    return { male, female, total: male + female, b1, b2, b3, bTotal: b1 + b2 + b3 };
  }
  const male = Number(record.actualMale || 0), female = Number(record.actualFemale || 0);
  const b1 = Number(record.age1014 || 0), b2 = Number(record.age1519 || 0), b3 = Number(record.age20plus || 0);
  return { male, female, total: male + female, b1, b2, b3, bTotal: b1 + b2 + b3 };
}

/* ---------- Storage helpers ----------
   Uses the browser's localStorage (per-browser only). For a real shared office
   deployment where every staff member sees the same records, replace these two
   functions with calls to your backend/database instead. */
const STORAGE_KEY = "pulse:records";
async function loadRecords() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}
async function saveRecords(records) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(records)); } catch (e) { console.error(e); }
}

export default function PulseApp() {
  const [user, setUser] = useState(null);
  const [loginForm, setLoginForm] = useState({ name: "", role: ROLES[0] });
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("dashboard"); // dashboard | new | edit
  const [editId, setEditId] = useState(null);
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth());
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    loadRecords().then((r) => { setRecords(r); setLoading(false); });
  }, []);

  function flash(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  async function persist(next) {
    setRecords(next);
    await saveRecords(next);
  }

  function handleLogin(e) {
    e.preventDefault();
    if (!loginForm.name.trim()) return;
    setUser({ name: loginForm.name.trim(), role: loginForm.role });
  }

  function nextCode(month, year) {
    const inMonth = records.filter((r) => {
      const d = new Date(r.date);
      return d.getMonth() === month && d.getFullYear() === year;
    });
    return inMonth.length + 1;
  }

  function checkDuplicate(record, excludeId) {
    return records.some((r) => r.id !== excludeId && r.date === record.date && r.barangay === record.barangay && r.municipality === record.municipality && r.type === record.type);
  }

  async function submitRecord(record) {
    const isDup = checkDuplicate(record, record.id);
    if (isDup && !record._confirmedDuplicate) {
      setDuplicateWarning(record);
      return;
    }
    const d = new Date(record.date);
    let next;
    if (editId) {
      next = records.map((r) => (r.id === editId ? { ...record, code: r.code } : r));
      flash("Record updated.");
    } else {
      const code = nextCode(d.getMonth(), d.getFullYear());
      next = [...records, { ...record, code, id: crypto.randomUUID() }];
      flash("Activity saved.");
    }
    await persist(next);
    setFilterMonth(d.getMonth());
    setFilterYear(d.getFullYear());
    setEditId(null);
    setDuplicateWarning(null);
    setView("dashboard");
  }

  async function deleteRecord(id) {
    await persist(records.filter((r) => r.id !== id));
    flash("Record deleted.");
  }

  const monthRecords = useMemo(
    () => records.filter((r) => {
      const d = new Date(r.date);
      return d.getMonth() === filterMonth && d.getFullYear() === filterYear;
    }).sort((a, b) => a.code - b.code),
    [records, filterMonth, filterYear]
  );

  if (!user) return <LoginScreen loginForm={loginForm} setLoginForm={setLoginForm} onSubmit={handleLogin} />;

  return (
    <div style={{ fontFamily: "'IBM Plex Sans', system-ui, sans-serif", background: "#EEF2F6", minHeight: "100%", color: "#1B2A3A" }}>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-area { box-shadow: none !important; }
        }
        table { border-collapse: collapse; }
        th, td { border: 1px solid #C7D2DE; }
      `}</style>

      <header className="no-print" style={{ background: "#0B3B60", color: "white", padding: "14px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: "#F2A93B", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#0B3B60" }}>P+</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, letterSpacing: 0.3 }}>PULSE+ System</div>
            <div style={{ fontSize: 11, opacity: 0.8 }}>Office of the Provincial Population Officer — Cavite</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ fontSize: 13, opacity: 0.9 }}>{user.name} · {user.role}</span>
          <button onClick={() => setUser(null)} style={btnGhostLight}><LogOut size={14} style={{ marginRight: 5 }} />Log out</button>
        </div>
      </header>

      <nav className="no-print" style={{ background: "white", borderBottom: "1px solid #DCE3EC", padding: "0 24px", display: "flex", gap: 4 }}>
        <TabButton active={view === "dashboard"} onClick={() => { setView("dashboard"); setEditId(null); }} icon={<ClipboardList size={15} />} label="Monthly Records" />
        <TabButton active={view === "new"} onClick={() => { setView("new"); setEditId(null); }} icon={<Plus size={15} />} label="New Activity" />
      </nav>

      {toast && <div style={{ position: "fixed", top: 78, right: 24, background: "#0B3B60", color: "white", padding: "10px 16px", borderRadius: 8, fontSize: 13, zIndex: 50, boxShadow: "0 4px 14px rgba(0,0,0,0.2)" }}>{toast}</div>}

      <main style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "#5C7089" }}>Loading records…</div>
        ) : view === "dashboard" ? (
          <Dashboard
            monthRecords={monthRecords}
            filterMonth={filterMonth} setFilterMonth={setFilterMonth}
            filterYear={filterYear} setFilterYear={setFilterYear}
            onEdit={(r) => { setEditId(r.id); setView("edit"); }}
            onDelete={deleteRecord}
          />
        ) : (
          <ActivityForm
            key={editId || "new"}
            existing={editId ? records.find((r) => r.id === editId) : null}
            onCancel={() => { setView("dashboard"); setEditId(null); }}
            onSubmit={submitRecord}
            user={user}
          />
        )}
      </main>

      {duplicateWarning && (
        <DuplicateModal
          onCancel={() => setDuplicateWarning(null)}
          onConfirm={() => submitRecord({ ...duplicateWarning, _confirmedDuplicate: true })}
        />
      )}
    </div>
  );
}

/* ---------------- Login ---------------- */
function LoginScreen({ loginForm, setLoginForm, onSubmit }) {
  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg,#0B3B60 0%,#12507F 55%,#0B3B60 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'IBM Plex Sans', system-ui, sans-serif", padding: 20 }}>
      <form onSubmit={onSubmit} style={{ background: "white", borderRadius: 14, padding: 36, width: 380, boxShadow: "0 20px 60px rgba(0,0,0,0.35)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <div style={{ width: 38, height: 38, borderRadius: 9, background: "#F2A93B", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#0B3B60" }}>P+</div>
          <div style={{ fontWeight: 700, fontSize: 18, color: "#0B3B60" }}>PULSE+ System</div>
        </div>
        <div style={{ fontSize: 12.5, color: "#5C7089", marginBottom: 22, lineHeight: 1.5 }}>
          Office of the Provincial Population Officer — Cavite. Access is restricted to authorized government personnel only.
        </div>
        <label style={labelStyle}>Full name</label>
        <input required value={loginForm.name} onChange={(e) => setLoginForm({ ...loginForm, name: e.target.value })} style={inputStyle} placeholder="e.g. Ariel Jarin" />
        <label style={labelStyle}>Role</label>
        <select value={loginForm.role} onChange={(e) => setLoginForm({ ...loginForm, role: e.target.value })} style={inputStyle}>
          {ROLES.map((r) => <option key={r}>{r}</option>)}
        </select>
        <button type="submit" style={{ ...btnPrimary, width: "100%", justifyContent: "center", marginTop: 18 }}>
          <LogIn size={15} style={{ marginRight: 6 }} /> Log in
        </button>
        <div style={{ fontSize: 11, color: "#9AA8BB", marginTop: 14, textAlign: "center" }}>Authorized personnel only · all activity is logged</div>
      </form>
    </div>
  );
}

/* ---------------- Dashboard ---------------- */
function Dashboard({ monthRecords, filterMonth, setFilterMonth, filterYear, setFilterYear, onEdit, onDelete }) {
  return (
    <div className="print-area" style={{ background: "white", borderRadius: 12, padding: 24, boxShadow: "0 1px 3px rgba(11,59,96,0.08)" }}>
      <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <select value={filterMonth} onChange={(e) => setFilterMonth(Number(e.target.value))} style={selectSmall}>
            {MONTHS.map((m, i) => <option value={i} key={m}>{m}</option>)}
          </select>
          <select value={filterYear} onChange={(e) => setFilterYear(Number(e.target.value))} style={selectSmall}>
            {[filterYear - 1, filterYear, filterYear + 1].map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => window.print()} style={btnGhost}><Printer size={14} style={{ marginRight: 6 }} />Print</button>
          <button onClick={() => window.print()} style={btnGhost}><FileDown size={14} style={{ marginRight: 6 }} />Export to PDF</button>
        </div>
      </div>

      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 16, color: "#0B3B60" }}>RPFP / PROFILING {filterYear}</div>
        <div style={{ fontWeight: 700, fontSize: 14, letterSpacing: 1, color: "#0B3B60" }}>{MONTHS[filterMonth].toUpperCase()}</div>
      </div>

      {monthRecords.length === 0 ? (
        <div style={{ textAlign: "center", padding: 50, color: "#9AA8BB" }}>
          <Users size={30} style={{ marginBottom: 10, opacity: 0.5 }} />
          <div>No activities recorded for {MONTHS[filterMonth]} {filterYear} yet.</div>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", fontSize: 12.5 }}>
            <thead>
              <tr style={{ background: "#EEF2F6" }}>
                <Th>Code</Th><Th>Date</Th><Th>Profiling</Th><Th>Seminar</Th><Th>District</Th><Th>Barangay</Th><Th>Municipality/City</Th>
                <Th>Male</Th><Th>Female</Th><Th>Total</Th><Th>10-14</Th><Th>15-19</Th><Th>20+</Th><Th>Age Total</Th><Th>Documented By</Th>
                <Th className="no-print">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {monthRecords.map((r) => {
                const agg = computeAggregate(r);
                return (
                  <tr key={r.id}>
                    <Td>{r.code}</Td>
                    <Td>{new Date(r.date).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })}</Td>
                    <Td center>{r.type === "Profiling" ? "1" : ""}</Td>
                    <Td center>{r.type === "Seminar" ? "1" : ""}</Td>
                    <Td center>{r.district}</Td>
                    <Td>{r.barangay}</Td>
                    <Td>{r.municipality}</Td>
                    <Td center>{agg.male}</Td>
                    <Td center>{agg.female}</Td>
                    <Td center>{agg.total}</Td>
                    <Td center>{agg.b1}</Td>
                    <Td center>{agg.b2}</Td>
                    <Td center>{agg.b3}</Td>
                    <Td center>{agg.bTotal}</Td>
                    <Td>{r.documentedBy}</Td>
                    <Td className="no-print" center>
                      <button onClick={() => onEdit(r)} style={iconBtn}><Pencil size={13} /></button>
                      <button onClick={() => { if (confirm("Delete this record? This cannot be undone.")) onDelete(r.id); }} style={{ ...iconBtn, color: "#C0392B" }}><Trash2 size={13} /></button>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
function Th({ children, className }) { return <th className={className} style={{ padding: "8px 10px", textAlign: "left", fontWeight: 600, color: "#3D5066", whiteSpace: "nowrap" }}>{children}</th>; }
function Td({ children, center, className }) { return <td className={className} style={{ padding: "7px 10px", textAlign: center ? "center" : "left", whiteSpace: "nowrap" }}>{children}</td>; }

/* ---------------- Duplicate modal ---------------- */
function DuplicateModal({ onCancel, onConfirm }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(11,20,30,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
      <div style={{ background: "white", borderRadius: 12, padding: 26, width: 380 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 14 }}>
          <AlertTriangle size={22} color="#C0872B" />
          <div>
            <div style={{ fontWeight: 700, color: "#1B2A3A" }}>Possible duplicate entry</div>
            <div style={{ fontSize: 13, color: "#5C7089", marginTop: 4 }}>An activity of the same type already exists for this barangay and date. Save anyway?</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={onCancel} style={btnGhost}>Cancel</button>
          <button onClick={onConfirm} style={btnPrimary}>Save Anyway</button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Activity Form (Profiling or Seminar) ---------------- */
function ActivityForm({ existing, onCancel, onSubmit, user }) {
  const [type, setType] = useState(existing?.type || "Profiling");
  const [municipality, setMunicipality] = useState(existing?.municipality || "");
  const [barangay, setBarangay] = useState(existing?.barangay || "");
  const [date, setDate] = useState(existing?.date || "");
  const [classNo, setClassNo] = useState(existing?.classNo || "N/A");
  const [participants, setParticipants] = useState(existing?.participants || [emptyParticipant()]);

  const [venue, setVenue] = useState(existing?.venue || "");
  const [targetMale, setTargetMale] = useState(existing?.targetMale || "");
  const [targetFemale, setTargetFemale] = useState(existing?.targetFemale || "");
  const [actualMale, setActualMale] = useState(existing?.actualMale || "");
  const [actualFemale, setActualFemale] = useState(existing?.actualFemale || "");
  const [age1014, setAge1014] = useState(existing?.age1014 || "");
  const [age1519, setAge1519] = useState(existing?.age1519 || "");
  const [age20plus, setAge20plus] = useState(existing?.age20plus || "");
  const [speakers, setSpeakers] = useState(existing?.speakers || [""]);
  const [topics, setTopics] = useState(existing?.topics || [""]);
  const [activitiesUndertaken, setActivitiesUndertaken] = useState(existing?.activitiesUndertaken || []);
  const [remarks, setRemarks] = useState(existing?.remarks || "");
  const [personsResponsible, setPersonsResponsible] = useState(existing?.personsResponsible || "");

  const district = MUNI_DISTRICT[municipality] || "";
  const barangayOptions = BARANGAY_HINTS[municipality] || [];

  function updateParticipant(id, field, value) {
    setParticipants((ps) => ps.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  }
  function addParticipant() { setParticipants((ps) => [...ps, emptyParticipant()]); }
  function removeParticipant(id) { setParticipants((ps) => ps.filter((p) => p.id !== id)); }

  function toggleActivity(a) {
    setActivitiesUndertaken((list) => list.includes(a) ? list.filter((x) => x !== a) : [...list, a]);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!municipality || !date) return alert("Municipality/City and Date Conducted are required.");
    const base = {
      id: existing?.id, type, municipality, barangay, district, date, classNo,
      documentedBy: existing?.documentedBy || user.name,
    };
    if (type === "Profiling") {
      onSubmit({ ...base, participants: participants.filter((p) => p.name.trim()) });
    } else {
      onSubmit({ ...base, venue, targetMale, targetFemale, actualMale, actualFemale, age1014, age1519, age20plus, speakers: speakers.filter(Boolean), topics: topics.filter(Boolean), activitiesUndertaken, remarks, personsResponsible });
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ background: "white", borderRadius: 12, padding: 24, boxShadow: "0 1px 3px rgba(11,59,96,0.08)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <div style={{ fontWeight: 700, fontSize: 16, color: "#0B3B60" }}>{existing ? "Edit Activity" : "Register New Activity"}</div>
        <button type="button" onClick={onCancel} style={iconBtn}><X size={18} /></button>
      </div>

      {/* Type selector */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        {["Profiling", "Seminar"].map((t) => (
          <button key={t} type="button" onClick={() => setType(t)}
            style={{ ...toggleBtn, ...(type === t ? toggleBtnActive : {}) }}>
            {t === "Profiling" ? "RPFP Profiling (Form 1)" : "RPFP Seminar / Outreach"}
          </button>
        ))}
      </div>

      {/* Location + date */}
      <FieldRow>
        <Field label="Municipality / City *">
          <select required value={municipality} onChange={(e) => { setMunicipality(e.target.value); setBarangay(""); }} style={inputStyle}>
            <option value="">Select…</option>
            {MUNICIPALITIES.map((m) => <option key={m}>{m}</option>)}
          </select>
        </Field>
        <Field label="District (auto)">
          <input value={district ? `District ${district}` : ""} disabled style={{ ...inputStyle, background: "#F3F6F9", color: "#5C7089" }} />
        </Field>
        <Field label="Barangay *">
          <input required value={barangay} onChange={(e) => setBarangay(e.target.value)} list="barangay-list" style={inputStyle} placeholder="Type or pick barangay" />
          <datalist id="barangay-list">{barangayOptions.map((b) => <option key={b} value={b} />)}</datalist>
        </Field>
        <Field label="Date Conducted *">
          <input required type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inputStyle} />
        </Field>
      </FieldRow>
      <FieldRow>
        <Field label="Class No.">
          <input value={classNo} onChange={(e) => setClassNo(e.target.value)} style={inputStyle} />
        </Field>
      </FieldRow>

      <hr style={hrStyle} />

      {type === "Profiling" ? (
        <>
          <div style={{ fontWeight: 600, marginBottom: 10, color: "#0B3B60" }}>Participant Profile (RPFP Form 1)</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", fontSize: 12, tableLayout: "fixed"  }}>
              <thead>
                <tr style={{ background: "#EEF2F6" }}>
                  <Th>Name</Th><Th>Sex</Th><Th>Civil Status</Th><Th>Birthdate</Th><Th>Address / HH ID</Th>
                  <Th>Education</Th><Th># Children</Th><Th>Modern FP Method</Th><Th>Traditional Type</Th><Th>Status</Th><Th>Reason</Th><Th>Signed</Th><Th></Th>
                </tr>
              </thead>
              <tbody>
                {participants.map((p) => (
                  <tr key={p.id}>
                    <Td><input value={p.name} onChange={(e) => updateParticipant(p.id, "name", e.target.value)} style={cellInput} placeholder="Full name" /></Td>
                    <Td><select value={p.sex} onChange={(e) => updateParticipant(p.id, "sex", e.target.value)} style={cellInput}><option>F</option><option>M</option></select></Td>
                    <Td><select value={p.civilStatus} onChange={(e) => updateParticipant(p.id, "civilStatus", e.target.value)} style={cellInput}>{Object.entries(CIVIL_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Td>
                    <Td><input type="date" value={p.birthdate} onChange={(e) => updateParticipant(p.id, "birthdate", e.target.value)} style={cellInput} /></Td>
                    <Td><input value={p.address} onChange={(e) => updateParticipant(p.id, "address", e.target.value)} style={cellInput} /></Td>
                    <Td><select value={p.education} onChange={(e) => updateParticipant(p.id, "education", e.target.value)} style={cellInput}>{Object.entries(EDUCATION).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Td>
                    <Td><input type="number" min="0" value={p.children} onChange={(e) => updateParticipant(p.id, "children", e.target.value)} style={{ ...cellInput, width: 50 }} /></Td>
                    <Td><select value={p.modernMethod} onChange={(e) => updateParticipant(p.id, "modernMethod", e.target.value)} style={cellInput}><option value="">—</option>{Object.entries(MODERN_METHOD).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Td>
                    <Td><select value={p.tradType} onChange={(e) => updateParticipant(p.id, "tradType", e.target.value)} style={cellInput}><option value="">—</option>{Object.entries(TRAD_TYPE).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Td>
                    <Td><select value={p.tradStatus} onChange={(e) => updateParticipant(p.id, "tradStatus", e.target.value)} style={cellInput}><option value="">—</option>{Object.entries(TRAD_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Td>
                    <Td><select value={p.reason} onChange={(e) => updateParticipant(p.id, "reason", e.target.value)} style={cellInput}><option value="">—</option>{Object.entries(REASON).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Td>
                    <Td center><input type="checkbox" checked={p.signed} onChange={(e) => updateParticipant(p.id, "signed", e.target.checked)} /></Td>
                    <Td center><button type="button" onClick={() => removeParticipant(p.id)} style={{ ...iconBtn, color: "#C0392B" }}><Trash2 size={13} /></button></Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button type="button" onClick={addParticipant} style={{ ...btnGhost, marginTop: 10 }}><Plus size={14} style={{ marginRight: 6 }} />Add participant row</button>
        </>
      ) : (
        <>
          <div style={{ fontWeight: 600, marginBottom: 10, color: "#0B3B60" }}>Documentation Report</div>
          <FieldRow>
            <Field label="Venue"><input value={venue} onChange={(e) => setVenue(e.target.value)} style={inputStyle} /></Field>
          </FieldRow>
          <FieldRow>
            <Field label="Target Male"><input type="number" value={targetMale} onChange={(e) => setTargetMale(e.target.value)} style={inputStyle} /></Field>
            <Field label="Target Female"><input type="number" value={targetFemale} onChange={(e) => setTargetFemale(e.target.value)} style={inputStyle} /></Field>
            <Field label="Actual Male"><input type="number" value={actualMale} onChange={(e) => setActualMale(e.target.value)} style={inputStyle} /></Field>
            <Field label="Actual Female"><input type="number" value={actualFemale} onChange={(e) => setActualFemale(e.target.value)} style={inputStyle} /></Field>
          </FieldRow>
          <FieldRow>
            <Field label="Age 10-14"><input type="number" value={age1014} onChange={(e) => setAge1014(e.target.value)} style={inputStyle} /></Field>
            <Field label="Age 15-19"><input type="number" value={age1519} onChange={(e) => setAge1519(e.target.value)} style={inputStyle} /></Field>
            <Field label="Age 20+"><input type="number" value={age20plus} onChange={(e) => setAge20plus(e.target.value)} style={inputStyle} /></Field>
          </FieldRow>

          <div style={{ marginTop: 14 }}>
            <div style={labelStyle}>Speakers</div>
            {speakers.map((s, i) => (
              <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                <input value={s} onChange={(e) => setSpeakers((arr) => arr.map((x, idx) => idx === i ? e.target.value : x))} style={inputStyle} placeholder={`Speaker ${i + 1}`} />
                {i === speakers.length - 1 && <button type="button" onClick={() => setSpeakers((arr) => [...arr, ""])} style={iconBtn}><Plus size={14} /></button>}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 8 }}>
            <div style={labelStyle}>Topics Discussed</div>
            {topics.map((s, i) => (
              <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                <input value={s} onChange={(e) => setTopics((arr) => arr.map((x, idx) => idx === i ? e.target.value : x))} style={inputStyle} placeholder={`Topic ${i + 1}`} />
                {i === topics.length - 1 && <button type="button" onClick={() => setTopics((arr) => [...arr, ""])} style={iconBtn}><Plus size={14} /></button>}
              </div>
            ))}
          </div>

          <div style={{ marginTop: 14 }}>
            <div style={labelStyle}>Activities Undertaken</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {ACTIVITIES_LIST.map((a) => (
                <label key={a} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, background: activitiesUndertaken.includes(a) ? "#E4EEF6" : "#F3F6F9", padding: "6px 10px", borderRadius: 8, cursor: "pointer" }}>
                  <input type="checkbox" checked={activitiesUndertaken.includes(a)} onChange={() => toggleActivity(a)} /> {a}
                </label>
              ))}
            </div>
          </div>

          <FieldRow style={{ marginTop: 14 }}>
            <Field label="Persons Responsible"><input value={personsResponsible} onChange={(e) => setPersonsResponsible(e.target.value)} style={inputStyle} /></Field>
          </FieldRow>
          <Field label="Remarks"><textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} style={{ ...inputStyle, minHeight: 70 }} /></Field>
        </>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 24, borderTop: "1px solid #DCE3EC", paddingTop: 18 }}>
        <button type="button" onClick={onCancel} style={btnGhost}>Cancel</button>
        <button type="submit" style={btnPrimary}><ChevronRight size={15} style={{ marginRight: 6 }} />{existing ? "Save Changes" : "Submit & View Monthly Records"}</button>
      </div>
    </form>
  );
}

function FieldRow({ children, style }) { return <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 14, ...style }}>{children}</div>; }
function Field({ label, children }) { return <div style={{ flex: "1 1 180px", minWidth: 150 }}><div style={labelStyle}>{label}</div>{children}</div>; }
function TabButton({ active, onClick, icon, label }) {
  return (
    <button onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 6, padding: "12px 16px", border: "none", background: "none", cursor: "pointer", fontSize: 13.5, fontWeight: 600, color: active ? "#0B3B60" : "#8496AC", borderBottom: active ? "2px solid #0B3B60" : "2px solid transparent" }}>
      {icon}{label}
    </button>
  );
}

/* ---------------- Shared styles ---------------- */
const labelStyle = { fontSize: 11.5, fontWeight: 600, color: "#5C7089", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.4 };
const inputStyle = { width: "100%", padding: "9px 11px", borderRadius: 8, border: "1px solid #C7D2DE", fontSize: 13.5, fontFamily: "inherit", boxSizing: "border-box" };
const cellInput = { width: "100%", padding: "5px 6px", borderRadius: 5, border: "1px solid #DCE3EC", fontSize: 12, fontFamily: "inherit", boxSizing: "border-box" };
const selectSmall = { padding: "7px 10px", borderRadius: 8, border: "1px solid #C7D2DE", fontSize: 13 };
const hrStyle = { border: "none", borderTop: "1px solid #DCE3EC", margin: "18px 0" };
const btnPrimary = { display: "inline-flex", alignItems: "center", padding: "9px 16px", background: "#0B3B60", color: "white", border: "none", borderRadius: 8, fontSize: 13.5, fontWeight: 600, cursor: "pointer" };
const btnGhost = { display: "inline-flex", alignItems: "center", padding: "9px 14px", background: "white", color: "#0B3B60", border: "1px solid #C7D2DE", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" };
const btnGhostLight = { display: "inline-flex", alignItems: "center", padding: "7px 12px", background: "rgba(255,255,255,0.12)", color: "white", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 7, fontSize: 12.5, cursor: "pointer" };
const iconBtn = { border: "none", background: "none", cursor: "pointer", color: "#5C7089", padding: 4, display: "inline-flex" };
const toggleBtn = { padding: "10px 18px", borderRadius: 9, border: "1px solid #C7D2DE", background: "white", color: "#5C7089", fontSize: 13, fontWeight: 600, cursor: "pointer" };
const toggleBtnActive = { background: "#0B3B60", color: "white", borderColor: "#0B3B60" };
