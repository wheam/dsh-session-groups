/** Sidebar styles using only DSH semantic tokens. */
export const styles = `
.sg_root{display:flex;min-height:0;flex:1;flex-direction:column;color:var(--dsw-alias-label-primary)}
.sg_header{box-sizing:border-box;display:flex;height:36px;align-items:center;justify-content:space-between;margin-top:2px;padding:0 8px 0 4px;font-size:14px;line-height:20px}
.sg_iconButton{display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;padding:0;border:0;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer;border-radius:50%}.sg_groupActions button,.sg_sessionActions button{display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;padding:0;border:0;background:transparent;color:var(--dsw-alias-label-tertiary);cursor:pointer;border-radius:4px}
.sg_iconButton:hover,.sg_groupActions button:hover,.sg_sessionActions button:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}
.sg_searchWrap{padding:2px 8px 8px}.sg_search{box-sizing:border-box;width:100%;height:30px;border:1px solid var(--dsw-alias-border-l2);border-radius:10px;background:transparent;color:var(--dsw-alias-label-primary);font:inherit;font-size:13px;line-height:18px;padding:5px 8px}
.sg_status,.sg_error{margin:4px 12px;color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px}.sg_empty{margin:0;padding:12px;color:var(--dsw-alias-label-tertiary);font-size:13px;line-height:20px}.sg_error{color:var(--dsw-alias-state-warn-primary)}
.sg_groups{min-height:0;overflow:auto;padding:0 8px 16px 4px}.sg_group{margin:0}.sg_group+.sg_group{margin-top:8px}.sg_groupHead{position:relative;display:flex;height:34px;align-items:center;gap:2px;border-radius:8px}
.sg_groupToggle{box-sizing:border-box;display:flex;min-width:0;height:34px;flex:1;align-items:center;gap:6px;border:0;background:transparent;color:var(--dsw-alias-label-primary);cursor:pointer;padding:0 8px;border-radius:8px;text-align:left}
.sg_groupToggle:hover{background:var(--dsw-alias-interactive-bg-hover)}.sg_chevron,.sg_folder{display:inline-flex;width:16px;height:20px;flex:none;align-items:center;justify-content:center;color:var(--dsw-alias-label-tertiary)}.sg_chevron svg,.sg_folder svg{display:block}.sg_groupTitle{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:14px;font-weight:600;line-height:20px}.sg_source{border-radius:999px;background:var(--dsw-alias-interactive-bg-hover-accent);padding:1px 5px;color:var(--dsw-alias-state-business-primary);font-size:11px;line-height:16px}.sg_count{margin-left:auto;color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:20px}
.sg_groupActions,.sg_sessionActions{position:absolute;z-index:1;right:8px;top:50%;display:flex;align-items:center;gap:12px;opacity:0;pointer-events:none;transform:translateY(-50%);transition:opacity .12s}.sg_groupActions{padding:8px 0 8px 22px;background:linear-gradient(90deg,transparent,var(--dsw-specific-sidebar-fill) 22px)}.sg_sessionActions{padding:8px 0 8px 22px;background:linear-gradient(var(--dsw-alias-interactive-bg-hover) 0 0),linear-gradient(90deg,transparent,var(--dsw-specific-sidebar-fill) 22px)}.sg_sessionCurrent .sg_sessionActions{background:linear-gradient(var(--dsw-alias-interactive-bg-hover-accent) 0 0),linear-gradient(90deg,transparent,var(--dsw-specific-sidebar-fill) 22px)}.sg_groupHead:hover .sg_groupActions,.sg_groupHead:focus-within .sg_groupActions,.sg_session:hover .sg_sessionActions,.sg_session:focus-within .sg_sessionActions{opacity:1;pointer-events:auto}
.sg_sessions{display:flex;flex-direction:column;margin-left:10px}.sg_session{position:relative;box-sizing:border-box;display:flex;height:32px;align-items:center;border-radius:8px;padding:0 8px}.sg_session+.sg_session{margin-top:2px}.sg_session:hover{background:var(--dsw-alias-interactive-bg-hover)}.sg_sessionCurrent{background:var(--dsw-alias-interactive-bg-hover-accent)}
.sg_sessionOpen{display:flex;min-width:0;height:32px;flex:1;align-items:center;gap:6px;border:0;background:transparent;color:var(--dsw-alias-label-primary);cursor:pointer;padding:0;text-align:left}.sg_sessionTitle{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:14px;line-height:20px}.sg_sessionCurrent .sg_sessionTitle{color:var(--dsw-alias-label-primary);font-weight:400}
.sg_statusSlot{display:inline-flex;width:6px;height:20px;flex:none;align-items:center;justify-content:center}.sg_dot{width:6px;height:6px;flex:none;border-radius:50%}.sg_dotRunning{background:var(--dsw-alias-state-business-primary)}
.sg_rail{display:flex;justify-content:center;padding-top:8px}.sg_railButton{width:36px;height:36px;border:0;border-radius:8px;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer;font-weight:600}.sg_railButton:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}
`

/** Install this package's stylesheet once per document. */
export function installStyles(): () => void {
  const id = 'dsh-session-groups/styles'
  const existing = document.querySelector(`style[data-plugin-css="${id}"]`)
  if (existing !== null) return () => {}
  const element = document.createElement('style')
  element.dataset.pluginCss = id
  element.textContent = styles
  document.head.appendChild(element)
  return () => { element.remove() }
}
