---
title: "DeerFlow系列之二：DeerFlow整体架构"
description: "本文深入解析DeerFlow系统的整体架构设计，重点介绍了其在高性能数据流处理中的关键模块与逻辑组件。通过分析其分布式架构、模块间通信机制及核心处理流程，展示了DeerFlow如何解决大规模数据场景下的高并发与低延迟挑战，为构建稳健的数据流平台提供了架构级指导。"
tags: ["DeerFlow", "系统架构", "数据处理", "分布式系统"]
date: "2026-04-06T00:57:40.576Z"
lastmod: "2026-04-06T00:57:40.576Z"
categories: ["技术专题"]
---
MERMAID\_START  
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
MERMAID\_END
