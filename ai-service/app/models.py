from typing import List, Optional, Dict, Any

try:
    from pydantic import BaseModel, Field

    class TweetItem(BaseModel):
        tweet_id: str
        user_id: str
        text: str
        author: Optional[str] = "@user"
        topic: Optional[str] = "General"
        subtopic: Optional[str] = "General"
        created_at: Optional[str] = ""
        source_type: Optional[str] = "tweet"
        tags: Optional[str] = ""

    class SearchRequest(BaseModel):
        user_id: str = Field(..., description="ID of the user to isolate search results")
        query: str = Field(..., min_length=1, description="Natural language semantic search query")
        topic: Optional[str] = Field(None, description="Optional topic filter")
        limit: Optional[int] = Field(10, ge=1, le=50)

    class SearchResultItem(BaseModel):
        tweet_id: str
        text: str
        author: str
        topic: str
        subtopic: str
        similarity_score: float
        tags: List[str]

    class SearchResponse(BaseModel):
        query: str
        user_id: str
        total_found: int
        results: List[SearchResultItem]

    class RecommendationRequest(BaseModel):
        user_id: str = Field(..., description="User ID for isolation")
        source_tweet_id: Optional[str] = Field(None, description="Base tweet ID to find related recommendations for")
        source_text: Optional[str] = Field(None, description="Direct text to find recommendations for")
        limit: Optional[int] = Field(5, ge=1, le=20)

    class RecommendationItem(BaseModel):
        tweet_id: str
        text: str
        author: str
        topic: str
        similarity_score: float
        explanation: str

    class RecommendationResponse(BaseModel):
        user_id: str
        source_context: str
        recommendations: List[RecommendationItem]

    class ConnectionRequest(BaseModel):
        user_id: str
        tweet_id_1: str
        tweet_id_2: str

    class ConnectionResponse(BaseModel):
        user_id: str
        tweet_1: Dict[str, Any]
        tweet_2: Dict[str, Any]
        relationship_type: str
        confidence: float
        explanation: str
        evidence: List[str]

    class DigestRequest(BaseModel):
        user_id: str
        topic: Optional[str] = None
        period_days: Optional[int] = Field(90, ge=1, le=365)
        max_tweets: Optional[int] = Field(20, ge=2, le=100)

    class DigestResponse(BaseModel):
        user_id: str
        topic: str
        tweet_count: int
        summary: str
        recurring_themes: List[str]
        knowledge_gaps: List[str]
        suggested_explorations: List[str]
        cited_tweet_ids: List[str]

    class HealthResponse(BaseModel):
        status: str
        version: str
        embedding_provider: str
        llm_provider: str
        llm_connected: bool
        total_loaded_tweets: int

except ImportError:
    from dataclasses import dataclass, field

    @dataclass
    class TweetItem:
        tweet_id: str
        user_id: str
        text: str
        author: Optional[str] = "@user"
        topic: Optional[str] = "General"
        subtopic: Optional[str] = "General"
        created_at: Optional[str] = ""
        source_type: Optional[str] = "tweet"
        tags: Optional[str] = ""

    @dataclass
    class SearchRequest:
        user_id: str
        query: str
        topic: Optional[str] = None
        limit: int = 10

    @dataclass
    class SearchResultItem:
        tweet_id: str
        text: str
        author: str
        topic: str
        subtopic: str
        similarity_score: float
        tags: List[str] = field(default_factory=list)

    @dataclass
    class SearchResponse:
        query: str
        user_id: str
        total_found: int
        results: List[SearchResultItem] = field(default_factory=list)

    @dataclass
    class RecommendationRequest:
        user_id: str
        source_tweet_id: Optional[str] = None
        source_text: Optional[str] = None
        limit: int = 5

    @dataclass
    class RecommendationItem:
        tweet_id: str
        text: str
        author: str
        topic: str
        similarity_score: float
        explanation: str

    @dataclass
    class RecommendationResponse:
        user_id: str
        source_context: str
        recommendations: List[RecommendationItem] = field(default_factory=list)

    @dataclass
    class ConnectionRequest:
        user_id: str
        tweet_id_1: str
        tweet_id_2: str

    @dataclass
    class ConnectionResponse:
        user_id: str
        tweet_1: Dict[str, Any]
        tweet_2: Dict[str, Any]
        relationship_type: str
        confidence: float
        explanation: str
        evidence: List[str] = field(default_factory=list)

    @dataclass
    class DigestRequest:
        user_id: str
        topic: Optional[str] = None
        period_days: int = 90
        max_tweets: int = 20

    @dataclass
    class DigestResponse:
        user_id: str
        topic: str
        tweet_count: int
        summary: str
        recurring_themes: List[str] = field(default_factory=list)
        knowledge_gaps: List[str] = field(default_factory=list)
        suggested_explorations: List[str] = field(default_factory=list)
        cited_tweet_ids: List[str] = field(default_factory=list)

    @dataclass
    class HealthResponse:
        status: str
        version: str
        embedding_provider: str
        llm_provider: str
        llm_connected: bool
        total_loaded_tweets: int
