---
title: "Claude Code Dynamic Workflows: When an Agent Should Build Its Own Execution Harness"
description: "Claude Code now supports dynamic workflows: task-specific JavaScript workflows that can spawn and coordinate subagents, choose models, use isolated worktrees, verify outputs, and s"
tags: ["AI", "公众号"]
date: "2026-06-04T15:36:31.980Z"
lastmod: "2026-06-04T15:36:31.980Z"
categories: ["tech"]
category: "tech"
lang: "zh"
source: "wechat"
origin: "everyday-ai-news"
image: "/images/posts/tech/claude-code-dynamic-workflows-when-an-agent-should-build-its-own-execution-harness/x-cover-860fc11d.png"
---

# Claude Code Dynamic Workflows: When an Agent Should Build Its Own Execution Harness

Claude Code now supports dynamic workflows: task-specific JavaScript workflows that can spawn and coordinate subagents, choose models, use isolated worktrees, verify outputs, and synthesize results.

![Dynamic workflows infographic](./assets/infographic.png)

The core idea is simple. The default Claude Code harness works well for normal coding tasks, where one context window can plan, edit, run commands, and iterate. Longer and higher-risk tasks behave differently. They need parallel work, independent verification, explicit stop conditions, and protection against goal drift.

Anthropic describes three failure modes that dynamic workflows try to reduce:

- Agentic laziness: the agent stops after partial progress and declares the job done.
- Self-preferential bias: the same agent that produced an answer also grades it too generously.
- Goal drift: long sessions and compaction gradually lose edge-case requirements and constraints.

Dynamic workflows address these by separating roles. One agent can generate hypotheses, another can verify claims, another can synthesize structured outputs. The workflow coordinates them and keeps the task state outside any single subagent context.

Useful workflow patterns include:

- Classify-and-act: route work based on task type.
- Fan-out-and-synthesize: split many small tasks, then merge results.
- Adversarial verification: assign a separate verifier to challenge each output.
- Generate-and-filter: create many candidates, dedupe, then filter by rubric.
- Tournament: let several agents solve the same task and compare results pairwise.
- Loop until done: keep launching work until a stop condition is met.

The strongest use cases are migrations, deep research, factual verification, qualitative sorting, rule adherence checks, root-cause analysis, large-scale triage, lightweight evals, and model routing.

The boundary matters. Dynamic workflows use more tokens and add execution overhead. For ordinary small coding tasks, the default Claude Code harness is usually enough. Use workflows when the task is long-running, parallel, adversarial, evidence-heavy, or hard to validate inside one context window.

Source: Anthropic Claude Blog, "A harness for every task: dynamic workflows in Claude Code", published June 2, 2026.


## Source Image Reuse

The following images are reused from the Anthropic source article, including mechanism diagrams, workflow diagrams, and page images.

![原文配图 02](./assets/article-image-02.png)

![原文配图 03](./assets/article-image-03.png)

![原文配图 04](./assets/article-image-04.png)

![原文配图 05](./assets/article-image-05.png)

![原文配图 06](./assets/article-image-06.png)

![原文配图 07](./assets/article-image-07.png)

![原文配图 08](./assets/article-image-08.png)

![原文配图 09](./assets/article-image-09.png)

![原文配图 10](./assets/article-image-10.png)
