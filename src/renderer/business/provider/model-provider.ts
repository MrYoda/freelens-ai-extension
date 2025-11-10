import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
// import { ChatOllama } from "@langchain/ollama";
import { ChatOpenAI } from "@langchain/openai";
import type { ChatOpenAIFields, ClientOptions } from "@langchain/openai";
import { PreferencesStore } from "../../../common/store";
import { AIModelsEnum } from "./ai-models";

type ParsedCustomModelOptions = {
  clientOptions?: ClientOptions;
  modelOptions?: Partial<Omit<ChatOpenAIFields, "model" | "apiKey" | "configuration">>;
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const parseCustomModelOptions = (rawOptions: string | undefined): ParsedCustomModelOptions => {
  if (!rawOptions || rawOptions.trim() === "") {
    return {};
  }

  try {
    const parsed = JSON.parse(rawOptions);
    if (!isRecord(parsed)) {
      console.warn("Custom model options must be a JSON object.");
      return {};
    }

    const result: ParsedCustomModelOptions = {};

    if (isRecord(parsed.clientOptions)) {
      result.clientOptions = parsed.clientOptions as ClientOptions;
    }

    if (isRecord(parsed.modelOptions)) {
      const { configuration, model, apiKey, ...restModelOptions } = parsed.modelOptions as Record<string, unknown>;
      result.modelOptions = restModelOptions as ParsedCustomModelOptions["modelOptions"];
      if (isRecord(configuration)) {
        result.clientOptions = { ...(result.clientOptions ?? {}), ...(configuration as ClientOptions) };
      }
      if (model || apiKey) {
        console.warn("'model' and 'apiKey' fields in custom modelOptions are ignored.");
      }
    }

    return result;
  } catch (error) {
    console.error("Failed to parse custom model options JSON:", error);
    return {};
  }
};

export const useModelProvider = () => {
  // @ts-ignore
  const preferencesStore = PreferencesStore.getInstanceOrCreate<PreferencesStore>();

  const getModel = () => {
    switch (preferencesStore.selectedModel) {
      case AIModelsEnum.GPT_3_5_TURBO:
      case AIModelsEnum.O3_MINI:
      case AIModelsEnum.GPT_4_1:
      case AIModelsEnum.GPT_4_O:
      case AIModelsEnum.GPT_5:
        const openAiApiKey = process.env.OPENAI_API_KEY || preferencesStore.openAIKey;
        return new ChatOpenAI({ model: preferencesStore.selectedModel, apiKey: openAiApiKey });
      // case AIModelsEnum.DEEP_SEEK_R1:
      //   return null;
      // case AIModelsEnum.OLLAMA_LLAMA32_1B:
      // case AIModelsEnum.OLLAMA_MISTRAL_7B:
      //   const ollamaHost = process.env.FREELENS_OLLAMA_HOST || preferencesStore.ollamaHost;
      //   const ollamaPort = process.env.FREELENS_OLLAMA_PORT || preferencesStore.ollamaPort;
      //   let headers = new Headers();
      //   headers.set("Origin", ollamaHost);
      //   return new ChatOllama({
      //     model: modelName,
      //     temperature: 0,
      //     headers: headers,
      //     baseUrl: `${ollamaHost}:${ollamaPort}`,
      //   });
      case AIModelsEnum.CUSTOM_OPENAI_COMPATIBLE: {
        const customModelId = process.env.FREELENS_CUSTOM_MODEL_ID || preferencesStore.customModelId;
        if (!customModelId) {
          throw new Error(
            "Custom model ID is not configured. Please set it in the Freelens AI settings.",
          );
        }

        const customApiKey =
          process.env.FREELENS_CUSTOM_MODEL_API_KEY ||
          preferencesStore.customModelApiKey ||
          process.env.OPENAI_API_KEY ||
          preferencesStore.openAIKey;
        const customBaseUrl =
          process.env.FREELENS_CUSTOM_MODEL_BASE_URL || preferencesStore.customModelBaseUrl;
        const customOptionsJson =
          process.env.FREELENS_CUSTOM_MODEL_OPTIONS_JSON || preferencesStore.customModelOptions;

        const parsedOptions = parseCustomModelOptions(customOptionsJson);

        let clientOptions: ClientOptions | undefined = parsedOptions.clientOptions
          ? { ...parsedOptions.clientOptions }
          : undefined;

        if (customBaseUrl) {
          clientOptions = { ...(clientOptions ?? {}), baseURL: customBaseUrl };
        }

        const modelOptions = parsedOptions.modelOptions ?? {};

        const chatOptions: ChatOpenAIFields = {
          model: customModelId,
          ...modelOptions,
        };

        if (clientOptions && Object.keys(clientOptions).length > 0) {
          chatOptions.configuration = clientOptions;
        }

        if (customApiKey) {
          chatOptions.apiKey = customApiKey;
        }

        return new ChatOpenAI(chatOptions);
      }
      case AIModelsEnum.GEMINI_2_FLASH:
        const googleApiKey = process.env.GOOGLE_API_KEY || preferencesStore.googleAIKey;
        return new ChatGoogleGenerativeAI({
          model: preferencesStore.selectedModel,
          temperature: 0,
          apiKey: googleApiKey,
          streamUsage: false,
        });
      default:
        throw new Error(`Unsupported model: ${preferencesStore.selectedModel}`);
    }
  };

  return { getModel };
};
