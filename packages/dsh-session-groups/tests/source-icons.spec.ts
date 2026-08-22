import { describe, expect, it } from 'vitest'
import { resolveSourceFamily, resolveSourceIconKey } from '../src/client/source-icon-key.js'

describe('resolveSourceIconKey', () => {
  it('recognizes provider names and their common aliases', () => {
    expect(resolveSourceIconKey('feishu')).toBe('feishu')
    expect(resolveSourceIconKey('Lark_Suite')).toBe('feishu')
    expect(resolveSourceIconKey('slack')).toBe('slack')
    expect(resolveSourceIconKey('microsoft.teams')).toBe('teams')
    expect(resolveSourceIconKey('weixin')).toBe('wechat')
    expect(resolveSourceIconKey('钉钉')).toBe('dingtalk')
  })

  it('recognizes namespaced bridge and bot sources', () => {
    expect(resolveSourceIconKey('bridge:telegram-bot')).toBe('telegram')
    expect(resolveSourceIconKey('channel/google-chat')).toBe('googlechat')
    expect(resolveSourceIconKey('provider-facebook-messenger')).toBe('messenger')
  })

  it('recognizes common coding agents and CLI aliases', () => {
    expect(resolveSourceIconKey('anthropic-claude-code')).toBe('claudecode')
    expect(resolveSourceIconKey('openai/codex')).toBe('codex')
    expect(resolveSourceIconKey('codex-cli')).toBe('codex')
    expect(resolveSourceIconKey('github_copilot')).toBe('githubcopilot')
    expect(resolveSourceIconKey('google:gemini-cli')).toBe('geminicli')
    expect(resolveSourceIconKey('opencode-cli')).toBe('opencode')
    expect(resolveSourceIconKey('windsurf-agent')).toBe('windsurf')
    expect(resolveSourceIconKey('kimi-code')).toBe('kimicode')
    expect(resolveSourceIconKey('roo-cline')).toBe('roocode')
  })

  it('falls back for unknown and empty providers', () => {
    expect(resolveSourceIconKey('custom-provider')).toBeUndefined()
    expect(resolveSourceIconKey('')).toBeUndefined()
  })
})

describe('resolveSourceFamily', () => {
  it('merges known aliases only at the presentation-family level', () => {
    expect(resolveSourceFamily('feishu')).toEqual({ key: 'feishu', title: '飞书 / Lark', iconSource: 'feishu' })
    expect(resolveSourceFamily('lark-suite')).toEqual({ key: 'feishu', title: '飞书 / Lark', iconSource: 'feishu' })
  })

  it('uses one readable family for each coding agent', () => {
    expect(resolveSourceFamily('openai/codex')).toEqual({ key: 'codex', title: 'Codex', iconSource: 'codex' })
    expect(resolveSourceFamily('anthropic-claude-code')).toEqual({ key: 'claudecode', title: 'Claude Code', iconSource: 'claudecode' })
  })

  it('keeps an unknown provider readable and stable', () => {
    expect(resolveSourceFamily('Acme Chat')).toEqual({ key: 'acme-chat', title: 'Acme Chat', iconSource: 'Acme Chat' })
  })
})
