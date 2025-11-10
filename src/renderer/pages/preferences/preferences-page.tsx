import { Renderer } from "@freelensapp/extensions";
import { observer } from "mobx-react";
import { PreferencesStore } from "../../../common/store";

const {
  Component: { Input, Switch, HorizontalLine },
} = Renderer;

export const PreferencesPage = observer(() => {
  const preferencesStore: PreferencesStore = PreferencesStore.getInstanceOrCreate<PreferencesStore>();

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
