import { Renderer } from "@freelensapp/extensions";
import { observer } from "mobx-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PreferencesStore } from "../../../common/store";
import { parseCustomModelOptions } from "../../business/provider/model-provider";
import type { SingleValue } from "react-select";

const {
  Component: { Input, Switch, HorizontalLine, Select },
} = Renderer;

type StringSelectOption = Renderer.Component.SelectOption<string>;

export const PreferencesPage = observer(() => {
  const preferencesStore: PreferencesStore = PreferencesStore.getInstanceOrCreate<PreferencesStore>();
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [modelFetchError, setModelFetchError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);

  const customModelOptions = useMemo(() => parseCustomModelOptions(preferencesStore.customModelOptions), [
    preferencesStore.customModelOptions,
  ]);

  useEffect(() => {
    setAvailableModels([]);
    setModelFetchError(null);
    setHasFetched(false);
  }, [
    preferencesStore.customModelBaseUrl,
    preferencesStore.customModelApiKey,
    preferencesStore.customModelOptions,
  ]);

  const availableModelOptions = useMemo<StringSelectOption[]>(
    () =>
      availableModels.map((modelId) => ({
        value: modelId,
        label: modelId,
      })),
    [availableModels],
  );

  const onSelectFetchedModel = useCallback(
    (option: SingleValue<StringSelectOption>) => {
      if (option) {
        preferencesStore.customModelId = option.value;
      }
    },
    [preferencesStore],
  );

  const fetchAvailableModels = useCallback(async () => {
    const trimmedBaseUrl = preferencesStore.customModelBaseUrl.trim();
    setHasFetched(true);

    if (!trimmedBaseUrl) {
      setModelFetchError("Set the API base URL before loading models.");
      setAvailableModels([]);
      return;
    }

    try {
      setIsLoadingModels(true);
      setModelFetchError(null);

      const normalizedBaseUrl = trimmedBaseUrl.replace(/\/+$/, "");
      const modelsEndpoint = `${normalizedBaseUrl}/models`;
      const headers = new Headers();

      const defaultHeaders = customModelOptions.clientOptions?.defaultHeaders;
      if (defaultHeaders) {
        if (defaultHeaders instanceof Headers) {
          defaultHeaders.forEach((value, key) => headers.set(key, value));
        } else if (Array.isArray(defaultHeaders)) {
          for (const [key, value] of defaultHeaders) {
            headers.set(key, value);
          }
        } else if (typeof defaultHeaders === "object") {
          for (const [headerName, headerValue] of Object.entries(defaultHeaders)) {
            if (typeof headerValue === "string") {
              headers.set(headerName, headerValue);
            }
          }
        }
      }

      const apiKey = preferencesStore.customModelApiKey.trim();
      if (apiKey) {
        headers.set("Authorization", `Bearer ${apiKey}`);
      }

      const response = await fetch(modelsEndpoint, {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        throw new Error(`Unable to load models (status ${response.status})`);
      }

      const payload = await response.json();

      const dataArray = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload?.models)
            ? payload.models
            : [];

      const resolvedModels = dataArray
        .map((entry) => {
          if (typeof entry === "string") {
            return entry;
          }
          if (entry && typeof entry === "object" && typeof entry.id === "string") {
            return entry.id;
          }
          return undefined;
        })
        .filter((modelId): modelId is string => Boolean(modelId));

      if (resolvedModels.length === 0) {
        throw new Error("The endpoint returned an empty models list.");
      }

      setAvailableModels(resolvedModels);
    } catch (error) {
      setAvailableModels([]);
      setModelFetchError(error instanceof Error ? error.message : "Failed to load models.");
    } finally {
      setIsLoadingModels(false);
    }
  }, [customModelOptions, preferencesStore.customModelApiKey, preferencesStore.customModelBaseUrl]);

  return (
    <>
      <div style={{ marginTop: 8, fontWeight: "bold" }}>OpenAI Key</div>
      <Input
        placeholder="Put here your OpenAI API key"
        value={preferencesStore.openAIKey}
        onChange={(value: string) => (preferencesStore.openAIKey = value)}
      />
      <div style={{ marginTop: 8, fontWeight: "bold" }}>GoogleAI Key</div>
      <Input
        placeholder="Put here your GoogleAI API key"
        value={preferencesStore.googleAIKey}
        onChange={(value: string) => (preferencesStore.googleAIKey = value)}
      />
      <HorizontalLine />
      <div>
        <div style={{ fontWeight: "bold" }}>Custom OpenAI-compatible model</div>
        <div style={{ marginTop: 8, fontWeight: "bold" }}>Model ID</div>
        <Input
          placeholder="Set the model identifier expected by your API"
          value={preferencesStore.customModelId}
          onChange={(value: string) => (preferencesStore.customModelId = value)}
        />
        <div style={{ marginTop: 8, fontWeight: "bold" }}>API Base URL</div>
        <Input
          placeholder="https://your-openai-compatible-endpoint/v1"
          value={preferencesStore.customModelBaseUrl}
          onChange={(value: string) => (preferencesStore.customModelBaseUrl = value)}
        />
        <div style={{ marginTop: 8, fontWeight: "bold" }}>API Key</div>
        <Input
          placeholder="Optional API key for your custom endpoint"
          value={preferencesStore.customModelApiKey}
          onChange={(value: string) => (preferencesStore.customModelApiKey = value)}
        />
        <div style={{ marginTop: 8, fontWeight: "bold" }}>Discover models from endpoint</div>
        <div style={{ color: "#aaa", fontSize: 13, marginTop: 4 }}>
          Load available models from your OpenAI-compatible endpoint or type a model identifier manually
          above.
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 6 }}>
          <button
            style={{
              padding: "6px 12px",
              borderRadius: 4,
              border: "1px solid #00a7a0",
              background: isLoadingModels ? "rgba(0,167,160,0.35)" : "rgba(0,167,160,0.15)",
              color: "#fff",
              cursor: isLoadingModels ? "wait" : "pointer",
              fontWeight: 500,
            }}
            disabled={isLoadingModels}
            onClick={fetchAvailableModels}
          >
            {isLoadingModels ? "Loading models..." : "Load models"}
          </button>
          {modelFetchError && (
            <span style={{ color: "#ff6b6b", fontSize: 13 }}>{modelFetchError}</span>
          )}
          {!modelFetchError && hasFetched && !isLoadingModels && availableModels.length === 0 && (
            <span style={{ color: "#ccc", fontSize: 13 }}>No models detected.</span>
          )}
        </div>
        {availableModelOptions.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <Select
              placeholder="Select a model from the endpoint"
              options={availableModelOptions}
              value={
                availableModelOptions.some((option) => option.value === preferencesStore.customModelId)
                  ? preferencesStore.customModelId
                  : undefined
              }
              onChange={onSelectFetchedModel}
              themeName="lens"
            />
          </div>
        )}
        <div style={{ marginTop: 8, fontWeight: "bold" }}>Advanced configuration (JSON)</div>
        <textarea
          style={{
            width: "100%",
            minHeight: 180,
            fontFamily: "monospace",
            fontSize: 14,
            padding: 8,
            borderRadius: 4,
            border: "1px solid #ccc",
            background: "#222",
            color: "#fff",
            marginTop: 4,
          }}
          placeholder='{"clientOptions": {"defaultHeaders": {}}, "modelOptions": {"temperature": 0}}'
          value={preferencesStore.customModelOptions}
          onChange={async (e) =>
            preferencesStore.updateCustomModelOptions(e.target.value).then(() => {})
          }
        />
      </div>
      {/*<HorizontalLine />*/}
      {/*<div>*/}
      {/*  <SubTitle title="Ollama settings" />*/}
      {/*  If you're using Ollama, there's no need for an API key.*/}
      {/*  <div style={{ marginTop: 8, fontWeight: "bold" }}>Ollama host</div>*/}
      {/*  <Input*/}
      {/*    style={{ marginBottom: 8 }}*/}
      {/*    placeholder="Set here your ollama host"*/}
      {/*    value={preferencesStore.ollamaHost}*/}
      {/*    onChange={(value: string) => (preferencesStore.ollamaHost = value)}*/}
      {/*  />*/}
      {/*  <div style={{ marginTop: 8, fontWeight: "bold" }}>Ollama port</div>*/}
      {/*  <Input*/}
      {/*    placeholder="Set here your ollama port"*/}
      {/*    value={preferencesStore.ollamaPort}*/}
      {/*    onChange={(value: string) => (preferencesStore.ollamaPort = value)}*/}
      {/*  />*/}
      {/*</div>*/}
      <HorizontalLine />
      <div>
        <div style={{ fontWeight: "bold" }}>Enable MCP</div>
        <Switch
          style={{ marginBottom: 8 }}
          label="Enable MCP"
          checked={preferencesStore.mcpEnabled}
          onChange={(checked: boolean) => (preferencesStore.mcpEnabled = checked)}
        />
        Please note that MCP servers currently do not work with Gemini 2.0 Flash
        <div>
          <div style={{ marginBottom: 8, fontWeight: "bold" }}>MCP JSON Configuration</div>
          <textarea
            style={{
              width: "100%",
              minHeight: 250,
              fontFamily: "monospace",
              fontSize: 14,
              padding: 8,
              borderRadius: 4,
              border: "1px solid #ccc",
              background: "#222",
              color: "#fff",
            }}
            placeholder="Paste or edit your MCP JSON configuration here"
            value={preferencesStore.mcpConfiguration}
            onChange={async (e) => preferencesStore.updateMcpConfiguration(e.target.value).then(() => {})}
          />
        </div>
      </div>
    </>
  );
});
