import asyncio
import logging
import time
from contextlib import contextmanager
from functools import wraps

from starlette_context import context
from starlette_context.header_keys import HeaderKeys

from .config import config


class CustomFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        record.request_id = "N/A"

        if context.exists():
            record.request_id = context.get(HeaderKeys.request_id)

        return super().format(record)


def setup_logging(config) -> None:  # pragma: no cover
    debug_on = config["debug"].get(False)
    log_level = logging.DEBUG if debug_on else logging.INFO

    formatter = CustomFormatter(
        "[%(asctime)s] %(levelname)s [%(request_id)s] %(name)s | %(message)s"
    )
    handler = logging.StreamHandler()
    handler.setFormatter(formatter)

    logging.getLogger().addHandler(handler)
    logging.getLogger().setLevel(logging.NOTSET)

    logging.getLogger().setLevel(logging.DEBUG)

    logging.getLogger("medconb").setLevel(log_level)

    logging.getLogger("medconb").warning("Warning enabled")
    logging.getLogger("medconb").info("Info enabled")
    logging.getLogger("medconb").debug("Debugging enabled")

    # for logger_name in logging.getLogger().manager.loggerDict:
    #     print(f"Set {logger_name}: ", logging.getLogger().getEffectiveLevel())


def time_me(logger_name: str | None, force: bool = False):
    logger = logging.getLogger(logger_name or __name__)

    def _(func):
        @contextmanager
        def wrapping_logic():
            logger.debug("entered %s", func.__name__)
            wall_start = time.time()
            cpu_start = time.process_time()
            yield
            wall_time = time.time() - wall_start
            cpu_time = time.process_time() - cpu_start
            logger.debug(
                "finished %s (wall/cpu [ms]: %.3f/%.3f)",
                func.__name__,
                wall_time,
                cpu_time,
            )

        @wraps(func)
        def wrapper(*args, **kwargs):
            if not asyncio.iscoroutinefunction(func):
                with wrapping_logic():
                    return func(*args, **kwargs)
            else:

                async def tmp():
                    with wrapping_logic():
                        return await func(*args, **kwargs)

                return tmp()

        # Save processing power if trace is not enabled
        if not force and not config["trace"].get(False):
            return func

        return wrapper

    return _
