import { useState, useEffect, useRef } from 'react';
import { Plus, Search, ArrowLeft, Trash2, Pin, MoreVertical } from 'lucide-react';
import { useApp } from '@/lib/appContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  isPinned: boolean;
}

const NOTES_STORAGE_KEY = 'safecalc-notes-disguise';

function loadNotesFromStorage(): Note[] {
  try {
    const saved = localStorage.getItem(NOTES_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.map((note: any) => ({
        ...note,
        createdAt: new Date(note.createdAt),
        updatedAt: new Date(note.updatedAt),
      }));
    }
  } catch (e) {
    console.warn('Failed to load notes:', e);
  }
  return [];
}

function saveNotesToStorage(notes: Note[]) {
  try {
    localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
  } catch (e) {
    console.warn('Failed to save notes:', e);
  }
}

export function NotesDisguise() {
  const { 
    normalPassword, 
    distressPassword, 
    authenticate,
    triggerSOS,
    sosActive,
    silentMode: globalSilentMode 
  } = useApp();

  const [notes, setNotes] = useState<Note[]>(() => loadNotesFromStorage());

  useEffect(() => {
    saveNotesToStorage(notes);
  }, [notes]);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  
  const listRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ fingers: number; y: number } | null>(null);

  // Check for secret triggers in search
  useEffect(() => {
    if (searchQuery.toUpperCase() === 'HELP911') {
      authenticate(normalPassword); // Authenticate with normal password to go to dashboard
    }
  }, [searchQuery, authenticate, normalPassword]);

  // Check for URGENT keyword in note content (SOS trigger)
  useEffect(() => {
    if (newContent.includes('URGENT')) {
      triggerSOS(); // This automatically navigates to sos-active screen
    }
  }, [newContent, triggerSOS]);

  // Handle three-finger swipe detection
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length >= 3) {
      touchStartRef.current = {
        fingers: e.touches.length,
        y: e.touches[0].clientY,
      };
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartRef.current && touchStartRef.current.fingers >= 3) {
      const endY = e.changedTouches[0].clientY;
      const deltaY = endY - touchStartRef.current.y;
      
      // Three-finger swipe down (at least 100px)
      if (deltaY > 100) {
        authenticate(normalPassword);
      }
    }
    touchStartRef.current = null;
  };

  // Check for secret note titles when saving
  const handleSaveNote = () => {
    const trimmedTitle = newTitle.trim();
    
    // Secret trigger: "Emergency Access"
    if (trimmedTitle.toLowerCase() === 'emergency access') {
      authenticate(normalPassword);
      return;
    }
    
    // PIN in title - normal password
    if (trimmedTitle === normalPassword) {
      authenticate(normalPassword);
      return;
    }
    
    // PIN in title - distress password (silent SOS)
    if (trimmedTitle === distressPassword) {
      authenticate(distressPassword); // Triggers silent SOS via context
      // Stay on notes app but SOS is active in background
      setNewTitle('');
      setNewContent('');
      setIsCreating(false);
      return;
    }

    // Normal note save
    if (editingNote) {
      setNotes(prev => prev.map(n => 
        n.id === editingNote.id 
          ? { ...n, title: newTitle, content: newContent, updatedAt: new Date() }
          : n
      ));
    } else if (trimmedTitle || newContent.trim()) {
      const newNote: Note = {
        id: Date.now().toString(),
        title: trimmedTitle || 'Untitled',
        content: newContent,
        createdAt: new Date(),
        updatedAt: new Date(),
        isPinned: false,
      };
      setNotes(prev => [newNote, ...prev]);
    }

    setEditingNote(null);
    setIsCreating(false);
    setNewTitle('');
    setNewContent('');
  };

  const handleDeleteNote = (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
    if (editingNote?.id === id) {
      setEditingNote(null);
      setIsCreating(false);
    }
  };

  const handleTogglePin = (id: string) => {
    setNotes(prev => prev.map(n => 
      n.id === id ? { ...n, isPinned: !n.isPinned } : n
    ));
  };

  const openNote = (note: Note) => {
    setEditingNote(note);
    setNewTitle(note.title);
    setNewContent(note.content);
    setIsCreating(true);
  };

  const createNewNote = () => {
    setEditingNote(null);
    setNewTitle('');
    setNewContent('');
    setIsCreating(true);
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const filteredNotes = notes.filter(note => 
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pinnedNotes = filteredNotes.filter(n => n.isPinned);
  const otherNotes = filteredNotes.filter(n => !n.isPinned);

  // Note editor view
  if (isCreating) {
    return (
      <div className="min-h-screen bg-notes-bg flex flex-col">
        {/* Silent SOS indicator */}
        {sosActive && globalSilentMode && (
          <div className="fixed top-0 left-0 w-1 h-1 bg-emergency opacity-0" aria-hidden />
        )}

        {/* Header */}
        <div className="bg-notes-card border-b border-notes-border px-4 py-3 flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => {
              setIsCreating(false);
              setEditingNote(null);
              setNewTitle('');
              setNewContent('');
            }}
            className="text-notes-text hover:bg-notes-hover"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          <Button 
            variant="ghost"
            onClick={handleSaveNote}
            className="text-notes-accent font-semibold hover:bg-notes-hover"
          >
            Save
          </Button>
        </div>

        {/* Editor */}
        <div className="flex-1 p-4 space-y-4">
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Title"
            className="text-xl font-semibold border-none bg-transparent text-notes-text placeholder:text-notes-muted focus-visible:ring-0 px-0"
          />
          <Textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="Start typing..."
            className="flex-1 min-h-[60vh] border-none bg-transparent text-notes-text placeholder:text-notes-muted focus-visible:ring-0 resize-none px-0"
          />
        </div>

        {/* Footer */}
        <div className="bg-notes-card border-t border-notes-border px-4 py-2 text-center">
          <span className="text-xs text-notes-muted">
            {editingNote ? `Edited ${formatDate(editingNote.updatedAt)}` : 'New Note'}
          </span>
        </div>
      </div>
    );
  }

  // Notes list view
  return (
    <div 
      ref={listRef}
      className="min-h-screen bg-notes-bg flex flex-col"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Silent SOS indicator */}
      {sosActive && globalSilentMode && (
        <div className="fixed top-0 left-0 w-1 h-1 bg-emergency opacity-0" aria-hidden />
      )}

      {/* Header */}
      <div className="bg-notes-card border-b border-notes-border px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-notes-text">Notes</h1>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setIsSearching(!isSearching)}
            className="text-notes-text hover:bg-notes-hover"
          >
            <Search className="w-5 h-5" />
          </Button>
        </div>
        
        {isSearching && (
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes..."
            className="bg-notes-hover border-none text-notes-text placeholder:text-notes-muted"
            autoFocus
          />
        )}
      </div>

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {pinnedNotes.length > 0 && (
          <>
            <p className="text-xs font-semibold text-notes-muted uppercase tracking-wider px-1">
              Pinned
            </p>
            {pinnedNotes.map(note => (
              <NoteCard 
                key={note.id} 
                note={note} 
                onOpen={openNote}
                onDelete={handleDeleteNote}
                onTogglePin={handleTogglePin}
                formatDate={formatDate}
              />
            ))}
          </>
        )}
        
        {otherNotes.length > 0 && (
          <>
            {pinnedNotes.length > 0 && (
              <p className="text-xs font-semibold text-notes-muted uppercase tracking-wider px-1 mt-4">
                Notes
              </p>
            )}
            {otherNotes.map(note => (
              <NoteCard 
                key={note.id} 
                note={note} 
                onOpen={openNote}
                onDelete={handleDeleteNote}
                onTogglePin={handleTogglePin}
                formatDate={formatDate}
              />
            ))}
          </>
        )}

        {filteredNotes.length === 0 && (
          <div className="text-center py-12">
            <p className="text-notes-muted">No notes found</p>
          </div>
        )}
      </div>

      {/* FAB - Create Note */}
      <button
        onClick={createNewNote}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-notes-accent text-notes-accent-foreground shadow-lg flex items-center justify-center hover:opacity-90 transition-opacity"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Footer */}
      <div className="bg-notes-card border-t border-notes-border px-4 py-3 text-center">
        <span className="text-sm text-notes-muted">{notes.length} Notes</span>
      </div>
    </div>
  );
}

// Note Card Component
function NoteCard({ 
  note, 
  onOpen, 
  onDelete, 
  onTogglePin,
  formatDate 
}: { 
  note: Note; 
  onOpen: (note: Note) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string) => void;
  formatDate: (date: Date) => string;
}) {
  const [showMenu, setShowMenu] = useState(false);

  const excerpt = note.content.slice(0, 80) + (note.content.length > 80 ? '...' : '');

  return (
    <div 
      className="bg-notes-card rounded-xl p-4 shadow-sm border border-notes-border relative"
      onClick={() => onOpen(note)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {note.isPinned && <Pin className="w-3 h-3 text-notes-accent" />}
            <h3 className="font-semibold text-notes-text truncate">{note.title}</h3>
          </div>
          <p className="text-sm text-notes-muted line-clamp-2 mb-2">{excerpt}</p>
          <span className="text-xs text-notes-muted">{formatDate(note.updatedAt)}</span>
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          className="text-notes-muted hover:bg-notes-hover -mr-2 -mt-1"
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
        >
          <MoreVertical className="w-4 h-4" />
        </Button>
      </div>

      {showMenu && (
        <div 
          className="absolute right-2 top-12 bg-notes-card border border-notes-border rounded-lg shadow-lg z-10 py-1 min-w-[140px]"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="w-full px-4 py-2 text-left text-sm text-notes-text hover:bg-notes-hover flex items-center gap-2"
            onClick={() => {
              onTogglePin(note.id);
              setShowMenu(false);
            }}
          >
            <Pin className="w-4 h-4" />
            {note.isPinned ? 'Unpin' : 'Pin'}
          </button>
          <button
            className="w-full px-4 py-2 text-left text-sm text-emergency hover:bg-notes-hover flex items-center gap-2"
            onClick={() => {
              onDelete(note.id);
              setShowMenu(false);
            }}
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
