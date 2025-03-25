// This file contains rule-based knowledge for symptom analysis
// It uses predefined medical knowledge without requiring external AI APIs

export const severityDescriptions = {
  1: "Mild - Noticeable but not interfering with daily activities",
  2: "Moderate - Some interference with daily activities",
  3: "Severe - Significant interference with daily activities",
  4: "Very Severe - Unable to perform daily activities",
  5: "Emergency - Potentially life-threatening"
};

export const durationImpact = {
  "hours": 0.7,
  "days": 0.8,
  "weeks": 1.0,
  "months": 1.2
};

export const bodyAreaSymptoms: Record<string, string[]> = {
  "head": ["headache", "dizziness", "lightheadedness", "confusion", "memory problems"],
  "eyes": ["blurred vision", "eye pain", "redness", "sensitivity to light", "dry eyes"],
  "ears": ["ear pain", "hearing loss", "ringing in ears", "ear discharge", "vertigo"],
  "nose": ["runny nose", "congestion", "nosebleeds", "loss of smell", "sinus pain"],
  "mouth": ["sore throat", "dry mouth", "mouth sores", "bad breath", "difficulty swallowing"],
  "throat": ["sore throat", "hoarseness", "difficulty swallowing", "swollen glands"],
  "chest": ["chest pain", "chest tightness", "shortness of breath", "palpitations"],
  "heart": ["palpitations", "chest pain", "shortness of breath", "fatigue", "racing heart"],
  "lungs": ["cough", "wheezing", "shortness of breath", "chest pain", "coughing up phlegm"],
  "abdomen": ["abdominal pain", "nausea", "vomiting", "bloating", "diarrhea", "constipation"],
  "back": ["back pain", "stiffness", "limited mobility", "radiating pain"],
  "pelvis": ["pelvic pain", "urinary problems", "genital discomfort", "menstrual problems"],
  "arms": ["arm pain", "weakness", "numbness", "tingling", "joint pain", "swelling"],
  "legs": ["leg pain", "weakness", "numbness", "tingling", "joint pain", "swelling"],
  "skin": ["rash", "itching", "dryness", "discoloration", "swelling", "sores"],
  "general": ["fever", "fatigue", "weakness", "weight loss", "weight gain", "night sweats", "chills"]
};

interface ConditionAssociation {
  condition: string;
  likelihood: number; // 0-1 scale where 1 is strongly associated
  severity: number;   // 1-5 scale of condition severity
  keySymptom: boolean; // If this is a definitive symptom for the condition
}

export const symptomConditionMap: Record<string, ConditionAssociation[]> = {
  // Head symptoms
  "headache": [
    { condition: "Tension headache", likelihood: 0.9, severity: 1, keySymptom: true },
    { condition: "Migraine", likelihood: 0.7, severity: 2, keySymptom: true },
    { condition: "Sinus infection", likelihood: 0.5, severity: 2, keySymptom: false },
    { condition: "Hypertension", likelihood: 0.3, severity: 3, keySymptom: false },
    { condition: "Meningitis", likelihood: 0.1, severity: 5, keySymptom: false }
  ],
  "dizziness": [
    { condition: "Inner ear infection", likelihood: 0.7, severity: 2, keySymptom: true },
    { condition: "Vertigo", likelihood: 0.6, severity: 2, keySymptom: true },
    { condition: "Hypertension", likelihood: 0.4, severity: 3, keySymptom: false },
    { condition: "Anemia", likelihood: 0.4, severity: 2, keySymptom: false },
    { condition: "Stroke", likelihood: 0.1, severity: 5, keySymptom: false }
  ],
  
  // Respiratory symptoms
  "cough": [
    { condition: "Common cold", likelihood: 0.8, severity: 1, keySymptom: true },
    { condition: "Flu", likelihood: 0.7, severity: 2, keySymptom: true },
    { condition: "Bronchitis", likelihood: 0.5, severity: 2, keySymptom: true },
    { condition: "Pneumonia", likelihood: 0.3, severity: 4, keySymptom: false },
    { condition: "COVID-19", likelihood: 0.3, severity: 3, keySymptom: false }
  ],
  "shortness of breath": [
    { condition: "Asthma", likelihood: 0.7, severity: 3, keySymptom: true },
    { condition: "Pneumonia", likelihood: 0.5, severity: 4, keySymptom: false },
    { condition: "COPD", likelihood: 0.4, severity: 4, keySymptom: true },
    { condition: "Heart failure", likelihood: 0.3, severity: 4, keySymptom: false },
    { condition: "COVID-19", likelihood: 0.3, severity: 3, keySymptom: false }
  ],
  
  // Abdominal symptoms
  "abdominal pain": [
    { condition: "Gastritis", likelihood: 0.7, severity: 2, keySymptom: true },
    { condition: "IBS", likelihood: 0.6, severity: 2, keySymptom: true },
    { condition: "Appendicitis", likelihood: 0.3, severity: 4, keySymptom: true },
    { condition: "Pancreatitis", likelihood: 0.2, severity: 4, keySymptom: false },
    { condition: "Gallstones", likelihood: 0.3, severity: 3, keySymptom: false }
  ],
  "nausea": [
    { condition: "Gastroenteritis", likelihood: 0.8, severity: 2, keySymptom: true },
    { condition: "Food poisoning", likelihood: 0.7, severity: 2, keySymptom: true },
    { condition: "Migraine", likelihood: 0.5, severity: 2, keySymptom: false },
    { condition: "Pregnancy", likelihood: 0.4, severity: 1, keySymptom: false },
    { condition: "Appendicitis", likelihood: 0.2, severity: 4, keySymptom: false }
  ],
  
  // General symptoms
  "fever": [
    { condition: "Common cold", likelihood: 0.7, severity: 1, keySymptom: false },
    { condition: "Flu", likelihood: 0.8, severity: 2, keySymptom: true },
    { condition: "COVID-19", likelihood: 0.5, severity: 3, keySymptom: false },
    { condition: "Bacterial infection", likelihood: 0.6, severity: 3, keySymptom: false },
    { condition: "Meningitis", likelihood: 0.1, severity: 5, keySymptom: false }
  ],
  "fatigue": [
    { condition: "Anemia", likelihood: 0.6, severity: 2, keySymptom: true },
    { condition: "Depression", likelihood: 0.5, severity: 3, keySymptom: false },
    { condition: "Hypothyroidism", likelihood: 0.4, severity: 2, keySymptom: true },
    { condition: "Chronic fatigue syndrome", likelihood: 0.3, severity: 3, keySymptom: true },
    { condition: "Sleep apnea", likelihood: 0.3, severity: 2, keySymptom: false }
  ],
  
  // Other common symptoms
  "rash": [
    { condition: "Contact dermatitis", likelihood: 0.8, severity: 1, keySymptom: true },
    { condition: "Eczema", likelihood: 0.6, severity: 2, keySymptom: true },
    { condition: "Psoriasis", likelihood: 0.4, severity: 2, keySymptom: true },
    { condition: "Allergic reaction", likelihood: 0.5, severity: 2, keySymptom: false },
    { condition: "Chickenpox", likelihood: 0.2, severity: 2, keySymptom: true }
  ],
  "joint pain": [
    { condition: "Osteoarthritis", likelihood: 0.7, severity: 2, keySymptom: true },
    { condition: "Rheumatoid arthritis", likelihood: 0.5, severity: 3, keySymptom: true },
    { condition: "Gout", likelihood: 0.4, severity: 3, keySymptom: true },
    { condition: "Lupus", likelihood: 0.2, severity: 4, keySymptom: false },
    { condition: "Lyme disease", likelihood: 0.1, severity: 3, keySymptom: false }
  ]
};

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
  "Tension headache": {
    name: "Tension headache",
    description: "A common type of headache characterized by a dull, aching pain or pressure around the forehead or back of the head and neck.",
    severity: 1,
    symptoms: ["headache", "pressure around head", "tenderness in scalp", "neck pain"],
    redFlags: ["sudden severe headache", "headache with fever", "headache after injury"],
    commonTreatments: ["Over-the-counter pain relievers", "Stress management", "Adequate rest", "Hydration"],
    whenToSeekHelp: "If headaches are severe, frequent, or interfere with daily activities."
  },
  "Migraine": {
    name: "Migraine",
    description: "A neurological condition characterized by intense, debilitating headaches often accompanied by nausea and sensitivity to light and sound.",
    severity: 2,
    symptoms: ["severe headache", "throbbing pain", "nausea", "vomiting", "sensitivity to light", "sensitivity to sound"],
    redFlags: ["worst headache of life", "speech changes", "numbness", "vision changes"],
    commonTreatments: ["Rest in a quiet, dark room", "Over-the-counter or prescription pain relievers", "Anti-nausea medications", "Preventive medications"],
    whenToSeekHelp: "If you have a severe headache that starts suddenly, or headache with fever, stiff neck, confusion, seizure, double vision, weakness, numbness, or difficulty speaking."
  },
  "Common cold": {
    name: "Common cold",
    description: "A viral infection of the upper respiratory tract that primarily affects the nose and throat.",
    severity: 1,
    symptoms: ["runny nose", "congestion", "sore throat", "cough", "mild fever", "sneezing"],
    redFlags: ["high fever", "severe headache", "difficulty breathing", "chest pain"],
    commonTreatments: ["Rest", "Hydration", "Over-the-counter cold medications", "Saline nasal spray"],
    whenToSeekHelp: "If symptoms last more than 10 days, or if you have a high fever, severe sore throat, or earache."
  },
  "Flu": {
    name: "Influenza (Flu)",
    description: "A contagious respiratory illness caused by influenza viruses that infect the nose, throat, and lungs.",
    severity: 2,
    symptoms: ["fever", "chills", "cough", "sore throat", "runny nose", "body aches", "fatigue", "headache"],
    redFlags: ["difficulty breathing", "chest pain", "persistent high fever", "confusion"],
    commonTreatments: ["Rest", "Fluids", "Over-the-counter fever reducers", "Antiviral medications (if prescribed)"],
    whenToSeekHelp: "If you have difficulty breathing, chest pain, severe or persistent vomiting, sudden dizziness, or flu-like symptoms that improve but then return with fever and worse cough."
  },
  "Gastroenteritis": {
    name: "Gastroenteritis",
    description: "Inflammation of the stomach and intestines, typically resulting from a viral or bacterial infection.",
    severity: 2,
    symptoms: ["nausea", "vomiting", "diarrhea", "abdominal cramps", "fever", "headache"],
    redFlags: ["blood in stool", "severe abdominal pain", "inability to keep fluids down", "signs of dehydration"],
    commonTreatments: ["Rest", "Clear fluids", "Gradual reintroduction of bland foods", "Electrolyte solutions"],
    whenToSeekHelp: "If there is blood in your vomit or stool, high fever, severe abdominal pain, or signs of dehydration such as extreme thirst, dry mouth, little or no urination, or dizziness."
  }
};

export function calculateUrgencyScore(symptomsList: string[], severityLevel: number, duration: string): number {
  // Base score is the user-reported severity
  let score = severityLevel;
  
  // Duration factor adjusts the score
  const durationFactor = durationImpact[duration as keyof typeof durationImpact] || 1;
  
  // Check for red flag symptoms that increase urgency
  let redFlagCount = 0;
  const redFlagSymptoms = [
    "chest pain", "difficulty breathing", "severe headache", "sudden dizziness",
    "fainting", "confusion", "slurred speech", "facial drooping",
    "sudden numbness", "severe abdominal pain", "coughing up blood",
    "high fever", "inability to keep fluids down", "blood in stool"
  ];
  
  for (const symptom of symptomsList) {
    if (redFlagSymptoms.includes(symptom.toLowerCase())) {
      redFlagCount++;
    }
  }
  
  // Adjust score based on red flags
  score += redFlagCount * 0.7;
  
  // Apply duration factor
  score = score * durationFactor;
  
  // Ensure score stays in 1-5 range
  return Math.max(1, Math.min(5, Math.round(score * 10) / 10));
}

export function getUrgencyDescription(score: number): string {
  if (score >= 4.5) {
    return "Seek emergency medical attention immediately.";
  } else if (score >= 3.5) {
    return "Seek medical attention as soon as possible, within 24 hours.";
  } else if (score >= 2.5) {
    return "Schedule an appointment with your healthcare provider in the next few days.";
  } else if (score >= 1.5) {
    return "Monitor your symptoms and schedule a routine appointment if they persist or worsen.";
  } else {
    return "Self-care measures should be adequate. Monitor for any changes.";
  }
}

export function identifyPossibleConditions(
  symptomsList: string[],
  severityLevel: number,
  duration: string
) {
  console.log("Identifying conditions for symptoms:", symptomsList);
  console.log("Severity level:", severityLevel);
  console.log("Duration:", duration);
  
  const normalizedSymptoms = symptomsList.map(s => s.toLowerCase().trim());
  console.log("Normalized symptoms:", normalizedSymptoms);
  
  // Calculate urgency score
  const urgencyScore = calculateUrgencyScore(normalizedSymptoms, severityLevel, duration);
  console.log("Calculated urgency score:", urgencyScore);
  
  // Identify potential conditions based on reported symptoms
  const potentialConditions: {
    name: string;
    matchScore: number;
    description: string;
    keySymptomMatch: boolean;
  }[] = [];
  
  // Track matched symptoms for each condition
  const conditionSymptomMatches: Record<string, string[]> = {};
  
  // Check each symptom against the knowledge base
  for (const symptom of normalizedSymptoms) {
    const relatedConditions = symptomConditionMap[symptom] || [];
    
    for (const relation of relatedConditions) {
      const condition = relation.condition;
      
      // Initialize if this is the first match for this condition
      if (!conditionSymptomMatches[condition]) {
        conditionSymptomMatches[condition] = [];
      }
      
      // Add this symptom to the matched symptoms for this condition
      if (!conditionSymptomMatches[condition].includes(symptom)) {
        conditionSymptomMatches[condition].push(symptom);
      }
      
      // Check if this condition is already in our potential list
      const existingCondition = potentialConditions.find(c => c.name === condition);
      
      if (existingCondition) {
        // Update the match score
        existingCondition.matchScore += relation.likelihood;
        
        // Update key symptom match if this is a key symptom
        if (relation.keySymptom) {
          existingCondition.keySymptomMatch = true;
        }
      } else {
        // Add the condition to our potential list
        potentialConditions.push({
          name: condition,
          matchScore: relation.likelihood,
          description: medicalConditions[condition]?.description || "Common medical condition",
          keySymptomMatch: relation.keySymptom
        });
      }
    }
  }
  
  // Sort conditions by match score and key symptom matches
  potentialConditions.sort((a, b) => {
    // Key symptoms are the highest priority
    if (a.keySymptomMatch && !b.keySymptomMatch) return -1;
    if (!a.keySymptomMatch && b.keySymptomMatch) return 1;
    
    // Then sort by match score
    return b.matchScore - a.matchScore;
  });
  
  // Limit to top 3 conditions
  const topConditions = potentialConditions.slice(0, 3);
  
  // Generate appropriate advice based on conditions and urgency
  let generalAdvice = "Based on your symptoms, consider the following:";
  const suggestedActions: string[] = [];
  
  // Add condition-specific advice
  for (const condition of topConditions) {
    const conditionData = medicalConditions[condition.name];
    if (conditionData) {
      for (const treatment of conditionData.commonTreatments) {
        if (!suggestedActions.includes(treatment)) {
          suggestedActions.push(treatment);
        }
      }
    }
  }
  
  // Add general advice based on symptoms
  if (normalizedSymptoms.some(s => s.includes("pain"))) {
    suggestedActions.push("Consider appropriate over-the-counter pain relievers");
  }
  
  if (normalizedSymptoms.some(s => s.includes("fever"))) {
    suggestedActions.push("Monitor temperature and consider fever-reducing medication if needed");
  }
  
  if (normalizedSymptoms.some(s => s.includes("cough") || s.includes("congestion"))) {
    suggestedActions.push("Ensure adequate hydration and rest");
  }
  
  // Standard advice everyone should get
  if (!suggestedActions.includes("Rest")) {
    suggestedActions.push("Rest");
  }
  
  if (!suggestedActions.includes("Stay hydrated")) {
    suggestedActions.push("Stay hydrated");
  }
  
  // Prepare follow-up recommendation based on urgency
  const followUpRecommendation = urgencyScore >= 3 
    ? "Consult with a healthcare provider soon" 
    : "Monitor your symptoms and seek medical advice if they worsen";
  
  // Return the analysis results
  return {
    possibleConditions: topConditions.map(condition => ({
      name: condition.name,
      description: condition.description,
      matchedSymptoms: conditionSymptomMatches[condition.name] || []
    })),
    urgencyLevel: {
      score: urgencyScore,
      description: getUrgencyDescription(urgencyScore)
    },
    generalAdvice,
    suggestedActions,
    followUpRecommendation,
    disclaimer: "This analysis is based on reported symptoms only and is not a medical diagnosis. Always consult with a qualified healthcare provider for medical advice."
  };
}