import os
import logging
from typing import List, Dict, Any
from google import genai
from openai import OpenAI
from app.config import settings

logger = logging.getLogger(__name__)

class LLMClient:
    def generate_links(self, prompt: str) -> str:
        """Generate study links using LLM (Gemini or other)."""
        try:
            response = self.gemini_client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt
            )
            return response.text.strip()
        except Exception as e:
            logger.error(f"Failed to generate study links: {str(e)}")
            return ""
    def summarize(self, text: str) -> str:
        """
        Summarize a document using Gemini LLM.
        """
        system_message = (
            "You are an expert AI assistant. Summarize the following document in clear, concise language. Use bullet points for key ideas if appropriate. Do not add information that is not present in the document."
        )
        prompt = (
            "You are a study assistant. Read the following knowledge base content and provide a detailed, comprehensive summary of the entire knowledge base. "
            "Do not limit your summary to the top search results; instead, synthesize information from all available documents. "
            "Highlight key topics, important details, and overall themes.\n\n"
            f"{text}\n\nSummary:"
        )
        try:
            response = self.gemini_client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt
            )
            summary = response.text.strip()
            logger.info("Generated summary for document.")
            return summary
        except Exception as e:
            logger.error(f"Document summarization failed: {str(e)}")
            return "Summary could not be generated."
    def generate_title_from_context(self, context: str, filename: str = "") -> str:
        """
        Generate a concise 2-3 word title describing the document context using Gemini.
        """
        system_message = (
            "You are an expert at creating concise, descriptive titles. Always respond with ONLY the title, nothing else."
        )
        prompt = f"System: {system_message}\n\nBased on the following document content, generate a concise 2-3 word title that describes what this document is about.\n\nDocument content:\n{context[:1500]}...\n\nOriginal filename: {filename}\n\nRequirements:\n- MUST be 2-3 words maximum\n- Be descriptive and specific\n- Use title case\n- No special characters or punctuation\n- Examples: 'Python Tutorial', 'Tax Guide 2024', 'Research Paper'\n\nTitle:"
        try:
            response = self.gemini_client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt
            )
            title = response.text.strip().strip('"\'')
            words = title.split()
            if len(words) > 4:
                title = ' '.join(words[:3])
            logger.info(f"Generated title: '{title}' for file: {filename}")
            return title
        except Exception as e:
            logger.error(f"Title generation failed: {str(e)}")
            fallback = filename.replace('.pdf', '').replace('.docx', '').replace('_', ' ')
            return ' '.join(fallback.split()[:3]).title()
    def __init__(self):
        self.provider = os.getenv("LLM_PROVIDER", "gemini").lower()
        # Only Gemini is supported
        self.gemini_client = genai.Client()
    logger.info("Initialized LLM client with Gemini API (google-genai)")
    
    def calculate_confidence(self, contexts: List[Dict], answer: str) -> str:
        """
        Calculate confidence score based on retrieval quality and answer characteristics
        
        Args:
            contexts: List of retrieved context chunks with metadata
            answer: Generated answer text
            
        Returns:
            Confidence level: "High", "Medium", or "Low"
        """
        if not contexts:
            return "Low"
        
        # Extract relevance scores (distances from ChromaDB)
        distances = [ctx.get("distance", 1.0) for ctx in contexts]
        avg_distance = sum(distances) / len(distances) if distances else 1.0
        
        # ChromaDB uses cosine distance (0 = identical, 2 = opposite)
        # Convert to similarity score (0-1 range)
        avg_similarity = 1 - (avg_distance / 2)
        
        # Factor 1: Average similarity score (0-1)
        similarity_score = avg_similarity
        
        # Factor 2: Number of relevant contexts (more = better)
        num_contexts = len(contexts)
        context_score = min(num_contexts / 5, 1.0)  # Normalize to 0-1, cap at 5 contexts
        
        # Factor 3: Answer length (too short might indicate uncertainty)
        answer_length_score = min(len(answer.split()) / 50, 1.0)  # Normalize, cap at 50 words
        
        # Factor 4: Presence of uncertainty phrases
        uncertainty_phrases = ["i'm not sure", "i don't know", "unclear", "uncertain", 
                              "might be", "possibly", "perhaps", "i cannot find", "no information"]
        has_uncertainty = any(phrase in answer.lower() for phrase in uncertainty_phrases)
        uncertainty_penalty = 0.3 if has_uncertainty else 0
        
        # Weighted confidence score (0-1)
        confidence_score = (
            similarity_score * 0.5 +      # 50% weight on retrieval quality
            context_score * 0.3 +          # 30% weight on number of contexts
            answer_length_score * 0.2      # 20% weight on answer completeness
        ) - uncertainty_penalty
        
        # Map to confidence levels
        if confidence_score >= 0.7:
            return "High"
        elif confidence_score >= 0.4:
            return "Medium"
        else:
            return "Low"

    def generate_answer(self, prompt: str, contexts: List[Dict] = None) -> Dict[str, Any]:
        """
        Generate answer with improved prompting and confidence scoring
        
        Args:
            prompt: The prompt to send to the LLM
            contexts: Optional list of context chunks for confidence calculation
            
        Returns:
            Dictionary with answer and confidence information
        """
        try:
            # Use google-genai SDK for Gemini
            # If contexts are provided, prepend them to the prompt
            system_message = (
                "You are an expert AI assistant specializing in document analysis and knowledge retrieval. "
                "Your core strengths are: Accuracy, Clarity, Transparency, Synthesis, and Citation. "
                "Always answer based on the provided context. If the answer is not in the context, say so."
            )
            if contexts and len(contexts) > 0:
                context_text = "\n\n".join([ctx.get("text", "") for ctx in contexts])
                full_prompt = f"System: {system_message}\n\nContext:\n{context_text}\n\nQuestion: {prompt}"
            else:
                full_prompt = f"System: {system_message}\n\nQuestion: {prompt}"
            try:
                response = self.gemini_client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=full_prompt
                )
                full_response = response.text
            except Exception as e:
                logger.error(f"Gemini API call failed: {str(e)}")
                raise
            confidence = "Medium"
            if contexts:
                confidence = self.calculate_confidence(contexts, full_response)
            logger.info(f"Generated answer with {confidence} confidence (Gemini)")
            return {
                "answer": full_response,
                "confidence": confidence
            }
        except Exception as e:
            logger.error(f"Answer generation failed: {str(e)}")
            raise
    
    # Streaming not supported for Gemini in this implementation
    
    # Title generation for Gemini can be implemented here if needed
