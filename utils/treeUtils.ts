
import { TreeNode, GeneratedStructure } from "../types";

export const generateId = () => Math.random().toString(36).substr(2, 9);

export const mapGeneratedToTreeNode = (gen: GeneratedStructure): TreeNode => {
  return {
    id: generateId(),
    name: gen.name,
    isOpen: true,
    children: (gen.children || []).map(mapGeneratedToTreeNode),
  };
};

export const findAndModifyNode = (
  nodes: TreeNode[],
  id: string,
  modifier: (node: TreeNode) => TreeNode | null
): TreeNode[] => {
  return nodes
    .map((node) => {
      if (node.id === id) {
        return modifier(node);
      }
      if (node.children.length > 0) {
        return {
          ...node,
          children: findAndModifyNode(node.children, id, modifier),
        };
      }
      return node;
    })
    .filter((node): node is TreeNode => node !== null);
};

export const getAllPaths = (node: TreeNode, currentPath: string = ""): string[] => {
  const path = currentPath ? `${currentPath}/${node.name}` : node.name;
  let paths = [path];
  node.children.forEach((child) => {
    paths = [...paths, ...getAllPaths(child, path)];
  });
  return paths;
};

export const generateMkdirCommand = (root: TreeNode, fingerprint?: string): string => {
  const paths = getAllPaths(root);
  const uniquePaths = Array.from(new Set(paths));
  const comment = fingerprint ? `# Project Fingerprint (SHA-1): ${fingerprint}\n` : "";
  return `${comment}mkdir -p ${uniquePaths.map(p => `'${p}'`).join(' ')}`;
};

/**
 * Creates a stable, stringified representation of the tree for hashing.
 * Children are sorted by name to ensure the same structure always produces the same hash.
 */
export const getCanonicalTreeString = (node: TreeNode): string => {
  const sortedChildren = [...node.children].sort((a, b) => a.name.localeCompare(b.name));
  const childrenStr = sortedChildren.map(getCanonicalTreeString).join(',');
  return `${node.name}[${childrenStr}]`;
};

/**
 * Calculates SHA-1 hash of a string using Web Crypto API
 */
export const calculateSHA1 = async (message: string): Promise<string> => {
  const msgUint8 = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-1', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
};
