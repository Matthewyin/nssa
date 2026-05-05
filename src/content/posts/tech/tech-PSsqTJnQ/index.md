---
title: "AI-Agent-NetTools: AI 智能体网络交互工具深度解析"
description: "本文深入探讨了 AI Agent 在网络交互中的工具应用，详细分析了智能体如何通过特定接口与互联网资源进行交互。内容涵盖了 Agent 设计模式、常用网络工具集及其在自动化工作流中的关键作用，旨在为开发者提供构建高效、智能化网络协作 Agent 的技术参考与实践指导，提升大模型在复杂网络环境下的自主解决问题能力。"
tags: ["AI Agent", "技术专题", "网络工具", "人工智能", "自动化工作流"]
date: "2026-05-05T10:27:39.183Z"
lastmod: "2026-05-05T10:27:39.183Z"
categories: ["技术专题"]
---
# **AIAgent-NetTools**

基于 LangGraph \+ LangChain \+ MCP 协议的智能网络诊断系统

## **📋 目录**

* 项目简介  
* 核心特性  
* 安装部署  
* 架构设计  
* 使用方法  
* 配置说明  
* 开发指南

---

## **项目简介**

AIAgent-NetTools 是一个智能网络诊断系统，结合了大语言模型（LLM）和网络诊断工具，能够理解自然语言指令并自动执行网络诊断任务。

**核心能力**：

* 🤖 自然语言交互：用户可以用自然语言描述网络问题  
* 🔄 ReAct 循环模式：观察-思考-行动的智能决策循环  
* 🛠️ 多工具协同：支持 ping、traceroute、nslookup、mtr 等网络诊断工具  
* 🔗 参数依赖解决：后续工具可以使用前面工具的结果  
* 📊 结构化输出：提供原始输出、结构化结果和 LLM 分析三段式报告  
* 🌐 OpenWebUI 集成：提供友好的 Web 界面

---

## **核心特性**

### **1\. ReAct 循环模式**

采用"观察-思考-行动"的循环模式，解决了传统一次性规划模式无法处理工具参数依赖的问题。

**工作流程**：

用户输入 → 路由 → Think（思考）→ Act（行动）→ Observe（观察）

                       ↑                              ↓

                       └──────────── (循环) ──────────┘

                                     ↓ (完成)

                                 最终回答

**优势**：

* 每次只执行一个工具，执行后让 LLM 观察结果  
* 后续工具可以使用前面工具的输出  
* LLM 可以根据观察结果动态调整策略

### **2\. MCP 协议标准化**

使用官方 MCP (Model Context Protocol) SDK，实现完整的 stdio transport 通信。

**特点**：

* 符合 MCP 协议标准  
* 通过 stdio 进行 JSON-RPC 2.0 通信  
* 支持跨语言、跨进程  
* 易于扩展新工具

### **3\. 三段式输出结构**

每个工具的结果包含三个部分：

1. **原始输出**：工具的原始执行结果  
2. **结构化结果**：提取关键信息的结构化数据  
3. **LLM 分析**：大语言模型对结果的专业分析

---

## **安装部署**

### **系统要求**

* **操作系统**：macOS / Linux / Windows (WSL)  
* **Python**：3.11 或更高版本  
* **内存**：建议 8GB 以上  
* **磁盘空间**：至少 10GB（用于模型存储）

### **1\. 安装 uv（Python 包管理工具）**

\# macOS / Linux

curl \-LsSf https://astral.sh/uv/install.sh | sh

​

\# 或使用 pip

pip install uv

### **2\. 克隆项目**

git clone \<repository-url\>

cd AIAgent\_netools

### **3\. 创建虚拟环境并安装依赖**

\# 创建虚拟环境（Python 3.11）

uv venv \--python 3.11

​

\# 激活虚拟环境

source .venv/bin/activate  \# macOS/Linux

\# 或

.venv\\Scripts\\activate  \# Windows

​

\# 安装项目依赖

cd aiagent-netools

uv pip install \-e .

### **4\. 安装 Ollama 和模型**

#### **4.1 安装 Ollama**

\# macOS

brew install ollama

​

\# Linux

curl \-fsSL https://ollama.com/install.sh | sh

​

\# 启动 Ollama 服务

ollama serve

#### **4.2 下载模型**

\# 下载 LLM 模型（用于推理）

ollama pull deepseek-r1:8b

​

\# 下载 Embedding 模型（用于向量检索）

ollama pull nomic-embed-text

### **5\. 配置文件**

配置文件位于 `aiagent-netools/config/` 目录：

config/

├── llm\_config.yaml          \# LLM 配置

├── mcp\_config.yaml          \# MCP Server 配置

├── langgraph\_config.yaml    \# LangGraph 工作流配置

├── langchain\_config.yaml    \# LangChain 配置

├── agent\_config.yaml        \# Agent 配置

└── tools\_config.yaml        \# 工具配置

**主要配置项**：

`llm_config.yaml`：

llm:

 provider: "ollama"

 base\_url: "http://localhost:11434"

 model: "deepseek-r1:8b"

 temperature: 0.7

 max\_tokens: 2000

`mcp_config.yaml`：

mcp\_servers:

 \- name: network-mcp

   command: python

   args:

     \- "-m"

     \- "mcp\_servers.network\_mcp.server"

   tools\_prefix: "network"

### **6\. 启动服务**

\# 进入项目目录

cd aiagent-netools

\# 启动 FastAPI 服务

python \-m graph\_service.main

服务启动后，默认监听 `http://localhost:30021`

**验证服务**：

curl http://localhost:30021/health

\# 输出: {"status":"healthy","service":"graph\_service","version":"0.1.0"}

---

## **架构设计**

### **系统架构**

┌─────────────────────────────────────────────────────────────────┐

│                         用户界面层                                │

│  ┌──────────────┐              ┌──────────────┐                 │

│  │  OpenWebUI   │              │  命令行/API  │                 │

│  │  (端口30010) │              │              │                 │

│  └──────┬───────┘              └──────┬───────┘                 │

└─────────┼──────────────────────────────┼─────────────────────────┘

         │                              │

         └──────────────┬───────────────┘

                        │ HTTP/OpenAI API

┌─────────────────────────┼─────────────────────────────────────────┐

│                    API 服务层                                      │

│  ┌──────────────────────▼──────────────────────┐                 │

│  │     FastAPI (端口30021)                     │                 │

│  │  \- OpenAI 兼容接口                          │                 │

│  │  \- 流式响应支持                             │                 │

│  │  \- 健康检查                                 │                 │

│  └──────────────────────┬──────────────────────┘                 │

└─────────────────────────┼─────────────────────────────────────────┘

                         │

┌─────────────────────────┼─────────────────────────────────────────┐

│                   编排层 (LangGraph)                              │

│  ┌──────────────────────▼──────────────────────┐                 │

│  │           ReAct 循环工作流                   │                 │

│  │                                              │                 │

│  │  user\_input → router → react\_think           │                 │

│  │                           ↓                  │                 │

│  │                       react\_act              │                 │

│  │                           ↓                  │                 │

│  │                     react\_observe            │                 │

│  │                           ↓                  │                 │

│  │                    判断：完成？               │                 │

│  │                    ↙        ↘                │                 │

│  │              继续循环    final\_answer         │                 │

│  │                ↓              ↓              │                 │

│  │          react\_think        END              │                 │

│  └──────────────────────────────────────────────┘                 │

└─────────────────────────┬─────────────────────────────────────────┘

                         │

┌─────────────────────────┼─────────────────────────────────────────┐

│                   Agent 层                                         │

│  ┌──────────────────────▼──────────────────────┐                 │

│  │         MCP Client Manager                   │                 │

│  │  \- 连接池管理                                │                 │

│  │  \- 工具注册                                  │                 │

│  │  \- 工具调用                                  │                 │

│  └──────────────────────┬──────────────────────┘                 │

└─────────────────────────┼─────────────────────────────────────────┘

                         │ stdio (JSON-RPC 2.0)

┌─────────────────────────┼─────────────────────────────────────────┐

│                   工具层 (MCP Servers)                            │

│  ┌──────────────────────▼──────────────────────┐                 │

│  │         Network MCP Server                   │                 │

│  │  \- ping: 连通性测试                          │                 │

│  │  \- traceroute: 路由追踪                      │                 │

│  │  \- nslookup: DNS 查询                        │                 │

│  │  \- mtr: 网络质量测试                         │                 │

│  └──────────────────────────────────────────────┘                 │

└─────────────────────────────────────────────────────────────────────┘

                         │

┌─────────────────────────┼─────────────────────────────────────────┐

│                   LLM 层                                           │

│  ┌──────────────────────▼──────────────────────┐                 │

│  │      Ollama (localhost:11434)                │                 │

│  │      Model: deepseek-r1:8b                   │                 │

│  └──────────────────────────────────────────────┘                 │

└─────────────────────────────────────────────────────────────────────┘

### **核心组件**

#### **1\. LangGraph 工作流编排**

**职责**：定义和管理整个诊断流程的状态机

**核心节点**：

* `user_input_node`：接收用户输入，清理和验证  
* `router_node`：根据关键词路由到对应的 Agent  
* `react_think_node`：LLM 思考并决定下一步行动  
* `react_act_node`：执行工具调用  
* `react_observe_node`：记录执行历史，更新状态  
* `final_answer_node`：生成最终回答

**状态管理**：

class GraphState(TypedDict):

   user\_query: str              \# 用户输入

   current\_node: str            \# 当前节点

   target\_agent: str            \# 目标 Agent

   \# ReAct 循环状态

   execution\_history: List      \# 执行历史

   current\_step: int            \# 当前步骤

   max\_iterations: int          \# 最大迭代次数

   is\_finished: bool            \# 是否完成

   next\_action: Dict            \# 下一步行动

   last\_observation: str        \# 上一步观察结果

   \# 输出

   final\_answer: str            \# 最终回答

   errors: List\[str\]            \# 错误列表

   metadata: Dict               \# 元数据

#### **2\. MCP Client Manager**

**职责**：管理 MCP Server 连接和工具调用

**核心功能**：

* 启动和管理多个 MCP Server 进程  
* 通过 stdio 进行 JSON-RPC 2.0 通信  
* 工具注册和查询  
* 工具调用和结果处理  
* 错误处理和重试

**实现**：

class McpClientManager:

   async def start\_server(server\_config)  \# 启动 Server

   async def list\_tools()                 \# 列出所有工具

   async def call\_tool(tool\_name, args)   \# 调用工具

   async def stop\_all()                   \# 停止所有 Server

#### **3\. ReAct 循环引擎**

**Think（思考）节点**：

* 构建包含执行历史的 Prompt  
* 调用 LLM 分析当前状态  
* 解析 LLM 输出，提取下一步行动

**Act（行动）节点**：

* 执行 LLM 决定的工具调用  
* 通过 MCP Client Manager 调用工具  
* 处理工具返回结果

**Observe（观察）节点**：

* 记录执行历史（思考、行动、观察）  
* 更新状态（步骤计数、观察结果）  
* 判断是否继续循环

### **ReAct 循环示例**

**场景**：查询域名 IP，然后用 IP 执行 mtr

步骤1 \- Think:

 LLM 思考: "需要先查询域名的 IP 地址"

 决定: 使用 nslookup 工具

步骤1 \- Act:

 执行: nslookup g3xjtls.lottery-it.com

 结果: IP 地址为 198.18.1.47

步骤1 \- Observe:

 记录: 工具=nslookup, 结果=198.18.1.47

 更新: last\_observation \= "查询到 IP: 198.18.1.47"

步骤2 \- Think:

 LLM 思考: "已获取 IP，现在使用 mtr 测试"

 从 last\_observation 提取 IP: 198.18.1.47

 决定: 使用 mtr 工具，参数 target=198.18.1.47

步骤2 \- Act:

 执行: mtr 198.18.1.47

 结果: 网络路径测试完成

步骤2 \- Observe:

 记录: 工具=mtr, 结果=测试完成

 判断: 任务完成，设置 is\_finished=True

Final Answer:

 生成包含两个工具结果的完整报告

### **技术栈**

| 层级 | 技术 | 版本 | 用途 |
| ----- | ----- | ----- | ----- |
| UI | OpenWebUI | latest | Web 界面 |
| API | FastAPI | 0.109+ | HTTP 服务 |
| 编排 | LangGraph | 0.0.30+ | 工作流编排 |
| Agent | LangChain | 0.1.0+ | Agent 框架 |
| 协议 | MCP | 1.23.1 | 工具协议 |
| LLM | Ollama | latest | 本地 LLM 服务 |
| 模型 | deepseek-r1:8b | \- | 推理模型 |
| 向量 | ChromaDB | 0.4.22+ | 向量数据库 |
| 语言 | Python | 3.11+ | 开发语言 |

---

## **使用方法**

### **1\. API 接口使用**

#### **1.1 健康检查**

curl http://localhost:30021/health

**响应**：

{

 "status": "healthy",

 "service": "graph\_service",

 "version": "0.1.0"

}

#### **1.2 聊天接口（非流式）**

curl \-X POST http://localhost:30021/v1/chat/completions \\

 \-H "Content-Type: application/json" \\

 \-d '{

   "model": "deepseek-r1:8b",

   "messages": \[

     {"role": "user", "content": "ping baidu.com"}

   \],

   "stream": false

 }'

**响应**：

{

 "id": "chatcmpl-xxx",

 "object": "chat.completion",

 "created": 1234567890,

 "model": "deepseek-r1:8b",

 "choices": \[

   {

     "index": 0,

     "message": {

       "role": "assistant",

       "content": "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\\n📊 网络诊断结果\\n..."

     },

     "finish\_reason": "stop"

   }

 \]

}

#### **1.3 聊天接口（流式）**

curl \-X POST http://localhost:30021/v1/chat/completions \\

 \-H "Content-Type: application/json" \\

 \-d '{

   "model": "deepseek-r1:8b",

   "messages": \[

     {"role": "user", "content": "ping baidu.com"}

   \],

   "stream": true

 }'

**响应**：Server-Sent Events (SSE) 流式数据

### **4\. 启动OpenWebUI (可选)**

如果你想使用图形界面,可以启动OpenWebUI:

docker run \-d \\

 \-p 30020:8080 \\

 \-v \~/Coding/docker/webui:/app/backend/data \\

 \-e OPENAI\_API\_BASE\_URL=http://host.docker.internal:8000/v1 \\

 \-e OPENAI\_API\_KEY=sk-no-key-required \\

 \--add-host=host.docker.internal:host-gateway \\

 \--name open-webui \\

 \--restart always \\

 ghcr.io/open-webui/open-webui:main

访问 `http://localhost:30020` 即可使用。

### **2\. OpenWebUI 集成**

#### **2.1 配置 OpenWebUI**

在 OpenWebUI 的设置中添加自定义 API：

1. 打开 OpenWebUI：`http://localhost:30010`  
2. 进入 **Settings** → **Connections**  
3. 添加 OpenAI API：  
   * **API Base URL**: `http://host.docker.internal:30021/v1`  
   * **API Key**: 任意字符串（如 `sk-xxx`）  
4. 保存配置

#### **2.2 使用示例**

在 OpenWebUI 的聊天界面中输入：

**示例1：简单 ping 测试**

ping baidu.com

**示例2：DNS 查询**

查询 google.com 的 IP 地址

**示例3：路由追踪**

traceroute 到 8.8.8.8

**示例4：参数依赖场景**

先用 nslookup 查询 g3xjtls.lottery-it.com 的 IP 地址，

然后用查询到的 IP 地址执行 mtr 测试

### **3\. 命令行测试**

#### **3.1 使用测试脚本**

\# 进入项目目录

cd aiagent-netools

\# 激活虚拟环境

source ../.venv/bin/activate

\# 运行单元测试

python tests/test\_mcp\_stdio.py

\# 运行 ReAct 循环测试

python tests/test\_react.py

\# 运行端到端测试

python tests/test\_e2e\_react.py

#### **3.2 使用 Python 脚本**

import asyncio

from graph\_service.graph import compile\_graph

from graph\_service.state import GraphState

async def test\_network\_diag():

   \# 编译图（使用 ReAct 模式）

   graph \= compile\_graph(use\_react=True)

   \# 初始化状态

   initial\_state: GraphState \= {

       "user\_query": "ping baidu.com",

       "current\_node": "",

       "target\_agent": "",

       "network\_diag\_result": None,

       "rag\_result": None,

       "final\_answer": "",

       "errors": \[\],

       "metadata": {},

       \# ReAct 状态

       "execution\_history": \[\],

       "current\_step": 1,

       "max\_iterations": 10,

       "is\_finished": False,

       "next\_action": None,

       "last\_observation": ""

   }

   \# 执行

   final\_state \= await graph.ainvoke(initial\_state)

   \# 输出结果

   print(final\_state\["final\_answer"\])

\# 运行

asyncio.run(test\_network\_diag())

### **4\. 使用场景示例**

#### **场景1：网络连通性测试**

**用户输入**：

测试到 baidu.com 的连通性

**系统执行**：

1. 路由到 network\_agent  
2. 使用 ping 工具测试连通性  
3. 返回结构化结果和分析

**输出示例**：

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 网络诊断结果

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔧 工具: Ping 连通性测试

━━━ 📝 原始输出 ━━━

PING baidu.com (198.18.1.46): 56 data bytes

64 bytes from 198.18.1.46: icmp\_seq=0 ttl=64 time=0.120 ms

...

━━━ 📈 结构化结果 ━━━

✅ 连通性: 正常

🎯 目标: baidu.com (198.18.1.46)

📊 统计:

 \- 发送: 4 包

 \- 接收: 4 包

 \- 丢包率: 0.0%

 \- 平均延迟: 0.251 ms

#### **场景2：DNS 解析**

**用户输入**：

查询 google.com 的 IP 地址

**系统执行**：

1. 使用 nslookup 工具查询 DNS  
2. 返回解析结果

**输出示例**：

━━━ 📈 结构化结果 ━━━

✅ 查询状态: 成功

🌐 域名: google.com

🔍 记录类型: A

📍 解析结果: 142.250.185.46

#### **场景3：复杂多步骤诊断**

**用户输入**：

先查询 g3xjtls.lottery-it.com 的 IP，

然后用这个 IP 执行 mtr 测试，

最后分析网络质量

**系统执行**：

1. **步骤1**：nslookup 查询 IP → 198.18.1.47  
2. **步骤2**：mtr 198.18.1.47 → 网络路径测试  
3. **步骤3**：LLM 分析结果 → 生成报告

**输出示例**：

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 网络诊断结果（共执行 2 个工具）

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【工具 1/2】DNS 域名解析

✅ 查询状态: 成功

📍 解析结果: 198.18.1.47

【工具 2/2】MTR 网络质量测试

✅ 测试状态: 完成

🎯 目标: 198.18.1.47

📊 测试包数: 10

🔢 总跳数: 1 跳

━━━ 📋 执行过程 ━━━

步骤 1: 执行工具 network.nslookup

步骤 2: 执行工具 network.mtr

步骤 3: 完成任务

### **5\. 高级用法**

#### **5.1 自定义最大迭代次数**

在初始化状态时设置：

initial\_state\["max\_iterations"\] \= 15  \# 默认 10

#### **5.2 查看执行历史**

\# 获取执行历史

execution\_history \= final\_state\["execution\_history"\]

for record in execution\_history:

   print(f"步骤 {record\['step'\]}")

   print(f"  思考: {record\['thought'\]}")

   print(f"  行动: {record\['action'\]}")

   print(f"  观察: {record\['observation'\]\[:100\]}...")

#### **5.3 切换到旧模式（Plan-and-Execute）**

\# 编译图时指定 use\_react=False

graph \= compile\_graph(use\_react=False)

---

## **配置说明**

### **配置文件结构**

config/

├── llm\_config.yaml          \# LLM 和 Embedding 配置

├── mcp\_config.yaml          \# MCP Server 配置

├── langgraph\_config.yaml    \# LangGraph 工作流配置

├── langchain\_config.yaml    \# LangChain 配置

├── agent\_config.yaml        \# Agent 配置

└── tools\_config.yaml        \# 工具配置

### **1\. LLM 配置 (llm\_config.yaml)**

\# LLM 配置

llm:

 provider: "ollama"              \# LLM 提供商

 base\_url: "http://localhost:11434"  \# Ollama 服务地址

 model: "deepseek-r1:8b"         \# 模型名称

 temperature: 0.7                \# 温度参数（0-1）

 max\_tokens: 2000                \# 最大生成 token 数

 timeout: 60                     \# 超时时间（秒）

\# Embedding 配置

embedding:

 provider: "ollama"

 base\_url: "http://localhost:11434"

 model: "nomic-embed-text"       \# Embedding 模型

**参数说明**：

* `temperature`: 控制输出的随机性，0 表示确定性输出，1 表示最大随机性  
* `max_tokens`: 限制 LLM 单次生成的最大 token 数  
* `timeout`: API 调用超时时间

### **2\. MCP 配置 (mcp\_config.yaml)**

mcp\_servers:

 \# 网络诊断 MCP Server

 \- name: network-mcp

   command: python                \# 启动命令

   args:                          \# 命令参数

     \- "-m"

     \- "mcp\_servers.network\_mcp.server"

   tools\_prefix: "network"        \# 工具名前缀

   description: "网络诊断工具集"

   env:                           \# 环境变量（可选）

     PYTHONPATH: "."

**参数说明**：

* `name`: Server 唯一标识符  
* `command`: 启动 Server 的命令  
* `args`: 命令行参数列表  
* `tools_prefix`: 工具名前缀，避免命名冲突  
* `env`: 环境变量（可选）

**添加新的 MCP Server**：

 \- name: custom-mcp

   command: python

   args:

     \- "-m"

     \- "mcp\_servers.custom\_mcp.server"

   tools\_prefix: "custom"

   description: "自定义工具集"

### **3\. LangGraph 配置 (langgraph\_config.yaml)**

langgraph:

 \# 路由配置

 router:

   use\_llm\_fallback: true        \# 是否使用 LLM 路由

   keyword\_rules:                \# 关键词路由规则

     \- keywords:

         \- "ping"

         \- "traceroute"

         \- "nslookup"

         \- "mtr"

         \- "网络"

         \- "诊断"

       target\_node: "network\_agent"

 \# ReAct 配置

 react:

   max\_iterations: 10            \# 最大迭代次数

   enable\_logging: true          \# 是否记录执行历史

**参数说明**：

* `use_llm_fallback`: 当关键词匹配失败时，是否使用 LLM 进行路由  
* `keyword_rules`: 关键词路由规则列表  
* `max_iterations`: ReAct 循环的最大迭代次数，防止无限循环

### **4\. 工具配置 (tools\_config.yaml)**

tools:

 network:

   ping:

     timeout: 5                  \# ping 超时时间（秒）

     count: 4                    \# ping 次数

   traceroute:

     max\_hops: 30                \# 最大跳数

     timeout: 5                  \# 超时时间

   nslookup:

     timeout: 5                  \# 查询超时时间

     record\_type: "A"            \# 默认记录类型

   mtr:

     count: 10                   \# 测试包数

     timeout: 10                 \# 超时时间

### **5\. 环境变量**

创建 `.env` 文件（可选）：

\# Ollama 配置

OLLAMA\_BASE\_URL=http://localhost:11434

OLLAMA\_MODEL=deepseek-r1:8b

\# FastAPI 配置

API\_HOST=0.0.0.0

API\_PORT=30021

\# 日志配置

LOG\_LEVEL=INFO

LOG\_FILE=data/logs/app.log

---

## **开发指南**

### **项目结构**

aiagent-netools/

├── agents/                    \# Agent 实现

│   ├── base\_agent.py         \# Agent 基类

│   └── network\_diag\_agent.py \# 网络诊断 Agent

├── config/                    \# 配置文件

├── data/                      \# 数据目录

│   ├── cases/                \# 测试用例

│   ├── logs/                 \# 日志文件

│   └── vector\_db/            \# 向量数据库

├── docs/                      \# 文档

├── graph\_service/             \# LangGraph 服务

│   ├── nodes/                \# 工作流节点

│   │   ├── user\_input.py    \# 用户输入节点

│   │   ├── router.py        \# 路由节点

│   │   ├── react\_think.py   \# ReAct 思考节点

│   │   ├── react\_act.py     \# ReAct 行动节点

│   │   ├── react\_observe.py \# ReAct 观察节点

│   │   └── final\_answer.py  \# 最终回答节点

│   ├── graph.py              \# 工作流图定义

│   ├── state.py              \# 状态定义

│   ├── openai\_api.py         \# OpenAI 兼容 API

│   └── main.py               \# FastAPI 入口

├── mcp\_manager/               \# MCP 管理器

│   ├── stdio\_connection.py   \# Stdio 连接实现

│   ├── client\_manager.py     \# Client 管理器

│   └── adapters/             \# 适配器

│       └── langchain\_adapter.py

├── mcp\_servers/               \# MCP Servers

│   ├── network\_mcp/          \# 网络诊断 Server

│   │   ├── server.py         \# Server 入口

│   │   └── tools/            \# 工具实现

│   │       ├── ping.py

│   │       ├── traceroute.py

│   │       ├── nslookup.py

│   │       └── mtr.py

│   └── rag\_mcp/              \# RAG Server（待实现）

├── tests/                     \# 测试

│   ├── test\_mcp\_stdio.py     \# MCP 单元测试

│   ├── test\_react.py         \# ReAct 循环测试

│   └── test\_e2e\_react.py     \# 端到端测试

├── utils/                     \# 工具函数

│   ├── config\_loader.py      \# 配置加载器

│   └── logger.py             \# 日志工具

├── pyproject.toml             \# 项目配置

└── README.md                  \# 本文档

### **添加新工具**

#### **1\. 在 MCP Server 中定义工具**

编辑 `mcp_servers/network_mcp/tools/your_tool.py`：

from mcp.types import Tool

\# 定义工具

your\_tool \= Tool(

   name="your\_tool",

   description="工具描述",

   inputSchema={

       "type": "object",

       "properties": {

           "param1": {

               "type": "string",

               "description": "参数1描述"

           }

       },

       "required": \["param1"\]

   }

)

\# 实现工具函数

async def execute\_your\_tool(arguments: dict) \-\> dict:

   param1 \= arguments.get("param1")

   \# 执行逻辑

   result \= do\_something(param1)

   \# 返回结果

   return {

       "success": True,

       "raw\_output": result,

       "structured\_result": {

           "key": "value"

       }

   }

#### **2\. 注册工具**

编辑 `mcp_servers/network_mcp/server.py`：

from .tools.your\_tool import your\_tool, execute\_your\_tool

\# 注册工具

@server.list\_tools()

async def list\_tools() \-\> list\[Tool\]:

   return \[

       ping\_tool,

       traceroute\_tool,

       nslookup\_tool,

       mtr\_tool,

       your\_tool,  \# 添加新工具

   \]

\# 注册工具处理函数

@server.call\_tool()

async def call\_tool(name: str, arguments: dict) \-\> list\[TextContent\]:

   if name \== "your\_tool":

       result \= await execute\_your\_tool(arguments)

       return \[TextContent(type="text", text=json.dumps(result, ensure\_ascii=False))\]

   \# ... 其他工具

#### **3\. 更新配置**

编辑 `config/tools_config.yaml`：

tools:

 network:

   your\_tool:

     timeout: 10

     \# 其他配置

### **添加新 Agent**

#### **1\. 创建 Agent 类**

创建 `agents/your_agent.py`：

from .base\_agent import BaseAgent

class YourAgent(BaseAgent):

   def \_\_init\_\_(self, llm, tools):

       super().\_\_init\_\_(llm, tools)

       self.name \= "your\_agent"

   async def execute(self, query: str) \-\> dict:

       \# 实现 Agent 逻辑

       result \= await self.call\_tool("your\_tool", {"param1": "value"})

       return result

#### **2\. 添加路由规则**

编辑 `config/langgraph_config.yaml`：

langgraph:

 router:

   keyword\_rules:

     \- keywords:

         \- "your"

         \- "keyword"

       target\_node: "your\_agent"

#### **3\. 创建节点**

创建 `graph_service/nodes/your_agent.py`：

from ..state import GraphState

from agents.your\_agent import YourAgent

async def your\_agent\_node(state: GraphState) \-\> GraphState:

   state\["current\_node"\] \= "your\_agent"

   \# 创建 Agent

   agent \= YourAgent(llm, tools)

   \# 执行

   result \= await agent.execute(state\["user\_query"\])

   \# 更新状态

   state\["your\_agent\_result"\] \= result

   return state

#### **4\. 更新工作流图**

编辑 `graph_service/graph.py`：

from .nodes.your\_agent import your\_agent\_node

def create\_graph():

   workflow \= StateGraph(GraphState)

   \# 添加节点

   workflow.add\_node("your\_agent", your\_agent\_node)

   \# 添加边

   workflow.add\_conditional\_edges(

       "router",

       route\_to\_agent,

       {

           "your\_agent": "your\_agent",

           \# ...

       }

   )

   workflow.add\_edge("your\_agent", "final\_answer")

   return workflow

### **运行测试**

\# 激活虚拟环境

source .venv/bin/activate

\# 运行所有测试

pytest tests/

\# 运行特定测试

python tests/test\_react.py

\# 运行端到端测试

python tests/test\_e2e\_react.py

### **调试技巧**

#### **1\. 启用详细日志**

编辑 `utils/logger.py` 或设置环境变量：

export LOG\_LEVEL=DEBUG

#### **2\. 查看执行历史**

\# 在代码中打印执行历史

for record in state\["execution\_history"\]:

   print(f"步骤 {record\['step'\]}: {record\['action'\]}")

#### **3\. 使用 Python 调试器**

import pdb; pdb.set\_trace()  \# 设置断点

### **性能优化**

#### **1\. 缓存 LLM 响应**

from functools import lru\_cache

@lru\_cache(maxsize=100)

def get\_llm\_response(prompt: str):

   return llm.invoke(prompt)

#### **2\. 并行执行工具**

import asyncio

results \= await asyncio.gather(

   call\_tool("tool1", args1),

   call\_tool("tool2", args2)

)

#### **3\. 减少 LLM 调用**

* 优化 Prompt，减少不必要的思考步骤  
* 使用更小的模型处理简单任务  
* 缓存常见问题的答案

---

## **常见问题**

### **1\. Ollama 连接失败**

**问题**：`Connection refused to localhost:11434`

**解决**：

\# 检查 Ollama 是否运行

ps aux | grep ollama

\# 启动 Ollama

ollama serve

\# 测试连接

curl http://localhost:11434/api/tags

### **2\. MCP Server 启动失败**

**问题**：`Failed to start MCP server`

**解决**：

\# 检查 Python 路径

which python

\# 手动启动 Server 测试

python \-m mcp\_servers.network\_mcp.server

\# 检查配置文件

cat config/mcp\_config.yaml

### **3\. 工具调用参数错误**

**问题**：`Input validation error: 'target' is a required property`

**解决**：

* 检查工具定义的 `inputSchema`  
* 优化 LLM Prompt，明确参数格式  
* 查看 `tests/test_react.py` 中的示例

### **4\. ReAct 循环无限执行**

**问题**：达到 `max_iterations` 限制

**解决**：

* 增加 `max_iterations` 值  
* 优化 Prompt，让 LLM 更快决定 FINISH  
* 检查工具返回结果是否清晰

---

## **贡献指南**

欢迎贡献代码、报告问题或提出建议！

### **提交 Issue**

* 描述问题或建议  
* 提供复现步骤  
* 附上日志和错误信息

### **提交 Pull Request**

1. Fork 项目  
2. 创建特性分支：`git checkout -b feature/your-feature`  
3. 提交更改：`git commit -am 'Add some feature'`  
4. 推送分支：`git push origin feature/your-feature`  
5. 创建 Pull Request

### **代码规范**

* 遵循 PEP 8 Python 代码规范  
* 添加必要的注释和文档字符串  
* 编写单元测试  
* 更新 README 文档

---

## **许可证**

MIT License

---

## **联系方式**

* **项目地址**：\[GitHub Repository\]  
* **问题反馈**：\[GitHub Issues\]  
* **文档**：\[Documentation\]

---

## **更新日志**

### **v0.1.0 (2025-12-03)**

**新特性**：

* ✅ 实现 ReAct 循环模式  
* ✅ MCP 协议标准化  
* ✅ 支持 ping、traceroute、nslookup、mtr 工具  
* ✅ OpenWebUI 集成  
* ✅ 三段式输出结构  
* ✅ 参数依赖解决

**改进**：

* 优化 LLM Prompt  
* 完善错误处理  
* 添加完整测试

**已知问题**：

* MCP Server 关闭时的资源清理警告（不影响功能）

---

**感谢使用 AIAgent-NetTools！** 🎉


