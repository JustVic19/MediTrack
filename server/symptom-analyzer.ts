import { SymptomCheck, AnalysisResult, RecommendationResult } from '../shared/schema';
import * as knowledgeBase from './medical-knowledge-base';

// Define the interface for the symptom data structure we receive from the frontend
interface SymptomItem {
  description: string;
  location: string;
  characteristics?: string;
}

/**
 * Analyzes symptom data using a rule-based medical knowledge system
 * @param check The symptom check record to analyze
 * @returns The updated symptom check with analysis and recommendations
 */
export function analyzeSymptoms(check: SymptomCheck): SymptomCheck {
  try {
    console.log("Analyzing symptoms:", JSON.stringify(check, null, 2));
    
    // Parse the symptoms from the JSON data
    const symptomsData = check.symptoms as SymptomItem[];
    console.log("Symptoms data:", JSON.stringify(symptomsData, null, 2));
    
    // Extract all symptom descriptions to be analyzed by the knowledge base
    const allSymptoms: string[] = symptomsData.map(item => item.description);
    console.log("All symptoms:", allSymptoms);
    
    // Map duration from UI options to knowledge base options
    const durationMapping: Record<string, string> = {
      "Less than a day": "hours",
      "1-3 days": "days",
      "3-7 days": "days",
      "1-2 weeks": "weeks",
      "2-4 weeks": "weeks",
      "1-3 months": "months",
      "3+ months": "months"
    };
    
    const mappedDuration = durationMapping[check.duration] || "days";
    console.log("Mapped duration:", mappedDuration);
    
    // Get analysis from our knowledge base system
    const analysis = knowledgeBase.identifyPossibleConditions(
      allSymptoms, 
      check.severity, 
      mappedDuration
    );
    
    // Generate recommendations based on the analysis
    // Pull out medications and lifestyle changes for better organization
    const medications = analysis.suggestedActions.filter(action => 
      action.toLowerCase().includes('medication') || 
      action.toLowerCase().includes('over-the-counter')
    );
    
    const lifestyleChanges = analysis.suggestedActions.filter(action => 
      action.toLowerCase().includes('rest') || 
      action.toLowerCase().includes('diet') || 
      action.toLowerCase().includes('hydrat') ||
      action.toLowerCase().includes('sleep') ||
      action.toLowerCase().includes('monitor')
    );
    
    // Create medication advice
    let medicationAdvice = 'Consult with a healthcare provider before taking any medications';
    if (medications.length > 0) {
      medicationAdvice = `Consider: ${medications.join('; ')}`;
    }
    
    // Create lifestyle advice
    let lifestyleAdvice = 'Ensure adequate rest and stay hydrated';
    if (lifestyleChanges.length > 0) {
      lifestyleAdvice = lifestyleChanges.join('; ');
    }
    
    // Create recommendations object that follows the RecommendationResult interface
    const recommendations: RecommendationResult = {
      generalAdvice: `Based on your symptoms, you may want to: ${medicationAdvice}. ${lifestyleAdvice}.`,
      suggestedActions: analysis.suggestedActions,
      followUpRecommendation: analysis.followUpRecommendation,
      disclaimer: 'This information is not meant to replace professional medical advice. Please consult with a healthcare provider.'
    };

    // Create an analysis object that follows the AnalysisResult interface
    const formattedAnalysis: AnalysisResult = {
      urgencyLevel: analysis.urgencyLevel.description.toLowerCase().includes('urgent') ? 'high' :
                    analysis.urgencyLevel.description.toLowerCase().includes('moderate') ? 'medium' : 'low',
      possibleConditions: analysis.possibleConditions.map(condition => ({
        name: condition.name,
        probability: analysis.urgencyLevel.score > 3 ? 'High' : 'Moderate',
        description: condition.description
      })),
      disclaimer: analysis.disclaimer
    };

    return {
      ...check,
      status: 'analyzed',
      analysis: formattedAnalysis,
      recommendations: recommendations
    };
  } catch (error) {
    console.error('Error in symptom analysis:', error);
    
    // Return a graceful fallback in case of error
    // Create error fallback objects that follow the expected interfaces
    const errorAnalysis: AnalysisResult = {
      urgencyLevel: 'medium',
      possibleConditions: [],
      disclaimer: 'This system encountered an error during analysis. Always consult with a qualified healthcare provider for medical advice.'
    };
    
    const errorRecommendations: RecommendationResult = {
      generalAdvice: 'An error occurred during symptom analysis. For your safety, please consult with a healthcare provider.',
      suggestedActions: [
        'Contact your healthcare provider for proper evaluation',
        'Ensure adequate rest',
        'Stay hydrated'
      ],
      followUpRecommendation: 'Schedule an appointment with your doctor',
      disclaimer: 'This information is not meant to replace professional medical advice. Please consult with a healthcare provider.'
    };

    return {
      ...check,
      status: 'error',
      analysis: errorAnalysis,
      recommendations: errorRecommendations
    };
  }
}