import { useEffect } from 'react';
import { Button } from './ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
  availableModels: Array<{ name: string }>;
  isLoadingModels: boolean;
  onRefresh: () => void;
}

export function ModelSelector({
  selectedModel,
  onModelChange,
  availableModels,
  isLoadingModels,
  onRefresh
}: ModelSelectorProps) {
  useEffect(() => {
    onRefresh();
  }, [onRefresh]);

  return (
    <div className="flex items-center space-x-2">
      <Select value={selectedModel} onValueChange={onModelChange}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Select Model" />
        </SelectTrigger>
        <SelectContent>
          {availableModels.map((model) => (
            <SelectItem key={model.name} value={model.name}>
              {model.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        variant="outline"
        size="icon"
        onClick={onRefresh}
        disabled={isLoadingModels}
      >
        {isLoadingModels ? (
          <span className="animate-spin">⌛</span>
        ) : (
          <span>🔄</span>
        )}
      </Button>
    </div>
  );
} 