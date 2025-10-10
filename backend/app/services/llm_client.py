import os
import logging
from typing import List, Dict, Any
from openai import OpenAI
from app.config import settings

logger = logging.getLogger(__name__)

class LLMClient:
    def __init__(self):
        # Use NVIDIA LLM API key from settings
        api_key = settings.NVIDIA_LLM_API_KEY
        if not api_key:
            raise ValueError("NVIDIA_LLM_API_KEY not found in settings. Please set it in .env file")
            
        self.client = OpenAI(
            base_url="https://integrate.api.nvidia.com/v1",
            api_key=api_key
        )
        # Use the correct NVIDIA Mistral model
        self.model = settings.NVIDIA_LLM_MODEL
        logger.info(f"✅ Initialized LLM client with model: {self.model}")
    
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
            # Enhanced system message for better behavior
            system_message = """You are an expert AI assistant specializing in document analysis and knowledge retrieval. Your core strengths are:

1. **Accuracy**: You provide information strictly based on provided contexts without hallucination
2. **Clarity**: You structure answers in clear, digestible formats with proper organization
3. **Transparency**: You explicitly state when information is insufficient or unavailable
4. **Synthesis**: You combine information from multiple sources to provide comprehensive answers
5. **Citation**: You reference source contexts when making specific claims

Your goal is to help users understand their documents by providing accurate, well-reasoned, and well-structured answers."""

            completion = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_message},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,  # Lower temperature for more factual answers
                top_p=0.9,
                max_tokens=1024,
                stream=True
            )
            
            # Collect the streamed response
            full_response = ""
            for chunk in completion:
                if chunk.choices[0].delta.content is not None:
                    full_response += chunk.choices[0].delta.content
            
            # Calculate confidence if contexts provided
            confidence = "Medium"
            if contexts:
                confidence = self.calculate_confidence(contexts, full_response)
            
            logger.info(f"✅ Generated answer with {confidence} confidence")
            
            return {
                "answer": full_response,
                "confidence": confidence
            }
            
        except Exception as e:
            logger.error(f"❌ Answer generation failed: {str(e)}")
            raise
    
    def generate_answer_stream(self, prompt):
        """Alternative method for streaming responses directly"""
        completion = self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
            top_p=0.7,
            max_tokens=1024,
            stream=True
        )
        
        for chunk in completion:
            if chunk.choices[0].delta.content is not None:
                yield chunk.choices[0].delta.content
    
    def generate_title_from_content(self, content: str, filename: str = "") -> str:
        """
        Generate a concise 2-3 word title describing document content
        
        Args:
            content: Sample text from the document (first few chunks)
            filename: Original filename for context
            
        Returns:
            Short descriptive title (2-3 words)
        """
        try:
            # Create a prompt for title generation
            prompt = f"""Based on the following document content, generate a concise 2-3 word title that describes what this document is about.

Document content:
{content[:1500]}...

Original filename: {filename}

Requirements:
- MUST be 2-3 words maximum
- Be descriptive and specific
- Use title case
- No special characters or punctuation
- Examples: "Python Tutorial", "Tax Guide 2024", "Research Paper"

Title:"""

            completion = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are an expert at creating concise, descriptive titles. Always respond with ONLY the title, nothing else."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=20,  # Keep it short
                stream=False
            )
            
            title = completion.choices[0].message.content.strip()
            
            # Clean up the title (remove quotes, extra spaces)
            title = title.strip('"\'').strip()
            
            # Ensure it's not too long (safety check)
            words = title.split()
            if len(words) > 4:
                title = ' '.join(words[:3])
            
            logger.info(f"✅ Generated title: '{title}' for file: {filename}")
            return title
            
        except Exception as e:
            logger.error(f"❌ Title generation failed: {str(e)}")
            # Fallback to filename-based title
            fallback = filename.replace('.pdf', '').replace('.docx', '').replace('_', ' ')
            return ' '.join(fallback.split()[:3]).title()
