import React, { useState } from "react";
import { QuizQuestion } from "../lib/api";
import { apiClient } from "../lib/api";


interface QuizProps {
  questions: QuizQuestion[];
  onFinish?: (score: number, total: number) => void;
}


export const Quiz: React.FC<QuizProps> = ({ questions, onFinish }) => {
  const [answers, setAnswers] = useState<(number | null)[]>(Array(questions.length).fill(null));
  const [results, setResults] = useState<boolean[] | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSelect = (qIdx: number, optIdx: number) => {
    setAnswers(prev => {
      const copy = [...prev];
      copy[qIdx] = optIdx;
      return copy;
    });
  };

  const [showRemarks, setShowRemarks] = useState(false);
  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const response = await apiClient.evaluateQuiz({
        questions,
        user_answers: answers.map(a => a ?? -1),
      });
      setResults(response.results);
      setScore(response.score);
      setShowRemarks(true);
      if (onFinish) onFinish(response.score, questions.length);
    } catch (err) {
      alert("Failed to evaluate quiz.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 bg-white rounded-xl shadow">
      <h2 className="text-xl font-bold mb-4 text-black">Quiz</h2>
      {questions.map((q, i) => (
        <div key={i} className="mb-6">
          <div className="font-semibold mb-2 text-black">{i + 1}. {q.question}</div>
          <div className="space-y-2">
            {q.options.map((opt, idx) => (
              <label key={idx} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name={`q${i}`}
                  checked={answers[i] === idx}
                  onChange={() => handleSelect(i, idx)}
                  disabled={!!results}
                />
                <span className={
                  results && answers[i] === idx
                    ? results[i]
                      ? "text-green-600 font-bold"
                      : "text-red-600 font-bold"
                    : "text-black"
                }>
                  {String.fromCharCode(65 + idx)}. {opt.text}
                </span>
                {results && idx === q.answer && (
                  <span className="ml-2 text-green-500">(Correct)</span>
                )}
              </label>
            ))}
          </div>
          {results && answers[i] !== null && !results[i] && (
            <div className="text-sm text-red-500 mt-1">Your answer was incorrect.</div>
          )}
        </div>
      ))}
      {!results && (
        <button
          className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold shadow hover:bg-blue-700"
          onClick={handleSubmit}
          disabled={submitting || answers.some(a => a === null)}
        >
          Submit Answers
        </button>
      )}
      {results && score !== null && (
        <div className="mt-4 text-lg font-bold text-green-700">Score: {score} / {questions.length}</div>
      )}
      {showRemarks && score !== null && (
        <div className="mt-2 text-base font-semibold text-black">
          {score === questions.length
            ? "Excellent! You got all questions correct."
            : score > questions.length * 0.7
              ? "Great job! You scored well."
              : score > questions.length * 0.4
                ? "Good effort! Review the material for better results."
                : "Keep practicing! Try again for a better score."}
        </div>
      )}
    </div>
  );
};
