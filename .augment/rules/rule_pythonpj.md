---
type: "always_apply"
---

# 现代 Python 开发规范 (v2.1)

为确保代码质量、提升开发效率、实现高效团队协作，并拥抱现代 Python 生态，所有 Python 项目开发必须严格遵循以下规范。

### **1. 项**目设置与环境管理 (Project Setup & Environment Management)

#### 1.1. 版本控制 (Version Control)

- **强制使用 Git**：所有项目代码必须使用 Git 进行版本控制，并托管于远程仓库（如 GitHub, GitLab）。
- **`.gitignore` 文件**：必须配置详尽的 `.gitignore` 文件，以忽略不必要的文件，例如：
  - 虚拟环境目录 (`.venv/`, `venv/`)
  - 敏感配置文件 (`.env`)
  - Python 缓存文件 (`__pycache__/`, `.pyc`)
  - IDE 和系统配置文件 (`.idea/`, `.vscode/`, `.DS_Store`)
  - 测试与构建产物 (`.pytest_cache/`, `build/`, `dist/`, `*.egg-info`)

#### 1.2. 虚拟环境 (Virtual Environments)

- **强制使用虚拟环境**：必须为每个项目创建独立的 Python 虚拟环境，以实现项目依赖的完全隔离。

- **推荐工具**：

  - **`uv` (新一代推荐)**：一个用 Rust 编写的极速 Python 包安装器和解析器。它兼容 `pip` 的工作流程，但速度要快得多，并内置了虚拟环境管理功能。
  - **`venv` (标准内置)**：Python 内置的 `venv` 模块是创建虚拟环境的标准方式。

  ```
  # 使用 uv 创建并激活虚拟环境 (推荐)
  uv venv
  source .venv/bin/activate
  
  # 使用 venv 创建并激活虚拟环境 (传统)
  python -m venv .venv
  source .venv/bin/activate
  ```

#### 1.3. 依赖管理 (Dependency Management)

- **核心标准 `pyproject.toml`**：项目依赖管理**必须**采用 `pyproject.toml` 文件。这统一了项目元数据、构建需求和依赖项，是现代 Python 项目的基石。推荐使用 `Poetry` 或 `PDM` 等现代工具进行管理，它们会自动维护 `pyproject.toml`。
- **传统方案 `requirements.txt`**：对于非常简单的项目或需要兼容旧环境的场景，可使用 `requirements.txt`。
  - **精确导出**：必须使用 `uv pip freeze > requirements.txt` 或 `pip freeze > requirements.txt` 命令导出精确依赖列表。
  - **分层管理**：可将依赖分为 `requirements.txt` (生产) 和 `requirements-dev.txt` (开发)。
  - **安装依赖**：新环境必须使用 `uv pip install -r requirements.txt` 或 `pip install -r requirements.txt` 进行安装。

### 2. 代码规范与质量 (Code Style & Quality)

#### 2.1. 代码风格 (Code Style)

- **PEP 8 规范**：所有 Python 代码必须严格遵循 [PEP 8](https://peps.python.org/pep-0008/) 规范。
- **自动化工具链 `Ruff`**：**强烈推荐**使用 `Ruff` 作为主要的代码检查和格式化工具。它集成了 `Flake8` (Linter), `isort` (import 排序), `Black` (格式化) 等多种工具的功能，速度极快且配置简单。
  - 在 `pyproject.toml` 中配置 `Ruff`，统一团队风格。
  - **行长度**：推荐将最大行长度设置为 `88` (Black 默认) 或 `120`，团队内保持统一。

#### 2.2. 类型提示 (Type Hinting)

- **强制使用类型提示**：所有新代码中的函数签名（参数和返回值）和关键变量声明，都**必须**包含类型提示（Type Hints, [PEP 484](https://peps.python.org/pep-0484/)）。

- **静态类型检查**：应在 CI/CD 流程中集成 `Mypy` 或使用 `Ruff` 内置的类型检查功能，对代码进行静态分析，及早发现类型错误。

  ```
  def greet(name: str) -> str:
      return f"Hello, {name}"
  
  user_id: int = 101
  ```

#### 2.3. 代码注释与文档 (Code Comments & Documentation)

- **详尽注释**：对复杂的业务逻辑、算法或非直观的操作，必须编写清晰的中文注释。
- **标准文档字符串 (Docstring)**：每个模块、类和函数都必须包含文档字符串。推荐遵循 [Google Python Style Guide](https://www.google.com/search?q=https://github.com/google/styleguide/blob/gh-pages/pyguide.md%2338-comments-and-docstrings) 或 NumPy 风格。
- **项目文档**：复杂项目建议使用 `Sphinx` 或 `MkDocs` 自动生成项目文档网站。

### 3. 配置与数据管理 (Configuration & Data Management)

#### 3.1. 目录结构 (Directory Structure)

- **自动化创建**：程序必须内置检查机制，在启动时自动检测并创建所有必要的目录。

- **推荐结构**:

  ```
  project_root/
  ├── .venv/                   # 虚拟环境
  ├── .git/                    # Git 目录
  ├── src/                     # 主要源代码目录 (推荐)
  │   └── my_project/
  │       ├── __init__.py
  │       └── ...
  ├── tests/                   # 测试代码
  ├── data/                    # 数据文件
  │   ├── raw/                 # 原始输入数据
  │   └── processed/           # 处理后的输出数据
  ├── logs/                    # 日志文件
  ├── docs/                    # 项目文档
  ├── .env                     # 环境变量文件 (绝不提交到 Git)
  ├── .gitignore               # Git 忽略配置
  ├── pyproject.toml           # 项目配置文件 (首选)
  ├── README.md                # 项目说明文件
  ```

#### 3.2. 配置管理 (Configuration Management)

现代 Python 项目的配置管理是确保应用程序在不同环境中正确运行的关键。必须采用分层、类型安全且安全的配置管理策略。

##### 3.2.1. 核心原则 (Core Principles)

- **禁止硬编码**：严禁在代码中硬编码任何可变参数（URL、密钥、路径等）。
- **环境分离**：开发、测试、生产环境的配置必须完全分离。
- **类型安全**：所有配置项必须有明确的类型定义和验证。
- **敏感信息保护**：API 密钥、数据库密码等敏感信息必须安全存储和访问。
- **统一接口**：提供统一的配置加载和访问接口。

##### 3.2.2. 环境变量管理 (Environment Variables)

- **`.env` 文件**：使用 `python-dotenv` 库管理本地开发环境变量。
- **分层 `.env` 文件**：
  ```
  .env                    # 默认配置（提交到 Git，不含敏感信息）
  .env.local             # 本地覆盖配置（不提交到 Git）
  .env.development       # 开发环境配置
  .env.testing          # 测试环境配置
  .env.production       # 生产环境配置（通过 CI/CD 部署）
  ```

- **`.gitignore` 配置**：
  ```gitignore
  # 环境变量文件
  .env.local
  .env.*.local
  .env.production
  .env.testing
  ```

##### 3.2.3. 推荐配置工具 (Recommended Tools)

- **`Pydantic Settings`** (强烈推荐)：提供类型安全的配置管理和自动验证。
- **`python-dotenv`**：环境变量文件加载。
- **`dynaconf`**：复杂项目的多环境配置管理。
- **`hydra`**：机器学习项目的配置管理。

##### 3.2.4. 配置文件格式 (Configuration File Formats)

- **TOML** (推荐)：现代 Python 项目的首选格式，语法清晰，支持复杂数据结构。
- **YAML**：适合复杂嵌套配置，但需注意安全性（使用 `safe_load`）。
- **JSON**：简单配置的选择，但不支持注释。

##### 3.2.5. 配置类设计模式 (Configuration Class Pattern)

**推荐使用 Pydantic Settings 的现代配置模式**：

```python
# config.py
from pydantic import BaseSettings, Field, validator
from typing import Optional, List
from pathlib import Path
import os

class DatabaseConfig(BaseSettings):
    """数据库配置"""
    host: str = Field(..., description="数据库主机地址")
    port: int = Field(5432, description="数据库端口")
    username: str = Field(..., description="数据库用户名")
    password: str = Field(..., description="数据库密码")
    database: str = Field(..., description="数据库名称")

    @property
    def url(self) -> str:
        return f"postgresql://{self.username}:{self.password}@{self.host}:{self.port}/{self.database}"

    class Config:
        env_prefix = "DB_"  # 环境变量前缀

class APIConfig(BaseSettings):
    """API 配置"""
    secret_key: str = Field(..., description="API 密钥")
    debug: bool = Field(False, description="调试模式")
    allowed_hosts: List[str] = Field(default_factory=list, description="允许的主机")
    rate_limit: int = Field(100, description="速率限制")

    @validator('secret_key')
    def validate_secret_key(cls, v):
        if len(v) < 32:
            raise ValueError('密钥长度必须至少 32 个字符')
        return v

    class Config:
        env_prefix = "API_"

class AppConfig(BaseSettings):
    """应用程序主配置"""
    # 基本信息
    app_name: str = Field("NSSA Auto Publisher", description="应用名称")
    version: str = Field("1.0.0", description="应用版本")
    environment: str = Field("development", description="运行环境")

    # 路径配置
    project_root: Path = Field(default_factory=lambda: Path.cwd(), description="项目根目录")
    data_dir: Path = Field(default_factory=lambda: Path("data"), description="数据目录")
    logs_dir: Path = Field(default_factory=lambda: Path("logs"), description="日志目录")

    # 子配置
    database: DatabaseConfig = Field(default_factory=DatabaseConfig)
    api: APIConfig = Field(default_factory=APIConfig)

    # Google Drive 配置
    google_credentials_file: Optional[Path] = Field(None, description="Google 凭证文件路径")
    google_folder_id: str = Field(..., description="Google Drive 文件夹 ID")

    # GitHub 配置
    github_token: str = Field(..., description="GitHub 访问令牌")
    github_repo: str = Field("Matthewyin/nssa", description="GitHub 仓库")

    # Cloudflare 配置
    cloudflare_api_token: str = Field(..., description="Cloudflare API 令牌")
    cloudflare_zone_id: str = Field(..., description="Cloudflare Zone ID")

    @validator('project_root', 'data_dir', 'logs_dir')
    def ensure_path_exists(cls, v):
        """确保路径存在"""
        if isinstance(v, str):
            v = Path(v)
        v.mkdir(parents=True, exist_ok=True)
        return v

    @validator('environment')
    def validate_environment(cls, v):
        allowed = ['development', 'testing', 'production']
        if v not in allowed:
            raise ValueError(f'环境必须是 {allowed} 中的一个')
        return v

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False

        @classmethod
        def customise_sources(cls, init_settings, env_settings, file_secret_settings):
            """自定义配置源优先级"""
            return (
                init_settings,
                env_settings,
                file_secret_settings,
            )

# 全局配置实例
settings = AppConfig()
```

##### 3.2.6. 配置加载和使用模式 (Configuration Loading Patterns)

**统一配置加载器**：

```python
# config_loader.py
from typing import Optional
from pathlib import Path
import os
from dotenv import load_dotenv

class ConfigLoader:
    """配置加载器 - 统一管理配置加载逻辑"""

    @staticmethod
    def load_env_files(env: Optional[str] = None) -> None:
        """加载环境变量文件"""
        env = env or os.getenv("ENVIRONMENT", "development")

        # 加载顺序：从通用到具体
        env_files = [
            ".env",                    # 基础配置
            f".env.{env}",            # 环境特定配置
            ".env.local",             # 本地覆盖配置
            f".env.{env}.local",      # 环境特定本地配置
        ]

        for env_file in env_files:
            if Path(env_file).exists():
                load_dotenv(env_file, override=True)
                print(f"✓ 已加载配置文件: {env_file}")

    @staticmethod
    def get_config() -> AppConfig:
        """获取配置实例"""
        ConfigLoader.load_env_files()
        return AppConfig()

# 使用示例
config = ConfigLoader.get_config()
```

**配置验证和错误处理**：

```python
# config_validator.py
from pydantic import ValidationError
import sys
import structlog

logger = structlog.get_logger()

def validate_config() -> AppConfig:
    """验证配置并处理错误"""
    try:
        config = ConfigLoader.get_config()
        logger.info("配置验证成功", environment=config.environment)
        return config
    except ValidationError as e:
        logger.error("配置验证失败", errors=e.errors())
        print("❌ 配置错误:")
        for error in e.errors():
            field = " -> ".join(str(loc) for loc in error["loc"])
            print(f"  {field}: {error['msg']}")
        sys.exit(1)
    except Exception as e:
        logger.error("配置加载失败", error=str(e))
        sys.exit(1)
```

##### 3.2.7. 敏感信息管理 (Sensitive Information Management)

**密钥管理最佳实践**：

- **本地开发**：使用 `.env.local` 文件（不提交到 Git）
- **CI/CD**：使用 GitHub Secrets、GitLab Variables 等
- **生产环境**：使用 AWS Secrets Manager、Azure Key Vault、HashiCorp Vault 等
- **容器化**：使用 Docker Secrets 或 Kubernetes Secrets

**密钥轮换和访问控制**：

```python
# secrets_manager.py
from abc import ABC, abstractmethod
from typing import Dict, Any
import boto3
from botocore.exceptions import ClientError

class SecretsManager(ABC):
    """密钥管理器抽象基类"""

    @abstractmethod
    def get_secret(self, secret_name: str) -> str:
        pass

    @abstractmethod
    def get_secrets(self, secret_names: list[str]) -> Dict[str, str]:
        pass

class AWSSecretsManager(SecretsManager):
    """AWS Secrets Manager 实现"""

    def __init__(self, region_name: str = "us-east-1"):
        self.client = boto3.client("secretsmanager", region_name=region_name)

    def get_secret(self, secret_name: str) -> str:
        try:
            response = self.client.get_secret_value(SecretId=secret_name)
            return response["SecretString"]
        except ClientError as e:
            logger.error("获取密钥失败", secret_name=secret_name, error=str(e))
            raise

class LocalSecretsManager(SecretsManager):
    """本地开发环境密钥管理器"""

    def get_secret(self, secret_name: str) -> str:
        value = os.getenv(secret_name)
        if not value:
            raise ValueError(f"环境变量 {secret_name} 未设置")
        return value

# 工厂模式选择密钥管理器
def get_secrets_manager(environment: str) -> SecretsManager:
    if environment == "production":
        return AWSSecretsManager()
    else:
        return LocalSecretsManager()
```

##### 3.2.8. 多环境配置示例 (Multi-Environment Configuration Examples)

**`.env` (基础配置，可提交)**：
```bash
# 应用基础配置
APP_NAME=NSSA Auto Publisher
APP_VERSION=1.0.0
ENVIRONMENT=development

# 数据库配置（非敏感信息）
DB_HOST=localhost
DB_PORT=5432
DB_DATABASE=nssa_dev

# API 配置
API_DEBUG=true
API_RATE_LIMIT=100
```

**`.env.production` (生产环境，通过 CI/CD 部署)**：
```bash
# 生产环境覆盖配置
ENVIRONMENT=production
API_DEBUG=false
API_RATE_LIMIT=1000

# 生产数据库（密钥通过 Secrets Manager 获取）
DB_HOST=prod-db.example.com
DB_DATABASE=nssa_prod
```

**`.env.local` (本地开发，不提交)**：
```bash
# 本地开发密钥
DB_USERNAME=dev_user
DB_PASSWORD=dev_password
API_SECRET_KEY=your-local-secret-key
GITHUB_TOKEN=your-github-token
CLOUDFLARE_API_TOKEN=your-cloudflare-token
```

##### 3.2.9. 配置安全最佳实践 (Security Best Practices)

**文件权限管理**：
```bash
# 设置环境变量文件的安全权限
chmod 600 .env.local .env.production
chmod 644 .env .env.development

# 确保敏感配置文件不被意外提交
echo ".env.local" >> .gitignore
echo ".env.*.local" >> .gitignore
echo ".env.production" >> .gitignore
```

**配置验证和审计**：
```python
# config_audit.py
import re
from typing import List, Dict
from pathlib import Path

class ConfigAuditor:
    """配置安全审计器"""

    SENSITIVE_PATTERNS = [
        r'password\s*=\s*["\']?[^"\'\s]+',
        r'secret\s*=\s*["\']?[^"\'\s]+',
        r'token\s*=\s*["\']?[^"\'\s]+',
        r'key\s*=\s*["\']?[^"\'\s]+',
    ]

    @classmethod
    def audit_config_files(cls, config_dir: Path = Path(".")) -> Dict[str, List[str]]:
        """审计配置文件中的敏感信息"""
        issues = {}

        for config_file in config_dir.glob(".env*"):
            if config_file.name in [".env.local", ".env.production"]:
                continue  # 跳过已知的敏感文件

            file_issues = cls._check_file(config_file)
            if file_issues:
                issues[str(config_file)] = file_issues

        return issues

    @classmethod
    def _check_file(cls, file_path: Path) -> List[str]:
        """检查单个文件"""
        issues = []
        try:
            content = file_path.read_text()
            for line_num, line in enumerate(content.splitlines(), 1):
                for pattern in cls.SENSITIVE_PATTERNS:
                    if re.search(pattern, line, re.IGNORECASE):
                        issues.append(f"第 {line_num} 行可能包含敏感信息")
        except Exception as e:
            issues.append(f"读取文件失败: {e}")

        return issues
```

**运行时配置保护**：
```python
# config_protection.py
import os
from typing import Dict, Any

class ConfigProtector:
    """运行时配置保护器"""

    @staticmethod
    def mask_sensitive_values(config_dict: Dict[str, Any]) -> Dict[str, Any]:
        """遮蔽敏感配置值用于日志输出"""
        sensitive_keys = {
            'password', 'secret', 'token', 'key', 'credential'
        }

        masked = {}
        for key, value in config_dict.items():
            if any(sensitive in key.lower() for sensitive in sensitive_keys):
                if isinstance(value, str) and len(value) > 4:
                    masked[key] = f"{value[:2]}***{value[-2:]}"
                else:
                    masked[key] = "***"
            else:
                masked[key] = value

        return masked

    @staticmethod
    def clear_environment_secrets():
        """清理环境变量中的敏感信息（程序退出时调用）"""
        sensitive_vars = [
            var for var in os.environ.keys()
            if any(keyword in var.lower()
                  for keyword in ['password', 'secret', 'token', 'key'])
        ]

        for var in sensitive_vars:
            os.environ.pop(var, None)
```

##### 3.2.10. 配置部署和 CI/CD 集成 (Deployment & CI/CD Integration)

**GitHub Actions 配置示例**：
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production

    steps:
    - uses: actions/checkout@v4

    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.11'

    - name: Install dependencies
      run: |
        pip install -r requirements.txt

    - name: Create production config
      env:
        DB_PASSWORD: ${{ secrets.DB_PASSWORD }}
        API_SECRET_KEY: ${{ secrets.API_SECRET_KEY }}
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
      run: |
        cat > .env.production << EOF
        ENVIRONMENT=production
        DB_PASSWORD=${DB_PASSWORD}
        API_SECRET_KEY=${API_SECRET_KEY}
        GITHUB_TOKEN=${GITHUB_TOKEN}
        CLOUDFLARE_API_TOKEN=${CLOUDFLARE_API_TOKEN}
        EOF

    - name: Validate configuration
      run: |
        python -c "
        from config_loader import ConfigLoader
        config = ConfigLoader.get_config()
        print('✓ 配置验证成功')
        "

    - name: Deploy application
      run: |
        # 部署逻辑
        python deploy.py
```

**Docker 配置管理**：
```dockerfile
# Dockerfile
FROM python:3.11-slim

WORKDIR /app

# 复制依赖文件
COPY requirements.txt .
RUN pip install -r requirements.txt

# 复制应用代码
COPY . .

# 创建非 root 用户
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# 设置环境变量
ENV PYTHONPATH=/app
ENV ENVIRONMENT=production

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD python -c "from config_loader import ConfigLoader; ConfigLoader.get_config()" || exit 1

CMD ["python", "main.py"]
```

##### 3.2.11. 配置管理工具对比 (Configuration Management Tools Comparison)

| 工具 | 适用场景 | 优势 | 劣势 |
|------|----------|------|------|
| **Pydantic Settings** | 中小型项目 | 类型安全、自动验证、简单易用 | 功能相对简单 |
| **dynaconf** | 复杂多环境项目 | 功能丰富、多格式支持、环境切换 | 学习曲线较陡 |
| **hydra** | 机器学习项目 | 配置组合、命令行集成、实验管理 | 过于复杂（非 ML 项目） |
| **python-decouple** | 简单项目 | 轻量级、零依赖 | 功能有限 |

**推荐选择策略**：
- **小型项目**：`python-dotenv` + `Pydantic Settings`
- **中型项目**：`dynaconf` + `Pydantic Settings`
- **大型项目**：`dynaconf` + 自定义配置管理层
- **机器学习项目**：`hydra` + `Pydantic Settings`

##### 3.2.12. 配置管理检查清单 (Configuration Management Checklist)

在项目开发和部署前，请确保完成以下配置管理检查：

**开发阶段**：
- [ ] 创建了 `.env` 基础配置文件（可提交）
- [ ] 创建了 `.env.local` 本地配置文件（不提交）
- [ ] 所有敏感文件已添加到 `.gitignore`
- [ ] 使用 Pydantic Settings 定义了类型安全的配置类
- [ ] 实现了统一的配置加载器
- [ ] 添加了配置验证和错误处理
- [ ] 设置了正确的文件权限

**测试阶段**：
- [ ] 创建了测试环境配置文件
- [ ] 配置了 CI/CD 环境变量
- [ ] 验证了配置在不同环境下的正确性
- [ ] 进行了配置安全审计

**生产部署**：
- [ ] 配置了生产环境密钥管理
- [ ] 设置了配置监控和告警
- [ ] 实现了配置的版本控制和回滚
- [ ] 建立了配置变更的审批流程

**安全要求**：
- [ ] 敏感信息使用专门的密钥管理服务
- [ ] 配置了适当的访问控制和权限
- [ ] 实现了配置的加密存储和传输
- [ ] 建立了密钥轮换机制

#### 3.3. 文件 I/O (File I/O)

- **使用 `pathlib`**：推荐使用 `pathlib` 模块处理文件路径。
- **明确路径**：所有文件读写应基于项目根目录构建绝对路径或使用相对路径。

### 4. 健壮性与可靠性 (Robustness & Reliability)

#### 4.1. 日志管理 (Logging)

- **使用 `logging` 模块**：必须使用 Python 内置的 `logging` 模块，禁止使用 `print()`。
- **结构化日志**：推荐使用结构化日志（如 JSON 格式），可使用 `structlog` 等库。
- **详尽内容与合理分级**：日志必须包含时间戳、级别、模块名等信息。错误日志必须含完整堆栈跟踪。

#### 4.2. 错误处理 (Error Handling)

- **精准捕获**：必须捕获具体的异常类型，严禁使用裸露的 `except:`。
- **上下文管理**：优先使用 `with` 语句处理需要关闭的资源。
- **优雅退出**：对于不可恢复的错误，记录日志后，应通过 `sys.exit(1)` 退出程序。

#### 4.3. 测试 (Testing)

- **强制编写单元测试**：核心业务逻辑必须有单元测试覆盖。推荐使用 `pytest`。
- **测试覆盖率**：建议使用 `pytest-cov` 插件监控测试覆盖率（如目标 >80%）。
- **测试独立性**：测试用例应保持独立，不依赖于其他测试。

### 5. 架构与设计 (Architecture & Design)

#### 5.1. 模块化与可重用性 (Modularity & Reusability)

- **单一职责原则**：函数和类应遵循单一职责原则。
- **避免循环导入**：精心设计模块依赖关系，避免循环导入。
- **清晰的接口**：编写通用性强、接口清晰的代码。

#### 5.2. 输出简洁性 (Output Conciseness)

- **面向目标输出**：代码的返回结果或控制台输出应简洁明确。
- **禁止冗余信息**：避免在程序化输出中包含不必要的解释性文字。

### 6. 自动化 (Automation)

#### 6.1. 持续集成/持续部署 (CI/CD)

- **建立 CI 流水线**：强烈建议使用 GitHub Actions, GitLab CI 等工具。
- **自动化检查**：CI 流水线应至少包含：代码格式化与检查 (`Ruff`)、静态类型检查 (`Mypy`/`Ruff`)、运行测试 (`pytest`)。