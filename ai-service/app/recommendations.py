from typing import List, Optional
from .models import RecommendationRequest, RecommendationResponse, RecommendationItem
from .data_loader import loader
from .embeddings import engine
from .llm_client import llm_client
from .config import settings

class RecommendationEngine:
    def get_recommendations(self, request: RecommendationRequest) -> RecommendationResponse:
        user_tweets = loader.get_user_tweets(request.user_id)
        if not user_tweets:
            return RecommendationResponse(
                user_id=request.user_id,
                source_context="No tweets found for user",
                recommendations=[]
            )

        # Determine source context and target tweet ID
        source_tweet = None
        source_text = request.source_text or ""
        source_id = request.source_tweet_id

        if source_id:
            source_tweet = loader.get_tweet_by_id(source_id)
            if source_tweet and source_tweet.user_id == request.user_id:
                source_text = source_tweet.text
            else:
                source_id = None

        if not source_text and user_tweets:
            # Fall back to user's most recent saved tweet as the seed
            source_tweet = user_tweets[-1]
            source_text = source_tweet.text
            source_id = source_tweet.tweet_id

        source_vec = engine.encode(source_text)
        scored_candidates = []

        for tw in user_tweets:
            # Strict rule: Never recommend the exact same tweet
            if source_id and tw.tweet_id == source_id:
                continue
            if tw.text.strip().lower() == source_text.strip().lower():
                continue

            candidate_vec = engine.encode(tw.text)
            sim = engine.cosine_similarity(source_vec, candidate_vec)

            # Filter candidates by similarity
            if sim >= settings.SIMILARITY_THRESHOLD:
                scored_candidates.append((sim, tw))

        scored_candidates.sort(key=lambda x: x[0], reverse=True)
        top_candidates = scored_candidates[:request.limit or 5]

        # Generate explanations (via LLM if available, otherwise heuristic rationale)
        recommendations: List[RecommendationItem] = []
        for sim, tw in top_candidates:
            explanation = self.generate_explanation(source_text, tw.text, tw.subtopic)
            recommendations.append(
                RecommendationItem(
                    tweet_id=tw.tweet_id,
                    text=tw.text,
                    author=tw.author or "@author",
                    topic=tw.topic or "General",
                    similarity_score=round(sim, 4),
                    explanation=explanation
                )
            )

        return RecommendationResponse(
            user_id=request.user_id,
            source_context=source_text[:120] + "..." if len(source_text) > 120 else source_text,
            recommendations=recommendations
        )

    def generate_explanation(self, source_text: str, candidate_text: str, candidate_subtopic: str) -> str:
        prompt = (
            f"Explain in one concise sentence why the following saved note is relevant to the source note.\n"
            f"Source: {source_text}\n"
            f"Candidate: {candidate_text}\n"
            f"Output one sentence explanation:"
        )
        llm_resp = llm_client.generate(prompt)
        if llm_resp:
            return llm_resp.strip()

        # Heuristic fallback explanation
        return f"Shares conceptual focus with your note on {candidate_subtopic}, offering practical complementary insights."

recommender = RecommendationEngine()
