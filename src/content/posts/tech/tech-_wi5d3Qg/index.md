---
title: "DeerFlow系列之二：DeerFlow整体架构"
description: "本文深入剖析了DeerFlow系统的整体架构设计，详细阐述了其作为分布式处理框架的核心组件构成、各模块间的交互机制以及数据流转路径。通过对架构层级的层层解构，揭示了DeerFlow如何实现高可用、高扩展性及性能优化，为开发者理解系统底层逻辑与工程实践提供了清晰的指导，是掌握该系列技术栈不可或缺的深度架构参考。"
tags: ["DeerFlow", "分布式系统", "架构设计", "技术架构"]
date: "2026-04-06T01:00:30.766Z"
lastmod: "2026-04-06T01:00:30.766Z"
categories: ["技术专题"]
---
MERMAIDSTART  
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
MERMAIDEND
