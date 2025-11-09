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

class StudyLinksRequest(BaseModel):
    collection: Optional[str] = "knowledge_base"
    n_links: int = 5
    conversation_id: Optional[str] = None

class StudyLinksResponse(BaseModel):
    links: List[str]

def parse_study_links(links_text: str) -> List[str]:
    """
    Robustly parse study links from LLM output.
    Handles multiple formats and prevents duplicates.
    """
    logger.info(f"Raw LLM output:\n{links_text}")
    
    links = []
    seen_urls = set()
    
    # Clean up the text - remove markdown code blocks if present
    cleaned = links_text.strip()
    cleaned = re.sub(r'^```.*?\n', '', cleaned)
    cleaned = re.sub(r'\n```$', '', cleaned)
    
    # Strategy 1: Extract numbered list items with URLs and descriptions
    # Matches: "1. **Title** URL: `https://...` Note: description"
    pattern1 = r'\d+\.\s*(?:\*\*[^*]+\*\*)?\s*(?:URL:\s*)?`?(https?://[^\s`]+)`?\s*(?:-|–|:|Note:)?\s*([^\n]+)?'
    matches1 = re.findall(pattern1, cleaned, re.IGNORECASE)
    
    for url, note in matches1:
        url = url.strip('`').strip()
        note = note.strip() if note else ''
        # Clean up note - remove trailing asterisks, extra whitespace
        note = re.sub(r'\*+$', '', note).strip()
        
        if url not in seen_urls:
            seen_urls.add(url)
            link_str = f"{url} - {note}" if note else url
            links.append(link_str)
            logger.info(f"Extracted (pattern1): {link_str}")
    
    # Strategy 2: Simple numbered format "1. https://... - description"
    if not links:
        pattern2 = r'\d+\.\s*(https?://[^\s]+)\s*(?:-|–)?\s*([^\n]+)?'
        matches2 = re.findall(pattern2, cleaned)
        
        for url, note in matches2:
            url = url.strip()
            note = note.strip() if note else ''
            
            if url not in seen_urls:
                seen_urls.add(url)
                link_str = f"{url} - {note}" if note else url
                links.append(link_str)
                logger.info(f"Extracted (pattern2): {link_str}")
    
    # Strategy 3: Find any URLs followed by text on the same or next line
    if not links:
        pattern3 = r'(https?://[^\s]+)(?:\s*[-–:]\s*)?([^\n]+)?'
        matches3 = re.findall(pattern3, cleaned)
        
        for url, note in matches3:
            url = url.strip()
            note = note.strip() if note else ''
            # Skip if note looks like it's part of another URL
            if 'http' in note.lower():
                note = ''
            
            if url not in seen_urls and len(url) > 10:  # Basic URL validation
                seen_urls.add(url)
                link_str = f"{url} - {note}" if note else url
                links.append(link_str)
                logger.info(f"Extracted (pattern3): {link_str}")
    
    # Final cleanup: remove empty or duplicate entries
    final_links = []
    seen_final = set()
    for link in links:
        if link and link.strip() and link not in seen_final:
            seen_final.add(link)
            final_links.append(link.strip())
    
    logger.info(f"Final parsed links count: {len(final_links)}")
    return final_links


@router.post("/study-links", response_model=StudyLinksResponse)
async def get_study_links(request: StudyLinksRequest) -> StudyLinksResponse:
    """Return study links related to the uploaded context for further study."""
    vector_store = VectorStore(request.collection)
    all_docs = vector_store.get_all_documents()
    
    if not all_docs:
        raise HTTPException(status_code=404, detail="No documents found in knowledge base")
    
    # Concatenate all document texts (truncate if too long)
    full_text = "\n\n".join([doc.get("text", "") for doc in all_docs])[:16000]
    
    llm = LLMClient()
    
    # Improved prompt for more consistent formatting
    prompt = (
        "Based on the following knowledge base content, suggest exactly 5 high-quality, "
        "relevant web links that help users study further.\n\n"
        "Format each link exactly as:\n"
        "1. https://example.com - Brief description of what this resource offers\n"
        "2. https://example.com - Brief description of what this resource offers\n\n"
        "Make sure each link is educational, authoritative, and directly related to the topics below.\n\n"
        f"Content:\n{full_text}\n\n"
        "Links:"
    )
    
    links_text = llm.generate_links(prompt)
    
    # Parse the links
    links = parse_study_links(links_text)

    # Limit to requested number of links (even if empty)
    links = links[:request.n_links]


    metadata = {"type": "Links"}
    # Use provided conversation_id or create a new one
    conversation_id = request.conversation_id
    if not conversation_id:
        # Try to find an existing conversation for this collection
        conv = mongodb_service.conversations.find_one({"collection": request.collection})
        if conv:
            conversation_id = str(conv["_id"])
        else:
            conversation_id = mongodb_service.create_conversation(request.collection, title=f"Summary for {request.collection}")
    mongodb_service.save_message(
        conversation_id=conversation_id,
        role="assistant",
        content="\n".join(links),
        collection=request.collection,
        metadata=metadata
    )

    # Save the generated links as a chat message in MongoDB if conversation_id is provided
    

    # If no links were parsed, return an error message
    if not links:
        logger.warning("No links could be parsed from LLM output")
        raise HTTPException(
            status_code=500, 
            detail="Failed to generate study links. Please try again."
        )

    return StudyLinksResponse(links=links)