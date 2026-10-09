import csv
import json
import os
import random
from datetime import datetime, timedelta, timezone

TOPICS = {
    "Artificial Intelligence and LLMs": [
        ("Prompt Engineering", [
            "Chain-of-thought prompting reduces reasoning errors on complex logic benchmarks by over 40%. Always ask the model to think step-by-step.",
            "Few-shot examples are consistently more reliable than verbose zero-shot prompts for formatting strict JSON schemas.",
            "System prompts should define persona, constraints, and refusal criteria before giving task instructions.",
            "Context window size is not context retrieval quality. Needle-in-a-haystack benchmarks show attention degradation around the middle.",
            "Structured outputs with Pydantic schemas guarantee deterministic API payloads from LLMs without regex hackery.",
        ]),
        ("RAG Architectures", [
            "Chunk size matters more than chunk overlap. 300-token chunks with 50-token overlap offer the best semantic precision for technical docs.",
            "Hybrid search combining BM25 keyword matching with dense vector retrieval outperforms pure vector embeddings by 18% in retrieval recall.",
            "Rerankers like Cohere or BGE reranker are the single highest ROI addition to any RAG pipeline before touching the embedding model.",
            "Query expansion and hypothetical document embeddings (HyDE) bridge the vocabulary gap between user questions and stored knowledge chunks.",
            "Naive chunking breaks table context. Store tables as Markdown or structured JSON nodes with dedicated summary vectors.",
        ]),
        ("LLM Inference & Ops", [
            "Quantization with AWQ and GPTQ enables running 8B models locally on consumer GPUs with virtually zero perplexity penalty.",
            "Speculative decoding pairs a tiny draft model with a large target model to achieve 2-3x faster inference throughput.",
            "Continuous batching in vLLM increases serving efficiency by 4x compared to static batching for variable length generation.",
            "Local LLMs via Ollama and llama.cpp now make offline edge intelligence viable for personal second brain applications.",
            "Guardrails and input sanitization are mandatory to protect LLM pipelines against prompt injection and jailbreaking attacks.",
        ]),
    ],
    "Machine Learning and Data Science": [
        ("Model Training & Fine-Tuning", [
            "LoRA with rank 16 and alpha 32 is sufficient for domain adaptation without catastrophic forgetting of general reasoning.",
            "Data quality trumps token count every single time. 10k curated, clean examples outperform 100k noisy web-scraped rows.",
            "Direct Preference Optimization (DPO) is significantly more stable and compute-efficient than traditional PPO-based RLHF.",
            "Gradient checkpointing trades a 20% compute overhead for a 60% VRAM reduction during transformer fine-tuning.",
            "Always evaluate your fine-tuned model against out-of-distribution holdout tasks to detect overfitting early.",
        ]),
        ("Feature Engineering & Evaluation", [
            "Target encoding without cross-validation fold isolation introduces target leakage that ruins real-world deployment performance.",
            "Precision-Recall AUC is far more informative than ROC-AUC when evaluating severely imbalanced classification datasets.",
            "SHAP and LIME values provide actionable feature attribution insights for stakeholders demanding model interpretability.",
            "Embeddings represent dense geometric topologies; cosine similarity assumes normalized hypersphere distances.",
            "Automated data drift monitoring with Kolmogorov-Smirnov tests catches distribution shifts before models degrade in production.",
        ]),
    ],
    "Software Engineering": [
        ("Architecture & Clean Code", [
            "Clean architecture is about decoupling business logic from databases and frameworks, not creating infinite file hierarchies.",
            "Hexagonal architecture (ports and adapters) allows seamless swapping of vector databases and storage layers without rewriting domain logic.",
            "Premature optimization is the root of evil, but premature generalization creates architectural tech debt that is impossible to maintain.",
            "Write code for the next engineer who has to debug it at 2 AM. Clarity and explicit names beat clever one-liners.",
            "Domain-Driven Design (DDD) bounded contexts keep microservices from turning into a distributed monolithic nightmare.",
        ]),
        ("Distributed Systems", [
            "Idempotency keys are non-negotiable for payment and state-mutating HTTP endpoints across unreliable networks.",
            "Event-driven architectures require careful dead-letter queue strategies and exponential backoff retry policies.",
            "The Raft consensus algorithm is easier to reason about than Paxos, making distributed state replication maintainable.",
            "Database connection pools should be sized based on available CPU cores and disk I/O, not arbitrary max client limits.",
            "Circuit breakers prevent cascading outages when third-party microservices experience latency spikes.",
        ]),
    ],
    "React, Node.js, and System Design": [
        ("Frontend & React", [
            "React 19 Server Components minimize client bundle sizes by executing data fetching directly on the server edge.",
            "Avoid premature use of useEffect for data synchronization; derive state during render whenever mathematically possible.",
            "Tailwind CSS utility classes with CSS variables create a design token system that compiles down to tiny production stylesheets.",
            "Virtualizing long lists with TanStack Virtual prevents DOM bloating and maintains 60fps scrolling performance.",
            "Optimistic UI updates coupled with rollback on network rejection give web apps that instant, native responsiveness.",
        ]),
        ("Backend & Node.js", [
            "Never block the Node.js event loop with synchronous crypto or massive JSON parses; offload to worker threads or streaming APIs.",
            "Use Zod for input validation at network boundaries to achieve end-to-end type safety from Express down to the database.",
            "Mongoose compound indexes should follow the Equality, Sort, Range (ESR) rule to maximize query execution plans.",
            "Stateless JWT tokens require token versioning or Redis blocklists if you need instant revocation before expiry.",
            "Implement rate limiting with sliding window Redis counters to defend authentication routes against brute force attacks.",
        ]),
    ],
    "Startups and Product Development": [
        ("Product Strategy", [
            "Validate product demand with interactive prototypes and customer interviews before building complex backend infrastructure.",
            "The best feature in software is often the one you decided not to build. Maintain ruthless prioritization.",
            "Customer retention is the ultimate measure of product-market fit. Acquisition without retention is just a leaky bucket.",
            "Ship small increments daily. Fast feedback loops consistently beat six-month speculative engineering roadmaps.",
            "Build painkillers, not vitamins. Software that saves 2 hours daily or eliminates regulatory risk always wins budget.",
        ]),
        ("Growth & Execution", [
            "Organic growth comes from built-in sharing loops and word-of-mouth utility, not paid acquisition hacks.",
            "Measure North Star metrics that reflect genuine user value created, not superficial page views or vanity signups.",
            "Talk to your churned users; their candid critiques contain your product's highest-leverage improvement roadmap.",
            "Founder-led sales in the early days teach you the exact language and pain points needed to craft resonant landing pages.",
            "Focus on high-leverage bottlenecks. Speed of iteration is the single most defensible startup advantage.",
        ]),
    ],
    "Productivity and Knowledge Management": [
        ("Second Brain & Note Taking", [
            "A Second Brain is meant for action and synthesis, not digital hoarding. Organize by projects and goals, not passive topics.",
            "The PARA method (Projects, Areas, Resources, Archives) keeps your active workspace uncluttered while preserving context.",
            "Progressive Summarization allows you to review notes at multiple layers of depth: raw clip, bold passages, executive summary.",
            "Bi-directional linking transforms isolated notes into a dense network of serendipitous idea connections.",
            "Capture friction is the enemy of knowledge management. The add-content flow must require fewer than 3 clicks.",
        ]),
        ("Deep Work & Focus", [
            "Time blocking and deliberate single-tasking outperform multitasking by eliminating context-switching cognitive penalties.",
            "Batch your shallow administrative tasks into dedicated low-energy slots to protect uninterrupted morning deep work.",
            "Asynchronous communication default culture gives engineers the uninterrupted flow state required for architectural breakthroughs.",
            "Review your digital capture inbox weekly. Unprocessed notes create cognitive debt that diminishes creative confidence.",
            "Writing down thoughts clarifies thinking. If you cannot explain a technical concept in 3 sentences, you do not understand it.",
        ]),
    ],
    "Learning and Career Development": [
        ("Engineering Growth", [
            "Senior engineers distinguish themselves by solving organizational and architectural ambiguity, not just writing syntax.",
            "Learn fundamentals that have a 20-year half-life: operating systems, networking, distributed consensus, data structures.",
            "Reading production open-source codebases teaches idioms and architectural patterns that tutorials never cover.",
            "Conduct blameless postmortems. Treat system incidents as free operational masterclasses in distributed resilience.",
            "Public learning by writing technical breakdowns cements comprehension and builds career serendipity.",
        ]),
        ("Continuous Upskilling", [
            "Build tiny end-to-end projects when learning new technologies. Muscle memory beats passive documentation skimming.",
            "Pair programming accelerates tacit knowledge transfer between senior and junior team members.",
            "Develop T-shaped skills: deep specialized mastery in one domain paired with broad fluency across the full stack.",
            "Embrace beginner's mindset when new paradigm shifts occur. Curiosity consistently outlives legacy dogmas.",
            "Ask clarifying questions early in meetings. Misaligned assumptions compound into weeks of wasted engineering hours.",
        ]),
    ],
}

SYNTHETIC_AUTHORS = [
    "@alex_ai", "@dev_rachel", "@sam_systems", "@elena_ml", "@marcus_eng",
    "@tech_priya", "@david_scale", "@claire_dev", "@jordan_codes", "@zack_infra",
    "@sophia_ai", "@vikram_arch", "@maya_frontend", "@lucas_backend", "@nina_cloud"
]

DEMO_USER_IDS = ["user_demo_01", "user_demo_02", "user_demo_03"]

def generate_tweets_dataset(output_path: str, target_count: int = 600):
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    tweets = []
    tweet_id_counter = 1001

    base_time = datetime.now(timezone.utc) - timedelta(days=90)

    # First pass: flatten all template sentences
    catalog = []
    for topic, subtopics in TOPICS.items():
        for subtopic, sentences in subtopics:
            for s in sentences:
                catalog.append((topic, subtopic, s))

    # Replicate with variations to hit target count cleanly
    index = 0
    while len(tweets) < target_count:
        topic, subtopic, text_template = catalog[index % len(catalog)]
        author = random.choice(SYNTHETIC_AUTHORS)
        user_id = random.choice(DEMO_USER_IDS)
        created_at = (base_time + timedelta(hours=len(tweets) * 3 + random.randint(0, 120))).strftime("%Y-%m-%dT%H:%M:%SZ")
        
        # Add slight natural prefix or suffix variation if repeated
        repeat_cycle = len(tweets) // len(catalog)
        if repeat_cycle == 0:
            text = text_template
        elif repeat_cycle == 1:
            prefixes = ["Key insight: ", "Pro tip: ", "Note to self: ", "Reminder: ", "Engineering rule: "]
            text = f"{random.choice(prefixes)}{text_template}"
        else:
            suffixes = [" Thoughts?", " Worth bookmarking.", " Essential principle.", " Highly recommended."]
            text = f"{text_template}{random.choice(suffixes)}"

        raw_tags = [
            topic.split()[0].lower(),
            subtopic.split()[0].lower(),
            "notes",
            "secondbrain"
        ]
        tags = ";".join(list(dict.fromkeys(raw_tags)))

        tweets.append({
            "tweet_id": f"tw_{tweet_id_counter}",
            "user_id": user_id,
            "text": text,
            "author": author,
            "topic": topic,
            "subtopic": subtopic,
            "created_at": created_at,
            "source_type": "synthetic_tweet",
            "tags": tags,
        })
        tweet_id_counter += 1
        index += 1

    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=[
            "tweet_id", "user_id", "text", "author", "topic", "subtopic", "created_at", "source_type", "tags"
        ])
        writer.writeheader()
        writer.writerows(tweets)

    print(f"Generated {len(tweets)} synthetic tweets in {output_path}")
    return tweets

def generate_relationships_dataset(tweets, output_path: str, pair_count: int = 150):
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    relationships = []

    # Map by subtopic for natural pairs
    by_subtopic = {}
    for tw in tweets:
        key = (tw["topic"], tw["subtopic"])
        by_subtopic.setdefault(key, []).append(tw)

    rel_types = ["similar_topic", "complementary_idea", "prerequisite", "follow_up"]

    pairs_seen = set()
    for (topic, subtopic), group in by_subtopic.items():
        if len(group) >= 2:
            for i in range(len(group) - 1):
                t1 = group[i]
                t2 = group[i + 1]
                pair_key = tuple(sorted([t1["tweet_id"], t2["tweet_id"]]))
                if pair_key not in pairs_seen:
                    pairs_seen.add(pair_key)
                    r_type = random.choice(rel_types)
                    explanation = f"Both notes discuss {subtopic} within {topic}, sharing practical implementation details."
                    relationships.append({
                        "tweet_id_1": t1["tweet_id"],
                        "tweet_id_2": t2["tweet_id"],
                        "relationship_type": r_type,
                        "explanation": explanation
                    })
                if len(relationships) >= pair_count:
                    break
        if len(relationships) >= pair_count:
            break

    # Add a few cross-topic relationships
    while len(relationships) < pair_count:
        t1 = random.choice(tweets)
        t2 = random.choice(tweets)
        if t1["tweet_id"] != t2["tweet_id"]:
            pair_key = tuple(sorted([t1["tweet_id"], t2["tweet_id"]]))
            if pair_key not in pairs_seen:
                pairs_seen.add(pair_key)
                relationships.append({
                    "tweet_id_1": t1["tweet_id"],
                    "tweet_id_2": t2["tweet_id"],
                    "relationship_type": "complementary_idea",
                    "explanation": f"Note 1 on {t1['subtopic']} complements ideas on {t2['subtopic']} for full-stack engineering."
                })

    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=[
            "tweet_id_1", "tweet_id_2", "relationship_type", "explanation"
        ])
        writer.writeheader()
        writer.writerows(relationships)

    print(f"Generated {len(relationships)} relationships in {output_path}")

def generate_insights_dataset(tweets, output_path: str, count: int = 120):
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    examples = []

    tasks = [
        "Summarize this collection of notes into 2 concise actionable takeaways.",
        "Explain the conceptual relationship between the following two notes.",
        "Recommend relevant follow-up learning topics based on the saved notes.",
        "Generate a structured topic digest highlighting key themes and knowledge gaps.",
        "Extract core engineering principles demonstrated in these saved thoughts."
    ]

    for i in range(count):
        task = tasks[i % len(tasks)]
        sample_tw = random.sample(tweets, 2)
        tw1, tw2 = sample_tw[0], sample_tw[1]

        if "Summarize" in task:
            input_text = f"Note 1: {tw1['text']}\nNote 2: {tw2['text']}"
            output_text = f"1. Prioritize actionable system design and rigorous evaluation over speculative complexity.\n2. Both notes highlight that domain-specific constraints in {tw1['subtopic']} and {tw2['subtopic']} require continuous testing and clean architectural boundaries."
        elif "relationship" in task:
            input_text = f"Note A ({tw1['subtopic']}): {tw1['text']}\nNote B ({tw2['subtopic']}): {tw2['text']}"
            output_text = f"These notes are complementary: Note A establishes foundational execution practices in {tw1['subtopic']}, whereas Note B extends operational robustness in {tw2['subtopic']}."
        elif "Recommend" in task:
            input_text = f"Current context: {tw1['text']}"
            output_text = f"Recommended explorations:\n- Advanced trade-offs in {tw1['subtopic']}\n- Benchmark evaluation methodologies for {tw1['topic']}\n- Real-world distributed failure modes and incident postmortems."
        elif "digest" in task:
            input_text = f"Topic: {tw1['topic']}\nSample: {tw1['text']}"
            output_text = f"Digest for {tw1['topic']}:\n- Core Theme: Pragmatic execution and measurement in {tw1['subtopic']}.\n- Knowledge Gap: Exploration of edge-case error recovery and production scale.\n- Next Step: Experiment with local prototypes before committing to production changes."
        else:
            input_text = f"Snippet: {tw1['text']}"
            output_text = f"Key Principle: Explicit clarity beats clever implicit behavior. Ground all architectural choices in verifiable benchmarks and user feedback."

        examples.append({
            "instruction": task,
            "input": input_text,
            "output": output_text
        })

    with open(output_path, "w", encoding="utf-8") as f:
        for ex in examples:
            f.write(json.dumps(ex, ensure_ascii=False) + "\n")

    print(f"Generated {len(examples)} instruction examples in {output_path}")

def main():
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data"))
    tweets_file = os.path.join(base_dir, "sample_tweets.csv")
    rels_file = os.path.join(base_dir, "tweet_relationships.csv")
    insights_file = os.path.join(base_dir, "insight_examples.jsonl")

    tweets = generate_tweets_dataset(tweets_file, target_count=600)
    generate_relationships_dataset(tweets, rels_file, pair_count=150)
    generate_insights_dataset(tweets, insights_file, count=120)

if __name__ == "__main__":
    main()
