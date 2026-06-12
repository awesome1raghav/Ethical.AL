from typing import Dict, Any
from .schemas import ContextConfig

class ContextManager:
    """
    Orchestrates access to various context providers based on user permissions.
    """
    def __init__(self, config: ContextConfig):
        self.config = config

    async def gather_context(self) -> Dict[str, Any]:
        context_data = {}
        
        if self.config.session_memory:
            # Import session handler here to avoid circular imports
            from .session_context import get_session_context
            context_data['session'] = await get_session_context()

        if self.config.uploaded_files:
            from .file_context import get_file_context
            context_data['files'] = await get_file_context()

        if self.config.knowledge_base:
            from .knowledge_context import get_knowledge_context
            context_data['knowledge'] = await get_knowledge_context()

        if self.config.live_internet:
            from .internet_context import get_internet_context
            context_data['internet'] = await get_internet_context()

        if self.config.government_data:
            from .government_context import get_government_context
            context_data['government'] = await get_government_context()

        return context_data
