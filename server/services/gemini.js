const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const getModel = () => genAI.getGenerativeModel({ model: "gemini-pro" });

// Smart Symptom Checker
exports.analyzeSymptoms = async ({ symptoms, age, gender, history }) => {
  try {
    const model = getModel();
    const prompt = `You are a medical AI assistant. A patient has the following details:
- Age: ${age}
- Gender: ${gender}
- Symptoms: ${symptoms.join(", ")}
- Medical History: ${history || "None"}

Provide a JSON response with these exact keys:
{
  "possibleConditions": ["condition1", "condition2"],
  "riskLevel": "low|medium|high",
  "suggestedTests": ["test1", "test2"],
  "summary": "Brief explanation"
}
Only respond with valid JSON, no markdown.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    return JSON.parse(text);
  } catch (err) {
    console.error("Gemini analyzeSymptoms error:", err.message);
    return null; // graceful fallback
  }
};

// Prescription Explanation
exports.explainPrescription = async ({ medicines, instructions, patientName, language = "english" }) => {
  try {
    const model = getModel();
    const medList = medicines.map((m) => `${m.name} (${m.dosage}, ${m.frequency}, ${m.duration})`).join("\n");
    const langNote = language === "urdu" ? "Respond ONLY in Urdu language." : "Respond in simple English.";

    const prompt = `${langNote}
You are a friendly medical assistant explaining a prescription to a patient named ${patientName}.
Medicines prescribed:
${medList}
Doctor instructions: ${instructions || "None"}

Explain in simple terms:
1. What each medicine does
2. Lifestyle recommendations
3. Preventive advice
Keep it simple, friendly, and encouraging.`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (err) {
    console.error("Gemini explainPrescription error:", err.message);
    return null;
  }
};

// Predictive analytics
exports.getPredictiveAnalytics = async ({ diagnosisData, appointmentData }) => {
  try {
    const model = getModel();
    const prompt = `You are a medical analytics AI. Based on this clinic data, provide insights:
Diagnosis data: ${JSON.stringify(diagnosisData)}
Recent appointments: ${JSON.stringify(appointmentData)}

Respond with JSON:
{
  "mostCommonDisease": "disease name",
  "patientLoadForecast": "expected load next 7 days",
  "trend": "increasing|decreasing|stable",
  "recommendation": "brief action recommendation"
}
Only respond with valid JSON.`;

    const result = await model.generateContent(prompt);
    return JSON.parse(result.response.text().trim());
  } catch (err) {
    console.error("Gemini predictive analytics error:", err.message);
    return null;
  }
};
