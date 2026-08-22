var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __knownSymbol = (name, symbol) => (symbol = Symbol[name]) ? symbol : /* @__PURE__ */ Symbol.for("Symbol." + name);
var __typeError = (msg) => {
  throw TypeError(msg);
};
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __decoratorStart = (base) => [, , , __create(base?.[__knownSymbol("metadata")] ?? null)];
var __decoratorStrings = ["class", "method", "getter", "setter", "accessor", "field", "value", "get", "set"];
var __expectFn = (fn) => fn !== void 0 && typeof fn !== "function" ? __typeError("Function expected") : fn;
var __decoratorContext = (kind, name, done, metadata, fns) => ({ kind: __decoratorStrings[kind], name, metadata, addInitializer: (fn) => done._ ? __typeError("Already initialized") : fns.push(__expectFn(fn || null)) });
var __decoratorMetadata = (array, target) => __defNormalProp(target, __knownSymbol("metadata"), array[3]);
var __runInitializers = (array, flags, self, value) => {
  for (var i = 0, fns = array[flags >> 1], n = fns && fns.length; i < n; i++) flags & 1 ? fns[i].call(self) : value = fns[i].call(self, value);
  return value;
};
var __decorateElement = (array, flags, name, decorators, target, extra) => {
  var fn, it, done, ctx, access, k = flags & 7, s = !!(flags & 8), p = !!(flags & 16);
  var j = k > 3 ? array.length + 1 : k ? s ? 1 : 2 : 0, key = __decoratorStrings[k + 5];
  var initializers = k > 3 && (array[j - 1] = []), extraInitializers = array[j] || (array[j] = []);
  var desc = k && (!p && !s && (target = target.prototype), k < 5 && (k > 3 || !p) && __getOwnPropDesc(k < 4 ? target : { get [name]() {
    return __privateGet(this, extra);
  }, set [name](x) {
    return __privateSet(this, extra, x);
  } }, name));
  k ? p && k < 4 && __name(extra, (k > 2 ? "set " : k > 1 ? "get " : "") + name) : __name(target, name);
  for (var i = decorators.length - 1; i >= 0; i--) {
    ctx = __decoratorContext(k, name, done = {}, array[3], extraInitializers);
    if (k) {
      ctx.static = s, ctx.private = p, access = ctx.access = { has: p ? (x) => __privateIn(target, x) : (x) => name in x };
      if (k ^ 3) access.get = p ? (x) => (k ^ 1 ? __privateGet : __privateMethod)(x, target, k ^ 4 ? extra : desc.get) : (x) => x[name];
      if (k > 2) access.set = p ? (x, y) => __privateSet(x, target, y, k ^ 4 ? extra : desc.set) : (x, y) => x[name] = y;
    }
    it = (0, decorators[i])(k ? k < 4 ? p ? extra : desc[key] : k > 4 ? void 0 : { get: desc.get, set: desc.set } : target, ctx), done._ = 1;
    if (k ^ 4 || it === void 0) __expectFn(it) && (k > 4 ? initializers.unshift(it) : k ? p ? extra = it : desc[key] = it : target = it);
    else if (typeof it !== "object" || it === null) __typeError("Object expected");
    else __expectFn(fn = it.get) && (desc.get = fn), __expectFn(fn = it.set) && (desc.set = fn), __expectFn(fn = it.init) && initializers.unshift(fn);
  }
  return k || __decoratorMetadata(array, target), desc && __defProp(target, name, desc), p ? k ^ 4 ? extra : desc : target;
};
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
var __accessCheck = (obj, member, msg) => member.has(obj) || __typeError("Cannot " + msg);
var __privateIn = (member, obj) => Object(obj) !== obj ? __typeError('Cannot use the "in" operator on this value') : member.has(obj);
var __privateGet = (obj, member, getter) => (__accessCheck(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));
var __privateSet = (obj, member, value, setter) => (__accessCheck(obj, member, "write to private field"), setter ? setter.call(obj, value) : member.set(obj, value), value);
var __privateMethod = (obj, member, method) => (__accessCheck(obj, member, "access private method"), method);

// packages/dsh-session-groups/src/index.ts
import { Service } from "@deepseek-ai/cordis";
import { Remote, TypertRemoteService } from "@deepseek-ai/dsh-typert-protocol";

// packages/dsh-session-groups/src/spec.ts
import { z } from "zod";
import { defineDomain, domainTable } from "@deepseek-ai/dsh-storage-domain";
var boundedText = (max) => z.string().trim().min(1).max(max);
var sessionGroupDescriptorSchema = z.object({
  id: boundedText(240).transform((value) => value),
  title: boundedText(200),
  source: boundedText(64),
  kind: boundedText(64).optional()
});
var sessionGroupRecordSchema = z.object({
  group: sessionGroupDescriptorSchema,
  updatedAt: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER)
});
var sessionGroupsDomainSpec = defineDomain({
  name: "session_groups",
  version: 0,
  tables: {
    sessions: domainTable(sessionGroupRecordSchema)
  }
});

// packages/dsh-session-groups/src/index.ts
function sameDescriptor(left, right) {
  return left.id === right.id && left.title === right.title && left.source === right.source && left.kind === right.kind;
}
function snapshotDescriptor(group) {
  return Object.freeze({
    id: group.id,
    title: group.title,
    source: group.source,
    ...group.kind === void 0 ? {} : { kind: group.kind }
  });
}
var _list_dec, _a, _init, _b;
var SessionGroupsService = class extends (_b = TypertRemoteService) {
  /** Create the Cordis service under `ctx.sessionGroups`. */
  constructor(ctx) {
    super(ctx, "sessionGroups");
    __runInitializers(_init, 5, this);
    __publicField(this, "table");
  }
  /** Open and own the sidecar storage domain. */
  async [(_a = Service.init, _list_dec = [Remote("list")], _a)]() {
    const domain = await this.ctx.storageDomain.open(sessionGroupsDomainSpec);
    this.ctx.effect(() => async () => {
      await domain.close();
    }, "session-groups.domainClose");
    this.table = domain.table("sessions");
  }
  /**
   * Attach one provider-owned communication origin to a Session. The legacy
   * sessionGroups name stays compatible and does not replace Workspace membership.
   * Identical assignments are no-ops; a changed title replaces the descriptor durably.
   */
  async assign(sessionId, descriptor) {
    const group = snapshotDescriptor(sessionGroupDescriptorSchema.parse(descriptor));
    const table = this.requireTable();
    const current = table.get(sessionId);
    if (current !== void 0 && sameDescriptor(current.group, group)) return;
    await table.put(sessionId, Object.freeze({ group, updatedAt: Date.now() }));
  }
  /** Remove one Session's communication-origin assignment; absence is already successful. */
  async unassign(sessionId) {
    await this.requireTable().delete(sessionId);
  }
  list() {
    const assignments = [...this.requireTable().entries()].map(([sessionId, record]) => Object.freeze({
      sessionId,
      group: snapshotDescriptor(record.group),
      updatedAt: record.updatedAt
    })).sort((left, right) => left.sessionId === right.sessionId ? 0 : left.sessionId < right.sessionId ? -1 : 1);
    return Object.freeze({ assignments: Object.freeze(assignments) });
  }
  requireTable() {
    if (this.table === void 0) throw new Error("dsh-session-groups is not initialized");
    return this.table;
  }
};
_init = __decoratorStart(_b);
__decorateElement(_init, 1, "list", _list_dec, SessionGroupsService);
__decoratorMetadata(_init, SessionGroupsService);
__publicField(SessionGroupsService, "inject", ["storageDomain"]);
var index_default = SessionGroupsService;
export {
  SessionGroupsService,
  index_default as default,
  sessionGroupDescriptorSchema,
  sessionGroupRecordSchema,
  sessionGroupsDomainSpec
};
//# sourceMappingURL=index.js.map
