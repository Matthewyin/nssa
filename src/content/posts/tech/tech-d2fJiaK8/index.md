---
title: "UALMT架构"
subtitle: ""
description: "本文深入探讨了UALMT（Unified Architecture of Large Model for Translation）架构，旨在解决大语言模型在翻译领域微调成本高、模型管理复杂的问题。通过引入创新的路由模型，该架构统一调度通用、领域及质量预估等多种模型，实现成本优化、效率提升和翻译质量的显著增强。"
tags: ["大语言模型", "机器翻译", "系统架构", "UALMT", "成本优化", "模型路由"]
readingTime: ""
date: "2025-12-02T14:38:38.658Z"
lastmod: "2025-12-02T14:38:38.658Z"
categories: ["技术专题"]
---
# UI+Agent+LLM+MCP+Tools架构(UALMT)

你要的清单里这些全都会出现：

**OpenWebUI, LangGraph, LangChain, Ollama+LLM, RAG, MCP client, MCP server, MCP Client Library, tools**

---

## **一、总体分层视图（先有个大画面）**

 按层次看是这样一套栈：

┌──────────────────────────────────────┐  
│  UI 层：OpenWebUI                				         │  
│  \- 唯一对话入口                    				         │       
└──────────────────────────────────────┘  
               │ HTTP / WebSocket  
               ▼  
┌──────────────────────────────────────┐  
│  编排层：LangGraph Graph Service 			         │  
│  \- 多 Agent / 多步骤工作流          			         │  
│  \- 节点：Router / NetworkAgent /  			         │  
│         RagAgent / HumanReview...  			         │  
└──────────────────────────────────────┘  
               │ 调用每个节点  
               ▼  
┌──────────────────────────────────────┐  
│  Agent 层：LangChain Agents       			         │  
│  \- NetworkDiagAgent                 			         │  
│  \- RagAgent                      				         │  
│  \- 其他业务 Agent                    				         │   
└──────────────────────────────────────┘  
               │ 使用 LLM \+ Tools  
               ▼  
┌──────────────────────────────────────┐  
│  LLM 层：Ollama \+ LLM                			         │  
│  \- 通过 LangChain/OAI 接口调用     			         │  
└──────────────────────────────────────┘  
               │ 工具调用统一从这里出去  
               ▼  
┌──────────────────────────────────────┐  
│  工具总线层：MCP Client Library    			         │  
│  \- 多 MCP server 连接管理          			         │  
│  \- tools 注册表 \+ 路由             				         │  
│  \- adapter: LangChain Tools        			         │  
└──────────────────────────────────────┘  
               │ MCP 协议（stdio/TCP）  
               ▼  
┌──────────────────────────────────────┐  
│  工具服务层：多个 MCP Server 			         │  
│  \- network-mcp: ping/trace/mtr/... 			         │  
│  \- rag-mcp: search/summarize/...  			         │  
│  \- future-mcp: cmdb/ticket/...    			         │  
└──────────────────────────────────────┘  
               │ 调实际系统/服务  
               ▼  
┌──────────────────────────────────────┐  
│  原子工具层：OS 命令 / DB / VectorDB		         │  
│  \- ping / traceroute / mtr / nslookup			         │  
│  \- RAG 向量库 / 日志库 / CMDB 等   			         │  
└──────────────────────────────────────┘  
---

## **二、逐个组件说明（是谁 / 干嘛 / 上下游）**

###  **1\. OpenWebUI（UI 层）**

* **角色**：统一人机交互入口。  
* **上游**：用户（浏览器）。  
* **下游**：你的「Graph Service」HTTP API，看起来像一个“自定义模型”。  
* **职责**：  
  * 展示对话界面、历史记录。  
  * 每一轮对话，把用户输入打包成请求发送给 Graph Service。  
  * 展示 Graph Service 返回的自然语言回复（以及必要时的中间结果，如诊断报告、图表链接）。

 这里 OpenWebUI 不直接连 Ollama / MCP，而是只当「前端」，所有智能逻辑都在后端 Graph Service。

---

### **2\. LangGraph Graph Service（编排层）**

 可以是一个独立服务，比如 ops\_ai\_service，内部核心就是一张 LangGraph 图。

* **角色**：**工作流编排器**，负责多 Agent、多步骤、多分支流程。  
* **上游**：OpenWebUI。  
* **下游**：多个 LangChain Agent（网络诊断、RAG 等），以及 LLM。  
* **核心节点示例**：  
  * UserInputNode：接收用户消息，封装成 graph state。  
  * RouterNode：根据用户意图路由到不同子流程：  
    * 网络故障诊断  
    * 日志分析  
    * 历史案例查询 / 报告生成  
  * NetworkAgentNode：调用 NetworkDiagAgent 做诊断。  
  * RagAgentNode：调用 RagAgent 做知识库/历史案例分析。  
  * HumanReviewNode（可选）：需要人工确认时挂到人审。  
  * FinalAnswerNode：把中间结果组合成最终输出（自然语言 \+ 结构化 JSON）。  
* **状态管理**：  
  * LangGraph 用 graph state 存：  
    * 用户原始问题  
    * 诊断中间数据（ping/mtr 输出）  
    * RAG 检索结果 / 总结  
    * 最终回复草稿

 LangGraph 在这里就是“总导演”：决定什么时候请哪个 Agent 出场，顺序怎样，失败了如何重试/分支。

---

### **3\. LangChain Agents（Agent 层）**

 每个业务场景一个 Agent，内部用 LangChain 做：

* LLM 调用。  
* 工具调用（通过 MCP Client Library 的 adapter）。

#### **3.1 NetworkDiagAgent**

* **职责**：  
  * 根据用户或 Router 的意图，规划诊断步骤：  
    * 先 network.ping  
    * 再视情况 network.trace / network.mtr  
    * 必要时 network.dns\_lookup  
  * 将多个工具调用结果整理成一个结构化的「诊断结果」对象 \+ 人类可读总结。  
* **使用的工具**：  
  * 来自 MCP Bus 的 network.\* 工具，如：  
    * network.ping  
    * network.traceroute  
    * network.mtr  
    * network.nslookup  
    * system.ls（看某些日志目录等）

####  **3.2 RagAgent**

* **职责**：  
  * 接收诊断结果（甚至用户环境信息），在知识库/日志中搜索：  
    * 相似案例  
    * 历史故障记录  
    * 官方规范 / SOP  
  * 结合 RAG 检索结果，给出更“解释性”的分析、长期优化建议。  
* **使用的工具**：  
  * 来自 MCP Bus 的 rag.\* 工具，如：  
    * rag.search\_cases  
    * rag.search\_docs  
    * rag.summarize\_context  
    * rag.similar\_incidents

####  **3.3 其他 Agent（未来）**

* CapacityAgent：容量规划。  
* SecurityAgent：安全基线检查。  
* TicketAgent：故障工单生成/更新。

**共同点**：

所有 Agent 的 tools 都不是自己手工写 @tool ping，而是 **动态从 MCP Client Library 拉回来的 Tool 列表**。

---

### **4\. LLM 层：Ollama \+ LLM**

* **角色**：所有 Agent 的语言模型 Backend。  
* **上游**：LangChain（Ollama wrapper 或 OpenAI-compatible wrapper）。  
* **下游**：Ollama 本地进程。  
* **职责**：  
  * 处理自然语言理解 / 推理 / 工具调用计划。  
  * 形成对 tools 的调用决定（如 ReAct/Tools 风格）。  
  * 把工具结果整合成自然语言回复 / 结构化 JSON 报告。

 可以统一用一个模型（比如 llama3 / deepseek-r1），也可以给不同 Agent 配不同模型配置，LangChain 很好切换。

---

### **5\. MCP Client Library / MCP Bus（工具总线层）**

 这是关键「中台」。

####  **5.1 结构概念**

可以分为几块：

mcp\_bus/  
 ├─ connection.py   \# McpConnection：单个 MCP server 的连接  
 ├─ registry.py     \# McpRegistry：全局工具注册表  
 ├─ router.py       \# McpRouter：根据 tool name 路由到对应 server  
 └─ adapters/  
     ├─ langchain.py  \# 把 MCP tools → LangChain Tool 列表  
     └─ (future) openai\_tools.py / others

#### **5.2 主要职责**

1. **MCP 连接管理**  
   * 支持多 MCP server 注册：  
     * network-mcp（本地 Python 进程）  
     * rag-mcp（本地/远程）  
     * cmdb-mcp、ticket-mcp……  
   * 通过 stdio / TCP 建立连接，保持心跳、重连。  
2. **工具发现与注册**  
   * 每个 MCP server 启动时，调用 MCP 协议的 tools/list（名字略有变化，具体跟官方一致）。  
   * 收集 tools 的：  
     * name  
     * description  
     * parameters（JSON schema）  
   * 写入 McpRegistry，形成全局工具表：

   network.ping         → server=network-mcp, schema=...

   network.trace        → server=network-mcp, schema=...

   rag.search\_cases     → server=rag-mcp, schema=...

   rag.summarize\_case   → server=rag-mcp, schema=...

2. **工具调用路由**  
   * 提供统一接口：

   mcp\_bus.call\_tool("network.ping", {"target": "8.8.8.8", "count": 4})

   mcp\_bus.call\_tool("rag.summarize\_case", {"case\_id": "...", "diag\_json": {...}})

   * 内部根据名称查 registry，找到对应 MCP server，走 MCP 协议发送请求，返回 JSON 结果。  
4. **对上层框架的 Adapter**  
   * adapters.langchain.build\_langchain\_tools(prefix="network.")  
     * 从 registry 中选出 network.\* 的 tool  
     * 动态生成 LangChain Tool 对象列表，交给 Agent 用  
   * 将来也可以有：  
     * 给 OpenAI-tools 的 adapter  
     * 给自定义 Agent 框架的 adapter

 **上游**：LangChain Agents（通过 adapter 拿 Tool 列表）。

**下游**：各个 MCP server。

 这层是「保证扩展性」的核心：

* 新增 MCP server → 只在这里注册一次；  
* 新增工具 → 只在 MCP server 实现 \+ registry 更新；  
* 各种 Agent 通过前缀等规则动态选择自己要用的工具，无需手工写 @tool。

---

### **6\. 多个 MCP Server（工具服务层）**

####  **6.1** 

#### **network-mcp**

* **提供工具**：  
  * network.ping  
  * network.traceroute  
  * network.mtr  
  * network.nslookup  
  * system.ls / system.cat\_log 等  
* **内部实现**：  
  * Python subprocess 调用系统命令  
  * 对输出做解析，返回结构化 JSON \+ 原始文本

####  **6.2** 

#### **rag-mcp**

* **提供工具**：  
  * rag.search\_cases(query, tags, limit)  
  * rag.search\_docs(query, filters, limit)  
  * rag.summarize\_context(context, question)  
  * rag.similar\_incidents(diag\_json, limit)  
* **内部实现（RAG）**：  
  * 调用向量库（Chroma / Qdrant / pgvector…）  
  * 调 embeddings 模型构向量（可以也是 Ollama 模型，或专用 embedding）  
  * 组合检索结果（文档片段 / 历史 case）返回

####  **6.3 将来可以挂更多：**

* cmdb-mcp：查机器、链路、配置。  
* ticket-mcp：生成/更新工单。  
* metrics-mcp：查监控指标。

**对 MCP Bus 来说**，只是多了几个 server，多了几组 xxx.\* 前缀工具。

---

### **7\. 原子工具层（本地命令 / 存储）**

* 系统命令：  
  * ping, traceroute, mtr, nslookup, dig, ls, cat, …  
* 存储：  
  * vector DB、日志库（ES、ClickHouse）、CMDB DB  
* HTTP：  
  * 内部 API、云服务 API、监控平台 API

 这些都不直接暴露给 Agent，而是包在 MCP Server 里面，统一通过 MCP 协议对上公开。

---

## **三、典型调用链（用两个场景说明关系）**

###  **场景 1：用户要求「帮我诊断 8.8.8.8 网络情况」**

1\. 用户在 OpenWebUI 输入：  
  “帮我诊断一下到 8.8.8.8 的网络，看看丢包、路径和 DNS。”  
​  
2\. OpenWebUI → Graph Service（LangGraph HTTP API）  
  \- body: {message: "...", session\_id: ...}  
​  
3\. LangGraph:  
  3.1 UserInputNode：把 message 写入 state  
  3.2 RouterNode：  
      \- 判断这是“网络诊断”意图  
      \- 将 flow 导向 NetworkAgentNode  
​  
4\. NetworkAgentNode（内部是 LangChain NetworkDiagAgent）：  
  4.1 从 MCP Bus adapter 拿 tools \= build\_langchain\_tools(prefix="network.")  
  4.2 用 LLM（Ollama）+ ReAct / Tools 规划：  
      \- 调用 network.ping(target="8.8.8.8", count=4)  
      \- 如果有丢包，再调用 network.traceroute(...)  
  4.3 对每次工具调用：  
      \- 实际函数调用：lc\_tool(...) → adapter → mcp\_bus.call\_tool(...)  
      \- mcp\_bus → router → network-mcp → ping/traceroute → 系统命令  
      \- 结果 JSON 回到 Agent  
  4.4 Agent 聚合结果，生成一个结构化诊断 JSON \+ 文本总结  
  4.5 把这些写入 LangGraph state  
​  
5\. FinalAnswerNode：  
  \- 根据 state 中的诊断结果，生成给用户看的最终说明  
  \- 返回给 Graph Service → OpenWebUI → 用户看到结果

### **场景 2：诊断完再请 RAG 分析历史案例**

在场景 1 的基础上：

6\. LangGraph Router 发现：  
  \- “有诊断结果了，可以让 RAG 再分析一下历史案例/最佳实践”  
  → 流程进入 RagAgentNode  
​  
7\. RagAgentNode（LangChain RagAgent）：  
  7.1 tools \= build\_langchain\_tools(prefix="rag.")  
  7.2 把 NetworkDiagAgent 的诊断 JSON \+ 用户问题整理成 prompt  
  7.3 通过 LLM 规划：  
      \- 调用 rag.search\_cases(query="BGP 丢包 8.8.8.8 类似场景")  
      \- 调用 rag.summarize\_context(context=\<检索结果 \+ 诊断 JSON\>)  
  7.4 对工具调用仍然走：  
      rag.\* Tool → LangChain Tool → MCP Bus → rag-mcp → vectorDB/日志库  
​  
8\. RagAgent 输出：  
  \- 历史上类似故障的解决方案  
  \- 是否存在已知 bug 或运营商问题  
  \- 建议的下一步（如提工单、扩容、改路由策略）  
​  
9\. FinalAnswerNode：  
  \- 把“实时诊断 \+ RAG 分析”融合成一个完整的报告：  
    \- 当前状态：可达/不可达、丢包、路径问题点  
    \- 历史案例：类似问题的原因/解决方案  
    \- 建议操作：xx 步骤  
  \- 返回给 OpenWebUI。  
---

## **四、扩展性 & 兼容性：以后要加东西怎么加？**

###  **1\. 新增一个 MCP server（比如 cmdb-mcp）**

* 在 cmdb-mcp 中实现 cmdb.\* 相关工具。  
* 在 MCP Client Library 注册这个 server：  
  * 建连接 → 拉 tools → 更新 registry。  
* 某个 Agent 需要用：  
  * build\_langchain\_tools(prefix=\["network.", "cmdb."\])  
* LangGraph 不用改结构，只在部分节点里，换掉该 Agent 可用工具集或 prompt。

### **2\. 新增一个 Agent（比如 CapacityAgent）**

* 写一个新的 LangChain Agent 类（或一组 chain）。  
* 在 LangGraph 中加一个 Node（CapacityAgentNode）。  
* 在 RouterNode 中增加一条分支逻辑：识别“容量规划”意图。  
* 这个 Agent 用的 tools 一样来自 MCP Bus（例如 metrics.*, network.*, rag.\*）。

### **3\. 换 LLM / 加远程模型**

* Agent 层的 LLM 全部通过 LangChain 抽象。  
* 你可以把 Ollama 换成 OpenAI / 自建推理服务，只要保留同一套调用接口。  
* MCP Bus / MCP server 完全不受影响。

### **4\. 新增 UI（CLI 工具 / 内网门户）**

* 新 UI 只要调用同一个 Graph Service。  
* LangGraph \+ LangChain \+ MCP Bus 仍然作为统一“后台中台”。

---

## **五、一句话总结这套最终架构**

* **OpenWebUI**：唯一人机入口  
* **LangGraph**：多 Agent、多步骤的「流程总导演」  
* **LangChain Agents**：每个业务的「大脑」，用 LLM \+ Tools  
* **Ollama+LLM**：统一推理后端  
* **MCP Client Library（Bus）**：统一的工具总线，多 MCP server / 多 tools 的“中台层”  
* **MCP Servers**：按领域拆分的工具服务（network-mcp、rag-mcp…）  
* **tools**：真正落地的命令、DB、RAG 等原子能力

这套分层基本把 **扩展性（多 Agent、多 MCP）、兼容性（换框架/LLM/UI）、可演进性** 都考虑进去了。

 如果你愿意，下一步我可以帮你把这套架构写成一份“落地设计文档模板”：

* 目录（背景 / 目标 / 架构图 / 组件说明 / 时序图 / 扩展策略）  
* 每个组件要写哪些字段（接口、配置、部署方式）——你可以直接拿去做正式方案评审。
