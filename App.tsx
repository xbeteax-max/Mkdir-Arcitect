
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { TreeNode } from './types';
import { generateStructure } from './services/geminiService';
import { 
  generateId, 
  mapGeneratedToTreeNode, 
  findAndModifyNode, 
  generateMkdirCommand,
  getCanonicalTreeString,
  calculateSHA1
} from './utils/treeUtils';
import { TreeItem } from './components/TreeItem';

const App: React.FC = () => {
  const [tree, setTree] = useState<TreeNode | null>(null);
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [fingerprint, setFingerprint] = useState<string>('');
  const [isFingerprintUpdating, setIsFingerprintUpdating] = useState(false);

  // Update fingerprint whenever tree changes
  useEffect(() => {
    if (!tree) {
      setFingerprint('');
      return;
    }

    const updateFingerprint = async () => {
      setIsFingerprintUpdating(true);
      const canonical = getCanonicalTreeString(tree);
      const hash = await calculateSHA1(canonical);
      setFingerprint(hash);
      // Brief delay for visual feedback
      setTimeout(() => setIsFingerprintUpdating(false), 300);
    };

    updateFingerprint();
  }, [tree]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsLoading(true);
    try {
      const result = await generateStructure(prompt);
      setTree(mapGeneratedToTreeNode(result));
    } catch (error) {
      console.error("Failed to generate structure:", error);
      alert("Something went wrong while generating the structure. Please check your API key.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = useCallback((id: string) => {
    if (!tree) return;
    setTree(prev => {
      if (!prev) return null;
      const newTree = findAndModifyNode([prev], id, (node) => ({ ...node, isOpen: !node.isOpen }));
      return newTree[0];
    });
  }, [tree]);

  const handleRename = useCallback((id: string, newName: string) => {
    if (!tree) return;
    setTree(prev => {
      if (!prev) return null;
      const newTree = findAndModifyNode([prev], id, (node) => ({ ...node, name: newName }));
      return newTree[0];
    });
  }, [tree]);

  const handleAdd = useCallback((id: string) => {
    if (!tree) return;
    setTree(prev => {
      if (!prev) return null;
      const newTree = findAndModifyNode([prev], id, (node) => ({
        ...node,
        isOpen: true,
        children: [...node.children, { id: generateId(), name: 'new_folder', isOpen: true, children: [] }]
      }));
      return newTree[0];
    });
  }, [tree]);

  const handleDelete = useCallback((id: string) => {
    if (!tree) return;
    setTree(prev => {
      if (!prev) return null;
      if (prev.id === id) {
        if (confirm("Are you sure you want to delete the entire project structure?")) {
          return null;
        }
        return prev;
      }
      const newTree = findAndModifyNode([prev], id, () => null);
      return newTree[0] || null;
    });
  }, [tree]);

  const mkdirCommand = useMemo(() => {
    return tree ? generateMkdirCommand(tree, fingerprint) : '';
  }, [tree, fingerprint]);

  const copyToClipboard = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <header className="mb-12 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2 flex items-center">
            <span className="bg-sky-600 px-3 py-1 rounded-lg mr-3">mkdir</span>
            Architect
          </h1>
          <p className="text-slate-400 font-medium">Visual project scaffolding powered by Gemini AI</p>
        </div>
        <div className="flex space-x-4">
          <a 
            href="https://github.com" 
            target="_blank" 
            className="text-slate-500 hover:text-white transition-colors"
          >
            <i className="fab fa-github text-2xl"></i>
          </a>
        </div>
      </header>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Input & Controls */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-800/40 border border-slate-700 p-6 rounded-2xl backdrop-blur-sm shadow-xl">
            <h2 className="text-lg font-semibold mb-4 text-sky-400 flex items-center">
              <i className="fas fa-magic mr-2"></i> Generate Structure
            </h2>
            <form onSubmit={handleGenerate}>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe your project (e.g., 'A modern React app with Redux, Tailwind, and Vitest')"
                className="w-full h-32 bg-slate-900/50 border border-slate-700 rounded-xl p-4 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition-all mb-4 resize-none"
              />
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-3 rounded-xl font-bold flex items-center justify-center transition-all ${
                  isLoading 
                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed' 
                  : 'bg-sky-600 hover:bg-sky-500 text-white shadow-lg shadow-sky-900/20'
                }`}
              >
                {isLoading ? (
                  <>
                    <i className="fas fa-circle-notch fa-spin mr-2"></i>
                    Thinking...
                  </>
                ) : (
                  <>
                    <i className="fas fa-wand-sparkles mr-2"></i>
                    Generate Scaffolding
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="bg-slate-800/20 border border-dashed border-slate-700 p-6 rounded-2xl">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setTree({ id: generateId(), name: 'new_project', isOpen: true, children: [] })}
                className="py-2 px-4 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium text-slate-300 transition-colors flex items-center justify-center"
              >
                <i className="fas fa-plus-circle mr-2"></i> New
              </button>
              <button 
                onClick={() => setTree(null)}
                className="py-2 px-4 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium text-slate-300 transition-colors flex items-center justify-center"
              >
                <i className="fas fa-trash-alt mr-2"></i> Clear
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Visual Editor & Output */}
        <div className="lg:col-span-8 flex flex-col space-y-8">
          
          {/* Tree View */}
          <div className="bg-slate-900/50 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden min-h-[400px]">
            <div className="bg-slate-800/80 px-4 py-3 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                </div>
                {fingerprint && (
                  <div 
                    title="SHA-1 structure fingerprint. Click to copy full hash."
                    onClick={() => copyToClipboard(fingerprint)}
                    className={`flex items-center space-x-2 px-2 py-0.5 rounded bg-slate-900 border border-slate-700 cursor-pointer transition-all hover:border-sky-500 group ${isFingerprintUpdating ? 'opacity-50' : 'opacity-100'}`}
                  >
                    <i className="fas fa-fingerprint text-[10px] text-sky-400"></i>
                    <span className="text-[10px] mono text-slate-300 group-hover:text-sky-400">
                      {fingerprint.substring(0, 8)}
                    </span>
                  </div>
                )}
              </div>
              <span className="text-xs font-mono text-slate-400">visual_architect.v1</span>
            </div>
            
            <div className="p-6">
              {tree ? (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <TreeItem
                    node={tree}
                    level={0}
                    onToggle={handleToggle}
                    onRename={handleRename}
                    onAdd={handleAdd}
                    onDelete={handleDelete}
                  />
                </div>
              ) : (
                <div className="h-[300px] flex flex-col items-center justify-center text-slate-500 text-center">
                  <div className="bg-slate-800/50 w-20 h-20 rounded-full flex items-center justify-center mb-6">
                    <i className="fas fa-folder-tree text-3xl"></i>
                  </div>
                  <h3 className="text-xl font-semibold text-slate-300 mb-2">No Project Loaded</h3>
                  <p className="max-w-xs text-sm">Use the AI prompt on the left to generate a structure or start from scratch.</p>
                </div>
              )}
            </div>
          </div>

          {/* Terminal Command Output */}
          {tree && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
               <div className="bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl">
                <div className="bg-slate-800/80 px-4 py-3 border-b border-slate-700 flex items-center justify-between">
                  <span className="text-xs font-bold text-sky-400 flex items-center tracking-wider">
                    <i className="fas fa-terminal mr-2"></i> BASH COMMAND
                  </span>
                  <button 
                    onClick={() => copyToClipboard(mkdirCommand)}
                    className={`text-xs px-3 py-1 rounded-md transition-all flex items-center ${
                      copied ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                    }`}
                  >
                    <i className={`fas ${copied ? 'fa-check' : 'fa-copy'} mr-2`}></i>
                    {copied ? 'Copied!' : 'Copy to Clipboard'}
                  </button>
                </div>
                <div className="p-5 overflow-x-auto">
                  <pre className="mono text-sm leading-relaxed text-slate-300 whitespace-pre-wrap break-all selection:bg-sky-500/30">
                    <span className="text-sky-400"># Run this command in your terminal</span>{"\n"}
                    {mkdirCommand}
                  </pre>
                </div>
              </div>
              <p className="mt-4 text-slate-500 text-xs text-center italic">
                Pro tip: Double-click any folder name in the visual editor to rename it.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-auto pt-16 pb-8 text-center text-slate-500 text-sm border-t border-slate-800/50">
        <p>© {new Date().getFullYear()} MkDir Architect • Built with React & Gemini 3</p>
      </footer>
    </div>
  );
};

export default App;
