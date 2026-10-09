import unittest
import os
import sys

# Ensure ai-service root is in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.data_loader import DatasetLoader
from app.embeddings import EmbeddingEngine
from app.retrieval import SemanticRetriever
from app.recommendations import RecommendationEngine
from app.connections import ConnectionEngine
from app.digest import DigestEngine
from app.models import SearchRequest, RecommendationRequest, ConnectionRequest, DigestRequest

class TestAIService(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.loader = DatasetLoader()
        cls.engine = EmbeddingEngine()
        cls.corpus = [t.text for t in cls.loader.tweets]
        cls.engine.fit_corpus(cls.corpus)
        cls.retriever = SemanticRetriever()
        cls.recommender = RecommendationEngine()
        cls.connection_engine = ConnectionEngine()
        cls.digest_engine = DigestEngine()

    def test_01_dataset_loading(self):
        self.assertGreaterEqual(len(self.loader.tweets), 500)
        self.assertGreaterEqual(len(self.loader.relationships), 100)
        self.assertGreaterEqual(len(self.loader.insight_examples), 100)

        # Ensure user index exists
        users = list(self.loader.tweets_by_user.keys())
        self.assertGreater(len(users), 1)

    def test_02_embedding_generation_and_similarity(self):
        text_a = "Prompt engineering with chain-of-thought and few-shot examples."
        text_b = "System prompts and chain-of-thought reasoning for LLMs."
        text_c = "Cooking authentic Italian pizza with sourdough crust."

        vec_a = self.engine.encode(text_a)
        vec_b = self.engine.encode(text_b)
        vec_c = self.engine.encode(text_c)

        self.assertGreater(len(vec_a), 0)
        sim_ab = self.engine.cosine_similarity(vec_a, vec_b)
        sim_ac = self.engine.cosine_similarity(vec_a, vec_c)

        # Semantically related AI texts should have higher similarity than pizza
        self.assertGreater(sim_ab, sim_ac)

    def test_03_user_isolation_in_search(self):
        user_1 = "user_demo_01"
        user_2 = "user_demo_02"

        res_1 = self.retriever.search(user_id=user_1, query="RAG vector chunking", limit=10)
        res_2 = self.retriever.search(user_id=user_2, query="RAG vector chunking", limit=10)

        # Results for user_1 must only come from user_1's partition
        user_1_ids = {t.tweet_id for t in self.loader.get_user_tweets(user_1)}
        for item in res_1.results:
            self.assertIn(item.tweet_id, user_1_ids, f"Leaked tweet {item.tweet_id} from another user!")

        # Results for user_2 must only come from user_2's partition
        user_2_ids = {t.tweet_id for t in self.loader.get_user_tweets(user_2)}
        for item in res_2.results:
            self.assertIn(item.tweet_id, user_2_ids, f"Leaked tweet {item.tweet_id} from another user!")

    def test_04_no_self_recommendation(self):
        user_1 = "user_demo_01"
        u1_tweets = self.loader.get_user_tweets(user_1)
        target_tweet = u1_tweets[0]

        req = RecommendationRequest(
            user_id=user_1,
            source_tweet_id=target_tweet.tweet_id,
            limit=5
        )
        res = self.recommender.get_recommendations(req)

        # Target tweet must never be recommended back to the user
        rec_ids = [r.tweet_id for r in res.recommendations]
        self.assertNotIn(target_tweet.tweet_id, rec_ids)

        for r in res.recommendations:
            self.assertNotEqual(r.text.strip().lower(), target_tweet.text.strip().lower())
            self.assertTrue(len(r.explanation) > 0)

    def test_05_connections_between_ideas(self):
        user_1 = "user_demo_01"
        u1_tweets = self.loader.get_user_tweets(user_1)
        t1 = u1_tweets[0]
        t2 = u1_tweets[1]

        req = ConnectionRequest(
            user_id=user_1,
            tweet_id_1=t1.tweet_id,
            tweet_id_2=t2.tweet_id
        )
        res = self.connection_engine.explain_connection(req)

        self.assertIn(res.relationship_type, [
            "similar_topic", "complementary_idea", "prerequisite",
            "follow_up", "conflicting_claims", "unrelated_topics"
        ])
        self.assertTrue(len(res.explanation) > 0)

    def test_06_connection_user_cross_boundary_protection(self):
        user_1 = "user_demo_01"
        user_2 = "user_demo_02"
        t1 = self.loader.get_user_tweets(user_1)[0]
        t2 = self.loader.get_user_tweets(user_2)[0]

        # Attempt to connect a tweet belonging to user_2 using user_1's token
        req = ConnectionRequest(
            user_id=user_1,
            tweet_id_1=t1.tweet_id,
            tweet_id_2=t2.tweet_id
        )
        res = self.connection_engine.explain_connection(req)

        self.assertEqual(res.relationship_type, "insufficient_evidence")
        self.assertEqual(res.confidence, 0.0)

    def test_07_topic_digest_generation(self):
        user_1 = "user_demo_01"
        req = DigestRequest(user_id=user_1, max_tweets=10)
        res = self.digest_engine.generate_digest(req)

        self.assertGreater(res.tweet_count, 0)
        self.assertTrue(len(res.summary) > 0)
        self.assertGreater(len(res.recurring_themes), 0)
        self.assertGreater(len(res.knowledge_gaps), 0)
        self.assertGreater(len(res.suggested_explorations), 0)
        self.assertGreater(len(res.cited_tweet_ids), 0)

if __name__ == "__main__":
    unittest.main()
