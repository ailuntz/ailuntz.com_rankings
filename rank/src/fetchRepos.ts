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

function matchOwnerType(rawData: any, ownerType: OwnerType): boolean {
  if (ownerType === 'all') return true;
  const ownerTypeFromApi = rawData?.owner?.type;
  if (ownerType === 'user') return ownerTypeFromApi === 'User';
  if (ownerType === 'org') return ownerTypeFromApi === 'Organization';
  return true;
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
  const maxPages = 10; // Search API 最多可翻到约 1000 条结果（每页 100）

  try {
    for (let page = 1; page <= maxPages && repos.length < config.maxRank; page++) {
      console.log(`📄 正在获取第 ${page} 页...`);

      const response = await request('GET /search/repositories', {
        headers,
        q: `stars:>${config.minStars}`,
        page,
        per_page: config.perPage,
        sort: 'stars',
        order: 'desc',
      });

      if (response.data && response.data.items) {
        const filteredItems = response.data.items.filter(item => matchOwnerType(item, ownerType));
        const items = filteredItems.map(extractRepoData);
        repos.push(...items);
        console.log(`   ✓ 本页原始 ${response.data.items.length} 条，过滤后 ${items.length} 条，累计 ${repos.length} 条`);
        printRateLimit(response.headers as any);

        // 当前页已经没有结果时提前结束
        if (response.data.items.length === 0) {
          break;
        }
      }

      if (page < maxPages && repos.length < config.maxRank) {
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
