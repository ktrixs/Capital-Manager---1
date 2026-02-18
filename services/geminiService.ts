import { GoogleGenAI, Type, Schema } from "@google/genai";
import { PredictionResult } from "../types";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });

export const analyzeMatch = async (
  homeTeam: string,
  awayTeam: string,
  league: string,
  currentScore: string,
  currentMinute: string,
  context: string
): Promise<PredictionResult> => {
  // Use gemini-3-pro-preview for deep reasoning on match analysis
  const modelId = "gemini-3-pro-preview";
  
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      homeWin: { type: Type.NUMBER, description: "Prob of Home Win (0-1)" },
      draw: { type: Type.NUMBER, description: "Prob of Draw (0-1)" },
      awayWin: { type: Type.NUMBER, description: "Prob of Away Win (0-1)" },
      doubleChance1X: { type: Type.NUMBER, description: "Prob of Home Win OR Draw (0-1)" },
      doubleChanceX2: { type: Type.NUMBER, description: "Prob of Away Win OR Draw (0-1)" },
      over05: { type: Type.NUMBER, description: "Prob of Over 0.5 Total Goals in match (0-1)" },
      over15: { type: Type.NUMBER, description: "Prob of Over 1.5 Total Goals in match (0-1)" },
      reasoning: { type: Type.STRING, description: "Strategic analysis focusing on second half momentum and goal likelihood." },
      confidence: { type: Type.NUMBER, description: "Confidence score (0-100)" }
    },
    required: ["homeWin", "draw", "awayWin", "doubleChance1X", "doubleChanceX2", "over05", "over15", "reasoning", "confidence"],
  };

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: `Analyze this live football match for a second-half betting strategy.
      Match: ${homeTeam} vs ${awayTeam} (${league}).
      Current State: Minute ${currentMinute}, Score ${currentScore}.
      
      The user is looking to bet on:
      1. Winning Team + Draw (Double Chance)
      2. Over 0.5 Goals (Total)
      3. Over 1.5 Goals (Total)

      Analyze the game flow, momentum, and likelihood of more goals based on the current score and time remaining.
      Provide realistic probabilities for these specific outcomes.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        thinkingConfig: {
          thinkingBudget: 32768
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");
    
    return JSON.parse(text) as PredictionResult;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    // Fallback data
    return {
      homeWin: 0.40, draw: 0.30, awayWin: 0.30,
      doubleChance1X: 0.70,
      doubleChanceX2: 0.60,
      over05: 0.85,
      over15: 0.55,
      reasoning: "Analysis failed. Using statistical averages for live betting markets.",
      confidence: 40
    };
  }
};

export const generatePythonCode = async (moduleName: string): Promise<string> => {
  // Use gemini-3-pro-preview for complex code generation tasks
  const modelId = "gemini-3-pro-preview";

  const prompt = `Generate professional, production-ready Python code for a sports betting system module: ${moduleName}.
  Include type hints, docstrings, and error handling. 
  
  If requesting Database Schema, include SQLAlchemy models for:
  1. Matches, Odds, Bets (Core)
  2. Capital Allocation (Assets, Allocation Policy, Monthly Schedule Ledger)
  3. Cycle Betting (Cycle State, History, Ladder Steps)
  
  If it's a model, use scikit-learn or XGBoost.
  If it's the Kelly Criterion, implement the mathematical formula efficiently.`;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        thinkingConfig: {
          thinkingBudget: 32768
        }
      }
    });
    return response.text || "# Error generating code.";
  } catch (error) {
    console.error("Code Generation Error:", error);
    return "# Error generating code. Please check API Key.";
  }
};
