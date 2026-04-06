---
title: "DeerFlow系列之二：DeerFlow整体架构"
description: "本文详细解析了DeerFlow数据处理平台的整体架构，深入探讨了其核心组件、各层级功能设计及协同工作机制。通过对数据采集、处理、存储及应用层的系统性梳理，阐述了DeerFlow如何实现高效、稳定且可扩展的数据流转，为构建大规模实时数据处理系统提供了参考架构和工程实践指南。"
tags: ["DeerFlow", "数据架构", "实时计算", "系统设计", "技术专题"]
date: "2026-04-06T00:41:11.880Z"
lastmod: "2026-04-06T00:41:11.880Z"
categories: ["技术专题"]
---
# **DeerFlow 架构全景：完整版**

来源: [https://github.com/bytedance/deer-flow](https://github.com/bytedance/deer-flow)  
 日期: 2026-04-05  
 版本: DeerFlow 2.0

---

## **目录**

1. 项目概述  
2. 系统架构总览  
3. 核心模块详解  
4. 组件功能详解  
5. 开发指南  
6. 最佳实践  
7. 常见问题  
8. 参考资源

---

# **项目概述**

DeerFlow（Deep Exploration and Efficient Research Flow）是一个开源的**超级 Agent 框架**，通过编排**子 Agent**、**记忆系统**和**沙箱环境**来实现复杂任务，基于**可扩展技能系统**驱动。

## **核心特性**

* **子 Agent 系统**：支持创建和管理子 Agent，实现任务分解和并行处理  
* **记忆系统**：长期记忆存储与检索，支持上下文关联  
* **沙箱环境**：Docker 容器隔离，安全的代码执行环境  
* **技能扩展**：通过 SKILL.md 文件定义和加载技能  
* **MCP 集成**：支持 Model Context Protocol，可接入外部工具  
* **多模型支持**：兼容 OpenAI、Claude、DeepSeek 等多种模型

---

# **系统架构总览**

## **1\. 系统总览架构图**

\[mermaid\]  
flowchart TB  
    Client\["Client / Browser\<br/\>Web 用户、开发者、调用方"\]  
    IM\["IM Channels\<br/\>Feishu / Slack / Telegram"\]  
    Embedded\["Embedded Python Client\<br/\>DeerFlowClient"\]

    Nginx\["Nginx :2026\<br/\>统一反向代理入口"\]  
    Frontend\["Frontend :3000\<br/\>Next.js / React UI"\]  
    LangGraph\["LangGraph Server :2024\<br/\>Agent Runtime / Thread Mgmt / SSE / Checkpointing"\]  
    Gateway\["Gateway API :8001\<br/\>FastAPI 管理平面 / REST API"\]  
    Provisioner\["Provisioner :8002\<br/\>可选，Kubernetes / Provisioner 模式沙盒"\]

    Client \--\> Nginx  
    IM \--\> Nginx  
    Embedded \--\> Gateway

    Nginx \--\>|/api/langgraph/\*| LangGraph  
    Nginx \--\>|/api/\*| Gateway  
    Nginx \--\>|/\*| Frontend

    LangGraph \--\>|"共享 config.yaml"| Config\["config.yaml"\]  
    Gateway \--\>|"共享 config.yaml"| Config  
    LangGraph \--\>|"共享 extensions\_config.json"| ExtConfig\["extensions\_config.json"\]  
    Gateway \--\>|"共享 extensions\_config.json"| ExtConfig

    subgraph Backend\["Backend (packages/harness/deerflow/)"\]  
        Agents\["agents/\<br/\>Lead Agent / ThreadState / Middlewares / Memory"\]  
        Sandbox\["sandbox/\<br/\>Sandbox 抽象 / LocalSandbox / AioSandbox"\]  
        Subagents\["subagents/\<br/\>子代理注册、执行、并发控制"\]  
        Tools\["tools/\<br/\>内置工具 / 工具装配"\]  
        MCP\["mcp/\<br/\>MCP Client / Cache / OAuth / Tool Loading"\]  
        Skills\["skills/\<br/\>SKILL.md 发现 / 解析 / 注册"\]  
        Memory\["memory/\<br/\>用户记忆存储 / 抽取 / 注入"\]  
        Models\["models/\<br/\>多模型工厂 / Provider 适配"\]  
    end

    LangGraph \--\> Backend  
    Gateway \--\> Backend  
    Provisioner \--\> Backend  
\[/mermaid\]  
---

## **2\. 整体架构图（简化版）**

\[mermaid\]  
flowchart TB  
    subgraph Client\["客户端"\]  
    end

    subgraph Nginx\["Nginx (Port 2026\) \- 统一反向代理入口"\]  
        direction TB  
        A\["/api/langgraph/\* → LangGraph Server (2024)"\]  
        B\["/api/\* → Gateway API (8001)"\]  
        C\["/\* → Frontend (3000)"\]  
    end

    subgraph Backend\["Backend"\]  
        LG\["LangGraph Server\<br/\>Agent Runtime"\]  
        GW\["Gateway API\<br/\>管理平面"\]  
        FS\["Frontend\<br/\>Next.js 15 \+ React 19"\]  
    end

    subgraph Core\["核心组件"\]  
        Agent\["Lead Agent\<br/\>主控智能体"\]  
        Sandbox\["Sandbox\<br/\>Docker 容器"\]  
        Memory\["Memory\<br/\>长期记忆"\]  
        MCP\["MCP\<br/\>工具协议"\]  
        Skills\["Skills\<br/\>技能系统"\]  
        SubAgent\["SubAgent\<br/\>子代理系统"\]  
    end

    Client \--\> Nginx  
    Nginx \--\> Backend  
    Backend \--\> Core  
\[/mermaid\]  
---

## **3\. 后端内核分层图**

flowchart LR  
    subgraph Backend\["backend/"\]  
        subgraph Harness\["packages/harness/deerflow/  (deerflow.\*)"\]  
            Agents\["agents/\<br/\>Lead Agent / ThreadState / Middlewares / Memory"\]  
            Sandbox\["sandbox/\<br/\>Sandbox 抽象 / LocalSandbox / AioSandbox"\]  
            Subagents\["subagents/\<br/\>子代理注册、执行、并发控制"\]  
            Tools\["tools/\<br/\>内置工具 / 工具装配"\]  
            MCP\["mcp/\<br/\>MCP Client / Cache / OAuth / Tool Loading"\]  
            Skills\["skills/\<br/\>SKILL.md 发现 / 解析 / 注册"\]  
            Memory\["memory/\<br/\>用户记忆存储 / 抽取 / 注入"\]  
            Models\["models/\<br/\>多模型工厂 / Provider 适配"\]  
            Reflection\["reflection/\<br/\>配置驱动的类/变量解析"\]  
        end

        subgraph App\["app/"\]  
            API\["FastAPI Gateway\<br/\>REST API / 文件上传 / MCP管理"\]  
            Channels\["channels/\<br/\>Feishu / Slack / Telegram 适配"\]  
            Provisioner\["provisioner/\<br/\>Kubernetes / Docker Provisioner"\]  
            Static\["static/\<br/\>静态文件服务"\]  
        end  
    end

---

## **4\. 标准运行模式详细图**

flowchart TB  
    User\["用户"\]  
    WebUI\["Frontend UI"\]  
    Nginx\["Nginx"\]  
    LG\["LangGraph Server"\]  
    GA\["Gateway API"\]

    User \--\> WebUI  
    WebUI \--\> Nginx  
    Nginx \--\>|聊天 / 线程 / SSE| LG  
    Nginx \--\>|上传 / 技能 / MCP / Memory / Artifacts| GA

    GA \--\>|共享配置| CFG\["config.yaml"\]  
    GA \--\>|共享扩展配置| EXTCFG\["extensions\_config.json"\]  
    LG \--\>|共享配置| CFG  
    LG \--\>|共享扩展配置| EXTCFG

    subgraph Runtime\["Agent Runtime"\]  
        MW\["Middleware Chain"\]  
        Agent\["Lead Agent"\]  
        Tools\["Tools"\]  
        Sandbox\["Sandbox"\]  
        Memory\["Memory"\]  
    end

    LG \--\> Runtime  
    GA \--\>|非运行时管理| CFG  
    GA \--\>|非运行时管理| EXTCFG

---

## **5\. Gateway Mode（实验模式）图**

页面对应的开发说明里还提到 **Gateway mode**：此时 Agent Runtime 嵌入 Gateway，不再单独启 LangGraph 进程。

flowchart TB  
    User\["用户 / 前端"\]  
    Nginx\["Nginx :2026"\]  
    Frontend\["Frontend :3000"\]  
    Gateway\["Gateway :8001\<br/\>内嵌 Agent Runtime"\]

    Runtime\["RunManager / run\_agent / StreamBridge"\]  
    GatewayAPI\["REST API"\]  
    Agent\["Lead Agent Runtime"\]

    User \--\> Nginx  
    Nginx \--\>|/\*| Frontend  
    Nginx \--\>|/api/langgraph/\*| Gateway  
    Nginx \--\>|/api/\*| Gateway

    subgraph GatewayInternal\["Gateway 内部"\]  
        GatewayAPI  
        Runtime  
        Agent  
    end

    GatewayAPI \--\> Runtime  
    Runtime \--\> Agent

---

## **6\. Lead Agent 执行链路图**

flowchart TB  
    Entry\["make\_lead\_agent(config)"\]  
    ThreadState\["ThreadState\<br/\>messages / sandbox / artifacts / thread\_data / title / todos / viewed\_images"\]  
    MW\["Middleware Chain"\]  
    Prompt\["System Prompt\<br/\>skills \+ memory \+ subagent instructions"\]  
    Model\["create\_chat\_model()\<br/\>thinking / vision / provider adapter"\]  
    Tools\["get\_available\_tools()\<br/\>sandbox \+ built-in \+ community \+ MCP \+ subagent"\]  
    Response\["SSE Streaming Response"\]

    Entry \--\> ThreadState  
    ThreadState \--\> MW  
    MW \--\> Prompt  
    Prompt \--\> Model  
    Model \--\> Tools  
    Tools \--\> Response

---

## **7\. Middleware 详细顺序图**

sequenceDiagram  
    participant Client as 客户端  
    participant Nginx  
    participant LGS as LangGraph Server  
    participant MW as 中间件链  
    participant Agent as Agent  
    participant Sandbox as 沙箱

    Client-\>\>Nginx: POST /api/langgraph/threads/{thread\_id}/runs  
    Nginx-\>\>LGS: 代理请求

    LGS-\>\>LGS: a. 加载/创建 thread 状态  
    LGS-\>\>MW: b. 中间件链预处理

    Note over MW: 1\. ThreadDataMiddleware\<br/\>初始化 workspace/uploads/outputs  
    Note over MW: 2\. UploadsMiddleware\<br/\>处理上传文件  
    Note over MW: 3\. SandboxMiddleware\<br/\>获取/创建沙箱  
    Note over MW: 4\. DanglingToolCallMiddleware\<br/\>处理悬空工具调用  
    Note over MW: 5\. GuardrailMiddleware\<br/\>安全护栏检查  
    Note over MW: 6\. SummarizationMiddleware\<br/\>上下文压缩（可选）  
    Note over MW: 7\. TodoListMiddleware\<br/\>任务跟踪  
    Note over MW: 8\. TitleMiddleware\<br/\>自动生成标题  
    Note over MW: 9\. MemoryMiddleware\<br/\>记忆注入/更新  
    Note over MW: 10\. ViewImageMiddleware\<br/\>视觉模型支持  
    Note over MW: 11\. SubagentLimitMiddleware\<br/\>子代理并发限制  
    Note over MW: 12\. ClarificationMiddleware\<br/\>处理澄清请求

    MW-\>\>Agent: c. 执行 Agent  
    Agent-\>\>Sandbox: d. 工具调用  
    Sandbox--\>\>Agent: e. 返回结果  
    Agent--\>\>LGS: f. 流式响应  
    LGS--\>\>Nginx: g. SSE 流  
    Nginx--\>\>Client: h. 流式返回

---

## **8\. Tool System 架构图**

flowchart LR  
    ConfigTools\["Config-defined Tools\<br/\>config.yaml"\]  
    Builtins\["Built-in Tools\<br/\>present\_files / ask\_clarification / view\_image"\]  
    SandboxTools\["Sandbox Tools\<br/\>bash / ls / read\_file / write\_file / str\_replace"\]  
    CommunityTools\["Community Tools\<br/\>tavily / jina\_ai / firecrawl / image\_search"\]  
    MCPTools\["MCP Tools\<br/\>MultiServerMCPClient 加载"\]  
    SubagentTool\["Subagent Tool\<br/\>task()"\]

    Assembler\["get\_available\_tools()"\]

    Agent\["Lead Agent"\]

    ConfigTools \--\> Assembler  
    Builtins \--\> Assembler  
    SandboxTools \--\> Assembler  
    CommunityTools \--\> Assembler  
    MCPTools \--\> Assembler  
    SubagentTool \--\> Assembler

    Assembler \--\> Agent

---

## **9\. Sandbox 体系图**

flowchart TB  
    Provider\["SandboxProvider\<br/\>acquire / get / release"\]  
    Sandbox\["Sandbox 抽象\<br/\>execute\_command / read\_file / write\_file / list\_dir"\]

    Local\["LocalSandboxProvider\<br/\>本地文件系统 / 开发态"\]  
    Aio\["AioSandboxProvider\<br/\>Docker 隔离执行"\]  
    Prov\["Provisioner Mode\<br/\>Docker \+ Kubernetes Pods"\]

    Provider \--\> Sandbox  
    Sandbox \--\> Local  
    Sandbox \--\> Aio  
    Sandbox \--\> Prov

    subgraph Paths\["虚拟路径映射"\]  
        V1\["/mnt/user-data/workspace"\]  
        V2\["/mnt/user-data/uploads"\]  
        V3\["/mnt/user-data/outputs"\]  
        V4\["/mnt/skills"\]  
    end

    Sandbox \--\> Paths

---

## **10\. Subagent 架构图**

flowchart TB  
    Lead\["Lead Agent"\]  
    TaskTool\["task() 工具"\]  
    Executor\["SubagentExecutor"\]  
    Scheduler\["Scheduler Pool (3)"\]  
    Workers\["Execution Pool (3)"\]  
    Builtins\["Built-in Subagents\<br/\>general-purpose / bash"\]  
    Events\["Events\<br/\>task\_started / running / completed / failed / timed\_out"\]  
    Result\["聚合结果返回 Lead Agent"\]

    Lead \--\> TaskTool  
    TaskTool \--\> Executor  
    Executor \--\> Scheduler  
    Scheduler \--\> Workers  
    Workers \--\> Builtins  
    Workers \--\> Events  
    Events \--\> Result  
    Result \--\> Lead

---

## **11\. Memory System 架构图**

flowchart TB  
    Conv\["用户消息 \+ 最终 AI 响应"\]  
    MW\["MemoryMiddleware"\]  
    Queue\["Debounced Queue\<br/\>queue.py"\]  
    Updater\["updater.py\<br/\>LLM 抽取用户上下文 / 事实 / 偏好"\]  
    Store\["backend/.deer-flow/memory.json"\]  
    Inject\["下次对话注入 memory 到 system prompt"\]

    Conv \--\> MW  
    MW \--\> Queue  
    Queue \--\> Updater  
    Updater \--\> Store  
    Store \--\> Inject

---

## **12\. MCP 与 Skills 架构图**

flowchart LR  
    ExtCfg\["extensions\_config.json"\]  
    MCPServers\["MCP Servers\<br/\>stdio / SSE / HTTP / OAuth"\]  
    MCPClient\["MultiServerMCPClient\<br/\>lazy init \+ cache invalidation"\]  
    MCPTools\["MCP Tools"\]

    SkillsDir\["skills/public \+ skills/custom"\]  
    SkillLoader\["load\_skills()\<br/\>扫描 SKILL.md / 解析 frontmatter"\]  
    SkillState\["Skills Enabled State"\]  
    Prompt\["注入到 System Prompt"\]

    ExtCfg \--\> MCPServers  
    MCPServers \--\> MCPClient  
    MCPClient \--\> MCPTools

    SkillsDir \--\> SkillLoader  
    SkillLoader \--\> SkillState  
    SkillState \--\> Prompt

---

## **13\. Gateway API 路由图**

flowchart TB  
    Gateway\["Gateway API :8001"\]

    Models\["/api/models\<br/\>模型列表 / 详情"\]  
    MCP\["/api/mcp\<br/\>MCP 配置读取 / 更新"\]  
    Skills\["/api/skills\<br/\>技能列表 / 启停 / 安装"\]  
    Memory\["/api/memory\<br/\>记忆数据 / 配置 / 状态 / reload"\]  
    Uploads\["/api/threads/{id}/uploads\<br/\>文件上传 / 列表 / 删除"\]  
    Threads\["/api/threads/{id}\<br/\>本地线程数据清理"\]  
    Artifacts\["/api/threads/{id}/artifacts\<br/\>产物下载 / 服务"\]  
    Suggestions\["/api/threads/{id}/suggestions\<br/\>跟进建议生成"\]

    Gateway \--\> Models  
    Gateway \--\> MCP  
    Gateway \--\> Skills  
    Gateway \--\> Memory  
    Gateway \--\> Uploads  
    Gateway \--\> Threads  
    Gateway \--\> Artifacts  
    Gateway \--\> Suggestions

---

## **14\. IM Channels 架构图**

flowchart TB  
    Feishu\["Feishu / Lark"\]  
    Slack\["Slack"\]  
    Telegram\["Telegram"\]

    Base\["Channel Base"\]  
    Bus\["message\_bus.py\<br/\>Inbound / Outbound pub-sub"\]  
    Manager\["manager.py\<br/\>线程创建 / 命令路由 / run 调度"\]  
    Store\["store.py\<br/\>channel:chat\[:topic\] \-\> thread\_id"\]  
    LangGraph\["LangGraph Server"\]  
    Gateway\["Gateway API"\]

    Feishu \--\> Base  
    Slack \--\> Base  
    Telegram \--\> Base

    Base \--\> Bus  
    Bus \--\> Manager  
    Manager \--\> Store  
    Store \--\> LangGraph  
    Manager \--\> Gateway

---

## **15\. 前端架构图**

flowchart TB  
    subgraph Frontend\["Frontend (Next.js 15 \+ React 19)"\]  
        Pages\["页面组件"\]  
        Components\["UI 组件"\]  
        Hooks\["自定义 Hooks"\]  
        State\["状态管理"\]  
        API\["API 客户端"\]  
    end

    subgraph Pages\["页面"\]  
        Chat\["聊天页面"\]  
        Threads\["线程列表"\]  
        Settings\["设置页面"\]  
    end

    subgraph Components\["核心组件"\]  
        ChatUI\["ChatUI"\]  
        ThreadList\["ThreadList"\]  
        ArtifactViewer\["ArtifactViewer"\]  
        CodeBlock\["CodeBlock"\]  
    end

    subgraph Hooks\["自定义 Hooks"\]  
        useChat\["useChat"\]  
        useThread\["useThread"\]  
        useArtifact\["useArtifact"\]  
    end

    subgraph State\["状态管理"\]  
        ThreadState\["Thread State"\]  
        MessageState\["Message State"\]  
        ArtifactState\["Artifact State"\]  
    end

    Pages \--\> Components  
    Components \--\> Hooks  
    Hooks \--\> State  
    State \--\> API

---

## **16\. 部署架构图**

flowchart TB  
    subgraph Docker\["Docker Compose"\]  
        Nginx\["Nginx :2026"\]  
        Frontend\["Frontend :3000"\]  
        LangGraph\["LangGraph :2024"\]  
        Gateway\["Gateway :8001"\]  
        Redis\["Redis (可选)"\]  
    end

    subgraph Volumes\["数据卷"\]  
        Config\["配置文件"\]  
        Memory\["记忆数据"\]  
        Threads\["线程数据"\]  
        Skills\["技能文件"\]  
    end

    subgraph External\["外部服务"\]  
        LLM\["LLM API\<br/\>OpenAI / Claude / DeepSeek"\]  
        MCP\["MCP Servers"\]  
    end

    Nginx \--\> Frontend  
    Nginx \--\> LangGraph  
    Nginx \--\> Gateway

    LangGraph \--\> Volumes  
    Gateway \--\> Volumes  
    LangGraph \--\> LLM  
    Gateway \--\> MCP

---

## **17\. 配置热更新流程图**

flowchart TB  
    ConfigFile\["config.yaml / extensions\_config.json"\]  
    Watcher\["File Watcher\<br/\>监控 mtime 变化"\]  
    Event\["变更事件"\]  
    Reload\["配置重载"\]  
    Cache\["缓存失效"\]  
    Runtime\["运行时更新"\]

    ConfigFile \--\> Watcher  
    Watcher \--\> Event  
    Event \--\> Reload  
    Reload \--\> Cache  
    Cache \--\> Runtime

    subgraph Updates\["更新内容"\]  
        U1\["MCP Servers 状态"\]  
        U2\["Skills 启用状态"\]  
        U3\["模型配置"\]  
        U4\["工具配置"\]  
    end

    Runtime \--\> Updates

---

# **核心模块详解**

## **1\. Agent 架构**

### **1.1 Lead Agent（主 Agent）**

**入口**: `lead_agent/agent.py:make_lead_agent(config)`

**核心职责**:

* Agent 创建和配置  
* Thread 状态管理  
* 中间件链执行  
* 工具调用编排  
* SSE 流式响应

**代码示例**:

def make\_lead\_agent(config: dict) \-\> CompiledGraph:  
    """创建 Lead Agent"""  
    \# 1\. 创建模型  
    model \= create\_chat\_model(config)  
      
    \# 2\. 获取工具  
    tools \= get\_available\_tools(config)  
      
    \# 3\. 构建系统提示  
    system\_prompt \= build\_system\_prompt(config)  
      
    \# 4\. 创建 Agent  
    agent \= create\_react\_agent(  
        model=model,  
        tools=tools,  
        state\_modifier=system\_prompt  
    )  
      
    return agent

### **1.2 中间件链**

执行顺序：

| 序号 | 中间件 | 功能 |
| ----- | ----- | ----- |
| 1 | ThreadDataMiddleware | 初始化 workspace/uploads/outputs 路径 |
| 2 | UploadsMiddleware | 处理上传的文件 |
| 3 | SandboxMiddleware | 获取沙箱环境 |
| 4 | DanglingToolCallMiddleware | 处理悬空工具调用 |
| 5 | GuardrailMiddleware | 安全护栏检查 |
| 6 | SummarizationMiddleware | 上下文压缩（可选） |
| 7 | TodoListMiddleware | 任务跟踪（plan\_mode 模式） |
| 8 | TitleMiddleware | 自动生成对话标题 |
| 9 | MemoryMiddleware | 记忆注入与更新 |
| 10 | ViewImageMiddleware | 视觉模型支持 |
| 11 | SubagentLimitMiddleware | 子代理并发限制 |
| 12 | ClarificationMiddleware | 处理澄清请求 |

### **1.3 Thread State（线程状态）**

class ThreadState(AgentState):  
    \# AgentState 核心状态  
    messages: list\[BaseMessage\]  
      
    \# DeerFlow 扩展  
    sandbox: dict             \# 沙箱环境信息  
    artifacts: list\[str\]      \# 生成的文件路径  
    thread\_data: dict         \# {workspace, uploads, outputs} 路径  
    title: str | None         \# 自动生成的对话标题  
    todos: list\[dict\]         \# 任务跟踪（plan mode）  
    viewed\_images: dict       \# 视觉模型图像数据  
    uploaded\_files: list      \# 上传的文件列表

---

## **2\. 沙箱系统**

### **2.1 架构设计**

classDiagram  
    class SandboxProvider {  
        \<\<abstract\>\>  
        \+acquire()  
        \+get()  
        \+release()  
    }

    class LocalSandboxProvider {  
        \-instance: LocalSandboxProvider  
        \- 单例模式  
        \- 直接执行  
        \- 开发环境使用  
    }

    class AioSandboxProvider {  
        \- 基于 Docker  
        \- 容器隔离  
        \- 生产环境使用  
    }

    SandboxProvider \<|-- LocalSandboxProvider  
    SandboxProvider \<|-- AioSandboxProvider

### **2.2 虚拟路径映射**

| 虚拟路径 | 物理路径 |
| ----- | ----- |
| `/mnt/user-data/workspace` | `backend/.deer-flow/threads/{thread_id}/user-data/workspace` |
| `/mnt/user-data/uploads` | `backend/.deer-flow/threads/{thread_id}/user-data/uploads` |
| `/mnt/user-data/outputs` | `backend/.deer-flow/threads/{thread_id}/user-data/outputs` |
| `/mnt/skills` | `deer-flow/skills/` |

### **2.3 Sandbox 抽象接口**

class Sandbox(ABC):  
    @abstractmethod  
    async def execute\_command(  
        self,   
        command: str,   
        cwd: str | None \= None  
    ) \-\> CommandResult:  
        """执行命令"""  
        pass

    @abstractmethod  
    async def read\_file(self, path: str) \-\> str:  
        """读取文件"""  
        pass

    @abstractmethod  
    async def write\_file(self, path: str, content: str) \-\> None:  
        """写入文件"""  
        pass

    @abstractmethod  
    async def list\_dir(self, path: str) \-\> list\[str\]:  
        """列出目录"""  
        pass

---

## **3\. 工具系统**

### **3.1 工具来源**

flowchart LR  
    subgraph Sources\["工具来源"\]  
        BuiltIn\["Built-in Tools\<br/\>- present\_file\<br/\>- ask\_clarification\<br/\>- view\_image"\]  
        Configured\["Configured Tools\<br/\>(config.yaml)\<br/\>- web\_search\<br/\>- web\_fetch\<br/\>- bash\<br/\>- read\_file\<br/\>- write\_file\<br/\>- str\_replace\<br/\>- ls"\]  
        MCP\["MCP Tools\<br/\>(extensions.json)\<br/\>- github\<br/\>- filesystem\<br/\>- postgres\<br/\>- brave-search\<br/\>- puppeteer\<br/\>- ..."\]  
    end

    subgraph Assembly\["工具装配"\]  
        Loader\["Tool Loader"\]  
        Validator\["Tool Validator"\]  
        Registry\["Tool Registry"\]  
    end

    subgraph Execution\["工具执行"\]  
        Agent\["Lead Agent"\]  
        Sandbox\["Sandbox"\]  
        External\["External API"\]  
    end

    Sources \--\> Assembly  
    Assembly \--\> Execution

### **3.2 工具配置示例**

tools:  
  built\_in:  
    \- present\_file  
    \- ask\_clarification  
    \- view\_image  
    
  sandbox:  
    \- bash  
    \- read\_file  
    \- write\_file  
    \- str\_replace  
    \- ls  
    
  community:  
    tavily:  
      enabled: true  
      api\_key: $TAVILY\_API\_KEY  
    jina\_ai:  
      enabled: true  
      api\_key: $JINA\_API\_KEY

### **3.3 工具装配流程**

def get\_available\_tools(config: dict) \-\> list\[BaseTool\]:  
    """获取所有可用工具"""  
    tools \= \[\]  
      
    \# 1\. 内置工具  
    tools.extend(get\_builtin\_tools())  
      
    \# 2\. 沙箱工具  
    tools.extend(get\_sandbox\_tools(config))  
      
    \# 3\. 社区工具  
    tools.extend(get\_community\_tools(config))  
      
    \# 4\. MCP 工具  
    tools.extend(get\_mcp\_tools(config))  
      
    \# 5\. 子代理工具  
    tools.append(get\_subagent\_tool(config))  
      
    return tools

---

## **4\. 模型工厂**

### **4.1 配置示例**

models:  
  \- name: gpt-4  
    display\_name: GPT-4  
    use: langchain\_openai:ChatOpenAI  
    model: gpt-4  
    api\_key: $OPENAI\_API\_KEY  
    max\_tokens: 4096  
    supports\_thinking: false  
    supports\_vision: true  
    
  \- name: claude-3-opus  
    display\_name: Claude 3 Opus  
    use: langchain\_anthropic:ChatAnthropic  
    model: claude-3-opus-20240229  
    api\_key: $ANTHROPIC\_API\_KEY  
    max\_tokens: 4096  
    supports\_thinking: true  
    supports\_vision: true  
    
  \- name: deepseek-v3  
    display\_name: DeepSeek V3  
    use: langchain\_deepseek:ChatDeepSeek  
    model: deepseek-chat  
    api\_key: $DEEPSEEK\_API\_KEY  
    max\_tokens: 4096  
    supports\_thinking: false  
    supports\_vision: false

### **4.2 支持的 Provider**

| Provider | 类路径 | 特性 |
| ----- | ----- | ----- |
| OpenAI | `langchain_openai:ChatOpenAI` | Vision, Responses API |
| Anthropic | `langchain_anthropic:ChatAnthropic` | Thinking, Vision |
| DeepSeek | `langchain_deepseek:ChatDeepSeek` | Thinking |
| 自定义 | 自定义类路径 | 可扩展 |

### **4.3 模型工厂代码**

def create\_chat\_model(config: dict) \-\> BaseChatModel:  
    """创建聊天模型"""  
    model\_config \= config\["model"\]  
      
    \# 1\. 解析类  
    model\_class \= resolve\_class(model\_config\["use"\])  
      
    \# 2\. 解析变量  
    api\_key \= resolve\_variable(model\_config\["api\_key"\])  
      
    \# 3\. 创建实例  
    model \= model\_class(  
        model=model\_config\["model"\],  
        api\_key=api\_key,  
        max\_tokens=model\_config.get("max\_tokens", 4096\)  
    )  
      
    return model

---

## **5\. MCP 集成**

### **5.1 配置示例**

{  
  "mcpServers": {  
    "github": {  
      "enabled": true,  
      "type": "stdio",  
      "command": "npx",  
      "args": \["-y", "@modelcontextprotocol/server-github"\],  
      "env": {"GITHUB\_TOKEN": "$GITHUB\_TOKEN"}  
    },  
    "filesystem": {  
      "enabled": true,  
      "type": "stdio",  
      "command": "npx",  
      "args": \["-y", "@modelcontextprotocol/server-filesystem", "/path/to/dir"\]  
    },  
    "postgres": {  
      "enabled": true,  
      "type": "stdio",  
      "command": "npx",  
      "args": \["-y", "@modelcontextprotocol/server-postgres"\],  
      "env": {"DATABASE\_URL": "$DATABASE\_URL"}  
    },  
    "brave-search": {  
      "enabled": true,  
      "type": "stdio",  
      "command": "npx",  
      "args": \["-y", "@modelcontextprotocol/server-brave-search"\],  
      "env": {"BRAVE\_API\_KEY": "$BRAVE\_API\_KEY"}  
    },  
    "puppeteer": {  
      "enabled": true,  
      "type": "stdio",  
      "command": "npx",  
      "args": \["-y", "@modelcontextprotocol/server-puppeteer"\]  
    }  
  }  
}

### **5.2 传输协议**

| 协议 | 描述 | 使用场景 |
| ----- | ----- | ----- |
| stdio | 标准输入输出 | 本地进程通信 |
| SSE | Server-Sent Events | HTTP 长连接 |
| HTTP | HTTP 请求 | REST API |

### **5.3 MCP 客户端架构**

class MultiServerMCPClient:  
    """多服务器 MCP 客户端"""  
      
    def \_\_init\_\_(self, config: dict):  
        self.servers: dict\[str, MCPServer\] \= {}  
        self.tools: dict\[str, list\[Tool\]\] \= {}  
        self.\_cache: dict\[str, Any\] \= {}  
      
    async def connect(self, server\_name: str) \-\> None:  
        """连接到 MCP 服务器"""  
        server\_config \= self.config\["mcpServers"\]\[server\_name\]  
          
        if server\_config\["type"\] \== "stdio":  
            server \= StdioMCPServer(server\_config)  
        elif server\_config\["type"\] \== "sse":  
            server \= SSEMCPServer(server\_config)  
        elif server\_config\["type"\] \== "http":  
            server \= HTTPMCPServer(server\_config)  
          
        self.servers\[server\_name\] \= server  
        self.tools\[server\_name\] \= await server.list\_tools()  
      
    async def call\_tool(  
        self,   
        server\_name: str,   
        tool\_name: str,   
        arguments: dict  
    ) \-\> Any:  
        """调用 MCP 工具"""  
        server \= self.servers\[server\_name\]  
        return await server.call\_tool(tool\_name, arguments)

---

## **6\. 技能系统**

### **6.1 SKILL.md 格式**

\---  
name: code-review  
description: 代码审查技能  
version: 1.0.0  
author: developer  
tags: \[code, review, quality\]  
tools: \[read\_file, bash\]  
\---

\# Code Review Skill

你是一个专业的代码审查助手。

\#\# 审查流程

1\. 读取代码文件  
2\. 分析代码质量  
3\. 提供改进建议

\#\# 关注点

\- 代码风格  
\- 潜在 bug  
\- 性能问题  
\- 安全隐患

### **6.2 技能加载流程**

flowchart TB  
    Scan\["扫描 skills/ 目录"\]  
    Parse\["解析 SKILL.md"\]  
    Validate\["验证 frontmatter"\]  
    Register\["注册到系统"\]  
    Inject\["注入到 System Prompt"\]

    Scan \--\> Parse  
    Parse \--\> Validate  
    Validate \--\> Register  
    Register \--\> Inject

### **6.3 技能配置**

skills:  
  directories:  
    \- skills/public  
    \- skills/custom  
    
  enabled:  
    \- code-review  
    \- documentation  
    \- testing  
    
  disabled:  
    \- deprecated-skill

---

## **7\. 记忆系统**

### **7.1 架构设计**

flowchart TB  
    subgraph Input\["输入"\]  
        UserMsg\["用户消息"\]  
        AIResp\["AI 响应"\]  
    end

    subgraph Processing\["处理"\]  
        Extract\["信息抽取"\]  
        Struct\["结构化"\]  
        Merge\["合并到现有记忆"\]  
    end

    subgraph Storage\["存储"\]  
        JSON\["memory.json"\]  
        Backup\["备份"\]  
    end

    subgraph Usage\["使用"\]  
        Inject\["注入到 Prompt"\]  
        Context\["提供上下文"\]  
    end

    Input \--\> Processing  
    Processing \--\> Storage  
    Storage \--\> Usage

### **7.2 记忆数据结构**

{  
  "user\_context": {  
    "preferences": \["使用 Python", "偏好简洁代码"\],  
    "facts": \["项目使用 FastAPI", "团队有 5 人"\],  
    "history\_summary": "用户正在进行 API 开发"  
  },  
  "last\_updated": "2026-04-05T12:00:00Z"  
}

### **7.3 记忆更新流程**

class MemoryUpdater:  
    """记忆更新器"""  
      
    def \_\_init\_\_(self, llm: BaseChatModel):  
        self.llm \= llm  
        self.queue \= DebouncedQueue(delay=5.0)  
      
    async def update(self, messages: list\[BaseMessage\]) \-\> None:  
        """更新记忆"""  
        \# 1\. 加入队列（防抖）  
        await self.queue.put(messages)  
          
        \# 2\. LLM 抽取信息  
        extracted \= await self.\_extract\_info(messages)  
          
        \# 3\. 合并到现有记忆  
        memory \= await self.\_load\_memory()  
        memory \= self.\_merge(memory, extracted)  
          
        \# 4\. 保存  
        await self.\_save\_memory(memory)  
      
    async def \_extract\_info(self, messages: list\[BaseMessage\]) \-\> dict:  
        """使用 LLM 抽取信息"""  
        prompt \= f"""  
        从以下对话中抽取用户偏好、事实和上下文信息：  
          
        {messages}  
          
        以 JSON 格式返回结果。  
        """  
        response \= await self.llm.ainvoke(prompt)  
        return json.loads(response.content)

---

## **8\. 子代理系统**

### **8.1 架构设计**

flowchart TB  
    subgraph Lead\["Lead Agent"\]  
        TaskTool\["task() 工具"\]  
    end

    subgraph Executor\["SubagentExecutor"\]  
        Scheduler\["调度器"\]  
        Pool\["执行池 (3)"\]  
    end

    subgraph Subagents\["子代理"\]  
        GP\["general-purpose"\]  
        Bash\["bash"\]  
        Custom\["自定义子代理"\]  
    end

    subgraph Events\["事件"\]  
        Started\["task\_started"\]  
        Running\["running"\]  
        Completed\["completed"\]  
        Failed\["failed"\]  
        Timeout\["timed\_out"\]  
    end

    Lead \--\> TaskTool  
    TaskTool \--\> Executor  
    Executor \--\> Scheduler  
    Scheduler \--\> Pool  
    Pool \--\> Subagents  
    Subagents \--\> Events  
    Events \--\> Lead

### **8.2 配置示例**

subagents:  
  max\_concurrent: 3  
  default\_timeout: 900  \# 15分钟  
    
  built\_in:  
    \- name: general-purpose  
      description: 通用任务处理  
    \- name: bash  
      description: 命令行任务  
    
  custom:  
    \- name: code-analyzer  
      description: 代码分析专家  
      model: gpt-4  
      system\_prompt: |  
        你是一个代码分析专家...

### **8.3 子代理调用流程**

async def task(  
    instruction: str,  
    subagent\_type: str \= "general-purpose",  
    timeout: int \= 900  
) \-\> str:  
    """调用子代理执行任务"""  
      
    \# 1\. 创建子代理  
    subagent \= await create\_subagent(subagent\_type)  
      
    \# 2\. 执行任务  
    try:  
        result \= await asyncio.wait\_for(  
            subagent.run(instruction),  
            timeout=timeout  
        )  
        return result  
    except asyncio.TimeoutError:  
        raise TimeoutError(f"Subagent timed out after {timeout}s")

---

## **9\. 前端架构**

### **9.1 技术栈**

| 技术 | 版本 | 用途 |
| ----- | ----- | ----- |
| Next.js | 15 | 框架 |
| React | 19 | UI 库 |
| TypeScript | 5.x | 类型安全 |
| Tailwind CSS | 3.x | 样式 |
| Vercel AI SDK | 4.x | AI 集成 |

### **9.2 核心组件**

// 聊天组件  
export function ChatUI() {  
  const { messages, input, handleSubmit } \= useChat({  
    api: '/api/langgraph/threads/${threadId}/runs',  
  })

  return (  
    \<div className="flex flex-col h-full"\>  
      \<MessageList messages={messages} /\>  
      \<ChatInput   
        value={input}   
        onSubmit={handleSubmit}   
      /\>  
    \</div\>  
  )  
}

// 线程列表组件  
export function ThreadList() {  
  const { threads, isLoading } \= useThreads()  
    
  return (  
    \<div className="space-y-2"\>  
      {threads.map(thread \=\> (  
        \<ThreadItem key={thread.id} thread={thread} /\>  
      ))}  
    \</div\>  
  )  
}

// 产物查看器  
export function ArtifactViewer({ artifact }: { artifact: Artifact }) {  
  const content \= useArtifact(artifact.path)  
    
  return (  
    \<div className="artifact-viewer"\>  
      {artifact.type \=== 'image' && (  
        \<img src={content} alt={artifact.name} /\>  
      )}  
      {artifact.type \=== 'code' && (  
        \<CodeBlock code={content} language={artifact.language} /\>  
      )}  
    \</div\>  
  )  
}

### **9.3 状态管理**

// 线程状态  
interface ThreadState {  
  id: string  
  title: string  
  messages: Message\[\]  
  artifacts: Artifact\[\]  
  status: 'idle' | 'running' | 'error'  
}

// 消息状态  
interface MessageState {  
  role: 'user' | 'assistant' | 'system'  
  content: string  
  timestamp: Date  
  toolCalls?: ToolCall\[\]  
}

// 产物状态  
interface ArtifactState {  
  id: string  
  name: string  
  type: 'image' | 'code' | 'file'  
  path: string  
  createdAt: Date  
}

---

## **10\. 部署架构**

### **10.1 Docker Compose 配置**

version: '3.8'

services:  
  nginx:  
    image: nginx:alpine  
    ports:  
      \- "2026:2026"  
    volumes:  
      \- ./nginx.conf:/etc/nginx/nginx.conf  
    depends\_on:  
      \- frontend  
      \- langgraph  
      \- gateway

  frontend:  
    build: ./frontend  
    ports:  
      \- "3000:3000"  
    environment:  
      \- NEXT\_PUBLIC\_API\_URL=http://nginx:2026

  langgraph:  
    build: ./backend  
    ports:  
      \- "2024:2024"  
    environment:  
      \- CONFIG\_PATH=/app/config.yaml  
    volumes:  
      \- ./config.yaml:/app/config.yaml  
      \- deerflow-data:/app/.deer-flow

  gateway:  
    build: ./backend  
    ports:  
      \- "8001:8001"  
    environment:  
      \- CONFIG\_PATH=/app/config.yaml  
    volumes:  
      \- ./config.yaml:/app/config.yaml  
      \- deerflow-data:/app/.deer-flow

volumes:  
  deerflow-data:

### **10.2 Nginx 配置**

upstream frontend {  
    server frontend:3000;  
}

upstream langgraph {  
    server langgraph:2024;  
}

upstream gateway {  
    server gateway:8001;  
}

server {  
    listen 2026;

    \# Frontend  
    location / {  
        proxy\_pass http://frontend;  
        proxy\_set\_header Host $host;  
    }

    \# LangGraph API  
    location /api/langgraph/ {  
        proxy\_pass http://langgraph/;  
        proxy\_set\_header Host $host;  
        proxy\_buffering off;  
        proxy\_cache off;  
    }

    \# Gateway API  
    location /api/ {  
        proxy\_pass http://gateway/;  
        proxy\_set\_header Host $host;  
    }  
}

---

# **组件功能详解**

## **14.1 外围接入层**

### **1\) Client / Browser**

**功能**:

* 发起 Web 端交互  
* 接收流式响应  
* 发起线程操作、上传、配置管理等请求

### **2\) Frontend（Next.js / React UI）**

**功能**:

* DeerFlow 的 Web UI  
* 聊天界面、线程管理、文件展示、产物下载  
* 对接 `/api/langgraph/*` 与 Gateway API

### **3\) IM Channels（Feishu / Slack / Telegram）**

**功能**:

* 把 DeerFlow 接入外部消息平台  
* 负责消息收发、线程映射、命令处理、平台适配  
* Feishu 支持流式更新卡片，Slack/Telegram 以最终响应为主

**平台差异**:

| 平台 | 流式支持 | 特殊功能 |
| ----- | ----- | ----- |
| Feishu/Lark | ✅ 支持流式卡片 | 富文本卡片 |
| Slack | ❌ 最终响应 | Block Kit |
| Telegram | ❌ 最终响应 | Markdown |

---

## **14.2 接入与调度层**

### **5\) Nginx**

**功能**:

* 统一入口  
* 反向代理到 Frontend、LangGraph、Gateway  
* 在 Gateway mode 下，还会把 `/api/langgraph/*` 改为代理到 Gateway 内嵌运行时

**路由规则**:

| 路径 | 目标 |
| ----- | ----- |
| `/*` | Frontend :3000 |
| `/api/langgraph/*` | LangGraph :2024 |
| `/api/*` | Gateway :8001 |

### **6\) LangGraph Server**

**功能**:

* 标准模式下的核心 Agent Runtime  
* 负责线程管理、状态持久化、工具编排、SSE 流式输出  
* 入口为 `make_lead_agent(config)`

**核心能力**:

* Thread 管理（创建、加载、持久化）  
* Checkpointing（状态快照）  
* SSE 流式响应  
* 工具调用编排

### **7\) Gateway API**

**功能**:

* 非 Agent 推理类能力的管理平面  
* 提供 Models / MCP / Skills / Memory / Uploads / Artifacts / Threads / Suggestions 等 REST API  
* 也是 IM Channels 的辅助服务入口

**API 列表**:

| 路径 | 功能 |
| ----- | ----- |
| `/api/models` | 模型列表 / 详情 |
| `/api/mcp` | MCP 配置读取 / 更新 |
| `/api/skills` | 技能列表 / 启停 / 安装 |
| `/api/memory` | 记忆数据 / 配置 / 状态 / reload |
| `/api/threads/{id}/uploads` | 文件上传 / 列表 / 删除 |
| `/api/threads/{id}` | 本地线程数据清理 |
| `/api/threads/{id}/artifacts` | 产物下载 / 服务 |
| `/api/threads/{id}/suggestions` | 跟进建议生成 |

---

## **14.3 配置与状态层**

### **9\) `config.yaml`**

**功能**:

* DeerFlow 主配置文件  
* 定义模型、工具、沙盒、skills、memory、subagents、summarization、channels 等核心参数  
* 被 LangGraph 与 Gateway 共享读取

**配置结构**:

\# 模型配置  
models:  
  \- name: gpt-4  
    display\_name: GPT-4  
    use: langchain\_openai:ChatOpenAI  
    model: gpt-4  
    api\_key: $OPENAI\_API\_KEY

\# 工具配置  
tools:  
  built\_in: \[present\_file, ask\_clarification, view\_image\]  
  sandbox: \[bash, read\_file, write\_file, str\_replace, ls\]  
  community:  
    tavily:  
      enabled: true  
      api\_key: $TAVILY\_API\_KEY

\# 沙箱配置  
sandbox:  
  provider: aio  
  docker\_image: deerflow-sandbox:latest

\# 技能配置  
skills:  
  directories: \[skills/public, skills/custom\]

\# 记忆配置  
memory:  
  enabled: true  
  file: .deer-flow/memory.json

\# 子代理配置  
subagents:  
  max\_concurrent: 3  
  default\_timeout: 900

\# 总结配置  
summarization:  
  enabled: true  
  max\_tokens: 8000  
  target\_tokens: 4000

\# 通道配置  
channels:  
  slack:  
    enabled: true  
    bot\_token: $SLACK\_BOT\_TOKEN  
  telegram:  
    enabled: true  
    bot\_token: $TELEGRAM\_BOT\_TOKEN

### **10\) `extensions_config.json`**

**功能**:

* 管理 MCP Servers 与 Skills 启用状态  
* 支持 Gateway API 动态修改  
* 通过 mtime 变化驱动运行时热更新

**结构**:

{  
  "mcpServers": {  
    "github": {  
      "enabled": true,  
      "type": "stdio",  
      "command": "npx",  
      "args": \["-y", "@modelcontextprotocol/server-github"\],  
      "env": {"GITHUB\_TOKEN": "$GITHUB\_TOKEN"}  
    }  
  },  
  "skills": {  
    "code-review": {  
      "enabled": true  
    },  
    "documentation": {  
      "enabled": true  
    }  
  }  
}

### **11\) ThreadState**

**功能**:

* DeerFlow 对 LangGraph `AgentState` 的扩展  
* 保存消息、标题、沙箱信息、产物、待办、图像上下文、线程目录等  
* 是 DeerFlow 会话的状态载体

**字段说明**:

| 字段 | 类型 | 说明 |
| ----- | ----- | ----- |
| messages | list\[BaseMessage\] | 对话消息列表 |
| sandbox | dict | 沙箱环境信息 |
| artifacts | list\[str\] | 生成的文件路径 |
| thread\_data | dict | 线程目录路径 |
| title | str | None | 对话标题 |
| todos | list\[dict\] | 任务列表 |
| viewed\_images | dict | 视觉模型图像 |
| uploaded\_files | list | 上传文件列表 |

### **12\) 线程目录**

**功能**:

* 为每个线程提供隔离的文件空间  
* 包括 `workspace`、`uploads`、`outputs`

**目录结构**:

backend/.deer-flow/threads/{thread\_id}/  
├── user-data/  
│   ├── workspace/    \# 工作目录  
│   ├── uploads/      \# 上传文件  
│   └── outputs/      \# 输出产物  
├── checkpoints/      \# 状态快照  
└── metadata.json     \# 线程元数据

---

## **14.4 Agent Runtime 内核层**

### **13\) Lead Agent**

**功能**:

* DeerFlow 的主控智能体  
* 负责综合模型、工具、skills、memory、subagents 执行任务  
* 是 LangGraph Runtime 的主要逻辑入口

**核心流程**:

flowchart TB  
    Input\["用户输入"\]  
    Parse\["意图解析"\]  
    Plan\["任务规划"\]  
    Execute\["执行工具"\]  
    Subagent\["调用子代理"\]  
    Response\["生成响应"\]

    Input \--\> Parse  
    Parse \--\> Plan  
    Plan \--\> Execute  
    Execute \--\> Subagent  
    Subagent \--\> Response

### **14\) Middleware Chain**

**功能**:

* 为 Agent 执行链路提供横切能力  
* 包括线程目录初始化、文件上传注入、沙箱获取、工具调用保护、上下文压缩、Todo 计划、自动标题、记忆更新、图片注入、子代理限制、澄清中断

**执行顺序**:

1. ThreadDataMiddleware \- 初始化目录  
2. UploadsMiddleware \- 处理上传  
3. SandboxMiddleware \- 获取沙箱  
4. DanglingToolCallMiddleware \- 处理悬空调用  
5. GuardrailMiddleware \- 安全检查  
6. SummarizationMiddleware \- 上下文压缩  
7. TodoListMiddleware \- 任务跟踪  
8. TitleMiddleware \- 生成标题  
9. MemoryMiddleware \- 记忆处理  
10. ViewImageMiddleware \- 图像处理  
11. SubagentLimitMiddleware \- 并发限制  
12. ClarificationMiddleware \- 澄清处理

### **15\) System Prompt Builder**

**功能**:

* 把 skills、memory、subagent 指令、工作目录提示等统一注入系统提示词  
* 使 Agent 行为具备更强任务导向性

**提示词结构**:

\# 系统提示

\#\# 技能指令  
{skill\_instructions}

\#\# 用户记忆  
{memory\_context}

\#\# 子代理指令  
{subagent\_instructions}

\#\# 工作目录  
当前工作目录: /mnt/user-data/workspace

\#\# 可用工具  
{tool\_descriptions}

### **16\) Model Factory**

**功能**:

* 依据 `config.yaml` 动态装配不同模型提供方  
* 支持 thinking、vision、responses API、CLI-backed provider 等能力  
* 通过 `resolve_class()` 实现配置驱动实例化

**Reflection System**:

def resolve\_class(path: str) \-\> type:  
    """解析类路径"""  
    module\_path, class\_name \= path.rsplit(":", 1\)  
    module \= importlib.import\_module(module\_path)  
    return getattr(module, class\_name)

def resolve\_variable(value: str) \-\> str:  
    """解析变量（支持环境变量）"""  
    if value.startswith("$"):  
        return os.environ.get(value\[1:\], value)  
    return value

---

## **14.5 工具与执行层**

### **17\) Tool Assembler**

**功能**:

* 从多个来源收集工具并装配到 Agent  
* 处理工具冲突、依赖、优先级

**工具优先级**:

1. Built-in Tools（最高优先级）  
2. Sandbox Tools  
3. Config-defined Tools  
4. MCP Tools  
5. Subagent Tool（最低优先级）

### **18\) Sandbox System**

**功能**:

* 提供隔离的代码执行环境  
* 支持本地（开发）和 Docker（生产）两种模式  
* 通过虚拟路径映射实现文件系统隔离

**Provider 选择**:

| 模式 | Provider | 使用场景 |
| ----- | ----- | ----- |
| 开发 | LocalSandboxProvider | 本地开发、调试 |
| 生产 | AioSandboxProvider | Docker 部署 |
| 集群 | Provisioner | Kubernetes |

### **19\) MCP Client**

**功能**:

* 连接并管理多个 MCP Server  
* 提供 lazy init 与缓存失效机制  
* 支持 stdio、SSE、HTTP 三种传输协议

**缓存策略**:

class MCPCache:  
    """MCP 工具缓存"""  
      
    def \_\_init\_\_(self, ttl: int \= 300):  
        self.\_cache: dict\[str, CachedTools\] \= {}  
        self.\_ttl \= ttl  
      
    async def get\_tools(self, server\_name: str) \-\> list\[Tool\]:  
        """获取工具（带缓存）"""  
        if self.\_should\_refresh(server\_name):  
            tools \= await self.\_fetch\_tools(server\_name)  
            self.\_cache\[server\_name\] \= CachedTools(  
                tools=tools,  
                timestamp=time.time()  
            )  
        return self.\_cache\[server\_name\].tools  
      
    def \_should\_refresh(self, server\_name: str) \-\> bool:  
        """检查是否需要刷新"""  
        if server\_name not in self.\_cache:  
            return True  
        return time.time() \- self.\_cache\[server\_name\].timestamp \> self.\_ttl

### **20\) Community Tools**

**功能**:

* 集成第三方工具服务  
* 支持 Tavily、Jina AI、Firecrawl、Image Search 等

**可用工具**:

| 工具 | 功能 | API Key |
| ----- | ----- | ----- |
| tavily | Web 搜索 | TAVILY\_API\_KEY |
| jina\_ai | Web 内容提取 | JINA\_API\_KEY |
| firecrawl | 网页爬取 | FIRECRAWL\_API\_KEY |
| image\_search | 图片搜索 | \- |

---

## **14.6 扩展与记忆层**

### **21\) Skills Loader**

**功能**:

* 扫描并解析 skills 目录下的 SKILL.md 文件  
* 验证 frontmatter 元数据  
* 注册启用的技能到 Agent

**加载流程**:

flowchart TB  
    Scan\["扫描目录"\]  
    Find\["发现 SKILL.md"\]  
    Parse\["解析 frontmatter"\]  
    Validate\["验证元数据"\]  
    Check\["检查启用状态"\]  
    Register\["注册技能"\]

    Scan \--\> Find  
    Find \--\> Parse  
    Parse \--\> Validate  
    Validate \--\> Check  
    Check \--\> Register

### **22\) Memory System**

**功能**:

* 存储用户偏好、上下文、事实等长期记忆  
* 使用 LLM 从对话中自动抽取信息  
* 通过 Debounced Queue 实现高效更新

**更新策略**:

* 防抖延迟：5秒  
* 批量合并  
* 增量更新

### **23\) Extensions Config Watcher**

**功能**:

* 监控 `extensions_config.json` 文件变化  
* 触发 MCP/Skills 热更新  
* 避免重启服务

**热更新流程**:

flowchart TB  
    File\["extensions\_config.json"\]  
    Watch\["File Watcher"\]  
    Event\["变更事件"\]  
    Reload\["重新加载"\]  
    Cache\["缓存失效"\]

    File \--\> Watch  
    Watch \--\> Event  
    Event \--\> Reload  
    Reload \--\> Cache

---

## **14.7 子代理层**

### **24\) Subagent Executor**

**功能**:

* 执行 Lead Agent 委派的任务  
* 管理并发与超时  
* 聚合结果返回

**并发控制**:

class SubagentScheduler:  
    """子代理调度器"""  
      
    def \_\_init\_\_(self, max\_concurrent: int \= 3):  
        self.\_semaphore \= asyncio.Semaphore(max\_concurrent)  
        self.\_active\_tasks: dict\[str, asyncio.Task\] \= {}  
      
    async def execute(  
        self,   
        task\_id: str,   
        instruction: str,  
        timeout: int \= 900  
    ) \-\> str:  
        """执行子代理任务"""  
        async with self.\_semaphore:  
            try:  
                result \= await asyncio.wait\_for(  
                    self.\_run\_subagent(instruction),  
                    timeout=timeout  
                )  
                return result  
            except asyncio.TimeoutError:  
                raise TimeoutError(f"Task {task\_id} timed out")

### **25\) Subagent Pool**

**功能**:

* 维护子代理实例池  
* 支持预定义和自定义子代理类型  
* 提供负载均衡

**内置子代理**:

| 名称 | 功能 |
| ----- | ----- |
| general-purpose | 通用任务处理 |
| bash | 命令行任务 |

---

## **14.8 接入渠道层**

### **26\) IM Channels**

**功能**:

* 把 DeerFlow 接入外部消息平台  
* 负责消息收发、线程映射、命令处理、平台适配  
* Feishu 支持流式更新卡片，Slack/Telegram 以最终响应为主

**架构组件**:

| 组件 | 文件 | 功能 |
| ----- | ----- | ----- |
| Channel Base | `base.py` | 通道抽象基类 |
| Message Bus | `message_bus.py` | Inbound/Outbound pub-sub |
| Manager | `manager.py` | 线程创建、命令路由、run 调度 |
| Store | `store.py` | channel:chat\[:topic\] \-\> thread\_id 映射 |

**平台适配**:

| 平台 | 流式支持 | 特殊功能 |
| ----- | ----- | ----- |
| Feishu/Lark | ✅ 支持流式卡片 | 富文本卡片、命令订阅 |
| Slack | ❌ 最终响应 | Block Kit、Slash Commands |
| Telegram | ❌ 最终响应 | Markdown、Inline Keyboard |

### **27\) Embedded Python Client**

**功能**:

* 提供 Python SDK 直接调用 DeerFlow  
* 无需通过 HTTP API  
* 适合集成到其他 Python 应用

**核心方法**:

class DeerFlowClient:  
    """DeerFlow Python 客户端"""  
      
    async def chat(  
        self,   
        message: str,   
        thread\_id: str | None \= None  
    ) \-\> str:  
        """发送消息并获取响应"""  
        pass  
      
    async def stream(  
        self,   
        message: str,   
        thread\_id: str | None \= None  
    ) \-\> AsyncIterator\[str\]:  
        """流式获取响应"""  
        pass  
      
    async def list\_models(self) \-\> list\[Model\]:  
        """列出可用模型"""  
        pass  
      
    async def list\_skills(self) \-\> list\[Skill\]:  
        """列出可用技能"""  
        pass  
      
    async def upload\_files(  
        self,   
        files: list\[str\],   
        thread\_id: str  
    ) \-\> list\[UploadedFile\]:  
        """上传文件"""  
        pass

---

## **14.9 Provisioner 层**

### **28\) Provisioner**

**功能**:

* 可选组件，端口 8002  
* 支持 Kubernetes / Provisioner 模式沙盒  
* 提供更强大的沙箱管理能力

**使用场景**:

* 大规模部署  
* 多租户隔离  
* 资源配额管理

---

# **开发指南**

## **快速开始**

### **1\. 环境准备**

\# 克隆仓库  
git clone https://github.com/bytedance/deer-flow.git  
cd deer-flow

\# 安装依赖  
pip install \-r requirements.txt

\# 配置环境变量  
cp .env.example .env  
\# 编辑 .env 填入 API Keys

### **2\. 配置文件**

\# config.yaml  
models:  
  \- name: gpt-4  
    display\_name: GPT-4  
    use: langchain\_openai:ChatOpenAI  
    model: gpt-4  
    api\_key: $OPENAI\_API\_KEY

sandbox:  
  provider: local  \# 开发环境使用 local

skills:  
  directories:  
    \- skills/public  
    \- skills/custom

memory:  
  enabled: true  
  file: .deer-flow/memory.json

### **3\. 启动服务**

\# 启动 LangGraph Server  
python \-m deerflow.langgraph\_server

\# 启动 Gateway API  
python \-m app.main

\# 启动 Frontend（另一个终端）  
cd frontend  
npm install  
npm run dev

### **4\. Docker 部署**

\# 使用 Docker Compose  
docker-compose up \-d

\# 查看日志  
docker-compose logs \-f

---

## **自定义开发**

### **1\. 添加自定义技能**

\<\!-- skills/custom/my-skill/SKILL.md \--\>  
\---  
name: my-custom-skill  
description: 我的自定义技能  
version: 1.0.0  
author: me  
tags: \[custom, example\]  
tools: \[read\_file, write\_file, bash\]  
\---

\# My Custom Skill

这是一个自定义技能的说明。

\#\# 使用场景

\- 场景1  
\- 场景2

\#\# 执行流程

1\. 步骤1  
2\. 步骤2

### **2\. 添加 MCP Server**

// extensions\_config.json  
{  
  "mcpServers": {  
    "my-mcp-server": {  
      "enabled": true,  
      "type": "stdio",  
      "command": "python",  
      "args": \["-m", "my\_mcp\_server"\],  
      "env": {  
        "API\_KEY": "$MY\_API\_KEY"  
      }  
    }  
  }  
}

### **3\. 添加自定义子代理**

\# config.yaml  
subagents:  
  custom:  
    \- name: my-expert  
      description: 我的专家子代理  
      model: gpt-4  
      system\_prompt: |  
        你是一个专门处理XX任务的专家...  
      tools:  
        \- read\_file  
        \- bash

### **4\. 添加自定义中间件**

\# packages/harness/deerflow/agents/middlewares/my\_middleware.py

from .base import Middleware

class MyCustomMiddleware(Middleware):  
    """自定义中间件"""  
      
    async def before\_agent(self, state: ThreadState) \-\> ThreadState:  
        """Agent 执行前"""  
        \# 自定义逻辑  
        return state  
      
    async def after\_agent(self, state: ThreadState) \-\> ThreadState:  
        """Agent 执行后"""  
        \# 自定义逻辑  
        return state

---

## **调试技巧**

### **1\. 启用调试日志**

import logging

logging.basicConfig(level=logging.DEBUG)  
logging.getLogger("deerflow").setLevel(logging.DEBUG)

### **2\. 查看中间件执行**

\# 在中间件中添加日志  
class DebugMiddleware(Middleware):  
    async def before\_agent(self, state: ThreadState) \-\> ThreadState:  
        print(f"\[DEBUG\] Before Agent: {state.keys()}")  
        return state

### **3\. 检查工具调用**

\# 在工具执行前后打印  
async def debug\_tool\_call(tool\_name: str, args: dict):  
    print(f"\[TOOL\] {tool\_name}({args})")  
    result \= await tool.execute(args)  
    print(f"\[RESULT\] {result}")  
    return result

---

# **最佳实践**

## **1\. 性能优化**

### **1.1 上下文压缩**

summarization:  
  enabled: true  
  max\_tokens: 8000  
  target\_tokens: 4000  
  trigger\_threshold: 0.8

### **1.2 记忆更新策略**

memory:  
  enabled: true  
  update\_delay: 5.0  \# 防抖延迟  
  max\_facts: 100     \# 最大事实数

### **1.3 子代理并发控制**

subagents:  
  max\_concurrent: 3  
  default\_timeout: 900  
  queue\_size: 10

---

## **2\. 安全建议**

### **2.1 沙箱隔离**

* 生产环境使用 AioSandboxProvider  
* 限制文件系统访问  
* 设置资源配额

### **2.2 API Key 管理**

* 使用环境变量存储  
* 不要硬编码在配置文件  
* 定期轮换

### **2.3 工具权限**

* 只启用必要的工具  
* 限制危险命令执行  
* 添加 Guardrail 检查

---

## **3\. 运维建议**

### **3.1 日志管理**

logging:  
  level: INFO  
  format: "%(asctime)s \- %(name)s \- %(levelname)s \- %(message)s"  
  file: logs/deerflow.log

### **3.2 监控指标**

* 响应时间  
* Token 使用量  
* 工具调用频率  
* 错误率

### **3.3 备份策略**

* 定期备份 `memory.json`  
* 备份线程数据  
* 配置版本控制

---

# **常见问题**

## **Q1: 如何切换模型？**

修改 `config.yaml` 中的模型配置，或通过 Gateway API 动态切换。

## **Q2: 如何添加新的 MCP 工具？**

在 `extensions_config.json` 中添加 MCP Server 配置，系统会自动加载。

## **Q3: 记忆系统不生效？**

检查：

1. `memory.enabled` 是否为 true  
2. 文件写入权限  
3. MemoryMiddleware 是否在中间件链中

## **Q4: 子代理超时怎么办？**

调整 `subagents.default_timeout` 配置，或检查任务复杂度。

## **Q5: 如何调试工具调用？**

启用 DEBUG 日志级别，查看工具执行详情。

---

# **参考资源**

## **官方资源**

* **GitHub**: [https://github.com/bytedance/deer-flow](https://github.com/bytedance/deer-flow)  
* **文档**: [https://deer-flow.readthedocs.io](https://deer-flow.readthedocs.io)  
* **Discord**: [https://discord.gg/deerflow](https://discord.gg/deerflow)

## **相关技术**

* **LangGraph**: [https://github.com/langchain-ai/langgraph](https://github.com/langchain-ai/langgraph)  
* **LangChain**: [https://github.com/langchain-ai/langchain](https://github.com/langchain-ai/langchain)  
* **MCP**: [https://modelcontextprotocol.io](https://modelcontextprotocol.io)

## **社区资源**

* **示例项目**: examples/  
* **技能仓库**: skills/public/  
* **插件市场**: [https://plugins.deer-flow.io](https://plugins.deer-flow.io)

---

# **附录**

## **A. 配置完整示例**

\# config.yaml 完整示例

\# 模型配置  
models:  
  \- name: gpt-4  
    display\_name: GPT-4  
    use: langchain\_openai:ChatOpenAI  
    model: gpt-4  
    api\_key: $OPENAI\_API\_KEY  
    max\_tokens: 4096  
    supports\_thinking: false  
    supports\_vision: true  
    
  \- name: claude-3-opus  
    display\_name: Claude 3 Opus  
    use: langchain\_anthropic:ChatAnthropic  
    model: claude-3-opus-20240229  
    api\_key: $ANTHROPIC\_API\_KEY  
    max\_tokens: 4096  
    supports\_thinking: true  
    supports\_vision: true

\# 工具配置  
tools:  
  built\_in:  
    \- present\_file  
    \- ask\_clarification  
    \- view\_image  
    
  sandbox:  
    \- bash  
    \- read\_file  
    \- write\_file  
    \- str\_replace  
    \- ls  
    
  community:  
    tavily:  
      enabled: true  
      api\_key: $TAVILY\_API\_KEY  
    jina\_ai:  
      enabled: true  
      api\_key: $JINA\_API\_KEY

\# 沙箱配置  
sandbox:  
  provider: aio  
  docker\_image: deerflow-sandbox:latest  
  timeout: 300

\# 技能配置  
skills:  
  directories:  
    \- skills/public  
    \- skills/custom  
  auto\_reload: true

\# 记忆配置  
memory:  
  enabled: true  
  file: .deer-flow/memory.json  
  update\_delay: 5.0  
  max\_facts: 100

\# 子代理配置  
subagents:  
  max\_concurrent: 3  
  default\_timeout: 900  
    
  built\_in:  
    \- name: general-purpose  
      description: 通用任务处理  
    \- name: bash  
      description: 命令行任务  
    
  custom:  
    \- name: code-analyzer  
      description: 代码分析专家  
      model: gpt-4  
      system\_prompt: |  
        你是一个代码分析专家...

\# 总结配置  
summarization:  
  enabled: true  
  max\_tokens: 8000  
  target\_tokens: 4000  
  trigger\_threshold: 0.8

\# 通道配置  
channels:  
  slack:  
    enabled: true  
    bot\_token: $SLACK\_BOT\_TOKEN  
    app\_token: $SLACK\_APP\_TOKEN  
    
  telegram:  
    enabled: true  
    bot\_token: $TELEGRAM\_BOT\_TOKEN  
    
  feishu:  
    enabled: true  
    app\_id: $FEISHU\_APP\_ID  
    app\_secret: $FEISHU\_APP\_SECRET

## **B. 环境变量说明**

| 变量 | 说明 | 必需 |
| ----- | ----- | ----- |
| OPENAI\_API\_KEY | OpenAI API Key | 视模型 |
| ANTHROPIC\_API\_KEY | Anthropic API Key | 视模型 |
| DEEPSEEK\_API\_KEY | DeepSeek API Key | 视模型 |
| TAVILY\_API\_KEY | Tavily 搜索 API | 可选 |
| JINA\_API\_KEY | Jina AI API | 可选 |
| SLACK\_BOT\_TOKEN | Slack Bot Token | 可选 |
| TELEGRAM\_BOT\_TOKEN | Telegram Bot Token | 可选 |
| FEISHU\_APP\_ID | 飞书 App ID | 可选 |
| FEISHU\_APP\_SECRET | 飞书 App Secret | 可选 |

## **C. 端口说明**

| 端口 | 服务 | 说明 |
| ----- | ----- | ----- |
| 2026 | Nginx | 统一入口 |
| 3000 | Frontend | Web UI |
| 2024 | LangGraph Server | Agent Runtime |
| 8001 | Gateway API | 管理平面 |
| 8002 | Provisioner | 可选 |

---

文档版本: 2026-04-05

来源: [https://github.com/bytedance/deer-flow](https://github.com/bytedance/deer-flow)

![flowchart TB    Client\["Client / Browser\<br/\>Web 用户、开发者、调用方"\]    IM\["IM Channels\<br/\>Feishu / Slack / Telegram"\]    Embedded\["Embedded Python Client\<br/\>DeerFlowClient"\]    Nginx\["Nginx :2026\<br/\>统一反向代理入口"\]    Frontend\["Frontend :3000\<br/\>Next.js / React UI"\]    LangGraph\["LangGraph Server :2024\<br/\>Agent Runtime / Thread Mgmt / SSE / Checkpointing"\]    Gateway\["Gateway API :8001\<br/\>FastAPI 管理平面 / REST API"\]    Provisioner\["Provisioner :8002\<br/\>可选，Kubernetes / Provisioner 模式沙盒"\]    Client --\> Nginx    IM --\> Nginx    Embedded --\> Gateway    Nginx --\>|/api/langgraph/\*| LangGraph    Nginx --\>|/api/\*| Gateway    Nginx --\>|/\*| Frontend    LangGraph --\>|"共享 config.yaml"| Config\["config.yaml"\]    Gateway --\>|"共享 config.yaml"| Config    LangGraph --\>|"共享 extensions\_config.json"| ExtConfig\["extensions\_config.json"\]    Gateway --\>|"共享 extensions\_config.json"| ExtConfig    subgraph Backend\["Backend (packages/harness/deerflow/)"\]        Agents\["agents/\<br/\>Lead Agent / ThreadState / Middlewares / Memory"\]        Sandbox\["sandbox/\<br/\>Sandbox 抽象 / LocalSandbox / AioSandbox"\]        Subagents\["subagents/\<br/\>子代理注册、执行、并发控制"\]        Tools\["tools/\<br/\>内置工具 / 工具装配"\]        MCP\["mcp/\<br/\>MCP Client / Cache / OAuth / Tool Loading"\]        Skills\["skills/\<br/\>SKILL.md 发现 / 解析 / 注册"\]        Memory\["memory/\<br/\>用户记忆存储 / 抽取 / 注入"\]        Models\["models/\<br/\>多模型工厂 / Provider 适配"\]    end    LangGraph --\> Backend    Gateway --\> Backend    Provisioner --\> Backend][image1]

[image1]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAABGAAAAZACAYAAAA2PTS2AACAAElEQVR4Xuy92bMdxbm3+V103/R/0Td909Ed0YHvjk80nx20w/0RdnM+jm1sgw/GBmw4loUx8yAmGTEISwghoSOMkOBj1MAkOEIDgwAjIQaBAM0MkrYk5hlsXK2ntN9N7lzzHtZeu9bzRPxir8rMyhrWqtyVv3oz67/8FxERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERFJmTNl69G3XLJ7080X7X5aKVUhXbz7wfx6nyysnVb8Twsv3PVMzTEppXpOCy/etTK/hkVERESkDnOmbD3qzj+//d7WzV8USqnqaOFFuzfn1/tkYu4ft3+aH5NSqve08MJdr+XXr4iIiIjUIQyYd94pCqVUNbRr61eVMGAG9v2j5tiUUr2jN3b8TQNGREREpF00YJSqnjRglFLdkAaMiIiISAdowChVPWnAKKW6IQ0YERERkQ7QgFGqetKAUUp1QxowIiIiIh2gAaNU9aQBo5TqhjRgRERERDpAA0ap6kkDRinVDWnAiIiIiHSABoxS1ZMGjFKqG9KAEREREekADRilqicNGKVUN6QBIyIiItIBGjBKVU8aMEqpbkgDRkRERKQDNGCUqp40YJRS3ZAGjIiIiEgHaMAoVT1pwCiluiENGBEREZEO0IBRqnrSgFFKdUMaMCIiIiIdoAGjVPWkAaOU6oY0YEREREQ6QANGqepJA0Yp1Q1pwIiIiIh0gAaMUtWTBoxSqhvSgBERERHpAA0YpaonDRilVDekASMiIiLSARowSlVPGjBKqW5IA0ZERESkAzRglKqeNGCUUt2QBoyIiIhIB2jANNZrr+0v7r//sWLp0lXFSy+9OZS+devBYubMG4tnnnltWPmNG7cXb731aU09E6HXXz9QrF//ck16qmeeebVYu/a5YtWqvxYbNmwtDh60s1sVacD0r155ZU95Padpu3Z9WLZb9cq+/fZnNen1tHfvl2Wbsnz56uL553cVBw58PZR3yy13F4sXL6tZp9c0a9aCYsWK1TXpauTSgBERERHpAA2YWmGiTJ16TnHEEUcM06WXXlXmP/vs6+XynXc+OLTOq68OlGkXX/ynmvpGo82b3y6eeuqVmvRWYv9POeX0mvRU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0oARERER6QANGKWqJw0YpSZGTEBMpGSVo15SacCIiIiIdIAGjFLVkwaMUqob0oARERER6QANGKWqJw0YpVQ3pAEjIiIi0gEaMEpVTxowSqluSANGREREpAM0YJSqnjRglFLdkAaMiIiISAdowChVPWnAKKW6IQ0YERERkQ7QgFGqetKAUUp1QxowIiIiIh2gAaNU9aQBo5TqhjRgRERERDpAA0ap6kkDRinVDWnAiIiIiHSABoxS1ZMGjFKqG9KAEREREekADRilqicNGKVUN6QBIyIiItIBGjBKVU8aMEqpbkgDRkRERKQDNGCUqp40YJRS3ZAGjIiIiEgHaMAoVT1pwCiluiENGBEREZEO0IBRqnrSgFFKdUMaMCIiIiIdoAGjVPWkAaOU6oY0YEREREQ6QANGqepJA0Yp1Q1pwIiIiIh0QBgwD92y/xOlVHVUBQMmPyalVO9JA0ZERESkTeZM3fa/X/+7rSeq6uvs4++ccfwPLnotT1fV1A1Tt5+eX++Thfkn7/1f8uNRk1+nHnvdcpSnq8mtuX/Y/u/5NSwiIiIi0td861vfOvKII45Ym6eLiHSDQ23QNJSni4iIiIiIVAoNGBGZSDRgRERERESkL9CAEZGJRANGRERERET6Ag0YEZlINGBERERERKQv0IARkYlEA0ZERERERPoCDRgRmUg0YEREREREpG844ogjijxNRKQbYABjBOfpIiIiIiIilUMDRkQmCg0YERERERHpG+wAichEoQEsIiIiIiJ9gwaMiEwEzkElIiIiIiJ9hZ0gEZkInIBXRERERET6DocBiEi30YAREREREZG+w2FIItJtNH5FRERERKTvcBiSiHQTo19ERERERKRvMQpGRLqF0S8iIiIiItK3GAUjIt3A6BcREREREel7BqNgpuXpIiJjwaDRa/SLiIiIiIj0N9E5ciiSiIwHmrwiIiIiIiKD0DlyKJKIjDUOPRIREREREcmwoyQiY4nGroiIiIiISAM0YURkLNB8ERERERERaYHzNYjIaBg0X5x0V0REREREpBWaMCIyEsJ8cVJvERERERGRNnEIgYh0QrQZmi8iIiIiIiIdkjzNnpbniYgAhotRcyIiIiIiIqNksHOlCSMiNdg+iIiIiIiIjDF0sOxkiUhA1ItDjkRERERERMYBhySJiFEvIiIiIiIiXUIjRqT/iLlejHoRERERERHpIoMmjBNvivQBiel6ZJ4nIiIiIiIiXcBoGJHq4nAjERERERGRHkMjRqQ6ONxIRERERESkx9GIEZm8aLyIiIiIiIhMMjRiRCYPGi8iIiIiIiKTGMwXjRiR3kXjRUREREREpGJoxIj0DhovIiIiIiIiFUcjRmTi0HgRERERERHpMzRiRLrH4PWm8SIiIiIiItKvpEaMZozI2JFEuxQaLyIiIiIiIlKSPaGflueLSHtkw4ym5fkiIiIiIiIiHb85qZ0yIpMdTJVWESyZ8XJkni8iIiIiIiJSl9SIqdeh7MSoEZmsDBor5TCiBnkOMxIREREREZHRkxkx0/L0wbwjv1lDpDrEbxxFWmq8NDIoRUREREREREZEGDDxtD/tmGrCSBXJf+eDv3+HGYmIiIiIiEh3yDumYcrk5UQmK2mEV2bCHJmXFRERERERERkX8k6pJoxUiUbmiwaMiIiIiIiIdI16ndMf/79nFMf9t7NK/fZHc+6bfcb2Xys1GcXvN37LKP+tazK2z+wztv1fc/6w/eT8HCulJk75dSoiIiIiPQwd0OiIhk7579fueOCWPV8/tGjfVytvHfji4cUHPlVqMorfL79jNOP3j72R/s41YDrj+t9v/86dM99+Nz/HSqmJ0YLzdy3Nr1MRERERmWTMnrLt7LVL3/v7O+8UhVJV0MsbPi0WXrjrkfy3Lu0TBkx+bpVS3dcL6z8pNGBEREREKoAGjKqaNGBGjwaMUr0jDRgRERGRiqABo6omDZjRowGjVO9IA0ZERESkImjAqKpJA2b0aMAo1TvSgBERERGpCBowqmrSgBk9GjBK9Y40YEREREQqggaMqpo0YEaPBoxSvSMNGBEREZGKoAGjqiYNmNGjAaNU70gDRkRERKQiaMCoqkkDZvRowCjVO9KAEREREakIGjCqatKAGT0aMEr1jjRgRERERCqCBoyqmjRgRo8GjFK9Iw0YERERkYqgAaOqJg2Y0aMBo1TvSANGREREpCJowKiqSQNm9GjAKNU70oARERERqQgaMKpq0oAZPRowSvWONGBEREREKoIGjKqaNGBGjwaMUr0jDRgRERGRiqABo6omDZjRowGjVO9IA0ZERESkImjAqKpJA2b0aMAo1TvSgBERERGpCBowqmrSgBk9GjBK9Y40YEREREQqggaMqpo0YEaPBoxSvSMNGBEREZGKUDUD5uWX9xT79n1Zk/766weKZ599vTh48B81efX05pufFM89t6MmvRvavfuj4pFHni4effTZuseCdu78oHjooSfKcrt3f9jx+qEXX3yjeO21/TXpk1kaMKNnIg0YrmGu1Xo6ePDrmvLt6JZb7i4WL15Wkz5a3X33w8W8ebfWpIe2bj1YzJx5Y/HMM6/V5LWrdup45plXi3XrNhWPPfZC8cILu4s9ez6vKTMSjdd5a1cHDnxdbNq0s1i6dFVx//2PFTt2vD+UV+/c79//9/I88TevazJLA0ZERESkIlTNgPnd784spk+fWZN+zTU3FEcccUTx9tuf1eTV0/nnX1qW37Jlb03eeArjhO2muuSSGcOMo4cfXj8s/9vf/ufi8cdfbHv90FVXXV/mn3nm+TV5k1kaMKNnIg0YruH8Nxx6661Pa8q3ox//+GfFCSf8siZ9tGJfv/vdo2rSQ5hG7Peddz5Yk9eu2qkjP0/oooumd3S+nnjipUPt3b5haeN13trR5s1vFccc8681x7Vs2aNlfr1zzzmizF13PVRT32hU79x0UxowIiIiIhWhigYMN+ArV64flt6pAbNu3fPlOt1+korxc+yxPylv+Dds2FqcdNKp5X6vWvXXMp8nwCzTMdq4cXsZBcMyHZV21g9df/3CMv2006YWAwNf1ezHZJYGzOjpBQOG33YuIiLy8u1ovIyEeiZAqnbMk1Zqpw7yjzvu+NKAnTv3lvJYSZs69ZyasvUUxm3eTozXeWul7dvfLY1l9okoF87BU0+9UrZbRP9Rpt65J5pv+vTrxjSqr9G56aY0YEREREQqQlUNGG7eGXYU6fUMGEL1ly9fXWzYsK182vrnP88vhzg8//yu0sBYv/7lobKU2bHjvaHhPXQGY+gPdVJ+8+a3h+0LwwJQvo+hgYG/lXXR2Yg0tp8+tb7nnkfK/WYoAMs33XRbucz2osy1184t09jHVusj1iWNztVYDVXoJWnAjJ5eMGDy9BCRCAxT4rdLpxizddu2dwbz9hb33bd22LWPwkhgyB3XPJ35esYjnXsizB588PGa6xkRScbQxBUrVpfbqGcCvPHGx+V1zXAgtlPPPGH/V6xYU+5/OqymkzpSkY+ZGsu0U2Fg8JlrPs7RN2U+LNNfe22gmD9/SVl2wYLbBtMOGxhx3ijLeWaf6kXVUJ5zRj7tZKRjmFEfQyEpw3ezevWGuuc+1RVXXNvymPNzz/fBtlDazvOdMSyJYUxECu7Z88VQHscVQ7toP4muSdtsjjU/N+nxdUsaMCIiIiIVoaoGDDfmv/71b4eemOcGTCynInKEm+vf/GbKUFrUS0eEaBLqjTw+0+Gjc8G6dHiiM0UnjzKzZi2o2cfQokX3lmVOPPHkmrwQ61OG+VxY5ok2y2kkQAxJwhRqtT7ivJA2lnNF9JI0YEZPLxswM2bMLq89rrn0+j333GnDlhl6F+tw/aZ5iDSMkChz772HzcpUl1129dDwPTruZ511YU2Z1ARYu/a5IeMjVRgJ1DVjxqyG+e3UUU/kpwYMivNDm8Zf9j3Nv+66+WV6tFWpiDShDOeIfUn35+ijf1DOkRX1EKGSr4/xSx7mD8vRboUwdRpFF3KOYjvNIp5yA2b+/MVD9WNakbZr14fFKaecPmzb3/ve94dMloggZBhmWob/D+SHWZ3q9tvvq9mX8ZYGjIiIiEhFqKIBw005T1m5WZ47d1GZnhowcVN9+ulnlE9NeZrNcnTYiEj5wx/OLdOi3ujALVmyvNi27d2hTsfVV88p82OYAJ2cV17ZU3ZYMGwadTLQmjXPlevQoczzEE9fqYcOQzwxZpgBy2m5OJ68Y1BvfSJ9oiPxwx8eU/6loxZzyFRBGjCjpxcMGDrpITrXkc/1Qj5DTbgWY94PREQJv/HodNMBZx2uX9oFoh0Ymsc8UeT/4he/Kjv8mzbtKJcxJ7kWiHIJsyXmEwnDgmseo5V6qDNMAIyOuN64JjEfot0J8+S221aUy5deelUZjUM7xTVN2ksvvdlWHfVEfhgwmBb337+uTIuhiRdccHm5HFF7HDMGB+eW8mHCEJWDuRLtxfB2752hoYsxDwsT/8Z543ysWbNxyPgh4iUMGM4ReUQvxXnFOM6PA9Emk4+hluelyg0Y9nvBgtvLdcOAiW0RAcj+YAxxfjl22uYwYPgdYEjTjsf+c67qnZv9+/9Wsy/jLQ0YERERkYpQVQOGz9FRe/LJzcMMmL/85a7yczqmn45KamwwgSVlYjmfC4HIEfLZXqTdcMNfhjob+RCoRmpm0MycOa+sL+14sR8YJ2m5MGDSYUaN1n/ggcfKNMR8MZhOfD4cvdP90PrxkAbM6OkFA4bOcyg1F+O63rv3mzd8cc1NmfLHoWU6y5RhyAvL+fWLfv7zfyvL8JaduA6Y+4m3DiFMmNgPol/i2k7fxJS2N2FOpPuaz9/Ctcu19uqrA0Pbofzh9Va0VUc9xTWM8ZRGq0Qbh6nE8q233lsuP/30lnIZY4XliKLL5znJzxvRfnFOWI6oo3TYzh13PFCm0c6GAcPwzsgPc/zmm+8ctq0QJhn5jYzpUG7AoBhyiQETRg5Ge5xrdOGFV5TpGGBhwKQRgrNm3VSmcd5ZbnRuuikNGBEREZGKUGUDJoYGYayEoYIBw400nxcuvKMsR0eO5XTCylYGDOIpKh2eWMZMibd28MrUfN86UXS62Gba4WN7eacjJomMp9LN1l+8eGmZng7PiA5Hsw7eZJIGzOjpBQMmTw+1Y8AwfxNlGFbEcr3rFwOAMsxdQgQEn+uJyBLmB+Fz/oa1tL2ZOvXsskw6p0tqnoRp20jMMdKqjnTbqcjHeCGa5tRT/70cOoWxFPlEvGD+kM9yvAEtImIamQz1zhv1EPHC5zCx0qFCRJIcPlfX1TVgwhiJ6MRcRDWRnw+ZytXKgMFUyc9xKkyoegZMDEWLebYanZtuSgNGREREpCJU2YBBMbQghAFDRyjCzLnJj6E4GBmxXjsGDOulBkx0PBDRJfm+tSsm543Q/7QThWKugnQizBjWwISdrdbHGCI9fcIehtScOTfX7MtklAbM6OkHAyYiNRhGwzxMfOYaZqhNKoadRMQIQ4fSOtL2BqOGMulkt6l5EkYvJm2+DUSUTas60m2nIj+fAyZXDM9hqBCmNGZP5DUyGeqdt9SAifOG2R35EZE3c+aNdQ0YolBIa2TAxBwwnNe03lx5W49SAyaGeGI25+caYRrVM2AwsknTgBERERGRMafqBgyKIUcoJuGNG3WiWAijZ7hBuk6nBgxzJlCGp9DTpl1ZrosxkpbPRUeDzlA+ES6vkc07LaF4CxLz1kQaHS+2G52VZutjyESnJK+zWQdvMkkDZvT0gwET84PQGW/11h0iRcg/PATp8KS8KG1vYr+aDR+KCLl08t9U7dRRT+S3MmCY24pyYc6mUXoRLbJo0T3D1ql33lIDJoZuhVmBov1h7pyRGDAoJiqePfs/hqUzvxbDt/gcE/umJk1qwMTxYjal31mqdgyYRuemm9KAEREREakI/WDAcPNNWD430RgwcWPOE2DmXMAwwaRhgshYp1MDhok5Kc+EjQxFYgJelpu9hjrmfmDfIo1XYJOG6IwxPCjEq2kjfJ9jZDhRmD28irqd9SkTT63Jv/HGRUNvOUlfhz2ZpQEzenrBgEl/uyjezDNSA4ZlokCIaLj88sOGSxiRTNAa1wHXMuvRwT/vvEuG6iSqjXUYxsMbzDBYKR/tDZPokk/axRf/qZwIN0yCME8Y7sQybQdDILmGuR5jLpZ26qgn8lsZMIhzFPWnxgUmMGkYRLyuOQygRu1eGDAR9YeRvXjxsuLuux8u68H0IKJnpAYMbRHnlXIcP3XzG6DueGtcDCHjO+L14aSlBgzLV1552Mhhfzl//IY4xo0bt5f57Rgw+bl58MHat82NtzRgRERERCpC1QwYOhj5W4IQT7m5iY4IGJ5+R0chOmdpp6SeAcM8EWmddEQwT2KCS96cFHkYJVF/+srWVNEZSzt5MQShnsIgIhSeeiOdjlpM5tvO+nSAwiBCdHSYGDPfv8kqDZjRM5EGTJgE9UR+GDCpgcBvOB1SQwecMnSYWeb6jdevh5jPJTVxWCd9tTV1Mnl3RE9wHUfUDOJ19bQBaXuDuRPGweFhPrXmCZ+jDMK8SPPbqSMX+Uw2m6fnog7KphFwISYBTvcLA6Veu4cRkQ69ZOhm2h4xLwzGDHmYvqRhnkR52mLSMH/zfUhFO8U5jnoRZhBRg+Rj0sS5CbMkDBiGjLHMbyQmYE/3D4OO/JUrDw8vStu/eOtRGtWTnpuf/vQXNfs63tKAEREREakIVTNgmom3/ERnis5Fmke4PDfX3JDn642nYhLMkYgOSLwudiSiQ0lIfzpJbxWkATN6JtKAGQ9hiGJSIj6nk8bm4pqM11fXE6YNkR15eiquzVbX1eF5X4YPP+y0jk6FkUA71+i18xgW7NdItsvEwencVGMl2jgig/I2O0T0S6t2kO+bKKdmb51rpW/OTf3hTOMpDRgRERGRitBPBkyIG3aeZhJ5whNyQtljbobNm9+qKa8mlzRgRk/VDJh+F0Yrr6WPITwTYSKokUsDRkRERKQi9KMBw5PlGGIUInyf0P+8rJp80oAZPRow1VK88YlhWq2id1TvSQNGREREpCL0owET4ikwYemtwtfV5JIGzOjRgKmWmPtqNMNv1MRKA0ZERESkIvSzAaOqKQ2Y0aMBo1TvSANGREREpCJowKiqSQNm9GjAKNU70oARERERqQgaMKpq0oAZPRowSvWONGBEREREKoIGjKqaNGBGjwaMUr0jDRgRERGRiqABo6omDZjRowGjVO9IA0ZERESkImjAqKpJA2b0aMAo1TvSgBERERGpCL1gwFx00fRizZqNw9IGBv5W/Pzn/1YsXbqqpvx4i21v3vxWsWrVX4tbb723mDFjVrF168GacqmeeebV4qSTTi127HivJq+RFiy4raw/ls8668LijjseKB577IVi2bJHa8o30vbt7xYvvfRmQ/G67XwdXkl71VXXF48++mxN3mSXBszo0YBRqnekASMiIiJSESbagHn88ReLI444oli79rliz57Pi1de2TOk3/3uzOLEE08elrZ375c1dYxUd9/9cLmNX//6t8Vxxx1f/PCHxxTf/e5R5f6gY4751+I3v5lSGkSYIvn6qa644tqyfJ7eSBzrt7/9z8X11y8cSjvhhF8Ws2bdVNx554Pl9vmbrvPkk5vLfU115ZWzSuMm9rme2Fa+fTRz5rwyn3rzvMksDZjR088GDKblE0+8VKxZ81zx1FOvFG+++UlNmfHUjh3vF88++3pdbdv2TmkGz5x5Y/HMM6/VrDvWor1dv/7lYvny1cXzz+8qDhz4eiiP9nPevFuHledcPffcjpp61OikASMiIiJSESbagJk69ezi2GN/Un5euXJ9jXmQaywjYjAvME1uvvnO0uwg4mXTpp3F7t0f1ZRNRQdp1qwFw4SZQsROnh56/fUDw+q47bYV5fFQV6Sdeuq/F1dfPaf8TGQM+fff/9hQPlE5CxfeUZx++hnl9vhMxwgDZsaM2WWkC8fCMfF5w4atTQ0YRHQPde3e/WFNXj1hUFG+HY3ld9WJNGBGTz8bMJiyebuD2fnyy3tqyo6HuIbz7YcwaDFi+JwbtGOtRx55uryO0+2z/OqrA2U+54n2IF3n/PMvLctt2bK3pr6RamDgq+LBBx8vo/byvH6RBoyIiIhIRZhIAwZDgZv1e+99pHzqTDTIa6/tL00Q0umIcLNPBMqGDdvKoTZjGQGDAUMnIk9vpRde2F3uH0OOMEOaiQgayjJEKdanQ0G0zSWXzBhW75QpfywjaWIZAwNjZM+eL4aVw5z53ve+P7SMAUNdlL3xxkWlAcNnonbYdjMDhvPJvtCxy/Pqifquu25+aZY1Ex218e4gNpIGzOjRgDmiHJ53//3rSpMyzAfap7z8WCsMmJtuuq146KEnhom2pxsGDGY028BgueeeRw61yTvKKMU0Yq+eAbNu3fPFNdfcMKZmCfW1aseqLg0YERERkYowkQYMZgNRIwcPfl2aCAw3Iv2yy64uTQFu4gl5x+gYiVHSShgwGCREobRSul4YMHlUSz298cbHNQYM0Sqk0aFiGbOEThXHyVAozgvmDUYK5djHtM56BgzlGqlVx4WhT+1GwVAfT6Pz9Fx0zMazg9hMGjCjRwPmiGFpXKuk/eEP5w5L37nzg+Lhh9eX18TmzW/X1EUkGkOFMFMZbpmaqQwnYqgTJiimM2VoW8KAefrpLTX1oUYGDMYuwwmZP4ptxnAh2ql16zYNi+xjmwzpTNdnH9gf1iMqkW1gjOfbD+UGDEOUWJ8hS2m5Zudgy5Z9pRHPvpO3YsXqYZFG7Hu0b6tXbyjrf+utT2v2perSgBERERGpCBNlwMTwGG7gY94VbtKJhuHz/PmLy89EdJx22tS6HY7RCgMmNysaKV0vN2CINOFpeSqeBJOXGzDxZBmtWLGmbog/w7IwaRYtuqeMJnnxxTeGtk3nY8GC20sDhs/79n1ZdlAuv/zasoM1d25EwHxUdrqos5kBwxP92Pbs2f9Rk5+Lchow1UcDZvg1j37845+V6RjGLEdblQrzOCa93rXrw+KUU04fls91G21BGC1Tp54zlP/AA4+NyIDBtAjTJMSwKfaByBWW589fMlT+rrseKs3vWOaY2DeGQdIOU57hRPm2U+UGTET7oUhrdQ5o56gD8z0tE+Y07X+ajqJt7SdpwIiIiIhUhIkyYIi2mD79umLJkuWl6RA3+2kngigYbuoxFxhiE0MAiIyhA0EHpBMxaWS6DxdeeEXZiQhThEk3mbsgFZ2jtKOCcgMmTJSY+4TP0TFJDRie8pJ+7rnThjoZPD2nw0NHhTldmk3ky+SbeWckJuHlL29vijr4zDYp08yAobNH52fx4qXlvjcri6hPA6b6aMDUGjDnnXdJmU7UBkNy+IzJQeQGE89GpAZtE+Vj+ZZb7i7bLYbycI0dffQPyjYsjBYMCd4ChymdpnMdE50Wigi1egYM0XOksS7bYt4plmk7iWjheiS6LspTH/kxkW9Mhk6dRKrw+fbb76s5B6lyA4YhokQIpeeu1TmIaECMK9pT5p1hOfaVNpOIQNJo/5jkN50IuF+kASMiIiJSESbKgAlxk88NOeH4LNPJwDiIyWf5TCQIT5X/8pe7yvB1Ij/otHQqbvrTbWM8xNwnGD0XX/ynYfl0CLjxJ1IlTa9nwNBxiHz2vZ4BwzJGElErpMVT3lB0Php1MOiw0PFjTgTq5zPnbaRDkEinHkL7461MnOu8XCrq04CpPhowtQYMc1GRjgHDdcxnojEwBhAmDGlcj9F2MJQw8hGmL+lEtYXRkl9zkU7kCHWF4m1MuQHDMKHYVloP1yDXNJ/D6GDfI/oQsT/kY4CwTHsV2yf6Lj8HqXIDBsU54nM75yD2K53b6xe/+NVQHYiJyVlu1I71gzRgRERERCrCRBowYWRww08EBuHvpM+Zc3P5RJfPdDKaRYWMRnQe4mk1HSn2hSfBLBOSf+aZ5w89qU3XG40BEyItN2DoHJHOhMNpeq58DhhMq3hN95//PL+MHEpf3R1DInLNnXtL+SQ8lhmCxH43mwuG/dOAqT4aMLUGTAyloT0Ik6CeGDLJMMQ8PRXDi8LooD1Jt9PpEKSI4GNoYloujFmi6yIajroxW2izMJ9Jw8Q9PPTxnHI95mEh/fbbV9RsO1UrA6adc1DPgJk27cqhOpAGjAaMiIiISGWYKAOGTj4mQtyMY7gwfIY8Ogh0Hvh8xx0PjIsBw80822VSx0jjDR90RHhCfNVV15f5EaKfarwMGMSxYozk6alSA4ZoIJ68s5+IoUiYRrGM2Ie8jnjTVLrfb7/9WVlvHgmUinU0YKqPBsxwAyaiOaItijlLaAswMFIRqcJwRvKJlMnzEVFuYbTkk/d2asDEtm644S/DyoVhFMYF7UIM8cR8YXJxPsex8MYnysUcMPmEw7laGTDtnIN6BkxEF8VyGDC0T/k+9Is0YEREREQqwkQZMESYMD/B8uWrh97OER0FJruMoUFpBAwRIhGhMlrFK5qZtyBNv+CCy8v0wx2Sw8OgctUzYFhuNQdMWgdp9QwYzJd4AxTLRK/QIUnfYMKTbtZnbhoMl9hmIzHPTLoNOl50xtLolxDmCuvkw65C5GnAVB8NmG8MANolhtGQxhwmpMW8JI1+47Qr5GNoNopAG6kBE0Od5s27tVwOcygiCFEMc0wj5YhwizYh2q4YDnR4/qfDbydif2PCYUyUdNsY1szLwueYPJhtRX5qwLRzDtoxYIjqY3njxu016/eLNGBEREREKsJEGTAhIjh4m0h0eiJUPt50kRowGBZjFQ3Dm4ZimFOIoT8xOSXC3KgXPZIbMHRS2n0LUoi0egZMDAeI8H+GEFGWCSwZaoBxwjJPrZkTh33AzArReeMcpWlp/ZgvHCPmTaOhRjEfRD2zi3QNmOqjAXP4+sdQiEg92oy4nrgew3AlQoM2DEOCiXqjnnjLGhP1ci0QYce1GUbCSA2YmFQXhUkcw42Y4JuoNoZPsky0XKwX7VZEF6KYDyZ/4xGTApOOmCz9tttWDBkj8ba02E+OeefOD8q01IBBrc5BOwYMpg/LfC8cb6u5aaooDRgRERGRijBRBgzGRDxBpRPDsBcmo+Qz5kBEgHDTTgeITgevJK0XtdGpYtJKDA2WeaIc8w5gyjA5JJ0YtksnZ8GC24aZFbkB00zxtpR2DRjEeSCfjgdGTETT0FHjrVHbtn0TtbNjx3vl8YSuu+7wHDBpGiYOZRlawDHRGcL4yrcb4tzHE//8zVGkxXfWTJTRgJm89LMBM2XKH4d+5xieXAu8GSgv99RTrwx7axvXKRNkR7QHkSEsRz6ibVu//uUyPwwMXiGd1hvpeZuRCsOHbTPMiGWu53i7WlyfvJI+n9CbyJZ02CXCzI22MNWTT26uebU15g0mLvlEuEQbHnXmBkyrcxAGTBpFc+mlVw2rg/MZpjBif/N9rbo0YEREREQqwkQZMIT1c/POE814+olxgEGwefNbQ+VivoPo1M+cOa+mrk7FJL90RDAaYp4ElunUpKHydGooG9tmuBTp7RgwmBx0XmLdeINJiLRGBgxP2XnqHB0OnhrnZUJpuUaKtz+xP3Qu06fNjZS+/jXtILJ87bVzS4OqmThuDZjJSz8bMJ0Kc5aJbvP0ECYIETP5ZN5jodxI5fXzh6Pi6g/5CfMkFfufGzWp2AZtQKMyRL/EsKRGGotzgGnfKGqv6tKAEREREakIE2XA1BNDXvI5WRA37gzpITIlzxuJMH9icl2ebNcbapOXJ5SfaBOW6XBgzDR7KwfDdBgiRDRLvbca8eSX6Jg8PRVPiZcte7RhZwqxD3RKmik6acyh02kHKDXDEK+sbqcTtG7dpmGROt2UBszo0YBRqnekASMiIiJSEXrJgFFqLKQBM3o0YJTqHWnAiIiIiFQEDRhVNWnAjB4NGKV6RxowIiIiIhVBA0ZVTRowo0cDRqnekQaMiIiISEXQgFFVEwbM5aev/OCII45Y+61vfWsayn/30hwNGKV6RxowIiIiIhVBA0ZVTREB861vfevIMGDijVAaMu2hAaNU70gDRkRERKQiaMCoqqnZEKTEkFmbGjKYNXnZfkYDRqnekQaMiIiISAWg03nKf792hwaMqpKaGTA5GjL10YBRqnekASMiIiIyCYkhGdHZ5O+Fv3xovgaMqpI6MWBy6l0j/WjIaMAo1TvSgBERERGZBAx2Jo9s1pl0CJKqmkZjwOQ0MWSm5WWrhAaMUr0jDRgRERGRHiUxXIbU7Om9BoyqmsbSgMkJQ2bQlKmsIaMBo1TvSANGREREpEdoEOVSpuVl66EBo6qm8TRgcuoYMpWYR0YDRqnekQaMiIiIyASSGC5tRbk0QwNGVU3dNGDqkRgypSk6GQ0ZDRilekcaMCIiIiJdJJ6yjzTKpRkaMKpqmmgDJic3ZAav3542ZDRglOodacCIiIiIjCNhroyH4ZKjAaOqpl4zYHIaGKo9ZchowCjVO9KAERERERljEsNl1MOKOkEDRlVNvW7A5IQhM2jKpIbMtLxst9CAUap3pAEjIiIiMkq6GeXSDA0YVTVNNgMmpxcMGQ0YpXpHGjAiIiIiIyA3XLoV5dIMDRhVNU12AyanjiEzNLFvXnas0IBRqnekASMiIiLSBtFxyqNc8nITiQaMqpqqZsDUY7wNGQ0YpXpHGjAiIiIidRg0XPJhRXSMjszL9gphwLz2wueFUlVQPxgwOY0MmZG2PWHA5OdWKdV9acCIiIiIDJIYLkMaaadnIphzxrZzF1608wk1/rrmjCf25WlqfHTDH7ctzH/r/URiyJRmcKeGzJyp24/Jz6nqvq6csvrjPE31p+b+YfuN+XUqIiIiUnkaRLmUaXlZkRR+K3maSDcYrSEj3Se+ozxdRERERKTSJIbLpIxykd5AA0Z6hUaGTF5OJo74XvJ0EREREZHKkZguk2IuF+l9NGCkV0kMmWFzyOTlpDuEOZani4iIiIhUAsyVOqbLkXk5kZFih0omCxNhyOzfv/+Gffv2vT5JtCnf/7GkG+dbRERERKSrJIaLQ4tk3NGAkclKNwwZDJiBgYG9k0HjbcBwjvM0EREREZFJR70oF00X6QYaMFIVMkNmTIZoasAcZjzMLRERERGRrhAGS2665OVExhsNGKkig21sOWfJaAwZDZjDGP0iIiIiIpOKxHBxaJH0DBow0g/khky7ER31DJhdu3btW7Vq1Tu7d+/el+eNRk899dSBnTt3Nqxz9erVB1955ZWBWGY/SIt1xsuAafdciYiIiIhMKLnpEpEveTmRiUIDRvqRMBVaGTL1DJibbrrpA9YZSwPmxRdf3E+d55577qd5HsKcIR/DheU33nhj3+OPP36QtHXr1h188803942XATN4fo7M00VEREREJpzEdHE+F+l5NGBEGs8fU8+A+clPfvLV2WefXdcoGang8ssv//g///M/38nz0PTp0z8+6qij/r5v375y+eSTT/78+OOP/5L9Pe200z4/4YQTvhwPA6aRMSUiIiIiMmHUM13yMiK9iAaMyHAGTfMyOmbhwoXFzp07P0YYHxs2bCgjUVauXDnMKNm8efP+5cuXv3vHHXe8t3Xr1oE0j2UiV15//fUB1rvrrrve27hx44HIj6FEiHpy8wW+853vfH3VVVd9FGls59hjj/2KfTn66KP/tmDBgg80YERERESksmi6SBXQgBFpDBEwYcBs2bKlmD59evFf/+t//cf27dtLQwYtXrz4/cH/A0O6+OKLP4n8ZcuWvZvno/POO+9TIlrWrl1bDiVC119//Ye5AfPwww+/Q96zzz47ZNrcdttt5TZnz579IX8XLVr0/ngYMNSdp4mIiIiIdAVNF6ka/I7zNBE5TDoECbPk+9///t8vvfTSL8OQ2bp165cbNmz4ZMqUKV/cc8897zEfy4knnvgF/yP4nBowF1544SeH1hlg+Ze//GVZBiOF+VuY1LeRAcNwpx/96EdfpWmsw7p8XrJkyfvMRzPWBozRLyIiIiLSdTRdpMpowIg0JjVgGCLE/4EnnniiNFbQW2+99Q5mDEbMunXriqVLl3522WWXlXOzEJWSGjAPPfTQ0LAlhiWRduqpp37OckzCmxswGCv/9E//9I958+Z9kKbXkwaMiIiIiExKNF2kX9CAEWlMasBccMEFn/zgBz/4W258YJKccsopnw/+vxjSDTfc8AXmTD0DBjF3y7/8y7+UkS2NDJg777zzPdKJnMm3m2usDRi2m6eJiIiIiIwJmi7Sj2jAiDQmDBiG/BCJwpwrufFx2WWXfcz/jblz535IZAsT7KYGzO23314aMsuXL/8sJvPFtCEthhY1MmAwdn71q199kW+znsbSgDH6RURERETGHE0X6Xc0YEQaEwbM0qVLyygWjJLc+EiNFMRkuWHIsBwR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IqKAAQAARkwBIyKigAEAAEZMASMiooABAABGTAEjIqKAAQAARkwBIyKigAEAAEZMASMiooABAABGTAEjIqKAAQAARkwBIyKigAEAAEZMASMiooABAABGTAEjIqKAAQAARkwBIyKigAEAAEZMASMiooABAABGTAEjIqKAAQAARkwBIyKigAEAAEZMASMiooABAABGTAEjIqKAAQAARkwBIyKigAEAAEZMASMiooABAABGTAEjIqKAAQAARkwBIyKigAEAAEZsthYwv35so4jsg3nh0U3NF18M/m9+b0cBAwAAjNRsLWAeWPhe8/QDvxGRfSzXnvpuo4ABAAB6ZzYXMO+s/0vz6aeNiOxDUcAAAAC9pIARkXFGAQMAAPSSAkZExhkFDAAA0EsKGBEZZxQwAABALylgRGScUcAAAAC9NFsLmLuu2KSAEdkHo4ABAAB6SQEjIuOMAgYAAOglBYyIjDMKGAAAoJcUMCIyzihgAACAXlLAiMg4o4ABAAB6SQEjIuOMAgYAAOglBYyIjDMKGAAAoJcUMCIyzihgAACAXlLAiMg4o4ABAAB6SQEjIuOMAgYAAOglBYyIjDMKGAAAoJcUMCIyzihgAACAXlLAiMg4o4ABAAB6SQEjfc3atZuades2D2yX0UYBAwAA9JICRvqY7dv/3hxwwNebBQsWD+yT0UYBAwAA9JICRvqYZcueb/bbb7/m9de3DuyT0UYBAwAA9JICRpJPPvlH88wzrzbbtv2tefXVD5r773+iee6518tIkY8++rxZufLl5vHHXyzHdV+7detfyv685oUX3mp27PhiYt/q1Rua9977fbNx42+aBx9c2Tz55Jpmy5Y/lWNWr36neeihp5oPP/yvgXNu2/bX5tln1zf33fd4OWf7fTds+LR81nyuTCO6997lzVNPvVy2bd3650nnScGS7fke7e2nnTa3OeqoHw68r4w+ChgAAKCXFDCSbN78hzIi5PjjTy7/rTnuuB83hx767YnnmbaT4qS+7sUX324OOuibk15z9NHHNZs2/a7sP+yw7zRHHvmDZv/9vzaxP8fnvO3X3HnnwxPnfO21rZPeMznmmB81KXKy/8Yb7yzb5sw5bWL/1VffUP572233T/peee8DD/xGs2PH/xQ4KYBy7O23Lx34HWT0UcAAAAC9pICRpBYwKVgy8iQlSMqLbDv11LObt9/+pIw0yfN5864sr8lok5QpKTgeeODJ5o03Pi5rquSYs846vxyTAqYWLBs2fNb8/OeXlOeHHPKtsgBuRtnkPXNc/SwpcHJMipa33trezJ+/qDw///xLy/5awOR9V6x4qRRCGTGTz3LEEd+bOE8+T4674oqFk77rXXc9VrZv3ryz0JHxRgEDAAD0kgJGklrAtMuKjBDJtvaIlxQnSR7XQialyzvv7JjIwQcfUkqVHFNHwNTXp3Sp5UrdlmIl2zJNKdOf8vjEE/990ufL+TKKJo9rAbN48d2Tjlmw4Oayfe3ajeX5okW3l+fdOx1l9M2cOT+dtE3GFwUMAADQSwoYSYYVMHfc8dBAAZMpShlpksfz519f9k+VHNMtYNav3zJQwCxceGvZltEuy5f/ujxetGjJpM+XUTjZnmlItYDpFisZpZPtF198VXl++OHfLRl2TNajaW+X8UUBAwAA9JICRpI9K2B2Tg3aOb3o00nZuPG35ZiZFjArVqwpj6+55qZJn+/YY08s2zPtqRYw69d/OOmYJCNnMlomi/PmmJtu+tWk/TfccEcZSZMFfLuvlfFEAQMAAPSSAkaSPSlgMook+88887yB89XMtICpI1QyTaju//jjz8u2rPmS57sqYHJXpeyra8+8++5nA59n7txfDLxOxhcFDAAA0EsKGEn2pIDJrZ0zxSfHnH76OeWW0VlkN9vq7aBnWsDkeZ1ulHMuW/Z8c8opZ5bnt9xyT9m/qwImi/HWOy6dcMKcSfvWrNlYtueW2d3XyfiigAEAAHpJASPJ++//sZQTWdelbsvUol0VMEkW3T3ppFPKcTU/+cnpk6YgHXXUDyeOT2mSY9pTgxYuvK1sy+iXPM9tolO+1POlUMlCv598svNW0rWAyZ2a2t+h5owzzi37s0hwe3vKpe4tqWX8UcAAAAC9pICRryJbt/6llDE7dnwxsG9Ps23b30opM9Nz1hE0dRSOzK4oYAAAgF5SwMi+kqeffqU555yLSvly0UXzB/bL7IgCBgAA6CUFjOwrybSl3AFp3rwry/o03f0yO6KAAQAAekkBI/tKso5Nd5vMvihgAACAXlLAiMg4o4ABAAB6SQEjIuOMAgYAAOglBYyIjDMKGAAAoJcUMCIyzihgAACAXlLAiMg4o4ABAAB6SQEjIuOMAgYAAOglBcxgcjvjV1/9YNrZunXXn/ORR55pjjjie/887s8D+7p5+ulXmpUr104837Hji2b79r9Pmexvvz7bTjhhTvlc3XPPJFu2/Kk58sgfNKtWvTawb6o899zrzaWXLmi2bftr+RztfevXbymfq/uarzrz5l35zwvp5QPbkzlzTmuWL//1wPZ81pdffm/K5LfovmYUefTRVc2GDZ8ObE/OPXdec+edDw9sH5ac48wzz2veemv7wL7ZEAUMAADQSwqYwSxZsrTZb7/9pp2UJt1ztLN58+/LcXfc8dDAvm4uuODScuz99z9Rnufc3fdr54UX3pz0+o8++rxsr8XJqaee3Rx++HeHZsGCxROve+ONj5vVq9+ZyA033FHO88QTqydtb+eVV96f9N4XXnh5KZrynnPm/HRSCfPii2+X89Xnxx9/8tAyZKo888yrU5YT7Rx11A+bK6/8z4HtyQEHfH1oiVE/21S5+OKrmgceeHIg+bt2zzVV1q7d1Kxbt3lge03+bocc8q3mwAO/8c/fdsPA/ssuu7bs724flg8//K/muON+3Bx88CHNxo2/Gdi/t6OAAQAAekkBM5gUMLlYz8Vrzc0339Xsv//XJm17/fWt5QK9W8BceOFlzUEHfXNS6sV8d/uiRbdPem1GtFxxxcJybD5HRl+kTOmmFjNTFTDZn9cuXfpEc/vtSyclJcXO8z8w8bqMmOgWD7tLSpz/+dz/KL/ZjTfeWT5T9v/kJ6eX0UTd1+V3zH+nO0LjpZfeLcenhOnu66ZdwOQzffzx5xPJ++b71+fbtv1t4riMTsp7PPbYqvI4hUmep2Q67LDvlMf5fjV5vmLFmoH3H5YUUXlNu/AalhQ6xxzzo3LuJ59cU947pU2SsirbU/zUbclUo6oyCikjmI4++riBfXs7ChgAAKCXFDCDSfGRcqS97Ve/eqRcwLe3ZaRBLoq7BUxGgORCOqMtdpWMUEjZ0n3/JEVBt1xpJxf1ee/2MaeccuZE+ZEL77PPvmDgdZnelP2ZqtPenjIi3yd56KGnyjErV748sW1Y2lOvUkbkNW+//cnE85QOmQqVaTwpDrJ/zZqNZfu8efMHPttUybSmjAzpTrdqJyNuarGT5HEtLaZKCor2OXZ+553Tv95446PyPCXRa6/tLNrqiJd33/2sPF+//sOBzzEsy5Y9X45PYdfd103+DvPnXz/x/rvLU0+tGzhHTQqcHLNixUsD+/ZmFDAAAEAvKWAGkwImF/C33nrvRFKq5GK2vS2jPbJtWAFz3nkXD5y3m5Qk7QImoxkyaiXJSJbu8e10C5hcuOd5Co/8N58t36F9nuzLtny+jPronrOeJ1NdTj/9nFI0ZNTJsDz77PqJ16QYydSjvG/7XLWg+eSTf0wUQ4sX313+m+lEuypUavLaFDYpJbr72sn6Myk68tnz/VK+ZBRJ3uv5598oyXdPmZPHmS41rIDJqJ5Mj8q+PE8Bk98qj+sInJw755rO509OO21uGZnT3d5Oiqm8b3uaVX7/mnyOfIaMaGpvr6N4huWDD/5fec3u3nvcUcAAAAC9pIAZTF0DJheuNRmt0t1WS4evqoDJKI+cL8miq3V7ipOlS1dMShaazXG1gMl0lDyvU2lSFmQUz4MPriz7czGe7/D97/9bmX7T/Sw1ixYtKa/PSJa771428XmGpb4m69XUbZdccvXE44wauuuuxwZeV9OdfjUsdWTNrtZPaac9BamO9qn72mvAZI2bYQXMOedcVMqrFD55XqdJ5dj8u8jj6667pYxw6r73sKRMy3kyoqm7r528T8qj/M2GLaBcC7aZjGap/0aSlFHd/XsrChgAAKCXFDCD+SqmIOXYdlkzLDmmXcBkSkvWHsl0mnYBc/XVN5b3SUHTTV2wNXdaOvTQb09ahPf6629vFi++p4zUOOmkU8p32rTpd5M+azu5uM9r589fNLAvSblTFwlOCVS3Z+RGRo5ke4qbjEapZcfmzX8o3ynnzP6zzjq/PE929VlqMo2qvdbM7pLfNQvWZoRSfpOZFjDDpiDleb53/i55nBIrI2m67z0stYCazoK9OSafKX/H7r49KWDyN8/vnqlp+Rt19++tKGAAAIBemq0FzAML3/uXLWByB5oUASlAdpf2VJ6an/3swoEC5thjTxw4rp2sBZKL7e5dkJI6VSqlR/d1NSlNckySkS/d/XUETdIdjZKpP3Wdk7otozlSdqS0mTv3FxPnzgiZyy67buh7dJPX5je/6aZfDewblpQ/ed+8T8qWhx9+euL71NE8+W3zOCXZsALm8ssXlv3527QLmIwoyvP6O+1qfZ528m+hFjfTSb5z7kiVx3mv+tnzW+Z9U/zUbbltdff1NbmzU367lDr1Mw+7u9LeiAIGAADoJQXMYGphkQvnmjrCo70tIwyyrVvApLzJXZO6551u9qSAqekWMOvXbynP6/SZYckdnXKxnpEd+W8u7rPGTPsOQnVtmRdeeGvS9nqOut5KfZ4iJNNu2oXIz39+SUl+yxNP/PeBz9FNndq0YcNnA/u6yflybJIRH1l/pk5Byl2M2ncyyuP8d1gBk4Ipny+jUPK8faemfJf6+u77D0sKoZyjTgObbvL3TglzzTU3TZRe9U5aef+67YQT5gy8tib/XlJ01ef526YM6h63N6KAAQAAekkBM5hMN8kFb24bXDNnzmnlAri9ra4T0i5g6uK4Wai1e97pZiYFTEajtBfU7RYwWUw3a9UMWzA2dyZK2ZTHmZKTET353ilgcivtWmjsKvm+ef2wAiajNnKu3HGpXXbk+0yngMkx0506c9tt95fpOXmfL7MGzFRTkJJazN16630D7z8seY/uQsi7S50GljsYtbfPZApSRmvl2I0bfzuxLSNisu2ee3Y/8mjUUcAAAAC9pIAZTC76u4voTncKUh1x8uab2wbOO93UAiYjKDKKZFcFTEZCZL2T+rxdwOQOQvnMWYy1+7pkwYKbB0ZF1AImxUMu2mvqFKPchadua09pGVbA5I5HmdKTciT7UoAkeby7AiblwZ4UBl92Ed68JiN7Mr0nzzPKJJ8/RVMdZTPdW2hnpEymX3W37yp5v+7fJJluAVOnSrVHv9RcdNH88u9h2CK/44wCBgAA6CUFzOTkrjW5SK0X6jXTLWBy4ZvFcae6zfN0kgIm02BSGGTkzVQFTB1t014LpF3A1DJoqgvuLHCb6TrtbbWA6R5bb4PcHZlRM6yAyfOUCSkwMqUnhU2SOw3troDJ4sF5fX7j7r5dZU8KmCx+3F7oOP+tye+fv28KsTyvixDfd9/jA+/dTm4rneNWrnx5YN9UyRo9eU0WD+7um04Bk+lh+Tea3zflW3d/1pfJv6v8jXML6+7+cUUBAwAA9JICZnLq4qsZfdLe3i5gUnKkGHjiidXl2Log6/vv/7Ecc8st9wycdyZJMVAv9rdt+2uzcOFt5XnWEnnppXdLcrGdAiXb29NkuiNgUjpkwdlc1KdIqLnqqhvKcbntdPu9pypg6hSW6RQwtcTKxX4W700Bk0Lm8cdfLDnjjHN3W8DkN8j0qe72XSXfN0VPt4C5+OKrSvI4hVAe5xbgtYBJKZRpWhmtkrV78l3qwrX5ba+9dnF5XMubTKnK87VrNw58hprc3WqmRVyKt7wm3yMjgNp/r3o77kyDam9//fWt5bX1bku//OU1Q6eb1WQ9nXoHrfwb6u4fRxQwAABALylgJifTRnKB3d3eLmCy/ksudpNMAarroOTiOIXHTNb8GJaMSmnf5jkjI7ojM2q602G6a8BkylDKj3z29uvyPAsJd2+P3C1gcmGfsqROHUq50v28SbuAyRSeY475UfPeezvPXacg1cVj8967K2BmmpQjOXfeJ58522oBk1Es3eTY7hSkduoaMHXqVf7mdV/+3ilwMtqm+7o9TW7JnfdJAZjnmXrW/VsPS6Z4bdjwaXl83XW3DJx3WHJ8Pn/+1rsqa0YVBQwAANBLCpjJydot3VIiyYVqLVoyqiOjHzIapH0Bm8JhV7cG/jLJ+2QKSTvDppnkM+YivjuCZ7rJRXx7ZESm0mQESLYPu2V2TabxZFHi7vYk52tP6cots6dal2ZPk+lWKS1SmNS/U0avZB2a7rFJRvTkLkvd7TX5N5ByI6Oacs7u/kzhyTm6279M8vvWf3v139vuUv/95ft3z7er5LX1dtfjjgIGAADoJQWMiIwzChgAAKCXFDAiMs4oYAAAgF5SwIjIOKOAAQAAekkBIyLjjAIGAADoJQWMiIwzChgAAKCXFDAiMs4oYAAAgF5SwIjIOKOAAQAAekkBIyLjjAIGAADoJQWMiIwzChgAAKCXFDAiMs4oYAAAgF5SwIjIOKOAAQAAekkBIyLjjAIGAADoJQWMiIwzChgAAKCXFDAiMs4oYAAAgF5SwIjIOKOAAQAAekkBIyLjjAIGAADoJQWMiIwzChgAAKCXFDAiMs4oYAAAgF6azQXMy8/+UUT2sShgAACAXpqtBcxT92xsnvg/m0RkH8vj/+e9RgEDAAD0zmwtYERExhkFDAAAMFIKGBERBQwAADBiChgREQUMAAAwYgoYEREFDAAAMGIKGBERBQwAADBiChgREQUMAAAwYgoYEREFDAAAMGIKGBERBQwAADBiChgREQUMAAAwYgoYEREFDAAAMGIKGBERBQwAADBiChgREQUMAAAwYgoYEREFDAAAMGIKGBERBQwAADBiChgREQUMAAAwYgoYEREFDAAAMGIKGBERBQwAADBiChgREQUMAAAwYgoYEREFDAAAMGIKGBERBQwAADBiChgREQUMAAAwYgoYEREFDAAAMGIKGBERBQwAADBiChgREQUMAAAwYgoYEREFDAAAMGIKGBERBQwAADBiChgREQUMAAAwYgoYEREFDAAAMGIKGBERBQwAADBiChgREQUMAAAwYgoYEREFDAAAMGIKGBERBQwAADBiChgREQUMAAAwYgoYEREFDAAAMGIKGBERBQwAADBiChgREQUMAAAwYgoYEREFDAAAMGIKGBERBQwAADBiChgREQUMAAAwYgoYEREFDAAAMGIKGBERBQwAADBiChgREQUMAAAwYgoYEREFDAAAMGIKGBERBQwAADBiChgREQUMAAAwYgoYEREFDAAAMGKzuYD57ONNze92iMi+lO7/zmdLFDAAAMBIzeYC5t6r32tu+4WI7Cv5z7M2Np//efB/67MhChgAAGCkZnUBc817zaa3/9p8+mkjIvtAFDAAAEBvKWBEZFxRwAAAAL2lgBGRcUUBAwAA9JYCRkTGFQUMAADQWwoYERlXFDAAAEBvKWBEZFxRwAAAAL2lgBGRcUUBAwAA9NZsLmCWXLxJASOyD0UBAwAA9JYCRkTGFQUMAADQWwoYERlXFDAAAEBvKWBEZFxRwAAAAL2lgBGRcUUBAwAA9JYCRkTGFQUMAADQWwoYERlXFDAAAEBvKWBEZFxRwAAAAL2lgBGRcUUBAwAA9JYCRkTGFQUMAADQWwoYERlXFDAAAEBvKWBkb+add3Y0l112bfPCC28N7BuWmR7fzpYtf2qefvqVZuvWPw/sk/FEAQMAAPSWAkb2Zl588e1mv/32a+688+GBfcMy0+PbWbz47vJaBczeiwIGAADoLQWM7M3MtFCZ6fHtHHHE95qzzjp/YLuMLwoYAACgtxQwMiybN/++lB07dnzRrFr1WrN06Ypm3brNE/sefXRVs3r1OwOvS9as2djcf/8TU073ef/9PzbLlj3fPPXUuua5514fKFTynplidO+9y//7HH+Z2DdVAbN+/ZbyGV9/fevA+yWvvPJ+ed2KFS8N7JPxRQEDAAD0lgJGhuWRR54phcXxx59c/luTEST77/+1ieeHH/7d5qOPPi+vSdnyk5+cPun4Aw/8RilN6nmffHLNpNfX1ELlvfd+3xx77IkD53jhhTfL/m4Bk7Km+xkvuODSge8zf/6i5oADvt588sk/BvbJ+KKAAQAAeksBI8NSC5ijjz6ujCp5/vk3JoqTRYuWNG+//Ukzb96V5XlGw+Q1V111Q3l+3nkXN2++ua2UJHnNoYd+uxQfGzf+pjxPofLMM682mzf/ofnlL6+ZVKiceurZ5fnNN9/VvPXW9ubuu5eV1xx00Deb7dv/PlDAZIRMnp955nnNhg2fNUuWLC0lT/u7pKTJ6y+55OqB7ynjjQIGAADoLQWMDEstYB5//MWJbbUcqc9TeLRHnGSEScqSFCX1mNNPP6cck+lKtaBZsuSBif3tQiWlTh6feOK/l7sd1Zx99gVle6YRdQuYV1/9oDw/8sgfNO+++9nA90hS9tTP0N0n440CBgAA6C0FjAzLsAKmlint4/J87txflOlHtTxp77/ttvvL9oceeqqZM+en5fHGjb+d2N8uVPJeeTxVMgqnW8Ak1113y8QxV1yxsNm27W+TPkNG5BxyyLcmbZO9EwUMAADQWwoYGZaZFjAff/x5eXzMMT+atH/BgsVl+/Llv25OOGFOebxhw6cT+9uFyooVa8rjc8+dV47pJtOYhhUwSUbCnHzyf5R9c+acNrF927a/llE5CxfeNul42TtRwAAAAL2lgJFhmWkBk8cHH3xIed4egVIX1H3jjY8m1oyZagpSphDlcdaIybot3c+U5A5LOSajXrr7kqxZk/317ksPP/x0eZ41abrHyvijgAEAAHpLASPDsicFTBbAzfOjjvph88ADT06s+ZI7I2V/Xa8lI1LymgcfXFlGq9QCJsdcdNH88jwjabIt58j0oZdeerfszyiYrDWTPPjgU+WW1ilsLr98YbltdbbXBXtzfM6fUqb7/WTvRAEDAAD0lgJGhiV3NkoR8sQTqye2nXHGuaU8aR+XY84556LyeMeOf5SpPu3bTGfh3pQk9fjHHltVSpI60qVbwGQqU70zUs0RR3yvWbXqtYlz3HPPsnJnpYyuWbduc3PccT+eODblT6Yy5bgtW/5Utt1xx0MD30/2ThQwAABAbylg5KtOpg/ljkbdxXDbyXSjFDbd7TUZ6ZLbULfvqNRNCpb6+KOPPi+3te4eI7MrChgAAKC3FDAiMq4oYAAAgN5SwIjIuKKAAQAAeksBIyLjigIGAADoLQWMiIwrChgAAKC3FDAiMq4oYAAAgN5SwIjIuKKAAQAAeksBIyLjigIGAADoLQWMiIwrChgAAKC3FDAiMq4oYAAAgN5SwEw/t9++tDnttLnN5s2/H9jXzdq1m5qf/OT0Sdseeuip5oorFk48nzPntGb16g2Tjtmx44vmvfd+P2W2b//7pOMXLLi5eeGFtwbef0+zY8c/yntMN5988o+Bc8jMs2TJA+Xv293ezpYtf2qWLXu++eUvr/nn3/zNie1vvbW9efPNbUPzwQf/r3n77U8G0v13NK4oYAAAgN5SwOw+KVxSluy3337NAQd8vbn11vtKGZM89tiqgeOTp59+pRyfx0uXPtEsWLC4OeGEOc2BB36jPE6y//TTzymPH3zwqXLs+vVbyvapsnLl2mbRoiXlM+T4gw8+pLn77mUT77tixUvNBRdcOu0888yrkz73tdfu/FzTzaWXLhj47lMlF/6rVr02sL2dFAv5jk89ta5Zt25zs3XrnweOGUVSVKxZs3Fgezt33fVYc911twxs/7LJex9yyLdK8hulBFu48Nbmkkuubn72swv/+W/vp83hh3934jfP45R5ee377/9x4G/Szqmnnj2wLdnddx1VFDAAAEBvKWCG58MP/6uUIilI9t//ayXHHffjiRx77InlQjalSve1SbuAufHGO8uF8KGHfrsUOHlcL4yPPvq48vimm35Vjs2IkhQ+5547r1x45/FFF81vjj/+5PI4F+f5TBdeeHk5vlvALF/+6+aMM86dlHzGvFfO1933+OMvTvrcKWByzhQl00lGWXS/+1RJiZXfrbu9nW5RkKSEyOiP7rFfZc4887zyXm+88dHAvpqTTjql/P2627+KbNr0u1KspKDLZ0g5ln8X55xzUXP++ZeWz5ZRMilr2q/LiKmNG39TkmPqv7uMisq2zZv/0Lzzzo6JpNRSwAyPAgYAABgpBcxgtm37W7kQzoXqiSf+e3PHHQ+VkQntYzLyI/tzQTv5tX8thceRR/5goqC59dZ7y74UJXPn/mLi2O9//9+mHBGSgiXTnfL4ssuuKxf/dd+uCphhWbt243+XCx8P7OsmBUyKgO72L5uUR/kMv/rVIwP72skxef9Mtcn0qvo7przpHvtVZuXKl8vUnl1NzRllAZOkZErZ0p3ilu27Kk0yjS3F286SZunE75xRRN1j64iZqc416ihgAACA3lLADM9LL71bRhDkcS68M3olF8bvvvtZc/bZF5SL2DoNpJ1cwGfEyymnnFmOyeMnn1zTHHXUD5uDDvrm0MybN3/i9ZnWlGPrqJs8zkV/fXz99bf/SxYwGb2Rz7C7kSy1tKrPM4Ij3z3bU4w999zrZZpWzpPpXw8//PREaZJjM6LnwQdXlmPqOVI2ZFpTd72aTL9avfqd5uWX3yuPu2VYRpfktZlClgJuWAGTkSv1c6xf/+GkfSnnMhIlnzvnv//+J/75b+q3k44ZlnyfTDNbtOj2kmuuual8//w7qduSWgpmpEz9jdr/zb+t7rkVMFNHAQMAAIyUAmb3yUVzRsSk7MjFay5sd7fwbZ3SUkfI5PUZCZPRCu1kiknKmvq6FAwpK/IemeqUx5l+lAIoj1MS/CsWMBntk6Kgu72bbgGT5Ltn+8cff17+W0upPM6+HJMRILV8qLnwwstKiZKRNHnenm5Vp+Jcdtm15fetr6n7t279y9D1U9oFzD33LBvY//OfX1LeM/tT2OQzHXPMjyb2b9jw2cB3zr+lrOmT3Hvv8rLuTUZe1dTPl9+wvb3+28rnzDpC2f/ii2+Xz5jvqoCZWRQwAADASClghidrwNR1W+rFc4qJlB252E/xccst9wy8Lvnoo51FQZLX52K+TmmqI1tqsq1dwNT3zvaMqsjz7hSkXGwvXnx3efxVFzApK77qAiZrmuT9p1qwuJ0cVwuYjFjJaJZsywK1dX+SdXHyfV599YMyMqmO+HjkkWdKMVEXTV66dEUpPfK4TulKMt0o27KGTUY15Y5VeV73X375wvI8C+GmgMtImRQbtYCpv2nKlay7kkKjFjZ1mlX+ZnmeIi13xere8aomx2ctoHzH/Dvp7t/dFKRawOTfQr5Pu4DJZxv2b26qc406ChgAAKC3FDBTJ6NBcmGbIiS3CM6FcEY41BIgd8S57bb7S3LhX1938813TYyWycK3WVA3F9a5i073NsEZpdEuYDJ6IkVBLpRTxGRbt4BJ4ZAL67xn3uOBB54c+OztzKSAyeKvGV3R3f5lkt8x3ydTcbr7usnnzLFZrLc9oiWlV3t/e62WOr0p03bqtno3qfz+eZ7fNM8zAiSfIyVFe12ZLPSb/XmcwiyPc0wWPa7HtKcg5W+aY7J2TF3gNqVGttWRPrWAyXS29necKo8+umqigMn7ZspRUhfhzXnrtjo9Lsn2/BvJ71JHCWWNohQwuStWnqf8amd3U8FGFQUMAADQWwqYqZOL2azdkXVX6nSSXCBnqkdNXSS2FiRZEyTH1VIgpUeOycVwLRO6yZSi+p65MM4Um1zY122LF99T1p2poxYykqKOZjjiiO/tdl2RmRQwKV9SwnS3f5mkjJruOfM5870yCicjR1J4ZfRIe393KlOmEWV7bmHd3p6ypE5Ryt8xx2SR2lpctRepbRcw+X3zOOVY+3ztAiZ/o+7fsaaO4Kn/Ztrn2FXaBUwKpvpd5827ciK1jHnllfcnXlfXgKkjfObPv75873YB032vvRUFDAAA0FsKmKlTR01kakimvGSqT3sh1zzOxW8uyuvtmG+44Y4ysqJ9G+qUKilzanJxnPVg2tt2dfedJOuNdBeAnW5mUsDks2Xh4O72PU3WN8l7Z22b7r5haRcYw5L9uX12e9v8+YvK9vzmdVvuRpVtKajqtsMO+04pw+qiyu1ztAuY559/ozw+77yLJx3TLmBSvuWYTHfasOHTSam3ih62aO+uMqyA6U5byrmHFTApzp59dv3ELamzcPBUBUx+m939extVFDAAAEBvKWCmTqar5II6j3Nb5FzI5m46eZ5RJ/VORxldUV+TO+rkAr5dwOS/u0t7ilHOm1Ej7dRFZ7vbk7xn97O3M90Cpl70D7u7054mxVWKgLow7e6S959pAZOFa7M9U53qtvr7n3XW+RPb7rjjoYnf+847H550jnYBU2+ZvXMK0v987nahkhE9w87TzldRwOR75PPU1PV0ugVM/V7tTFXAZORPRsxM92/yVUYBAwAA9JYCZvrJdJhcuF511Q3lvxlFkbvOdI9L2gVMLpaTjAZJYVIX9s1FfN2XhWDrazP9KCVIO7nrUd6zuz3JhXn3/duZbgGTURM5LuuZdPftSVIipIDI79XdN1Xy/jMtYDKCKGVDfp8snps1Tupv3F5/JXcXqlO3ss5L+xztAiapd7HKVKhMAcvtwfO6Wqi89db2iXNlod6MUMrIp/Znm0kBk3Vp6mfIqJpawEyVLD5cX7tzDZhry2LDNfffP/UImAcffGpGU6O+yihgAACA3lLADE9GB2TqUC60M8IlU4syzSMXs7WEyVSO7utq2gVMkttHpxRIAZNzPvHE6rI/a7u0i5FciKcc6CajN3Ix391ek9fWu+l0kxKhlgndfUkuyPP6TM9pr0fzZZM78XTLgt0lx+9qEeDsTznS3Z73qOvxJBlJkhEl3eMuvviqUtJ0t3cLmEz1aY8sya2g87dr36Uo06rad8nK3yd3V6ojS04++T+G3tVoWOrCy3XdmBQ6ufNSe/RLO+3X5nPmb5vRRjVZfHhnAbOmfLZ6y+qUVSmK2lOzxhkFDAAA0FsKmMHkIjUXwfXCOsk6MLlIT3EynfUzagGTEievzeOUG5nWVI/JBXYKkOzLKIpsywiK9vtON5s3/6GsAZIFg2eajMxJgZHz5HH3u/wrJXeOat8hqJuMgkm626dKbime37a7vZ0UIrlLVnf7dJNbZee3r1PZMoKn3rY8qSNtUvDUx9meO3Tl+BQwWd8mxVRN7iKVAiYjq7r/VvL63d26fFRRwAAAAL2lgBmeTC3KCIdM59iTtTIyymXhwtvK41zs5jzdY2pym+u6SG3uopQyZKZp3y55T9O+lbaMLymNso5Nd3vWGcrfNtOoUtalHGunlj75u6V8a782a8XkTlx5nBIm/75qdlcojTIKGAAAoLcUMCIyrihgAACA3lLAiMi4ooABAAB6SwEjIuOKAgYAAOgtBYyIjCsKGAAAoLcUMCIyrihgAACA3lLAiMi4ooABAAB6SwEjIuOKAgYAAOgtBYyIjCsKGAAAoLcUMCIyrihgAACA3lLAiMi4ooABAAB6SwEjIuOKAgYAAOgtBYyIjCsKGAAAoLcUMCIyrihgAACA3lLAiMi4ooABAAB6SwEjIuOKAgYAAOit2VzA3HvNewoYkX0oChgAAKC3FDAiMq4oYAAAgN5SwIjIuKKAAQAAeksBIyLjigIGAADorVldwFy9ubn+jI0isg9FAQMAAPTSbC5g/vZXEdnX0v3f+WyJAgYAABip2VzAiIiMKwoYAABgpBQwIiIKGAAAYMQUMCIiChgAAGDEFDAiIgoYAABgxBQwIiIKGAAAYMQUMCIiChgAAGDEFDAiIgoYAABgxBQwIiIKGAAAYMQUMCIiChgAAGDEFDAiIgoYAABgxBQwIiIKGAAAYMQUMCIiChgAAGDEFDAiIgoYAABgxBQwIiIKGAAAYMQUMCIiChgAAGDEFDAiIgoYAABgxBQwIiIKGAAAYMQUMCIiChgAAGDEFDAiIgoYAABgxBQwIiIKGAAAYMQUMCIiChgAAGDEFDAiIgoYAABgxBQwIiIKGAAAYMQUMCIiChgAAGDEFDAiIgoYAABgxBQwIiIKGAAAYMQUMCIiChgAAGDEFDAiIgoYAABgxBQwIiIKGAAAYMQUMCIiChgAAGDEFDAiIgoYAABgxFLAfPrpY42ISJ+jgAEAAEZq6dL/dc9DD/3vZ0VE+pyHH/7GCwoYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAfzn/H3VCaug4SUzNAAAAAElFTkSuQmCC>
