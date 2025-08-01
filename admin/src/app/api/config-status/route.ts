import { NextRequest, NextResponse } from 'next/server';

/**
 * 配置状态检查API
 * GET /api/config-status - 获取系统配置状态
 */

export async function GET(request: NextRequest) {
  try {
    // 调试：打印环境变量状态
    console.log('Environment variables check:');
    console.log('GITHUB_TOKEN:', !!process.env.GITHUB_TOKEN);
    console.log('WECHAT_A_APPID:', !!process.env.WECHAT_A_APPID);

    // 检查GitHub配置
    const githubToken = process.env.GITHUB_TOKEN;
    const githubOwner = process.env.GITHUB_OWNER;
    const githubRepo = process.env.GITHUB_REPO;
    const githubBranch = process.env.GITHUB_BRANCH;

    const githubConfigured = !!(githubToken && githubOwner && githubRepo && githubBranch);

    // 检查微信配置
    const wechatAAppId = process.env.WECHAT_A_APPID;
    const wechatASecret = process.env.WECHAT_A_SECRET;
    const wechatBAppId = process.env.WECHAT_B_APPID;
    const wechatBSecret = process.env.WECHAT_B_SECRET;

    const wechatAConfigured = !!(wechatAAppId && wechatASecret);
    const wechatBConfigured = !!(wechatBAppId && wechatBSecret);
    const wechatConfiguredAccounts = (wechatAConfigured ? 1 : 0) + (wechatBConfigured ? 1 : 0);

    // 检查其他配置
    const jwtSecret = process.env.JWT_SECRET;
    const nodeEnv = process.env.NODE_ENV;

    const configStatus = {
      github: {
        configured: githubConfigured,
        status: githubConfigured ? 'connected' : 'not_configured',
        details: {
          hasToken: !!githubToken,
          hasOwner: !!githubOwner,
          hasRepo: !!githubRepo,
          hasBranch: !!githubBranch,
          owner: githubOwner || 'not_set',
          repo: githubRepo || 'not_set',
          branch: githubBranch || 'not_set',
        },
      },
      wechat: {
        configured: wechatConfiguredAccounts > 0,
        configuredAccounts: wechatConfiguredAccounts,
        totalAccounts: 2,
        accounts: [
          {
            name: '微信公众号A',
            configured: wechatAConfigured,
            appId: wechatAConfigured ? wechatAAppId : 'not_configured',
            hasSecret: !!wechatASecret,
          },
          {
            name: '微信公众号B',
            configured: wechatBConfigured,
            appId: wechatBConfigured ? wechatBAppId : 'not_configured',
            hasSecret: !!wechatBSecret,
          },
        ],
      },
      security: {
        jwtConfigured: !!jwtSecret,
        environment: nodeEnv || 'development',
      },
      environment: {
        nodeEnv: nodeEnv || 'development',
        timestamp: new Date().toISOString(),
      },
    };

    // 计算总体配置状态
    const totalConfigurations = 3; // GitHub, 微信, JWT
    let configuredCount = 0;

    if (githubConfigured) configuredCount++;
    if (wechatConfiguredAccounts > 0) configuredCount++;
    if (jwtSecret) configuredCount++;

    const configurationScore = Math.round((configuredCount / totalConfigurations) * 100);

    return NextResponse.json({
      success: true,
      data: {
        ...configStatus,
        summary: {
          totalConfigurations,
          configuredCount,
          configurationScore,
          allConfigured: configuredCount === totalConfigurations,
          criticalMissing: !githubConfigured || !jwtSecret,
        },
      },
      message: configuredCount === totalConfigurations 
        ? '所有配置已完成' 
        : `${configuredCount}/${totalConfigurations} 项配置已完成`,
    });

  } catch (error) {
    console.error('获取配置状态失败:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: '获取配置状态失败',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
