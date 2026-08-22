/** Durable storage-domain declaration for virtual Session-group assignments. */
import { z } from 'zod';
import type { SessionId } from '@deepseek-ai/dsh-session/types';
import type { SessionGroupDescriptor, SessionGroupRecord } from './types.js';
/** Runtime schema for one provider-owned group descriptor. */
export declare const sessionGroupDescriptorSchema: z.ZodType<SessionGroupDescriptor>;
/** Runtime schema for one persisted Session assignment. */
export declare const sessionGroupRecordSchema: z.ZodType<SessionGroupRecord>;
/** One durable assignment per Session id. */
export declare const sessionGroupsDomainSpec: {
    name: string;
    version: number;
    tables: {
        sessions: import("@deepseek-ai/dsh-storage-domain").DomainTableSpec<SessionId, SessionGroupRecord>;
    };
};
//# sourceMappingURL=spec.d.ts.map