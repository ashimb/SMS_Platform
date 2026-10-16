"""Background worker (ARQ). `arq app.worker.WorkerSettings` is the entry point."""

from app.worker.main import WorkerSettings

__all__ = ["WorkerSettings"]
