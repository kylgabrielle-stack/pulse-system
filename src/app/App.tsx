import { useState, useMemo, useEffect, useRef, Fragment } from "react";
import pulseLogo from "@/imports/2c0ca284-4a1b-492f-b3a8-a2b4559034fe.jpg";
import { supabase, seedMunicipalitiesIfEmpty, ensureUserProfile } from "@/lib/supabase";
import {
  LogIn, User, Lock, ChevronDown, Calendar, MapPin,
  FileText, Printer, Download, Edit2, Trash2, Plus,
  Search, LogOut, Eye, EyeOff, X, CheckCircle,
  AlertTriangle, Shield, ChevronRight, LayoutDashboard,
  ClipboardList, Users, HeartPulse, ChevronLeft, LayoutGrid, ArrowRight, ArrowLeft, Table2,
  PenLine, BookUser, ClipboardCheck,
} from "lucide-react";

// ─── Geography ────────────────────────────────────────────────────────────────
// Single source of truth for ALL Municipality / Barangay / District dropdowns.
// ⚠ NOTE: District values are unverified — cross-check against official
//   COMELEC / provincial records before using for official reporting.
// TODO: Barangay arrays marked with [] must be populated from the official
//   PSA/PSGC barangay list before production use. Contact system admin.

interface MunicipalityInfo {
  type: "City" | "Municipality";
  district: string; // Congressional district (Roman numeral I–V)
  barangayCount: number; // PSA reference total; may exceed barangays.length if list is partial
  barangays: string[];
}

const MUNICIPALITY_DATA: Record<string, MunicipalityInfo> = {
  // ── District I ──────────────────────────────────────────────────────────────
  "City of Cavite":  { type: "City",         district: "I",   barangayCount: 83, barangays: ["Barangay 1 (Hen. M. Alvarez)","Barangay 2 (C. Tirona)","Barangay 3 (Hen. E. Aguinaldo)","Barangay 4 (Hen. M. Trias)","Barangay 5 (Hen. E. Evangelista)","Barangay 6 (Diego Silang)","Barangay 7 (Kapitan Kong)","Barangay 8 (Manuel S. Rojas)","Barangay 9 (Kanaway)","Barangay 10A (Kingfisher A)","Barangay 10B (Kingfisher B)","Barangay 10M (Kingfisher)","Barangay 11 (Lawin)","Barangay 12 (Love Bird)","Barangay 13 (Aguila)","Barangay 14 (Loro)","Barangay 15 (Kilyawan)","Barangay 16 (Martines)","Barangay 17 (Kalapati)","Barangay 18 (Maya)","Barangay 19 (Gemini)","Barangay 20 (Virgo)","Barangay 21 (Scorpio)","Barangay 22A (Leo)","Barangay 23 (Aquarius)","Barangay 24 (Libra)","Barangay 25 (Capricorn)","Barangay 26 (Cancer)","Barangay 27 (Sagitarius)","Barangay 28 (Taurus)","Barangay 29A (Lao-Lao A)","Barangay 29M (Lao-Lao)","Barangay 30 (Bid-Bid)","Barangay 31 (Maya-Maya)","Barangay 32 (Salay-Salay)","Barangay 33 (Buwan-Buwan)","Barangay 34 (Lapu-Lapu)","Barangay 35 (Hasa-Hasa)","Barangay 36A (Sap-Sap A)","Barangay 36M (Sap-Sap)","Barangay 37A (Cadena De Amor A)","Barangay 37M (Cadena De Amor)","Barangay 38A (Sampaguita A)","Barangay 38M (Sampaguita)","Barangay 39 (Jasmin)","Barangay 40 (Gumamela)","Barangay 41 (Rosal)","Barangay 42A (Pinagbuklod A)","Barangay 42B (Pinagbuklod B)","Barangay 42C (Pinagbuklod C)","Barangay 42M (Pinagbuklod)","Barangay 43 (Pinagpala)","Barangay 44 (Maligaya)","Barangay 45 (Kaunlaran)","Barangay 45A (Kaunlaran A)","Barangay 46 (Sinagtala)","Barangay 47A (Pagkakaisa A)","Barangay 47B (Pagkakaisa B)","Barangay 47M (Pagkakaisa)","Barangay 48A (Narra A)","Barangay 48M (Narra)","Barangay 49A (Akasya A)","Barangay 49M (Akasya)","Barangay 50 (Kabalyero)","Barangay 51 (Kamagong)","Barangay 52 (Ipil)","Barangay 53A (Yakal A)","Barangay 53B (Yakal B)","Barangay 53M (Yakal)","Barangay 54A (Pechay A)","Barangay 54M (Pechay)","Barangay 55 (Ampalaya)","Barangay 56 (Labanos)","Barangay 57 (Repolyo)","Barangay 58A (Patola)","Barangay 58M (Patola)","Barangay 59 (Sitaw)","Barangay 60 (Letsugas)","Barangay 61A (Talong A)","Barangay 61M (Talong)","Barangay 62A (Kangkong A)","Barangay 62B (Kangkong B)","Barangay 62M (Kangkong)"] },
  "Kawit":           { type: "Municipality", district: "I",   barangayCount: 23, barangays: ["Balsahan-Bisita","Batong Dalig","Binakayan-Aplaya","Binakayan-Kanluran","Congbalay-Legaspi","Gahak","Kaingen","Magdalo","Manggahan-Lawin","Marulas","Panamitan","Poblacion","Pulvorista","Samala-Marquez","San Sebastian","Santa Isabel","Tabon I","Tabon II","Tabon III","Toclong","Tramo-Bantayan","Wakas I","Wakas II"] },
  "Noveleta":        { type: "Municipality", district: "I",   barangayCount: 16, barangays: ["Magdiwang","Poblacion","Salcedo I","Salcedo II","San Antonio I","San Antonio II","San Jose I","San Jose II","San Juan I","San Juan II","San Rafael I","San Rafael II","San Rafael III","San Rafael IV","Santa Rosa I","Santa Rosa II"] },
  "Rosario":         { type: "Municipality", district: "I",   barangayCount: 20, barangays: ["Bagbag I","Bagbag II","Kanluran","Ligtong I","Ligtong II","Ligtong III","Ligtong IV","Muzon I","Muzon II","Poblacion","Sapa I","Sapa II","Sapa III","Sapa IV","Silangan I","Silangan II","Tejeros Convention","Wawa I","Wawa II","Wawa III"] },
  // ── District II ─────────────────────────────────────────────────────────────
  "City of Bacoor":  { type: "City",         district: "II",  barangayCount: 73, barangays: ["Alima","Aniban I","Aniban II","Aniban III","Aniban IV","Aniban V","Banalo","Bayanan","Campo Santo","Daang Bukid","Digman","Dulong Bayan","Habay I","Habay II","Kaingin (Pob.)","Ligas I","Ligas II","Ligas III","Mabolo I","Mabolo II","Mabolo III","Maliksi I","Maliksi II","Maliksi III","Mambog I","Mambog II","Mambog III","Mambog IV","Mambog V","Molino I","Molino II","Molino III","Molino IV","Molino V","Molino VI","Molino VII","Niog I","Niog II","Niog III","P.F. Espiritu I","P.F. Espiritu II","P.F. Espiritu III","P.F. Espiritu IV","P.F. Espiritu V","P.F. Espiritu VI","P.F. Espiritu VII","P.F. Espiritu VIII","Queens Row Central","Queens Row East","Queens Row West","Real I","Real II","Salinas I","Salinas II","Salinas III","Salinas IV","San Nicolas I","San Nicolas II","San Nicolas III","Sineguelasan","Tabing Dagat","Talaba I","Talaba II","Talaba III","Talaba IV","Talaba V","Talaba VI","Talaba VII","Zapote I","Zapote II","Zapote III","Zapote IV","Zapote V"] },
  "City of Imus":    { type: "City",         district: "II",  barangayCount: 97, barangays: ["Alapan I-A","Alapan I-B","Alapan I-C","Alapan II-A","Alapan II-B","Anabu I-A","Anabu I-B","Anabu I-C","Anabu I-D","Anabu I-E","Anabu I-F","Anabu I-G","Anabu II-A","Anabu II-B","Anabu II-C","Anabu II-D","Anabu II-E","Anabu II-F","Bagong Silang","Bayan Luma I","Bayan Luma II","Bayan Luma III","Bayan Luma IV","Bayan Luma IX","Bayan Luma V","Bayan Luma VI","Bayan Luma VII","Bayan Luma VIII","Bucandala I","Bucandala II","Bucandala III","Bucandala IV","Bucandala V","Buhay na Tubig","Carsadang Bago I","Carsadang Bago II","Magdalo","Maharlika","Malagasang I-A","Malagasang I-B","Malagasang I-C","Malagasang I-D","Malagasang I-E","Malagasang I-F","Malagasang I-G","Malagasang II-A","Malagasang II-B","Malagasang II-C","Malagasang II-D","Malagasang II-E","Malagasang II-F","Malagasang II-G","Mariano Espeleta I","Mariano Espeleta II","Mariano Espeleta III","Medicion I-A","Medicion I-B","Medicion I-C","Medicion I-D","Medicion II-A","Medicion II-B","Medicion II-C","Medicion II-D","Medicion II-E","Medicion II-F","Pag-asa I","Pag-asa II","Pag-asa III","Palico I","Palico II","Palico III","Palico IV","Pasong Buaya I","Pasong Buaya II","Pinagbuklod","Poblacion I-A","Poblacion I-B","Poblacion I-C","Poblacion II-A","Poblacion II-B","Poblacion III-A","Poblacion III-B","Poblacion IV-A","Poblacion IV-B","Poblacion IV-C","Poblacion IV-D","Tanzang Luma I","Tanzang Luma II","Tanzang Luma III","Tanzang Luma IV","Tanzang Luma V","Tanzang Luma VI","Toclong I-A","Toclong I-B","Toclong I-C","Toclong II-A","Toclong II-B"] },
  // ── District III ────────────────────────────────────────────────────────────
  "Carmona":             { type: "Municipality", district: "III", barangayCount: 14, barangays: ["Bancal","Barangay 1 (Pob.)","Barangay 2 (Pob.)","Barangay 3 (Pob.)","Barangay 4 (Pob.)","Barangay 5 (Pob.)","Barangay 6 (Pob.)","Barangay 7 (Pob.)","Barangay 8 (Pob.)","Cabilang Baybay","Lantic","Mabuhay","Maduya","Milagrosa"] },
  "City of Dasmariñas": { type: "City",         district: "III", barangayCount: 75, barangays: ["Burol","Burol I","Burol II","Burol III","Datu Esmael","Emmanuel Bergado I","Emmanuel Bergado II","Fatima I","Fatima II","Fatima III","H-2","Langkaan I","Langkaan II","Luzviminda I","Luzviminda II","Paliparan I","Paliparan II","Paliparan III","Sabang","Saint Peter I","Saint Peter II","Salawag","Salitran I","Salitran II","Salitran III","Salitran IV","Sampaloc I","Sampaloc II","Sampaloc III","Sampaloc IV","Sampaloc V","San Agustin I","San Agustin II","San Agustin III","San Andres I","San Andres II","San Antonio de Padua I","San Antonio de Padua II","San Dionisio","San Esteban","San Francisco I","San Francisco II","San Isidro Labrador I","San Isidro Labrador II","San Jose","San Juan","San Lorenzo Ruiz I","San Lorenzo Ruiz II","San Luis I","San Luis II","San Manuel I","San Manuel II","San Mateo","San Miguel","San Miguel II","San Nicolas I","San Nicolas II","San Roque","San Simon","Santa Cristina I","Santa Cristina II","Santa Cruz I","Santa Cruz II","Santa Fe","Santa Lucia","Santa Maria","Santo Cristo","Santo Niño I","Santo Niño II","Victoria Reyes","Zone I","Zone I-B","Zone II","Zone III","Zone IV"] },
  "City of General Trias": { type: "City",      district: "III", barangayCount: 33, barangays: ["Alingaro","Arnaldo (Pob.)","Bacao I","Bacao II","Bagumbayan (Pob.)","Biclatan","Buenavista I","Buenavista II","Buenavista III","Corregidor (Pob.)","Dulong Bayan (Pob.)","Gov. Ferrer (Pob.)","Javalera","Manggahan","Navarro","Ninety Sixth (Pob.)","Panungyanan","Pasong Camachile I","Pasong Camachile II","Pasong Kawayan I","Pasong Kawayan II","Pinagtipunan","Prinza (Pob.)","Sampalucan (Pob.)","San Francisco","San Gabriel (Pob.)","San Juan I","San Juan II","Santa Clara","Santiago","Tapia","Tejero","Vibora (Pob.)"] },
  "Gen. Mariano Alvarez (GMA)": { type: "Municipality", district: "III", barangayCount: 27, barangays: ["Aldiano Olaes","Barangay 1 Poblacion","Barangay 2 Poblacion","Barangay 3 Poblacion","Barangay 4 Poblacion","Barangay 5 Poblacion","Benjamin Tirona","Bernardo Pulido","Epifanio Malia","Fiorello Calimag","Francisco Reyes","Francisco de Castro","Gavino Maderan","Gregoria de Jesus","Inocencio Salud","Jacinto Lumbreras","Kapitan Kua","Koronel Jose P. Elises","Macario Dacon","Marcelino Memije","Nicolasa Virata","Pantaleon Granados","Ramon Cruz","San Gabriel","San Jose","Severino de Las Alas","Tiniente Tiago"] },
  "Silang":              { type: "Municipality", district: "III", barangayCount: 63, barangays: ["Acacia","Adlas","Anahaw I","Anahaw II","Balite I","Balite II","Balubad","Banaba","Barangay I","Barangay II","Barangay III","Barangay IV","Barangay V","Batas","Biga I","Biga II","Biluso","Bucal","Buho","Bulihan","Cabangaan","Carmen","Hoyo","Hukay","Iba","Inchican","Ipil I","Ipil II","Kalubkob","Kaong","Lalaan I","Lalaan II","Litlit","Lucsuhin","Lumil","Maguyam","Malabag","Malaking Tatyao","Mataas na Burol","Munting Ilog","Narra I","Narra II","Narra III","Paligawan","Pasong Langka","Pooc I","Pooc II","Pulong Bunga","Pulong Saging","Puting Kahoy","Sabutan","San Miguel I","San Miguel II","San Vicente I","San Vicente II","Santol","Tartaria","Tibig","Toledo","Tubuan I","Tubuan II","Tubuan III","Ulat","Yakal"] },
  // ── District IV ─────────────────────────────────────────────────────────────
  "Alfonso":             { type: "Municipality", district: "IV",  barangayCount: 32, barangays: ["Amuyong","Barangay I (Pob.)","Barangay II (Pob.)","Barangay III (Pob.)","Barangay IV (Pob.)","Barangay V (Pob.)","Bilog","Buck Estate","Esperanza Ibaba","Esperanza Ilaya","Kaysuyo","Kaytitinga I","Kaytitinga II","Kaytitinga III","Luksuhin","Luksuhin Ilaya","Mangas I","Mangas II","Marahan I","Marahan II","Matagbak I","Matagbak II","Pajo","Palumlum","Santa Teresa","Sikat","Sinaliw Malaki","Sinaliw na Munti","Sulsugin","Taywanak Ibaba","Taywanak Ilaya","Upli"] },
  "Amadeo":              { type: "Municipality", district: "IV",  barangayCount: 26, barangays: ["Banaybanay","Barangay I (Pob.)","Barangay II (Pob.)","Barangay III (Pob.)","Barangay IV (Pob.)","Barangay V (Pob.)","Barangay VI (Pob.)","Barangay VII (Pob.)","Barangay VIII (Pob.)","Barangay IX (Pob.)","Barangay X (Pob.)","Barangay XI (Pob.)","Barangay XII (Pob.)","Bucal","Buho","Dagatan","Halang","Loma","Maitim I","Maymangga","Minantok Kanluran","Minantok Silangan","Pangil","Salaban","Talon","Tamacan"] },
  "City of Tagaytay":    { type: "City",         district: "IV",  barangayCount: 34, barangays: ["Asisan","Bagong Tubig","Calabuso","Dapdap East","Dapdap West","Francisco","Guinhawa North","Guinhawa South","Iruhin East","Iruhin South","Iruhin West","Kaybagal East","Kaybagal North","Kaybagal South","Mag-Asawang Ilat","Maharlika East","Maharlika West","Maitim 2nd Central","Maitim 2nd East","Maitim 2nd West","Mendez Crossing East","Mendez Crossing West","Neogan","Patutong Malaki North","Patutong Malaki South","Sambong","San Jose","Silang Junction North","Silang Junction South","Sungay North","Sungay South","Tolentino East","Tolentino West","Zambal"] },
  "City of Trece Martires": { type: "City",      district: "IV",  barangayCount: 13, barangays: ["Aguado","Cabezas","Cabuco","Conchu","De Ocampo","Gregorio","Inocencio","Lallana","Lapidario","Luciano","Osorio","Perez","San Agustin"] },
  "Indang":              { type: "Municipality", district: "IV",  barangayCount: 36, barangays: ["Agus-us","Alulod","Banaba Cerca","Banaba Lejos","Bancod","Barangay 1","Barangay 2","Barangay 3","Barangay 4","Buna Cerca","Buna Lejos I","Buna Lejos II","Calumpang Cerca","Calumpang Lejos I","Carasuchi","Daine I","Daine II","Guyam Malaki","Guyam Munti","Harasan","Kayquit I","Kayquit II","Kayquit III","Kaytambog","Kaytapos","Limbon","Lumampong Balagbag","Lumampong Halayhay","Mahabangkahoy Cerca","Mahabangkahoy Lejos","Mataas na Lupa","Pulo","Tambo Balagbag","Tambo Ilaya","Tambo Kulit","Tambo Malaki"] },
  "Mendez":              { type: "Municipality", district: "IV",  barangayCount: 24, barangays: ["Anuling Cerca I","Anuling Cerca II","Anuling Lejos I","Anuling Lejos II","Asis I","Asis II","Asis III","Banayad","Bukal","Galicia I","Galicia II","Galicia III","Miguel Mojica","Palocpoc I","Palocpoc II","Panungyan I","Panungyan II","Poblacion I","Poblacion II","Poblacion III","Poblacion IV","Poblacion V","Poblacion VI","Poblacion VII"] },
  "Naic":                { type: "Municipality", district: "IV",  barangayCount: 30, barangays: ["Bagong Karsada","Balsahan","Bancaan","Bucana Malaki","Bucana Sasahan","Calubcob","Capt. C. Nazareno","Gomez-Zamora","Halang","Humbac","Ibayo Estacion","Ibayo Silangan","Kanluran","Labac","Latoria","Mabolo","Makina","Malainen Bago","Malainen Luma","Molino","Munting Mapino","Muzon","Palangue 1","Palangue 2 & 3","Sabang","San Roque","Santulan","Sapa","Timalan Balsahan","Timalan Concepcion"] },
  "Tanza":               { type: "Municipality", district: "IV",  barangayCount: 41, barangays: ["Amaya I","Amaya II","Amaya III","Amaya IV","Amaya V","Amaya VI","Amaya VII","Bagtas","Barangay I","Barangay II","Barangay III","Barangay IV","Biga","Biwas","Bucal","Bunga","Calibuyo","Capipisa","Daang Amaya I","Daang Amaya II","Daang Amaya III","Halayhay","Julugan I","Julugan II","Julugan III","Julugan IV","Julugan V","Julugan VI","Julugan VII","Julugan VIII","Lambingan","Mulawin","Paradahan I","Paradahan II","Punta I","Punta II","Sahud Ulan","Sanja Mayor","Santol","Tanauan","Tres Cruses"] },
  // ── District V ──────────────────────────────────────────────────────────────
  "Gen. Emilio Aguinaldo (GEA)": { type: "Municipality", district: "V",  barangayCount: 14, barangays: ["A. Dalusag","Batas Dao","Castaños Cerca","Castaños Lejos","Kabulusan","Kaymisas","Kaypaaba","Lumipa","Narvaez","Poblacion I","Poblacion II","Poblacion III","Poblacion IV","Tabora"] },
  "Magallanes":          { type: "Municipality", district: "V",  barangayCount: 16, barangays: ["Baliwag","Barangay 1","Barangay 2","Barangay 3","Barangay 4","Barangay 5","Bendita I","Bendita II","Caluangan","Kabulusan","Medina","Pacheco","Ramirez","San Agustin","Tua","Urdaneta"] },
  "Maragondon":          { type: "Municipality", district: "V",  barangayCount: 27, barangays: ["Bucal I","Bucal II","Bucal III-A","Bucal III-B","Bucal IV-A","Bucal IV-B","Caingin (Pob.)","Garita I-A","Garita I-B","Layong Mabilog","Mabato","Pantihan I","Pantihan II","Pantihan III","Pantihan IV","Patungan","Pinagsanhan I-A","Pinagsanhan I-B","Poblacion I-A","Poblacion I-B","Poblacion II-A","Poblacion II-B","San Miguel I-A","San Miguel I-B","Talipusngo","Tulay Kanluran","Tulay Silangan"] },
  "Ternate":             { type: "Municipality", district: "V",  barangayCount: 10, barangays: ["Bucana","Poblacion I","Poblacion I-A","Poblacion II","Poblacion III","San Jose","San Juan I","San Juan II","Sapang I","Sapang II"] },
};

// Helper — single lookup point used by every municipality/barangay dropdown.
// Returns the barangay list for a given municipality key, or [] if not found / not yet populated.
function munBarangays(mun: string): string[] {
  return MUNICIPALITY_DATA[mun]?.barangays ?? [];
}

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
    sessionTypeOptions: ["GAD", "KATROPA"],
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
    typeColumns: ["GAD", "KATROPA"],
    typeLabels:  ["GAD", "KATROPA"],
    ageBrackets: ["18–29", "30–49", "50 & above"],
  },
};

// ─── Data types ───────────────────────────────────────────────────────────────

interface Speaker { name: string; topic: string; rating: string }

interface DocRecord {
  id: string;
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

interface RPFPParticipant {
  id: string;
  name: string;
  sex: "M" | "F" | "";
  civilStatus: string;
  birthdate: string;
  address: string;
  education: string;
  numChildren: string;
  fpMethod: string;
  intentionToShift: string;
  traditionalType: string;
  traditionalStatus: string;
  reasonForUsing: string;
  signatureData: string;
  partner: RPFPParticipant | null;
}

interface RPFPForm1Record {
  id: string;
  parentRecordId: string;
  classNo: string;
  municipality: string;
  barangay: string;
  dateConduct: string;
  activityType: string;
  dataCollectionMethod: string;
  dataCollectionOther: string;
  participants: RPFPParticipant[];
  preparedBy: string;
  reviewedBy: string;
  approvedBy: string;
}

const BLANK_SPEAKERS: Speaker[] = Array.from({ length: 8 }, () => ({ name: "", topic: "", rating: "" }));

function blankActivities(cfg: FormConfig) {
  return Object.fromEntries(cfg.activityKeys.map(k => [k, false]));
}
function blankPersons(cfg: FormConfig) {
  return Object.fromEntries(cfg.activityKeys.map(k => [k, ""]));
}

const INITIAL_RECORDS: DocRecord[] = [];

// ─── Shared UI primitives ─────────────────────────────────────────────────────


function CategoryBadge({ category }: { category: Category }) {
  const cfg = CONFIGS[category].accent;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border tracking-widest ${cfg.badgeBg} ${cfg.badgeText} ${cfg.badgeBorder}`}
     >
      {category}
    </span>
  );
}

function BackButton({ onClick, label = "Back" }: { onClick: () => void; label?: string }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground text-xs font-medium px-2 py-1 -ml-2 rounded-md hover:bg-accent transition-all print:hidden"
    >
      <ChevronLeft size={13} strokeWidth={2.5} />
      {label}
    </button>
  );
}

function AppHeader({ user, onLogout, crumb }: {
  user: string; onLogout: () => void; crumb?: string;
}) {
  return (
    <header className="h-16 flex items-center px-5 gap-3 shrink-0 print:hidden" style={{ background: "#3c4650" }}>
      <div className="flex items-center gap-3">
        {/* Pulse-line icon */}
        <svg width="34" height="24" viewBox="0 0 34 24" fill="none" className="shrink-0" aria-hidden="true">
          <polyline points="1,12 6,12 8.5,3 12,21 15.5,5 19,12 23,12 25,8.5 27,15.5 33,12"
            stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div className="h-5 w-px bg-white/20" />
        <div className="flex items-baseline gap-0">
          <span className="font-black text-white tracking-[0.1em] text-base leading-none">PULSE</span>
          <span className="font-black text-base leading-none" style={{ color: "#d9544a" }}>+</span>
        </div>
        <span className="text-white/35 text-xs tracking-[0.18em] hidden sm:inline uppercase font-medium">System</span>
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
    <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground border-b border-border pb-2 mb-4"
     >
      {children}
    </h2>
  );
}

function FormInput({ className = "", style, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  const dateStyle = props.type === "date" ? { colorScheme: "light" as const, color: "#000", ...style } : style;
  return (
    <input {...props}
      style={dateStyle}
      className={`w-full px-3 py-3 bg-input-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/50 transition-all ${className}`} />
  );
}

function FormSelect({ className = "", children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select {...props}
        className={`w-full appearance-none px-3 py-3 pr-8 bg-input-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/50 transition-all ${className}`}>
        {children}
      </select>
      <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
    </div>
  );
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────

// PULSE+ logo lockup: ECG line + family silhouettes + wordmark + SYSTEM divider


function LoginView({ onLogin }: { onLogin: (name: string, uid: string) => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [phase,    setPhase]    = useState<"splash" | "split">("splash");
  const [formReady, setFormReady] = useState(false);
  const [isMobile,  setIsMobile]  = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 1024 : false
  );

  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);

  const isSplit = phase === "split";

  const handleContinue = () => {
    setFormReady(true);
    setTimeout(() => setPhase("split"), 50);
  };

  const handleBack = () => {
    setPhase("splash");
    setError("");
    setTimeout(() => setFormReady(false), 520);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: username.trim(),
      password,
    });
    if (authError || !data.user) {
      setError("Invalid credentials. Access is restricted to authorized government personnel.");
      setLoading(false);
      return;
    }
    const profile = await ensureUserProfile(data.user.id, data.user.email ?? username);
    onLogin(profile.full_name || data.user.email || "User", data.user.id);
  };

  const leftStyle: React.CSSProperties = isMobile
    ? {
        width: "100%",
        height: isSplit ? "200px" : "100svh",
        transition: "height 480ms ease-in-out",
        position: "relative", overflow: "hidden", flexShrink: 0,
        background: "#1c2548",
        display: "flex", flexDirection: "column",
      }
    : {
        width: isSplit ? "44%" : "100%",
        height: "100svh",
        transition: "width 480ms ease-in-out",
        position: "relative", overflow: "hidden", flexShrink: 0,
        background: "#1c2548",
        display: "flex", flexDirection: "column",
      };

  const rightStyle: React.CSSProperties = {
    flex: 1,
    position: "relative",
    display: formReady ? "flex" : "none",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    background: "white",
    padding: isMobile ? "72px 24px 32px" : "32px 24px",
    overflowY: "auto",
    minHeight: isMobile ? "auto" : "100svh",
    opacity: isSplit ? 1 : 0,
    transform: isSplit ? "translateX(0)" : "translateX(60px)",
    transition: "opacity 420ms ease-in-out 130ms, transform 420ms ease-in-out 130ms",
  };

  /* shared compact mobile SVG (used in mobile split banner) */
  return (
    <div style={{
      minHeight: "100svh", display: "flex",
      flexDirection: isMobile ? "column" : "row",
      overflow: "hidden",
      background: "#1c2548",
    }}>

      {/* ── LEFT PANEL ── */}
      <div style={leftStyle}>
        {/* Logo image — cover on full-screen splash, contain on split so nothing crops */}
        <img
          src={pulseLogo}
          alt="PULSE+ System"
          style={{
            position: "absolute", inset: 0,
            width: "100%", height: "100%",
            objectFit: "cover",
            objectPosition: "center center",
            pointerEvents: "none",
          }}
        />

        {/* Overlay container (relative, fills panel height for absolute children) */}
        <div style={{ position: "relative", flex: 1, width: "100%", height: "100%" }}>

          {/* ── SPLASH overlay (desktop + mobile splash) ── */}
          <div style={{
            position: "absolute", inset: 0,
            opacity: isSplit ? 0 : 1,
            transition: "opacity 200ms ease",
            pointerEvents: isSplit ? "none" : "auto",
            padding: isMobile ? "40px 28px" : "60px 56px",
            display: "flex", flexDirection: "column", justifyContent: "space-between",
          }}>
            {/* Upper: spacer so footer button stays anchored to bottom */}
            <div style={{ flex: 1 }} />

            {/* Lower: continue button */}
            <div style={{
              display: "flex", flexDirection: "column",
              alignItems: isMobile ? "flex-start" : "center",
              gap: isMobile ? "16px" : "22px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <button
                  onClick={handleContinue}
                  aria-label="Continue to sign in"
                  style={{
                    width: isMobile ? "52px" : "64px",
                    height: isMobile ? "52px" : "64px",
                    borderRadius: "50%",
                    background: "#D9544A", border: "none", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "transform 180ms ease, box-shadow 180ms ease",
                    outline: "none",
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.transform = "scale(1.1)";
                    (e.currentTarget as HTMLElement).style.boxShadow = "0 0 0 10px rgba(217,84,74,0.22)";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.transform = "scale(1)";
                    (e.currentTarget as HTMLElement).style.boxShadow = "none";
                  }}
                  onFocus={e => {
                    (e.currentTarget as HTMLElement).style.boxShadow = "0 0 0 3px white, 0 0 0 6px rgba(217,84,74,0.6)";
                  }}
                  onBlur={e => { (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
                >
                  <ArrowRight size={isMobile ? 20 : 26} color="white" strokeWidth={2.5} />
                </button>
                <span style={{ color: "rgba(255,255,255,0.5)", fontSize: isMobile ? "0.78rem" : "0.95rem", letterSpacing: "0.06em" }}>
                  Sign In
                </span>
              </div>

            </div>
          </div>

          {/* ── SPLIT overlay: desktop left panel — image handles all branding ── */}

          {/* ── SPLIT overlay: mobile compact banner — image fills panel background ── */}
        </div>
      </div>

      {/* ── RIGHT PANEL: Sign In form ── */}
      <div style={rightStyle}>
        {/* Back button — top-left corner, returns to splash */}
        <button
          onClick={handleBack}
          aria-label="Back to main page"
          style={{
            position: "absolute", top: "24px", left: "24px",
            width: "44px", height: "44px", borderRadius: "50%",
            background: "#D9544A", border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "transform 180ms ease, box-shadow 180ms ease",
            outline: "none",
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.transform = "scale(1.12)";
            (e.currentTarget as HTMLElement).style.boxShadow = "0 0 0 8px rgba(217,84,74,0.22)";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.transform = "scale(1)";
            (e.currentTarget as HTMLElement).style.boxShadow = "none";
          }}
          onFocus={e => {
            (e.currentTarget as HTMLElement).style.boxShadow = "0 0 0 3px white, 0 0 0 6px rgba(217,84,74,0.6)";
          }}
          onBlur={e => { (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
        >
          <ArrowLeft size={18} color="white" strokeWidth={2.5} />
        </button>

        {/* Staggered fade-in keyframes */}
        <style>{`
          @keyframes fadeSlideUp {
            from { opacity: 0; transform: translateY(10px); }
            to   { opacity: 1; transform: translateY(0); }
          }
        `}</style>

        <div style={{ width: "100%", maxWidth: "400px" }}>
          <div style={{ animation: `fadeSlideUp 320ms ease-out both`, animationDelay: "160ms" }}>
            <h2 style={{ fontWeight: 700, fontSize: "1.5rem" }}>Sign In</h2>
            <p className="text-muted-foreground text-sm mt-1">Access restricted to authorized personnel.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 mt-7">
            {error && (
              <div className="flex items-start gap-3 p-3.5 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle size={15} className="text-red-500 mt-0.5 shrink-0" />
                <p className="text-red-700 text-sm leading-snug">{error}</p>
              </div>
            )}
            <div className="space-y-1.5"
              style={{ animation: "fadeSlideUp 320ms ease-out both", animationDelay: "230ms" }}>
              <label className="block text-sm font-semibold text-foreground">Email <span className="text-red-500">*</span></label>
              <div className="relative">
                <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <FormInput type="email" value={username} onChange={e => setUsername(e.target.value)} placeholder="Enter email address" className="pl-9" />
              </div>
            </div>
            <div className="space-y-1.5"
              style={{ animation: "fadeSlideUp 320ms ease-out both", animationDelay: "300ms" }}>
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
            <div style={{ animation: "fadeSlideUp 320ms ease-out both", animationDelay: "370ms" }}>
              <button type="submit" disabled={loading}
                className="w-full bg-primary text-primary-foreground font-bold text-sm py-2.5 rounded-lg hover:bg-primary/90 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                {loading
                  ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <><LogIn size={14} /> Sign In to PULSE</>}
              </button>
            </div>
          </form>
        </div>

        {/* Right panel footer credit */}
        <p style={{
          position: "absolute", bottom: "20px",
          color: "rgba(0,0,0,0.22)", fontSize: "0.65rem", letterSpacing: "0.04em",
          textAlign: "center", userSelect: "none",
        }}>
          © 2026 OPPO Cavite · Province of Cavite
        </p>
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

function SignaturePad({ value, onChange, label }: { value: string; onChange: (d: string) => void; label?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const clear = () => {
    const c = canvasRef.current; if (!c) return;
    c.getContext("2d")!.clearRect(0, 0, c.width, c.height);
    onChange("");
  };
  const getPos = (e: React.MouseEvent | React.TouchEvent, c: HTMLCanvasElement) => {
    const r = c.getBoundingClientRect();
    if ("touches" in e) return { x: e.touches[0].clientX - r.left, y: e.touches[0].clientY - r.top };
    return { x: (e as React.MouseEvent).clientX - r.left, y: (e as React.MouseEvent).clientY - r.top };
  };
  const start = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault(); drawing.current = true;
    const c = canvasRef.current!; const ctx = c.getContext("2d")!;
    const {x,y} = getPos(e,c); ctx.beginPath(); ctx.moveTo(x,y);
  };
  const move = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing.current) return; e.preventDefault();
    const c = canvasRef.current!; const ctx = c.getContext("2d")!;
    ctx.strokeStyle = "#1e2830"; ctx.lineWidth = 1.5; ctx.lineCap = "round";
    const {x,y} = getPos(e,c); ctx.lineTo(x,y); ctx.stroke();
  };
  const end = () => { drawing.current = false; onChange(canvasRef.current?.toDataURL() ?? ""); };
  return (
    <div>
      {label && <p className="text-xs text-muted-foreground mb-1">{label}</p>}
      <div className="relative border border-border rounded-lg overflow-hidden bg-white" style={{height:60}}>
        <canvas ref={canvasRef} width={280} height={60} className="w-full h-full touch-none cursor-crosshair"
          onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end}
          onTouchStart={start} onTouchMove={move} onTouchEnd={end} />
        {!value && <p className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground/40 pointer-events-none select-none italic">Sign here</p>}
      </div>
      {value && <button type="button" onClick={clear} className="mt-1 text-xs text-muted-foreground hover:text-primary transition-colors">Clear</button>}
    </div>
  );
}

function DashboardView({ user, onLogout, records, onEncode, onEncodeForm1, onViewRosterList, onViewRecords, onViewRecordsForMonth, onViewMonthlySummary }: {
  user: string; onLogout: () => void;
  records: DocRecord[];
  onEncode: (cat: Category) => void;
  onEncodeForm1: () => void;
  onViewRosterList: () => void;
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
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader user={user} onLogout={onLogout} />
      <div className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">

          {/* Welcome */}
          <div className="rounded-xl overflow-hidden relative"
            style={{ background:"linear-gradient(130deg,#252e3a 0%,#3c4650 55%,#4d5c6e 100%)" }}>
            <div className="absolute inset-0 pointer-events-none"
              style={{ backgroundImage:"linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px)", backgroundSize:"32px 32px" }} />
            {/* Subtle heartbeat watermark */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="xMaxYMid meet" viewBox="0 0 800 120" fill="none" style={{ opacity: 0.06 }}>
              <polyline points="0,60 80,60 115,15 165,105 205,25 250,60 320,60 360,38 400,82 500,60 600,60 635,20 680,100 730,40 780,60 800,60"
                stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="relative z-10 p-7 sm:p-9 flex items-center justify-between gap-4">
              <div>
                <p className="text-white/50 text-xs uppercase tracking-[0.18em] font-semibold mb-1">Welcome back</p>
                <h1 className="text-white font-bold mb-0.5"
                  style={{ fontSize:"1.5rem" }}>{user}</h1>
                <p className="text-white/60 text-sm">Office of the Provincial Population Officer, Province of Cavite</p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            {/* Monthly Summary — clickable */}
            <button
              onClick={onViewMonthlySummary}
              className="bg-card border border-border rounded-xl p-5 text-left hover:border-primary/30 hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ background:"rgba(217,84,74,0.10)" }}>
                <LayoutGrid size={18} className="text-primary" />
              </div>
              <p className="text-lg font-bold text-primary leading-tight">
                {thisMonth.slice(0, 3)}<span className="text-sm ml-1 opacity-70">{thisYear}</span>
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 font-medium">Monthly Summary</p>
            </button>
            {/* View All Records — navigational card */}
            <button
              onClick={onViewRecords}
              className="bg-card border border-border rounded-xl p-5 text-left hover:border-primary/30 hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ background:"rgba(217,84,74,0.10)" }}>
                <Table2 size={18} className="text-primary" />
              </div>
              <p className="text-sm font-bold text-primary leading-snug flex items-center gap-1">
                View All Records <ArrowRight size={12} className="text-primary/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 font-medium">{records.length} entries · RPFP, AHD &amp; GAD</p>
              <p className="text-[11px] text-muted-foreground/70 mt-0.5">
                RPFP: {records.filter(r => r.category === "RPFP").length} &nbsp;·&nbsp;
                AHD: {records.filter(r => r.category === "AHD").length} &nbsp;·&nbsp;
                GAD: {records.filter(r => r.category === "GAD").length}
              </p>
            </button>
          </div>

          {/* Three report-type cards */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-foreground">Encode Documentation Report</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {REPORT_CARDS.map(({ category, icon, subtext }) => {
                const cfg = CONFIGS[category];
                const ac  = cfg.accent;
                return (
                  <div key={category}
                    className="bg-card border border-border rounded-xl flex flex-col hover:shadow-md transition-shadow"
                    style={{ padding: category === "RPFP" ? "20px" : "20px 20px" }}>
                    <div className="flex items-start gap-3 mb-4" style={{ minHeight: "72px" }}>
                      <div className={`w-11 h-11 ${ac.chipBg} rounded-xl flex items-center justify-center shrink-0 ${ac.chipText}`}>
                        {icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-foreground text-sm leading-snug">
                          {category} · Documentation Report
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 leading-snug">{subtext}</p>
                      </div>
                    </div>
                    <div className="mt-auto">
                      <button onClick={() => onEncode(category)}
                        className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-primary-foreground text-sm font-bold transition-all"
                        style={{ background:"#D9544A" }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "#c44840"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "#D9544A"; }}
                      >
                        <Plus size={14} /> Encode Report
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>


          {/* Recent */}
          {records.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground">Recent Reports</h3>
                <button onClick={onViewRecords} className="text-xs text-primary hover:underline font-medium">View all reports</button>
              </div>
              <div className="bg-card border border-border rounded-xl overflow-hidden divide-y divide-border">
                {records.slice(0, 5).map(r => (
                  <div key={r.id} className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors">
                    <CategoryBadge category={r.category} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{r.barangay}, {r.municipality}</p>
                      <p className="text-xs text-muted-foreground">{r.dateConduct} · {r.sessionType}</p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0 hidden sm:block">{r.code}</span>
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
  const today = new Date();
  return {
    category: cfg.category,
    municipality: "", barangay: "", district: "", venue: "",
    sessionType: cfg.sessionTypePlaceholder ? "" : cfg.sessionTypeOptions[0],
    dateConduct: today.toISOString().split("T")[0],
    reportMonth: MONTHS[today.getMonth()],
    reportYear: String(today.getFullYear()),
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

function DocFormView({ category, user, onLogout, onSubmit, onCancel, onBack, editRecord, onEncodeForm1, onViewRosterList }: {
  category: Category;
  user: string;
  onLogout: () => void;
  onSubmit: (data: FormState) => void | Promise<void>;
  onCancel: () => void;
  onBack: () => void;
  editRecord?: DocRecord | null;
  onEncodeForm1?: () => void;
  onViewRosterList?: () => void;
}) {
  const cfg = CONFIGS[category];
  const ac  = cfg.accent;

  const initial: FormState = editRecord
    ? (({ id: _i, code: _c, status: _s, ...rest }) => rest)(editRecord)
    : buildBlank(cfg, user);

  const [form, setForm] = useState<FormState>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  // Separate display-string state for numeric fields that should start empty on new records
  const [rawNums, setRawNums] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      ["male", "female", "ageBracket1", "ageBracket2", "ageBracket3"].map(f =>
        [f, editRecord ? String((editRecord as unknown as Record<string, number>)[f]) : ""]
      )
    )
  );

  const setRaw = (field: string, raw: string) => {
    setRawNums(p => ({ ...p, [field]: raw }));
    setForm(p => ({ ...p, [field]: parseInt(raw, 10) || 0 }));
  };

  const set = (field: string, val: unknown) => setForm(p => ({ ...p, [field]: val }));
  const clearErr = (...fields: string[]) =>
    setErrors(p => { const n = { ...p }; fields.forEach(f => delete n[f]); return n; });

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

  // Block e/E/+/-/. in number inputs — browsers allow these by default
  const blockNonInteger = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (["e","E","+","-","."].includes(e.key)) e.preventDefault();
  };

  // Strip non-digits on paste, returning the cleaned value
  const digitsPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    return e.clipboardData.getData("text").replace(/\D/g, "") || "";
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.municipality)                          e.municipality        = "This field is required";
    if (!form.barangay)                              e.barangay            = "This field is required";
    if (!form.venue.trim())                          e.venue               = "This field is required";
    if (cfg.sessionTypePlaceholder && !form.sessionType) e.sessionType     = "This field is required";
    if (!form.dateConduct)                           e.dateConduct         = "This field is required";
    if (!String(form.actualParticipants).trim())     e.actualParticipants  = "This field is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const targetNum = parseInt(String(form.targetParticipants), 10);
  const actualNum = parseInt(String(form.actualParticipants), 10);
  const actualExceedsTarget = !isNaN(targetNum) && !isNaN(actualNum) && targetNum > 0 && actualNum > targetNum;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitAttempted(true);
    if (validate()) {
      onSubmit(form);
    } else {
      setTimeout(() => {
        const banner = document.getElementById("form-error-banner");
        if (banner) banner.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 30);
    }
  };

  const barangays = munBarangays(form.municipality);
  const errCls = (f: string) => errors[f] ? "border-red-300" : "border-border";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader user={user} onLogout={onLogout} crumb={`Dashboard / ${cfg.pageLabel}`} />

      <div className="flex-1 overflow-auto py-7 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <div className="mb-4 print:hidden flex items-center justify-between gap-3 flex-wrap">
            <BackButton onClick={onBack} label="Back to Dashboard" />
            {category === "RPFP" && onEncodeForm1 && onViewRosterList && (
              <div className="flex items-center gap-2 flex-wrap">
                <button onClick={onEncodeForm1}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold transition-all border"
                  style={{ color:"#D9544A", borderColor:"rgba(217,84,74,0.40)", background:"transparent" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(217,84,74,0.06)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                >
                  <BookUser size={14} /> Encode Form 1 (Participant Profile)
                </button>
                <button onClick={onViewRosterList}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-teal-700 hover:bg-teal-50 transition-colors border border-teal-200"
                >
                  <ClipboardList size={14} /> View List
                </button>
              </div>
            )}
          </div>
          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">

            {/* Category header strip */}
            <div className={`${ac.headerBg} px-6 py-3 flex items-center gap-3`}>
              <span className="bg-white/25 text-white text-xs font-bold px-2.5 py-1 rounded tracking-widest"
               >{category}</span>
              <span className="text-white font-semibold text-sm"
               >{cfg.pageLabel}</span>
            </div>

            {/* Sub-header */}
            <div className="border-b border-border px-6 py-4 bg-secondary/20">
              <p className="text-xs text-muted-foreground">
                Province of Cavite · Office of the Provincial Population Officer ·
                All <span className="text-red-500">*</span> fields required.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-8">

              {/* ── Validation error banner ── */}
              {submitAttempted && Object.keys(errors).length > 0 && (
                <div id="form-error-banner"
                  className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <AlertTriangle size={15} className="text-red-500 mt-0.5 shrink-0" />
                  <p className="text-red-700 text-sm font-medium">
                    Please fill in all required fields before submitting.
                  </p>
                </div>
              )}

              {/* ── 1. Information ── */}
              <section>
                <SectionHeading>Information</SectionHeading>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4 items-end">
                    <div className="space-y-1.5">
                      <label className="block text-sm font-semibold text-foreground">City / Municipality <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        <select value={form.municipality} onChange={e => { setMunicipality(e.target.value); clearErr("municipality"); }}
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
                          ? <><CheckCircle size={13} className="text-emerald-600 shrink-0" /><span className="text-sm font-bold">Dist. {form.district}</span></>
                          : <span className="text-xs text-muted-foreground">Auto-filled</span>}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-sm font-semibold text-foreground">Barangay <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <select value={form.barangay}
                          onChange={e => { set("barangay", e.target.value); clearErr("barangay"); }}
                          disabled={!form.municipality}
                          className={`w-full appearance-none px-3 py-2.5 pr-8 bg-input-background border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${errCls("barangay")}`}>
                          <option value="">
                            {!form.municipality ? "Select municipality first" : "Select barangay…"}
                          </option>
                          {barangays.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                        <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                      </div>
                      {errors.barangay && <p className="text-red-500 text-xs mt-1">{errors.barangay}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-semibold text-foreground">Venue <span className="text-red-500">*</span></label>
                      <FormInput type="text" value={form.venue}
                        onChange={e => { set("venue", e.target.value); clearErr("venue"); }}
                        placeholder="e.g., Barangay Hall, Community Center"
                        className={errCls("venue")} />
                      {errors.venue && <p className="text-red-500 text-xs mt-1">{errors.venue}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-sm font-semibold text-foreground">{cfg.sessionTypeLabel} <span className="text-red-500">*</span></label>
                      <FormSelect value={form.sessionType}
                        onChange={e => { set("sessionType", e.target.value); clearErr("sessionType"); }}
                        className={errors.sessionType ? "border-red-300" : ""}>
                        {cfg.sessionTypePlaceholder && (
                          <option value="" disabled>{cfg.sessionTypePlaceholder}</option>
                        )}
                        {cfg.sessionTypeOptions.map(o => <option key={o} value={o}>{o}</option>)}
                      </FormSelect>
                      {errors.sessionType && <p className="text-red-500 text-xs mt-1">{errors.sessionType}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-semibold text-foreground">Date Conducted <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        <FormInput type="date" value={form.dateConduct}
                          onChange={e => { set("dateConduct", e.target.value); clearErr("dateConduct"); }}
                          className={`pl-9 ${errCls("dateConduct")}`} />
                      </div>
                      {errors.dateConduct && <p className="text-red-500 text-xs mt-1">{errors.dateConduct}</p>}
                    </div>
                  </div>
                </div>
              </section>

              {/* ── 2. Participants ── */}
              <section>
                <SectionHeading>Participants &amp; Resource Persons</SectionHeading>
                <div className="space-y-5">
                  {/* Counts */}
                  <div>
                    <p className="text-sm font-semibold text-foreground mb-3">Participants' Profile</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {/* Target */}
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-muted-foreground">Target</label>
                        <input
                          type="number" min={0} step={1} placeholder="0"
                          value={form.targetParticipants}
                          onKeyDown={blockNonInteger}
                          onPaste={e => set("targetParticipants", digitsPaste(e))}
                          onChange={e => set("targetParticipants", e.target.value.replace(/\D/g, ""))}
                          className="w-full px-3 py-2 bg-input-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/50 transition-all text-center" />
                      </div>
                      {/* Actual */}
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-muted-foreground">
                          Actual <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number" min={0} step={1} placeholder="0"
                          value={form.actualParticipants}
                          onKeyDown={blockNonInteger}
                          onPaste={e => { set("actualParticipants", digitsPaste(e)); clearErr("actualParticipants"); }}
                          onChange={e => { set("actualParticipants", e.target.value.replace(/\D/g, "")); clearErr("actualParticipants"); }}
                          className={`w-full px-3 py-2 bg-input-background border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/50 transition-all text-center ${errors.actualParticipants ? "border-red-300" : actualExceedsTarget ? "border-amber-300" : "border-border"}`} />
                        {errors.actualParticipants && <p className="text-red-500 text-xs">{errors.actualParticipants}</p>}
                      </div>
                      {/* Male */}
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-muted-foreground">Male</label>
                        <input
                          type="number" min={0} step={1} placeholder="0"
                          value={rawNums.male}
                          onKeyDown={blockNonInteger}
                          onPaste={e => setRaw("male", digitsPaste(e))}
                          onChange={e => setRaw("male", e.target.value.replace(/\D/g, ""))}
                          className="w-full px-3 py-2 bg-input-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/50 transition-all text-center" />
                      </div>
                      {/* Female */}
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-muted-foreground">Female</label>
                        <input
                          type="number" min={0} step={1} placeholder="0"
                          value={rawNums.female}
                          onKeyDown={blockNonInteger}
                          onPaste={e => setRaw("female", digitsPaste(e))}
                          onChange={e => setRaw("female", e.target.value.replace(/\D/g, ""))}
                          className="w-full px-3 py-2 bg-input-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/50 transition-all text-center" />
                      </div>
                    </div>
                    {/* Actual > Target soft warning */}
                    {actualExceedsTarget && (
                      <p className="flex items-center gap-1.5 text-amber-600 text-xs mt-2 font-medium">
                        <AlertTriangle size={11} /> Actual exceeds target — please verify.
                      </p>
                    )}
                  </div>

                  {/* Age brackets */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-2">Age Brackets</p>
                    <div className="grid grid-cols-3 gap-3">
                      {cfg.ageBrackets.map(({ label, field }) => (
                        <div key={field} className="space-y-1">
                          <label className="text-xs font-semibold text-muted-foreground">{label}</label>
                          <input
                            type="number" min={0} step={1} placeholder="0"
                            value={rawNums[field]}
                            onKeyDown={blockNonInteger}
                            onPaste={e => setRaw(field, digitsPaste(e))}
                            onChange={e => setRaw(field, e.target.value.replace(/\D/g, ""))}
                            className="w-full px-3 py-2 bg-input-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/50 transition-all text-center" />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* No. of speakers */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-foreground">No. of Speakers</label>
                    <input type="text" value={form.numSpeakers} onChange={e => set("numSpeakers", e.target.value)}
                      placeholder="N/A"
                      className="w-28 px-3 py-2 bg-input-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/50 transition-all" />
                  </div>

                  {/* Speakers table */}
                  <div>
                    <p className="text-sm font-semibold text-foreground mb-2">Name of Speakers / Topics Discussed / Rating</p>
                    <div className="border border-border rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-secondary/50 border-b border-border">
                            <th className="text-left px-3 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground w-8">#</th>
                            <th className="text-left px-3 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">Name of Speaker</th>
                            <th className="text-left px-3 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">Topic Discussed</th>
                            <th className="text-left px-3 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground w-24">Rating</th>
                          </tr>
                        </thead>
                        <tbody>
                          {form.speakers.map((sp, i) => (
                            <tr key={i} className="border-b border-border last:border-0">
                              <td className="px-3 py-1.5 text-xs text-muted-foreground">{i + 1}.</td>
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

              {/* ── 3. Activities Undertaken ── */}
              <section>
                <SectionHeading>Activities Undertaken &amp; Persons Responsible</SectionHeading>
                <div className="border border-border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-secondary/50 border-b border-border">
                        <th className="px-4 py-2.5 w-8" />
                        <th className="text-left px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-muted-foreground">Activity</th>
                        <th className="text-left px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-muted-foreground">Person(s) Responsible</th>
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

              {/* ── 4. Remarks ── */}
              <section>
                <SectionHeading>Remarks</SectionHeading>
                <textarea value={form.remarks} onChange={e => set("remarks", e.target.value)}
                  rows={3} placeholder="Enter any remarks or observations…"
                  className="w-full px-3 py-2.5 bg-input-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/50 transition-all resize-none" />
              </section>

              {/* ── 5. Signatories ── */}
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
                  className="px-5 py-3 rounded-lg border border-border text-sm font-semibold text-foreground hover:bg-accent transition-all">
                  Cancel
                </button>
                <button type="submit"
                  className="flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-all"
                 >
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
  padding: "4px 6px", textAlign: "left", fontSize: "7pt", fontWeight: 700,
  textTransform: "uppercase", letterSpacing: "0.05em", border: "1px solid #888",
  color: "#111", whiteSpace: "nowrap", background: "#e8eaed",
};
const TD: React.CSSProperties = { padding: "3px 6px", border: "1px solid #aaa", fontSize: "7.5pt", color: "#111" };
const TDr: React.CSSProperties = { ...TD, textAlign: "right", fontFamily: "Arial, Helvetica, sans-serif" };

function DocSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "18px" }}>
      <p style={{ fontWeight: 700, fontSize: "8.5pt", textTransform: "uppercase", letterSpacing: "0.14em",
        color: "#333", borderBottom: "1.5px solid #555", paddingBottom: "4px", marginBottom: "10px" }}>
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
          <p style={{ fontSize: "7.5pt", color: "#555", marginBottom: "2px" }}>{label}</p>
          <p style={{ fontWeight: 600, fontSize: "10pt", color: "#111" }}>{val || "—"}</p>
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
    <div style={{ padding: "18mm 20mm", fontFamily: "Arial, Helvetica, sans-serif",
      fontSize: "10pt", color: "#111", lineHeight: 1.45 }}>

      {/* Government letterhead */}
      <div style={{ textAlign: "center", marginBottom: "18px" }}>
        <p style={{ fontSize: "8.5pt", color: "#555" }}>Republic of the Philippines</p>
        <p style={{ fontWeight: 700, fontSize: "13.5pt", margin: "2px 0", color: "#111" }}>Province of Cavite</p>
        <p style={{ fontSize: "9.5pt", color: "#111" }}>Office of the Provincial Population Officer</p>
        <div style={{ margin: "10px 0 0", borderTop: "2.5px solid #111",
          borderBottom: "1px solid #555", padding: "5px 0" }}>
          <p style={{ fontWeight: 700, fontSize: "11.5pt", textTransform: "uppercase",
            letterSpacing: "0.1em", color: "#111" }}>
            {record.category} Documentation Report
          </p>
        </div>
      </div>

      {/* Meta line */}
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "8.5pt",
        color: "#555", marginBottom: "18px", gap: "12px" }}>
        <span>Code: <strong style={{ color: "#1a2332", fontFamily: "Arial, Helvetica, sans-serif" }}>{record.code}</strong></span>
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
            <div key={l} style={{ border: "1px solid #aaa", borderRadius: "3px",
              padding: "6px 8px", textAlign: "center" }}>
              <p style={{ fontSize: "7.5pt", color: "#555", marginBottom: "2px" }}>{l}</p>
              <p style={{ fontWeight: 700, fontFamily: "Arial, Helvetica, sans-serif", fontSize: "12pt", color: "#111" }}>{v}</p>
            </div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", marginBottom: "12px" }}>
          {cfg.ageBrackets.map((ab, i) => (
            <div key={ab.field} style={{ border: "1px solid #d1d8e5", borderRadius: "4px",
              padding: "6px 8px", textAlign: "center" }}>
              <p style={{ fontSize: "7.5pt", color: "#6b7a90", marginBottom: "2px" }}>{ab.label}</p>
              <p style={{ fontWeight: 700, fontFamily: "Arial, Helvetica, sans-serif", fontSize: "12pt" }}>
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
          <div key={label} style={{ borderTop: "2px solid #111", paddingTop: "8px", textAlign: "center" }}>
            <p style={{ fontWeight: 700, fontSize: "10.5pt", color: "#111" }}>{name || "—"}</p>
            {sub && <p style={{ fontSize: "8.5pt", color: "#555", marginTop: "2px" }}>{sub}</p>}
            <p style={{ fontSize: "7.5pt", color: "#555", marginTop: "10px",
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
      <div style={{ padding: "40mm 20mm", textAlign: "center", fontFamily: "Arial, Helvetica, sans-serif",
        color: "#6b7a90" }}>
        <p style={{ fontSize: "14pt", marginBottom: "8px" }}>No records match the current filters.</p>
        <p style={{ fontSize: "10pt" }}>Adjust filters in the records list and try again.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "8mm 8mm", fontFamily: "Arial, Helvetica, sans-serif",
      fontSize: "7.5pt", color: "#111", lineHeight: 1.35 }}>

      {/* Letterhead */}
      <div style={{ textAlign: "center", marginBottom: "14px" }}>
        <p style={{ fontSize: "7pt", color: "#555" }}>Republic of the Philippines · Province of Cavite</p>
        <p style={{ fontWeight: 700, fontSize: "9pt", margin: "2px 0", color: "#111" }}>
          Office of the Provincial Population Officer
        </p>
        <div style={{ margin: "5px 0 0", borderTop: "2px solid #111",
          borderBottom: "1px solid #555", padding: "3px 0" }}>
          <p style={{ fontWeight: 700, fontSize: "9pt", textTransform: "uppercase",
            letterSpacing: "0.08em", color: "#111" }}>Documentation Reports Summary</p>
        </div>
        <p style={{ fontSize: "7pt", color: "#555", marginTop: "3px" }}>Generated: {now}</p>
      </div>

      {/* Active filters */}
      <div style={{ border: "1px solid #aaa", borderRadius: "4px", padding: "4px 8px",
        marginBottom: "7px", fontSize: "7pt", display: "flex", gap: "14px", flexWrap: "wrap", color: "#111" }}>
        <span>Type: <strong>{filters.cat || "All"}</strong></span>
        <span>Month: <strong>{filters.month || "All"}</strong></span>
        <span>District: <strong>{filters.district ? `District ${filters.district}` : "All"}</strong></span>
        <span>Records: <strong>{records.length}</strong></span>
      </div>

      {/* Totals */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "5px", marginBottom: "8px" }}>
        {([
          ["Participants", totals.actual],
          ["Male",   totals.male],
          ["Female", totals.female],
          ["Bracket 1", totals.b1],
          ["Bracket 2", totals.b2],
          ["Bracket 3", totals.b3],
        ] as [string, number][]).map(([label, value]) => (
          <div key={label} style={{ border: "1px solid #aaa", borderRadius: "2px",
            padding: "3px 4px", textAlign: "center" }}>
            <p style={{ fontSize: "6pt", color: "#555", marginBottom: "1px" }}>{label}</p>
            <p style={{ fontWeight: 700, fontFamily: "Arial, Helvetica, sans-serif", fontSize: "10pt", color: "#111" }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Records table */}
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            {["Type","Code","Date","Session","Dist.","Barangay","Municipality",
              "Actual","M","F","10–14 yrs old","15–19 yrs old","20 & above","Documented By"].map(h => (
              <th key={h} style={TH}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {records.map((r, i) => (
            <tr key={r.id} style={{ background: i % 2 === 1 ? "#f5f5f5" : "white" }}>
              <td style={TD}>{r.category}</td>
              <td style={{ ...TD, fontFamily: "Arial, Helvetica, sans-serif", fontSize: "8pt" }}>{r.code}</td>
              <td style={{ ...TD, fontFamily: "Arial, Helvetica, sans-serif", fontSize: "8pt", whiteSpace: "nowrap" }}>{r.dateConduct}</td>
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
          <tr>
            <td colSpan={7} style={{ ...TH, textAlign: "right", letterSpacing: "0.08em" }}>Total</td>
            <td style={{ ...TH, textAlign: "right" }}>{totals.actual}</td>
            <td style={{ ...TH, textAlign: "right" }}>{totals.male}</td>
            <td style={{ ...TH, textAlign: "right" }}>{totals.female}</td>
            <td style={{ ...TH, textAlign: "right" }}>{totals.b1}</td>
            <td style={{ ...TH, textAlign: "right" }}>{totals.b2}</td>
            <td style={{ ...TH, textAlign: "right" }}>{totals.b3}</td>
            <td style={TH} />
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
  const accentHex = category === "RPFP" ? "#0d9488" : category === "AHD" ? "#ea580c" : "#7c3aed";
  const districts = ["I", "II", "III", "IV", "V"];

  const totTypeCol  = cfg.typeColumns.map(tc => records.filter(r => r.sessionType === tc).length);
  const totDistCol  = districts.map(d => records.filter(r => r.district === d).length);
  const totMale     = records.reduce((s, r) => s + r.male, 0);
  const totFemale   = records.reduce((s, r) => s + r.female, 0);
  const totPax      = records.reduce((s, r) => s + (parseInt(r.actualParticipants) || 0), 0);
  const totB1       = records.reduce((s, r) => s + r.ageBracket1, 0);
  const totB2       = records.reduce((s, r) => s + r.ageBracket2, 0);
  const totB3       = records.reduce((s, r) => s + r.ageBracket3, 0);

  const S: Record<string, React.CSSProperties> = {
    page:  { fontFamily: "Arial, Helvetica, sans-serif", fontSize: "8pt", color: "#111", padding: "10mm 10mm 8mm" },
    hdr:   { textAlign: "center", marginBottom: "6mm", borderBottom: "2px solid #111", paddingBottom: "4mm" },
    title: { fontFamily: "Arial, Helvetica, sans-serif", fontSize: "13pt", fontWeight: 700, color: "#111", letterSpacing: "0.05em", textTransform: "uppercase" as const },
    sub:   { fontSize: "8pt", color: "#555", marginTop: "2px" },
    tbl:   { width: "100%", borderCollapse: "collapse" as const, fontSize: "7.5pt" },
    th:    { border: "1px solid #888", padding: "4px 5px", background: "#e8eaed", color: "#111", fontWeight: 700, textAlign: "center" as const, lineHeight: 1.2 },
    thSub: { border: "1px solid #888", padding: "3px 4px", background: "#d4d6d9", color: "#111", fontWeight: 700, textAlign: "center" as const, lineHeight: 1.2, fontSize: "6.5pt" },
    td:    { border: "1px solid #aaa", padding: "3px 5px", verticalAlign: "middle" as const, color: "#111" },
    tdc:   { border: "1px solid #aaa", padding: "3px 5px", textAlign: "center" as const, verticalAlign: "middle" as const, color: "#111" },
    tdr:   { border: "1px solid #aaa", padding: "3px 5px", textAlign: "right" as const, verticalAlign: "middle" as const, color: "#111" },
    totTh: { border: "1px solid #888", padding: "4px 5px", background: "#e8eaed", color: "#111", fontWeight: 700, fontSize: "7.5pt", textAlign: "center" as const },
    totTd: { border: "1px solid #888", padding: "4px 5px", background: "#d4d6d9", color: "#111", fontWeight: 700, textAlign: "center" as const },
  };

  const typeColspan = cfg.typeColumns.length;
  const distColspan = 4;
  const ageColspan  = 3;

  return (
    <div style={S.page}>
      <div style={S.hdr}>
        <p style={{ ...S.sub, fontSize: "7.5pt" }}>Republic of the Philippines · Province of Cavite</p>
        <p style={S.title}>Office of the Provincial Population Officer</p>
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
            <th colSpan={typeColspan} style={S.thSub}>Type of Conduct</th>
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
            {cfg.typeLabels.map(l => <th key={l} style={S.thSub}>{l}</th>)}
            {districts.map(d  => <th key={d}  style={S.thSub}>Dist. {d}</th>)}
            {cfg.ageBrackets.map(a => <th key={a} style={S.thSub}>{a}</th>)}
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
              <tr key={r.id} style={{ background: i % 2 === 1 ? "#f5f5f5" : "white" }}>
                <td style={{ ...S.tdc, fontSize: "7pt" }}>{i + 1}</td>
                <td style={{ ...S.tdc, fontFamily: "Arial, Helvetica, sans-serif", whiteSpace: "nowrap", fontSize: "6.5pt" }}>{r.dateConduct}</td>
                {cfg.typeColumns.map(tc => (
                  <td key={tc} style={S.tdc}>
                    {r.sessionType === tc ? <span style={{ fontWeight: 700, color: "#111" }}>✓</span> : ""}
                  </td>
                ))}
                {districts.map(d => (
                  <td key={d} style={S.tdc}>
                    {r.district === d ? <span style={{ fontWeight: 700, color: "#111" }}>✓</span> : ""}
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
  const [showPrintTip, setShowPrintTip] = useState(true);

  const isSingle = target.mode === "single";
  const isMatrix = target.mode === "matrix";

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
          width: 100% !important; max-width: 100% !important; height: auto !important;
          overflow: visible !important; z-index: 99999 !important;
          background: white !important; margin: 0 !important; padding: 0 !important;
          box-shadow: none !important; border-radius: 0 !important;
        }
        @page { size: A4 ${isSingle ? "portrait" : "landscape"}; margin: 0.5in; }
      }
    `;
    document.head.appendChild(style);
    return () => { style.remove(); };
  }, [isMatrix]);
  const matrixT  = isMatrix ? (target as { mode: "matrix"; records: DocRecord[]; category: Category; month: string; year: string }) : null;
  const isEmpty  = !isSingle && (target as { records: DocRecord[] }).records.length === 0;

  const title = isSingle
    ? (target as { record: DocRecord }).record.code
    : isMatrix
      ? `${matrixT!.category} Monthly Summary — ${matrixT!.month} ${matrixT!.year}`
      : "Documentation Reports Summary";

  useEffect(() => {
    const previousTitle = document.title;
    document.title = title;
    return () => { document.title = previousTitle; };
  }, [title]);
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

  const pdfOrientation = isSingle ? "portrait" : "landscape";
  const paperWidth     = isSingle ? "min(794px, 100%)" : "min(980px, 100%)";

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
      const pdfMargin = isSingle ? 10 : 6;
      await html2pdf()
        .set({
          margin: pdfMargin,
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
    <div className="fixed inset-0 z-[70] flex flex-col">
      {/* Dim backdrop */}
      <div className="absolute inset-0 bg-black/65" onClick={onClose} />

      <div className="relative z-10 flex flex-col h-full">
        {/* ── Modal header (hidden on print) ── */}
        <div className="bg-white border-b border-zinc-200 px-5 py-3 flex items-center gap-3 shrink-0 shadow-sm"
          id="pulse-preview-header">
          {isSingle
            ? <CategoryBadge category={(target as { record: DocRecord }).record.category} />
            : <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border bg-primary/10 text-primary border-primary/20 tracking-widest"
               >ALL</span>}
          <div className="flex-1 min-w-0">
            <p className="font-bold text-foreground text-sm truncate">
              {title}
            </p>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button disabled={dlDisabled} onClick={handleDownloadPDF}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed min-w-[130px] justify-center"
             >
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
        {showPrintTip && (
          <div className="bg-amber-50 border-b border-amber-200 px-5 py-3 text-sm text-amber-900 flex items-start justify-between gap-3 print:hidden">
            <p className="max-w-3xl">
              For a cleaner printout, disable "Headers and footers" in your browser's print dialog (usually under "More settings").
            </p>
            <button onClick={() => setShowPrintTip(false)}
              className="text-amber-800 font-semibold hover:underline">
              Dismiss
            </button>
          </div>
        )}

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
              style={{ width: paperWidth, minHeight: isMatrix ? "auto" : isSingle ? "297mm" : "auto", boxSizing: "border-box" }}>
              {isEmpty ? (
                <div style={{ padding: "40mm 20mm", textAlign: "center",
                  fontFamily: "Arial, Helvetica, sans-serif", color: "#6b7a90" }}>
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

function RecordsView({ user, onLogout, records, onEdit, onDelete, onNewReport, onBack, onOpenRoster, initialFilterMonth = "" }: {
  user: string; onLogout: () => void;
  records: DocRecord[];
  onEdit: (r: DocRecord) => void;
  onDelete: (id: string) => void;
  onNewReport: (cat: Category) => void;
  onBack: () => void;
  onOpenRoster: (rec: DocRecord) => void;
  initialFilterMonth?: string;
}) {
  const [search, setSearch]         = useState("");
  const [filterCat, setFilterCat]   = useState<Category | "">("");
  const [filterType, setFilterType] = useState("");
  const [filterDist, setFilterDist] = useState("");
  const [filterMonth, setFilterMonth] = useState(initialFilterMonth);
  const [filterYear, setFilterYear]   = useState("");
  const [deleteTarget, setDeleteTarget]   = useState<DocRecord | null>(null);
  const [viewTarget, setViewTarget]       = useState<DocRecord | null>(null);
  const [previewTarget, setPreviewTarget] = useState<PreviewTarget | null>(null);
  const [toast, setToast] = useState("");

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  // All unique years present in records, sorted descending
  const allYears = useMemo(() =>
    [...new Set(records.map(r => r.reportYear))].sort((a, b) => b.localeCompare(a)),
    [records]
  );

  const filtered = useMemo(() => records
    .filter(r => {
      if (search && !`${r.code} ${r.barangay} ${r.municipality} ${r.documentedBy} ${r.venue} ${r.sessionType}`.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterCat   && r.category    !== filterCat)   return false;
      if (filterType  && r.sessionType !== filterType)  return false;
      if (filterDist  && r.district    !== filterDist)  return false;
      if (filterMonth && r.reportMonth !== filterMonth) return false;
      if (filterYear  && r.reportYear  !== filterYear)  return false;
      return true;
    })
    .sort((a, b) => b.dateConduct.localeCompare(a.dateConduct)),
    [records, search, filterCat, filterType, filterDist, filterMonth, filterYear]
  );

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
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader user={user} onLogout={onLogout} crumb="RPFP / AHD / GAD Records" />

      <div className="flex-1 overflow-auto">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-6 space-y-5">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <BackButton onClick={onBack} label="Back to Dashboard" />
                <span className="text-muted-foreground/40 text-xs select-none">·</span>
                <LayoutDashboard size={11} className="text-muted-foreground" />
                <span className="text-muted-foreground text-xs">Dashboard</span>
                <ChevronRight size={11} className="text-muted-foreground" />
                <span className="text-xs text-foreground font-semibold">All Records</span>
              </div>
              <h1 className="font-bold text-foreground" style={{ fontSize:"1.3rem" }}>
                Documentation Reports — RPFP · AHD · GAD
              </h1>
              <p className="text-sm text-muted-foreground">{filtered.length} of {records.length} records</p>
            </div>
            <div className="flex items-center gap-2 print:hidden shrink-0 flex-wrap">
              <button
                onClick={() => setPreviewTarget({ mode: "summary", records: filtered,
                  filters: { cat: filterCat, month: filterMonth, district: filterDist } })}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg border border-border bg-card text-foreground text-sm font-semibold hover:bg-accent transition-all">
                <Download size={14} /> Export PDF
              </button>
              {(["RPFP","AHD","GAD"] as Category[]).map(cat => (
                <button key={cat} onClick={() => onNewReport(cat)}
                  className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-bold transition-all text-white hover:opacity-90 border border-transparent"
                  style={{ background:"#d9544a" }}>
                  <Plus size={13} /> {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2.5 print:hidden">
            {[
              { label:"Participants", value:totals.actual, color:"#d9544a", bg:"rgba(217,84,74,0.08)",  border:"rgba(217,84,74,0.18)" },
              { label:"Male",         value:totals.male,   color:"#3c4650", bg:"rgba(60,70,80,0.07)",   border:"rgba(60,70,80,0.14)"  },
              { label:"Female",       value:totals.female, color:"#b83a36", bg:"rgba(184,58,54,0.07)",  border:"rgba(184,58,54,0.15)" },
            ].map(({ label, value, color, bg, border }) => (
              <div key={label} className="rounded-lg px-3.5 py-3" style={{ background: bg, border: `1px solid ${border}` }}>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
                <p className="text-2xl font-bold mt-0.5" style={{ color }}>{value}</p>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-2 print:hidden flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search code, barangay, municipality, encoder…"
                className="w-full pl-9 pr-4 py-2.5 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/50 transition-all" />
            </div>
            <div className="flex gap-2 flex-wrap">
              {/* Category filter */}
              <div className="relative">
                <select value={filterCat} onChange={e => setFilterCat(e.target.value as Category | "")}
                  className="appearance-none bg-card border border-border rounded-lg px-3 py-2.5 pr-7 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/50 transition-all">
                  <option value="">All Types</option>
                  <option value="RPFP">RPFP</option>
                  <option value="AHD">AHD</option>
                  <option value="GAD">GAD</option>
                </select>
                <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              </div>
              <div className="relative">
                <select value={filterYear} onChange={e => setFilterYear(e.target.value)}
                  className="appearance-none bg-card border border-border rounded-lg px-3 py-2.5 pr-7 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/50 transition-all">
                  <option value="">All Years</option>
                  {allYears.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              </div>
              <div className="relative">
                <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)}
                  className="appearance-none bg-card border border-border rounded-lg px-3 py-2.5 pr-7 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/50 transition-all">
                  <option value="">All Months</option>
                  {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              </div>
              <div className="relative">
                <select value={filterDist} onChange={e => setFilterDist(e.target.value)}
                  className="appearance-none bg-card border border-border rounded-lg px-3 py-2.5 pr-7 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/50 transition-all">
                  <option value="">All Districts</option>
                  {["I","II","III","IV","V"].map(d => <option key={d} value={d}>District {d}</option>)}
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
                  <tr className="border-b border-border" style={{ background:"#f0f2f4" }}>
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
                      { h:"10–14 yrs old", cls:"text-right px-3 py-3" },
                      { h:"15–19 yrs old", cls:"text-right px-3 py-3" },
                      { h:"20 & above",   cls:"text-right px-3 py-3" },
                      { h:"Documented By", cls:"text-left px-3 py-3" },
                      { h:"Actions",  cls:"text-center px-3 py-3 print:hidden" },
                    ].map(({ h, cls }) => (
                      <th key={h} className={`${cls} text-xs font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap`}
                       >{h}</th>
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
                        <span className="font-semibold text-primary text-xs">{rec.code}</span>
                      </td>
                      <td className="px-3 py-3 text-xs whitespace-nowrap">{rec.dateConduct}</td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className="text-xs text-foreground">{rec.sessionType}</span>
                      </td>
                      <td className="px-3 py-3 text-center text-xs font-bold">{rec.district}</td>
                      <td className="px-3 py-3 text-sm whitespace-nowrap">{rec.barangay}</td>
                      <td className="px-3 py-3 text-sm whitespace-nowrap">{rec.municipality}</td>
                      {[rec.actualParticipants, rec.male, rec.female, rec.ageBracket1, rec.ageBracket2, rec.ageBracket3].map((v, vi) => (
                        <td key={vi} className={`px-3 py-3 text-right text-xs ${vi === 0 ? "font-bold text-foreground" : "text-muted-foreground"}`}>{v}</td>
                      ))}
                      <td className="px-3 py-3 text-xs whitespace-nowrap">{rec.documentedBy}</td>
                      <td className="px-3 py-3 print:hidden" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-0.5">
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
                          {rec.category === "RPFP" && (
                            <>
                              <div className="w-px h-3.5 bg-border mx-0.5" />
                              <button onClick={() => onOpenRoster(rec)}
                                className="p-1.5 rounded hover:bg-teal-50 text-muted-foreground hover:text-teal-700 transition-colors" title="Participant List (Form 1)">
                                <BookUser size={13} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                {filtered.length > 0 && (
                  <tfoot>
                    <tr className="border-t-2 border-primary/20 bg-primary/5">
                      <td colSpan={7} className="px-3 py-3 text-xs font-bold uppercase tracking-widest"
                       >Total</td>
                      {[totals.actual, totals.male, totals.female, totals.b1, totals.b2, totals.b3].map((v, i) => (
                        <td key={i} className="px-3 py-3 text-right text-xs font-bold">{v}</td>
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
                  <span className="bg-white/25 text-white text-xs font-bold px-2.5 py-1 rounded tracking-widest">{viewTarget.category}</span>
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
                      <dt className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{k}</dt>
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
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wide leading-tight">{label}</p>
                        <p className="font-bold text-base text-foreground">{value}</p>
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
                      <p className="text-xs text-muted-foreground mt-2 uppercase tracking-widest">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-between items-center px-6 py-4 border-t border-border bg-secondary/20 print:hidden">
                <div className="flex gap-2">
                  <button
                    onClick={() => { setPreviewTarget({ mode: "single", record: viewTarget }); setViewTarget(null); }}
                    className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg border border-border text-sm font-semibold hover:bg-accent transition-all">
                    <Download size={13} /> Export PDF
                  </button>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { onEdit(viewTarget); setViewTarget(null); }}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-border text-sm font-semibold hover:bg-accent transition-all">
                    <Edit2 size={13} /> Edit
                  </button>
                  <button onClick={() => setViewTarget(null)}
                    className="px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-all">
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
                <h3 className="font-bold text-foreground">Delete Record</h3>
                <p className="text-sm text-muted-foreground mt-1 leading-snug">
                  Permanently delete <span className="font-semibold text-foreground">{deleteTarget.code}</span>? This cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleteTarget(null)}
                className="px-4 py-2.5 rounded-lg border border-border text-sm font-semibold hover:bg-accent transition-all">Cancel</button>
              <button onClick={confirmDelete}
                className="px-4 py-2.5 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-all">Delete</button>
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
    return `${base} text-white` + " border-transparent";
  };
  const catTabInlineStyle = (c: Category) =>
    c === category ? { background: "#d9544a" } : {};

  // sticky column style helpers
  const stickyLeft0 = "sticky left-0 z-10 bg-card";
  const stickyLeft8 = "sticky left-8 z-10 bg-card";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader user={user} onLogout={onLogout} crumb="Monthly Summary" />

      <div className="flex-1 overflow-auto">
        <div className="max-w-full px-4 sm:px-6 py-6 space-y-5">

          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-3">
            <BackButton onClick={onBack} label="Back to Dashboard" />
            <div className="h-4 w-px bg-border mx-1" />
            <h1 className="text-base font-bold text-foreground">
              Monthly Summary
            </h1>
            <div className="flex-1" />
            <button onClick={openMatrix}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm font-semibold text-foreground hover:bg-accent transition-all">
              <Download size={13} /> Export PDF
            </button>
          </div>

          {/* Controls */}
          <div className="bg-card border border-border rounded-xl p-4 flex flex-wrap items-center gap-4">
            {/* Category tabs */}
            <div className="flex items-center gap-2">
              {(["RPFP", "AHD", "GAD"] as Category[]).map(c => (
                <button key={c} onClick={() => setCategory(c)} className={catTabStyle(c)}
                  style={{ ...catTabInlineStyle(c) }}>{c}</button>
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
                     >#</th>
                    <th rowSpan={2} className={`border border-white/20 px-2 py-2 text-center font-bold w-20 ${stickyLeft8}`}>
                      Date of Conduct
                    </th>
                    <th rowSpan={2} className="border border-white/20 px-2 py-2 text-center font-bold whitespace-nowrap">Code</th>
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
                    <th colSpan={4} className="border border-white/20 px-2 py-2 text-center font-bold">Age Bracket</th>
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
                    <th className="border border-white/20 px-1 py-1.5 text-center font-semibold">Total</th>
                  </tr>
                </thead>

                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5 + cfg.typeColumns.length + 4 + cfg.ageBrackets.length + 5}
                        className="border border-border py-10 text-center text-muted-foreground italic">
                        No reports encoded for {selMonth} {selYear} · {category}
                      </td>
                    </tr>
                  ) : filtered.map((r, i) => {
                    const pax = parseInt(r.actualParticipants) || 0;
                    return (
                      <tr key={r.id} className={i % 2 === 1 ? "bg-background/60" : "bg-card"}>
                        <td className={`border border-border px-2 py-1.5 text-center text-muted-foreground ${stickyLeft0}`}>{i + 1}</td>
                        <td className={`border border-border px-2 py-1.5 text-center text-[10px] whitespace-nowrap ${stickyLeft8}`}>{r.dateConduct}</td>
                        <td className="border border-border px-2 py-1.5 text-center text-[10px] whitespace-nowrap font-mono">{r.code}</td>
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
                        <td className="border border-border px-2 py-1.5 text-right">{r.male}</td>
                        <td className="border border-border px-2 py-1.5 text-right">{r.female}</td>
                        <td className="border border-border px-2 py-1.5 text-right font-semibold">{pax}</td>
                        <td className="border border-border px-2 py-1.5 text-right">{r.ageBracket1}</td>
                        <td className="border border-border px-2 py-1.5 text-right">{r.ageBracket2}</td>
                        <td className="border border-border px-2 py-1.5 text-right">{r.ageBracket3}</td>
                        <td className="border border-border px-2 py-1.5 text-right font-semibold">{r.ageBracket1 + r.ageBracket2 + r.ageBracket3}</td>
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
                    <td className="border border-border px-2 py-2" />
                    {totals.type.map((v, i) => (
                      <td key={i} className={`border border-border px-1 py-2 text-center ${accentCls}`}>{v > 0 ? v : "—"}</td>
                    ))}
                    {totals.dist.map((v, i) => (
                      <td key={i} className="border border-border px-1 py-2 text-center text-primary">{v > 0 ? v : "—"}</td>
                    ))}
                    <td className="border border-border px-2 py-2" />
                    <td className="border border-border px-2 py-2" />
                    <td className="border border-border px-2 py-2 text-right">{totals.male}</td>
                    <td className="border border-border px-2 py-2 text-right">{totals.female}</td>
                    <td className="border border-border px-2 py-2 text-right text-primary">{totals.pax}</td>
                    <td className="border border-border px-2 py-2 text-right">{totals.b1}</td>
                    <td className="border border-border px-2 py-2 text-right">{totals.b2}</td>
                    <td className="border border-border px-2 py-2 text-right">{totals.b3}</td>
                    <td className="border border-border px-2 py-2 text-right text-primary">{totals.b1 + totals.b2 + totals.b3}</td>
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

// ─── RPFP FORM 1 ─────────────────────────────────────────────────────────────

const CIVIL_STATUS_OPTIONS = [
  {v:"1",l:"1 – Married"},{v:"2",l:"2 – Single"},{v:"3",l:"3 – Widow/Widower"},
  {v:"4",l:"4 – Separated"},{v:"5",l:"5 – Live-in"},
];
const EDUCATION_OPTIONS = [
  {v:"1",l:"1 – No Education"},{v:"2",l:"2 – Elementary Level"},{v:"3",l:"3 – Elementary Graduate"},
  {v:"4",l:"4 – High School Level"},{v:"5",l:"5 – High School Graduate"},{v:"6",l:"6 – Vocational"},
  {v:"7",l:"7 – College Level"},{v:"8",l:"8 – College Graduate"},{v:"9",l:"9 – Post Graduate"},
];
const FP_ARTIFICIAL = [
  {v:"1",l:"1 – Condom"},{v:"2",l:"2 – IUD"},{v:"3",l:"3 – Pills"},{v:"4",l:"4 – Injectable"},
  {v:"5",l:"5 – Vasectomy"},{v:"6",l:"6 – Tubal Ligation"},{v:"7",l:"7 – Implant"},
];
const FP_MODERN_NFP = [
  {v:"8",l:"8 – CMM/Billings"},{v:"9",l:"9 – BBT"},{v:"10",l:"10 – Sympto-Thermal"},
  {v:"11",l:"11 – SDM"},{v:"12",l:"12 – LAM"},
];
const TRADITIONAL_TYPE_OPTIONS = [
  {v:"1",l:"1 – Withdrawal"},{v:"2",l:"2 – Rhythm"},{v:"3",l:"3 – Calendar"},
  {v:"4",l:"4 – Abstinence"},{v:"5",l:"5 – Herbal"},{v:"6",l:"6 – No Method"},
];
const TRADITIONAL_STATUS_OPTIONS = [
  {v:"A",l:"A – Expressing Intention to Use Modern FP"},{v:"B",l:"B – Undecided"},
  {v:"C",l:"C – Currently Pregnant"},{v:"D",l:"D – No Intention to Use"},
];
const REASON_OPTIONS = [
  {v:"1",l:"1 – Spacing"},{v:"2",l:"2 – Limiting"},{v:"3",l:"3 – Achieving"},
];

const inputClsRpfp = "w-full px-3 py-2 bg-input-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/50 transition-all";

const SYNC_FIELDS: (keyof RPFPParticipant)[] = [
  "address", "numChildren", "fpMethod", "intentionToShift",
  "traditionalType", "traditionalStatus", "reasonForUsing",
];

function CodeLegend() {
  const [open, setOpen] = useState(false);
  const sections = [
    { title: "Civil Status", rows: ["1 – Married","2 – Single","3 – Widow/Widower","4 – Separated","5 – Live-in"] },
    { title: "Highest Educational Attainment", rows: ["1 – No Education","2 – Elementary Level","3 – Elementary Graduate","4 – High School Level","5 – High School Graduate","6 – Vocational","7 – College Level","8 – College Graduate","9 – Post Graduate"] },
    { title: "Artificial FP Methods", rows: ["1 – Condom","2 – IUD","3 – Pills","4 – Injectable","5 – Vasectomy","6 – Tubal Ligation","7 – Implant"] },
    { title: "Modern NFP Methods", rows: ["8 – CMM/Billings","9 – BBT","10 – Sympto-Thermal","11 – SDM","12 – LAM"] },
    { title: "Traditional FP User: Type", rows: ["1 – Withdrawal","2 – Rhythm","3 – Calendar","4 – Abstinence","5 – Herbal","6 – No Method"] },
    { title: "Non-Modern FP User: Status", rows: ["A – Expressing Intention to Use Modern FP","B – Undecided","C – Currently Pregnant","D – No Intention to Use"] },
    { title: "Reason for Using FP / Intending to Use", rows: ["1 – Spacing","2 – Limiting","3 – Achieving"] },
  ];
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button type="button" onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-card hover:bg-accent/50 transition-colors text-left">
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
          <Shield size={13} /> Code Legend / Reference
        </span>
        <ChevronDown size={14} className={`text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="bg-card border-t border-border px-4 py-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sections.map(s => (
            <div key={s.title}>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">{s.title}</p>
              <ul className="space-y-0.5">
                {s.rows.map(r => <li key={r} className="text-xs text-foreground">{r}</li>)}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ParticipantFields({
  p, hasError, isPartner, onChange, onSigChange,
}: {
  p: RPFPParticipant;
  hasError: boolean;
  isPartner?: boolean;
  onChange: (field: keyof RPFPParticipant, val: string) => void;
  onSigChange: (val: string) => void;
}) {
  const req = (field: keyof RPFPParticipant) => hasError && !p[field] ? " border-red-400" : "";
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="sm:col-span-2">
        <label className="block text-xs font-semibold text-muted-foreground mb-1">
          {isPartner ? "Partner's Name" : "Name"} <span className="text-red-500">*</span>
        </label>
        <input type="text" value={p.name}
          onChange={e => onChange("name", e.target.value.toUpperCase())}
          placeholder="First Name Surname"
          style={{ textTransform: "uppercase" }}
          className={`${inputClsRpfp}${req("name")}`} />
      </div>
      <div>
        <label className="block text-xs font-semibold text-muted-foreground mb-1">Sex <span className="text-red-500">*</span></label>
        <div className="flex gap-4 mt-1.5">
          {(["M","F"] as const).map(s => (
            <label key={s} className="flex items-center gap-2 cursor-pointer text-sm">
              <input type="radio" name={`sex-${p.id}-${isPartner?"p":""}`} value={s} checked={p.sex === s}
                onChange={() => onChange("sex", s)} className="accent-primary" />
              {s === "M" ? "Male" : "Female"}
            </label>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-muted-foreground mb-1">Civil Status <span className="text-red-500">*</span></label>
        <select value={p.civilStatus} onChange={e => onChange("civilStatus", e.target.value)}
          className={`${inputClsRpfp}${req("civilStatus")}`}>
          <option value="">— Select —</option>
          {CIVIL_STATUS_OPTIONS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs font-semibold text-muted-foreground mb-1">Birthdate <span className="text-red-500">*</span></label>
        <input type="date" value={p.birthdate} onChange={e => onChange("birthdate", e.target.value)}
          className={`${inputClsRpfp}${req("birthdate")}`}
          style={{ colorScheme: "light", color: "var(--foreground)" }} />
        {p.birthdate && <p className="text-xs text-muted-foreground mt-0.5">Age: {calcAge(p.birthdate)}</p>}
      </div>
      <div className="sm:col-span-2">
        <label className="block text-xs font-semibold text-muted-foreground mb-1">Address / Household ID No.</label>
        <input type="text" value={p.address} onChange={e => onChange("address", e.target.value)}
          placeholder="Street / Sitio / Purok, Barangay" className={inputClsRpfp} />
      </div>
      <div>
        <label className="block text-xs font-semibold text-muted-foreground mb-1">Highest Educational Attainment</label>
        <select value={p.education} onChange={e => onChange("education", e.target.value)} className={inputClsRpfp}>
          <option value="">— Select —</option>
          {EDUCATION_OPTIONS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs font-semibold text-muted-foreground mb-1">No. of Children</label>
        <input type="number" min="0" step="1" value={p.numChildren} onChange={e => onChange("numChildren", e.target.value)}
          placeholder="0" style={{ MozAppearance:"textfield" } as React.CSSProperties} className={inputClsRpfp} />
      </div>
      <div className="sm:col-span-2">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 mt-1">FP Method / Status</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">Modern FP User: Method Used</label>
            <select value={p.fpMethod} onChange={e => onChange("fpMethod", e.target.value)} className={inputClsRpfp}>
              <option value="">— Select —</option>
              <optgroup label="Artificial Methods">{FP_ARTIFICIAL.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}</optgroup>
              <optgroup label="Modern NFP Methods">{FP_MODERN_NFP.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}</optgroup>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">Modern FP User: Intention to Shift to Other FP Method</label>
            <select value={p.intentionToShift} onChange={e => onChange("intentionToShift", e.target.value)} className={inputClsRpfp}>
              <option value="">— Select —</option>
              <optgroup label="Artificial Methods">{FP_ARTIFICIAL.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}</optgroup>
              <optgroup label="Modern NFP Methods">{FP_MODERN_NFP.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}</optgroup>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">Traditional FP User: Type</label>
            <select value={p.traditionalType} onChange={e => onChange("traditionalType", e.target.value)} className={inputClsRpfp}>
              <option value="">— Select —</option>
              {TRADITIONAL_TYPE_OPTIONS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">Traditional FP User: Status</label>
            <select value={p.traditionalStatus} onChange={e => onChange("traditionalStatus", e.target.value)} className={inputClsRpfp}>
              <option value="">— Select —</option>
              {TRADITIONAL_STATUS_OPTIONS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">Reason for Intending to use FP Method</label>
            <select value={p.reasonForUsing} onChange={e => onChange("reasonForUsing", e.target.value)} className={inputClsRpfp}>
              <option value="">— Select —</option>
              {REASON_OPTIONS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

function blankParticipant(id?: string): RPFPParticipant {
  return { id: id ?? crypto.randomUUID(), name: "", sex: "", civilStatus: "", birthdate: "", address: "", education: "",
    numChildren: "", fpMethod: "", intentionToShift: "", traditionalType: "", traditionalStatus: "",
    reasonForUsing: "", signatureData: "", partner: null };
}

function calcAge(birthdate: string): string {
  if (!birthdate) return "";
  const dob = new Date(birthdate);
  if (isNaN(dob.getTime())) return "";
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return String(age);
}

function RPFPForm1View({
  user, onLogout, parentRecord: initialParent, allRpfpRecords, existingRosters, existingForm, onSave, onBack
}: {
  user: string;
  onLogout: () => void;
  parentRecord: DocRecord | null;
  allRpfpRecords: DocRecord[];
  existingRosters: RPFPForm1Record[];
  existingForm: RPFPForm1Record | null;
  onSave: (form: RPFPForm1Record) => void | Promise<void>;
  onBack: () => void;
}) {
  const [classNo,      setClassNo]      = useState(existingForm?.classNo      ?? initialParent?.code         ?? "");
  const [municipality, setMunicipality] = useState(existingForm?.municipality ?? initialParent?.municipality  ?? "");
  const [barangay,     setBarangay]     = useState(existingForm?.barangay     ?? initialParent?.barangay      ?? "");
  const [dateConduct,  setDateConduct]  = useState(existingForm?.dateConduct  ?? initialParent?.dateConduct   ?? "");
  const [activityType, setActivityType] = useState(existingForm?.activityType ?? "");
  const [dataCollectionMethod, setDataCollectionMethod] = useState(existingForm?.dataCollectionMethod ?? "");
  const [dataCollectionOther, setDataCollectionOther] = useState(existingForm?.dataCollectionOther ?? "");
  const [participants, setParticipants] = useState<RPFPParticipant[]>(
    existingForm?.participants ?? []
  );
  const [preparedBy, setPreparedBy] = useState(existingForm?.preparedBy ?? user);
  const [preparedSig, setPreparedSig] = useState(existingForm ? "" : "");
  const [reviewedBy, setReviewedBy] = useState(existingForm?.reviewedBy ?? "");
  const [reviewedSig, setReviewedSig] = useState("");
  const [approvedBy, setApprovedBy] = useState(existingForm?.approvedBy ?? "");
  const [approvedSig, setApprovedSig] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState("");
  const [errors, setErrors] = useState<Set<string>>(new Set());
  const [partnerConfirmId, setPartnerConfirmId] = useState<string | null>(null);
  const [showBackConfirm, setShowBackConfirm] = useState(false);
  const firstErrorRef = useRef<HTMLDivElement>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3500); };

  const hasUnsavedData = participants.some(p => p.name || p.address || (p.partner && (p.partner.name || p.partner.address)));

  const handleBack = () => {
    if (hasUnsavedData) { setShowBackConfirm(true); return; }
    onBack();
  };

  const addParticipant = () => {
    const id = crypto.randomUUID();
    setParticipants(prev => [...prev, blankParticipant(id)]);
    setExpanded(prev => { const s = new Set(prev); s.add(id); return s; });
  };

  const updateParticipant = (id: string, field: keyof RPFPParticipant, val: string) => {
    setParticipants(prev => prev.map(p => {
      if (p.id !== id) return p;
      const updated = { ...p, [field]: val };
      // When civil status changes away from Married/Live-in and partner exists, prompt
      if (field === "civilStatus" && val !== "1" && val !== "5" && p.partner) {
        setPartnerConfirmId(id);
        return p; // hold change until confirmed
      }
      // Auto-add partner slot when switching to Married/Live-in; pre-populate sync fields
      if (field === "civilStatus" && (val === "1" || val === "5") && !p.partner) {
        const newPartner = { ...blankParticipant(crypto.randomUUID()), civilStatus: val };
        SYNC_FIELDS.forEach(f => { (newPartner as Record<string, unknown>)[f] = updated[f] as unknown; });
        updated.partner = newPartner;
      }
      // Sync shared fields to existing partner instantly
      if (SYNC_FIELDS.includes(field) && updated.partner) {
        updated.partner = { ...updated.partner, [field]: val };
      }
      return updated;
    }));
  };

  const updatePartner = (pid: string, field: keyof RPFPParticipant, val: string) => {
    setParticipants(prev => prev.map(p => {
      if (p.id !== pid || !p.partner) return p;
      const updatedPartner = { ...p.partner, [field]: val };
      // Sync shared fields back to primary participant
      const syncedPrimary = SYNC_FIELDS.includes(field) ? { ...p, [field]: val } : p;
      return { ...syncedPrimary, partner: updatedPartner };
    }));
  };

  const confirmRemovePartner = (id: string, newCivilStatus: string) => {
    setParticipants(prev => prev.map(p => p.id === id ? { ...p, civilStatus: newCivilStatus, partner: null } : p));
    setPartnerConfirmId(null);
  };

  const removeParticipant = (id: string) => {
    setParticipants(prev => prev.filter(p => p.id !== id));
    setExpanded(prev => { const s = new Set(prev); s.delete(id); return s; });
  };

  const toggleExpanded = (id: string) => {
    setExpanded(prev => { const s = new Set(prev); if (s.has(id)) s.delete(id); else s.add(id); return s; });
  };

  const commitSave = (newParticipants: RPFPParticipant[]) => {
    onSave({
      id: existingForm?.id ?? "",
      parentRecordId: initialParent?.id ?? "",
      classNo,
      municipality: municipality.trim(),
      barangay: barangay.trim(),
      dateConduct,
      activityType, dataCollectionMethod, dataCollectionOther,
      participants: newParticipants,
      preparedBy, reviewedBy, approvedBy,
    });
  };

  const handleSave = () => {
    const bad = new Set<string>();
    for (const p of participants) {
      if (!p.name || !p.sex || !p.civilStatus || !p.birthdate) bad.add(p.id);
      if (p.partner && (!p.partner.name || !p.partner.sex || !p.partner.civilStatus || !p.partner.birthdate)) bad.add(p.id);
    }
    if (bad.size > 0) {
      setErrors(bad);
      setExpanded(prev => { const s = new Set(prev); bad.forEach(id => s.add(id)); return s; });
      showToast("Please complete required fields (Name, Sex, Civil Status, Birthdate) for all participants.");
      setTimeout(() => firstErrorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
      return;
    }
    setErrors(new Set());
    commitSave(participants);
  };

  return (
    <div className="min-h-screen bg-background" style={{ fontFamily: "Arial, sans-serif" }}>
      <AppHeader user={user} onLogout={onLogout} crumb="RPFP Form 1 – Participant List" />
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">
        <BackButton onClick={handleBack} label="Back to RPFP Report" />

        {/* Header info card */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <BookUser size={18} className="text-teal-600" />
            RPFP Form 1 – Participant List
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Class No.</label>
              <input type="text" value={classNo} onChange={e => setClassNo(e.target.value)} placeholder="N/A" className={inputClsRpfp} />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Prov/City/Mun.</label>
              <div className="relative">
                <select value={municipality} onChange={e => { setMunicipality(e.target.value); setBarangay(""); }}
                  className={`${inputClsRpfp} appearance-none pr-7`}>
                  <option value="">Select municipality…</option>
                  {Object.keys(MUNICIPALITY_DATA).sort().map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Barangay</label>
              <div className="relative">
                {(() => {
                  const brgyList = munBarangays(municipality);
                  return (
                    <select value={barangay} onChange={e => setBarangay(e.target.value)}
                      disabled={!municipality}
                      className={`${inputClsRpfp} appearance-none pr-7 disabled:opacity-50`}>
                      <option value="">
                        {!municipality ? "Select municipality first" : "Select barangay…"}
                      </option>
                      {brgyList.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  );
                })()}
                <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Date Conducted</label>
              <input type="date" value={dateConduct} onChange={e => setDateConduct(e.target.value)} className={inputClsRpfp}
                style={{ colorScheme: "light", color: "#000" }} />
            </div>
          </div>
          <div className="h-px bg-border" />
          {/* Type of Activity / Data Collection Method — 2-column checkbox grid */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-0 w-fit">
            {/* Column 1 — Type of Activity */}
            <div className="flex flex-col gap-2">
              {["4Ps", "Faith-Based Organization", "PMC", "Usapan"].map(opt => (
                <label key={opt} className="flex items-center gap-2 cursor-pointer text-sm select-none">
                  <input type="checkbox"
                    checked={activityType === opt}
                    onChange={e => setActivityType(e.target.checked ? opt : "")}
                    className="accent-primary w-4 h-4 rounded shrink-0" />
                  {opt}
                </label>
              ))}
            </div>
            {/* Column 2 — Data Collection Method */}
            <div className="flex flex-col gap-2">
              {["House-to-House", "Profile Only"].map(opt => (
                <label key={opt} className="flex items-center gap-2 cursor-pointer text-sm select-none">
                  <input type="checkbox"
                    checked={dataCollectionMethod === opt}
                    onChange={e => setDataCollectionMethod(e.target.checked ? opt : "")}
                    className="accent-primary w-4 h-4 rounded shrink-0" />
                  {opt}
                </label>
              ))}
              <label className="flex items-center gap-2 cursor-pointer text-sm select-none">
                <input type="checkbox"
                  checked={dataCollectionMethod === "Others"}
                  onChange={e => setDataCollectionMethod(e.target.checked ? "Others" : "")}
                  className="accent-primary w-4 h-4 rounded shrink-0" />
                Others, please specify
              </label>
              {dataCollectionMethod === "Others" && (
                <input type="text" value={dataCollectionOther} onChange={e => setDataCollectionOther(e.target.value)}
                  placeholder="specify here"
                  className="border-b border-border bg-transparent text-sm focus:outline-none focus:border-primary px-1 min-w-[160px] ml-6" />
              )}
            </div>
          </div>
        </div>

        {/* Code legend */}
        <CodeLegend />

        {/* Participants section */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Users size={16} className="text-teal-600" />
              Participants
              {participants.length > 0 && (
                <span className="ml-1 bg-teal-100 text-teal-700 text-xs font-bold px-2 py-0.5 rounded-full">{participants.length}</span>
              )}
            </h3>
            <button type="button" onClick={addParticipant}
              className="flex items-center gap-1.5 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 transition-colors px-3 py-1.5 rounded-lg">
              <Plus size={14} /> Add Participant
            </button>
          </div>

          {participants.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center text-muted-foreground px-4">
              <Users size={36} className="mb-3 opacity-30" />
              <p className="font-semibold mb-1">No participants yet</p>
              <p className="text-sm mb-4">Start by adding the first participant/couple to this list.</p>
              <button type="button" onClick={addParticipant}
                className="flex items-center gap-2 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 px-4 py-2 rounded-lg transition-colors">
                <Plus size={15} /> Add First Participant
              </button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {participants.map((p, idx) => {
                const isExpanded = expanded.has(p.id);
                const hasError = errors.has(p.id);
                const hasPartner = p.partner !== null;
                return (
                  <div key={p.id} ref={hasError && idx === participants.findIndex(x => errors.has(x.id)) ? firstErrorRef : undefined}
                    className={hasError ? "ring-1 ring-red-400 ring-inset" : ""}>
                    {/* Card header */}
                    <div
                      className={`flex items-center justify-between px-5 py-3 cursor-pointer select-none ${isExpanded ? "bg-teal-50/60" : "hover:bg-accent/40"}`}
                      onClick={() => toggleExpanded(p.id)}>
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-full bg-teal-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {p.name || <span className="italic text-muted-foreground font-normal">Unnamed Participant</span>}
                            {hasPartner && p.partner?.name && <span className="text-muted-foreground font-normal"> & {p.partner.name}</span>}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {p.birthdate ? `Age ${calcAge(p.birthdate)}` : ""}
                            {p.sex ? ` · ${p.sex === "M" ? "Male" : "Female"}` : ""}
                            {hasPartner ? " · Couple" : ""}
                          </p>
                        </div>
                        {hasError && <span className="text-xs text-red-500 font-semibold ml-2">Incomplete</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={e => { e.stopPropagation(); removeParticipant(p.id); }}
                          className="p-1.5 rounded hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors" title="Remove row">
                          <Trash2 size={13} />
                        </button>
                        <ChevronDown size={16} className={`text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                      </div>
                    </div>
                    {/* Card body */}
                    {isExpanded && (
                      <div className="px-5 pb-5 pt-3 bg-white space-y-5">
                        <ParticipantFields p={p} hasError={hasError}
                          onChange={(field, val) => updateParticipant(p.id, field, val)}
                          onSigChange={val => updateParticipant(p.id, "signatureData", val)} />

                        {/* Partner sub-section — shown for Married (1) or Live-in (5) */}
                        {hasPartner && p.partner && (
                          <div className="border-l-4 border-teal-300 pl-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-bold uppercase tracking-wider text-teal-700">Partner / Spouse Details</p>
                              <button type="button" onClick={e => { e.stopPropagation(); setPartnerConfirmId(p.id); }}
                                className="text-xs text-muted-foreground hover:text-red-600 transition-colors flex items-center gap-1">
                                <X size={11} /> Remove partner
                              </button>
                            </div>
                            <ParticipantFields p={p.partner} hasError={hasError} isPartner
                              onChange={(field, val) => updatePartner(p.id, field, val)}
                              onSigChange={val => updatePartner(p.id, "signatureData", val)} />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Partner removal confirmation dialog */}
        {partnerConfirmId !== null && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full space-y-4">
              <div className="flex items-start gap-3">
                <AlertTriangle size={20} className="text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-foreground">Remove partner details?</p>
                  <p className="text-sm text-muted-foreground mt-1">Changing civil status will remove the partner&apos;s details for this row. This cannot be undone.</p>
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setPartnerConfirmId(null)}
                  className="px-4 py-2 rounded-lg border border-border text-sm font-semibold hover:bg-accent transition-colors">Keep Partner</button>
                <button type="button" onClick={() => {
                  const p = participants.find(x => x.id === partnerConfirmId);
                  if (p) confirmRemovePartner(partnerConfirmId!, p.civilStatus);
                  setPartnerConfirmId(null);
                }}
                  className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors">Remove</button>
              </div>
            </div>
          </div>
        )}

        {/* Save button */}
        <div className="flex justify-end pb-8">
          <button type="button" onClick={handleSave}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors shadow-sm">
            <ClipboardCheck size={17} /> Save
          </button>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-5 right-5 flex items-center gap-2.5 px-4 py-3 bg-red-600 text-white text-sm font-semibold rounded-lg shadow-lg z-50">
          <AlertTriangle size={15} /> {toast}
        </div>
      )}

      {showBackConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-card border border-border rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 space-y-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex-shrink-0 w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center">
                <AlertTriangle size={18} className="text-amber-600" />
              </div>
              <div>
                <p className="font-bold text-foreground text-sm">Unsaved Changes</p>
                <p className="text-muted-foreground text-xs mt-1">You have participant data that has not been saved. Are you sure you want to go back? Your changes will be lost.</p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowBackConfirm(false)}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-muted/50 transition-colors">
                Stay
              </button>
              <button onClick={() => { setShowBackConfirm(false); onBack(); }}
                className="px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors"
                style={{ background: "#D9544A" }}>
                Leave
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// ─── RPFP ROSTER LIST VIEW ────────────────────────────────────────────────────

function RPFPRosterListView({
  user, onLogout, forms, onEncodeNew, onEdit, onBack,
}: {
  user: string;
  onLogout: () => void;
  forms: RPFPForm1Record[];
  onEncodeNew: () => void;
  onEdit: (form: RPFPForm1Record) => void;
  onBack: () => void;
}) {
  const [filterMun, setFilterMun] = useState("");
  const [filterBgy, setFilterBgy] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [toast, setToast] = useState("");
  const printRef = useRef<HTMLDivElement>(null);

  const municipalities = useMemo(() => Array.from(new Set(forms.map(f => f.municipality).filter(Boolean))).sort(), [forms]);
  const barangays = useMemo(() => Array.from(new Set(
    forms.filter(f => !filterMun || f.municipality === filterMun).map(f => f.barangay).filter(Boolean)
  )).sort(), [forms, filterMun]);

  const filtered = useMemo(() => forms.filter(f =>
    (!filterMun || f.municipality === filterMun) &&
    (!filterBgy || f.barangay === filterBgy) &&
    (!filterDate || f.dateConduct === filterDate)
  ), [forms, filterMun, filterBgy, filterDate]);

  const selectedForm = selectedFormId !== null ? forms.find(f => f.id === selectedFormId) ?? null : null;

  const FP_ALL = [...FP_ARTIFICIAL, ...FP_MODERN_NFP];
  const fpLabel = (v: string) => FP_ALL.find(o => o.v === v)?.v ?? v;

  const inputCls = "px-2.5 py-1.5 bg-input-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/50 transition-all";

  // Shared HTML builder — used by print window, PDF preview, and PDF download
  const buildRosterHTMLContent = (form: RPFPForm1Record): string => {
    const FP_ALL_b = [...FP_ARTIFICIAL, ...FP_MODERN_NFP];
    const fpLbl = (v: string) => FP_ALL_b.find(o => o.v === v)?.v ?? v;
    const dateLabel = form.dateConduct
      ? new Date(form.dateConduct + "T00:00:00").toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })
      : "—";

    const fmtBirthdate = (d: string) => {
      if (!d) return "—";
      const parts = d.split("-");
      if (parts.length !== 3) return d;
      const formatted = `${parts[1]}/${parts[2]}/${parts[0]}`;
      const age = calcAge(d);
      return age ? `${formatted} (${age})` : formatted;
    };

    const thC = 'style="border:1px solid #888;padding:4px 6px;font-size:7.5px;font-weight:bold;background:#e8eaed;color:#111;text-align:center;vertical-align:middle;"';
    const thL = 'style="border:1px solid #888;padding:4px 6px;font-size:7.5px;font-weight:bold;background:#e8eaed;color:#111;text-align:left;vertical-align:middle;"';
    const thSubC = 'style="border:1px solid #888;padding:3px 5px;font-size:7px;font-weight:bold;background:#d4d6d9;color:#111;text-align:center;vertical-align:middle;"';

    const tdBase = "border:1px solid #aaa;padding:3px 6px;font-size:7.5px;color:#111;";
    const tc = (extra = "") => `style="${tdBase}text-align:center;vertical-align:middle;${extra}"`;
    const tl = (extra = "") => `style="${tdBase}text-align:left;vertical-align:middle;${extra}"`;
    const dividerBorder = "border-bottom:2px solid #555;";

    const renderPersonCols = (p: RPFPParticipant, bg: string, extra = "") => {
      const cs = CIVIL_STATUS_OPTIONS.find(o => o.v === p.civilStatus)?.v ?? p.civilStatus;
      const ed = EDUCATION_OPTIONS.find(o => o.v === p.education)?.v ?? p.education;
      const x = bg + extra;
      return `
        <td style="${tdBase}text-align:left;vertical-align:middle;${x}text-transform:uppercase;">${p.name || "—"}</td>
        <td ${tc(x)}>${p.sex || "—"}</td>
        <td ${tc(x)}>${cs || "—"}</td>
        <td ${tl(x)}>${fmtBirthdate(p.birthdate)}</td>
        <td ${tc(x)}>${ed || "—"}</td>`;
    };

    const bodyRows = form.participants.map((participant, idx) => {
      const hasPartner = !!participant.partner;
      const rowSpan = hasPartner ? 2 : 1;
      const isLast = idx === form.participants.length - 1;
      const tt = TRADITIONAL_TYPE_OPTIONS.find(o => o.v === participant.traditionalType)?.v ?? participant.traditionalType;
      const ts2 = TRADITIONAL_STATUS_OPTIONS.find(o => o.v === participant.traditionalStatus)?.v ?? participant.traditionalStatus;
      const reason = REASON_OPTIONS.find(o => o.v === participant.reasonForUsing)?.v ?? participant.reasonForUsing;
      const lastRowDiv = !isLast ? dividerBorder : "";
      // Shared cells span both rows — divider always applies (they end at the bottom of their rowspan)
      const sharedExtra = `vertical-align:middle;${lastRowDiv}`;

      const primaryRow = `<tr>
        <td rowspan="${rowSpan}" style="${tdBase}text-align:center;vertical-align:middle;${lastRowDiv}">${idx + 1}</td>
        ${renderPersonCols(participant, "", !hasPartner ? lastRowDiv : "")}
        <td rowspan="${rowSpan}" ${tl(sharedExtra)}>${participant.address || "—"}</td>
        <td rowspan="${rowSpan}" ${tc(sharedExtra)}>${participant.numChildren || "—"}</td>
        <td rowspan="${rowSpan}" ${tc(sharedExtra)}>${fpLbl(participant.fpMethod) || "—"}</td>
        <td rowspan="${rowSpan}" ${tc(sharedExtra)}>${fpLbl(participant.intentionToShift) || "—"}</td>
        <td rowspan="${rowSpan}" ${tc(sharedExtra)}>${tt || "—"}</td>
        <td rowspan="${rowSpan}" ${tc(sharedExtra)}>${ts2 || "—"}</td>
        <td rowspan="${rowSpan}" ${tl(sharedExtra)}>${reason || "—"}</td>
      </tr>`;

      const partnerRow = hasPartner ? `<tr>
        ${renderPersonCols(participant.partner!, "background:#f5f5f5;", lastRowDiv)}
      </tr>` : "";

      return primaryRow + partnerRow;
    }).join("");

    const tdLeg = `border:1px solid #ccc;padding:6px 8px;vertical-align:top;width:16.66%;`;
    const pHdr = (t: string) => `<p style="font-weight:bold;font-size:7.5px;margin:0 0 4px;color:#222;text-transform:uppercase;letter-spacing:0.03em;">${t}</p>`;
    const pRow = (r: string) => `<p style="margin:0 0 1.5px;font-size:7.5px;color:#333;">${r}</p>`;
    const pSub = (t: string) => `<p style="font-weight:bold;font-size:7px;margin:4px 0 2px;color:#555;text-transform:uppercase;">${t}</p>`;
    const legendCols = [
      `<td style="${tdLeg}">${pHdr("Civil Status")}
        ${["1 – Married","2 – Single","3 – Widow/Widower","4 – Separated","5 – Live-in"].map(pRow).join("")}
      </td>`,
      `<td style="${tdLeg}">${pHdr("Highest Educational Attainment")}
        ${["1 – No Education","2 – Elementary Level","3 – Elementary Graduate","4 – High School Level","5 – High School Graduate","6 – Vocational","7 – College Level","8 – College Graduate","9 – Post Graduate"].map(pRow).join("")}
      </td>`,
      `<td style="${tdLeg}">${pHdr("Modern FP Method Used")}
        ${pSub("Artificial Methods")}
        ${["1 – Condom","2 – IUD","3 – Pills","4 – Injectable","5 – Vasectomy","6 – Tubal Ligation","7 – Implant"].map(pRow).join("")}
        ${pSub("Modern NFP Methods")}
        ${["8 – CMM/Billings","9 – BBT","10 – Sympto-Thermal","11 – SDM","12 – LAM"].map(pRow).join("")}
      </td>`,
      `<td style="${tdLeg}">${pHdr("Traditional FP: Type")}
        ${["1 – Withdrawal","2 – Rhythm","3 – Calendar","4 – Abstinence","5 – Herbal","6 – No Method"].map(pRow).join("")}
      </td>`,
      `<td style="${tdLeg}">${pHdr("Non-Modern FP: Status")}
        ${["A – Expressing Intention to Use Modern FP","B – Undecided","C – Currently Pregnant","D – No Intention to Use"].map(pRow).join("")}
      </td>`,
      `<td style="${tdLeg}">${pHdr("Reason for Using FP")}
        ${["1 – Spacing","2 – Limiting","3 – Achieving"].map(pRow).join("")}
      </td>`,
    ].join("");
    const legendHTML = `
      <div style="margin-top:14px;">
        <p style="font-weight:bold;font-size:9px;margin:0 0 5px;padding-bottom:3px;border-bottom:1.5px solid #999;text-transform:uppercase;letter-spacing:0.05em;">Code Legend / Reference</p>
        <table style="width:100%;border-collapse:collapse;"><tr>${legendCols}</tr></table>
      </div>`;

    return `<div style="font-family:Arial,sans-serif;font-size:9px;padding:8px;">
      <h2 style="font-size:12px;font-weight:bold;margin:0 0 3px;">RPFP Form 1 – Participant List</h2>
      <p style="font-size:8px;color:#555;margin:0 0 10px;">
        Municipality: ${form.municipality || "—"} &nbsp;|&nbsp;
        Barangay: ${form.barangay || "—"} &nbsp;|&nbsp;
        Date Conducted: ${dateLabel}${form.classNo ? ` &nbsp;|&nbsp; Class No.: ${form.classNo}` : ""}
      </p>
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr>
            <th rowspan="2" ${thC} style="width:28px;">&#35;</th>
            <th rowspan="2" ${thL}>Name</th>
            <th rowspan="2" ${thC}>Sex</th>
            <th rowspan="2" ${thC}>Civil Status</th>
            <th rowspan="2" ${thL}>Birthdate (Age)</th>
            <th rowspan="2" ${thC}>Highest Educational Attainment</th>
            <th rowspan="2" ${thL}>Address / Household ID Number</th>
            <th rowspan="2" ${thC}>No. of Children</th>
            <th colspan="2" ${thC}>Modern FP User</th>
            <th colspan="3" ${thC}>Traditional FP User</th>
          </tr>
          <tr>
            <th ${thSubC}>Method Used</th>
            <th ${thSubC}>Intention to Shift to Other FP Method</th>
            <th ${thSubC}>Type</th>
            <th ${thSubC}>Status</th>
            <th ${thSubC}>Reason for Intending to Use FP Method</th>
          </tr>
        </thead>
        <tbody>${bodyRows}</tbody>
      </table>
      ${legendHTML}
    </div>`;
  };

  const handlePrint = () => {
    if (!selectedForm) return;
    const content = buildRosterHTMLContent(selectedForm);
    const printWindow = window.open("", "_blank", "width=1400,height=900");
    if (!printWindow) return;
    printWindow.document.write(`<!DOCTYPE html><html><head>
      <title>RPFP Form 1 – ${selectedForm.municipality} ${selectedForm.barangay}</title>
      <style>
        body { font-family: Arial, sans-serif; font-size: 9px; margin: 0; padding: 8px; }
        @page { size: A4 landscape; margin: 10mm; }
      </style>
      </head><body>${content}</body></html>`);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 400);
  };

  const handlePDF = async () => {
    if (!selectedForm) return;
    const el = document.getElementById("pulse-print-root");
    if (!el) {
      setToast("Unable to locate PDF preview content.");
      return;
    }
    setPdfGenerating(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const h2p = ((await import("html2pdf.js")) as any).default;
      await h2p().set({
        margin: 8,
        filename: `RPFP-Form1-${selectedForm.municipality}-${selectedForm.barangay}-${selectedForm.dateConduct || "no-date"}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: "mm", format: "a4", orientation: "landscape" },
      }).from(el).save();
      setToast(`Downloaded RPFP-Form1-${selectedForm.municipality}-${selectedForm.barangay}-${selectedForm.dateConduct || "no-date"}.pdf`);
    } catch (error) {
      console.error("Failed to generate RPFP Form 1 PDF:", error);
      setToast("PDF generation failed, please try again.");
      throw error;
    } finally {
      setPdfGenerating(false);
    }
  };

  // ── STEP 2: Detail table view ──────────────────────────────────────────────
  if (selectedForm) {
    type RosterRow = { rowIndex: number; isPartner: boolean; p: RPFPParticipant };
    const rows: RosterRow[] = [];
    selectedForm.participants.forEach((p, idx) => {
      rows.push({ rowIndex: idx + 1, isPartner: false, p });
      if (p.partner) rows.push({ rowIndex: idx + 1, isPartner: true, p: p.partner });
    });

    const dateLabel = selectedForm.dateConduct
      ? new Date(selectedForm.dateConduct + "T00:00:00").toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })
      : "—";

    const thBase = "font-bold text-[9px] uppercase tracking-wide bg-teal-50 border border-border px-2 py-2";
    const thCenter = `${thBase} text-center`;
    const thLeft = `${thBase} text-left`;
    const tdBase = "px-2 py-1.5 text-xs text-foreground border border-border/60";
    const tdC = `${tdBase} text-center`;
    const tdL = `${tdBase} text-left`;

    return (
      <div className="min-h-screen bg-background" style={{ fontFamily: "Arial, sans-serif" }}>
        <AppHeader user={user} onLogout={onLogout} crumb="RPFP Form 1 – Participant List" />
        <div className="max-w-full px-4 py-6 space-y-4" style={{ maxWidth: 1400, margin: "0 auto" }}>
          {/* Top toolbar */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <button onClick={() => setSelectedFormId(null)}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ChevronLeft size={16} /> Back to View List
            </button>
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={() => onEdit(selectedForm)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted/50 transition-colors">
                <Edit2 size={14} /> Edit
              </button>
              <button onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted/50 transition-colors">
                <Printer size={14} /> Print and Download
              </button>
            </div>
          </div>

          {/* PDF Preview Modal */}
          {showPdfPreview && (
            <div className="fixed inset-0 z-50 bg-black/60 flex flex-col items-center overflow-auto py-6 px-4">
              <div className="bg-white rounded-xl shadow-2xl w-full flex flex-col" style={{ maxWidth: 1180 }}>
                {/* Modal header */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 flex-shrink-0">
                  <div>
                    <p className="font-bold text-sm text-gray-900">PDF Preview — RPFP Form 1</p>
                    <p className="text-xs text-gray-500 mt-0.5">Landscape A4 · Review before downloading</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setShowPdfPreview(false)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      <X size={14} /> Close
                    </button>
                    <button onClick={async () => {
                        try {
                          await handlePDF();
                          setShowPdfPreview(false);
                        } catch {
                          // Error already handled in handlePDF
                        }
                      }}
                      disabled={pdfGenerating}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                      <Download size={14} /> {pdfGenerating ? "Generating…" : "Download PDF"}
                    </button>
                  </div>
                </div>
                {/* Preview content — rendered from the same HTML used for PDF */}
                <div className="overflow-auto p-6 bg-gray-50 rounded-b-xl">
                  <div id="pulse-print-root" className="bg-white shadow-sm rounded border border-gray-200"
                    dangerouslySetInnerHTML={{ __html: buildRosterHTMLContent(selectedForm) }} />
                </div>
              </div>
            </div>
          )}

          {/* Roster metadata */}
          <div className="bg-card border border-border rounded-xl px-5 py-4 flex flex-wrap gap-x-8 gap-y-2 items-start">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Municipality / City</div>
              <div className="text-sm font-semibold text-foreground">{selectedForm.municipality || "—"}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Barangay</div>
              <div className="text-sm font-semibold text-foreground">{selectedForm.barangay || "—"}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Date Conducted</div>
              <div className="text-sm font-semibold text-foreground">{dateLabel}</div>
            </div>
            {selectedForm.classNo && (
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Class No.</div>
                <div className="text-sm font-semibold text-foreground">{selectedForm.classNo}</div>
              </div>
            )}
          </div>

          {/* Printable table */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <div ref={printRef}>
                <div style={{ display: "none" }} className="print-header">
                  <h2 style={{ fontFamily: "Arial", fontSize: 13, fontWeight: "bold", margin: "0 0 4px" }}>RPFP Form 1 – Participant List</h2>
                  <div style={{ fontSize: 9, color: "#555", marginBottom: 10 }}>
                    Municipality: {selectedForm.municipality} &nbsp;|&nbsp; Barangay: {selectedForm.barangay} &nbsp;|&nbsp; Date Conducted: {dateLabel}
                    {selectedForm.classNo ? ` | Class No.: ${selectedForm.classNo}` : ""}
                  </div>
                </div>
                <table className="w-full border-collapse" style={{ minWidth: 1300 }}>
                  <thead>
                    <tr>
                      <th rowSpan={2} className={thCenter} style={{ width: 32 }}>#</th>
                      <th rowSpan={2} className={thLeft} style={{ minWidth: 150 }}>Name</th>
                      <th rowSpan={2} className={thCenter} style={{ width: 40 }}>Sex</th>
                      <th rowSpan={2} className={thCenter} style={{ width: 60 }}>Civil Status</th>
                      <th rowSpan={2} className={thLeft} style={{ minWidth: 100 }}>Birthdate (Age)</th>
                      <th rowSpan={2} className={thCenter} style={{ minWidth: 100 }}>Highest Educational Attainment</th>
                      <th rowSpan={2} className={thLeft} style={{ minWidth: 160 }}>Address / Household ID Number</th>
                      <th rowSpan={2} className={thCenter} style={{ width: 70 }}>No. of Children</th>
                      <th colSpan={2} className={thCenter} style={{ borderBottom: "none" }}>Modern FP User</th>
                      <th colSpan={3} className={thCenter} style={{ borderBottom: "none" }}>Traditional FP User</th>
                    </tr>
                    <tr>
                      <th className={thCenter} style={{ minWidth: 90 }}>Method Used</th>
                      <th className={thCenter} style={{ minWidth: 110 }}>Intention to Shift to Other FP Method</th>
                      <th className={thCenter} style={{ minWidth: 60 }}>Type</th>
                      <th className={thCenter} style={{ minWidth: 60 }}>Status</th>
                      <th className={thCenter} style={{ minWidth: 120 }}>Reason for Intending to Use FP Method</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedForm.participants.length === 0 && (
                      <tr>
                        <td colSpan={13} className="px-4 py-8 text-center text-sm text-muted-foreground">
                          No participants encoded in this list.
                        </td>
                      </tr>
                    )}
                    {selectedForm.participants.map((participant, idx) => {
                      const hasPartner = !!participant.partner;
                      const rowSpan = hasPartner ? 2 : 1;
                      const isLast = idx === selectedForm.participants.length - 1;
                      const divBorder: React.CSSProperties = !isLast ? { borderBottom: "2px solid #9ca3af" } : {};

                      const fmtBd = (bd: string) => {
                        const age = calcAge(bd);
                        const d = bd ? bd.split("-") : null;
                        const fmt = d && d.length === 3 ? `${d[1]}/${d[2]}/${d[0]}` : bd;
                        return bd ? `${fmt}${age ? ` (${age})` : ""}` : "—";
                      };

                      // Cells that belong to the last row of the group get the divider bottom border
                      const personCells = (p: RPFPParticipant, applyDiv: boolean) => {
                        const cs = CIVIL_STATUS_OPTIONS.find(o => o.v === p.civilStatus)?.v ?? p.civilStatus;
                        const ed = EDUCATION_OPTIONS.find(o => o.v === p.education)?.v ?? p.education;
                        const div = applyDiv ? divBorder : {};
                        return <>
                          <td className={`${tdL} font-medium`} style={{ textTransform: "uppercase", ...div }}>{p.name || "—"}</td>
                          <td className={tdC} style={div}>{p.sex || "—"}</td>
                          <td className={tdC} style={div}>{cs || "—"}</td>
                          <td className={tdL} style={div}>{fmtBd(p.birthdate)}</td>
                          <td className={tdC} style={div}>{ed || "—"}</td>
                        </>;
                      };

                      const tt = TRADITIONAL_TYPE_OPTIONS.find(o => o.v === participant.traditionalType)?.v ?? participant.traditionalType;
                      const ts = TRADITIONAL_STATUS_OPTIONS.find(o => o.v === participant.traditionalStatus)?.v ?? participant.traditionalStatus;
                      const reason = REASON_OPTIONS.find(o => o.v === participant.reasonForUsing)?.v ?? participant.reasonForUsing;
                      // Shared cells span both rows; their bottom border IS the group divider
                      const sharedStyle: React.CSSProperties = { verticalAlign: "middle", ...divBorder };

                      return (
                        <Fragment key={participant.id}>
                          <tr className="hover:bg-muted/20 transition-colors">
                            <td className={`${tdC} align-middle`} rowSpan={rowSpan} style={divBorder}>
                              <span className="text-muted-foreground font-mono text-[10px]">{idx + 1}</span>
                            </td>
                            {personCells(participant, !hasPartner)}
                            <td className={`${tdL} align-middle`} rowSpan={rowSpan} style={sharedStyle}>{participant.address || "—"}</td>
                            <td className={`${tdC} align-middle`} rowSpan={rowSpan} style={sharedStyle}>{participant.numChildren || "—"}</td>
                            <td className={`${tdC} align-middle`} rowSpan={rowSpan} style={sharedStyle}>{fpLabel(participant.fpMethod) || "—"}</td>
                            <td className={`${tdC} align-middle`} rowSpan={rowSpan} style={sharedStyle}>{fpLabel(participant.intentionToShift) || "—"}</td>
                            <td className={`${tdC} align-middle`} rowSpan={rowSpan} style={sharedStyle}>{tt || "—"}</td>
                            <td className={`${tdC} align-middle`} rowSpan={rowSpan} style={sharedStyle}>{ts || "—"}</td>
                            <td className={`${tdL} align-middle`} rowSpan={rowSpan} style={sharedStyle}>{reason || "—"}</td>
                          </tr>
                          {hasPartner && (
                            <tr className="bg-teal-50/30 hover:bg-muted/20 transition-colors">
                              {personCells(participant.partner!, true)}
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Code Legend on-screen */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-2 bg-muted/40 border-b border-border flex items-center gap-2">
              <Shield size={13} className="text-muted-foreground" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Code Legend / Reference</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse" style={{ minWidth: 720 }}>
                <thead>
                  <tr>
                    {[
                      "Civil Status",
                      "Highest Educational Attainment",
                      "Modern FP Method Used",
                      "Traditional FP User: Type",
                      "Non-Modern FP User: Status",
                      "Reason for Using FP / Intending to Use",
                    ].map(h => (
                      <th key={h} className="text-[9px] font-bold uppercase tracking-wide text-muted-foreground bg-muted/30 border border-border px-3 py-2 text-left whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-border px-3 py-2 align-top">
                      {["1 – Married","2 – Single","3 – Widow/Widower","4 – Separated","5 – Live-in"].map(r => (
                        <p key={r} className="text-[10px] text-foreground leading-snug">{r}</p>
                      ))}
                    </td>
                    <td className="border border-border px-3 py-2 align-top">
                      {["1 – No Education","2 – Elementary Level","3 – Elementary Graduate","4 – High School Level","5 – High School Graduate","6 – Vocational","7 – College Level","8 – College Graduate","9 – Post Graduate"].map(r => (
                        <p key={r} className="text-[10px] text-foreground leading-snug">{r}</p>
                      ))}
                    </td>
                    <td className="border border-border px-3 py-2 align-top">
                      <p className="text-[9px] font-semibold text-muted-foreground mb-0.5">Artificial Methods</p>
                      {["1 – Condom","2 – IUD","3 – Pills","4 – Injectable","5 – Vasectomy","6 – Tubal Ligation","7 – Implant"].map(r => (
                        <p key={r} className="text-[10px] text-foreground leading-snug">{r}</p>
                      ))}
                      <p className="text-[9px] font-semibold text-muted-foreground mt-1.5 mb-0.5">Modern NFP Methods</p>
                      {["8 – CMM/Billings","9 – BBT","10 – Sympto-Thermal","11 – SDM","12 – LAM"].map(r => (
                        <p key={r} className="text-[10px] text-foreground leading-snug">{r}</p>
                      ))}
                    </td>
                    <td className="border border-border px-3 py-2 align-top">
                      {["1 – Withdrawal","2 – Rhythm","3 – Calendar","4 – Abstinence","5 – Herbal","6 – No Method"].map(r => (
                        <p key={r} className="text-[10px] text-foreground leading-snug">{r}</p>
                      ))}
                    </td>
                    <td className="border border-border px-3 py-2 align-top">
                      {["A – Expressing Intention to Use Modern FP","B – Undecided","C – Currently Pregnant","D – No Intention to Use"].map(r => (
                        <p key={r} className="text-[10px] text-foreground leading-snug">{r}</p>
                      ))}
                    </td>
                    <td className="border border-border px-3 py-2 align-top">
                      {["1 – Spacing","2 – Limiting","3 – Achieving"].map(r => (
                        <p key={r} className="text-[10px] text-foreground leading-snug">{r}</p>
                      ))}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── STEP 1: Card list view ─────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background" style={{ fontFamily: "Arial, sans-serif" }}>
      <AppHeader user={user} onLogout={onLogout} crumb="RPFP Form 1 – List" />
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">
        <div className="flex items-center justify-between gap-4">
          <BackButton onClick={onBack} label="Back to RPFP Report" />
          <button onClick={onEncodeNew}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 transition-colors shadow-sm">
            <Plus size={15} /> Encode New
          </button>
        </div>

        {/* Page title + filters */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-teal-100 flex items-center justify-center">
              <BookUser size={18} className="text-teal-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">RPFP Form 1 – Participant List</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{forms.length} saved entr{forms.length !== 1 ? "ies" : "y"}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Municipality</label>
              <select value={filterMun} onChange={e => { setFilterMun(e.target.value); setFilterBgy(""); }} className={inputCls}>
                <option value="">All</option>
                {municipalities.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Barangay</label>
              <select value={filterBgy} onChange={e => setFilterBgy(e.target.value)} className={inputCls}>
                <option value="">All</option>
                {barangays.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Date Conducted</label>
              <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className={inputCls}
                style={{ colorScheme: "light", color: "var(--foreground)" }} />
            </div>
            {(filterMun || filterBgy || filterDate) && (
              <button onClick={() => { setFilterMun(""); setFilterBgy(""); setFilterDate(""); }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:bg-muted/50 transition-colors">
                <X size={12} /> Clear
              </button>
            )}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-12 text-center text-muted-foreground text-sm">
            {forms.length === 0
              ? "No entries saved yet. Click \"Encode New\" to get started."
              : "No entries match the selected filters."}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filtered.map(f => {
              const dateLabel = f.dateConduct
                ? new Date(f.dateConduct + "T00:00:00").toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })
                : "—";
              return (
                <button key={f.id} onClick={() => setSelectedFormId(f.id)}
                  className="bg-card border border-border rounded-xl p-5 text-left hover:border-teal-400 hover:shadow-md transition-all group">
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-9 h-9 rounded-lg bg-teal-100 flex items-center justify-center flex-shrink-0 group-hover:bg-teal-200 transition-colors">
                      <ClipboardList size={17} className="text-teal-700" />
                    </div>
                    <ChevronRight size={16} className="text-muted-foreground group-hover:text-teal-600 mt-1 transition-colors flex-shrink-0" />
                  </div>
                  <div className="mt-3 space-y-1">
                    <div className="text-sm font-bold text-foreground uppercase tracking-wide">
                      {f.municipality || "—"}
                    </div>
                    <div className="text-sm text-teal-700 font-semibold">{f.barangay || "—"}</div>
                    <div className="text-xs text-muted-foreground mt-1">{dateLabel}</div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────

type View = "login" | "dashboard" | "doc-form" | "records" | "monthly-summary" | "rpfp-form1" | "rpfp-form1-list";

// ── DB ↔ App type converters ──────────────────────────────────────────────────

function dbRowToDocRecord(row: Record<string, unknown>): DocRecord {
  return {
    id:                  String(row.id),
    code:                String(row.code ?? ""),
    category:            (row.type as Category),
    municipality:        String(row.municipality ?? ""),
    barangay:            String(row.barangay ?? ""),
    district:            String(row.district ?? ""),
    venue:               String(row.venue ?? ""),
    sessionType:         String(row.session ?? ""),
    dateConduct:         String(row.date_conducted ?? ""),
    reportMonth:         String(row.report_month ?? ""),
    reportYear:          String(row.report_year ?? ""),
    targetParticipants:  String(row.target ?? ""),
    actualParticipants:  String(row.actual ?? "0"),
    male:                Number(row.male ?? 0),
    female:              Number(row.female ?? 0),
    ageBracket1:         Number(row.bracket_1 ?? 0),
    ageBracket2:         Number(row.bracket_2 ?? 0),
    ageBracket3:         Number(row.bracket_3 ?? 0),
    numSpeakers:         String(row.num_speakers ?? ""),
    speakers:            (row.speakers as Speaker[]) ?? [],
    activities:          (row.activities as Record<string, boolean>) ?? {},
    personsResponsible:  (row.persons_responsible as Record<string, string>) ?? {},
    remarks:             String(row.remarks ?? ""),
    documentedBy:        String(row.documented_by ?? ""),
    dateDocumented:      String(row.date_documented ?? ""),
    reviewedBy:          String(row.reviewed_by ?? ""),
    approvedBy:          String(row.approved_by ?? ""),
    status:              (row.status as DocRecord["status"]) ?? "Pending",
  };
}

function docRecordToDb(data: Omit<DocRecord, "id" | "code" | "status"> & Partial<Pick<DocRecord, "id" | "code" | "status">>, userId?: string) {
  return {
    type:                data.category,
    code:                data.code,
    date_conducted:      data.dateConduct || null,
    session:             data.sessionType || null,
    municipality:        data.municipality || null,
    barangay:            data.barangay || null,
    district:            data.district || null,
    venue:               data.venue || null,
    target:              data.targetParticipants ? parseInt(data.targetParticipants) : null,
    actual:              parseInt(data.actualParticipants) || 0,
    male:                data.male,
    female:              data.female,
    bracket_1:           data.ageBracket1 || null,
    bracket_2:           data.ageBracket2 || null,
    bracket_3:           data.ageBracket3 || null,
    documented_by:       data.documentedBy || null,
    reviewed_by:         data.reviewedBy || null,
    approved_by:         data.approvedBy || null,
    date_documented:     data.dateDocumented || null,
    report_month:        data.reportMonth || null,
    report_year:         data.reportYear || null,
    num_speakers:        data.numSpeakers || null,
    speakers:            data.speakers,
    activities:          data.activities,
    persons_responsible: data.personsResponsible,
    remarks:             data.remarks || null,
    status:              data.status ?? "Pending",
    ...(userId ? { created_by: userId } : {}),
  };
}

function dbRosterToForm(row: Record<string, unknown>): RPFPForm1Record {
  const participants: RPFPParticipant[] = [];
  const rows = (row.rpfp_form1_participants as Record<string, unknown>[]) ?? [];
  const primaries = rows.filter(p => !p.is_partner_row);
  for (const p of primaries) {
    const partnerRow = rows.find(r => r.is_partner_row && r.parent_participant_id === p.id) ?? null;
    const toParticipant = (r: Record<string, unknown>): RPFPParticipant => ({
      id:               String(r.id),
      name:             String(r.name ?? ""),
      sex:              (r.sex as "M" | "F" | "") ?? "",
      civilStatus:      String(r.civil_status ?? ""),
      birthdate:        String(r.birthdate ?? ""),
      address:          String(r.address_household_id ?? ""),
      education:        String(r.educational_attainment ?? ""),
      numChildren:      String(r.no_of_children ?? ""),
      fpMethod:         String(r.method_used ?? ""),
      intentionToShift: r.intention_to_shift ? "Yes" : "No",
      traditionalType:  String(r.traditional_fp_type ?? ""),
      traditionalStatus:String(r.traditional_fp_status ?? ""),
      reasonForUsing:   String(r.reason_for_using_fp ?? ""),
      signatureData:    String(r.signature_data ?? ""),
      partner:          null,
    });
    const primary = toParticipant(p);
    if (partnerRow) primary.partner = toParticipant(partnerRow);
    participants.push(primary);
  }
  return {
    id:                    String(row.id),
    parentRecordId:        String(row.parent_report_id ?? ""),
    classNo:               String(row.class_no ?? ""),
    municipality:          String(row.municipality ?? ""),
    barangay:              String(row.barangay ?? ""),
    dateConduct:           String(row.date_conduct ?? ""),
    activityType:          String(row.activity_type ?? ""),
    dataCollectionMethod:  String(row.data_collection_method ?? ""),
    dataCollectionOther:   String(row.data_collection_other ?? ""),
    participants,
    preparedBy:            String(row.prepared_by ?? ""),
    reviewedBy:            String(row.reviewed_by ?? ""),
    approvedBy:            String(row.approved_by ?? ""),
  };
}

export default function App() {
  const [user, setUser]     = useState<string | null>(null);
  const [userId, setUserId] = useState("");
  const [view, setView]     = useState<View>("login");
  const [activeCategory, setActiveCategory] = useState<Category>("RPFP");
  const [records, setRecords] = useState<DocRecord[]>([]);
  const [editRecord, setEditRecord] = useState<DocRecord | null>(null);
  const [formSource, setFormSource]           = useState<View>("dashboard");
  const [recordsInitialMonth, setRecordsInitialMonth] = useState("");
  const [rpfpForms, setRpfpForms] = useState<RPFPForm1Record[]>([]);
  const [activeRpfpParent, setActiveRpfpParent] = useState<DocRecord | null>(null);
  const [activeEditRpfpForm, setActiveEditRpfpForm] = useState<RPFPForm1Record | null>(null);

  const loadRecords = async () => {
    const { data } = await supabase.from("reports").select("*").order("created_at", { ascending: false });
    if (data) setRecords((data as Record<string, unknown>[]).map(dbRowToDocRecord));
  };

  const loadRpfpForms = async () => {
    const { data } = await supabase
      .from("rpfp_form1_rosters")
      .select("*, rpfp_form1_participants(*)")
      .order("created_at", { ascending: false });
    if (data) setRpfpForms((data as Record<string, unknown>[]).map(dbRosterToForm));
  };

  // On mount — restore session if one exists
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const profile = await ensureUserProfile(session.user.id, session.user.email ?? "");
        setUser(profile.full_name || session.user.email || "User");
        setUserId(session.user.id);
        setView("dashboard");
        loadRecords();
        loadRpfpForms();
        seedMunicipalitiesIfEmpty(MUNICIPALITY_DATA);
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) { setUser(null); setUserId(""); setView("login"); setRecords([]); setRpfpForms([]); }
    });
    return () => subscription.unsubscribe();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null); setUserId(""); setView("login");
    setEditRecord(null); setRecords([]); setRpfpForms([]);
  };

  const openRoster = (rec: DocRecord) => {
    setActiveRpfpParent(rec);
    setActiveEditRpfpForm(null);
    setView("rpfp-form1");
  };

  const saveRpfpForm = async (form: RPFPForm1Record) => {
    const rosterPayload = {
      parent_report_id:       form.parentRecordId || null,
      class_no:               form.classNo || null,
      municipality:           form.municipality?.trim() || null,
      barangay:               form.barangay?.trim() || null,
      date_conduct:           form.dateConduct || null,
      activity_type:          form.activityType || null,
      data_collection_method: form.dataCollectionMethod || null,
      data_collection_other:  form.dataCollectionOther || null,
      prepared_by:            form.preparedBy || null,
      reviewed_by:            form.reviewedBy || null,
      approved_by:            form.approvedBy || null,
    };

    let rosterId: string = typeof form.id === "string" ? form.id : "";
    const isEdit = !!rosterId;
    let isAppend = false;

    if (!isEdit && form.municipality && form.barangay && form.dateConduct) {
      const { data: existing } = await supabase
        .from("rpfp_form1_rosters")
        .select("id")
        .ilike("municipality", form.municipality.trim())
        .ilike("barangay", form.barangay.trim())
        .eq("date_conduct", form.dateConduct)
        .maybeSingle();
      if (existing?.id) {
        rosterId = existing.id as string;
        isAppend = true;
      }
    }

    if (isEdit) {
      await supabase.from("rpfp_form1_rosters").update(rosterPayload).eq("id", rosterId);
      await supabase.from("rpfp_form1_participants").delete().eq("roster_id", rosterId);
    } else if (isAppend) {
      await supabase.from("rpfp_form1_rosters").update(rosterPayload).eq("id", rosterId);
    } else {
      const { data } = await supabase
        .from("rpfp_form1_rosters")
        .insert({ ...rosterPayload, created_by: userId || null })
        .select("id").single();
      rosterId = (data?.id as string) ?? "";
    }

    let startingRowNum = 1;
    if (isAppend) {
      const { data: maxRow } = await supabase
        .from("rpfp_form1_participants")
        .select("row_number")
        .eq("roster_id", rosterId)
        .order("row_number", { ascending: false })
        .limit(1)
        .maybeSingle();
      startingRowNum = ((maxRow?.row_number as number) ?? 0) + 1;
    }

    const pFields = (p: RPFPParticipant) => ({
      name:                  p.name || null,
      sex:                   p.sex || null,
      civil_status:          p.civilStatus || null,
      birthdate:             p.birthdate || null,
      address_household_id:  p.address || null,
      educational_attainment:p.education || null,
      no_of_children:        p.numChildren || null,
      method_used:           p.fpMethod || null,
      intention_to_shift:    p.intentionToShift === "Yes",
      traditional_fp_type:   p.traditionalType || null,
      traditional_fp_status: p.traditionalStatus || null,
      reason_for_using_fp:   p.reasonForUsing || null,
      signature_data:        p.signatureData || null,
    });

    const primaryRows = form.participants.map((p, i) => ({
      roster_id:             rosterId,
      row_number:            startingRowNum + i,
      ...pFields(p),
      is_partner_row:        false,
      parent_participant_id: null,
    }));

    const { data: insertedPrimaries } = await supabase
      .from("rpfp_form1_participants").insert(primaryRows).select("id");

    const partnerRows = (insertedPrimaries ?? []).flatMap((ins, i) => {
      const partner = form.participants[i]?.partner;
      if (!partner) return [];
      return [{
        roster_id:             rosterId,
        row_number:            startingRowNum + i,
        ...pFields(partner),
        is_partner_row:        true,
        parent_participant_id: ins.id,
      }];
    });

    if (partnerRows.length > 0) {
      await supabase.from("rpfp_form1_participants").insert(partnerRows);
    }

    await loadRpfpForms();
    setActiveEditRpfpForm(null);
    setView("rpfp-form1-list");
  };

  const openForm = (cat: Category, rec?: DocRecord | null, from: View = "dashboard") => {
    setActiveCategory(cat);
    setEditRecord(rec ?? null);
    setFormSource(from);
    setView("doc-form");
  };

  const handleSubmit = async (data: FormState) => {
    const conductDate = data.dateConduct
      ? new Date(data.dateConduct + "T12:00:00")
      : new Date();
    const reportMonth = MONTHS[conductDate.getMonth()];
    const reportYear  = String(conductDate.getFullYear());
    const enriched    = { ...data, reportMonth, reportYear };

    if (editRecord) {
      await supabase.from("reports")
        .update(docRecordToDb(enriched))
        .eq("id", editRecord.id);
    } else {
      const { count } = await supabase.from("reports")
        .select("*", { count: "exact", head: true })
        .eq("type", data.category)
        .eq("report_year", reportYear);
      const n    = (count ?? 0) + 1;
      const code = `${data.category}-${reportYear}-${String(n).padStart(3, "0")}`;
      await supabase.from("reports").insert(
        docRecordToDb({ ...enriched, code, status: "Pending" }, userId)
      );
    }
    await loadRecords();
    setEditRecord(null);
    setView("records");
  };

  const handleDelete = async (id: string) => {
    await supabase.from("reports").delete().eq("id", id);
    setRecords(prev => prev.filter(r => r.id !== id));
  };

  if (!user) return <LoginView onLogin={(name, uid) => {
    setUser(name); setUserId(uid); setView("dashboard");
    loadRecords(); loadRpfpForms();
    seedMunicipalitiesIfEmpty(MUNICIPALITY_DATA);
  }} />;

  if (view === "rpfp-form1") return (
    <RPFPForm1View
      user={user} onLogout={logout}
      parentRecord={activeRpfpParent}
      allRpfpRecords={records.filter(r => r.category === "RPFP")}
      existingRosters={rpfpForms}
      existingForm={activeEditRpfpForm ?? (activeRpfpParent ? (rpfpForms.find(f => f.parentRecordId === activeRpfpParent.id) ?? null) : null)}
      onSave={saveRpfpForm}
      onBack={() => openForm("RPFP", null, "dashboard")} />
  );

  if (view === "rpfp-form1-list") return (
    <RPFPRosterListView
      user={user} onLogout={logout}
      forms={rpfpForms}
      onEncodeNew={() => { setActiveRpfpParent(null); setActiveEditRpfpForm(null); setView("rpfp-form1"); }}
      onEdit={(form) => {
        const parent = records.find(r => r.id === form.parentRecordId) ?? null;
        setActiveRpfpParent(parent);
        setActiveEditRpfpForm(form);
        setView("rpfp-form1");
      }}
      onBack={() => openForm("RPFP", null, "dashboard")} />
  );

  if (view === "monthly-summary") return (
    <MonthlySummaryView user={user} onLogout={logout} records={records}
      onBack={() => setView("dashboard")} />
  );

  if (view === "dashboard") return (
    <DashboardView user={user} onLogout={logout} records={records}
      onEncode={cat => openForm(cat)}
      onEncodeForm1={() => { setActiveRpfpParent(null); setActiveEditRpfpForm(null); setView("rpfp-form1"); }}
      onViewRosterList={() => setView("rpfp-form1-list")}
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
      editRecord={editRecord}
      onEncodeForm1={activeCategory === "RPFP" ? () => { setActiveRpfpParent(null); setActiveEditRpfpForm(null); setView("rpfp-form1"); } : undefined}
      onViewRosterList={activeCategory === "RPFP" ? () => setView("rpfp-form1-list") : undefined} />
  );

  return (
    <RecordsView
      user={user} onLogout={logout} records={records}
      onEdit={rec => openForm(rec.category, rec, "records")}
      onDelete={handleDelete}
      onNewReport={cat => openForm(cat, null, "records")}
      onBack={() => setView("dashboard")}
      onOpenRoster={openRoster}
      initialFilterMonth={recordsInitialMonth} />
  );
}
