import { SymptomCheck } from '../shared/schema';
import * as knowledgeBase from './medical-knowledge-base';

interface SymptomData {
  bodyArea: string;
  symptoms: string[];
}

/**
 * Analyzes symptom data using a rule-based medical knowledge system
 * @param check The symptom check record to analyze
 * @returns The updated symptom check with analysis and recommendations
 */
export function analyzeSymptoms(check: SymptomCheck): SymptomCheck {
  try {
    // Parse the symptoms from the JSON data
    const symptomsData = check.symptoms as SymptomData[];
    
    // Extract all symptoms from all body areas
    const allSymptoms: string[] = symptomsData.flatMap(item => item.symptoms);
    
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
    
    // Get analysis from our knowledge base system
    const analysis = knowledgeBase.identifyPossibleConditions(
      allSymptoms, 
      check.severity, 
      mappedDuration
    );
    
    // Generate recommendations based on the analysis
    const recommendations = {
      medications: analysis.suggestedActions.filter(action => 
        action.toLowerCase().includes('medication') || 
        action.toLowerCase().includes('over-the-counter')
      ),
      lifestyleChanges: analysis.suggestedActions.filter(action => 
        action.toLowerCase().includes('rest') || 
        action.toLowerCase().includes('diet') || 
        action.toLowerCase().includes('hydrat') ||
        action.toLowerCase().includes('sleep') ||
        action.toLowerCase().includes('monitor')
      ),
      whenToSeekHelp: analysis.urgencyLevel.description
    };

    // If no specific medications were found, add a generic one
    if (recommendations.medications.length === 0) {
      recommendations.medications = ['Consult with a healthcare provider before taking any medications'];
    }

    // If no specific lifestyle changes were found, add generic ones
    if (recommendations.lifestyleChanges.length === 0) {
      recommendations.lifestyleChanges = ['Ensure adequate rest', 'Stay hydrated'];
    }

    return {
      ...check,
      status: 'analyzed',
      analysis: analysis,
      recommendations: recommendations
    };
  } catch (error) {
    console.error('Error in symptom analysis:', error);
    
    // Return a graceful fallback in case of error
    return {
      ...check,
      status: 'error',
      analysis: {
        possibleConditions: [],
        urgencyLevel: {
          score: 3,
          description: 'Unable to analyze symptoms. Please consult with a healthcare provider.'
        },
        generalAdvice: 'An error occurred during symptom analysis. For your safety, please consult with a healthcare provider.',
        suggestedActions: ['Contact your healthcare provider for proper evaluation'],
        followUpRecommendation: 'Schedule an appointment with your doctor',
        disclaimer: 'This system encountered an error during analysis. Always consult with a qualified healthcare provider for medical advice.'
      },
      recommendations: {
        medications: ['Consult with a healthcare provider before taking any medications'],
        lifestyleChanges: ['Ensure adequate rest', 'Stay hydrated'],
        whenToSeekHelp: 'Contact your healthcare provider for proper evaluation'
      }
    };
  }
}