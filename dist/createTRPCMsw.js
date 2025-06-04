import { defaultTransformer } from '@trpc/server/unstable-core-do-not-import';
import { getHTTPStatusCodeFromError } from '@trpc/server/http';
import { HttpResponse, http } from 'msw';
import { TRPC_ERROR_CODES_BY_KEY } from '@trpc/server/rpc';
const getQueryInput = (req, transformer) => {
    const inputString = new URL(req.url).searchParams.get('input');
    if (inputString == null)
        return inputString;
    return transformer.input.deserialize(JSON.parse(inputString));
};
const getMutationInput = async (req, transformer) => {
    const body = await req.json();
    return transformer.input.deserialize(body);
};
const getRegexpAsString = (baseUrl) => {
    if (baseUrl instanceof RegExp === false)
        return baseUrl;
    let baseUrlAsString = `${baseUrl}`.replace('\\/', '');
    if (baseUrlAsString[0] === '/')
        baseUrlAsString = baseUrlAsString.substring(1);
    if (baseUrlAsString[baseUrlAsString.length - 1] === '/')
        baseUrlAsString = baseUrlAsString.substring(0, baseUrlAsString.length - 1);
    return baseUrlAsString;
};
const buildUrlFromPathParts = (pathParts) => new RegExp(pathParts.map(getRegexpAsString).join('[/.|.]') + '$');
const createUntypedTRPCMsw = ({ baseUrl, basePath = 'trpc', transformer = defaultTransformer, } = {}, pathParts = []) => {
    return new Proxy({}, {
        get(_target, procedureKey) {
            if (procedureKey === 'query' || procedureKey === 'mutation') {
                const getInput = procedureKey === 'query' ? getQueryInput : getMutationInput;
                // @ts-expect-error any
                return handler => (procedureKey === 'query' ? http.get : http.post)(buildUrlFromPathParts(pathParts), async (params) => {
                    try {
                        const body = await handler(await getInput(params.request, transformer));
                        return HttpResponse.json({ result: { data: transformer.output.serialize(body) } });
                    }
                    catch (e) {
                        if (!(e instanceof Error)) {
                            throw e;
                        }
                        if (!('code' in e)) {
                            throw e;
                        }
                        const status = getHTTPStatusCodeFromError(e);
                        const path = pathParts.slice(1).join('.');
                        const { name: _, ...otherErrorData } = e;
                        const jsonError = {
                            message: e.message,
                            code: TRPC_ERROR_CODES_BY_KEY[e.code],
                            data: { ...otherErrorData, code: e.code, httpStatus: status, path },
                        };
                        return HttpResponse.json({ error: transformer.output.serialize(jsonError) }, { status });
                    }
                });
            }
            const newPathParts = pathParts.length === 0 ? (baseUrl != null ? [baseUrl] : [`\/${basePath}`]) : pathParts;
            return createUntypedTRPCMsw({ transformer }, [...newPathParts, procedureKey]);
        },
    });
};
const createTRPCMsw = (config = {}) => {
    return createUntypedTRPCMsw(config);
};
export default createTRPCMsw;
//# sourceMappingURL=createTRPCMsw.js.map