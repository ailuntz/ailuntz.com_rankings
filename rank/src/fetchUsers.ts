import { request } from '@octokit/request';
import { config } from './config.js';
import { saveJSON, sleep, printRateLimit } from './utils.js';
import type { UserData } from './types.js';

// 获取用户详细信息
async function getUserDetails(username: string, headers: { authorization?: string }): Promise<any> {
  try {
    const response = await request('GET /users/{username}', {
      headers,
      username,
    });
    return response.data;
  } catch (error) {
    console.error(`   ⚠️  获取 ${username} 详细信息失败`);
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
    for (let page = 1; page <= pagesNeeded; page++) {
      console.log(`📄 正在获取第 ${page}/${pagesNeeded} 页...`);

      // 构建查询字符串
      let query = '';
      if (userType === 'org') {
        // 组织查询
        query = `followers:>${config.minFollowers.org}+type:org`;
        if (country) {
          query += `+location:${country}`;
        }
      } else {
        // 用户查询
        const minFollowers = country === 'China' ? config.minFollowers.china : config.minFollowers.global;
        query = `followers:>${minFollowers}`;
        if (country) {
          query += `+location:${country}`;
        }
      }

      const response = await request('GET /search/users', {
        headers,
        q: query,
        page,
        per_page: config.perPage,
        sort: 'followers',
        order: 'desc',
      });

      if (response.data && response.data.items) {
        console.log(`   ✓ 获取 ${response.data.items.length} 条搜索结果`);
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

    // 去重
    const uniqueUsers = Array.from(
      new Map(users.map(user => [user.login, user])).values()
    );

    // 添加排名并限制为前 200
    const rankedUsers = uniqueUsers
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
    console.error('❌ 获取数据失败:', error);
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
