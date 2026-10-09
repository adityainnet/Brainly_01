import csv
import json
import os
from typing import Dict, List, Optional
from .models import TweetItem
from .config import settings

class DatasetLoader:
    def __init__(self, dataset_path: Optional[str] = None):
        self.dataset_path = dataset_path or settings.DATASET_PATH
        self.relationships_path = settings.RELATIONSHIPS_PATH
        self.insights_path = settings.INSIGHTS_PATH

        self.tweets: List[TweetItem] = []
        self.tweets_by_id: Dict[str, TweetItem] = {}
        self.tweets_by_user: Dict[str, List[TweetItem]] = {}
        self.relationships: List[Dict[str, str]] = []
        self.insight_examples: List[Dict[str, str]] = []

        self.load_all()

    def load_all(self):
        self.load_tweets()
        self.load_relationships()
        self.load_insights()

    def load_tweets(self):
        resolved_path = os.path.abspath(self.dataset_path)
        if not os.path.exists(resolved_path):
            raise FileNotFoundError(f"Tweets dataset not found at {resolved_path}")

        loaded_tweets = []
        by_id = {}
        by_user = {}

        with open(resolved_path, mode="r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                try:
                    item = TweetItem(
                        tweet_id=row["tweet_id"].strip(),
                        user_id=row["user_id"].strip(),
                        text=row["text"].strip(),
                        author=row.get("author", "@author").strip(),
                        topic=row.get("topic", "General").strip(),
                        subtopic=row.get("subtopic", "General").strip(),
                        created_at=row.get("created_at", "").strip(),
                        source_type=row.get("source_type", "synthetic_tweet").strip(),
                        tags=row.get("tags", "").strip(),
                    )
                    loaded_tweets.append(item)
                    by_id[item.tweet_id] = item
                    by_user.setdefault(item.user_id, []).append(item)
                except Exception as e:
                    # Skip or log malformed row safely
                    continue

        self.tweets = loaded_tweets
        self.tweets_by_id = by_id
        self.tweets_by_user = by_user

    def load_relationships(self):
        resolved_path = os.path.abspath(self.relationships_path)
        if not os.path.exists(resolved_path):
            self.relationships = []
            return

        rels = []
        with open(resolved_path, mode="r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                if row.get("tweet_id_1") and row.get("tweet_id_2"):
                    rels.append({
                        "tweet_id_1": row["tweet_id_1"].strip(),
                        "tweet_id_2": row["tweet_id_2"].strip(),
                        "relationship_type": row.get("relationship_type", "similar_topic").strip(),
                        "explanation": row.get("explanation", "").strip(),
                    })
        self.relationships = rels

    def load_insights(self):
        resolved_path = os.path.abspath(self.insights_path)
        if not os.path.exists(resolved_path):
            self.insight_examples = []
            return

        examples = []
        with open(resolved_path, mode="r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    data = json.loads(line)
                    if "instruction" in data and "output" in data:
                        examples.append(data)
                except json.JSONDecodeError:
                    continue
        self.insight_examples = examples

    def get_user_tweets(self, user_id: str) -> List[TweetItem]:
        """Return tweets strictly isolated to the specified user_id."""
        return self.tweets_by_user.get(user_id, [])

    def get_tweet_by_id(self, tweet_id: str) -> Optional[TweetItem]:
        return self.tweets_by_id.get(tweet_id)

    def add_user_tweet(self, tweet: TweetItem):
        """Allows dynamically ingesting a user's saved tweet at runtime."""
        self.tweets.append(tweet)
        self.tweets_by_id[tweet.tweet_id] = tweet
        self.tweets_by_user.setdefault(tweet.user_id, []).append(tweet)

loader = DatasetLoader()
