import fetch from 'node-fetch';
import { load } from 'cheerio';
import { saveJSON } from './utils.js';
import { config } from './config.js';
import { getLanguageDisplay } from './languages.js';
import type { TrendingData } from './types.js';

type TimeRange = 'daily' | 'weekly' | 'monthly';

interface FetchTrendingOptions {
  timeRange?: TimeRange;
  language?: string; // 编程语言，空字符串表示全部
}

async function fetchTrending(options: FetchTrendingOptions = {}) {
  const { timeRange = 'daily', language = '' } = options;

  const langLabel = getLanguageDisplay(language);
  console.log(`🚀 开始获取 ${langLabel} ${timeRange} 趋势数据...\n`);

  // 构建 URL
  let apiUrl = 'https://github.com/trending';
  if (language) {
    apiUrl += `/${language}`;
  }
  apiUrl += `?since=${timeRange}`;

  try {
    const response = await fetch(apiUrl);
    const arrayBuffer = await response.arrayBuffer();
    const html = new TextDecoder('utf-8').decode(arrayBuffer);
    const $ = load(html);

    const trendingData: TrendingData[] = [];

    $('.Box-row').each((idx, item) => {
      // 限制为前 200 条
      if (idx >= config.maxRank) {
        return false; // 停止遍历
      }

      const fullName = $(item).find('h2 a').text().replace(/(\n|\s)/g, '');
      const href = $(item).find('h2 a').attr('href')?.replace(/(\n|\s)/g, '');
      const language = $(item).find('span[itemprop=programmingLanguage]').text().replace(/(\n|\s)/g, '') || '';
      const languageColor = $(item).find('span.repo-language-color');
      const todayStar = $(item).find('span.float-sm-right').text().replace(/(\n|,)/g, '').trim();
      const description = $(item).find('p.color-fg-muted').text().replace(/(\n)/g, '').trim();

      if (!fullName || !href || !todayStar) {
        return; // 跳过无效数据
      }

      let color = '';
      if (language && languageColor && languageColor.css) {
        color = languageColor.css('background-color') || '';
      }

      let stargazersCount = 0;
      const starNode = $(item).find('svg[aria-label="star"].octicon.octicon-star');
      if (starNode && starNode[0] && starNode[0].next) {
        const nextNode = starNode[0].next as any;
        const starText = nextNode?.data?.replace(/(\n|\s|,)/g, '') || '0';
        stargazersCount = parseInt(starText, 10) || 0;
      }

      let forked = '-';
      const forkNode = $(item).find('svg[aria-label="fork"].octicon.octicon-repo-forked');
      if (forkNode && forkNode[0] && forkNode[0].next) {
        const nextNode = forkNode[0].next as any;
        forked = nextNode?.data?.replace(/(\n|\s|,)/g, '') || '-';
      }

      trendingData.push({
        rank: idx + 1,
        full_name: fullName,
        language,
        color,
        description,
        forked,
        stargazers_count: stargazersCount,
        todayStar,
        html_url: new URL(href, apiUrl).toString(),
      });
    });

    // 根据语言和时间范围生成文件名
    let filename = `trending-${timeRange}`;
    if (language) {
      // 将语言代码转换为安全的文件名（移除特殊字符）
      const safeLang = language.replace(/%23/g, 'sharp').replace(/[^a-z0-9-]/gi, '-');
      filename += `-${safeLang}`;
    }
    filename += '.json';

    await saveJSON(filename, trendingData);
    console.log(`✨ 完成！共获取 ${trendingData.length} 条 ${langLabel} 趋势数据\n`);

  } catch (error) {
    console.error('❌ 获取数据失败:', error);
    throw error;
  }
}

// 解析命令行参数
function parseArgs(): FetchTrendingOptions {
  const args = process.argv.slice(2);
  const options: FetchTrendingOptions = {
    timeRange: 'daily',
    language: '',
  };

  // 解析时间范围（第一个参数）
  if (args[0] && ['daily', 'weekly', 'monthly'].includes(args[0])) {
    options.timeRange = args[0] as TimeRange;
  }

  // 解析语言参数
  const langIndex = args.findIndex(arg => arg === '--lang' || arg === '--language');
  if (langIndex !== -1 && args[langIndex + 1]) {
    options.language = args[langIndex + 1];
  }

  return options;
}

// 执行
const options = parseArgs();
fetchTrending(options);
