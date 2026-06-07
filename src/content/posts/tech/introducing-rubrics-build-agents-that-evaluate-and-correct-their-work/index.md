---
title: "Introducing Rubrics: Build Agents that Evaluate and Correct Their Work"
description: "LangChain's `RubricMiddleware` for Deep Agents turns agent evaluation into an explicit loop: define a rubric, let the agent work, have a grader sub-agent evaluate the result, and f"
tags: ["AI", "公众号"]
date: "2026-06-07T01:24:28.170Z"
lastmod: "2026-06-07T01:24:28.170Z"
categories: ["tech"]
category: "tech"
lang: "zh"
source: "wechat"
origin: "everyday-ai-news"
image: "/images/posts/tech/introducing-rubrics-build-agents-that-evaluate-and-correct-their-work/x-cover-fdb0e104.png"
---

# Introducing Rubrics: Build Agents that Evaluate and Correct Their Work

LangChain's `RubricMiddleware` for Deep Agents turns agent evaluation into an explicit loop: define a rubric, let the agent work, have a grader sub-agent evaluate the result, and feed per-criterion feedback back into the conversation when the result falls short.

The problem is familiar. Some agent tasks have a clear definition of done. A refactor is done when tests pass. A report is done when every required section is covered. But agents often stop one step short, especially as context grows, instructions become ambiguous, tools are misused, or non-deterministic errors appear.

Rubrics make the completion standard explicit.

![Rubric-Guided Agent Correction Loop](./assets/infographic.png)

The middleware works by adding a grader loop on top of the base agent. Before the run finishes, a separate grader sub-agent checks the output against the rubric. If everything passes, the run ends. If something fails, the grader returns per-criterion feedback and the main agent gets another chance to fix the result.

The loop terminates with one of four states:

- `satisfied`
- `max_iterations_reached`
- `failed`
- `grader_error`

![Runtime Path: RubricMiddleware in the Agent Loop](./assets/article-image-01.png)

The minimal setup has three parts.

![RubricMiddleware Configuration Roles](./assets/article-image-02.png)

First, define `RubricMiddleware`:

```python
from deepagents import RubricMiddleware

rubric_middleware = RubricMiddleware(
    model="anthropic:claude-haiku-4-5",
    system_prompt="You are a code reviewer grading generated code against a rubric.",
    tools=[run_test_suite],
    max_iterations=5,
)
```

Second, attach it to a deep agent:

```python
from deepagents import create_deep_agent

agent = create_deep_agent(
    model="anthropic:claude-sonnet-4-6",
    system_prompt=(
        "You are a careful Python engineer. Write correct, readable code. "
        "Follow the user’s instructions exactly."
    ),
    middleware=[rubric_middleware],
)
```

Third, pass a user message and a rubric at invocation time:

```python
result = agent.invoke(
    {
        "messages": [...],
        "rubric": (
            "- All tests pass in run_test_suite\n"
            "- The function is named `find_duplicates` and accepts a single list argument\n"
        ),
    },
    config={"configurable": {"thread_id": "code-generation-session"}},
)
```

The strongest design choice is that the grader can call tools. In the LangChain example, the grader uses `run_test_suite` instead of only judging from text. The first agent attempt failed a test involving unhashable inputs. The grader returned targeted feedback, and the agent fixed the implementation on the second iteration.

This pattern is useful when correctness matters and the definition of done can be written as concrete checks. It is less useful when the rubric is vague, when the grader lacks evidence, or when each retry is too expensive to run without a strict iteration cap.

Practical starting point: choose one small task, write a rubric with 2-4 checkable criteria, give the grader one evidence tool, and set `max_iterations`. Then inspect whether the feedback actually helps the next agent attempt converge.

Source: LangChain Blog, "Introducing Rubrics: Build Agents that Evaluate and Correct Their Work", June 2, 2026.
