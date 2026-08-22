/** Icon identities understood by the sidebar, independent of their rendering assets. */
export type SourceIconKey =
  | 'aider'
  | 'amazonq'
  | 'claudecode'
  | 'cline'
  | 'codeium'
  | 'codex'
  | 'continue'
  | 'cody'
  | 'cursor'
  | 'dingtalk'
  | 'discord'
  | 'facebook'
  | 'feishu'
  | 'geminicli'
  | 'gmail'
  | 'githubcopilot'
  | 'googlechat'
  | 'imessage'
  | 'instagram'
  | 'kakaotalk'
  | 'kimicode'
  | 'line'
  | 'mastodon'
  | 'matrix'
  | 'mattermost'
  | 'messenger'
  | 'opencode'
  | 'qq'
  | 'reddit'
  | 'replitagent'
  | 'rocketchat'
  | 'roocode'
  | 'signal'
  | 'slack'
  | 'tabnine'
  | 'teams'
  | 'telegram'
  | 'viber'
  | 'wechat'
  | 'whatsapp'
  | 'windsurf'
  | 'x'
  | 'zed'
  | 'zoom'
  | 'zulip'

const SOURCE_ALIASES: ReadonlyArray<readonly [SourceIconKey, readonly string[]]> = [
  ['claudecode', ['claude-code', 'claudecode', 'claude-cli', 'claude-agent', 'claude']],
  ['codex', ['codex', 'codex-cli', 'openai-codex', 'codex-app']],
  ['cursor', ['cursor', 'cursor-agent', 'cursor-cli']],
  ['githubcopilot', ['github-copilot', 'githubcopilot', 'copilot-cli', 'copilot-agent', 'copilot']],
  ['geminicli', ['gemini-cli', 'google-gemini-cli', 'gemini-agent', 'gemini']],
  ['opencode', ['opencode', 'open-code', 'opencode-cli']],
  ['windsurf', ['windsurf', 'windsurf-agent']],
  ['codeium', ['codeium', 'codeium-agent']],
  ['roocode', ['roo-code', 'roocode', 'roo-cline']],
  ['cline', ['cline', 'cline-agent']],
  ['continue', ['continue-dev', 'continue-agent', 'continue']],
  ['aider', ['aider', 'aider-chat']],
  ['kimicode', ['kimi-code', 'kimicode', 'kimi-cli', 'kimi-agent']],
  ['replitagent', ['replit-agent', 'replitagent', 'replit']],
  ['amazonq', ['amazon-q-developer', 'amazon-q', 'amazonq', 'q-developer']],
  ['tabnine', ['tabnine', 'tabnine-agent']],
  ['cody', ['sourcegraph-cody', 'cody-agent', 'cody']],
  ['zed', ['zed-agent', 'zed-ai', 'zed']],
  ['feishu', ['feishu', 'lark', 'larksuite', 'lark-suite', '飞书']],
  ['slack', ['slack']],
  ['teams', ['teams', 'msteams', 'ms-teams', 'microsoftteams', 'microsoft-teams']],
  ['dingtalk', ['dingtalk', 'ding-talk', 'dingding', '钉钉']],
  ['telegram', ['telegram', 'tg']],
  ['discord', ['discord']],
  ['wechat', ['wechat', 'we-chat', 'weixin', '微信']],
  ['whatsapp', ['whatsapp', 'whats-app']],
  ['googlechat', ['googlechat', 'google-chat', 'gchat']],
  ['mattermost', ['mattermost']],
  ['matrix', ['matrix']],
  ['signal', ['signal']],
  ['line', ['line', 'line-chat']],
  ['messenger', ['messenger', 'facebook-messenger', 'fb-messenger']],
  ['imessage', ['imessage', 'i-message']],
  ['kakaotalk', ['kakaotalk', 'kakao-talk']],
  ['viber', ['viber']],
  ['rocketchat', ['rocketchat', 'rocket-chat']],
  ['zulip', ['zulip']],
  ['qq', ['qq', 'tencent-qq']],
  ['gmail', ['gmail']],
  ['zoom', ['zoom', 'zoom-chat']],
  ['facebook', ['facebook', 'fb']],
  ['instagram', ['instagram']],
  ['reddit', ['reddit']],
  ['mastodon', ['mastodon']],
  ['x', ['x', 'twitter']],
]

export function normalizeSource(source: string): string {
  return source.trim().toLocaleLowerCase().replace(/[\s_./:]+/g, '-').replace(/-+/g, '-')
}

/** Resolve provider namespaces and common bridge/plugin suffixes to a known icon. */
export function resolveSourceIconKey(source: string): SourceIconKey | undefined {
  const normalized = normalizeSource(source)
  for (const [key, aliases] of SOURCE_ALIASES) {
    for (const alias of aliases) {
      if (normalized === alias
        || normalized.startsWith(`${alias}-`)
        || normalized.endsWith(`-${alias}`)
        || normalized.includes(`-${alias}-`)) return key
    }
  }
  return undefined
}

const SOURCE_TITLES: Readonly<Record<SourceIconKey, string>> = {
  aider: 'Aider',
  amazonq: 'Amazon Q Developer',
  claudecode: 'Claude Code',
  cline: 'Cline',
  codeium: 'Codeium',
  codex: 'Codex',
  continue: 'Continue',
  cody: 'Sourcegraph Cody',
  cursor: 'Cursor',
  dingtalk: '钉钉',
  discord: 'Discord',
  facebook: 'Facebook',
  feishu: '飞书 / Lark',
  geminicli: 'Gemini CLI',
  gmail: 'Gmail',
  githubcopilot: 'GitHub Copilot',
  googlechat: 'Google Chat',
  imessage: 'iMessage',
  instagram: 'Instagram',
  kakaotalk: 'KakaoTalk',
  kimicode: 'Kimi Code',
  line: 'LINE',
  mastodon: 'Mastodon',
  matrix: 'Matrix',
  mattermost: 'Mattermost',
  messenger: 'Messenger',
  opencode: 'OpenCode',
  qq: 'Tencent QQ',
  reddit: 'Reddit',
  replitagent: 'Replit Agent',
  rocketchat: 'Rocket.Chat',
  roocode: 'Roo Code',
  signal: 'Signal',
  slack: 'Slack',
  tabnine: 'Tabnine',
  teams: 'Microsoft Teams',
  telegram: 'Telegram',
  viber: 'Viber',
  wechat: '微信',
  whatsapp: 'WhatsApp',
  windsurf: 'Windsurf',
  x: 'X',
  zed: 'Zed Agent',
  zoom: 'Zoom',
  zulip: 'Zulip',
}

export interface SourceFamily {
  readonly key: string
  readonly title: string
  readonly iconSource: string
}

/** Collapse known aliases for browsing without changing the provider's stored source identity. */
export function resolveSourceFamily(source: string): SourceFamily {
  const iconKey = resolveSourceIconKey(source)
  if (iconKey !== undefined) return { key: iconKey, title: SOURCE_TITLES[iconKey], iconSource: iconKey }
  const normalized = normalizeSource(source)
  return {
    key: normalized === '' ? 'unknown' : normalized,
    title: source.trim() === '' ? '未知来源' : source.trim(),
    iconSource: source,
  }
}
