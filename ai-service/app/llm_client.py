import json
import urllib.request
import urllib.error
from typing import Optional
from .config import settings

class LLMClient:
    def __init__(self):
        self.provider = settings.LLM_PROVIDER
        self.base_url = settings.LLM_BASE_URL
        self.model = settings.LLM_MODEL
        self.timeout = settings.LLM_TIMEOUT

    def is_connected(self) -> bool:
        """Check if local Ollama runtime is reachable."""
        try:
            req = urllib.request.Request(f"{self.base_url}/api/tags", headers={"User-Agent": "SecondBrain-AI/1.0"})
            with urllib.request.urlopen(req, timeout=1.5) as resp:
                return resp.status == 200
        except Exception:
            return False

    def generate(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        """Attempts to call Ollama. Returns response text or empty string on failure."""
        if not self.is_connected():
            return ""

        payload = {
            "model": self.model,
            "prompt": prompt,
            "stream": False
        }
        if system_prompt:
            payload["system"] = system_prompt

        try:
            data = json.dumps(payload).encode("utf-8")
            req = urllib.request.Request(
                f"{self.base_url}/api/generate",
                data=data,
                headers={"Content-Type": "application/json", "User-Agent": "SecondBrain-AI/1.0"}
            )
            with urllib.request.urlopen(req, timeout=self.timeout) as resp:
                if resp.status == 200:
                    res_json = json.loads(resp.read().decode("utf-8"))
                    return res_json.get("response", "").strip()
        except Exception as e:
            print(f"[LLMClient] Ollama request failed ({e}). Proceeding to fallback generator.")

        return ""

llm_client = LLMClient()
