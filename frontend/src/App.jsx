import { useState, useRef } from 'react';
import QuestionBox from './components/QuestionBox';
import VoiceRecorder from './components/VoiceRecorder';
import { getNextQuestion, transcribeAudio, evaluateAnswer } from './api';

export default function App() {
  const [question, setQuestion] = useState('Loading question...');
  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [transcript, setTranscript] = useState('');
  const lastAnswerRef = useRef('');
  const [allEvaluations, setAllEvaluations] = useState([]);
  const [showFinalSummary, setShowFinalSummary] = useState(false);
  // Session state
  const [numQuestions, setNumQuestions] = useState(5);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [sessionAnswers, setSessionAnswers] = useState([]); // {question, answer, evaluation}

  // Start interview session
  function startSession() {
    setSessionStarted(true);
    setCurrentQuestionIndex(0);
    setSessionAnswers([]);
    fetchNextQuestion();
  }
function endInterview() {
  setShowFinalSummary(true);
}
  // Fetch next question
  async function fetchNextQuestion(prevAnswer = '') {
    try {
      const data = await getNextQuestion(prevAnswer);
      setQuestion(data.question);
      speakText(data.question);
    } catch (err) {
      console.error(err);
      setQuestion('Failed to load question.');
    }
  }

  // Handle voice submission
  async function handleVoiceSubmit(audioBlob) {
    setLoading(true);
    try {
      const form = new FormData();
      form.append('file', audioBlob, 'answer.wav');

      const tData = await transcribeAudio(form);
      const answerText = tData.text || '';
      lastAnswerRef.current = answerText;
      setTranscript(answerText);

      const eData = await evaluateAnswer(answerText);
      console.log('Evaluation Data:', eData);

      const safeEvaluation = eData.evaluation || { score: 0, strengths: [], weaknesses: [], suggestions: [] };

      // Save session answer
      if (question && !question.startsWith('It seems like we haven’t started')) {
        setSessionAnswers(prev => [...prev, { question, answer: answerText, evaluation: safeEvaluation }]);
        setAllEvaluations(prev => [...prev, safeEvaluation]);
      }

      // Move to next question or finish
      if (currentQuestionIndex + 1 < numQuestions) {
        setCurrentQuestionIndex(prev => prev + 1);
        await fetchNextQuestion(answerText);
      } else {
        showOverallEvaluation();
      }
    } catch (err) {
      console.error(err);
      setEvaluation({ error: err.message });
    } finally {
      setLoading(false);
    }
  }

  // Compute overall evaluation at the end of session
  function showOverallEvaluation() {
    let totalScore = 0;
    let strengths = [];
    let weaknesses = [];

    sessionAnswers.forEach(ans => {
      const score = ans.evaluation?.score || 0;
      totalScore += score;

      if (score >= 7) strengths.push(ans.question);
      else weaknesses.push(ans.question);
    });

    const overallScore = sessionAnswers.length > 0 ? totalScore / sessionAnswers.length : 0;

    setEvaluation({
      overallScore,
      strengths,
      weaknesses,
      sessionAnswers
    });
  }

  // Text-to-speech
  function speakText(text) {
    try {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'en-US';
      speechSynthesis.cancel();
      speechSynthesis.speak(u);
    } catch (e) {
      console.warn('TTS not available', e);
    }
  }

  // Final summary from all evaluations
  const getFinalSummary = () => {
    if (allEvaluations.length === 0) return null;

    const avgScore = allEvaluations.reduce((sum, e) => sum + (e.score || 0), 0) / allEvaluations.length;
    const strengths = allEvaluations.flatMap(e => e.strengths || []);
    const weaknesses = allEvaluations.flatMap(e => e.weaknesses || []);
    const suggestions = allEvaluations.flatMap(e => e.suggestions || []);

    return { avgScore, strengths, weaknesses, suggestions };
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-3xl">
        <header className="mb-6">
          <h1 className="text-3xl font-bold">AI Interview — Voice</h1>
          <p className="text-sm text-gray-500">
            Speak your answers. The system will transcribe and evaluate them.
          </p>
        </header>

        {!sessionStarted ? (
          <div className="p-6 bg-white rounded shadow">
            <h2 className="font-semibold text-lg mb-4">Set up your interview</h2>
            <label className="block mb-2">Number of questions:</label>
            <input
              type="number"
              min="1"
              value={numQuestions}
              onChange={e => setNumQuestions(Number(e.target.value))}
              className="border p-2 rounded w-20"
            />
            <button
              onClick={startSession}
              className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
            >
              Start Interview
            </button>
          </div>
        ) : (
          <div>
            <QuestionBox
              question={question}
              currentIndex={currentQuestionIndex}
              total={numQuestions}
            />
            <div className="mt-6 bg-white p-6 rounded shadow">
              <VoiceRecorder onSubmit={handleVoiceSubmit} disabled={loading} />
              {loading && <div className="mt-4 text-sm text-gray-600">Processing...</div>}
            </div>
            <button
                onClick={endInterview}
                className="mt-4 bg-red-500 text-white px-4 py-2 rounded"
              >
                End Interview
              </button>

            {showFinalSummary && allEvaluations.length > 0 && (
  <div style={{ marginTop: "2rem", borderTop: "2px solid #000", paddingTop: "1rem" }}>
    <h2>Final Interview Summary</h2>
    {(() => {
      const summary = getFinalSummary();
      if (!summary) return null;
      return (
        <>
          <p><strong>Average Score:</strong> {summary.avgScore.toFixed(1)}</p>
          <div>
            <strong>Strengths:</strong>
            <ul>{summary.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul>
          </div>
          <div>
            <strong>Weaknesses:</strong>
            <ul>{summary.weaknesses.map((w, i) => <li key={i}>{w}</li>)}</ul>
          </div>
          <div>
            <strong>Suggestions:</strong>
            <ul>{summary.suggestions.map((s, i) => <li key={i}>{s}</li>)}</ul>
          </div>
        </>
      );
    })()}
  </div>
)}
          </div>
        )}

        <footer className="mt-8 text-xs text-gray-400">
          Backend: {import.meta.env.VITE_API_URL}
        </footer>
      </div>
    </div>
  );
}
