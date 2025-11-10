import { Renderer } from "@freelensapp/extensions";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { AIModelInfos, AIModelsEnum, toAIModelEnum } from "../../business/provider/ai-models";
import { useApplicationStatusStore } from "../../context/application-context";

import type { SingleValue } from "react-select";

type TextInputHookProps = {
  onSend: (message: string) => void;
};

const MAX_ROWS = 5;

export const useTextInput = ({ onSend }: TextInputHookProps) => {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const applicationStatusStore = useApplicationStatusStore();
  const modelSelections = useMemo(() => {
    return Object.entries(AIModelInfos).map(([value, aiModelInfo]) => {
      let label = aiModelInfo.description;
      if (value === AIModelsEnum.CUSTOM_OPENAI_COMPATIBLE) {
        const suffix = applicationStatusStore.customModelId
          ? ` (${applicationStatusStore.customModelId})`
          : " (configure in settings)";
        label = `${aiModelInfo.description}${suffix}`;
      }
      return { value: value as AIModelsEnum, label };
    });
  }, [applicationStatusStore.customModelId]);

  const adaptTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.rows = 1;

    const lineHeight = parseInt(getComputedStyle(textarea).lineHeight, 10);
    const neededRows = Math.ceil(textarea.scrollHeight / lineHeight);

    textarea.rows = Math.min(neededRows, MAX_ROWS);
  };

  useEffect(() => {
    adaptTextareaHeight();
  }, [message]);

  const handleSend = () => {
    if (!applicationStatusStore.isLoading && message.trim()) {
      onSend(message.trim());
      setMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const onChangeModel = (option: SingleValue<Renderer.Component.SelectOption<AIModelsEnum>>) => {
    if (option) {
      const selectedModel = toAIModelEnum(option.value);
      if (selectedModel) {
        applicationStatusStore.setSelectedModel(selectedModel);
      }
    }
  };

  return { message, textareaRef, modelSelections, setMessage, handleKeyDown, handleSend, onChangeModel };
};
