from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from app.services.llm_client import LLMClient
from app.services.vectorstore import VectorStore
from app.services.mongodb_service import mongodb_service
import re
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

class GenerateQuizRequest(BaseModel):
    collection: Optional[str] = "knowledge_base"
    n_questions: int = 10
    conversation_id: Optional[str] = None


class QuizOption(BaseModel):
    text: str

class QuizQuestion(BaseModel):
    question: str
    options: List[QuizOption]
    answer: int  # index of correct option

class GenerateQuizResponse(BaseModel):
    questions: List[QuizQuestion]

class EvaluateQuizRequest(BaseModel):
    questions: List[QuizQuestion]
    user_answers: List[int]

class EvaluateQuizResponse(BaseModel):
    score: int
    total: int
    results: List[bool]


@router.post("/generate-quiz", response_model=GenerateQuizResponse)
async def generate_quiz(request: GenerateQuizRequest) -> GenerateQuizResponse:
    """Generate a proper MCQ quiz based on the knowledge base content."""
    vector_store = VectorStore(request.collection)
    all_docs = vector_store.get_all_documents()
    if not all_docs:
        raise HTTPException(status_code=404, detail="No documents found in knowledge base")
    full_text = "\n\n".join([doc.get("text", "") for doc in all_docs])[:16000]
    llm = LLMClient()
    prompt = (
        f"Create a quiz with exactly {request.n_questions} multiple-choice questions (MCQs) based on the following knowledge base. "
        "Each question should be concise, clear, and focused on key facts or concepts. "
        "For each question, provide 4 well-phrased options (A, B, C, D) and indicate the correct answer by its index (0-based). "
        "Format output as a JSON array: "
        "[{question: string, options: [string, string, string, string], answer: int}]\n\n"
        "Make sure questions and options are easy to read and not verbose. Avoid ambiguous wording."
        f"\n\nContent:\n{full_text}\n\nQuiz:"
    )
    quiz_json = llm.generate_links(prompt)
    # Remove markdown code block markers if present
    if quiz_json.strip().startswith('```'):
        quiz_json = re.sub(r'^```[a-zA-Z]*\n?', '', quiz_json.strip())
        quiz_json = re.sub(r'```$', '', quiz_json.strip())
    try:
        import json
        questions_data = json.loads(quiz_json)
        questions = [QuizQuestion(
            question=q["question"],
            options=[QuizOption(text=opt) for opt in q["options"]],
            answer=q["answer"]
        ) for q in questions_data]
    except Exception as e:
        logger.error(f"Failed to parse quiz JSON: {e}\nRaw output: {quiz_json}")
        raise HTTPException(status_code=500, detail="Failed to generate quiz. Please try again.")
    questions = questions[:request.n_questions]
    if not questions:
        logger.warning("No quiz questions could be parsed from LLM output")
        raise HTTPException(
            status_code=500,
            detail="Failed to generate quiz questions. Please try again."
        )
    return GenerateQuizResponse(questions=questions)


@router.post("/evaluate-quiz", response_model=EvaluateQuizResponse)
async def evaluate_quiz(request: EvaluateQuizRequest) -> EvaluateQuizResponse:
    """Evaluate submitted answers for a quiz."""
    results = []
    score = 0
    for q, user_ans in zip(request.questions, request.user_answers):
        correct = (user_ans == q.answer)
        results.append(correct)
        if correct:
            score += 1
    return EvaluateQuizResponse(score=score, total=len(request.questions), results=results)
