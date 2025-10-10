import os

from config import OPENAI_API_KEY
from langchain.docstore.document import Document
from langchain.retrievers import EnsembleRetriever
from langchain_community.document_loaders import PyPDFLoader
from langchain_community.retrievers import BM25Retriever
from langchain_core.vectorstores import InMemoryVectorStore
from langchain_openai import OpenAIEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter

# Set the OpenAI API key
os.environ["OPENAI_API_KEY"] = OPENAI_API_KEY

# Global storage for retrievers and documents
current_documents = []
current_retriever = None


def load_pdf_to_docs(file_path):
    """Load a PDF file and convert it to LangChain Documents."""
    loader = PyPDFLoader(file_path)
    return loader.load()


def small2big_chunking(documents, min_chunk_size=200, max_chunk_size=1000):
    """Apply the Small2Big chunking strategy to a list of documents."""
    chunked_docs = []
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=min_chunk_size, chunk_overlap=50
    )

    for doc in documents:
        # Split into small chunks first
        small_chunks = text_splitter.split_text(doc.page_content)
        combined_chunk = ""

        for chunk in small_chunks:
            if len(combined_chunk) + len(chunk) <= max_chunk_size:
                combined_chunk += " " + chunk
            else:
                chunked_docs.append(
                    Document(page_content=combined_chunk.strip(), metadata=doc.metadata)
                )
                combined_chunk = chunk

        # Add the last chunk if it's not empty
        if combined_chunk:
            chunked_docs.append(
                Document(page_content=combined_chunk.strip(), metadata=doc.metadata)
            )

    return chunked_docs


def embed_documents(chunked_documents):
    """Embed documents into the retriever and update the global retriever."""
    global current_documents, current_retriever

    # Append new documents to current_documents
    current_documents.extend(chunked_documents)

    # Initialize retrievers
    bm25_retriever = BM25Retriever.from_documents(current_documents)
    vectorstore = InMemoryVectorStore.from_documents(
        documents=current_documents, embedding=OpenAIEmbeddings()
    )
    vector_retriever = vectorstore.as_retriever()

    # Combine retrievers into an ensemble retriever
    current_retriever = EnsembleRetriever(
        retrievers=[bm25_retriever, vector_retriever], weights=[0.5, 0.5]
    )


def get_retriever():
    """Return the current retriever."""
    if current_retriever is None:
        raise ValueError("Retriever is not initialized. Upload documents first.")
    return current_retriever
