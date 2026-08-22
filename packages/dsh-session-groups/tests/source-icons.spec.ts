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

  it('keeps an unknown provider readable and stable', () => {
    expect(resolveSourceFamily('Acme Chat')).toEqual({ key: 'acme-chat', title: 'Acme Chat', iconSource: 'Acme Chat' })
  })
})
