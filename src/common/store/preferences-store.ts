import { Common } from "@freelensapp/extensions";
import { makeObservable, observable, toJS } from "mobx";
import { MessageObject } from "../../renderer/business/objects/message-object";
import { AIModelsEnum } from "../../renderer/business/provider/ai-models";

const DEFAULT_CUSTOM_MODEL_OPTIONS = JSON.stringify(
  {
    clientOptions: {
      defaultHeaders: {},
    },
    modelOptions: {
      temperature: 0,
    },
  },
  null,
  2,
);

export interface PreferencesModel {
  openAIKey: string;
  googleAIKey: string;
  selectedModel: AIModelsEnum;
  mcpEnabled: boolean;
  mcpConfiguration: string;
  ollamaHost: string;
  ollamaPort: string;
  customModelId: string;
  customModelBaseUrl: string;
  customModelApiKey: string;
  customModelOptions: string;
}

export class PreferencesStore extends Common.Store.ExtensionStore<PreferencesModel> {
  // Persistent
  @observable accessor openAIKey: string = "";
  @observable accessor googleAIKey: string = "";
  @observable accessor selectedModel: AIModelsEnum = AIModelsEnum.GPT_3_5_TURBO;
  @observable accessor mcpEnabled: boolean = false;
  @observable accessor mcpConfiguration: string = "";
  @observable accessor ollamaHost: string = "";
  @observable accessor ollamaPort: string = "";
  @observable accessor customModelId: string = "";
  @observable accessor customModelBaseUrl: string = "";
  @observable accessor customModelApiKey: string = "";
  @observable accessor customModelOptions: string = DEFAULT_CUSTOM_MODEL_OPTIONS;

  // Not persistent
  @observable accessor explainEvent: MessageObject = {} as MessageObject;

  constructor() {
    super({
      configName: "freelens-ai-preferences-store",
      defaults: {
        openAIKey: "",
        googleAIKey: "",
        selectedModel: AIModelsEnum.GPT_3_5_TURBO,
        mcpEnabled: false,
        mcpConfiguration: JSON.stringify(
          {
            mcpServers: {
              kubernetes: {
                command: "npx",
                args: ["mcp-server-kubernetes"],
              },
            },
          },
          null,
          2,
        ),
        ollamaHost: "http://127.0.0.1",
        ollamaPort: "9898",
        customModelId: "",
        customModelBaseUrl: "",
        customModelApiKey: "",
        customModelOptions: DEFAULT_CUSTOM_MODEL_OPTIONS,
      },
    });
    makeObservable(this);
  }

  updateMcpConfiguration = async (newMcpConfiguration: string) => {
    this.mcpConfiguration = newMcpConfiguration;
  };

  updateCustomModelOptions = async (newCustomModelOptions: string) => {
    this.customModelOptions = newCustomModelOptions;
  };

  fromStore = (preferencesModel: PreferencesModel): void => {
    this.openAIKey = preferencesModel.openAIKey;
    this.googleAIKey = preferencesModel.googleAIKey;
    this.selectedModel = preferencesModel.selectedModel;
    this.mcpEnabled = preferencesModel.mcpEnabled;
    this.mcpConfiguration = preferencesModel.mcpConfiguration;
    this.ollamaHost = preferencesModel.ollamaHost;
    this.ollamaPort = preferencesModel.ollamaPort;
    this.customModelId = preferencesModel.customModelId ?? "";
    this.customModelBaseUrl = preferencesModel.customModelBaseUrl ?? "";
    this.customModelApiKey = preferencesModel.customModelApiKey ?? "";
    this.customModelOptions = preferencesModel.customModelOptions ?? DEFAULT_CUSTOM_MODEL_OPTIONS;
  };

  toJSON = (): PreferencesModel => {
    const value: PreferencesModel = {
      openAIKey: this.openAIKey,
      googleAIKey: this.googleAIKey,
      selectedModel: this.selectedModel,
      mcpEnabled: this.mcpEnabled,
      mcpConfiguration: this.mcpConfiguration,
      ollamaHost: this.ollamaHost,
      ollamaPort: this.ollamaPort,
      customModelId: this.customModelId,
      customModelBaseUrl: this.customModelBaseUrl,
      customModelApiKey: this.customModelApiKey,
      customModelOptions: this.customModelOptions,
    };
    return toJS(value);
  };
}
