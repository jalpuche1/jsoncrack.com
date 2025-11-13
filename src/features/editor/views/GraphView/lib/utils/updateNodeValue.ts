import useFile from "../../../../../../store/useFile";
import useGraph from "../../stores/useGraph";

/**
 * Updates a node value in the JSON and refreshes both the editor and visualization
 */
export async function updateNodeValue(nodeId: string, rowIndex: number, newValue: string): Promise<void> {
  const nodes = useGraph.getState().nodes;
  const node = nodes.find(n => n.id === nodeId);
  
  if (!node || !node.path) {
    throw new Error("Node not found or path not available");
  }
  
  const currentContents = useFile.getState().getContents();
  
  try {
    // Parse the current JSON
    let jsonData = JSON.parse(currentContents);
    
    // Navigate to the correct location in the JSON using the node's path
    let target = jsonData;
    const pathCopy = [...node.path];
    
    // For object nodes with multiple rows, we need to handle the specific key being edited
    if (node.text.length > 1) {
      // Navigate to the parent object using the path
      for (let i = 0; i < pathCopy.length; i++) {
        target = target[pathCopy[i]];
      }
      
      // Get the key from the specific row being edited
      const rowKey = node.text[rowIndex]?.key;
      if (rowKey) {
        target[rowKey] = convertStringValue(newValue);
      }
    } else {
      // For single value nodes, navigate to the parent and update the final key
      for (let i = 0; i < pathCopy.length - 1; i++) {
        target = target[pathCopy[i]];
      }
      
      const finalKey = pathCopy[pathCopy.length - 1];
      const convertedValue = convertStringValue(newValue);
      
      if (Array.isArray(target)) {
        target[finalKey as number] = convertedValue;
      } else {
        target[finalKey] = convertedValue;
      }
    }
    
    // Update the editor contents
    const newContents = JSON.stringify(jsonData, null, 2);
    useFile.getState().setContents({ contents: newContents });
    
  } catch (error) {
    console.error("Failed to update node value:", error);
    throw new Error("Failed to parse or update JSON");
  }
}

/**
 * Converts a string value to the appropriate JSON type
 */
function convertStringValue(value: string): any {
  if (value === "null") return null;
  if (value === "true") return true;
  if (value === "false") return false;
  
  // Try to parse as number
  const numValue = Number(value);
  if (!isNaN(numValue) && isFinite(numValue) && value.trim() !== "") {
    return numValue;
  }
  
  // Try to parse as JSON (for objects/arrays)
  try {
    return JSON.parse(value);
  } catch {
    // If all else fails, treat as string
    return value;
  }
}