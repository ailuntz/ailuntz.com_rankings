import { request } from '@octokit/request';
import { config } from './config.js';
import { saveJSON, sleep, printRateLimit } from './utils.js';
import type { RepoData } from './types.js';

// 从 GitHub API 响应提取精简数据
function extractRepoData(rawData: any): Omit<RepoData, 'rank'> {
  return {
    full_name: rawData.full_name,
    html_url: rawData.html_url,
    description: rawData.description,
    stargazers_count: rawData.stargazers_count,
    forks_count: rawData.forks_count,
    language: rawData.language,
    owner: {
      login: rawData.owner.login,
      avatar_url: rawData.owner.avatar_url,
    },
    updated_at: rawData.updated_at,
    topics: rawData.topics || [],
  };
}

type OwnerType = 'user' | 'org' | 'all';

interface FetchReposOptions {
  ownerType?: OwnerType;
}

async function fetchRepos(options: FetchReposOptions = {}) {
  const { ownerType = 'all' } = options;

  const typeLabels = {
    all: '全部',
    user: '用户',
    org: '组织',
  };

  console.log(`🚀 开始获取${typeLabels[ownerType]}仓库排名数据...\n`);

  const headers: { authorization?: string } = {};
  if (config.githubToken) {
    headers.authorization = `token ${config.githubToken}`;
  }

  const repos: Omit<RepoData, 'rank'>[] = [];
  const pagesNeeded = Math.ceil(config.maxRank / config.perPage);

  try {
    for (let page = 1; page <= pagesNeeded; page++) {
      console.log(`📄 正在获取第 ${page}/${pagesNeeded} 页...`);

      // 构建查询字符串
      let query = `stars:>${config.minStars}`;
      if (ownerType === 'user') {
        query += '+user:*'; // 只搜索用户仓库
      } else if (ownerType === 'org') {
        query += '+org:*'; // 只搜索组织仓库
      }

      const response = await request('GET /search/repositories', {
        headers,
        q: query,
        page,
        per_page: config.perPage,
        sort: 'stars',
        order: 'desc',
      });

      if (response.data && response.data.items) {
        const items = response.data.items.map(extractRepoData);
        repos.push(...items);
        console.log(`   ✓ 获取 ${items.length} 条数据`);
        printRateLimit(response.headers as any);
      }

      if (page < pagesNeeded) {
        console.log('   ⏳ 等待 1 秒...\n');
        await sleep(1000);
      }
    }

    // 添加排名并限制为前 200
    const rankedRepos = repos
      .slice(0, config.maxRank)
      .map((repo, index) => ({
        ...repo,
        rank: index + 1,
      }));

    // 根据类型生成文件名
    let filename = 'repos.json'; // 默认全部
    if (ownerType === 'user') {
      filename = 'repos-user.json';
    } else if (ownerType === 'org') {
      filename = 'repos-org.json';
    }

    await saveJSON(filename, rankedRepos);
    console.log(`\n✨ 完成！共获取 ${rankedRepos.length} 个${typeLabels[ownerType]}仓库数据\n`);

  } catch (error) {
    console.error('❌ 获取数据失败:', error);
    throw error;
  }
}

// 解析命令行参数
function parseArgs(): FetchReposOptions {
  const args = process.argv.slice(2);
  const options: FetchReposOptions = {};

  if (args.includes('--user')) {
    options.ownerType = 'user';
  } else if (args.includes('--org')) {
    options.ownerType = 'org';
  } else {
    options.ownerType = 'all';
  }

  return options;
}

// 执行
const options = parseArgs();
fetchRepos(options);
