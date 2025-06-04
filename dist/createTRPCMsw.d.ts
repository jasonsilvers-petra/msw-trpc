import { AnyTRPCRouter, TRPCCombinedDataTransformer } from '@trpc/server';
import { MswTrpc } from './types';
declare const createTRPCMsw: <Router extends AnyTRPCRouter>(config?: {
    baseUrl?: string;
    basePath?: string;
    transformer?: TRPCCombinedDataTransformer;
}) => MswTrpc<Router>;
export default createTRPCMsw;
//# sourceMappingURL=createTRPCMsw.d.ts.map