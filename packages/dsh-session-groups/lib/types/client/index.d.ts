/** Browser half: mounts the typed Remote and shadows the stock Workspace browser through Slot priority. */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client';
export declare const inject: string[];
/** Mount the Remote projection, refresh controller, and priority-shadowed sidebar entry. */
export declare function apply(ctx: ClientContext): Promise<() => Promise<void>>;
