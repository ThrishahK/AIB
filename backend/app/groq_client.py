import os
from typing import Dict, Any
from groq import Groq
import json
import re
import json


# Make sure to set your Groq API key in environment variables
import os
GROQ_API_KEY = os.getenv('GROQ_API_KEY')
if not GROQ_API_KEY:
    raise RuntimeError('GROQ_API_KEY not set. Please create a .env file or export GROQ_API_KEY.')
client = Groq(api_key=GROQ_API_KEY)
def transcribe_audio_bytes(audio_path: str) -> str:
    with open(audio_path, "rb") as f:
        resp = client.audio.transcriptions.create(
            file=f,
            model="whisper-large-v3",
            language="en"  # Force English
        )
    return getattr(resp, "text", resp.get("text") if isinstance(resp, dict) else str(resp))




def generate_question(prev_answer: str = "") -> str:
    system_prompt = "You are an interviewer AI for HR and technical rounds."


    # Handle first question vs follow-up
    if not prev_answer.strip():
        user_prompt = (
            "Start a new interview. "
            "Ask the candidate a relevant opening question such as "
            "'Tell me about yourself' or a simple technical question. "
            "Keep it short and conversational."
        )
    else:
        user_prompt = (
            f"Candidate's previous answer: {prev_answer}\n"
            "Ask a concise and relevant follow-up HR or technical question."
        )


    resp = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.7,
        max_tokens=200,
    )


    return resp.choices[0].message.content.strip()




def evaluate_answer(answer: str) -> Dict[str, Any]:
    if not answer.strip():
        return {
            "score": 0.0,
            "strengths": [],
            "weaknesses": ["No answer provided."],
            "suggestions": ["Please respond to the question."]
        }

    system_prompt = (
        "You are an expert interviewer evaluator. "
        "Carefully evaluate the following candidate answer and return ONLY a valid JSON "
        "object with the following fields:\n"
        "{\n"
        "  'score': (float, 0–10),\n"
        "  'strengths': [list of strings],\n"
        "  'weaknesses': [list of strings],\n"
        "  'suggestions': [list of strings]\n"
        "}\n"
        "Do not include any text before or after the JSON."
    )

    user_prompt = f"Candidate answer:\n{answer}"

    resp = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        temperature=0.0,
        max_tokens=400,
    )

    raw = resp.choices[0].message.content.strip()

    # Clean markdown and stray text
    raw_clean = (
        raw.replace("```json", "")
           .replace("```", "")
           .strip()
    )

    #  Debug print — keep for now
    print("🧾 Raw model output:", raw)
    print("🧹 Cleaned output:", raw_clean)

    # Parse JSON safely
    try:
        parsed = json.loads(raw_clean)
    except json.JSONDecodeError as e:
        print("⚠️ JSON parse failed:", e)
        parsed = {
            "score": 0.0,
            "strengths": [],
            "weaknesses": ["Failed to parse model output."],
            "suggestions": [raw_clean]
        }

    return parsed

