import os

from config import OPENAI_API_KEY
from langchain.output_parsers import PydanticToolsParser
from langchain.retrievers import EnsembleRetriever
from langchain_community.retrievers import BM25Retriever
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.pydantic_v1 import BaseModel, Field
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from sklearn.metrics.pairwise import cosine_similarity

# Set the OpenAI API key
os.environ["OPENAI_API_KEY"] = OPENAI_API_KEY


class ParaphrasedQuery(BaseModel):
    """Paraphrased queries for query expansion."""

    paraphrased_query: str = Field(
        ..., description="A unique paraphrasing of the original question."
    )


# Define the prompt for query expansion
system_prompt = """
You are an expert in query paraphrasing and expansion. 

Your task is to generate multiple different phrasings of the same user query. 
Ensure that each paraphrased query captures the original meaning while using different wording.

If there are multiple common ways to phrase the question, or common synonyms for key terms, ensure all are included.

You **must** return at least 3 distinct paraphrased versions of the input query.
"""

prompt = ChatPromptTemplate.from_messages(
    [
        ("system", system_prompt),
        ("human", "{question}"),
    ]
)

llm = ChatOpenAI(model="gpt-3.5-turbo", temperature=0)
llm_with_tools = llm.bind_tools([ParaphrasedQuery])
query_analyzer = prompt | llm_with_tools | PydanticToolsParser(tools=[ParaphrasedQuery])


def expand_query(query):
    """
    Generate multiple semantically similar queries using an LLM.
    """
    try:
        response = query_analyzer.invoke({"question": query})
        expanded_queries = [
            q.paraphrased_query for q in response if isinstance(q, ParaphrasedQuery)
        ]
        if len(expanded_queries) < 3:
            print(
                "Warning: Less than 3 paraphrased queries returned. Consider adjusting the prompt."
            )
        return expanded_queries
    except Exception as e:
        print(f"Error during query expansion: {e}")
        return []


def multi_query_retrieval(expanded_queries, retriever, top_k=5):
    """Perform retrieval using multiple queries and combine results."""
    combined_results = []
    for query in expanded_queries:
        results = retriever.get_relevant_documents(query)[:top_k]
        combined_results.extend(results)

    # Deduplicate results based on document content
    unique_docs = {doc.page_content: doc for doc in combined_results}
    return list(unique_docs.values())


def rank_with_cove(query, retrieved_docs, embeddings, top_k=5):
    """Rank retrieved documents using embeddings."""
    query_embedding = embeddings.embed_query(query)
    doc_contents = [doc.page_content for doc in retrieved_docs]
    doc_embeddings = embeddings.embed_documents(doc_contents)

    # Compute cosine similarity and rank documents
    similarities = cosine_similarity([query_embedding], doc_embeddings)[0]
    ranked_indices = sorted(
        range(len(similarities)), key=lambda i: similarities[i], reverse=True
    )
    return [retrieved_docs[i] for i in ranked_indices[:top_k]]


def optimized_rag_chain(query, retriever, llm, embeddings, top_k=5):
    """
    Perform retrieval-augmented generation with query optimization.
    """

    print(f"Optimized RAG chain for query: {query}")
    # Step 1: Expand the query using the LLM
    expanded_queries = expand_query(query)

    # Step 2: Retrieve documents using expanded queries
    retrieved_docs = multi_query_retrieval(expanded_queries, retriever, top_k)

    # Step 3: Rank documents using CoVe
    ranked_docs = rank_with_cove(query, retrieved_docs, embeddings, top_k)

    # Step 4: Combine the retrieved documents into a single context
    context = "\n\n".join([doc.page_content for doc in ranked_docs])

    # Step 5: Define the system prompt with the context
    system_prompt = (
        "You are an assistant for question-answering tasks. "
        "Use the following pieces of retrieved context to answer "
        "the question. If you don't know the answer, say that you "
        "don't know.\n\n"
        f"{context}\n\n"
        f"Question: {query}"
    )

    print("=== System Prompt Sent to LLM ===")
    print(system_prompt)

    # Step 6: Get the answer from the LLM
    response = llm(system_prompt)  # Assuming `llm` accepts plain string input

    # Use `pretty_repr()` if available, otherwise convert to string
    if hasattr(response, "pretty_repr"):
        response_text = response.pretty_repr()
    elif hasattr(response, "content"):
        response_text = response.content  # Some LLMs return a content attribute
    else:
        response_text = str(response)  # Fallback to string representation

    return {"query": query, "response": response_text, "retrieved_docs": ranked_docs}
