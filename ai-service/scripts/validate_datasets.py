import csv
import json
import os
import sys

def validate_datasets():
    data_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data"))
    tweets_file = os.path.join(data_dir, "sample_tweets.csv")
    rels_file = os.path.join(data_dir, "tweet_relationships.csv")
    insights_file = os.path.join(data_dir, "insight_examples.jsonl")

    errors = []

    # 1. Validate sample_tweets.csv
    if not os.path.exists(tweets_file):
        errors.append(f"Missing {tweets_file}")
    else:
        with open(tweets_file, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            required_cols = {"tweet_id", "user_id", "text", "author", "topic", "subtopic", "created_at", "source_type", "tags"}
            if not required_cols.issubset(set(reader.fieldnames or [])):
                errors.append(f"sample_tweets.csv missing columns: {required_cols - set(reader.fieldnames or [])}")
            
            row_count = 0
            for i, row in enumerate(reader, start=1):
                row_count += 1
                for col in required_cols:
                    if not row[col] or not row[col].strip():
                        errors.append(f"sample_tweets.csv line {i}: empty field '{col}'")
            if row_count < 500:
                errors.append(f"sample_tweets.csv has only {row_count} rows, expected at least 500")
            print(f"[OK] sample_tweets.csv: {row_count} valid rows")

    # 2. Validate tweet_relationships.csv
    if not os.path.exists(rels_file):
        errors.append(f"Missing {rels_file}")
    else:
        with open(rels_file, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            required_cols = {"tweet_id_1", "tweet_id_2", "relationship_type", "explanation"}
            if not required_cols.issubset(set(reader.fieldnames or [])):
                errors.append(f"tweet_relationships.csv missing columns: {required_cols - set(reader.fieldnames or [])}")
            
            row_count = 0
            for i, row in enumerate(reader, start=1):
                row_count += 1
                for col in required_cols:
                    if not row[col] or not row[col].strip():
                        errors.append(f"tweet_relationships.csv line {i}: empty field '{col}'")
            if row_count < 100:
                errors.append(f"tweet_relationships.csv has only {row_count} rows, expected at least 100")
            print(f"[OK] tweet_relationships.csv: {row_count} valid rows")

    # 3. Validate insight_examples.jsonl
    if not os.path.exists(insights_file):
        errors.append(f"Missing {insights_file}")
    else:
        line_count = 0
        with open(insights_file, "r", encoding="utf-8") as f:
            for i, line in enumerate(f, start=1):
                line = line.strip()
                if not line:
                    continue
                try:
                    obj = json.loads(line)
                    if not all(k in obj and isinstance(obj[k], str) and obj[k].strip() for k in ["instruction", "input", "output"]):
                        errors.append(f"insight_examples.jsonl line {i} missing valid instruction/input/output strings")
                    line_count += 1
                except json.JSONDecodeError as e:
                    errors.append(f"insight_examples.jsonl line {i}: invalid JSON ({e})")
        if line_count < 100:
            errors.append(f"insight_examples.jsonl has only {line_count} lines, expected at least 100")
        print(f"[OK] insight_examples.jsonl: {line_count} valid JSON lines")

    if errors:
        print("\n[VALIDATION FAILED]")
        for err in errors[:10]:
            print(f" - {err}")
        sys.exit(1)
    else:
        print("\nAll datasets passed schema validation successfully!")

if __name__ == "__main__":
    validate_datasets()
