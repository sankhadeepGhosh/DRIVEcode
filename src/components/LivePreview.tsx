import React, { useState, useRef } from 'react';
import {
  RefreshCw,
  ExternalLink,
  Monitor,
  Tablet,
  Smartphone,
  Code2,
  Eye,
  FileCode,
  Check,
  Copy,
  Download,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { GeneratedProject, ProjectFile } from '../types';
import { WebsiteBuilder } from '../lib/preview/project-manager';

interface LivePreviewProps {
  project: GeneratedProject;
  onClose?: () => void;
  onUpdateFile?: (path: string, newContent: string) => void;
}

export const LivePreview: React.FC<LivePreviewProps> = ({
  project,
  onClose,
  onUpdateFile,
}) => {
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview');
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [selectedFilePath, setSelectedFilePath] = useState<string>(project.entryPoint || project.files[0]?.path || 'index.html');
  const [refreshKey, setRefreshKey] = useState(0);
  const [copiedCode, setCopiedCode] = useState(false);
  const [buildError, setBuildError] = useState<string | null>(null);

  const iframeRef = useRef<HTMLIFrameElement>(null);

  const selectedFile = project.files.find((f) => f.path === selectedFilePath) || project.files[0];
  const sandboxHtml = WebsiteBuilder.generateSandboxHtml(project.files);

  const viewportWidths = {
    desktop: 'w-full',
    tablet: 'w-[768px] max-w-full',
    mobile: 'w-[375px] max-w-full',
  };

  const handleRefresh = () => {
    setBuildError(null);
    setRefreshKey((prev) => prev + 1);
  };

  const handleCopyCode = () => {
    if (selectedFile) {
      navigator.clipboard.writeText(selectedFile.content);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleDownloadProject = () => {
    const blob = new Blob([selectedFile?.content || sandboxHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = selectedFile?.path || 'index.html';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleOpenNewTab = () => {
    const blob = new Blob([sandboxHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  return (
    <div className="flex flex-col h-full bg-[#FAF9F6] border-l border-gray-200 shadow-lg animate-in slide-in-from-right-4 duration-200">
      {/* Top Controls Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-white border-b border-gray-200/90 shrink-0">
        {/* Left: View Mode Tabs */}
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setViewMode('preview')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              viewMode === 'preview'
                ? 'bg-white text-gray-900 shadow-2xs font-bold'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Eye className="w-3.5 h-3.5 text-[#E11D48]" />
            <span>Preview</span>
          </button>
          <button
            onClick={() => setViewMode('code')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              viewMode === 'code'
                ? 'bg-white text-gray-900 shadow-2xs font-bold'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Code2 className="w-3.5 h-3.5 text-blue-600" />
            <span>Code ({project.files.length})</span>
          </button>
        </div>

        {/* Center: Device Viewport Switcher */}
        {viewMode === 'preview' && (
          <div className="hidden sm:flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setViewport('desktop')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewport === 'desktop' ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-400 hover:text-gray-700'
              }`}
              title="Desktop view"
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewport('tablet')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewport === 'tablet' ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-400 hover:text-gray-700'
              }`}
              title="Tablet view (768px)"
            >
              <Tablet className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewport('mobile')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewport === 'mobile' ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-400 hover:text-gray-700'
              }`}
              title="Mobile view (375px)"
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Right: Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleRefresh}
            className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            title="Refresh preview"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleDownloadProject}
            className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            title="Download file"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={handleOpenNewTab}
            className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            title="Open in new window"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative flex flex-col bg-[#F3F2ED]">
        {/* Preview Mode */}
        {viewMode === 'preview' && (
          <div className="flex-1 p-3 sm:p-5 flex items-center justify-center overflow-auto custom-scrollbar">
            {buildError ? (
              <div className="p-6 bg-white rounded-2xl border border-red-200 max-w-md text-center shadow-sm">
                <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
                <h4 className="font-semibold text-gray-900 text-sm mb-1">Build or Render Notice</h4>
                <p className="text-xs text-gray-500 mb-4">{buildError}</p>
                <button
                  onClick={handleRefresh}
                  className="px-4 py-2 bg-gray-900 text-white rounded-xl text-xs font-semibold hover:bg-gray-800 transition-all"
                >
                  Retry Preview
                </button>
              </div>
            ) : (
              <div
                className={`h-full transition-all duration-300 rounded-2xl overflow-hidden border border-gray-300/80 shadow-md bg-white flex flex-col ${viewportWidths[viewport]}`}
              >
                {/* Browser address bar simulation */}
                <div className="px-3 py-2 bg-gray-100/90 border-b border-gray-200 flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  </div>
                  <div className="flex-1 bg-white px-3 py-1 rounded-lg text-[11px] text-gray-400 font-mono truncate border border-gray-200/80">
                    localhost:3000/generated/{project.title || 'index.html'}
                  </div>
                  <span className="text-[10px] uppercase font-bold text-[#E11D48] bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100">
                    Live
                  </span>
                </div>

                {/* Sandboxed Safe Preview iFrame */}
                <iframe
                  key={refreshKey}
                  ref={iframeRef}
                  srcDoc={sandboxHtml}
                  title="Website Live Sandbox"
                  sandbox="allow-scripts allow-forms allow-modals allow-same-origin"
                  className="w-full flex-1 border-0 bg-white"
                  onError={() => setBuildError('Failed to initialize isolated preview sandbox.')}
                />
              </div>
            )}
          </div>
        )}

        {/* Code View Mode */}
        {viewMode === 'code' && (
          <div className="flex-1 flex flex-col sm:flex-row overflow-hidden">
            {/* File list sidebar */}
            <div className="w-full sm:w-48 bg-white border-b sm:border-b-0 sm:border-r border-gray-200 p-2 shrink-0 overflow-y-auto custom-scrollbar">
              <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-2 py-1 mb-1">
                Project Files
              </div>
              <div className="space-y-1">
                {project.files.map((file) => (
                  <button
                    key={file.path}
                    onClick={() => setSelectedFilePath(file.path)}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-left transition-all cursor-pointer ${
                      selectedFilePath === file.path
                        ? 'bg-rose-50 text-[#E11D48] font-semibold border border-rose-100'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <FileCode className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{file.path}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Code editor / viewer */}
            <div className="flex-1 flex flex-col bg-[#0F172A] text-slate-100 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 text-xs">
                <span className="font-mono text-slate-300">{selectedFile?.path || 'index.html'}</span>
                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <div className="flex-1 p-4 overflow-auto custom-scrollbar">
                <pre className="font-mono text-xs leading-relaxed text-slate-200 whitespace-pre-wrap">
                  <code>{selectedFile?.content || '<!-- No file content -->'}</code>
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
