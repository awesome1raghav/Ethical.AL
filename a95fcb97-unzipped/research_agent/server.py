"""
Research Agent HTTP Server
Wraps the ollama-deep-researcher LangGraph pipeline as a REST API.
NEXUS OS calls POST /research with a topic and receives a research summary.
"""

import sys
import os

# Ensure the src directory is on the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "src"))

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import asyncio

from assistant.graph import graph
from assistant.configuration import Configuration

app = FastAPI(
    title="NEXUS Research Agent",
    description="Autonomous deep web research agent powered by Ollama + DuckDuckGo",
    version="1.0.0"
)

# Allow NEXUS OS Next.js frontend to call this
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ResearchRequest(BaseModel):
    topic: str
    max_loops: int = 2  # Keep fast: 2 search loops default
    ollama_model: str = "gemma4:e4b"
    ollama_base_url: str = "http://localhost:11434/"

class ResearchResponse(BaseModel):
    topic: str
    summary: str
    status: str = "completed"

@app.get("/health")
def health_check():
    return {"status": "ok", "agent": "research_agent", "model": "gemma4:e4b"}

@app.post("/research", response_model=ResearchResponse)
async def run_research(req: ResearchRequest):
    """
    Run deep web research on a topic.
    Returns a markdown-formatted summary with sources.
    """
    try:
        # Build LangGraph config  
        config = {
            "configurable": {
                "local_llm": req.ollama_model,
                "ollama_base_url": req.ollama_base_url,
                "search_api": "duckduckgo",
                "max_web_research_loops": req.max_loops,
                "fetch_full_page": False,
            }
        }

        # Run in executor to avoid blocking the event loop
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            None,
            lambda: graph.invoke({"research_topic": req.topic}, config=config)
        )

        summary = result.get("running_summary", "No summary generated.")
        return ResearchResponse(topic=req.topic, summary=summary, status="completed")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Research agent error: {str(e)}")

if __name__ == "__main__":
    port = int(os.environ.get("RESEARCH_AGENT_PORT", "8765"))
    print(f"[NEXUS Research Agent] Starting on http://localhost:{port}")
    print(f"[NEXUS Research Agent] Using Ollama model: gemma4:e4b")
    print(f"[NEXUS Research Agent] Search engine: DuckDuckGo (no API key needed)")
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")
