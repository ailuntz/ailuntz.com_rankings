// GitHub 常用编程语言列表
export interface Language {
  code: string; // 用于文件名
  name: string; // 显示名称
  icon: string; // 图标/emoji
}

export const languages: Language[] = [
  { code: 'all', name: '全部语言', icon: '🌐' },
  { code: 'javascript', name: 'JavaScript', icon: '🟨' },
  { code: 'typescript', name: 'TypeScript', icon: '🔷' },
  { code: 'python', name: 'Python', icon: '🐍' },
  { code: 'java', name: 'Java', icon: '☕' },
  { code: 'go', name: 'Go', icon: '🐹' },
  { code: 'rust', name: 'Rust', icon: '🦀' },
  { code: 'c++', name: 'C++', icon: '⚙️' },
  { code: 'c', name: 'C', icon: '🔧' },
  { code: 'c%23', name: 'C#', icon: '💜' },
  { code: 'php', name: 'PHP', icon: '🐘' },
  { code: 'ruby', name: 'Ruby', icon: '💎' },
  { code: 'swift', name: 'Swift', icon: '🍎' },
  { code: 'kotlin', name: 'Kotlin', icon: '🟣' },
  { code: 'dart', name: 'Dart', icon: '🎯' },
  { code: 'vue', name: 'Vue', icon: '💚' },
  { code: 'shell', name: 'Shell', icon: '🐚' },
  { code: 'html', name: 'HTML', icon: '📄' },
  { code: 'css', name: 'CSS', icon: '🎨' },
  { code: 'scala', name: 'Scala', icon: '🔴' },
  { code: 'r', name: 'R', icon: '📊' },
  { code: 'jupyter-notebook', name: 'Jupyter', icon: '📓' },
];

// 将语言代码转换为文件名格式
export function getTrendingFilename(timeRange: string, languageCode: string): string {
  let filename = `trending-${timeRange}`;
  if (languageCode && languageCode !== 'all') {
    // C# 的特殊处理
    const safeLang = languageCode.replace(/%23/g, 'sharp').replace(/[^a-z0-9-]/gi, '-');
    filename += `-${safeLang}`;
  }
  return `${filename}.json`;
}
