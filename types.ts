
export interface TreeNode {
  id: string;
  name: string;
  isOpen: boolean;
  children: TreeNode[];
}

export interface GeneratedStructure {
  name: string;
  children?: GeneratedStructure[];
}
