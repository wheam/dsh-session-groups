/** Icon identities understood by the sidebar, independent of their rendering assets. */
export type SourceIconKey =
  | 'dingtalk'
  | 'discord'
  | 'facebook'
  | 'feishu'
  | 'gmail'
  | 'googlechat'
  | 'imessage'
  | 'instagram'
  | 'kakaotalk'
  | 'line'
  | 'mastodon'
  | 'matrix'
  | 'mattermost'
  | 'messenger'
  | 'qq'
  | 'reddit'
  | 'rocketchat'
  | 'signal'
  | 'slack'
  | 'teams'
  | 'telegram'
  | 'viber'
  | 'wechat'
  | 'whatsapp'
  | 'x'
  | 'zoom'
  | 'zulip'

const SOURCE_ALIASES: ReadonlyArray<readonly [SourceIconKey, readonly string[]]> = [
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

function normalizeSource(source: string): string {
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
