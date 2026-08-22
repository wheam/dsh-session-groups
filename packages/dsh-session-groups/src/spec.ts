/** Durable storage-domain declaration for provider communication-origin assignments. */
import { z } from 'zod'
import type { SessionId } from '@deepseek-ai/dsh-session/types'
import { defineDomain, domainTable } from '@deepseek-ai/dsh-storage-domain'
import type { SessionGroupDescriptor, SessionGroupId, SessionGroupRecord } from './types.js'

const boundedText = (max: number) => z.string().trim().min(1).max(max)

/** Runtime schema for one provider-owned chat/source descriptor. */
export const sessionGroupDescriptorSchema = z.object({
  id: boundedText(240).transform(value => value as SessionGroupId),
  title: boundedText(200),
  source: boundedText(64),
  kind: boundedText(64).optional(),
}) as z.ZodType<SessionGroupDescriptor>

/** Runtime schema for one persisted Session source assignment. */
export const sessionGroupRecordSchema = z.object({
  group: sessionGroupDescriptorSchema,
  updatedAt: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
}) as z.ZodType<SessionGroupRecord>

/** One durable source assignment per Session id. */
export const sessionGroupsDomainSpec = defineDomain({
  name: 'session_groups',
  version: 0,
  tables: {
    sessions: domainTable<SessionId, SessionGroupRecord>(sessionGroupRecordSchema),
  },
})
