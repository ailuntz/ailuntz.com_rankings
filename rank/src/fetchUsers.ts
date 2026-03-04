import { request } from '@octokit/request';
import { config } from './config.js';
import { saveJSON, sleep, printRateLimit } from './utils.js';
import type { UserData } from './types.js';

function shouldRetry(status?: number): boolean {
  return status === 502 || status === 503 || status === 504 || status === 429;
}

function formatError(error: any): string {
  const status = error?.status ? `status=${error.status}` : '';
  const message = error?.message || String(error);
  return [status, message].filter(Boolean).join(' ');
}

async function requestWithRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  let attempt = 0;
  let lastError: any;

  while (attempt <= maxRetries) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const status = error?.status as number | undefined;
      if (!shouldRetry(status) || attempt === maxRetries) {
        break;
      }
      const delayMs = 1000 * (attempt + 1);
      console.warn(`   ⚠️  请求失败，${delayMs}ms 后重试 (${attempt + 1}/${maxRetries})：${formatError(error)}`);
      await sleep(delayMs);
      attempt += 1;
    }
  }

  throw lastError;
}

// 获取用户详细信息
async function getUserDetails(username: string, headers: { authorization?: string }): Promise<any> {
  try {
    const response = await requestWithRetry(() => request('GET /users/{username}', {
      headers,
      username,
    }));
    return response.data;
  } catch (error) {
    console.error(`   ⚠️  获取 ${username} 详细信息失败: ${formatError(error)}`);
    return null;
  }
}

// 从 GitHub API 响应提取精简数据
function extractUserData(rawData: any): Omit<UserData, 'rank'> {
  return {
    login: rawData.login,
    id: rawData.id,
    avatar_url: rawData.avatar_url,
    html_url: rawData.html_url,
    followers: rawData.followers || 0,
    following: rawData.following || 0,
    public_repos: rawData.public_repos || 0,
    created_at: rawData.created_at || '',
  };
}

type UserType = 'user' | 'org';

interface FetchUsersOptions {
  userType?: UserType;
  country?: string; // 国家代码，空字符串表示全球
}

function getLocationTerms(country: string): string[] {
  const aliases: Record<string, string[]> = {
    'United States': ['United States', 'USA', 'US', 'America'],
    'United Kingdom': ['United Kingdom', 'UK', 'England', 'Britain', 'Great Britain'],
    'South Korea': ['South Korea', 'Korea', 'Republic of Korea'],
    Russia: ['Russia', 'Russian Federation'],
    Netherlands: ['Netherlands', 'Holland'],
    Turkey: ['Turkey', 'Turkiye'],
    Brazil: ['Brazil', 'Brasil'],
    Germany: ['Germany', 'Deutschland'],
    Spain: ['Spain', 'Espana'],
    Italy: ['Italy', 'Italia'],
    Japan: ['Japan', 'Nippon'],
    Mexico: ['Mexico', 'México'],
    Indonesia: ['Indonesia', 'ID'],
    Canada: ['Canada', 'CA'],
    France: ['France', 'FR'],
    Australia: ['Australia', 'AU'],
    India: ['India', 'IN'],
    China: ['China', 'PRC', 'CN'],
    Pakistan: ['Pakistan', 'PK'],
    Poland: ['Poland', 'PL'],
  };

  return aliases[country] || [country];
}

async function fetchUsers(options: FetchUsersOptions = {}) {
  const { userType = 'user', country = '' } = options;

  const typeLabel = userType === 'org' ? '组织' : '用户';
  const countryLabel = country ? country : '全球';

  console.log(`🚀 开始获取${countryLabel}${typeLabel}排名数据...\n`);

  const headers: { authorization?: string } = {};
  if (config.githubToken) {
    headers.authorization = `token ${config.githubToken}`;
  }

  const users: Omit<UserData, 'rank'>[] = [];
  const pagesNeeded = Math.ceil(config.maxRank / config.perPage);

  try {
    const locationTerms = country ? getLocationTerms(country) : [''];

    for (const term of locationTerms) {
      if (users.length >= config.maxRank) break;

      for (let page = 1; page <= pagesNeeded; page++) {
        if (users.length >= config.maxRank) break;
        console.log(`📄 正在获取第 ${page}/${pagesNeeded} 页...`);

        // 构建查询字符串（使用空格分隔，避免复杂 OR 表达式兼容问题）
        const queryParts: string[] = [];
        if (userType === 'org') {
          queryParts.push('type:org');
          if (!country) queryParts.push(`followers:>${config.minFollowers.org}`);
        } else {
          queryParts.push('type:user');
          if (!country) queryParts.push(`followers:>${config.minFollowers.global}`);
        }
        if (country && term) {
          queryParts.push(`location:"${term}"`);
        }
        const query = queryParts.join(' ');

        const response = await requestWithRetry(() => request('GET /search/users', {
          headers,
          q: query,
          page,
          per_page: config.perPage,
          sort: 'followers',
          order: 'desc',
        }));
        if (response.data && response.data.items) {
          console.log(`   ✓ 获取 ${response.data.items.length} 条搜索结果${country ? ` (location: ${term})` : ''}`);
          printRateLimit(response.headers as any);

          // 获取每个用户的详细信息
          console.log(`   📊 正在获取详细信息...`);
          for (const item of response.data.items) {
            const details = await getUserDetails(item.login, headers);
            if (details) {
              users.push(extractUserData(details));
            }
            await sleep(50); // 避免触发 API 限制
          }
        }

        if (page < pagesNeeded) {
          console.log('   ⏳ 等待 1 秒...\n');
          await sleep(1000);
        }
      }
    }

    // 去重
    const uniqueUsers = Array.from(
      new Map(users.map(user => [user.login, user])).values()
    );

    // 确保国家榜按 followers 从高到低
    const sortedUsers = uniqueUsers.sort((a, b) => b.followers - a.followers);

    // 添加排名并限制为前 N
    const rankedUsers = sortedUsers
      .slice(0, config.maxRank)
      .map((user, index) => ({
        ...user,
        rank: index + 1,
      }));

    // 根据类型和国家生成文件名
    let filename = '';
    if (userType === 'org') {
      filename = country ? `users-org-${country.toLowerCase().replace(/\s+/g, '-')}.json` : 'users-org.json';
    } else {
      if (country === 'China') {
        filename = 'users-china.json'; // 保持向后兼容
      } else if (country) {
        filename = `users-${country.toLowerCase().replace(/\s+/g, '-')}.json`;
      } else {
        filename = 'users.json'; // 全球用户
      }
    }

    await saveJSON(filename, rankedUsers);
    console.log(`\n✨ 完成！共获取 ${rankedUsers.length} 个${countryLabel}${typeLabel}数据\n`);

  } catch (error) {
    console.error('❌ 获取数据失败:', formatError(error));
    throw error;
  }
}

// 解析命令行参数
function parseArgs(): FetchUsersOptions {
  const args = process.argv.slice(2);
  const options: FetchUsersOptions = {};

  // 检查是否是组织
  if (args.includes('--org')) {
    options.userType = 'org';
  } else {
    options.userType = 'user';
  }

  // 检查国家参数
  const countryIndex = args.findIndex(arg => arg === '--country');
  if (countryIndex !== -1 && args[countryIndex + 1]) {
    options.country = args[countryIndex + 1];
  } else if (args.includes('--china')) {
    // 向后兼容旧的 --china 参数
    options.country = 'China';
  }

  return options;
}

// 执行
const options = parseArgs();
fetchUsers(options);
