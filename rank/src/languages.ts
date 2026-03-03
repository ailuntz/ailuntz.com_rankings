// GitHub 常用编程语言列表
export interface Language {
  code: string; // URL 参数值
  name: string; // 显示名称
}

export const languages: Language[] = [
  { code: '', name: '全部语言' }, // 空字符串表示全部
  { code: 'javascript', name: 'JavaScript' },
  { code: 'typescript', name: 'TypeScript' },
  { code: 'python', name: 'Python' },
  { code: 'java', name: 'Java' },
  { code: 'go', name: 'Go' },
  { code: 'rust', name: 'Rust' },
  { code: 'c++', name: 'C++' },
  { code: 'c', name: 'C' },
  { code: 'c%23', name: 'C#' }, // URL编码
  { code: 'php', name: 'PHP' },
  { code: 'ruby', name: 'Ruby' },
  { code: 'swift', name: 'Swift' },
  { code: 'kotlin', name: 'Kotlin' },
  { code: 'dart', name: 'Dart' },
  { code: 'vue', name: 'Vue' },
  { code: 'shell', name: 'Shell' },
  { code: 'html', name: 'HTML' },
  { code: 'css', name: 'CSS' },
  { code: 'scala', name: 'Scala' },
  { code: 'r', name: 'R' },
  { code: 'jupyter-notebook', name: 'Jupyter Notebook' },
];

export function getLanguageDisplay(code: string): string {
  const lang = languages.find(l => l.code === code);
  return lang ? lang.name : '全部语言';
}
