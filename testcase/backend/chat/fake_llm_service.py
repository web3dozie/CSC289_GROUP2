"""Fake LLM service implementations for testing purposes."""


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
        return (
            "Sure!\n"
            "```json\n"
            '{"action":"update_task","task_id":1,"title":"Updated AI task","due_date":"2030-02-01","tags":["updated","ai"]}\n'
            "```\n"
            "Done."
        )


class FakeLLMServiceArchive(FakeLLMServiceBase):
    async def get_completion(self, **kwargs):
        return (
            "Sure!\n"
            "```json\n"
            '{"action":"archive_task","task_id":1}\n'
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