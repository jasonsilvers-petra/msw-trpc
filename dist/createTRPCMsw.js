"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
const unstable_core_do_not_import_1 = require("@trpc/server/unstable-core-do-not-import");
const http_1 = require("@trpc/server/http");
const msw_1 = require("msw");
const rpc_1 = require("@trpc/server/rpc");
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
const createUntypedTRPCMsw = ({ baseUrl, basePath = 'trpc', transformer = unstable_core_do_not_import_1.defaultTransformer, } = {}, pathParts = []) => {
    return new Proxy({}, {
        get(_target, procedureKey) {
            if (procedureKey === 'query' || procedureKey === 'mutation') {
                const getInput = procedureKey === 'query' ? getQueryInput : getMutationInput;
                // @ts-expect-error any
                return handler => (procedureKey === 'query' ? msw_1.http.get : msw_1.http.post)(buildUrlFromPathParts(pathParts), async (params) => {
                    try {
                        const body = await handler(await getInput(params.request, transformer));
                        return msw_1.HttpResponse.json({ result: { data: transformer.output.serialize(body) } });
                    }
                    catch (e) {
                        if (!(e instanceof Error)) {
                            throw e;
                        }
                        if (!('code' in e)) {
                            throw e;
                        }
                        const status = (0, http_1.getHTTPStatusCodeFromError)(e);
                        const path = pathParts.slice(1).join('.');
                        const { name: _ } = e, otherErrorData = __rest(e, ["name"]);
                        const jsonError = {
                            message: e.message,
                            code: rpc_1.TRPC_ERROR_CODES_BY_KEY[e.code],
                            data: Object.assign(Object.assign({}, otherErrorData), { code: e.code, httpStatus: status, path }),
                        };
                        return msw_1.HttpResponse.json({ error: transformer.output.serialize(jsonError) }, { status });
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
exports.default = createTRPCMsw;
//# sourceMappingURL=createTRPCMsw.js.map