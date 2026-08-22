/** Icon identities understood by the sidebar, independent of their rendering assets. */
export type SourceIconKey = 'aider' | 'amazonq' | 'claudecode' | 'cline' | 'codeium' | 'codex' | 'continue' | 'cody' | 'cursor' | 'dingtalk' | 'discord' | 'facebook' | 'feishu' | 'geminicli' | 'gmail' | 'githubcopilot' | 'googlechat' | 'imessage' | 'instagram' | 'kakaotalk' | 'kimicode' | 'line' | 'mastodon' | 'matrix' | 'mattermost' | 'messenger' | 'opencode' | 'qq' | 'reddit' | 'replitagent' | 'rocketchat' | 'roocode' | 'signal' | 'slack' | 'tabnine' | 'teams' | 'telegram' | 'viber' | 'wechat' | 'whatsapp' | 'windsurf' | 'x' | 'zed' | 'zoom' | 'zulip';
export declare function normalizeSource(source: string): string;
/** Resolve provider namespaces and common bridge/plugin suffixes to a known icon. */
export declare function resolveSourceIconKey(source: string): SourceIconKey | undefined;
export interface SourceFamily {
    readonly key: string;
    readonly title: string;
    readonly iconSource: string;
}
/** Collapse known aliases for browsing without changing the provider's stored source identity. */
export declare function resolveSourceFamily(source: string): SourceFamily;
