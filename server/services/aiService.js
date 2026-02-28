const { GoogleGenerativeAI } = require("@google/generative-ai");

const getAIClient = () => {
  if (!process.env.GEMINI_API_KEY) return null;
  return new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
};

exports.analyzeSymptoms = async ({ symptoms, age, gender, history }) => {
  try {
    const genAI = getAIClient();
    if (!genAI) throw new Error("No API key");

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `You are a medical AI assistant. Analyze the following patient information and provide a structured medical assessment.

Patient Info:
- Age: ${age}
- Gender: ${gender}
- Symptoms: ${symptoms}
- Medical History: ${history || "None provided"}

Respond ONLY in this exact JSON format:
{
  "possibleConditions": ["condition1", "condition2", "condition3"],
  "riskLevel": "low|medium|high",
  "suggestedTests": ["test1", "test2"],
  "summary": "brief clinical summary",
  "disclaimer": "This is AI assistance only. Final diagnosis must be made by the doctor."
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Invalid AI response format");
    return { success: true, data: JSON.parse(jsonMatch[0]) };
  } catch (error) {
    console.error("AI symptom analysis failed:", error.message);
    return {
      success: false,
      fallback: true,
      data: {
        possibleConditions: ["Unable to analyze - please consult doctor"],
        riskLevel: "medium",
        suggestedTests: ["Clinical examination recommended"],
        summary: "AI analysis unavailable. Please rely on clinical judgment.",
        disclaimer: "AI service temporarily unavailable.",
      },
    };
  }
};

exports.generatePrescriptionExplanation = async ({ medicines, diagnosis, instructions, language = "english" }) => {
  try {
    const genAI = getAIClient();
    if (!genAI) throw new Error("No API key");

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const langNote = language === "urdu" ? "Respond in Urdu language." : "Respond in simple English.";

    const prompt = `${langNote} You are explaining a prescription to a patient in simple, non-medical language.

Diagnosis: ${diagnosis || "Not specified"}
Medicines: ${medicines.map((m) => `${m.name} - ${m.dosage}, ${m.frequency} for ${m.duration}`).join("; ")}
Doctor's Instructions: ${instructions || "Follow up as advised"}

Provide:
1. Simple explanation of each medicine (what it does in plain words)
2. Lifestyle recommendations
3. Preventive advice
4. When to seek urgent care

Keep it friendly, simple, and reassuring.`;

    const result = await model.generateContent(prompt);
    return { success: true, explanation: result.response.text() };
  } catch (error) {
    console.error("AI prescription explanation failed:", error.message);
    return {
      success: false,
      fallback: true,
      explanation:
        "AI explanation is temporarily unavailable. Please ask your doctor to explain your prescription in detail.",
    };
  }
};

exports.checkRiskPatterns = async (diagnosisLogs) => {
  try {
    const genAI = getAIClient();
    if (!genAI) throw new Error("No API key");

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const logsText = diagnosisLogs
      .map((l) => `Date: ${l.createdAt}, Symptoms: ${l.symptoms}, Conditions: ${l.possibleConditions?.join(", ")}`)
      .join("\n");

    const prompt = `Analyze these patient diagnosis logs for risk patterns:
${logsText}

Return JSON: { "isHighRisk": boolean, "riskNote": "explanation", "patterns": ["pattern1"] }`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return { success: true, data: JSON.parse(jsonMatch[0]) };
  } catch (error) {
    return { success: false, data: { isHighRisk: false, riskNote: "", patterns: [] } };
  }
};
