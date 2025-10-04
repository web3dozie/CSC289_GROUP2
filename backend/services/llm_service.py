"""Gemini LLM service for Task Line AI chat."""

import httpx
import logging
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class LLMConfig:
    """Configuration for LLM API calls."""

    api_key: str
    model: str = "gemini-2.0-flash-exp"
    temperature: float = 0.7
    max_tokens: int = 1000


class GeminiLLMService:
    """Simple, non-streaming Gemini API client."""

    BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models"

    def __init__(self):
        """Initialize the Gemini LLM service with an async HTTP client."""
        self.client = httpx.AsyncClient(timeout=30.0)

    async def get_completion(self, messages: list[dict], config: LLMConfig) -> str:
        """
        Get AI response from Gemini API (simple, non-streaming).

        Args:
            messages: List of message dicts with 'role' and 'content' keys
            config: LLM configuration including API key and model settings

        Returns:
            str: AI response text

        Raises:
            httpx.HTTPError: If API request fails
            KeyError: If response format is unexpected
        """
        try:
            # Build Gemini API request payload
            contents = []
            for msg in messages:
                role = msg.get("role", "user")
                content = msg.get("content", "")

                # Gemini uses "user" and "model" roles (not "assistant")
                gemini_role = "model" if role == "assistant" else "user"

                contents.append({
                    "role": gemini_role,
                    "parts": [{"text": content}]
                })

            payload = {
                "contents": contents,
                "generationConfig": {
                    "temperature": config.temperature,
                    "maxOutputTokens": config.max_tokens
                }
            }

            # Make API call
            url = f"{self.BASE_URL}/{config.model}:generateContent?key={config.api_key}"

            logger.info(f"Calling Gemini API with {len(messages)} messages")
            response = await self.client.post(url, json=payload)
            response.raise_for_status()

            # Parse response
            data = response.json()

            # Extract text from response
            # Format: data.candidates[0].content.parts[0].text
            if "candidates" not in data or not data["candidates"]:
                logger.error(f"No candidates in Gemini response: {data}")
                raise ValueError("No response from Gemini API")

            candidate = data["candidates"][0]
            if "content" not in candidate:
                logger.error(f"No content in candidate: {candidate}")
                raise ValueError("Invalid response format from Gemini API")

            parts = candidate["content"].get("parts", [])
            if not parts or "text" not in parts[0]:
                logger.error(f"No text in response parts: {parts}")
                raise ValueError("No text in Gemini API response")

            response_text = parts[0]["text"]
            logger.info(f"Received Gemini response ({len(response_text)} chars)")

            return response_text

        except httpx.HTTPError as e:
            logger.error(f"Gemini API HTTP error: {e}")
            raise
        except (KeyError, IndexError, ValueError) as e:
            logger.error(f"Error parsing Gemini response: {e}")
            raise

    async def close(self):
        """Close the HTTP client."""
        await self.client.aclose()
        logger.info("Gemini LLM service closed")
