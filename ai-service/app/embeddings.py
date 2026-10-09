import math
import re
import os
import json
from collections import Counter
from typing import Dict, List, Tuple
from .config import settings

class EmbeddingEngine:
    def __init__(self):
        self.provider = settings.EMBEDDING_PROVIDER.lower()
        self.cache_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "cache"))
        self.cache_file = os.path.join(self.cache_dir, "vector_cache.json")
        os.makedirs(self.cache_dir, exist_ok=True)

        self.vocab: Dict[str, int] = {}
        self.idf: Dict[str, float] = {}
        self.cache: Dict[str, List[float]] = {}
        self.sentence_transformer_model = None

        if self.provider == "sentence-transformers":
            try:
                from sentence_transformers import SentenceTransformer
                self.sentence_transformer_model = SentenceTransformer(settings.EMBEDDING_MODEL)
                print(f"[EmbeddingEngine] Loaded SentenceTransformer({settings.EMBEDDING_MODEL})")
            except Exception as e:
                print(f"[EmbeddingEngine] SentenceTransformers not available ({e}). Using pure Python TF-IDF engine.")
                self.provider = "tfidf"

        self.load_cache()

    def tokenize(self, text: str) -> List[str]:
        # Lowercase, clean alphanumeric tokens, basic n-grams
        words = re.findall(r"\b[a-zA-Z0-9_\-\.]{2,}\b", text.lower())
        # Add basic bi-grams for semantic phrase matching (e.g. "deep work", "system design")
        bigrams = [f"{words[i]}_{words[i+1]}" for i in range(len(words)-1)]
        return words + bigrams

    def fit_corpus(self, documents: List[str]):
        """Fits vocabulary and IDF frequencies over corpus."""
        doc_count = len(documents)
        if doc_count == 0:
            return

        doc_freq = Counter()
        for doc in documents:
            tokens = set(self.tokenize(doc))
            for t in tokens:
                doc_freq[t] += 1

        self.vocab = {term: idx for idx, term in enumerate(doc_freq.keys())}
        self.idf = {
            term: math.log((doc_count + 1) / (freq + 1)) + 1.0
            for term, freq in doc_freq.items()
        }

    def encode(self, text: str) -> List[float]:
        """Encodes single text into normalized vector."""
        if text in self.cache:
            return self.cache[text]

        if self.sentence_transformer_model is not None:
            vec = self.sentence_transformer_model.encode(text).tolist()
            self.cache[text] = vec
            return vec

        # TF-IDF vectorization
        tokens = self.tokenize(text)
        if not tokens:
            return [0.0] * min(len(self.vocab), 64)

        tf = Counter(tokens)
        vector_dict: Dict[int, float] = {}
        squared_sum = 0.0

        for term, count in tf.items():
            if term in self.vocab:
                dim = self.vocab[term]
                val = count * self.idf.get(term, 1.0)
                vector_dict[dim] = val
                squared_sum += val * val

        norm = math.sqrt(squared_sum) or 1.0
        # Return sparse dict representation or compact list
        # For simplicity and speed in cosine similarity, we store non-zero indices or normalized representation
        vector = [0.0] * len(self.vocab)
        for dim, val in vector_dict.items():
            vector[dim] = round(val / norm, 5)

        self.cache[text] = vector
        return vector

    def cosine_similarity(self, vec1: List[float], vec2: List[float]) -> float:
        """Computes dot product of pre-normalized vectors."""
        if not vec1 or not vec2:
            return 0.0
        length = min(len(vec1), len(vec2))
        return sum(vec1[i] * vec2[i] for i in range(length))

    def load_cache(self):
        if os.path.exists(self.cache_file):
            try:
                with open(self.cache_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    self.cache = data.get("cache", {})
                    self.vocab = data.get("vocab", {})
                    self.idf = data.get("idf", {})
            except Exception:
                self.cache = {}

    def save_cache(self):
        try:
            with open(self.cache_file, "w", encoding="utf-8") as f:
                json.dump({
                    "cache": self.cache,
                    "vocab": self.vocab,
                    "idf": self.idf
                }, f)
        except Exception:
            pass

engine = EmbeddingEngine()
