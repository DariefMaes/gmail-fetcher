import { ClientConfiguration, HubPushOptions } from "langchainhub";
import { Runnable } from "./schema/runnable.js";
export declare function push(repoFullName: string, runnable: Runnable, options?: HubPushOptions & ClientConfiguration): Promise<string>;
export declare function pull<T extends Runnable>(ownerRepoCommit: string, options?: ClientConfiguration): Promise<T>;
