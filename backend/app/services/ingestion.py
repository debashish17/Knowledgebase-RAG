import PyPDF2
import docx
from langchain_text_splitters import RecursiveCharacterTextSplitter
from typing import List, Dict, Any, Optional
import logging
import re
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from app.config import settings

logger = logging.getLogger(__name__)


class EnhancedIngestionService:
    """Enhanced service for document ingestion with improved chunking and preprocessing."""
    
    def __init__(self):
        # Multi-level chunking strategy
        self.semantic_splitter = RecursiveCharacterTextSplitter(
            chunk_size=800,  # Larger chunks for better context
            chunk_overlap=200,  # More overlap for continuity
            separators=["\n\n\n", "\n\n", "\n", ". ", " ", ""]
        )
        
        self.detailed_splitter = RecursiveCharacterTextSplitter(
            chunk_size=400,  # Smaller chunks for specific facts
            chunk_overlap=100,
            separators=["\n\n", "\n", ". ", " ", ""]
        )
    
    def preprocess_text(self, text: str) -> str:
        """Clean and preprocess text for better quality."""
        # Remove excessive whitespace
        text = re.sub(r'\s+', ' ', text)
        
        # Remove page numbers and headers/footers patterns
        text = re.sub(r'\n\s*\d+\s*\n', '\n', text)
        text = re.sub(r'\n\s*Page \d+.*?\n', '\n', text, flags=re.IGNORECASE)
        
        # Fix common OCR errors
        text = re.sub(r'([a-z])([A-Z])', r'\1 \2', text)  # Add space between camelCase
        text = re.sub(r'([.!?])([A-Z])', r'\1 \2', text)  # Add space after punctuation
        
        # Normalize quotes and dashes
        text = re.sub(r'[""]', '"', text)
        text = re.sub(r'[''`]', "'", text)
        text = re.sub(r'[—–]', '-', text)
        
        return text.strip()
    
    def extract_metadata_from_chunk(self, chunk: str, doc_path: str, chunk_index: int) -> Dict[str, Any]:
        """Extract enhanced metadata from chunks."""
        metadata = {
            "source": doc_path,
            "chunk_index": chunk_index,
            "char_count": len(chunk),
            "word_count": len(chunk.split()),
        }
        
        # Extract potential section headers
        lines = chunk.split('\n')
        for line in lines[:3]:  # Check first 3 lines
            if len(line) < 100 and len(line.split()) <= 10:
                if any(keyword in line.lower() for keyword in ['chapter', 'section', 'introduction', 'conclusion']):
                    metadata["section"] = line.strip()
                    break
        
        # Check for bullet points or numbered lists
        if re.search(r'^\s*[•\-\*]\s+', chunk, re.MULTILINE):
            metadata["content_type"] = "list"
        elif re.search(r'^\s*\d+\.?\s+', chunk, re.MULTILINE):
            metadata["content_type"] = "numbered_list"
        elif any(keyword in chunk.lower() for keyword in ['definition', 'define', 'means', 'refers to']):
            metadata["content_type"] = "definition"
        else:
            metadata["content_type"] = "paragraph"
        
        return metadata
    
    def create_hybrid_chunks(self, text: str, doc_path: str) -> List[Dict[str, Any]]:
        """Create both semantic and detailed chunks for comprehensive coverage."""
        preprocessed_text = self.preprocess_text(text)
        
        # Create semantic chunks (larger, contextual)
        semantic_chunks = self.semantic_splitter.split_text(preprocessed_text)
        detailed_chunks = self.detailed_splitter.split_text(preprocessed_text)
        
        all_chunks = []
        
        # Add semantic chunks
        for i, chunk in enumerate(semantic_chunks):
            if len(chunk.strip()) > 50:  # Skip very short chunks
                metadata = self.extract_metadata_from_chunk(chunk, doc_path, i)
                metadata["chunk_type"] = "semantic"
                metadata["relevance_boost"] = 1.2  # Boost for larger context chunks
                
                all_chunks.append({
                    "text": chunk.strip(),
                    "metadata": metadata
                })
        
        # Add detailed chunks for specific information
        for i, chunk in enumerate(detailed_chunks):
            if len(chunk.strip()) > 30:
                metadata = self.extract_metadata_from_chunk(chunk, doc_path, i + len(semantic_chunks))
                metadata["chunk_type"] = "detailed"
                metadata["relevance_boost"] = 1.0
                
                all_chunks.append({
                    "text": chunk.strip(),
                    "metadata": metadata
                })
        
        logger.info(f"Created {len(all_chunks)} chunks ({len(semantic_chunks)} semantic, {len(detailed_chunks)} detailed)")
        return all_chunks
    
    def extract_text_from_pdf(self, file_path: str) -> str:
        """Extract text content from a PDF file with better processing."""
        try:
            text = ""
            with open(file_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                
                for page_num in range(len(pdf_reader.pages)):
                    page = pdf_reader.pages[page_num]
                    page_text = page.extract_text()
                    
                    # Add page separator
                    if page_text.strip():
                        text += f"\n--- Page {page_num + 1} ---\n{page_text}\n"
            
            logger.info(f"Extracted {len(text)} characters from PDF: {file_path}")
            return text
            
        except Exception as e:
            logger.error(f"Failed to extract text from PDF {file_path}: {e}")
            raise
    
    def process_document(self, file_path: str) -> List[Dict[str, Any]]:
        """Process a document and return enhanced chunks."""
        if file_path.endswith('.pdf'):
            text = self.extract_text_from_pdf(file_path)
        elif file_path.endswith('.txt') or file_path.endswith('.md'):
            with open(file_path, 'r', encoding='utf-8') as f:
                text = f.read()
        elif file_path.endswith('.docx'):
            doc = docx.Document(file_path)
            text = "\n".join(p.text for p in doc.paragraphs if p.text.strip())
        else:
            raise ValueError(f"Unsupported file type: {file_path}")
        
        return self.create_hybrid_chunks(text, file_path)
        

# Global instance for import
ingestion_service = EnhancedIngestionService()