import os

from config import OPENAI_API_KEY
from fastapi import FastAPI, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from services.document_service import get_retriever  # Ensure retriever is available
from services.document_service import (
    embed_documents,
    load_pdf_to_docs,
    small2big_chunking,
)
from services.query_service import expand_query, llm, optimized_rag_chain

os.environ["OPENAI_API_KEY"] = OPENAI_API_KEY
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "*"
    ],  # Update this to restrict to specific origins, e.g., ["http://localhost:3000"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/upload/")
async def upload_document(file: UploadFile):
    """
    Upload a PDF document, process it, and embed it in the retriever.
    """
    file_path = f"documents/{file.filename}"
    with open(file_path, "wb") as f:
        f.write(await file.read())

    # Load, chunk, and embed the document
    docs = load_pdf_to_docs(file_path)
    chunked_docs = small2big_chunking(docs)
    embed_documents(chunked_docs)

    return JSONResponse(
        {"message": "Document uploaded and retriever updated successfully."}
    )


@app.post("/query/")
async def query_rag(query: str = Form(...)):
    """
    Query the RAG system and get a response.
    """
    try:
        print(f"Received query: {query}")
        retriever = get_retriever()  # Retrieve the current retriever
        # retriever = None
        llm = ChatOpenAI(model="gpt-4o")
        embeddings = OpenAIEmbeddings()
        result = optimized_rag_chain(query, retriever, llm, embeddings, top_k=5)

        # Serialize retrieved documents
        serialized_docs = [
            {"content": doc.page_content, "metadata": doc.metadata}
            for doc in result["retrieved_docs"]
        ]

        # Return the query, LLM response (via `pretty_repr`), and retrieved documents
        return JSONResponse(
            {
                "query": result["query"],
                "response": result[
                    "response"
                ],  # Already serialized in optimized_rag_chain
                "retrieved_docs": serialized_docs,
            }
        )

    except Exception as e:
        return JSONResponse(
            {"error": f"An error occurred while processing the query: {str(e)}"},
            status_code=500,
        )
