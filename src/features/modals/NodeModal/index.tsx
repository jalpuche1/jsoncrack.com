import React from "react";
import type { ModalProps } from "@mantine/core";
import { Modal, Stack, Text, ScrollArea, Flex, CloseButton, Button, Textarea } from "@mantine/core";
import { CodeHighlight } from "@mantine/code-highlight";
import type { NodeData } from "../../../types/graph";
import useGraph from "../../editor/views/GraphView/stores/useGraph";
import { updateNodeValue } from "../../editor/views/GraphView/lib/utils/updateNodeValue";

// return object from json removing array and object fields
const normalizeNodeData = (nodeRows: NodeData["text"]) => {
  if (!nodeRows || nodeRows.length === 0) return "{}";
  if (nodeRows.length === 1 && !nodeRows[0].key) return `${nodeRows[0].value}`;

  const obj = {};
  nodeRows?.forEach(row => {
    if (row.type !== "array" && row.type !== "object") {
      if (row.key) obj[row.key] = row.value;
    }
  });
  return JSON.stringify(obj, null, 2);
};

// return json path in the format $["customer"]
const jsonPathToString = (path?: NodeData["path"]) => {
  if (!path || path.length === 0) return "$";
  const segments = path.map(seg => (typeof seg === "number" ? seg : `"${seg}"`));
  return `$[${segments.join("][")}]`;
};

export const NodeModal = ({ opened, onClose }: ModalProps) => {
  const nodeData = useGraph(state => state.selectedNode);
  const [isEditing, setIsEditing] = React.useState(false);
  const [editValue, setEditValue] = React.useState("");
  const [originalValue, setOriginalValue] = React.useState("");

  React.useEffect(() => {
    if (nodeData && opened) {
      const normalizedData = normalizeNodeData(nodeData.text ?? []);
      setEditValue(normalizedData);
      setOriginalValue(normalizedData);
      setIsEditing(false);
    }
  }, [nodeData, opened]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!nodeData) return;
    
    try {
      // For simple values, update the first row
      if (nodeData.text.length === 1 && !nodeData.text[0].key) {
        await updateNodeValue(nodeData.id, 0, editValue);
      } else {
        // For objects, we need to parse the JSON and update individual fields
        const parsedValue = JSON.parse(editValue);
        
        // Update each field that has changed
        for (let i = 0; i < nodeData.text.length; i++) {
          const row = nodeData.text[i];
          if (row.key && parsedValue.hasOwnProperty(row.key)) {
            const newValue = parsedValue[row.key];
            if (newValue !== row.value) {
              await updateNodeValue(nodeData.id, i, String(newValue));
            }
          }
        }
      }
      
      setIsEditing(false);
      setOriginalValue(editValue);
    } catch (error) {
      console.error("Failed to save changes:", error);
      // Could add toast notification here
    }
  };

  const handleCancel = () => {
    setEditValue(originalValue);
    setIsEditing(false);
  };

  const canEdit = nodeData?.text.some(row => row.type !== "object" && row.type !== "array");

  return (
    <Modal size="auto" opened={opened} onClose={onClose} centered withCloseButton={false}>
      <Stack pb="sm" gap="sm">
        <Stack gap="xs">
          <Flex justify="space-between" align="center">
            <Text fz="xs" fw={500}>
              Content
            </Text>
            <Flex gap="xs" align="center">
              {isEditing ? (
                <>
                  <Button
                    size="xs"
                    color="green"
                    onClick={handleSave}
                  >
                    Save
                  </Button>
                  <Button
                    size="xs"
                    variant="outline"
                    color="gray"
                    onClick={handleCancel}
                  >
                    Cancel
                  </Button>
                </>
              ) : canEdit ? (
                <Button
                  size="xs"
                  variant="outline"
                  onClick={handleEdit}
                >
                  Edit
                </Button>
              ) : null}
              <CloseButton onClick={onClose} />
            </Flex>
          </Flex>
          
          {isEditing ? (
            <Textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              minRows={6}
              maxRows={12}
              style={{
                fontFamily: 'monospace',
                fontSize: '12px',
                minWidth: '350px',
                maxWidth: '600px'
              }}
              placeholder="Enter JSON content..."
            />
          ) : (
            <ScrollArea.Autosize mah={250} maw={600}>
              <CodeHighlight
                code={normalizeNodeData(nodeData?.text ?? [])}
                miw={350}
                maw={600}
                language="json"
                withCopyButton
              />
            </ScrollArea.Autosize>
          )}
        </Stack>
        
        <Text fz="xs" fw={500}>
          JSON Path
        </Text>
        <ScrollArea.Autosize maw={600}>
          <CodeHighlight
            code={jsonPathToString(nodeData?.path)}
            miw={350}
            mah={250}
            language="json"
            copyLabel="Copy to clipboard"
            copiedLabel="Copied to clipboard"
            withCopyButton
          />
        </ScrollArea.Autosize>
      </Stack>
    </Modal>
  );
};
