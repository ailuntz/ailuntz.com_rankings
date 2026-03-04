import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // GitHub Token
  githubToken: process.env.GITHUB_TOKEN || '',

  // 排名限制（默认200，可通过环境变量覆盖）
  maxRank: parseInt(process.env.MAX_RANK || '200', 10),

  // 每页数据量（动态收敛，减少无效请求）
  perPage: Math.max(1, Math.min(100, parseInt(process.env.MAX_RANK || '200', 10) * 2)),

  // API 查询条件（优化版，根据实际测试调整）
  // 根据 2024 年数据分析：
  // - Top 200 仓库：最低 67,133 stars → 设置 60,000
  // - Top 200 全球用户：最低约 10,000 followers → 设置 8,000
  // - Top 200 中国用户：最低约 3,000 followers → 设置 2,000
  // - Top 200 组织：最低约 4,000 followers → 设置 3,000
  minStars: 60000,
  minFollowers: {
    global: 8000,    // 全球用户
    china: 2000,     // 中国用户（更低的阈值）
    org: 3000,       // 组织（中等阈值）
  },

  // 数据输出目录
  dataDir: './data',
};

if (!config.githubToken) {
  console.warn('⚠️  警告: 未设置 GITHUB_TOKEN，API 请求可能受限');
  console.warn('   请在 .env 文件中设置 GITHUB_TOKEN');
}
