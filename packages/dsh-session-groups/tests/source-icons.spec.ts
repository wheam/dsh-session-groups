import { describe, expect, it } from 'vitest'
import { resolveSourceIconKey } from '../src/client/source-icon-key.js'

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

  it('falls back for unknown and empty providers', () => {
    expect(resolveSourceIconKey('custom-provider')).toBeUndefined()
    expect(resolveSourceIconKey('')).toBeUndefined()
  })
})
