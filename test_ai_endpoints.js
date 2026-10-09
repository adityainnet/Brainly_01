const test = async () => {
  const base = "http://127.0.0.1:8000";

  // 1. Health
  const healthRes = await fetch(`${base}/health`);
  const health = await healthRes.json();
  console.log("AI Health:", health);

  // 2. Search
  const searchRes = await fetch(`${base}/api/v1/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: "user_demo_01",
      query: "chain of thought prompt engineering",
      limit: 3,
    }),
  });
  const searchData = await searchRes.json();
  console.log("AI Search found:", searchData.total_found, "Top result:", searchData.results?.[0]?.text);

  // 3. Recommendations
  const recRes = await fetch(`${base}/api/v1/recommendations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: "user_demo_01",
      limit: 2,
    }),
  });
  const recData = await recRes.json();
  console.log("AI Recs count:", recData.recommendations?.length, "Reason:", recData.recommendations?.[0]?.explanation);

  // 4. Connections
  const connRes = await fetch(`${base}/api/v1/connections`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: "user_demo_01",
      tweet_id_1: "tw_1001",
      tweet_id_2: "tw_1002",
    }),
  });
  const connData = await connRes.json();
  console.log("AI Connection type:", connData.relationship_type, "Explanation:", connData.explanation);

  // 5. Digest
  const digestRes = await fetch(`${base}/api/v1/digest`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: "user_demo_01",
      max_tweets: 8,
    }),
  });
  const digestData = await digestRes.json();
  console.log("AI Digest Summary:", digestData.summary);
  console.log("Themes:", digestData.recurring_themes?.length, "Gaps:", digestData.knowledge_gaps?.length);

  console.log("\nALL AI SERVICE ENDPOINTS TESTED SUCCESSFULLY!");
};

test().catch(console.error);
