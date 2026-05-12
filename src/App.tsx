import React, { useState, useMemo, DragEvent, FormEvent } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { ThemeProvider, useTheme } from './hooks/useTheme';
import { useAlbums, usePhotos, uploadPhoto, createAlbum, togglePhotoFavorite, deletePhoto } from './hooks/useFirestore';
import { 
  Image as ImageIcon, 
  Plus, 
  Search, 
  Grid, 
  Folder, 
  Heart, 
  Settings, 
  LogOut, 
  Sun, 
  Moon, 
  Menu,
  X,
  PlusCircle,
  Upload,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Trash2,
  Download,
  Filter,
  Loader2,
  LogIn
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { Photo, Album } from './types';

// Components
function Navbar({ 
  onOpenUpload, 
  searchQuery, 
  setSearchQuery,
  toggleSidebar,
  isSidebarOpen
}: { 
  onOpenUpload: () => void; 
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  toggleSidebar: () => void;
  isSidebarOpen: boolean;
}) {
  const { user, login, logout, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-20 md:h-24 bg-background/95 backdrop-blur-md border-b border-border flex items-center justify-between px-6 md:px-10">
      <div className="flex items-center gap-4">
        <button 
          onClick={toggleSidebar}
          className="p-2 hover:bg-accent rounded-full text-foreground transition-colors md:hidden"
        >
          {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <div className="flex items-center gap-2 md:hidden">
          <h1 className="text-xl font-serif italic tracking-tight">Lumière</h1>
        </div>
      </div>

      <div className="flex-1 max-w-xl mx-4 relative group hidden md:block">
        <Search className="absolute left-0 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-foreground transition-colors" size={16} />
        <input 
          type="text" 
          placeholder="Search your collection..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-10 pl-8 bg-transparent border-none focus:ring-0 text-sm text-foreground placeholder:text-muted-foreground/50"
        />
      </div>

      <div className="flex items-center gap-4 md:gap-8">
        {user && (
          <button 
            onClick={onOpenUpload}
            className="text-sm font-medium border-b border-foreground pb-0.5 hover:opacity-70 transition-opacity hidden md:block"
          >
            Upload New
          </button>
        )}

        <button 
          onClick={toggleTheme}
          className="p-2 hover:bg-accent rounded-full transition-colors text-muted-foreground hover:text-foreground"
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {loading ? (
          <Loader2 className="animate-spin text-muted-foreground" size={20} />
        ) : user ? (
          <div className="flex items-center gap-2 md:gap-3">
            <img 
              src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} 
              alt={user.displayName || ''} 
              className="w-10 h-10 rounded-full border border-border"
            />
          </div>
        ) : (
          <button 
            onClick={login}
            className="text-sm font-medium border-b border-foreground pb-0.5 hover:opacity-70 transition-opacity"
          >
            Login
          </button>
        )}
      </div>
    </nav>
  );
}

function Sidebar({ 
  isOpen, 
  onClose,
  activeAlbum, 
  setActiveAlbum,
  albums,
  onCreateAlbum
}: { 
  isOpen: boolean; 
  onClose: () => void;
  activeAlbum: string | null;
  setActiveAlbum: (id: string | null) => void;
  albums: Album[];
  onCreateAlbum: () => void;
}) {
  const { logout } = useAuth();
  const menuItems = [
    { id: null, label: 'All Photos', icon: Grid },
    { id: 'favorites', label: 'Favorites', icon: Heart },
  ];

  return (
    <aside className={cn(
      "fixed left-0 top-0 bottom-0 w-64 bg-background border-r border-border p-8 z-[60] transition-transform duration-300 md:translate-x-0 flex flex-col",
      isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
    )}>
      <div className="mb-12">
        <h1 className="text-2xl font-serif italic tracking-tight mb-1">Lumière</h1>
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60">Visual Archive</p>
      </div>

      <div className="flex-1 space-y-10">
        <section>
          <h2 className="text-[11px] uppercase tracking-widest text-muted-foreground mb-4">Library</h2>
          <div className="space-y-3">
            {menuItems.map((item) => (
              <button
                key={item.id ?? 'all'}
                onClick={() => setActiveAlbum(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 text-sm font-medium transition-all group",
                  activeAlbum === item.id ? "text-foreground" : "text-muted-foreground/60 hover:text-foreground"
                )}
              >
                <div className={cn(
                  "w-1.5 h-1.5 rounded-full transition-all",
                  activeAlbum === item.id ? "bg-foreground scale-100" : "bg-transparent scale-0 group-hover:scale-100 group-hover:bg-muted-foreground"
                )} />
                {item.label}
              </button>
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[11px] uppercase tracking-widest text-muted-foreground">Albums</h2>
            <button 
              onClick={onCreateAlbum}
              className="p-1 hover:bg-accent rounded-full transition-colors text-muted-foreground hover:text-foreground"
            >
              <Plus size={14} />
            </button>
          </div>
          <div className="space-y-3 max-h-[40vh] overflow-y-auto custom-scrollbar">
            {albums.map((album) => (
              <button
                key={album.id}
                onClick={() => setActiveAlbum(album.id)}
                className={cn(
                  "w-full text-left text-sm font-medium transition-colors truncate block",
                  activeAlbum === album.id ? "text-foreground" : "text-muted-foreground/60 hover:text-foreground"
                )}
              >
                {album.title}
              </button>
            ))}
            {albums.length === 0 && (
              <p className="text-xs text-muted-foreground/40 italic">No albums created</p>
            )}
          </div>
        </section>
      </div>

      {isOpen && (
        <button 
          onClick={onClose}
          className="md:hidden absolute top-8 right-4 p-2 hover:bg-accent rounded-full"
        >
          <X size={20} />
        </button>
      )}

      <div className="mt-auto">
        <button 
          onClick={logout}
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-destructive transition-colors"
        >
          <LogOut size={14} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}

const PhotoCard: React.FC<{ photo: Photo, onClick: () => void }> = ({ photo, onClick }) => {
  return (
    <motion.div 
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="masonry-item group relative bg-muted overflow-hidden cursor-pointer"
      onClick={onClick}
    >
      <img 
        src={photo.url} 
        alt={photo.title}
        className="w-full h-auto object-cover transition-transform duration-1000 group-hover:scale-105"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-6">
        <h3 className="text-white font-serif italic text-lg leading-tight">{photo.title || 'Untitled'}</h3>
        <p className="text-white/70 text-[10px] uppercase tracking-widest mt-2">{photo.tags?.join(' · ') || 'Snapshot'}</p>
        {photo.isFavorite && <Heart size={14} className="fill-white text-white absolute top-6 right-6" />}
      </div>
    </motion.div>
  );
}

function UploadModal({ isOpen, onClose, onUpload, albums }: { isOpen: boolean, onClose: () => void, onUpload: (data: any) => void, albums: Album[] }) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({ title: '', description: '', albumId: '', tags: '' });

  const handleDrag = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFile = (selectedFile: File) => {
    setFile(selectedFile);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(selectedFile);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    onUpload({ file, ...formData });
    onClose();
    // Reset
    setFile(null);
    setPreview(null);
    setFormData({ title: '', description: '', albumId: '', tags: '' });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 10 }}
            className="relative w-full max-w-2xl bg-card border border-border shadow-2xl rounded-none overflow-hidden"
          >
            <div className="p-8 border-b border-border flex items-center justify-between">
              <h2 className="text-2xl font-serif italic">Upload Photograph</h2>
              <button onClick={onClose} className="p-2 hover:bg-accent transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div 
                className={cn(
                  "relative aspect-video border border-dashed flex flex-col items-center justify-center transition-all overflow-hidden",
                  dragActive ? "border-foreground bg-accent" : "border-border hover:border-muted-foreground",
                  preview && "border-none"
                )}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                {preview ? (
                  <>
                    <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                    <button 
                      type="button"
                      onClick={() => { setFile(null); setPreview(null); }}
                      className="absolute top-4 right-4 p-2 bg-black/60 text-white hover:bg-black transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </>
                ) : (
                  <>
                    <Upload className="text-muted-foreground mb-4" size={24} />
                    <p className="text-xs uppercase tracking-widest font-medium text-center">Drop file here, or <label className="text-foreground cursor-pointer underline">browse
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
                    </label></p>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground/40 mt-2">Maximum size 5MB</p>
                  </>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Title</label>
                  <input 
                    type="text" 
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="E.g. Parthenon Shadows" 
                    className="w-full h-12 px-0 bg-transparent border-b border-border rounded-none text-sm focus:border-foreground transition-colors outline-none text-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Album</label>
                  <select 
                    value={formData.albumId}
                    onChange={(e) => setFormData({...formData, albumId: e.target.value})}
                    className="w-full h-12 px-0 bg-transparent border-b border-border rounded-none text-sm focus:border-foreground transition-colors outline-none text-foreground"
                  >
                    <option value="">No Album</option>
                    {albums.map(album => (
                      <option key={album.id} value={album.id}>{album.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Description</label>
                <textarea 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Capture the narrative..." 
                  className="w-full h-24 py-3 bg-transparent border-b border-border rounded-none text-sm focus:border-foreground transition-colors outline-none resize-none text-foreground"
                />
              </div>

              <button 
                type="submit"
                disabled={!file}
                className="w-full h-14 bg-foreground text-background font-bold text-xs uppercase tracking-widest hover:opacity-90 disabled:opacity-20 transition-all mt-4"
              >
                Save to Archive
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function PhotoViewer({ photo, onClose, next, prev, onToggleFavorite, onDelete }: { 
  photo: Photo | null, 
  onClose: () => void, 
  next?: () => void, 
  prev?: () => void,
  onToggleFavorite: (id: string) => void,
  onDelete: (id: string) => void
}) {
  return (
    <AnimatePresence>
      {photo && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-0 md:p-12">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-background/98 backdrop-blur-xl"
          />
          
          <div className="absolute top-0 left-0 right-0 h-24 flex items-center justify-between px-8 z-10 text-foreground">
            <div className="flex items-center gap-12">
              <button 
                onClick={onClose}
                className="group flex items-center gap-3 text-xs uppercase tracking-widest font-bold"
              >
                <X size={18} className="group-hover:rotate-90 transition-transform" />
                <span>Close</span>
              </button>
              <div className="hidden lg:block border-l border-border pl-12">
                <h2 className="text-2xl font-serif italic">{photo.title || 'Untitled'}</h2>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">
                  Captured {photo.createdAt && (photo.createdAt as any).seconds ? new Date((photo.createdAt as any).seconds * 1000).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }) : 'Recently'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <button 
                onClick={() => onToggleFavorite(photo.id)}
                className={cn("p-2 transition-colors", photo.isFavorite ? "text-red-500" : "text-muted-foreground hover:text-foreground")}
              >
                <Heart size={20} className={photo.isFavorite ? "fill-current" : ""} />
              </button>
              <button 
                onClick={() => window.open(photo.url, '_blank')}
                className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                title="Download"
              >
                <Download size={20} />
              </button>
              <button 
                onClick={() => onDelete(photo.id)}
                className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                title="Delete"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>

          <motion.div 
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="relative max-w-full max-h-full flex items-center justify-center p-4"
          >
            <img 
              src={photo.url} 
              alt={photo.title} 
              className="max-w-full max-h-[75vh] object-contain shadow-[0_40px_100px_-20px_rgba(0,0,0,0.2)]"
            />
          </motion.div>

          {prev && (
            <button 
              onClick={(e) => { e.stopPropagation(); prev(); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-4 bg-white/5 hover:bg-white/10 text-white rounded-full transition-colors hidden md:block"
            >
              <ChevronLeft size={32} />
            </button>
          )}
          {next && (
            <button 
              onClick={(e) => { e.stopPropagation(); next(); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-4 bg-white/5 hover:bg-white/10 text-white rounded-full transition-colors hidden md:block"
            >
              <ChevronRight size={32} />
            </button>
          )}
        </div>
      )}
    </AnimatePresence>
  );
}

function CreateAlbumModal({ isOpen, onClose, onCreate }: { isOpen: boolean, onClose: () => void, onCreate: (title: string, desc: string) => void }) {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title) return;
    onCreate(title, desc);
    onClose();
    setTitle('');
    setDesc('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="relative w-full max-w-md bg-card border border-border shadow-2xl p-8 rounded-none">
            <h2 className="text-2xl font-serif italic mb-6">New Collection</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-2 block">Album Title</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="E.g. Athenian Summer" className="w-full h-12 px-0 bg-transparent border-b border-border focus:border-foreground outline-none text-foreground transition-colors" required />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-2 block">Description (optional)</label>
                <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Curate the vision..." className="w-full h-24 py-3 bg-transparent border-b border-border focus:border-foreground outline-none text-foreground resize-none transition-colors" />
              </div>
              <button type="submit" disabled={!title} className="w-full h-14 bg-foreground text-background font-bold text-xs uppercase tracking-widest transition-all hover:opacity-90 disabled:opacity-20 mt-4">Create Collection</button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function LoadingScreen() {
  return (
    <div className="h-screen flex flex-col items-center justify-center bg-background">
      <motion.div 
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="text-center"
      >
        <h1 className="text-3xl font-serif italic tracking-tighter mb-2">Lumière</h1>
        <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-medium">Archiving your vision...</p>
      </motion.div>
    </div>
  );
}

function MainContent() {
  const { user, loading: authLoading, login } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeAlbum, setActiveAlbum] = useState<string | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isAlbumModalOpen, setIsAlbumModalOpen] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Firestore Data
  const { albums, loading: albumsLoading } = useAlbums();
  const { photos, loading: photosLoading } = usePhotos(activeAlbum);

  const filteredPhotos = useMemo(() => {
    if (!photos) return [];
    return photos.filter(photo => {
      const q = searchQuery.toLowerCase();
      return (photo.title?.toLowerCase().includes(q) || 
              photo.tags?.some((t: string) => t.toLowerCase().includes(q)) ||
              photo.description?.toLowerCase().includes(q));
    });
  }, [photos, searchQuery]);

  const handleUpload = async (data: any) => {
    setIsUploading(true);
    try {
      await uploadPhoto(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreateAlbum = async (title: string, desc: string) => {
    await createAlbum(title, desc);
  };

  if (authLoading) return <LoadingScreen />;

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none select-none overflow-hidden flex flex-wrap gap-20 p-20">
           {Array.from({length: 20}).map((_, i) => (
             <span key={i} className="text-9xl font-serif italic">Lumière</span>
           ))}
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-xl relative z-10"
        >
          <div className="mb-12">
            <h1 className="text-7xl md:text-9xl font-serif italic tracking-tighter mb-4">Lumière</h1>
            <p className="text-xs md:text-sm uppercase tracking-[0.4em] text-muted-foreground font-medium">The Minimalist Visual Archive</p>
          </div>
          
          <div className="space-y-8">
            <p className="text-lg text-muted-foreground/80 font-medium leading-relaxed italic border-x border-border/30 px-8">
              "Photography is the only language that can be understood anywhere in the world."
            </p>
            
            <button 
              onClick={login}
              className="px-12 py-5 bg-foreground text-background font-bold text-sm uppercase tracking-[0.2em] hover:opacity-90 transition-all shadow-2xl"
            >
              Enter the Archive
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar 
        onOpenUpload={() => setIsUploadOpen(true)} 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
      />
            <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)}
        activeAlbum={activeAlbum}
        setActiveAlbum={(id) => { setActiveAlbum(id); setIsSidebarOpen(false); }}
        albums={albums}
        onCreateAlbum={() => setIsAlbumModalOpen(true)}
      />
      <main className="pt-28 pb-12 px-6 md:px-10 md:ml-64 transition-all overflow-hidden min-h-screen">
        <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <motion.h2 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-4xl md:text-5xl lg:text-6xl font-serif italic tracking-tight"
            >
              {activeAlbum === 'favorites' ? 'Favorite Gems' : activeAlbum ? albums.find(a => a.id === activeAlbum)?.title : 'Visual Archive'}
            </motion.h2>
            <p className="text-muted-foreground text-sm flex items-center gap-3">
              <span className="uppercase tracking-widest text-[10px] font-semibold text-foreground">
                {photosLoading ? 'Syncing...' : `${filteredPhotos.length} photographs`}
              </span>
              <span className="w-1 h-1 rounded-full bg-border" />
              <span>{activeAlbum ? (albums.find(a => a.id === activeAlbum)?.description || 'Curated Collection') : 'Your personal collection'}</span>
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex border border-border rounded-full p-1">
               <button className="px-4 py-1.5 text-[10px] uppercase tracking-widest font-bold bg-foreground text-background rounded-full transition-all">Grid</button>
               <button className="px-4 py-1.5 text-[10px] uppercase tracking-widest font-bold text-muted-foreground hover:text-foreground transition-all">List</button>
            </div>
            <button className="p-2 border border-border rounded-full text-muted-foreground hover:text-foreground hover:border-foreground transition-all">
              <Filter size={16} />
            </button>
          </div>
        </header>

        {photosLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="aspect-[3/4] bg-muted animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : filteredPhotos.length > 0 ? (
          <div className="masonry-grid relative">
            {isUploading && (
              <div className="masonry-item aspect-square bg-muted/50 rounded-2xl flex flex-col items-center justify-center border-2 border-dashed border-primary/20 animate-pulse">
                <Loader2 className="animate-spin text-primary mb-2" size={24} />
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Uploading...</span>
              </div>
            )}
            {filteredPhotos.map((photo, index) => (
              <PhotoCard 
                key={photo.id} 
                photo={photo} 
                onClick={() => setSelectedPhotoIndex(index)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 bg-muted/50 rounded-3xl flex items-center justify-center mb-6">
              <PlusCircle className="text-muted-foreground/50" size={32} />
            </div>
            <h3 className="text-2xl font-bold">Start your collection</h3>
            <p className="text-muted-foreground max-w-xs mx-auto mt-2 mb-8">
              Upload your first photo to see it here. You can also organize them into beautiful albums.
            </p>
            <button 
              onClick={() => setIsUploadOpen(true)}
              className="px-8 py-3 bg-primary text-primary-foreground rounded-full font-bold hover:scale-[1.02] transition-transform"
            >
              Upload Photo
            </button>
          </div>
        )}
        <footer className="mt-20 py-8 border-t border-border flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-muted-foreground/40 font-medium">
          <div className="flex gap-6">
            <span>Syncing Complete</span>
            <span>Cloud Secure</span>
          </div>
          <div>
             &copy; {new Date().getFullYear()} Lumière Archive
          </div>
        </footer>
      </main>

      <UploadModal 
        isOpen={isUploadOpen} 
        onClose={() => setIsUploadOpen(false)} 
        onUpload={handleUpload}
        albums={albums}
      />

      <CreateAlbumModal 
        isOpen={isAlbumModalOpen}
        onClose={() => setIsAlbumModalOpen(false)}
        onCreate={handleCreateAlbum}
      />

      <PhotoViewer 
        photo={selectedPhotoIndex !== null ? filteredPhotos[selectedPhotoIndex] : null}
        onClose={() => setSelectedPhotoIndex(null)}
        next={() => setSelectedPhotoIndex((prev) => (prev !== null && prev < filteredPhotos.length - 1) ? prev + 1 : 0)}
        prev={() => setSelectedPhotoIndex((prev) => (prev !== null && prev > 0) ? prev - 1 : filteredPhotos.length - 1)}
        onToggleFavorite={(id) => {
          const p = filteredPhotos.find(ph => ph.id === id);
          if (p) togglePhotoFavorite(id, p.isFavorite);
        }}
        onDelete={(id) => {
          if (window.confirm('Are you sure you want to delete this photo forever?')) {
            const p = photos.find(ph => ph.id === id);
            deletePhoto(id, (p as any).storagePath, p?.albumId);
          }
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <MainContent />
      </ThemeProvider>
    </AuthProvider>
  );
}
