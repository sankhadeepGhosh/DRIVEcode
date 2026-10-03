import React, { useState, useMemo } from 'react';
import {
  MessageSquare,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Pin,
  Archive,
  Search,
  Sliders,
  ChevronDown,
  ArchiveRestore,
  Sparkles,
  Globe,
  Code2,
  User,
} from 'lucide-react';
import { Conversation, AIModelId, EffortLevel, UserProfile } from '../types';

interface SidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  onRename: (id: string, newTitle: string) => void;
  onTogglePin: (id: string, e: React.MouseEvent) => void;
  onToggleArchive: (id: string, e: React.MouseEvent) => void;
  onOpenSettings: () => void;
  isOpen: boolean;
  onClose: () => void;
  profile?: UserProfile;
  authUserEmail?: string;
  onSignIn?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeId,
  onSelect,
  onNewChat,
  onDelete,
  onRename,
  onTogglePin,
  onToggleArchive,
  onOpenSettings,
  isOpen,
  onClose,
  profile = { name: 'Surya', avatarType: 'preset', presetId: 'anime' },
  authUserEmail,
  onSignIn,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  // Filter conversations
  const filteredConversations = useMemo(() => {
    return conversations.filter((c) => {
      // Archive visibility toggle
      if (showArchived) {
        if (!c.archived) return false;
      } else {
        if (c.archived) return false;
      }

      // Search match
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      return (
        c.title.toLowerCase().includes(query) ||
        c.messages.some((m) => m.content.toLowerCase().includes(query))
      );
    });
  }, [conversations, searchQuery, showArchived]);

  // Date grouping
  const groupedConversations = useMemo(() => {
    const today: Conversation[] = [];
    const yesterday: Conversation[] = [];
    const previous7Days: Conversation[] = [];
    const older: Conversation[] = [];

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterdayStart = todayStart - 86400000;
    const sevenDaysStart = todayStart - 86400000 * 7;

    // Pinned first
    const pinned: Conversation[] = [];
    const unpinned: Conversation[] = [];

    filteredConversations.forEach((c) => {
      if (c.pinned) pinned.push(c);
      else unpinned.push(c);
    });

    unpinned.forEach((c) => {
      const time = new Date(c.updatedAt || c.createdAt).getTime();
      if (time >= todayStart) {
        today.push(c);
      } else if (time >= yesterdayStart) {
        yesterday.push(c);
      } else if (time >= sevenDaysStart) {
        previous7Days.push(c);
      } else {
        older.push(c);
      }
    });

    return { pinned, today, yesterday, previous7Days, older };
  }, [filteredConversations]);

  const handleStartRename = (c: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(c.id);
    setEditTitle(c.title);
  };

  const handleSaveRename = (id: string, e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      onRename(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const renderConversationItem = (c: Conversation) => {
    const isActive = c.id === activeId;
    const isEditing = c.id === editingId;

    return (
      <div
        key={c.id}
        onClick={() => onSelect(c.id)}
        className={`group relative flex items-center justify-between px-2.5 py-2 rounded-xl text-xs cursor-pointer transition-all ${
          isActive
            ? 'bg-[var(--rose-surface)] shadow-xs font-semibold text-[var(--rose-text)] border border-[var(--rose-border)]'
            : 'text-[var(--rose-text-muted)] hover:bg-[var(--rose-surface)]/60 hover:text-[var(--rose-text)]'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
          {c.pinned ? (
            <Pin className="w-3.5 h-3.5 text-[#E11D48] shrink-0 fill-[#E11D48]" />
          ) : c.mode === 'website' ? (
            <Code2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
          ) : c.mode === 'research' ? (
            <Globe className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          ) : (
            <MessageSquare className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          )}

          {isEditing ? (
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveRename(c.id, e);
                if (e.key === 'Escape') setEditingId(null);
              }}
              autoFocus
              onClick={(e) => e.stopPropagation()}
              className="bg-white px-1.5 py-0.5 rounded border border-[#E11D48] text-xs w-full text-gray-900 focus:outline-none"
            />
          ) : (
            <span className="truncate text-xs">{c.title || 'Untitled conversation'}</span>
          )}
        </div>

        {/* Action Buttons on Hover */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {isEditing ? (
            <button
              onClick={(e) => handleSaveRename(c.id, e)}
              className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
            >
              <Check className="w-3 h-3" />
            </button>
          ) : (
            <>
              <button
                onClick={(e) => onTogglePin(c.id, e)}
                className={`p-1 rounded hover:bg-gray-100 ${
                  c.pinned ? 'text-[#E11D48]' : 'text-gray-400 hover:text-gray-700'
                }`}
                title={c.pinned ? 'Unpin' : 'Pin to top'}
              >
                <Pin className="w-3 h-3" />
              </button>

              <button
                onClick={(e) => handleStartRename(c, e)}
                className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded"
                title="Rename conversation"
              >
                <Edit2 className="w-3 h-3" />
              </button>

              <button
                onClick={(e) => onToggleArchive(c.id, e)}
                className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded"
                title={c.archived ? 'Restore' : 'Archive'}
              >
                {c.archived ? (
                  <ArchiveRestore className="w-3 h-3 text-blue-500" />
                ) : (
                  <Archive className="w-3 h-3" />
                )}
              </button>

              <button
                onClick={(e) => onDelete(c.id, e)}
                className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                title="Delete conversation"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  const getAvatarBadge = () => {
    if (profile.avatarType === 'google' && profile.googleAvatarUrl) {
      return (
        <img
          src={profile.googleAvatarUrl}
          alt={profile.name}
          className="w-7 h-7 rounded-full object-cover border border-gray-200"
          referrerPolicy="no-referrer"
        />
      );
    }
    if (profile.avatarType === 'custom' && profile.customAvatarDataUrl) {
      return (
        <img
          src={profile.customAvatarDataUrl}
          alt={profile.name}
          className="w-7 h-7 rounded-full object-cover border border-gray-200"
        />
      );
    }
    const icons = {
      anime: '✨',
      gradient: '🌅',
      minimal: '🌿',
      robot: '🤖',
      initials: '👤',
    };
    return (
      <div className="w-7 h-7 rounded-full bg-rose-100 border border-rose-200 flex items-center justify-center text-xs">
        {icons[profile.presetId] || '👤'}
      </div>
    );
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-30 bg-black/20 backdrop-blur-2xs md:hidden"
        />
      )}

      {/* Sidebar Aside Panel */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-72 bg-[var(--rose-sidebar)] border-r border-[var(--rose-border)] flex flex-col transition-all duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Top Header & New Chat Action */}
        <div className="p-3.5 border-b border-[var(--rose-border)] space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-serif font-bold text-[var(--rose-text)] tracking-wider text-base">DRIVEcode</span>
            </div>
            <button
              onClick={onClose}
              className="md:hidden p-1.5 text-[var(--rose-text-muted)] hover:text-[var(--rose-text)] rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={onNewChat}
            className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 bg-[var(--rose-surface)] hover:bg-[var(--rose-surface)]/80 border border-[var(--rose-border)] rounded-xl text-xs font-semibold text-[var(--rose-text)] shadow-2xs hover:shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#E11D48]" />
            <span>New Chat</span>
          </button>

          {/* Instant Search Bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[var(--rose-text-muted)] absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-8 pr-3 py-1.5 bg-[var(--rose-surface)]/70 border border-[var(--rose-border)] rounded-lg text-xs text-[var(--rose-text)] placeholder:text-[var(--rose-text-muted)] focus:outline-none focus:bg-[var(--rose-surface)] focus:border-[var(--rose-accent)]"
            />
          </div>

          {/* Archived Filter Toggle */}
          <div className="flex items-center justify-between px-1 text-[11px] text-gray-500">
            <button
              onClick={() => setShowArchived(!showArchived)}
              className="flex items-center gap-1 hover:text-gray-900 transition-colors cursor-pointer"
            >
              <Archive className="w-3 h-3" />
              <span>{showArchived ? 'View Active Chats' : 'View Archived Chats'}</span>
            </button>
            <span className="text-[10px] text-gray-400">{filteredConversations.length} total</span>
          </div>
        </div>

        {/* Conversation List Groups */}
        <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-4 custom-scrollbar">
          {filteredConversations.length === 0 ? (
            <div className="text-center py-8 px-4 text-gray-400 text-xs">
              {searchQuery ? 'No matching conversations.' : 'No conversations yet. Start a new chat!'}
            </div>
          ) : (
            <>
              {/* Pinned Group */}
              {groupedConversations.pinned.length > 0 && (
                <div>
                  <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider px-2 mb-1 flex items-center gap-1">
                    <Pin className="w-2.5 h-2.5 text-[#E11D48]" />
                    <span>Pinned</span>
                  </div>
                  <div className="space-y-0.5">
                    {groupedConversations.pinned.map(renderConversationItem)}
                  </div>
                </div>
              )}

              {/* Today Group */}
              {groupedConversations.today.length > 0 && (
                <div>
                  <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider px-2 mb-1">
                    Today
                  </div>
                  <div className="space-y-0.5">
                    {groupedConversations.today.map(renderConversationItem)}
                  </div>
                </div>
              )}

              {/* Yesterday Group */}
              {groupedConversations.yesterday.length > 0 && (
                <div>
                  <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider px-2 mb-1">
                    Yesterday
                  </div>
                  <div className="space-y-0.5">
                    {groupedConversations.yesterday.map(renderConversationItem)}
                  </div>
                </div>
              )}

              {/* Previous 7 Days */}
              {groupedConversations.previous7Days.length > 0 && (
                <div>
                  <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider px-2 mb-1">
                    Previous 7 Days
                  </div>
                  <div className="space-y-0.5">
                    {groupedConversations.previous7Days.map(renderConversationItem)}
                  </div>
                </div>
              )}

              {/* Older Group */}
              {groupedConversations.older.length > 0 && (
                <div>
                  <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider px-2 mb-1">
                    Older
                  </div>
                  <div className="space-y-0.5">
                    {groupedConversations.older.map(renderConversationItem)}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer User Profile & Settings Button */}
        <div className="p-3 border-t border-[var(--rose-border)] bg-[var(--rose-sidebar)] space-y-2">
          {/* Guest sign-in banner if not signed in */}
          {!authUserEmail && onSignIn && (
            <div className="p-2 rounded-xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40 flex items-center justify-between">
              <div className="flex flex-col min-w-0 pr-1">
                <span className="text-[11px] font-semibold text-rose-800 dark:text-rose-200">Local Guest Mode</span>
                <span className="text-[9px] text-rose-600/80 dark:text-rose-300/80">Sign in to sync across devices</span>
              </div>
              <button
                type="button"
                onClick={onSignIn}
                className="px-2 py-1 rounded-lg bg-[#E11D48] hover:bg-[#BE123C] text-white text-[10px] font-semibold shrink-0 cursor-pointer shadow-xs transition-colors"
              >
                Sign In
              </button>
            </div>
          )}

          <div
            onClick={onOpenSettings}
            className="flex items-center justify-between p-2 rounded-xl bg-[var(--rose-surface)] hover:bg-[var(--rose-surface)]/80 border border-[var(--rose-border)] cursor-pointer transition-all"
          >
            <div className="flex items-center gap-2 min-w-0">
              {getAvatarBadge()}
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-[var(--rose-text)] truncate">
                  {profile.name || 'Surya'}
                </span>
                <span className="text-[10px] text-[var(--rose-text-muted)] flex items-center gap-1">
                  {authUserEmail ? (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                      <span className="truncate">Cloud Synced</span>
                    </>
                  ) : (
                    <span>Personal Workspace</span>
                  )}
                </span>
              </div>
            </div>
            <Sliders className="w-3.5 h-3.5 text-[var(--rose-text-muted)]" />
          </div>
        </div>
      </aside>
    </>
  );
};
