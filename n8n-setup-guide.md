# NSSA自动发布 - n8n配置指南

## 📋 工作流概述

这个n8n工作流可以自动从Google Drive获取文档，使用AI生成Hugo格式的Front Matter，然后自动发布到NSSA网站。

### 🔄 工作流程
1. **定时/手动触发** → 扫描Google Drive文件夹
2. **处理Drive响应** → 解析API响应并提取文档列表
3. **遍历文档** → 逐个处理每个Google Docs文档
4. **设置权限** → 将文档设为公开可访问
5. **AI处理** → 使用Gemini生成Front Matter
6. **下载内容** → 获取文档的Markdown内容
7. **格式化** → 合并AI生成的元数据和文档内容
8. **GitHub提交** → 自动提交到NSSA仓库
9. **通知** → 发送处理结果通知

### ⚠️ 重要说明
由于n8n的Google Drive节点功能限制，本工作流使用HTTP Request节点直接调用Google Drive API，这样可以获得更完整的功能支持。

## 🛠️ 安装步骤

### 1. 导入工作流
1. 在n8n中点击 "Import from file"
2. 选择 `nssa-auto-publish-workflow.json` 文件
3. 点击 "Import" 导入工作流

### 2. 配置API凭证

#### Google Drive API
1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建新项目或选择现有项目
3. 启用 Google Drive API
4. 创建 OAuth 2.0 凭证
5. 在n8n中添加 "Google Drive OAuth2 API" 凭证
   - **凭证名称**: `google-drive-credentials`
   - **Client ID**: 从Google Cloud Console获取
   - **Client Secret**: 从Google Cloud Console获取

#### Gemini API
1. 前往 [Google AI Studio](https://makersuite.google.com/app/apikey)
2. 创建API密钥
3. 在n8n中添加 "HTTP Header Auth" 凭证
   - **凭证名称**: `gemini-api-key`
   - **Header Name**: `x-goog-api-key`
   - **Header Value**: 您的Gemini API密钥

#### GitHub API
1. 前往 GitHub Settings → Developer settings → Personal access tokens
2. 创建新的Personal Access Token，权限包括：
   - `repo` (完整仓库访问权限)
   - `contents` (读写仓库内容)
3. 在n8n中添加 "GitHub API" 凭证
   - **凭证名称**: `github-api`
   - **Access Token**: 您的GitHub Personal Access Token

#### Discord通知 (可选)
1. 在Discord服务器中创建Webhook
2. 在n8n中添加 "Discord Webhook API" 凭证
   - **凭证名称**: `discord-webhook`
   - **Webhook URL**: Discord Webhook URL

### 3. 配置工作流参数

#### 修改Google Drive文件夹ID
在 "扫描Google Drive" 节点中，修改查询参数：
```json
{
  "name": "q",
  "value": "'您的文件夹ID' in parents and mimeType='application/vnd.google-apps.document'"
}
```
将 `您的文件夹ID` 替换为您的Google Drive文件夹ID。

**获取文件夹ID方法**：
1. 在Google Drive中打开目标文件夹
2. 从URL中复制文件夹ID（最后一段字符串）
3. 例如：`https://drive.google.com/drive/folders/1BuWi03gZ8GwndFjz2LdhQglGMjW80VMY`
4. 文件夹ID就是：`1BuWi03gZ8GwndFjz2LdhQglGMjW80VMY`

#### 修改GitHub仓库信息
在 "提交到GitHub" 节点中：
```json
"owner": "Matthewyin",
"repository": "nssa"
```
确保这些信息与您的GitHub仓库匹配。

#### 配置分类映射
在 "处理AI响应" 节点中，修改分类映射：
```javascript
const categoryMap = {
  '历史专题': 'history',
  '技术专题': 'tech',
  '心理专题': 'psychology', 
  '职场专题': 'workplace'
};
```
根据您的Google Drive文件夹结构调整。

## 🚀 使用方法

### 手动触发
1. 点击 "手动触发器" 节点
2. 点击 "Execute Node" 立即执行工作流

### 自动执行
工作流默认每小时自动执行一次，扫描Google Drive中的新文档。

### 修改执行频率
在 "定时触发器" 节点中修改：
```json
"rule": {
  "interval": [
    {
      "field": "hours",
      "hoursInterval": 1  // 修改为所需的小时间隔
    }
  ]
}
```

## 📁 Google Drive文件夹结构

建议的文件夹结构：
```
NSSA文档/
├── 历史专题/
│   ├── 文档1.docx
│   └── 文档2.docx
├── 技术专题/
│   ├── 文档3.docx
│   └── 文档4.docx
├── 心理专题/
└── 职场专题/
```

## 🔧 自定义配置

### 修改AI提示词
在 "调用Gemini AI" 节点中，可以修改发送给AI的提示词：
```javascript
"请分析这个Google文档并返回Hugo格式的Front Matter。

文档URL: {{$json.webViewLink}}

要求返回JSON格式，包含以下字段：
{
  "title": "文章标题",
  "subtitle": "副标题",
  "description": "文章描述（100-200字）",
  "tags": ["标签1", "标签2", "标签3"],
  "readingTime": "约XX分钟"
}

请确保返回的是有效的JSON格式，不要包含其他文字说明。"
```

### 添加错误处理
可以在关键节点后添加 "IF" 节点来处理错误情况。

### 自定义通知
修改 "准备通知" 节点中的消息格式：
```javascript
const message = `NSSA自动发布完成\n\n` +
  `📊 处理统计：\n` +
  `- 总文档数：${totalCount}\n` +
  `- 成功发布：${successCount}\n` +
  `- 失败数量：${totalCount - successCount}\n\n` +
  `🔗 网站地址：https://nssa.io\n` +
  `📅 发布时间：${new Date().toLocaleString('zh-CN')}`;
```

## ⚠️ 注意事项

1. **API配额限制**
   - Google Drive API: 每天1000次请求
   - Gemini API: 根据您的配额计划
   - GitHub API: 每小时5000次请求

2. **文档权限**
   - 工作流会将Google文档设置为"知道链接的人可以访问"
   - 确保这符合您的安全要求

3. **文件名冲突**
   - 如果生成的文件名已存在，GitHub API会更新现有文件
   - 建议定期检查生成的文件名是否合适

4. **AI响应质量**
   - Gemini的响应质量可能因文档内容而异
   - 建议定期检查生成的Front Matter是否准确

## 🐛 故障排除

### 常见问题

**1. Google Drive API认证失败**
- 检查OAuth凭证是否正确配置
- 确保已启用Google Drive API
- 检查重定向URI设置

**2. Gemini API调用失败**
- 验证API密钥是否有效
- 检查API配额是否已用完
- 确保请求格式正确

**3. GitHub提交失败**
- 检查Personal Access Token权限
- 确保仓库名称和所有者正确
- 验证文件路径格式

**4. 文档下载失败**
- 确保文档权限已正确设置
- 检查文档是否为Google Docs格式
- 验证文档ID是否有效

### 调试技巧

1. **启用详细日志**
   - 在工作流设置中启用详细执行日志
   - 查看每个节点的输入输出数据

2. **分步测试**
   - 单独测试每个节点
   - 使用测试数据验证逻辑

3. **监控执行**
   - 定期检查工作流执行历史
   - 设置失败通知

## 📞 支持

如果遇到问题，请：
1. 检查n8n执行日志
2. 验证所有API凭证
3. 确认Google Drive文件夹权限
4. 查看GitHub仓库状态

---

**祝您使用愉快！** 🎉
