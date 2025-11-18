"""OpenAI-compatible LLM service for Task Line AI chat."""

import httpx
import logging

logger = logging.getLogger(__name__)


class LLMService:
    """Simple OpenAI-compatible API client.

    Works with any LLM provider that implements OpenAI's chat completions API,
    including OpenAI, Gemini (via openai endpoint), Anthropic, local models, etc.
    """

    def __init__(self):
        """Initialize the LLM service with an async HTTP client."""
        self.client = httpx.AsyncClient(timeout=30.0)

    async def get_completion(
        self,
        messages: list[dict],
        api_url: str,
        api_key: str,
        model: str,
        temperature: float = 0.7,
        max_tokens: int = 1000
    ) -> str:
        """
        Get AI response from OpenAI-compatible API.

        Args:
            messages: List of message dicts with 'role' and 'content' keys
                     Roles should be 'system', 'user', or 'assistant'
            api_url: Base URL for the API (e.g., https://api.openai.com/v1/chat/completions)
            api_key: API key for authentication
            model: Model name (e.g., gpt-4o-mini, gemini-2.0-flash)
            temperature: Sampling temperature (0-2)
            max_tokens: Maximum tokens to generate

        Returns:
            str: AI response text

        Raises:
            httpx.HTTPError: If API request fails
            ValueError: If response format is unexpected
        """
        try:
            # Standard OpenAI chat completions format
            payload = {
                "model": model,
                "messages": messages,
                "temperature": temperature,
                "max_tokens": max_tokens
            }

            # Authorization header
            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            }

            logger.info(f"Calling LLM API ({model}) with {len(messages)} messages")
            response = await self.client.post(api_url, json=payload, headers=headers)
            response.raise_for_status()

            # Parse response
            data = response.json()

            # Extract text from OpenAI-compatible response format
            if "choices" not in data or not data["choices"]:
                logger.error(f"No choices in API response: {data}")
                raise ValueError("No response from LLM API")

            choice = data["choices"][0]
            if "message" not in choice or "content" not in choice["message"]:
                logger.error(f"Invalid choice format: {choice}")
                raise ValueError("Invalid response format from LLM API")

            response_text = choice["message"]["content"]
            logger.info(f"Received LLM response ({len(response_text)} chars)")

            return response_text

        except httpx.HTTPError as e:
            logger.error(f"LLM API HTTP error: {e}")
            raise
        except (KeyError, IndexError, ValueError) as e:
            logger.error(f"Error parsing LLM response: {e}")
            raise

    async def close(self):
        """Close the HTTP client."""
        await self.client.aclose()
        logger.info("LLM service closed")
