const API_BASE_URL = import.meta.env.VITE_API_URL;

export async function getNextQuestion(prevAnswer = "") {
  const res = await fetch(`${API_BASE_URL}/api/next_question?prev_answer=${encodeURIComponent(prevAnswer)}`);
  return res.json();
}

export async function transcribeAudio(formData) {
  const res = await fetch(`${API_BASE_URL}/api/transcribe`, { method: "POST", body: formData });
  return res.json();
}

export async function evaluateAnswer(answer) {
  const res = await fetch(`${API_BASE_URL}/api/evaluate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ answer }),
  });
  return res.json();
}
