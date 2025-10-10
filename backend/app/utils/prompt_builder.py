def build_rag_prompt(contexts, question):
    """
    Build a prompt for RAG answer generation.
    contexts: list of retrieved document chunks
    question: user question
    """
    context_str = "\n---\n".join(contexts)
    prompt = f"""
You are a helpful expert. Use the following context to answer the question concisely and accurately.

Context:
{context_str}

Question: {question}
Answer:
"""
    return prompt
