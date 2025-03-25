import { Json } from '@shared/schema';

// Severity level descriptions with associated risk assessment
export const severityDescriptions = {
  1: {
    label: "Mild",
    description: "Minor discomfort that doesn't significantly affect daily activities."
  },
  2: {
    label: "Moderate",
    description: "Noticeable symptoms that may interfere with some daily activities."
  },
  3: {
    label: "Severe",
    description: "Significant symptoms that substantially impact daily activities."
  },
  4: {
    label: "Very Severe",
    description: "Extreme symptoms that prevent normal functioning."
  },
  5: {
    label: "Critical",
    description: "Life-threatening symptoms requiring immediate medical attention."
  }
};

// Duration factor - how the duration affects urgency
export const durationImpact = {
  "hours": 1.5,   // Acute onset increases urgency
  "days": 1.2,    // Recent onset has moderate urgency
  "weeks": 1.0,   // Subacute conditions
  "months": 0.8,  // Chronic conditions may be less urgent unless severe
  "years": 0.7    // Long-standing chronic conditions
};

// Define body areas and their associated possible symptoms
export const bodyAreaSymptoms: Record<string, string[]> = {
  "head": [
    "headache", 
    "dizziness", 
    "vision changes", 
    "hearing changes", 
    "facial pain", 
    "confusion",
    "memory issues",
    "eye pain",
    "eye redness",
    "ear pain",
    "ringing in ears"
  ],
  "chest": [
    "chest pain", 
    "shortness of breath", 
    "palpitations", 
    "cough", 
    "wheezing",
    "difficulty breathing",
    "chest tightness"
  ],
  "abdomen": [
    "abdominal pain", 
    "nausea", 
    "vomiting", 
    "diarrhea", 
    "constipation",
    "bloating",
    "loss of appetite",
    "difficulty swallowing",
    "blood in stool",
    "heartburn"
  ],
  "musculoskeletal": [
    "joint pain", 
    "muscle pain", 
    "back pain", 
    "stiffness", 
    "swelling",
    "limited range of motion",
    "weakness",
    "cramping"
  ],
  "skin": [
    "rash", 
    "itching", 
    "discoloration", 
    "dryness", 
    "swelling",
    "hives",
    "bruising",
    "lumps"
  ],
  "general": [
    "fever", 
    "fatigue", 
    "weight loss", 
    "weight gain", 
    "night sweats",
    "chills",
    "weakness",
    "malaise"
  ],
  "urinary": [
    "frequent urination",
    "painful urination",
    "blood in urine",
    "urgency",
    "incontinence",
    "decreased urine output"
  ],
  "neurological": [
    "numbness",
    "tingling",
    "weakness",
    "seizures",
    "tremors",
    "difficulty speaking",
    "difficulty walking",
    "loss of consciousness"
  ],
  "psychological": [
    "anxiety",
    "depression",
    "mood changes",
    "sleep disturbances",
    "hallucinations",
    "difficulty concentrating",
    "irritability"
  ]
};

// Map symptoms to possible medical conditions with likelihood scores
interface ConditionAssociation {
  condition: string;
  likelihood: number; // 0-1 scale where 1 is strongly associated
  severity: number;   // 1-5 scale of condition severity
  keySymptom: boolean; // If this is a definitive symptom for the condition
}

export const symptomConditionMap: Record<string, ConditionAssociation[]> = {
  // Head-related
  "headache": [
    { condition: "Tension Headache", likelihood: 0.8, severity: 1, keySymptom: true },
    { condition: "Migraine", likelihood: 0.7, severity: 2, keySymptom: true },
    { condition: "Sinusitis", likelihood: 0.5, severity: 1, keySymptom: false },
    { condition: "Hypertension", likelihood: 0.3, severity: 3, keySymptom: false },
    { condition: "Meningitis", likelihood: 0.2, severity: 5, keySymptom: false }
  ],
  "dizziness": [
    { condition: "Inner Ear Infection", likelihood: 0.6, severity: 2, keySymptom: true },
    { condition: "Vertigo", likelihood: 0.7, severity: 2, keySymptom: true },
    { condition: "Anemia", likelihood: 0.4, severity: 2, keySymptom: false },
    { condition: "Hypoglycemia", likelihood: 0.3, severity: 2, keySymptom: false },
    { condition: "Stroke", likelihood: 0.2, severity: 5, keySymptom: false }
  ],
  "vision changes": [
    { condition: "Migraine", likelihood: 0.5, severity: 2, keySymptom: false },
    { condition: "Glaucoma", likelihood: 0.4, severity: 3, keySymptom: true },
    { condition: "Cataracts", likelihood: 0.3, severity: 2, keySymptom: true },
    { condition: "Diabetic Retinopathy", likelihood: 0.3, severity: 3, keySymptom: true },
    { condition: "Stroke", likelihood: 0.2, severity: 5, keySymptom: false }
  ],
  
  // Chest-related
  "chest pain": [
    { condition: "Heartburn/GERD", likelihood: 0.6, severity: 1, keySymptom: true },
    { condition: "Anxiety", likelihood: 0.5, severity: 2, keySymptom: false },
    { condition: "Costochondritis", likelihood: 0.4, severity: 1, keySymptom: true },
    { condition: "Angina", likelihood: 0.3, severity: 3, keySymptom: true },
    { condition: "Heart Attack", likelihood: 0.2, severity: 5, keySymptom: true },
    { condition: "Pulmonary Embolism", likelihood: 0.2, severity: 5, keySymptom: true }
  ],
  "shortness of breath": [
    { condition: "Asthma", likelihood: 0.7, severity: 3, keySymptom: true },
    { condition: "Anxiety", likelihood: 0.6, severity: 2, keySymptom: false },
    { condition: "Pneumonia", likelihood: 0.4, severity: 3, keySymptom: true },
    { condition: "COPD", likelihood: 0.4, severity: 3, keySymptom: true },
    { condition: "Heart Failure", likelihood: 0.3, severity: 4, keySymptom: true },
    { condition: "Pulmonary Embolism", likelihood: 0.2, severity: 5, keySymptom: true }
  ],
  "cough": [
    { condition: "Common Cold", likelihood: 0.8, severity: 1, keySymptom: true },
    { condition: "Bronchitis", likelihood: 0.6, severity: 2, keySymptom: true },
    { condition: "Asthma", likelihood: 0.5, severity: 3, keySymptom: false },
    { condition: "Pneumonia", likelihood: 0.4, severity: 3, keySymptom: true },
    { condition: "COVID-19", likelihood: 0.3, severity: 3, keySymptom: true }
  ],
  
  // Abdominal-related
  "abdominal pain": [
    { condition: "Gastroenteritis", likelihood: 0.7, severity: 2, keySymptom: true },
    { condition: "Irritable Bowel Syndrome", likelihood: 0.6, severity: 2, keySymptom: true },
    { condition: "Appendicitis", likelihood: 0.3, severity: 4, keySymptom: true },
    { condition: "Gallstones", likelihood: 0.4, severity: 3, keySymptom: true },
    { condition: "Pancreatitis", likelihood: 0.2, severity: 4, keySymptom: true }
  ],
  "nausea": [
    { condition: "Gastroenteritis", likelihood: 0.8, severity: 2, keySymptom: true },
    { condition: "Food Poisoning", likelihood: 0.7, severity: 2, keySymptom: true },
    { condition: "Migraine", likelihood: 0.4, severity: 2, keySymptom: false },
    { condition: "Pregnancy", likelihood: 0.3, severity: 1, keySymptom: false },
    { condition: "Appendicitis", likelihood: 0.2, severity: 4, keySymptom: false }
  ],
  "diarrhea": [
    { condition: "Gastroenteritis", likelihood: 0.8, severity: 2, keySymptom: true },
    { condition: "Food Poisoning", likelihood: 0.7, severity: 2, keySymptom: true },
    { condition: "Irritable Bowel Syndrome", likelihood: 0.5, severity: 2, keySymptom: true },
    { condition: "Inflammatory Bowel Disease", likelihood: 0.3, severity: 3, keySymptom: true },
    { condition: "Celiac Disease", likelihood: 0.2, severity: 2, keySymptom: true }
  ],
  
  // Musculoskeletal-related
  "joint pain": [
    { condition: "Osteoarthritis", likelihood: 0.7, severity: 2, keySymptom: true },
    { condition: "Rheumatoid Arthritis", likelihood: 0.5, severity: 3, keySymptom: true },
    { condition: "Gout", likelihood: 0.4, severity: 2, keySymptom: true },
    { condition: "Tendinitis", likelihood: 0.5, severity: 1, keySymptom: true },
    { condition: "Lupus", likelihood: 0.2, severity: 3, keySymptom: false }
  ],
  "back pain": [
    { condition: "Muscle Strain", likelihood: 0.8, severity: 1, keySymptom: true },
    { condition: "Herniated Disc", likelihood: 0.5, severity: 3, keySymptom: true },
    { condition: "Sciatica", likelihood: 0.5, severity: 2, keySymptom: true },
    { condition: "Osteoporosis", likelihood: 0.3, severity: 2, keySymptom: false },
    { condition: "Kidney Infection", likelihood: 0.2, severity: 3, keySymptom: false }
  ],
  
  // General symptoms
  "fever": [
    { condition: "Common Cold", likelihood: 0.7, severity: 1, keySymptom: true },
    { condition: "Influenza", likelihood: 0.8, severity: 2, keySymptom: true },
    { condition: "COVID-19", likelihood: 0.5, severity: 3, keySymptom: true },
    { condition: "Pneumonia", likelihood: 0.4, severity: 3, keySymptom: false },
    { condition: "Meningitis", likelihood: 0.2, severity: 5, keySymptom: false }
  ],
  "fatigue": [
    { condition: "Anemia", likelihood: 0.6, severity: 2, keySymptom: true },
    { condition: "Depression", likelihood: 0.5, severity: 3, keySymptom: true },
    { condition: "Hypothyroidism", likelihood: 0.5, severity: 2, keySymptom: true },
    { condition: "Chronic Fatigue Syndrome", likelihood: 0.4, severity: 3, keySymptom: true },
    { condition: "Sleep Apnea", likelihood: 0.4, severity: 2, keySymptom: true }
  ],
  
  // Skin-related
  "rash": [
    { condition: "Contact Dermatitis", likelihood: 0.7, severity: 1, keySymptom: true },
    { condition: "Eczema", likelihood: 0.6, severity: 2, keySymptom: true },
    { condition: "Psoriasis", likelihood: 0.5, severity: 2, keySymptom: true },
    { condition: "Allergic Reaction", likelihood: 0.5, severity: 2, keySymptom: true },
    { condition: "Shingles", likelihood: 0.3, severity: 3, keySymptom: true }
  ],
  "itching": [
    { condition: "Allergic Reaction", likelihood: 0.7, severity: 2, keySymptom: true },
    { condition: "Eczema", likelihood: 0.6, severity: 2, keySymptom: true },
    { condition: "Contact Dermatitis", likelihood: 0.6, severity: 1, keySymptom: true },
    { condition: "Dry Skin", likelihood: 0.5, severity: 1, keySymptom: true },
    { condition: "Psoriasis", likelihood: 0.4, severity: 2, keySymptom: false }
  ]
};

// Pre-defined list of common medical conditions with their details
export interface MedicalCondition {
  name: string;
  description: string;
  severity: number; // 1-5 scale
  symptoms: string[]; // Array of associated symptoms
  redFlags: string[]; // Symptoms that increase urgency
  commonTreatments: string[];
  whenToSeekHelp: string;
}

export const medicalConditions: Record<string, MedicalCondition> = {
  "Common Cold": {
    name: "Common Cold",
    description: "A viral infection of the upper respiratory tract, primarily the nose and throat.",
    severity: 1,
    symptoms: ["cough", "runny nose", "sore throat", "sneezing", "congestion", "mild fever"],
    redFlags: ["high fever", "severe headache", "shortness of breath", "chest pain"],
    commonTreatments: [
      "Rest and fluid intake",
      "Over-the-counter pain relievers",
      "Decongestants"
    ],
    whenToSeekHelp: "If symptoms persist for more than 10 days or are unusually severe."
  },
  "Influenza": {
    name: "Influenza",
    description: "A viral infection that attacks your respiratory system — your nose, throat, and lungs.",
    severity: 2,
    symptoms: ["fever", "chills", "muscle aches", "cough", "fatigue", "headache", "sore throat"],
    redFlags: ["difficulty breathing", "chest pain", "severe weakness", "persistent fever"],
    commonTreatments: [
      "Rest and hydration",
      "Antiviral medications (if diagnosed early)",
      "Pain relievers for fever and aches"
    ],
    whenToSeekHelp: "If you have trouble breathing, persistent high fever, or belong to a high-risk group."
  },
  "Tension Headache": {
    name: "Tension Headache",
    description: "The most common type of headache, characterized by mild to moderate pain often described as feeling like a tight band around the head.",
    severity: 1,
    symptoms: ["headache", "tenderness in scalp", "sensitivity to light", "tightness in neck muscles"],
    redFlags: ["sudden severe headache", "headache with fever", "headache after injury", "changed pattern of headaches"],
    commonTreatments: [
      "Over-the-counter pain relievers",
      "Stress management techniques",
      "Regular sleep schedule"
    ],
    whenToSeekHelp: "If headaches are frequent, severe, or interfere with daily activities."
  },
  "Migraine": {
    name: "Migraine",
    description: "A neurological condition characterized by intense, debilitating headaches, often accompanied by other symptoms.",
    severity: 2,
    symptoms: ["headache", "nausea", "vomiting", "sensitivity to light", "vision changes", "dizziness"],
    redFlags: ["worst headache of your life", "headache with fever and stiff neck", "headache with confusion"],
    commonTreatments: [
      "Rest in a quiet, dark room",
      "Prescription migraine medications",
      "Over-the-counter pain relievers",
      "Preventive medications for frequent migraines"
    ],
    whenToSeekHelp: "If migraines are frequent, severe, or accompanied by neurological symptoms."
  },
  "Gastroenteritis": {
    name: "Gastroenteritis",
    description: "Inflammation of the stomach and intestines, typically resulting from a viral or bacterial infection.",
    severity: 2,
    symptoms: ["nausea", "vomiting", "diarrhea", "abdominal pain", "fever", "headache"],
    redFlags: ["blood in stool", "severe abdominal pain", "inability to keep fluids down", "signs of dehydration"],
    commonTreatments: [
      "Fluid replacement to prevent dehydration",
      "Gradual reintroduction of food",
      "Rest"
    ],
    whenToSeekHelp: "If symptoms are severe, persistent, or accompanied by signs of dehydration."
  },
  "Asthma": {
    name: "Asthma",
    description: "A condition in which your airways narrow and swell and may produce extra mucus, making breathing difficult.",
    severity: 3,
    symptoms: ["shortness of breath", "chest tightness", "wheezing", "cough", "trouble sleeping due to breathing issues"],
    redFlags: ["severe difficulty breathing", "rapid worsening of symptoms", "no improvement with rescue inhaler"],
    commonTreatments: [
      "Rescue inhalers for quick relief",
      "Long-term control medications",
      "Identifying and avoiding triggers"
    ],
    whenToSeekHelp: "If you experience severe shortness of breath or your symptoms don't improve with use of a rescue inhaler."
  }
};

// Rule-based logic functions

export function calculateUrgencyScore(symptomsList: string[], severityLevel: number, duration: string): number {
  // Base score based on severity
  let urgencyScore = severityLevel;
  
  // Adjust based on duration
  const durationFactor = durationImpact[duration as keyof typeof durationImpact] || 1.0;
  urgencyScore *= durationFactor;
  
  // Check for red flags or concerning symptom combinations
  const hasChestPain = symptomsList.includes("chest pain");
  const hasShortness = symptomsList.includes("shortness of breath");
  const hasFever = symptomsList.includes("fever");
  const hasHeadache = symptomsList.includes("headache");
  const hasVisionChanges = symptomsList.includes("vision changes");
  
  // Critical combinations
  if (hasChestPain && hasShortness) {
    urgencyScore += 2; // Possible cardiac or pulmonary issue
  }
  
  if (hasFever && hasHeadache && symptomsList.includes("stiff neck")) {
    urgencyScore += 2; // Possible meningitis
  }
  
  if (hasHeadache && hasVisionChanges) {
    urgencyScore += 1; // Possible neurological issue
  }
  
  if (severityLevel >= 4) {
    urgencyScore += 1; // Very severe symptoms of any kind increase urgency
  }
  
  // Cap the score at 5
  return Math.min(5, urgencyScore);
}

export function getUrgencyDescription(score: number): string {
  if (score >= 4.5) return "Emergency - Seek immediate medical attention";
  if (score >= 3.5) return "Urgent - Seek medical care within 24 hours";
  if (score >= 2.5) return "Semi-urgent - Consult with a healthcare provider within a few days";
  if (score >= 1.5) return "Non-urgent - Schedule a routine appointment";
  return "Self-care - Can be managed at home with self-care measures";
}

export function identifyPossibleConditions(
  symptoms: string[], 
  severityLevel: number, 
  duration: string
): {
  conditions: Array<{name: string, probability: number, description: string}>,
  urgencyLevel: {score: number, description: string},
  generalAdvice: string,
  suggestedActions: string[],
  followUpRecommendation: string,
  disclaimer: string
} {
  // Map symptoms to potential conditions
  const conditionScores: Record<string, {score: number, count: number, keySymptomMatch: boolean}> = {};
  
  symptoms.forEach(symptom => {
    // Check if symptom exists in our map
    const potentialConditions = symptomConditionMap[symptom] || [];
    
    potentialConditions.forEach(association => {
      if (!conditionScores[association.condition]) {
        conditionScores[association.condition] = {
          score: 0,
          count: 0,
          keySymptomMatch: false
        };
      }
      
      // Add weighted score based on likelihood and severity
      conditionScores[association.condition].score += association.likelihood;
      conditionScores[association.condition].count += 1;
      
      // Track if any key symptoms match
      if (association.keySymptom) {
        conditionScores[association.condition].keySymptomMatch = true;
      }
    });
  });
  
  // Filter and sort conditions
  let possibleConditions = Object.entries(conditionScores)
    .filter(([_, data]) => {
      // Require either a key symptom match or multiple symptom matches
      return data.keySymptomMatch || data.count >= 2;
    })
    .map(([condition, data]) => {
      // Calculate probability - normalize based on number of symptoms
      const normalizationFactor = Math.sqrt(symptoms.length);
      const probability = (data.score / normalizationFactor) * 100;
      
      return {
        name: condition,
        probability: Math.min(95, Math.round(probability)), // Cap at 95% to account for uncertainty
        description: medicalConditions[condition]?.description || "Medical condition affecting health."
      };
    })
    .sort((a, b) => b.probability - a.probability)
    .slice(0, 3); // Top 3 most likely conditions
  
  // Calculate urgency score
  const urgencyScore = calculateUrgencyScore(symptoms, severityLevel, duration);
  const urgencyDescription = getUrgencyDescription(urgencyScore);
  
  // Generate appropriate advice based on urgency
  let generalAdvice = "";
  let suggestedActions: string[] = [];
  let followUpRecommendation = "";
  
  if (urgencyScore >= 4.5) {
    generalAdvice = "Your symptoms suggest a potentially serious condition that requires immediate medical attention.";
    suggestedActions = ["Go to the nearest emergency room or call emergency services (911)"];
    followUpRecommendation = "Follow emergency room discharge instructions carefully.";
  } else if (urgencyScore >= 3.5) {
    generalAdvice = "Your symptoms should be evaluated promptly by a healthcare professional.";
    suggestedActions = [
      "Schedule an urgent care visit within 24 hours",
      "Contact your primary care provider for a same-day appointment",
      "Monitor your symptoms closely for any worsening"
    ];
    followUpRecommendation = "Follow up with your primary care provider after your urgent care visit.";
  } else if (urgencyScore >= 2.5) {
    generalAdvice = "Your symptoms suggest a condition that should be evaluated by a healthcare provider, though not immediately urgent.";
    suggestedActions = [
      "Schedule an appointment with your healthcare provider within the next few days",
      "Rest and take care of yourself while waiting for your appointment",
      "Monitor your symptoms for any changes"
    ];
    followUpRecommendation = "Follow your doctor's recommendations for any follow-up care or testing.";
  } else if (urgencyScore >= 1.5) {
    generalAdvice = "Your symptoms are likely manageable with self-care, but a healthcare provider consultation is still recommended.";
    suggestedActions = [
      "Schedule a routine appointment with your healthcare provider",
      "Try appropriate over-the-counter remedies for symptom relief",
      "Pay attention to lifestyle factors that might improve your condition"
    ];
    followUpRecommendation = "If self-care measures don't improve your symptoms within a week, consider an earlier appointment.";
  } else {
    generalAdvice = "Your symptoms appear mild and can likely be managed with self-care measures.";
    suggestedActions = [
      "Rest and maintain good hydration",
      "Consider appropriate over-the-counter remedies for specific symptoms",
      "Pay attention to your diet, sleep, and stress levels"
    ];
    followUpRecommendation = "If symptoms persist for more than two weeks or worsen, schedule an appointment with your healthcare provider.";
  }
  
  // Add specific advice based on top condition if available
  if (possibleConditions.length > 0 && medicalConditions[possibleConditions[0].name]) {
    const topCondition = medicalConditions[possibleConditions[0].name];
    suggestedActions = [...suggestedActions, ...topCondition.commonTreatments.map(t => `Consider: ${t}`)];
  }
  
  const disclaimer = "This assessment is for informational purposes only and does not constitute medical advice. Always consult with a qualified healthcare provider for diagnosis and treatment recommendations specific to your situation.";
  
  return {
    conditions: possibleConditions,
    urgencyLevel: {
      score: urgencyScore,
      description: urgencyDescription
    },
    generalAdvice,
    suggestedActions,
    followUpRecommendation,
    disclaimer
  };
}