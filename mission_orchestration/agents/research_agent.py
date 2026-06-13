from __future__ import annotations

import json
import logging
import re
import urllib.parse
import urllib.request
from dataclasses import dataclass
from typing import Any, Dict, List

from ..core.mission_state import AgentResult
from ..storage.audit_store import AuditStore
from ..storage.mission_store import MissionStore
from ._shared import AgentRuntimeContext, BaseMissionAgent


logger = logging.getLogger(__name__)


@dataclass
class SearchResult:
    title: str
    url: str
    snippet: str
    source: str

    def to_dict(self) -> Dict[str, str]:
        return {"title": self.title, "url": self.url, "snippet": self.snippet, "source": self.source}


class ResearchAgent(BaseMissionAgent):
    agent_id = "research_agent"

    def __init__(self, mission_store: MissionStore, audit_store: AuditStore) -> None:
        self.mission_store = mission_store
        self.audit_store = audit_store

    def _execute(self, context: AgentRuntimeContext, set_progress) -> AgentResult:
        print("STEP 1 START")
        query = context.step.name.strip() or context.mission.description.strip()
        set_progress(10)
        print("STEP 2 SEARCH")
        sources: List[SearchResult] = []
        provider_used = "Local Knowledge Base"

        for provider_name, provider in (("Wikipedia", self._search_wikipedia), ("DuckDuckGo", self._search_duckduckgo), ("Local Knowledge Base", self._search_local_knowledge_base)):
            try:
                candidate_sources = provider(query)
                if candidate_sources:
                    sources = candidate_sources
                    provider_used = provider_name
                    break
            except Exception as exc:
                logger.warning("research provider failed: %s", exc)
                self.audit_store.record(context.mission.mission_id, "MISSION_STARTED", f"Research provider failed: {provider_name}", {"provider": provider_name, "error": str(exc)})
            set_progress(min(60, 20 + len(sources) * 5))

        if not sources:
            sources = self._search_local_knowledge_base(query)

        print("STEP 3 SOURCES")
        print("STEP 4 SYNTHESIS")
        summary = self._synthesize(query, sources, context.mission.description)
        print("STEP 5 SAVE")
        set_progress(100)
        print("STEP 6 COMPLETE")
        return AgentResult(
            mission_id=context.mission.mission_id,
            step_id=context.step.index.__str__(),
            agent_id=self.agent_id,
            status="COMPLETED",
            progress=100,
            output={"query": query, "provider": provider_used, "sources": [source.to_dict() for source in sources], "summary": summary},
            message=f"Research completed using {provider_used}",
        )

    def _search_wikipedia(self, query: str) -> List[SearchResult]:
        params = urllib.parse.urlencode({"action": "query", "list": "search", "srsearch": query, "format": "json", "srlimit": 3})
        payload = self._fetch_json(f"https://en.wikipedia.org/w/api.php?{params}")
        results: List[SearchResult] = []
        for item in payload.get("query", {}).get("search", []):
            title = item.get("title", query)
            results.append(SearchResult(title=title, url=f"https://en.wikipedia.org/wiki/{urllib.parse.quote(title.replace(' ', '_'))}", snippet=re.sub(r"<.*?>", "", item.get("snippet", "")), source="Wikipedia"))
        return results

    def _search_duckduckgo(self, query: str) -> List[SearchResult]:
        params = urllib.parse.urlencode({"q": query, "format": "json", "no_redirect": 1, "no_html": 1, "skip_disambig": 1})
        payload = self._fetch_json(f"https://api.duckduckgo.com/?{params}")
        results: List[SearchResult] = []
        abstract = payload.get("AbstractText")
        if abstract:
            results.append(SearchResult(title=payload.get("Heading") or query, url=payload.get("AbstractURL") or "https://duckduckgo.com/", snippet=abstract, source="DuckDuckGo"))
        for item in payload.get("RelatedTopics", [])[:3]:
            if isinstance(item, dict) and item.get("Text"):
                results.append(SearchResult(title=item.get("Text", query)[:80], url=item.get("FirstURL") or "https://duckduckgo.com/", snippet=item.get("Text", ""), source="DuckDuckGo"))
        return results

    def _search_local_knowledge_base(self, query: str) -> List[SearchResult]:
        records = self.mission_store.search_related_text(query, limit=5)
        return [SearchResult(title=record["title"], url=f"mission://{record['id']}", snippet=record["snippet"], source="Local Knowledge Base") for record in records]

    def _synthesize(self, query: str, sources: List[SearchResult], mission_description: str) -> str:
        bullets = [f"- {source.title}: {source.snippet}" for source in sources]
        if bullets:
            return f"Mission query: {query}\nMission context: {mission_description}\nResearch findings:\n" + "\n".join(bullets)
        return f"Mission query: {query}\nNo external sources found."

    def _fetch_json(self, url: str) -> Dict[str, Any]:
        request = urllib.request.Request(url, headers={"User-Agent": "EthicalAI-Mission-Orchestrator/1.0"})
        with urllib.request.urlopen(request, timeout=12) as response:
            return json.loads(response.read().decode("utf-8"))
