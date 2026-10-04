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
  ArchiveRestore,
  Globe,
  Code2,
} from 'lucide-react';
import { Conversation, UserProfile } from '../types';
import { DriveCodeLogo } from './ui/DriveCodeLogo';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { cn } from '@/lib/utils';

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
        className={cn(
          "group/item relative flex items-center justify-between w-full rounded-xl px-2.5 py-2 text-xs transition-colors cursor-pointer select-none",
          isActive
            ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-xs border border-sidebar-border"
            : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
        )}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1 pr-1">
          {c.pinned ? (
            <Pin className="w-3.5 h-3.5 text-sky-500 shrink-0 fill-sky-500" />
          ) : c.mode === 'website' ? (
            <Code2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
          ) : c.mode === 'research' ? (
            <Globe className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          ) : (
            <MessageSquare className="w-3.5 h-3.5 text-sidebar-foreground/50 shrink-0" />
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
              className="h-6 w-full rounded border border-sky-500 bg-background px-1.5 py-0.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          ) : (
            <span className="truncate">{c.title || 'Untitled conversation'}</span>
          )}
        </div>

        {/* Action Buttons on Hover */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover/item:opacity-100 transition-opacity shrink-0">
          {isEditing ? (
            <button
              onClick={(e) => handleSaveRename(c.id, e)}
              className="p-1 text-emerald-600 hover:bg-emerald-500/10 rounded cursor-pointer"
              title="Save title"
            >
              <Check className="w-3 h-3" />
            </button>
          ) : (
            <>
              <button
                onClick={(e) => onTogglePin(c.id, e)}
                className={cn(
                  "p-1 rounded cursor-pointer hover:bg-sidebar-accent",
                  c.pinned ? "text-sky-500" : "text-sidebar-foreground/60 hover:text-sidebar-foreground"
                )}
                title={c.pinned ? 'Unpin' : 'Pin to top'}
              >
                <Pin className="w-3 h-3" />
              </button>

              <button
                onClick={(e) => handleStartRename(c, e)}
                className="p-1 rounded text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent cursor-pointer"
                title="Rename conversation"
              >
                <Edit2 className="w-3 h-3" />
              </button>

              <button
                onClick={(e) => onToggleArchive(c.id, e)}
                className="p-1 rounded text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent cursor-pointer"
                title={c.archived ? 'Restore' : 'Archive'}
              >
                {c.archived ? (
                  <ArchiveRestore className="w-3 h-3 text-sky-500" />
                ) : (
                  <Archive className="w-3 h-3" />
                )}
              </button>

              <button
                onClick={(e) => onDelete(c.id, e)}
                className="p-1 rounded text-sidebar-foreground/60 hover:text-red-500 hover:bg-red-500/10 cursor-pointer"
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
          className="w-7 h-7 rounded-full object-cover border border-sidebar-border"
          referrerPolicy="no-referrer"
        />
      );
    }
    if (profile.avatarType === 'custom' && profile.customAvatarDataUrl) {
      return (
        <img
          src={profile.customAvatarDataUrl}
          alt={profile.name}
          className="w-7 h-7 rounded-full object-cover border border-sidebar-border"
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
      <div className="w-7 h-7 rounded-full bg-sidebar-accent border border-sidebar-border flex items-center justify-center text-xs">
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
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-2xs md:hidden"
        />
      )}

      {/* Sidebar Aside Panel with shadcn design system */}
      <aside
        className={cn(
          "fixed md:static inset-y-0 left-0 z-40 w-72 bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex flex-col transition-all duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Top Header & Actions */}
        <div className="p-3.5 border-b border-sidebar-border space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DriveCodeLogo size={22} animated />
              <span className="font-serif font-bold text-sidebar-foreground tracking-wider text-base">DRIVEcode</span>
            </div>
            <button
              onClick={onClose}
              className="md:hidden p-1.5 text-sidebar-foreground/60 hover:text-sidebar-foreground rounded-lg cursor-pointer"
              aria-label="Close sidebar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* New Chat Button */}
          <Button
            onClick={onNewChat}
            variant="outline"
            className="w-full flex items-center justify-center gap-2 h-9 rounded-xl text-xs font-semibold bg-background hover:bg-sidebar-accent border-sidebar-border text-sidebar-foreground shadow-2xs hover:shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-sky-500" />
            <span>New Chat</span>
          </Button>

          {/* Instant Search Bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-sidebar-foreground/50 absolute left-2.5 top-2.5 pointer-events-none" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="h-8 pl-8 pr-3 text-xs bg-sidebar-accent/50 border-sidebar-border rounded-lg text-sidebar-foreground placeholder:text-sidebar-foreground/50 focus-visible:ring-1 focus-visible:ring-sidebar-ring"
            />
          </div>

          {/* Archived Filter Toggle */}
          <div className="flex items-center justify-between px-1 text-[11px] text-sidebar-foreground/60">
            <button
              onClick={() => setShowArchived(!showArchived)}
              className="flex items-center gap-1 hover:text-sidebar-foreground transition-colors cursor-pointer"
            >
              <Archive className="w-3 h-3" />
              <span>{showArchived ? 'View Active Chats' : 'View Archived Chats'}</span>
            </button>
            <span className="text-[10px] text-sidebar-foreground/40">{filteredConversations.length} total</span>
          </div>
        </div>

        {/* Conversation List Groups */}
        <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-4 custom-scrollbar">
          {filteredConversations.length === 0 ? (
            <div className="text-center py-8 px-4 text-sidebar-foreground/40 text-xs">
              {searchQuery ? 'No matching conversations.' : 'No conversations yet. Start a new chat!'}
            </div>
          ) : (
            <>
              {/* Pinned Group */}
              {groupedConversations.pinned.length > 0 && (
                <div className="space-y-1">
                  <div className="text-[10px] uppercase font-bold text-sidebar-foreground/50 tracking-wider px-2 mb-1 flex items-center gap-1">
                    <Pin className="w-2.5 h-2.5 text-sky-500 fill-sky-500" />
                    <span>Pinned</span>
                  </div>
                  <div className="space-y-0.5">
                    {groupedConversations.pinned.map(renderConversationItem)}
                  </div>
                </div>
              )}

              {/* Today Group */}
              {groupedConversations.today.length > 0 && (
                <div className="space-y-1">
                  <div className="text-[10px] uppercase font-bold text-sidebar-foreground/50 tracking-wider px-2 mb-1">
                    Today
                  </div>
                  <div className="space-y-0.5">
                    {groupedConversations.today.map(renderConversationItem)}
                  </div>
                </div>
              )}

              {/* Yesterday Group */}
              {groupedConversations.yesterday.length > 0 && (
                <div className="space-y-1">
                  <div className="text-[10px] uppercase font-bold text-sidebar-foreground/50 tracking-wider px-2 mb-1">
                    Yesterday
                  </div>
                  <div className="space-y-0.5">
                    {groupedConversations.yesterday.map(renderConversationItem)}
                  </div>
                </div>
              )}

              {/* Previous 7 Days */}
              {groupedConversations.previous7Days.length > 0 && (
                <div className="space-y-1">
                  <div className="text-[10px] uppercase font-bold text-sidebar-foreground/50 tracking-wider px-2 mb-1">
                    Previous 7 Days
                  </div>
                  <div className="space-y-0.5">
                    {groupedConversations.previous7Days.map(renderConversationItem)}
                  </div>
                </div>
              )}

              {/* Older Group */}
              {groupedConversations.older.length > 0 && (
                <div className="space-y-1">
                  <div className="text-[10px] uppercase font-bold text-sidebar-foreground/50 tracking-wider px-2 mb-1">
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

        {/* Footer User Profile & Settings */}
        <div className="p-3 border-t border-sidebar-border bg-sidebar space-y-2">
          {/* Guest sign-in banner if not signed in */}
          {!authUserEmail && onSignIn && (
            <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-between">
              <div className="flex flex-col min-w-0 pr-1">
                <span className="text-[11px] font-semibold text-sky-700 dark:text-sky-300">Local Guest Mode</span>
                <span className="text-[9px] text-sky-600/80 dark:text-sky-400/80">Sign in to sync across devices</span>
              </div>
              <Button
                size="sm"
                onClick={onSignIn}
                className="h-6 px-2 text-[10px] rounded-md bg-sky-500 hover:bg-sky-600 text-white font-medium"
              >
                Sign In
              </Button>
            </div>
          )}

          <div
            onClick={onOpenSettings}
            className="flex items-center justify-between p-2 rounded-xl bg-sidebar-accent/50 hover:bg-sidebar-accent border border-sidebar-border cursor-pointer transition-all group"
          >
            <div className="flex items-center gap-2 min-w-0">
              {getAvatarBadge()}
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-sidebar-foreground truncate">
                  {profile.name || 'Surya'}
                </span>
                <span className="text-[10px] text-sidebar-foreground/60 flex items-center gap-1">
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
            <Sliders className="w-3.5 h-3.5 text-sidebar-foreground/60 group-hover:text-sidebar-foreground transition-colors" />
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
