import os, json
from dotenv import load_dotenv
from openai import OpenAI
from supabase import create_client
from langchain.text_splitter import RecursiveCharacterTextSplitter

load_dotenv()

"""Handles the chunking, embedding and creation of data in the Vector Database."""

# Variables
OPENAI_API_KEY=os.getenv("OPENAI_API_KEY")
SUPABASE_URL=os.getenv("SUPABASE_URL")
SUPABASE_API_KEY=os.getenv("SUPABASE_API_KEY")

openai_client = OpenAI(
    api_key=OPENAI_API_KEY
)

supabase_client = create_client(
    supabase_url=SUPABASE_URL,
    supabase_key=SUPABASE_API_KEY
)

data = ""
with open("src/content.json", "r") as f:
    data = json.load(f)


def main(data):
    chunks = text_split(data)
    embeddings = embed(chunks)
    add_vector_to_db(embeddings)

def convert_text(data):
    results = ""
    for item in data:
        string = f"Title: {item['title']}; Release Year: {item['releaseYear']}; Content: {item['content']}"
        results += string
    return results

def text_split(text):
    text = convert_text(text)
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=150,
        chunk_overlap=15
    )
    output = splitter.create_documents([text])
    print("Chunking complete.")
    return output

def embed(chunks):
    embeddings = []
    for chunk in chunks:
        response = openai_client.embeddings.create(
            input=chunk.page_content,
            model='text-embedding-3-small'
        )
        result = {
            "content": chunk.page_content,
            "embedding": response.data[0].embedding
        }
        embeddings.append(result)
    print("Embeddings returned.")
    return embeddings

def add_vector_to_db(embeddings):
    supabase_client.table('movies_two').insert(embeddings).execute()
    print("Vector Database updated.")

main(data)