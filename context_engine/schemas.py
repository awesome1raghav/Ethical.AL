from pydantic import BaseModel, Field

class ContextConfig(BaseModel):
    """
    Schema for the master context object governing AI source access.
    """
    session_memory: bool = Field(default=True, description="Access current conversation context")
    uploaded_files: bool = Field(default=False, description="Access user-provided documents and media")
    knowledge_base: bool = Field(default=True, description="Access stored project intelligence")
    live_internet: bool = Field(default=False, description="Allow real-time web search")
    government_data: bool = Field(default=False, description="Access public APIs and datasets")

class MissionPayload(BaseModel):
    """
    Schema for the final mission launch payload.
    """
    mission: str
    context: ContextConfig
