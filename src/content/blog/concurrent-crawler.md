---
title: "A concurrent crawler with Python and Playwright"
description: "An early Python and Playwright crawler prototype with asynchronous workers and interchangeable local or Redis queues."
pubDate: 2026-11-03
tags:
  - python
  - playwright
  - asyncio
  - redis
  - web-crawling
image: "../../assets/images/blog_images/ohrid-waterfront.jpg"
imageAlt: "Lakeside town with hillside houses, boats and a bright blue sky."
repository:
  url: "https://github.com/bzhr/concurrent_crawler"
  description: "A personal open-source prototype for concurrent web crawling."
  contribution: "Built an early crawler prototype with asynchronous workers and interchangeable queue backends."
  approach: "Workers use Playwright and BeautifulSoup; URLs are managed by either an in-process queue or Redis."
  outcome: "The prototype is not turnkey: packaging is incomplete, and crawl safeguards and durable output are not implemented."
---

I built [Strive Miner—Concurrent Web Crawler](https://github.com/bzhr/concurrent_crawler) as a personal open-source prototype using Python's `asyncio` and Playwright. It launches Chromium and assigns a browser page to each worker, with the maximum number of tabs configurable.

Each worker navigates to a page, waits for it to load, then uses BeautifulSoup to extract its text and links on the same domain. `urljoin` resolves those links before they are added to the crawl queue. The crawler's worker, queue, extraction, and storage pieces are kept separate.

The queue can be an `asyncio.Queue` held in one process or a Redis-backed queue. The Redis design tracks pending and seen URLs alongside leased in-flight tasks. A worker reserves a task and acknowledges it after processing; if a lease expires, a URL can be processed again. This is not an exactly-once guarantee.

The local queue is process-local, while the Redis implementation keeps queue state in Redis. They share the queue role, but they are not interchangeable in persistence or failure behavior. The lease mechanism allows abandoned work to re-enter processing; it does not remove the possibility of duplicate visits or guarantee that every task is completed.

Extracted text is written to numbered `page_N.html` files. Despite the extension, these are not raw HTML snapshots. The project is licensed under Apache 2.0.

This is an early architecture prototype, not a turnkey crawler: `requirements.txt` is referenced but missing, `pyproject.toml` contains a script entry rather than complete dependency packaging, and the worker imports a missing `src.utils.clean` helper. Robots.txt handling, rate limiting, durable storage, and tests are also not implemented. Only crawl sites you are authorized to access; don't run it at scale without suitable robots.txt and rate-limit safeguards.
