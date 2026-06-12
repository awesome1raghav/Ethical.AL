#!/bin/bash
# NEXUS OS Research Agent Startup Script
# Starts the research agent on port 8765

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PYTHON="/opt/homebrew/bin/python3.12"

if [ ! -f "$PYTHON" ]; then
    echo "❌ Python 3.12 not found at $PYTHON"
    echo "   Install with: brew install python@3.12"
    exit 1
fi

echo "🔬 Starting NEXUS Research Agent..."
echo "   Python: $($PYTHON --version)"
echo "   Port: 8765"
echo "   Model: gemma4:e4b via Ollama"
echo "   Search: DuckDuckGo (no API key needed)"
echo ""
echo "   Health check: http://localhost:8765/health"
echo "   API docs:     http://localhost:8765/docs"
echo ""

export RESEARCH_AGENT_PORT=8765
export OLLAMA_MODEL=gemma4:e4b
export OLLAMA_BASE_URL=http://localhost:11434/
export SEARCH_API=duckduckgo
export MAX_WEB_RESEARCH_LOOPS=2

exec "$PYTHON" "$SCRIPT_DIR/server.py"
