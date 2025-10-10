from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import sys
import os

# Add parent directory to path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

from app.services.embeddings import embedding_service
from app.services.vectorstore import VectorStore
from app.services.llm_client import LLMClient
from app.services.mongodb_service import mongodb_service
from app.utils.prompt_builder import build_rag_prompt

router = APIRouter()

class AskRequest(BaseModel):
    question: str
    collection: str = "knowledge_base"
    n_results: int = 5
    conversation_id: Optional[str] = None  # Optional conversation ID for history tracking

class AskResponse(BaseModel):
    question: str
    answer: str
    confidence: str
    contexts: List[Dict[str, Any]]
    total_contexts: int
    suggested_title: str = ""  # LLM-generated title on first question

@router.post("/ask", response_model=AskResponse)
async def ask_question(request: AskRequest) -> AskResponse:
    """Generate an answer using RAG (Retrieval-Augmented Generation)"""
    try:
        # 1. Generate embedding for the question
        question_embedding = embedding_service.embed_text(request.question, input_type="query")
        
        # 2. Retrieve relevant contexts with quality filtering
        vector_store = VectorStore(request.collection)
        results = vector_store.search(
            query_embedding=question_embedding,
            n_results=request.n_results,
            min_similarity=0.3  # Filter out low-quality matches
        )
        
        # Extract contexts
        documents = results.get('documents', [[]])[0]
        metadatas = results.get('metadatas', [[]])[0]
        distances = results.get('distances', [[]])[0]
        
        if not documents:
            raise HTTPException(status_code=404, detail="No relevant documents found")
        
        # 3. Build improved prompt with relevance indicators and metadata
        context_parts = []
        contexts_for_confidence = []
        
        for i, (doc, metadata, distance) in enumerate(zip(documents, metadatas, distances)):
            similarity = 1 - (distance / 2)  # Convert distance to similarity
            
            # Enhanced relevance indicators with similarity scores
            if similarity > 0.8:
                relevance = "🔥 HIGHLY RELEVANT"
                confidence_note = "(Very high match - prioritize this)"
            elif similarity > 0.6:
                relevance = "✓ RELEVANT"
                confidence_note = "(Good match - reliable)"
            elif similarity > 0.4:
                relevance = "○ POSSIBLY RELEVANT"
                confidence_note = "(Moderate match - verify carefully)"
            else:
                relevance = "⚠ LOW RELEVANCE"
                confidence_note = "(Weak match - use cautiously)"
            
            # Sanitize source information - only show filename, not full path
            source_raw = metadata.get('source', 'unknown')
            # Extract filename from path (works for both Windows and Unix paths)
            if source_raw != 'unknown':
                import os
                source = os.path.basename(source_raw)
            else:
                source = 'Document'
            
            page = metadata.get('page', 'N/A')
            chunk_id = metadata.get('chunk_id', 'N/A')
            
            # Build rich context with sanitized metadata (DO NOT expose internal paths)
            context_header = f"[{relevance}] Context #{i+1} {confidence_note}"
            # Only show minimal metadata to LLM - just document name if available
            if page != 'N/A':
                context_meta = f"📄 From: {source} (Page {page})"
            else:
                context_meta = f"📄 From: {source}"
            context_parts.append(
                f"{context_header}\n{context_meta}\n{'-' * 80}\n{doc}\n"
            )
            
            contexts_for_confidence.append({
                "text": doc,
                "distance": distance,
                "source": source,
                "similarity": similarity
            })
        
        context_str = "\n\n".join(context_parts)
        
        prompt = f"""You are a knowledgeable AI assistant that provides accurate, well-structured answers based on document analysis.

═══════════════════════════════════════════════════════════════
📚 RETRIEVED CONTEXTS
═══════════════════════════════════════════════════════════════

{context_str}

═══════════════════════════════════════════════════════════════
❓ USER QUESTION
═══════════════════════════════════════════════════════════════

{request.question}

═══════════════════════════════════════════════════════════════
📋 ANSWER GUIDELINES
═══════════════════════════════════════════════════════════════

**CRITICAL RULES:**
1. ✅ Base your answer STRICTLY on the provided contexts
2. ✅ Prioritize highly relevant contexts (🔥) over others
3. ✅ Synthesize information from multiple contexts when applicable
4. ✅ If contexts partially answer the question, clearly state what IS and ISN'T covered
5. ❌ NEVER fabricate, assume, or add information not present in the contexts
6. ❌ If contexts don't contain relevant information, explicitly state this
7. ❌ DO NOT mention file paths, temp directories, or internal system details in your answer
8. ❌ DO NOT reveal technical metadata like chunk IDs or similarity scores

**ANSWER STRUCTURE:**
- Start with a direct answer to the main question
- Provide supporting details from the contexts
- Use clear, natural language without excessive jargon
- Include specific examples or data points when available
- When citing sources, use natural language (e.g., "Based on the document..." or "According to the provided information...")
- DO NOT mention context numbers, chunk IDs, or technical metadata

**QUALITY STANDARDS:**
- Be concise but comprehensive
- Use proper formatting (bullet points, paragraphs) for readability
- Maintain a professional, helpful tone
- If the question requires clarification, state what assumptions you're making
- Focus on the content, not the source metadata

═══════════════════════════════════════════════════════════════
💡 YOUR ANSWER
═══════════════════════════════════════════════════════════════

"""
        
        # 4. Generate answer using LLM with confidence calculation
        llm_client = LLMClient()
        result = llm_client.generate_answer(prompt, contexts=contexts_for_confidence)
        
        # Format contexts for response with sanitized metadata
        formatted_contexts = []
        for i, (doc, metadata, distance) in enumerate(zip(documents, metadatas, distances)):
            # Sanitize metadata to remove sensitive file paths
            sanitized_metadata = metadata.copy()
            if 'source' in sanitized_metadata:
                import os
                sanitized_metadata['source'] = os.path.basename(sanitized_metadata['source'])
            
            formatted_contexts.append({
                "rank": i + 1,
                "document": doc,
                "metadata": sanitized_metadata,  # Use sanitized metadata
                "similarity": 1 - (distance / 2),
                "distance": distance
            })
        
        # 5. Save to MongoDB if conversation_id is provided
        if request.conversation_id and mongodb_service.is_connected():
            # Check if this is the first question (conversation has no messages yet)
            is_first_question = mongodb_service.get_message_count(request.conversation_id) == 0
            
            # Save user message
            mongodb_service.save_message(
                conversation_id=request.conversation_id,
                role="user",
                content=request.question,
                collection=request.collection,
                metadata={}
            )
            
            # Save assistant response
            mongodb_service.save_message(
                conversation_id=request.conversation_id,
                role="assistant",
                content=result["answer"],
                collection=request.collection,
                metadata={
                    "confidence": result["confidence"],
                    "total_contexts": len(formatted_contexts),
                    "contexts": formatted_contexts[:3]  # Save top 3 contexts
                }
            )
            
            # Generate smart title on first question for better UX
            if is_first_question:
                try:
                    # Use question + answer context to generate a relevant title
                    title_prompt = f"Question: {request.question}\nAnswer: {result['answer'][:500]}"
                    suggested_title = llm_client.generate_title_from_content(
                        content=title_prompt,
                        filename=""
                    )
                    # Update conversation title
                    mongodb_service.update_conversation_title(
                        request.conversation_id,
                        suggested_title
                    )
                    # Add title to response metadata for frontend to update UI
                    result["suggested_title"] = suggested_title
                except Exception as e:
                    print(f"⚠️  Title generation failed: {e}")
                    result["suggested_title"] = ""
        
        return AskResponse(
            question=request.question,
            answer=result["answer"],
            confidence=result["confidence"],
            contexts=formatted_contexts,
            total_contexts=len(formatted_contexts),
            suggested_title=result.get("suggested_title", "")
        )
        
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Answer generation failed: {str(e)}")

@router.post("/ask/stream")
async def ask_question_stream(request: AskRequest):
    """Generate a streaming answer using RAG"""
    try:
        from fastapi.responses import StreamingResponse
        import json
        
        # Get contexts (same as above)
        question_embedding = embedding_service.embed_text(request.question, input_type="query")
        vector_store = VectorStore(request.collection)
        results = vector_store.search(
            query_embedding=question_embedding,
            n_results=request.n_results
        )
        
        documents = results.get('documents', [[]])[0]
        if not documents:
            raise HTTPException(status_code=404, detail="No relevant documents found")
        
        prompt = build_rag_prompt(documents, request.question)
        llm_client = LLMClient()
        
        def generate():
            # First, send the contexts
            yield f"data: {json.dumps({'type': 'contexts', 'data': documents})}\n\n"
            
            # Then stream the answer
            for chunk in llm_client.generate_answer_stream(prompt):
                yield f"data: {json.dumps({'type': 'answer', 'data': chunk})}\n\n"
            
            # Signal end
            yield f"data: {json.dumps({'type': 'end'})}\n\n"
        
        return StreamingResponse(generate(), media_type="text/plain")
        
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Streaming answer failed: {str(e)}")