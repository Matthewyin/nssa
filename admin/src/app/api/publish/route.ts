import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

// 发布状态管理
const publishJobs = new Map();

/**
 * 获取发布记录
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const platform = searchParams.get('platform');
    
    // 读取发布结果文件
    const resultsPath = path.join(process.cwd(), '..', 'wechat-publish-results.json');
    let publishResults = [];
    
    if (fs.existsSync(resultsPath)) {
      const data = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
      publishResults = data.results || [];
    }
    
    // 添加当前运行中的任务
    for (const [jobId, job] of publishJobs.entries()) {
      publishResults.push({
        id: jobId,
        status: 'pending',
        platform: job.platform,
        articleTitle: job.articleTitle,
        startTime: job.startTime,
        duration: Date.now() - job.startTime,
      });
    }
    
    // 过滤结果
    let filteredResults = publishResults;
    if (status && status !== 'all') {
      filteredResults = filteredResults.filter(r => r.status === status);
    }
    if (platform && platform !== 'all') {
      filteredResults = filteredResults.filter(r => r.platform === platform);
    }
    
    return NextResponse.json({
      success: true,
      data: filteredResults,
      total: filteredResults.length,
    });
  } catch (error) {
    console.error('获取发布记录失败:', error);
    return NextResponse.json(
      { success: false, error: '获取发布记录失败' },
      { status: 500 }
    );
  }
}

/**
 * 触发发布任务
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { platform, articles, options = {} } = body;
    
    if (!platform || !articles || !Array.isArray(articles)) {
      return NextResponse.json(
        { success: false, error: '缺少必需参数' },
        { status: 400 }
      );
    }
    
    // 生成任务ID
    const jobId = `publish_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // 创建任务记录
    const job = {
      id: jobId,
      platform,
      articles,
      options,
      status: 'pending',
      startTime: Date.now(),
      articleTitle: articles.length === 1 ? articles[0].title : `${articles.length}篇文章`,
    };
    
    publishJobs.set(jobId, job);
    
    // 异步执行发布任务
    executePublishJob(jobId, job).catch(error => {
      console.error(`发布任务 ${jobId} 执行失败:`, error);
      job.status = 'failed';
      job.error = error.message;
    });
    
    return NextResponse.json({
      success: true,
      data: {
        jobId,
        status: 'pending',
        message: '发布任务已启动',
      },
    });
  } catch (error) {
    console.error('启动发布任务失败:', error);
    return NextResponse.json(
      { success: false, error: '启动发布任务失败' },
      { status: 500 }
    );
  }
}

/**
 * 执行发布任务
 */
async function executePublishJob(jobId: string, job: any) {
  try {
    console.log(`开始执行发布任务 ${jobId}`);
    
    const projectRoot = path.join(process.cwd(), '..');
    
    // 准备文章配置
    const articlesConfig = job.articles.map((article: any) => ({
      title: article.title,
      filePath: article.filePath,
      content: article.content,
      description: article.description,
      publish: {
        website: job.platform === 'website' || job.platform === 'all',
        wechat_a: job.platform === 'wechat_a' || job.platform === 'all',
        wechat_b: job.platform === 'wechat_b' || job.platform === 'all',
      },
      wechat: {
        title: article.wechat?.title || article.title,
        summary: article.wechat?.summary || article.description,
        author: article.wechat?.author || 'NSSA团队',
        cover_image: article.wechat?.cover_image,
      },
    }));
    
    // 设置环境变量
    const env = {
      ...process.env,
      ARTICLES_CONFIG: JSON.stringify(articlesConfig),
    };
    
    let scriptPath: string;
    let scriptArgs: string[] = [];
    
    // 根据平台选择脚本
    switch (job.platform) {
      case 'website':
        scriptPath = path.join(projectRoot, 'scripts', 'local-publish.js');
        scriptArgs = ['--website-only'];
        break;
      case 'wechat_a':
      case 'wechat_b':
      case 'wechat':
        scriptPath = path.join(projectRoot, 'scripts', 'publish-wechat.js');
        break;
      case 'all':
        scriptPath = path.join(projectRoot, 'scripts', 'local-publish.js');
        scriptArgs = ['--all'];
        break;
      default:
        throw new Error(`不支持的发布平台: ${job.platform}`);
    }
    
    // 执行发布脚本
    const result = await executeScript(scriptPath, scriptArgs, env, projectRoot);
    
    // 更新任务状态
    job.status = result.success ? 'success' : 'failed';
    job.endTime = Date.now();
    job.duration = job.endTime - job.startTime;
    job.output = result.output;
    job.error = result.error;
    
    console.log(`发布任务 ${jobId} 完成，状态: ${job.status}`);
    
    // 清理完成的任务（保留一段时间）
    setTimeout(() => {
      publishJobs.delete(jobId);
    }, 5 * 60 * 1000); // 5分钟后清理
    
  } catch (error) {
    console.error(`发布任务 ${jobId} 执行异常:`, error);
    job.status = 'failed';
    job.error = error.message;
    job.endTime = Date.now();
    job.duration = job.endTime - job.startTime;
  }
}

/**
 * 执行脚本
 */
function executeScript(
  scriptPath: string,
  args: string[],
  env: NodeJS.ProcessEnv,
  cwd: string
): Promise<{ success: boolean; output: string; error?: string }> {
  return new Promise((resolve) => {
    const child = spawn('node', [scriptPath, ...args], {
      cwd,
      env,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    
    let output = '';
    let errorOutput = '';
    
    child.stdout?.on('data', (data) => {
      output += data.toString();
    });
    
    child.stderr?.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    child.on('close', (code) => {
      const success = code === 0;
      resolve({
        success,
        output: output + errorOutput,
        error: success ? undefined : errorOutput || `脚本执行失败，退出码: ${code}`,
      });
    });
    
    child.on('error', (error) => {
      resolve({
        success: false,
        output: '',
        error: `脚本执行错误: ${error.message}`,
      });
    });
  });
}

/**
 * 获取特定任务状态
 */
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');
    
    if (!jobId) {
      return NextResponse.json(
        { success: false, error: '缺少任务ID' },
        { status: 400 }
      );
    }
    
    const job = publishJobs.get(jobId);
    if (!job) {
      return NextResponse.json(
        { success: false, error: '任务不存在' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: {
        id: job.id,
        status: job.status,
        platform: job.platform,
        articleTitle: job.articleTitle,
        startTime: job.startTime,
        endTime: job.endTime,
        duration: job.endTime ? job.endTime - job.startTime : Date.now() - job.startTime,
        output: job.output,
        error: job.error,
      },
    });
  } catch (error) {
    console.error('获取任务状态失败:', error);
    return NextResponse.json(
      { success: false, error: '获取任务状态失败' },
      { status: 500 }
    );
  }
}
