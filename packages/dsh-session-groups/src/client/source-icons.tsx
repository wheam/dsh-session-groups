/** Provider-aware group icons with a folder fallback for native and unknown sources. */
import claudeSvg from 'simple-icons/icons/claude.svg'
import codeiumSvg from 'simple-icons/icons/codeium.svg'
import discordSvg from 'simple-icons/icons/discord.svg'
import facebookSvg from 'simple-icons/icons/facebook.svg'
import gmailSvg from 'simple-icons/icons/gmail.svg'
import googleChatSvg from 'simple-icons/icons/googlechat.svg'
import googleGeminiSvg from 'simple-icons/icons/googlegemini.svg'
import githubCopilotSvg from 'simple-icons/icons/githubcopilot.svg'
import imessageSvg from 'simple-icons/icons/imessage.svg'
import instagramSvg from 'simple-icons/icons/instagram.svg'
import kakaoTalkSvg from 'simple-icons/icons/kakaotalk.svg'
import lineSvg from 'simple-icons/icons/line.svg'
import mastodonSvg from 'simple-icons/icons/mastodon.svg'
import matrixSvg from 'simple-icons/icons/matrix.svg'
import mattermostSvg from 'simple-icons/icons/mattermost.svg'
import messengerSvg from 'simple-icons/icons/messenger.svg'
import openAiSvg from 'simple-icons/icons/openai.svg'
import redditSvg from 'simple-icons/icons/reddit.svg'
import replitSvg from 'simple-icons/icons/replit.svg'
import rocketChatSvg from 'simple-icons/icons/rocketdotchat.svg'
import signalSvg from 'simple-icons/icons/signal.svg'
import slackSvg from 'simple-icons/icons/slack.svg'
import telegramSvg from 'simple-icons/icons/telegram.svg'
import tencentQqSvg from 'simple-icons/icons/tencentqq.svg'
import viberSvg from 'simple-icons/icons/viber.svg'
import wechatSvg from 'simple-icons/icons/wechat.svg'
import whatsappSvg from 'simple-icons/icons/whatsapp.svg'
import xSvg from 'simple-icons/icons/x.svg'
import zedSvg from 'simple-icons/icons/zedindustries.svg'
import zoomSvg from 'simple-icons/icons/zoom.svg'
import zulipSvg from 'simple-icons/icons/zulip.svg'
import { resolveSourceIconKey, type SourceIconKey } from './source-icon-key.js'

type VectorSourceIcon = {
  readonly title: string
  readonly path: string
  readonly hex: string
}

type BitmapSourceIcon = {
  readonly title: string
  readonly dataUri: string
}

type SvgSourceIcon = {
  readonly title: string
  readonly svg: string
  readonly hex: string
}

type BadgeSourceIcon = {
  readonly title: string
  readonly label: string
  readonly hex: string
}

type SourceIcon = VectorSourceIcon | BitmapSourceIcon | SvgSourceIcon | BadgeSourceIcon

// The official Feishu favicon is intentionally embedded so the installed client
// remains self-contained and does not make a network request while rendering.
const FEISHU_ICON = 'data:image/png;base64,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'
const DINGTALK_ICON = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAARGVYSWZNTQAqAAAACAABh2kABAAAAAEAAAAaAAAAAAADoAEAAwAAAAEAAQAAoAIABAAAAAEAAAAQoAMABAAAAAEAAAAQAAAAADRVcfIAAAGSSURBVDgRhVKhcsJAEH0wJyIiTlREICoqKioQCERFRSUSUVGBiEAgKioqEZUVFf0EZAUCURmBiKiIiEAgEAgEIuLEiczQ3ctdSEJmujOb3dy+t/v2ko5+9U9g8/PCOZfWqzmfsSVXQExuTZjYRnYEjjvy+NZAmw/ROtkpSAi+aSF6Gfb6Gt9bhY7+EMUKjsQxI2+ZuDhIfK23uLs/Yv4G9G4khNmXdbkGSQAQ0BmTPpMEs1Bh8i7w7Ao2FnfgyD9nuf1VjnCywawkFdAGH91ycoXMoMDTmL20k8omKrMNGmQGaMEXcWnjMX1uNkVOkC5ayA/RHtGaEXUbPdJVSYEwtOfUoKYxVR5GyxSaCoOBh0BqKJVjd/DoXWO1tHAWx05Wa8AHaZrD9zmzUg2Ec4Ja2Vw1DTJJKzjjnwPEzBzRFWx0ZDfdRHFuMFzk6E0i+L0LUefJVrb5td0KSvh4Wv8i3vCkBtndY22qVWQbdIb94BTFR3taCf+RTYMAYjrVxJIVJqVmX0IwyAC5zBhSWL4Xav8AVgWH30TIo8EAAAAASUVORK5CYII='

const TEAMS_ICON: VectorSourceIcon = {
  title: 'Microsoft Teams',
  hex: '6264A7',
  path: 'M20.625 8.127q-.55 0-1.025-.205-.475-.205-.832-.563-.358-.357-.563-.832Q18 6.053 18 5.502q0-.54.205-1.02t.563-.837q.357-.358.832-.563.474-.205 1.025-.205.54 0 1.02.205t.837.563q.358.357.563.837.205.48.205 1.02 0 .55-.205 1.025-.205.475-.563.832-.357.358-.837.563-.48.205-1.02.205zm0-3.75q-.469 0-.797.328-.328.328-.328.797 0 .469.328.797.328.328.797.328.469 0 .797-.328.328-.328.328-.797 0-.469-.328-.797-.328-.328-.797-.328zM24 10.002v5.578q0 .774-.293 1.46-.293.685-.803 1.194-.51.51-1.195.803-.686.293-1.459.293-.445 0-.908-.105-.463-.106-.85-.329-.293.95-.855 1.729-.563.78-1.319 1.336-.756.557-1.67.861-.914.305-1.898.305-1.148 0-2.162-.398-1.014-.399-1.805-1.102-.79-.703-1.312-1.664t-.674-2.086h-5.8q-.411 0-.704-.293T0 16.881V6.873q0-.41.293-.703t.703-.293h8.59q-.34-.715-.34-1.5 0-.727.275-1.365.276-.639.75-1.114.475-.474 1.114-.75.638-.275 1.365-.275t1.365.275q.639.276 1.114.75.474.475.75 1.114.275.638.275 1.365t-.275 1.365q-.276.639-.75 1.113-.475.475-1.114.75-.638.276-1.365.276-.188 0-.375-.024-.188-.023-.375-.058v1.078h10.875q.469 0 .797.328.328.328.328.797zM12.75 2.373q-.41 0-.78.158-.368.158-.638.434-.27.275-.428.639-.158.363-.158.773 0 .41.158.78.159.368.428.638.27.27.639.428.369.158.779.158.41 0 .773-.158.364-.159.64-.428.274-.27.433-.639.158-.369.158-.779 0-.41-.158-.773-.159-.364-.434-.64-.275-.275-.639-.433-.363-.158-.773-.158zM6.937 9.814h2.25V7.94H2.814v1.875h2.25v6h1.875zm10.313 7.313v-6.75H12v6.504q0 .41-.293.703t-.703.293H8.309q.152.809.556 1.5.405.691.985 1.19.58.497 1.318.779.738.281 1.582.281.926 0 1.746-.352.82-.351 1.436-.966.615-.616.966-1.43.352-.815.352-1.752zm5.25-1.547v-5.203h-3.75v6.855q.305.305.691.452.387.146.809.146.469 0 .879-.176.41-.175.715-.48.304-.305.48-.715t.176-.879Z',
}

const SOURCE_ICONS = {
  aider: { title: 'Aider', label: 'A', hex: '3A4856' },
  amazonq: { title: 'Amazon Q Developer', label: 'Q', hex: 'FF9900' },
  claudecode: { title: 'Claude Code', svg: claudeSvg, hex: 'D97757' },
  cline: { title: 'Cline', label: 'CL', hex: '6C5CE7' },
  codeium: { title: 'Codeium', svg: codeiumSvg, hex: '09B6A2' },
  codex: { title: 'Codex', svg: openAiSvg, hex: '412991' },
  continue: { title: 'Continue', label: 'CT', hex: '242424' },
  cody: { title: 'Sourcegraph Cody', label: 'C', hex: 'A112FF' },
  cursor: { title: 'Cursor', label: 'C', hex: '171717' },
  dingtalk: { title: '钉钉', dataUri: DINGTALK_ICON },
  discord: { title: 'Discord', svg: discordSvg, hex: '5865F2' },
  facebook: { title: 'Facebook', svg: facebookSvg, hex: '0866FF' },
  feishu: { title: '飞书 / Lark', dataUri: FEISHU_ICON },
  geminicli: { title: 'Gemini CLI', svg: googleGeminiSvg, hex: '8E75B2' },
  gmail: { title: 'Gmail', svg: gmailSvg, hex: 'EA4335' },
  githubcopilot: { title: 'GitHub Copilot', svg: githubCopilotSvg, hex: '000000' },
  googlechat: { title: 'Google Chat', svg: googleChatSvg, hex: '34A853' },
  imessage: { title: 'iMessage', svg: imessageSvg, hex: '34DA50' },
  instagram: { title: 'Instagram', svg: instagramSvg, hex: 'FF0069' },
  kakaotalk: { title: 'KakaoTalk', svg: kakaoTalkSvg, hex: 'FFCD00' },
  kimicode: { title: 'Kimi Code', label: 'K', hex: '1677FF' },
  line: { title: 'LINE', svg: lineSvg, hex: '00C300' },
  mastodon: { title: 'Mastodon', svg: mastodonSvg, hex: '6364FF' },
  matrix: { title: 'Matrix', svg: matrixSvg, hex: '000000' },
  mattermost: { title: 'Mattermost', svg: mattermostSvg, hex: '0058CC' },
  messenger: { title: 'Messenger', svg: messengerSvg, hex: '00B2FF' },
  opencode: { title: 'OpenCode', label: 'OC', hex: '111111' },
  qq: { title: 'Tencent QQ', svg: tencentQqSvg, hex: '1EBAFC' },
  reddit: { title: 'Reddit', svg: redditSvg, hex: 'FF4500' },
  replitagent: { title: 'Replit Agent', svg: replitSvg, hex: 'F26207' },
  rocketchat: { title: 'Rocket.Chat', svg: rocketChatSvg, hex: 'F5455C' },
  roocode: { title: 'Roo Code', label: 'R', hex: '00A6A6' },
  signal: { title: 'Signal', svg: signalSvg, hex: '3B45FD' },
  slack: { title: 'Slack', svg: slackSvg, hex: '4A154B' },
  tabnine: { title: 'Tabnine', label: '9', hex: '7B42BC' },
  teams: TEAMS_ICON,
  telegram: { title: 'Telegram', svg: telegramSvg, hex: '26A5E4' },
  viber: { title: 'Viber', svg: viberSvg, hex: '7360F2' },
  wechat: { title: 'WeChat', svg: wechatSvg, hex: '07C160' },
  whatsapp: { title: 'WhatsApp', svg: whatsappSvg, hex: '25D366' },
  windsurf: { title: 'Windsurf', svg: codeiumSvg, hex: '09B6A2' },
  x: { title: 'X', svg: xSvg, hex: '000000' },
  zed: { title: 'Zed Agent', svg: zedSvg, hex: '084CCF' },
  zoom: { title: 'Zoom', svg: zoomSvg, hex: '0B5CFF' },
  zulip: { title: 'Zulip', svg: zulipSvg, hex: '6492FE' },
} satisfies Record<string, SourceIcon>

/** A lighter, stroke-based folder that stays legible at sidebar size. */
function FolderGroupIcon({ folded }: { folded: boolean }) {
  return folded ? (
    <svg className="sg_folderIcon" viewBox="0 0 20 20" fill="none" focusable="false">
      <path
        d="M2.75 6.25v-.6a2.15 2.15 0 0 1 2.15-2.15h2.34c.54 0 1.06.22 1.44.6l1.18 1.18c.28.28.66.44 1.06.44h4.18a2.15 2.15 0 0 1 2.15 2.15v6.48a2.15 2.15 0 0 1-2.15 2.15H4.9a2.15 2.15 0 0 1-2.15-2.15v-8.1Z"
        stroke="currentColor"
        strokeWidth="1.45"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ) : (
    <svg className="sg_folderIcon" viewBox="0 0 20 20" fill="none" focusable="false">
      <path
        d="M2.75 9.1V5.65A2.15 2.15 0 0 1 4.9 3.5h2.34c.54 0 1.06.22 1.44.6l1.18 1.18c.28.28.66.44 1.06.44h4.18a2.15 2.15 0 0 1 2.15 2.15v.27"
        stroke="currentColor"
        strokeWidth="1.45"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5.72 8.14h11.05a1.55 1.55 0 0 1 1.43 2.15l-2.06 4.95a2.05 2.05 0 0 1-1.89 1.26H3.78a1.55 1.55 0 0 1-1.43-2.15L4.3 9.4a1.55 1.55 0 0 1 1.43-1.26Z"
        stroke="currentColor"
        strokeWidth="1.45"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** Render a stable brand mark when known; preserve the current open/closed folder otherwise. */
export function SessionGroupIcon({ source, folded }: { source?: string, folded: boolean }) {
  const key = source === undefined ? undefined : resolveSourceIconKey(source)
  if (key === undefined) return <FolderGroupIcon folded={folded} />

  const icon = SOURCE_ICONS[key]
  if ('dataUri' in icon) {
    return <img className="sg_brandIcon" src={icon.dataUri} alt="" title={icon.title} />
  }
  if ('label' in icon) {
    return (
      <span
        className="sg_brandIcon"
        title={icon.title}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 4,
          background: `#${icon.hex}`,
          color: '#fff',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          fontSize: icon.label.length > 1 ? 7 : 9,
          fontWeight: 700,
          lineHeight: 1,
        }}
      >{icon.label}</span>
    )
  }
  const color = icon.hex === '000000' || icon.hex === '4A154B'
    ? 'var(--dsw-alias-label-secondary)'
    : `#${icon.hex}`
  if ('svg' in icon) {
    return <span className="sg_brandIcon" title={icon.title} style={{ color }} dangerouslySetInnerHTML={{ __html: icon.svg }} />
  }
  return (
    <svg className="sg_brandIcon" role="img" viewBox="0 0 24 24" style={{ color }}>
      <title>{icon.title}</title>
      <path fill="currentColor" d={icon.path} />
    </svg>
  )
}
