/** Icon identities understood by the sidebar, independent of their rendering assets. */
export type SourceIconKey = 'dingtalk' | 'discord' | 'facebook' | 'feishu' | 'gmail' | 'googlechat' | 'imessage' | 'instagram' | 'kakaotalk' | 'line' | 'mastodon' | 'matrix' | 'mattermost' | 'messenger' | 'qq' | 'reddit' | 'rocketchat' | 'signal' | 'slack' | 'teams' | 'telegram' | 'viber' | 'wechat' | 'whatsapp' | 'x' | 'zoom' | 'zulip';
/** Resolve provider namespaces and common bridge/plugin suffixes to a known icon. */
export declare function resolveSourceIconKey(source: string): SourceIconKey | undefined;
