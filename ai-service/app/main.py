from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .models import (
    HealthResponse,
    SearchRequest,
    SearchResponse,
    RecommendationRequest,
    RecommendationResponse,
    ConnectionRequest,
    ConnectionResponse,
    DigestRequest,
    DigestResponse,
    TweetItem,
)
from .data_loader import loader
from .retrieval import retriever
from .recommendations import recommender
from .connections import connection_engine
from .digest import digest_engine
from .llm_client import llm_client

app = FastAPI(
    title="Second Brain Intelligence AI Service",
    description="Semantic Search, RAG Recommendations, Idea Connections, and Topic Digests for Second Brain.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health", response_model=HealthResponse)
def health_check():
    return HealthResponse(
        status="ok",
        version="1.0.0",
        embedding_provider=settings.EMBEDDING_PROVIDER,
        llm_provider=settings.LLM_PROVIDER,
        llm_connected=llm_client.is_connected(),
        total_loaded_tweets=len(loader.tweets),
    )

@app.get("/api/v1/dataset/stats")
def dataset_stats():
    user_counts = {u: len(tws) for u, tws in loader.tweets_by_user.items()}
    topics = list(dict.fromkeys([t.topic for t in loader.tweets]))
    return {
        "total_tweets": len(loader.tweets),
        "total_relationships": len(loader.relationships),
        "total_insight_examples": len(loader.insight_examples),
        "users": user_counts,
        "topics": topics,
    }

@app.post("/api/v1/search", response_model=SearchResponse)
def search_tweets(request: SearchRequest):
    return retriever.search(
        user_id=request.user_id,
        query=request.query,
        topic=request.topic,
        limit=request.limit or 10,
    )

@app.post("/api/v1/recommendations", response_model=RecommendationResponse)
def get_recommendations(request: RecommendationRequest):
    return recommender.get_recommendations(request)

@app.post("/api/v1/connections", response_model=ConnectionResponse)
def get_connections(request: ConnectionRequest):
    return connection_engine.explain_connection(request)

@app.post("/api/v1/digest", response_model=DigestResponse)
def get_digest(request: DigestRequest):
    return digest_engine.generate_digest(request)

@app.post("/api/v1/sync")
def sync_tweet(tweet: TweetItem):
    """Allows Express backend to push newly saved tweets to the user's vector index."""
    loader.add_user_tweet(tweet)
    return {"message": "Tweet indexed successfully", "tweet_id": tweet.tweet_id}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
