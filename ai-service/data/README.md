# Synthetic Data Documentation — Second Brain AI Service

This directory contains synthetic datasets created for testing and benchmarking the Second Brain semantic search, recommendation, relationship inference, and digest generation pipelines.

## 📁 Datasets Overview

### 1. `sample_tweets.csv`
- **Total records:** 600 synthetic tweet-like notes.
- **Topics covered:**
  - Artificial Intelligence and LLMs
  - Machine Learning and Data Science
  - Software Engineering
  - React, Node.js, and System Design
  - Startups and Product Development
  - Productivity and Knowledge Management
  - Learning and Career Development
- **Schema:**
  - `tweet_id` (string): Unique identifier (e.g. `tw_1001`).
  - `user_id` (string): Mock user partition identifier (e.g. `user_demo_01`).
  - `text` (string): Synthetic text content of the note/tweet.
  - `author` (string): Synthetic handle (e.g. `@alex_ai`).
  - `topic` (string): Primary topic domain.
  - `subtopic` (string): Subtopic specialization (e.g. `RAG Architectures`, `Frontend & React`).
  - `created_at` (ISO 8601 string): Timestamp of note creation.
  - `source_type` (string): `synthetic_tweet`.
  - `tags` (string): Semicolon-delimited tags (e.g. `artificial;prompt;notes;secondbrain`).

### 2. `tweet_relationships.csv`
- **Total records:** 150 test relationship pairs.
- **Schema:**
  - `tweet_id_1` (string): First tweet ID.
  - `tweet_id_2` (string): Second tweet ID.
  - `relationship_type` (string): Label (`similar_topic`, `complementary_idea`, `prerequisite`, `follow_up`).
  - `explanation` (string): Rationale explaining the connection.
- **Note:** These are illustrative labels intended for testing semantic connection heuristics, not absolute ground truth.

### 3. `insight_examples.jsonl`
- **Total records:** 120 instruction/output pairs.
- **Format:** Strict JSON Lines format (one valid JSON object per line).
- **Schema:**
  - `instruction` (string): Task description (summarization, relationship inference, recommendations, topic digests).
  - `input` (string): Context text or tweet snippets.
  - `output` (string): Synthesized insight or structured summary.

---

## ⚠️ Important Rules & Limitations
1. **Synthetic Nature:** All records are purely synthetic and generated algorithmically. None of these tweets represent real human posts or private user content.
2. **Not Training Data:** These examples are designed for pipeline integration testing, unit verification, and retrieval benchmarking. They are not sufficient to train or fine-tune production LLMs without extensive human curation.
3. **User Isolation:** In production, user data is strictly isolated per `user_id`. Queries only retrieve items belonging to the authenticated user.

---

## 🔄 Regeneration Instructions

To regenerate or expand this synthetic dataset:

```bash
python ai-service/scripts/generate_datasets.py
```

To validate the schemas, field types, and non-empty guarantees:

```bash
python ai-service/scripts/validate_datasets.py
```
