---
title: "DeerFlow系列之一：从代码结构理解 SuperAgent Harness 的设计逻辑"
subtitle: ""
description: "本文深入解析了DeerFlow系列中的SuperAgent Harness代码架构与设计逻辑。通过剖析其组件交互、执行流程及模块化设计，揭示了该框架如何通过精简的抽象实现对智能代理的高效管理与调度，为开发者理解AI Agent自动化工作流的核心实现提供了详尽的技术参考。"
tags: ["DeerFlow", "SuperAgent", "AI Agent", "架构设计", "自动化工作流"]
readingTime: ""
date: "2026-04-04T08:37:38.554Z"
lastmod: "2026-04-04T08:37:38.554Z"
categories: ["技术专题"]
---
# DeerFlow 仓库目录全景解析：从代码结构理解 SuperAgent Harness 的设计逻辑

DeerFlow 是字节跳动开源的一个长视野 SuperAgent Harness。它并不是一个单纯的聊天机器人项目，也不是“前端 \+ 后端 \+ 调个大模型接口”的普通 AI 应用，而是一个围绕智能体运行时构建的平台型工程。这个仓库之所以值得研究，不只是因为它支持多模型、沙盒、记忆、技能、子代理、MCP 与多种接入方式，更重要的是它在目录设计上体现出了明显的工程边界、分层思路和扩展意识。理解这些目录的功能，本质上就是在理解 DeerFlow 的系统架构。

# 一、先看 DeerFlow 仓库的整体结构

从根目录出发，DeerFlow 的目录可以大体分成五类：第一类是平台基础设施相关目录，例如 .github、docker、scripts；第二类是核心运行时目录，也就是 backend；第三类是产品界面层，即 frontend；第四类是能力扩展层，也就是 skills；第五类是文档与配置层，例如 docs、README、config.example.yaml、extensions\_config.example.json 等。这样的结构说明，DeerFlow 从一开始就不是一个只为演示而写的样板项目，而是一个围绕“智能体平台化”来组织的工程。

# 二、顶层目录分别承担什么职责

* **.github** 目录是 GitHub 平台元配置目录，通常不直接参与业务逻辑，但对仓库治理非常重要。这里通常承载 CI 工作流、PR 模板、Issue 模板、自动化检查配置等内容。对于 DeerFlow 这类持续高速演进的开源项目来说，.github 的价值不在于功能实现，而在于维持代码质量、协作流程与社区治理秩序。  
* **docker** 目录负责容器化部署与运行支撑。DeerFlow 不只是调用模型，它还涉及文件系统、命令执行、隔离环境与线程级工作目录，因此 Docker 在这个仓库中不是附属品，而是运行时隔离能力的重要基础设施。这个目录通常包含开发态与生产态的容器编排逻辑、Sandbox 镜像支持、服务启动方式，以及 provisioner 或 Kubernetes 模式所需的额外配置。  
* **docs** 目录是项目级补充文档目录。README 往往负责给出总体介绍和快速上手，而 docs 更适合承载专题型内容，例如配置细节、架构图、Tracing、MCP 集成、文件上传、路径映射、计划模式等。对于学习型阅读，docs 的价值是帮你从“能跑”走向“看懂为什么这样设计”。  
* **frontend** 目录是 DeerFlow 的 Web 界面层，通常基于 Next.js 构建。这个目录的作用并不是提供核心智能体能力，而是把 backend 提供的 LangGraph Runtime 与 Gateway API 包装成用户可以直接使用的产品界面。聊天交互、线程展示、文件上传、Artifacts 下载、模型或技能状态呈现等，都属于 frontend 的职责。  
* **scripts** 目录是一组工程辅助脚本的集合。其职责通常包括环境检查、开发辅助、认证信息导出、测试数据导入、启动前预处理等。很多大型工程会在 scripts 中沉淀“开发者常做但不希望手工重复”的事情。DeerFlow 也一样，这个目录更偏工程效率，而不是业务能力本身。  
* **skills** 目录是 DeerFlow 特别有辨识度的目录。它并不是普通意义上的模板目录，而是智能体能力模块的仓库。DeerFlow 把很多高层任务能力通过 Skill 的形式组织起来，每个 Skill 通常由一个 SKILL.md 描述文件驱动，里面可以定义工作流说明、最佳实践、允许调用的工具等。  
* **backend** 目录是 DeerFlow 的核心目录，也是整个仓库最值得重点阅读的部分。这里包含了 Agent Runtime、Gateway API、Sandbox、Memory、Subagent、MCP、Skills 加载、配置系统与测试体系。可以说，DeerFlow 的“脑、手、脚、记忆和运行环境”几乎都在 backend 中实现。

# 三、顶层关键文件的作用

在根目录下，除了目录本身，几个关键文件也构成了仓库的认知入口。  
README.md 是主入口文档，负责介绍 DeerFlow 的定位、核心能力、启动方式和主要使用场景。README\_zh.md、README\_ja.md、README\_fr.md、README\_ru.md 则说明这个项目在社区传播上有明显的国际化意识。Install.md 更偏向于给编码代理或自动化安装流程使用，适合 Claude Code、Codex、Cursor 等工具快速接入。config.example.yaml 是主配置模板，决定模型、工具、Sandbox、Memory、Skills 与 Subagents 如何被装配。extensions\_config.example.json 则偏扩展能力配置，主要管理 MCP Servers 与 Skills 启用状态。Makefile 则统一了常见开发命令，是团队协作和本地开发体验的重要入口。

# 四、backend 为什么是 DeerFlow 的核心

如果说顶层目录是在告诉你“这个仓库包含哪些部分”，那么 backend 则是在回答“DeerFlow 真正是怎么工作的”。DeerFlow 的 backend 并不是一个传统的单层后端目录，而是进一步分成了 Harness 层和 App 层。Harness 层位于 packages/harness/deerflow，负责承载通用的智能体运行时内核；App 层位于 app，负责把这些能力暴露成 HTTP 服务和 IM 接入服务。这种拆分非常关键，因为它说明 DeerFlow 的作者不是在写一个只能服务本仓库前端的后端，而是在尝试构建一个可复用的 Agent Runtime 内核。  
更重要的是，这两层之间有明确依赖约束：app 可以依赖 deerflow，但 deerflow 不能反向依赖 app。这是很典型的“平台内核不能反向依赖产品壳层”的工程纪律。它让 DeerFlow 的核心能力具备被复用、被嵌入、被二次封装的可能性。

# 五、backend 顶层子目录分别做什么

* **backend/packages** 是后端 Python 包的承载目录。它的意义在于把核心逻辑做成真正意义上的 package，而不是一堆散落在应用层的脚本。  
* **backend/packages/harness** 是 DeerFlow 的引擎舱，承载了智能体运行时的主实现，包括 Agent、状态、中间件、工具、模型、MCP、Skills、Sandbox 等核心模块。  
* **backend/packages/harness/deerflow** 是 deerflow Python 包的根目录，也是命名空间的起点。目录下的每个子模块几乎都映射 DeerFlow 的一项关键能力。  
* **backend/app** 是应用层目录，作用是把 deerflow 内核包装成对外可用的服务接口。它不是智能体本身，而是让智能体被 Web 界面、IM 渠道和其他客户端调用的“壳层”。  
* **backend/tests** 是后端测试目录。除了常规单元测试与回归测试外，它还体现了 DeerFlow 的架构边界控制。一个项目重视什么，往往可以从 tests 中看得很清楚。  
* **backend/docs** 存放后端专题文档，包括架构、配置、API、上传、路径、计划模式、Memory Review 等内容。

# 六、packages/harness/deerflow 下的关键模块详解

* **agents** 目录是 Agent 系统的入口目录，负责组织主代理逻辑、线程状态、中间件链和与 Memory 等上下文机制的协作。可以说，这是 DeerFlow 的大脑区。  
* **agents/lead\_agent** 是主代理的具体实现目录。这里通常定义 make\_lead\_agent(config) 这样的工厂入口，用来组装模型、工具、系统提示词以及整个中间件链。它相当于 DeerFlow 的总控中心，是 LangGraph Runtime 的实际入口。  
* **agents/middlewares** 是 DeerFlow 架构中极其关键的一层。它把线程目录初始化、上传文件注入、Sandbox 获取、上下文压缩、Todo 跟踪、标题生成、记忆更新、视觉输入与澄清中断等横切能力，组织成一条清晰的执行链。  
* **agents/memory** 目录负责 DeerFlow 的跨会话记忆能力。它会从历史对话中抽取用户事实、偏好、上下文与长期信息，并以结构化方式写入本地存储。下一次对话时，这些信息又会被重新注入系统提示词。  
* **agents/thread\_state.py** 定义线程状态结构，是理解 DeerFlow 会话机制的关键。它扩展了基础 AgentState，增加 sandbox、artifacts、todos、title、thread\_data、viewed\_images 等字段。  
* **sandbox** 目录提供 DeerFlow 的可执行环境抽象。这里封装了命令执行、文件读写、目录列举、路径映射等能力。其意义在于：让 Agent 不只是会“回答”，还能够在受控环境中“做事”。  
* **sandbox/local** 是本地沙盒实现，通常用于开发和调试。它的优点是启动简单、调试方便，缺点是隔离性弱，因此更适合可信开发环境。  
* **subagents** 目录负责子代理机制。复杂任务往往不适合由单一代理一次性完成，因此 DeerFlow 通过子代理实现任务分解、并发执行、结果回收与归并。  
* **subagents/builtins** 存放官方内置的子代理类型，例如通用型子代理和 bash 专长型子代理。  
* **tools** 是 DeerFlow 的统一工具装配层。它负责把内置工具、配置工具、MCP 工具、子代理工具组合成 Agent 可调用的工具集合。  
* **tools/builtins** 是 DeerFlow 自带工具的目录，比如 present\_files、ask\_clarification、view\_image 等。这些工具有的偏文件呈现，有的偏交互控制，有的偏多模态支持。  
* **mcp** 目录负责与 Model Context Protocol 生态对接。它会管理 MCP Client、处理配置变更、缓存工具、接入 OAuth 与多种传输方式。对 DeerFlow 而言，mcp 是把外部能力接入系统的桥梁。  
* **models** 目录是模型工厂层。它根据配置动态创建不同的 LLM 实例，并处理 thinking、vision、provider 差异等能力。  
* **skills** 目录负责 Skill 的发现、解析、启停与系统提示词注入。它把 skills/public 和 skills/custom 中的能力定义统一纳入运行时，让 DeerFlow 的高层任务能力可以通过“文档化能力模块”的方式扩展。  
* **config** 目录负责解析 config.yaml，并管理路径、模型、工具、memory、sandbox 等配置项。它通常还承担配置缓存和配置变更检测职责，是整个系统的装配中心。  
* **community** 可以理解为“官方维护的扩展能力包”。这里通常放一些不属于最小内核、但在实际使用中非常常见的能力，例如 Tavily、Jina AI、Firecrawl、Image Search 和 AioSandboxProvider。  
* **reflection** 目录支持通过字符串路径动态导入变量或类，从而实现配置驱动的模型、工具与 provider 装配。  
* **utils** 是跨模块复用的通用工具集合。虽然它不承担主业务职责，但对减少重复代码、提高模块复用性很重要。  
* **client.py** 提供 DeerFlow 的嵌入式客户端能力，让你不必通过 HTTP 服务，也能在 Python 进程中直接调用 chat、stream、list\_models、upload\_files 等能力。

# 七、backend/app 下的两个关键方向

* **gateway** 是 DeerFlow 的管理平面，通常基于 FastAPI 实现。它提供模型管理、Memory 查询、技能管理、MCP 配置、文件上传、Artifacts 服务与线程清理等 API。要注意的是，gateway 不承担主推理执行，而是承载围绕智能体运行时的配套管理能力。  
* **channels** 是 DeerFlow 的多渠道接入层。它负责把 DeerFlow 接到 Slack、Telegram、Feishu/Lark 等消息渠道中，使智能体不只存在于 Web UI 中，也能以机器人或消息助手的形式出现在企业协同场景里。

# 八、frontend、skills、docker 分别代表什么

frontend 代表用户交互层，是 DeerFlow 面向终端用户的产品界面；skills 代表任务能力层，是 DeerFlow 对复杂任务做知识化、流程化封装的方式；docker 代表运行时隔离层，是让系统具备真实执行能力和安全边界的底层支撑。把这三层和 backend 对照起来看，你会发现 DeerFlow 的目录组织其实对应了一个很标准的平台结构：前台产品层、中台能力层、后台运行层、底层基础设施层。

# 九、如何根据目录快速进入 DeerFlow

如果你是从系统架构角度阅读，建议优先看 README、backend/CLAUDE.md 与 backend/docs/ARCHITECTURE.md；如果你想理解主执行链路，优先看 agents/lead\_agent、agents/middlewares 和 tools；如果你想评估 DeerFlow 是否真的能执行文件与命令，就去看 sandbox 与 docker；如果你关注能力扩展，就重点看 mcp、skills 和 community；如果你要做业务接入，则重点看 app/gateway、app/channels 和 frontend。

# 十、结语：为什么 DeerFlow 的目录值得认真研究

很多开源 Agent 项目在功能演示上很强，但目录结构混乱、模块边界模糊，读起来像一堆功能拼接。DeerFlow 则不同，它的目录设计明显体现出平台化意识：顶层负责产品与部署，backend/harness 负责运行时内核，backend/app 负责服务化出口，skills/mcp/subagents/sandbox 负责能力扩展与执行环境，frontend 负责最终交互界面。这种结构意味着 DeerFlow 不只是能跑，而且可扩展、可维护、可嵌入、可部署。  
因此，理解 DeerFlow 的目录，不只是为了知道每个文件夹装了什么，更是为了看清它怎样把智能体从一个简单的 LLM 调用器，演进成一个真正意义上的 SuperAgent Harness。


