/** Build-analysis identity shim for the published rc.2 Typert generator. */
import {
  Remote as RuntimeRemote,
  TypertRemoteService as RuntimeTypertRemoteService,
} from '@deepseek-ai/dsh-typert-protocol-runtime'

export type * from '@deepseek-ai/dsh-typert-protocol-runtime'

/** Runtime-identical decorator with the workspace identity expected by the rc.2 analyzer. */
export const Remote: typeof RuntimeRemote = RuntimeRemote

/** Runtime-identical base class with the workspace identity expected by the rc.2 analyzer. */
export abstract class TypertRemoteService<T = never> extends RuntimeTypertRemoteService<T> {}
