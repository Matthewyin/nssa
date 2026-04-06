---
title: "DeerFlow系列之三：快速开始"
description: "本文是DeerFlow系列教程的第三篇，专注于引导用户快速上手使用DeerFlow。内容涵盖了环境准备、基础配置及核心功能实现的步骤，帮助开发者在短时间内掌握DeerFlow的部署流程与操作要点，是进行系统集成与开发的入门指南，适合有一定技术基础的读者参考。"
tags: ["DeerFlow", "技术教程", "快速入门", "开发指南", "技术专题"]
date: "2026-04-06T00:41:21.289Z"
lastmod: "2026-04-06T00:41:21.289Z"
categories: ["技术专题"]
---
---

## title: "5 分钟快速体验 DeerFlow" description: "从零开始安装、配置并运行你的第一个 DeerFlow 应用" series: "DeerFlow 开发系列" episode: 3 phase: "初识 DeerFlow" draft: true date: 2026-04-04 tags: \[deerflow, 安装, 快速开始, tutorial\]

# DeerFlow 本地安装指南

记录于 2026-04-05，基于 [bytedance/deer-flow](https://github.com/bytedance/deer-flow) main 分支

---

## 一、安装过程

### 1\. 克隆仓库

采用先 clone 到deerflow目录：

git clone https://github.com/bytedance/deer-flow.git /deer-flow

验证仓库结构（必须包含以下文件）：

Makefile

backend/

frontend/

config.example.yaml

### 2\. 生成配置文件

make config

执行后在项目根目录生成 `config.yaml`（从 `config.example.yaml` 复制并初始化）。

### 3\. 拉取 Sandbox 镜像

make docker-init

拉取 AIO Sandbox 镜像：

enterprise-public-cn-beijing.cr.volces.com/vefaas-public/all-in-one-sandbox:latest

### 4\. 配置 LLM 模型

编辑 `config.yaml`，在 `models:` 下添加至少一个模型。项目已在 `.env` 中配置了多个 API Key，按需取消注释对应模型块即可。

已启用的模型示例（`config.yaml`）：

models:

  \- name: doubao-seed-2.0

	display\_name: doubao-seed-2.0

	use: deerflow.models.patched\_deepseek:PatchedChatDeepSeek

	model: doubao-seed-2.0-pro

	api\_base: https://ark.cn-beijing.volces.com/api/coding/v3

	api\_key: $VOLCENGINE\_API\_KEY

	supports\_thinking: true

	supports\_vision: true

	supports\_reasoning\_effort: true

	temperature: 0.0

	when\_thinking\_enabled:

	  extra\_body:

		thinking:

		  type: enabled

### 5\. 启动服务

make docker-start

访问地址：[**http://localhost:2026**](http://localhost:2026)

---

## 二、遇到的问题与注意事项

### 问题 1：config.yaml 中 models 全部注释

**现象**：`make config` 生成的 `config.yaml` 中 `models:` 下所有条目均为注释，直接启动后无法选择模型。

**解决**：手动编辑 `config.yaml`，取消注释并填入已有 API Key 对应的模型块。

---

### 问题 2：`make docker-stop` vs `docker compose down -v`

**注意**：停止服务必须用 `make docker-stop`，**不可加 `-v` 参数**。

| 命令 | 效果 |
| :---- | :---- |
| `make docker-stop` | ✅ 停止容器，保留 `.venv` 卷，下次秒级启动 |
| `docker compose down` | ✅ 同上 |
| `docker compose down -v` | ❌ 删除所有 Named Volume（含 `.venv`），下次启动需重新安装依赖（约 10 分钟） |

Docker Desktop 中点击 **Stop** 或 **Delete（不勾选 Delete volumes）** 均安全。

---

### 问题 3：sandbox 容器自动出现

**现象**：启动并发起第一个对话后，Docker Desktop 中出现名为 `deer-flow-sandbox-xxxxxxxx` 的容器。

**说明**：这是正常行为。Agent 执行代码类工具（bash、write\_file 等）时，DeerFlow 自动按需创建 AIO Sandbox 容器进行隔离执行，会话结束后自动回收。无需手动干预。

---

## 三、容器说明

### 常驻容器（`make docker-start` 启动）

| 容器名 | 镜像 | 对外端口 | 用途 |
| :---- | :---- | :---- | :---- |
| `deer-flow-nginx` | `nginx:alpine` | **2026**（访问入口） | 反向代理，统一分发前端/API/LangGraph 流量 |
| `deer-flow-frontend` | `deer-flow-dev-frontend` | 内部 | Next.js Dev Server，提供 Web UI，支持热重载 |
| `deer-flow-gateway` | `deer-flow-dev-gateway` | 内部 8001 | FastAPI 网关，提供 `/api/*` REST 接口、模型管理、记忆管理 |
| `deer-flow-langgraph` | `deer-flow-dev-langgraph` | 内部 2024 | LangGraph Server，驱动 Agent 工作流、多轮对话、子 Agent 调度 |

### 按需容器（对话触发时自动创建）

| 容器名 | 镜像 | 用途 |
| :---- | :---- | :---- |
| `deer-flow-sandbox-{uuid}` | `all-in-one-sandbox:latest` | 代码隔离执行环境，每个活跃会话独立一个，空闲后自动销毁 |

### Named Volume（Python 依赖缓存）

| Volume 名 | 挂载位置 | 用途 |
| :---- | :---- | :---- |
| `gateway-venv` | `gateway` 容器的 `/app/backend/.venv` | gateway 的 Python 虚拟环境，避免重启时重装依赖 |
| `langgraph-venv` | `langgraph` 容器的 `/app/backend/.venv` | langgraph 的 Python 虚拟环境，同上 |

---

## 四、需要持久化的内容

Dev 模式下，整个本地目录已 bind mount 进容器，**所有业务数据天然写到本地磁盘**，容器删除不丢失。

### 关键持久化路径

| 数据类型 | 本地路径 | 说明 |
| :---- | :---- | :---- |
| **模型/工具配置** | `./config.yaml` | LLM、工具、沙箱、记忆等全局配置 |
| **环境变量 / API Key** | `./.env` | 所有服务的密钥，不进 git |
| **对话历史** | `./backend/.deer-flow/threads/` | 每个会话一个子目录，含工作区文件 |
| **用户记忆** | `./backend/memory.json` | Agent 自动提取并持久化的用户上下文 |
| **状态快照** | `./backend/checkpoints.db` | LangGraph SQLite checkpoint，支持多轮对话跨重启恢复 |
| **Skills / Agent** | `./skills/` | 自定义 Agent 技能脚本 |
| **前端配置** | `./frontend/.env` | Next.js 环境变量 |
| **日志** | `./logs/` | 所有服务运行日志 |
| **扩展配置** | `./extensions_config.json` | MCP 等扩展插件配置 |

### Sandbox 会话数据（含在 threads 目录下）

backend/.deer-flow/threads/{thread-id}/

├── user-data/

│   ├── workspace/   \# Agent 代码执行工作区

│   ├── uploads/     \# 用户上传文件

│   └── outputs/     \# Agent 输出文件

└── acp-workspace/   \# ACP Agent 协作空间

---

## 五、日常操作速查

\# 启动

make docker-start

\# 停止（保留数据）

make docker-stop

\# 查看所有服务日志

make docker-logs

\# 查看单个服务日志

make docker-logs-frontend

make docker-logs-gateway

\# 访问入口

open http://localhost:2026

Docker Desktop 中也可直接对 `deer-flow-dev` 容器组执行 Start / Stop 操作。  

