export default function QuestionBox({ question, currentIndex, total }) {
  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="font-semibold mb-2">
        Question {currentIndex + 1} of {total}
      </h2>
      <p>{question}</p>
    </div>
  );
}
