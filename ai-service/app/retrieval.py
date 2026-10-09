from typing import List, Optional
from .models import SearchResultItem, SearchResponse
from .data_loader import loader
from .embeddings import engine
from .config import settings

class SemanticRetriever:
    def __init__(self):
        # Fit embedding engine on all initial texts if not already fitted
        if not engine.vocab and loader.tweets:
            corpus = [t.text for t in loader.tweets]
            engine.fit_corpus(corpus)
            engine.save_cache()

    def search(
        self,
        user_id: str,
        query: str,
        topic: Optional[str] = None,
        limit: int = 10
    ) -> SearchResponse:
        user_tweets = loader.get_user_tweets(user_id)
        if not user_tweets:
            return SearchResponse(
                query=query,
                user_id=user_id,
                total_found=0,
                results=[]
            )

        query_vec = engine.encode(query)
        scored_items = []

        for tweet in user_tweets:
            if topic and topic.lower() != "all" and tweet.topic.lower() != topic.lower():
                continue

            tweet_vec = engine.encode(tweet.text)
            sim = engine.cosine_similarity(query_vec, tweet_vec)

            # Accept if non-zero similarity
            if sim > 0.0:
                scored_items.append((sim, tweet))

        scored_items.sort(key=lambda x: x[0], reverse=True)
        top_k = scored_items[:limit]

        results = [
            SearchResultItem(
                tweet_id=tweet.tweet_id,
                text=tweet.text,
                author=tweet.author or "@author",
                topic=tweet.topic or "General",
                subtopic=tweet.subtopic or "General",
                similarity_score=round(sim, 4),
                tags=[t for t in tweet.tags.split(";") if t] if tweet.tags else []
            )
            for sim, tweet in top_k
        ]

        return SearchResponse(
            query=query,
            user_id=user_id,
            total_found=len(results),
            results=results
        )

retriever = SemanticRetriever()
