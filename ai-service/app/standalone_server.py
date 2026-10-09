import json
import os
import sys
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse

# Ensure app package is importable
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.config import settings
from app.data_loader import loader
from app.retrieval import retriever
from app.recommendations import recommender
from app.connections import connection_engine
from app.digest import digest_engine
from app.llm_client import llm_client
from app.models import (
    SearchRequest,
    RecommendationRequest,
    ConnectionRequest,
    DigestRequest,
    TweetItem,
)

class StandaloneAIHandler(BaseHTTPRequestHandler):
    def _send_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")

    def do_OPTIONS(self):
        self.send_response(204)
        self._send_cors_headers()
        self.end_headers()

    def _send_json(self, status: int, data: dict):
        body = json.dumps(data).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self._send_cors_headers()
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _read_body_json(self) -> dict:
        content_len = int(self.headers.get("Content-Length", 0))
        if content_len == 0:
            return {}
        raw = self.rfile.read(content_len).decode("utf-8")
        return json.loads(raw) if raw else {}

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path

        if path == "/" or path == "":
            self._send_json(200, {
                "service": "Second Brain AI Intelligence Service",
                "status": "running",
                "version": "1.0.0",
                "total_loaded_tweets": len(loader.tweets),
                "endpoints": {
                    "GET /": "This welcome page",
                    "GET /health": "Service health check",
                    "GET /api/v1/dataset/stats": "Dataset statistics",
                    "POST /api/v1/search": "Semantic search",
                    "POST /api/v1/recommendations": "Get recommendations",
                    "POST /api/v1/connections": "Explain connections between notes",
                    "POST /api/v1/digest": "Generate topic digest",
                    "POST /api/v1/sync": "Sync a tweet/note to the index",
                },
            })
        elif path == "/health":
            self._send_json(200, {
                "status": "ok",
                "version": "1.0.0",
                "server_runtime": "python-standalone",
                "embedding_provider": settings.EMBEDDING_PROVIDER,
                "llm_provider": settings.LLM_PROVIDER,
                "llm_connected": llm_client.is_connected(),
                "total_loaded_tweets": len(loader.tweets),
            })
        elif path == "/api/v1/dataset/stats":
            user_counts = {u: len(tws) for u, tws in loader.tweets_by_user.items()}
            topics = list(dict.fromkeys([t.topic for t in loader.tweets]))
            self._send_json(200, {
                "total_tweets": len(loader.tweets),
                "total_relationships": len(loader.relationships),
                "total_insight_examples": len(loader.insight_examples),
                "users": user_counts,
                "topics": topics,
            })
        else:
            self._send_json(404, {"message": f"Endpoint not found: {path}"})

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path
        body = self._read_body_json()

        try:
            if path == "/api/v1/search":
                req = SearchRequest(
                    user_id=body.get("user_id", ""),
                    query=body.get("query", ""),
                    topic=body.get("topic"),
                    limit=body.get("limit", 10),
                )
                res = retriever.search(req.user_id, req.query, req.topic, req.limit)
                # Convert dataclass or pydantic to dict
                data = res if isinstance(res, dict) else (res.model_dump() if hasattr(res, "model_dump") else res.__dict__)
                if "results" in data and isinstance(data["results"], list):
                    data["results"] = [r if isinstance(r, dict) else (r.model_dump() if hasattr(r, "model_dump") else r.__dict__) for r in data["results"]]
                self._send_json(200, data)

            elif path == "/api/v1/recommendations":
                req = RecommendationRequest(
                    user_id=body.get("user_id", ""),
                    source_tweet_id=body.get("source_tweet_id"),
                    source_text=body.get("source_text"),
                    limit=body.get("limit", 5),
                )
                res = recommender.get_recommendations(req)
                data = res if isinstance(res, dict) else (res.model_dump() if hasattr(res, "model_dump") else res.__dict__)
                if "recommendations" in data and isinstance(data["recommendations"], list):
                    data["recommendations"] = [r if isinstance(r, dict) else (r.model_dump() if hasattr(r, "model_dump") else r.__dict__) for r in data["recommendations"]]
                self._send_json(200, data)

            elif path == "/api/v1/connections":
                req = ConnectionRequest(
                    user_id=body.get("user_id", ""),
                    tweet_id_1=body.get("tweet_id_1", ""),
                    tweet_id_2=body.get("tweet_id_2", ""),
                )
                res = connection_engine.explain_connection(req)
                data = res if isinstance(res, dict) else (res.model_dump() if hasattr(res, "model_dump") else res.__dict__)
                self._send_json(200, data)

            elif path == "/api/v1/digest":
                req = DigestRequest(
                    user_id=body.get("user_id", ""),
                    topic=body.get("topic"),
                    period_days=body.get("period_days", 90),
                    max_tweets=body.get("max_tweets", 20),
                )
                res = digest_engine.generate_digest(req)
                data = res if isinstance(res, dict) else (res.model_dump() if hasattr(res, "model_dump") else res.__dict__)
                self._send_json(200, data)

            elif path == "/api/v1/sync":
                tweet = TweetItem(
                    tweet_id=body["tweet_id"],
                    user_id=body["user_id"],
                    text=body["text"],
                    author=body.get("author", "@user"),
                    topic=body.get("topic", "General"),
                    subtopic=body.get("subtopic", "General"),
                    created_at=body.get("created_at", ""),
                    source_type=body.get("source_type", "tweet"),
                    tags=body.get("tags", ""),
                )
                loader.add_user_tweet(tweet)
                self._send_json(200, {"message": "Tweet indexed successfully", "tweet_id": tweet.tweet_id})
            else:
                self._send_json(404, {"message": f"Endpoint not found: {path}"})

        except Exception as e:
            self._send_json(500, {"error": str(e)})

def run(port: int = 8000):
    server = HTTPServer(("0.0.0.0", port), StandaloneAIHandler)
    print(f"Second Brain AI Service running on http://localhost:{port}")
    server.serve_forever()

if __name__ == "__main__":
    port = int(os.getenv("PORT", "8000"))
    run(port)
