"""Fake LLM service implementations for testing purposes."""


# Test-controlled injection point
INJECT_TASK_TITLE: str | None = None

class FakeLLMServiceBase:
    async def get_completion(self, **kwargs):
        pass

    async def close(self):
        pass


class FakeLLMServiceCreate(FakeLLMServiceBase):
    async def get_completion(self, **kwargs):
        return (
            "Sure!\n"
            "```json\n"
            '{"action":"create_task","title":"AI task","due_date":"2030-01-01","tags":["ai"]}\n'
            "```\n"
            "Done."
        )


class FakeLLMServiceUpdate(FakeLLMServiceBase):
    async def get_completion(self, **kwargs):
        # Use task_title to match backend.chat.routes.update_task_action contract
        title = INJECT_TASK_TITLE or "Plan Trip"
        return (
            "Sure!\n"
            "```json\n"
            f'{{"action":"update_task","task_title":"{title}","due_date":"2030-02-01","priority": true, "category": "Travel", "description": "Updated by AI", "estimate_minutes": 45}}\n'
            "```\n"
            "Done."
        )


class FakeLLMServiceArchive(FakeLLMServiceBase):
    async def get_completion(self, **kwargs):
        title = INJECT_TASK_TITLE or "To Archive"
        return (
            "Sure!\n"
            "```json\n"
            f'{{"action":"archive_task","task_title":"{title}"}}\n'
            "```\n"
            "Done."
        )


class FakeLLMServiceDelete(FakeLLMServiceBase):
    async def get_completion(self, **kwargs):
        return (
            "Sure!\n"
            "```json\n"
            '{"action":"delete_task","task_id":1}\n'
            "```\n"
            "Done."
        )


class FakeLLMServiceError(FakeLLMServiceBase):
    async def get_completion(self, **kwargs):
        raise RuntimeError("Simulated LLM failure")