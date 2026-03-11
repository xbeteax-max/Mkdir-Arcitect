
import React, { useState } from 'react';
import { TreeNode } from '../types';

interface TreeItemProps {
  node: TreeNode;
  level: number;
  onToggle: (id: string) => void;
  onRename: (id: string, newName: string) => void;
  onAdd: (id: string) => void;
  onDelete: (id: string) => void;
}

export const TreeItem: React.FC<TreeItemProps> = ({
  node,
  level,
  onToggle,
  onRename,
  onAdd,
  onDelete,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(node.name);

  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editValue.trim()) {
      onRename(node.id, editValue.trim());
      setIsEditing(false);
    }
  };

  return (
    <div className="select-none">
      <div 
        className="group flex items-center py-1.5 px-3 hover:bg-slate-800/50 rounded-lg transition-colors cursor-pointer"
        style={{ paddingLeft: `${level * 1.5 + 0.75}rem` }}
      >
        <button 
          onClick={() => onToggle(node.id)}
          className={`mr-2 w-4 h-4 flex items-center justify-center text-slate-400 hover:text-white transition-transform ${node.isOpen && node.children.length > 0 ? 'rotate-90' : ''}`}
        >
          {node.children.length > 0 && <i className="fas fa-chevron-right text-[10px]"></i>}
        </button>
        
        <i className={`fas ${node.children.length > 0 ? 'fa-folder-open' : 'fa-folder'} mr-2 text-sky-400 w-5`}></i>
        
        {isEditing ? (
          <form onSubmit={handleRenameSubmit} className="flex-1">
            <input
              autoFocus
              className="bg-slate-900 border border-sky-500/50 rounded px-1 text-sm w-full outline-none focus:ring-1 focus:ring-sky-500"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleRenameSubmit}
            />
          </form>
        ) : (
          <span 
            className="flex-1 text-sm font-medium text-slate-200"
            onDoubleClick={() => setIsEditing(true)}
          >
            {node.name}
          </span>
        )}

        <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-2 transition-opacity ml-4">
          <button 
            onClick={() => onAdd(node.id)}
            title="Add Subfolder"
            className="p-1 text-slate-500 hover:text-emerald-400"
          >
            <i className="fas fa-plus text-xs"></i>
          </button>
          <button 
            onClick={() => setIsEditing(true)}
            title="Rename"
            className="p-1 text-slate-500 hover:text-sky-400"
          >
            <i className="fas fa-edit text-xs"></i>
          </button>
          <button 
            onClick={() => onDelete(node.id)}
            title="Delete"
            className="p-1 text-slate-500 hover:text-rose-400"
          >
            <i className="fas fa-trash text-xs"></i>
          </button>
        </div>
      </div>

      {node.isOpen && node.children.length > 0 && (
        <div className="mt-0.5">
          {node.children.map((child) => (
            <TreeItem
              key={child.id}
              node={child}
              level={level + 1}
              onToggle={onToggle}
              onRename={onRename}
              onAdd={onAdd}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};
