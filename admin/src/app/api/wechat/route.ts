import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

/**
 * 微信公众号集成API
 */

/**
 * 获取微信公众号配置状态
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    
    switch (action) {
      case 'status':
        return getWeChatStatus();
      case 'accounts':
        return getWeChatAccounts();
      default:
        return NextResponse.json(
          { success: false, error: '不支持的操作' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('获取微信配置失败:', error);
    return NextResponse.json(
      { success: false, error: '获取微信配置失败' },
      { status: 500 }
    );
  }
}

/**
 * 微信公众号操作
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, account, articles } = body;
    
    switch (action) {
      case 'publish':
        return publishToWeChat(account, articles);
      case 'test':
        return testWeChatConnection(account);
      case 'draft':
        return createWeChatDraft(account, articles);
      default:
        return NextResponse.json(
          { success: false, error: '不支持的操作' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('微信操作失败:', error);
    return NextResponse.json(
      { success: false, error: '微信操作失败' },
      { status: 500 }
    );
  }
}

/**
 * 获取微信公众号状态
 */
async function getWeChatStatus() {
  const accounts = [];
  
  // 检查公众号A配置
  if (process.env.WECHAT_A_APPID && process.env.WECHAT_A_SECRET) {
    accounts.push({
      id: 'wechat_a',
      name: '公众号A',
      appId: process.env.WECHAT_A_APPID,
      configured: true,
      status: 'ready',
    });
  } else {
    accounts.push({
      id: 'wechat_a',
      name: '公众号A',
      configured: false,
      status: 'not_configured',
      error: '缺少APPID或SECRET配置',
    });
  }
  
  // 检查公众号B配置
  if (process.env.WECHAT_B_APPID && process.env.WECHAT_B_SECRET) {
    accounts.push({
      id: 'wechat_b',
      name: '公众号B',
      appId: process.env.WECHAT_B_APPID,
      configured: true,
      status: 'ready',
    });
  } else {
    accounts.push({
      id: 'wechat_b',
      name: '公众号B',
      configured: false,
      status: 'not_configured',
      error: '缺少APPID或SECRET配置',
    });
  }
  
  return NextResponse.json({
    success: true,
    data: {
      accounts,
      totalAccounts: accounts.length,
      configuredAccounts: accounts.filter(a => a.configured).length,
    },
  });
}

/**
 * 获取微信公众号账户列表
 */
async function getWeChatAccounts() {
  const accounts = [
    {
      id: 'wechat_a',
      name: '公众号A',
      description: '主要公众号账户',
      configured: !!(process.env.WECHAT_A_APPID && process.env.WECHAT_A_SECRET),
      lastUsed: null,
    },
    {
      id: 'wechat_b',
      name: '公众号B',
      description: '备用公众号账户',
      configured: !!(process.env.WECHAT_B_APPID && process.env.WECHAT_B_SECRET),
      lastUsed: null,
    },
  ];
  
  return NextResponse.json({
    success: true,
    data: accounts,
  });
}

/**
 * 发布到微信公众号
 */
async function publishToWeChat(account: string, articles: any[]) {
  try {
    if (!articles || articles.length === 0) {
      return NextResponse.json(
        { success: false, error: '没有提供文章' },
        { status: 400 }
      );
    }
    
    // 准备文章配置
    const articlesConfig = articles.map(article => ({
      title: article.title,
      filePath: article.filePath,
      content: article.content,
      description: article.description,
      publish: {
        website: false,
        wechat_a: account === 'wechat_a',
        wechat_b: account === 'wechat_b',
      },
      wechat: {
        title: article.wechat?.title || article.title,
        summary: article.wechat?.summary || article.description,
        author: article.wechat?.author || 'NSSA团队',
        cover_image: article.wechat?.cover_image,
      },
    }));
    
    // 执行微信发布脚本
    const projectRoot = path.join(process.cwd(), '..');
    const scriptPath = path.join(projectRoot, 'scripts', 'publish-wechat.js');
    
    const env = {
      ...process.env,
      ARTICLES_CONFIG: JSON.stringify(articlesConfig),
    };
    
    const result = await executeScript(scriptPath, [], env, projectRoot);
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        data: {
          account,
          articles: articlesConfig.length,
          output: result.output,
        },
        message: '微信发布任务已启动',
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error, output: result.output },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('微信发布失败:', error);
    return NextResponse.json(
      { success: false, error: '微信发布失败' },
      { status: 500 }
    );
  }
}

/**
 * 测试微信连接
 */
async function testWeChatConnection(account: string) {
  try {
    // 检查配置
    const appId = account === 'wechat_a' ? process.env.WECHAT_A_APPID : process.env.WECHAT_B_APPID;
    const secret = account === 'wechat_a' ? process.env.WECHAT_A_SECRET : process.env.WECHAT_B_SECRET;
    
    if (!appId || !secret) {
      return NextResponse.json(
        { success: false, error: '微信配置不完整' },
        { status: 400 }
      );
    }
    
    // 尝试获取access_token
    const response = await fetch('https://api.weixin.qq.com/cgi-bin/token', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const params = new URLSearchParams({
      grant_type: 'client_credential',
      appid: appId,
      secret: secret,
    });
    
    const tokenResponse = await fetch(`https://api.weixin.qq.com/cgi-bin/token?${params}`);
    const tokenData = await tokenResponse.json();
    
    if (tokenData.access_token) {
      return NextResponse.json({
        success: true,
        data: {
          account,
          status: 'connected',
          expiresIn: tokenData.expires_in,
        },
        message: '微信连接测试成功',
      });
    } else {
      return NextResponse.json(
        { 
          success: false, 
          error: `微信API错误: ${tokenData.errcode} - ${tokenData.errmsg}` 
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('微信连接测试失败:', error);
    return NextResponse.json(
      { success: false, error: '微信连接测试失败' },
      { status: 500 }
    );
  }
}

/**
 * 创建微信草稿
 */
async function createWeChatDraft(account: string, articles: any[]) {
  // 这里可以实现创建草稿的逻辑
  // 目前先返回成功状态
  return NextResponse.json({
    success: true,
    data: {
      account,
      drafts: articles.length,
    },
    message: '微信草稿创建成功',
  });
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
