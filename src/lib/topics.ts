// ABSITE study tree. Two-level body-system taxonomy (category -> topic) with
// stable ids so notes can be filed against a leaf. Organized along the broad
// lines of general-surgery in-training exam content: clinical management by
// organ system plus applied science. Edit freely; ids are what notes reference.

export type Topic = { id: string; name: string };
export type Category = {
  id: string;
  name: string;
  group: "Clinical Management" | "Applied Science";
  topics: Topic[];
};

const t = (catId: string, names: string[]): Topic[] =>
  names.map((name) => ({
    id: `${catId}.${name
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")}`,
    name,
  }));

const cat = (
  id: string,
  name: string,
  group: Category["group"],
  names: string[],
): Category => ({ id, name, group, topics: t(id, names) });

export const CATEGORIES: Category[] = [
  cat("abdomen", "Abdomen – General & Hernia", "Clinical Management", [
    "Acute Abdomen",
    "Inguinal & Femoral Hernia",
    "Ventral & Incisional Hernia",
    "Abdominal Wall & Peritoneum",
    "Retroperitoneum & Mesentery",
  ]),
  cat("biliary", "Biliary", "Clinical Management", [
    "Cholelithiasis & Cholecystitis",
    "Choledocholithiasis & Cholangitis",
    "Bile Duct Injury & Stricture",
    "Gallbladder & Bile Duct Cancer",
    "Choledochal Cysts",
  ]),
  cat("liver", "Liver", "Clinical Management", [
    "Liver Anatomy & Physiology",
    "Benign Liver Lesions",
    "Hepatocellular Carcinoma & Metastases",
    "Liver Abscess & Cysts",
    "Portal Hypertension & Cirrhosis",
  ]),
  cat("pancreas", "Pancreas", "Clinical Management", [
    "Acute Pancreatitis",
    "Chronic Pancreatitis & Pseudocyst",
    "Pancreatic Adenocarcinoma",
    "Cystic Neoplasms & IPMN",
    "Pancreatic Neuroendocrine Tumors",
  ]),
  cat("spleen", "Spleen", "Clinical Management", [
    "Splenectomy Indications & ITP",
    "Splenic Trauma",
    "Post-Splenectomy Sepsis & Vaccines",
  ]),
  cat("esophagus", "Esophagus", "Clinical Management", [
    "Esophageal Anatomy & Motility",
    "GERD & Hiatal Hernia",
    "Achalasia & Diverticula",
    "Esophageal Perforation",
    "Barrett's & Esophageal Cancer",
  ]),
  cat("stomach", "Stomach & Duodenum", "Clinical Management", [
    "Peptic Ulcer Disease",
    "Upper GI Bleeding",
    "Gastric Cancer & GIST",
    "Bariatric Surgery",
    "Post-Gastrectomy Syndromes",
  ]),
  cat("small-bowel", "Small Intestine", "Clinical Management", [
    "Small Bowel Obstruction",
    "Crohn's Disease",
    "Fistulas & Short Gut",
    "Small Bowel Tumors & Carcinoid",
    "Mesenteric Ischemia",
  ]),
  cat("colorectal", "Colon, Rectum & Anus", "Clinical Management", [
    "Diverticulitis",
    "Colon Cancer & Polyps",
    "Rectal Cancer",
    "Ulcerative Colitis & C. difficile",
    "Lower GI Bleeding & Volvulus",
    "Appendix",
    "Hemorrhoids, Fissure & Fistula",
    "Anal Cancer",
    "Hereditary Colorectal Syndromes",
  ]),
  cat("breast", "Breast", "Clinical Management", [
    "Benign Breast Disease",
    "Breast Imaging & Biopsy",
    "DCIS & LCIS",
    "Invasive Breast Cancer & Staging",
    "Axillary Management & Sentinel Node",
    "Systemic & Radiation Therapy",
    "Hereditary Breast Cancer",
  ]),
  cat("endocrine", "Endocrine", "Clinical Management", [
    "Thyroid Nodules & Cancer",
    "Hyperthyroidism & Thyroiditis",
    "Hyperparathyroidism",
    "Adrenal Incidentaloma & Cushing's",
    "Pheochromocytoma & Hyperaldosteronism",
    "MEN Syndromes",
  ]),
  cat("skin", "Skin & Soft Tissue", "Clinical Management", [
    "Melanoma",
    "Basal & Squamous Cell Carcinoma",
    "Soft Tissue Sarcoma",
    "Necrotizing Soft Tissue Infection",
  ]),
  cat("trauma", "Trauma", "Clinical Management", [
    "Primary Survey & Resuscitation",
    "Head & Spine Trauma",
    "Neck Trauma",
    "Thoracic Trauma",
    "Abdominal Trauma & Damage Control",
    "Pelvic & Extremity Trauma",
    "Vascular Trauma & Compartment Syndrome",
    "Pediatric, Geriatric & Pregnancy Trauma",
  ]),
  cat("burns", "Burns", "Clinical Management", [
    "Burn Assessment & Resuscitation",
    "Inhalation Injury",
    "Burn Wound Care & Grafting",
    "Electrical & Chemical Burns",
  ]),
  cat("critical-care", "Surgical Critical Care", "Clinical Management", [
    "Shock & Hemodynamics",
    "Mechanical Ventilation & ARDS",
    "Sepsis",
    "Acute Kidney Injury",
    "Cardiac Physiology & Arrhythmias",
    "Abdominal Compartment Syndrome",
    "Brain Death & End-of-Life Care",
  ]),
  cat("vascular", "Vascular", "Clinical Management", [
    "Carotid Disease",
    "Aortic Aneurysm & Dissection",
    "Peripheral Arterial Disease",
    "Acute Limb Ischemia",
    "Venous Disease & DVT/PE",
    "Dialysis Access",
    "Mesenteric & Renal Vascular Disease",
  ]),
  cat("thoracic", "Thoracic", "Clinical Management", [
    "Lung Cancer & Nodules",
    "Pleural Disease & Empyema",
    "Mediastinal Masses",
    "Pneumothorax & Chest Wall",
  ]),
  cat("cardiac", "Cardiac", "Clinical Management", [
    "Coronary & Valvular Disease",
    "Congenital Heart Disease",
  ]),
  cat("transplant", "Transplant", "Clinical Management", [
    "Transplant Immunology & Rejection",
    "Immunosuppression",
    "Kidney, Liver & Pancreas Transplant",
    "Post-Transplant Infection & Malignancy",
  ]),
  cat("pediatric", "Pediatric Surgery", "Clinical Management", [
    "Pyloric Stenosis & Intussusception",
    "Malrotation & Atresias",
    "Abdominal Wall Defects",
    "Hirschsprung's & Anorectal Malformation",
    "Diaphragmatic Hernia & TE Fistula",
    "Pediatric Tumors",
    "Necrotizing Enterocolitis",
  ]),
  cat("subspecialty", "Surgical Subspecialties", "Clinical Management", [
    "Head & Neck",
    "Urology",
    "Gynecology",
    "Orthopedics",
    "Neurosurgery",
    "Plastic & Reconstructive",
  ]),
  cat("fluids", "Fluids, Electrolytes & Acid–Base", "Applied Science", [
    "Body Fluid Compartments & IV Fluids",
    "Sodium & Potassium Disorders",
    "Calcium, Magnesium & Phosphate",
    "Acid–Base Disorders",
  ]),
  cat("nutrition", "Nutrition & Metabolism", "Applied Science", [
    "Caloric & Protein Requirements",
    "Enteral vs Parenteral Nutrition",
    "Metabolic Response to Injury",
    "Refeeding & Vitamin Deficiencies",
  ]),
  cat("hematology", "Hemostasis & Transfusion", "Applied Science", [
    "Coagulation Cascade & Testing",
    "Bleeding Disorders",
    "Hypercoagulable States",
    "Anticoagulants & Reversal",
    "Blood Products & Transfusion Reactions",
  ]),
  cat("infection", "Infection & Antibiotics", "Applied Science", [
    "Surgical Site Infection & Prophylaxis",
    "Antibiotic Classes & Mechanisms",
    "Intra-abdominal & Fungal Infection",
  ]),
  cat("immunology", "Immunology & Inflammation", "Applied Science", [
    "Cytokines & Inflammatory Mediators",
    "Cellular & Humoral Immunity",
  ]),
  cat("wound", "Wound Healing", "Applied Science", [
    "Phases of Wound Healing",
    "Impaired Healing & Chronic Wounds",
    "Grafts & Flaps",
  ]),
  cat("oncology", "Oncology & Tumor Biology", "Applied Science", [
    "Oncogenes & Tumor Suppressors",
    "Tumor Markers",
    "Chemotherapy & Radiation Principles",
  ]),
  cat("pharm-anesthesia", "Pharmacology & Anesthesia", "Applied Science", [
    "Pharmacokinetics",
    "Inhaled & IV Anesthetics",
    "Local Anesthetics & Paralytics",
    "Malignant Hyperthermia & Airway",
    "Perioperative Risk & Pain Control",
  ]),
  cat("cell-biology", "Cell Biology & Genetics", "Applied Science", [
    "Cell Cycle & Signaling",
    "Inheritance Patterns",
  ]),
  cat("stats-ethics", "Statistics, Ethics & Safety", "Applied Science", [
    "Biostatistics & Study Design",
    "Sensitivity, Specificity & Predictive Value",
    "Ethics & Consent",
    "Patient Safety & Quality",
  ]),
];

export const UNFILED_TOPIC_ID = "unfiled";

export const ALL_TOPICS: (Topic & { categoryId: string; categoryName: string })[] =
  CATEGORIES.flatMap((c) =>
    c.topics.map((tp) => ({ ...tp, categoryId: c.id, categoryName: c.name })),
  );

const TOPIC_INDEX = new Map(ALL_TOPICS.map((tp) => [tp.id, tp]));

export function findTopic(id: string) {
  return TOPIC_INDEX.get(id);
}

export function categoryOf(topicId: string): Category | undefined {
  const tp = TOPIC_INDEX.get(topicId);
  return tp ? CATEGORIES.find((c) => c.id === tp.categoryId) : undefined;
}

// Compact listing sent to the model so it can file a note against a leaf id.
export function topicCatalogForPrompt(): string {
  return CATEGORIES.map(
    (c) =>
      `## ${c.name}\n` + c.topics.map((tp) => `- ${tp.id} :: ${tp.name}`).join("\n"),
  ).join("\n\n");
}
