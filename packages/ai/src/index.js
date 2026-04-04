"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createGradientProvider = createGradientProvider;
const openai_compatible_1 = require("@ai-sdk/openai-compatible");
function createGradientProvider(apiKey) {
    return (0, openai_compatible_1.createOpenAICompatible)({
        name: "gradient",
        baseURL: "https://inference.do-ai.run/v1",
        apiKey: apiKey,
    });
}
