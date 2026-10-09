from typing import Dict, Any, List
from .models import ConnectionRequest, ConnectionResponse
from .data_loader import loader
from .embeddings import engine
from .llm_client import llm_client

class ConnectionEngine:
    def explain_connection(self, request: ConnectionRequest) -> ConnectionResponse:
        t1 = loader.get_tweet_by_id(request.tweet_id_1)
        t2 = loader.get_tweet_by_id(request.tweet_id_2)

        # Enforce user isolation: both tweets must exist and belong to the requesting user
        if not t1 or t1.user_id != request.user_id or not t2 or t2.user_id != request.user_id:
            return ConnectionResponse(
                user_id=request.user_id,
                tweet_1={"tweet_id": request.tweet_id_1, "status": "not_found_or_unauthorized"},
                tweet_2={"tweet_id": request.tweet_id_2, "status": "not_found_or_unauthorized"},
                relationship_type="insufficient_evidence",
                confidence=0.0,
                explanation="Could not find both tweets within the authenticated user's saved notes.",
                evidence=[]
            )

        v1 = engine.encode(t1.text)
        v2 = engine.encode(t2.text)
        sim = engine.cosine_similarity(v1, v2)

        # Check pre-labeled relationships if present
        for rel in loader.relationships:
            if (rel["tweet_id_1"] == t1.tweet_id and rel["tweet_id_2"] == t2.tweet_id) or \
               (rel["tweet_id_2"] == t1.tweet_id and rel["tweet_id_1"] == t2.tweet_id):
                return ConnectionResponse(
                    user_id=request.user_id,
                    tweet_1={"tweet_id": t1.tweet_id, "text": t1.text, "topic": t1.topic},
                    tweet_2={"tweet_id": t2.tweet_id, "text": t2.text, "topic": t2.topic},
                    relationship_type=rel["relationship_type"],
                    confidence=0.88,
                    explanation=rel["explanation"],
                    evidence=[t1.text, t2.text]
                )

        # If similarity is very low and topics differ completely:
        if sim < 0.08 and t1.topic != t2.topic:
            return ConnectionResponse(
                user_id=request.user_id,
                tweet_1={"tweet_id": t1.tweet_id, "text": t1.text, "topic": t1.topic},
                tweet_2={"tweet_id": t2.tweet_id, "text": t2.text, "topic": t2.topic},
                relationship_type="unrelated_topics",
                confidence=0.92,
                explanation="Insufficient semantic overlap to establish a direct conceptual relationship between these two notes.",
                evidence=[]
            )

        # Relationship reasoning via LLM or heuristic
        rel_type, explanation = self.infer_relationship(t1.text, t2.text, t1.topic, t2.topic, sim)

        return ConnectionResponse(
            user_id=request.user_id,
            tweet_1={"tweet_id": t1.tweet_id, "text": t1.text, "topic": t1.topic, "subtopic": t1.subtopic},
            tweet_2={"tweet_id": t2.tweet_id, "text": t2.text, "topic": t2.topic, "subtopic": t2.subtopic},
            relationship_type=rel_type,
            confidence=round(min(0.95, sim + 0.35), 2),
            explanation=explanation,
            evidence=[t1.text, t2.text]
        )

    def infer_relationship(self, text1: str, text2: str, topic1: str, topic2: str, sim: float) -> tuple[str, str]:
        prompt = (
            f"Compare these two saved engineering notes and determine their relationship:\n"
            f"Note 1: {text1}\n"
            f"Note 2: {text2}\n"
            f"Classify relationship as exactly one of: similar_topic, complementary_idea, prerequisite, follow_up, or conflicting_claims.\n"
            f"Provide a 1-2 sentence evidence-based explanation. Format:\n"
            f"Type: <relationship_type>\n"
            f"Explanation: <explanation>"
        )
        llm_resp = llm_client.generate(prompt)
        if llm_resp and "Type:" in llm_resp:
            lines = llm_resp.splitlines()
            rel_type = "complementary_idea"
            explanation = ""
            for line in lines:
                if line.startswith("Type:"):
                    rel_type = line.replace("Type:", "").strip().lower()
                elif line.startswith("Explanation:"):
                    explanation = line.replace("Explanation:", "").strip()
            if explanation:
                return rel_type, explanation

        # Rule-based inference based on semantic similarity and subtopics
        if sim > 0.45:
            rel_type = "similar_topic"
            explanation = f"Both notes reinforce common core principles regarding {topic1} with high conceptual agreement."
        elif "first" in text1.lower() or "prerequisite" in text1.lower() or "fundamentals" in text1.lower():
            rel_type = "prerequisite"
            explanation = f"Note 1 outlines fundamental execution criteria that serve as prerequisites for the system design in Note 2."
        else:
            rel_type = "complementary_idea"
            explanation = f"Note 1 and Note 2 provide complementary operational perspectives across {topic1} and {topic2}."

        return rel_type, explanation

connection_engine = ConnectionEngine()
