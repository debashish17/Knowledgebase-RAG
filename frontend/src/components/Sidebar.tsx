import { useState } from "react";
import { FolderOpen, Menu, X, ChevronLeft, ChevronRight, Upload, MessageSquare, MoreHorizontal, Share2, Trash2, Edit, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ChatItem {
  id: string;
  title: string;
  collection: string;
}

interface SidebarProps {
  chats: ChatItem[];
  selectedConversationId: string | null;
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
  onRenameChat?: (chatId: string, newTitle: string) => void;
  onDeleteChat?: (chatId: string) => void;
  onShareChat?: (chatId: string) => void;
  onDeleteAllChats?: () => void;
}

export const Sidebar = ({ 
  chats, 
  selectedConversationId, 
  onSelectChat,
  onNewChat,
  onRenameChat,
  onDeleteChat,
  onShareChat,
  onDeleteAllChats
}: SidebarProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<ChatItem | null>(null);

  const handleRename = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const chat = chats.find(c => c.id === chatId);
    if (chat && onRenameChat) {
      const newTitle = prompt("Enter new chat name:", chat.title);
      if (newTitle && newTitle.trim()) {
        onRenameChat(chatId, newTitle.trim());
      }
    }
  };

  const handleShare = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onShareChat) {
      onShareChat(chatId);
    }
  };

  const handleDelete = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const chat = chats.find(c => c.id === chatId);
    if (chat) {
      setChatToDelete(chat);
      setDeleteDialogOpen(true);
    }
  };

  const confirmDelete = () => {
    if (chatToDelete && onDeleteChat) {
      onDeleteChat(chatToDelete.id);
      setDeleteDialogOpen(false);
      setChatToDelete(null);
    }
  };

  const cancelDelete = () => {
    setDeleteDialogOpen(false);
    setChatToDelete(null);
  };

  const handleDeleteAll = () => {
    setDeleteAllDialogOpen(true);
  };

  const confirmDeleteAll = () => {
    if (onDeleteAllChats) {
      onDeleteAllChats();
      setDeleteAllDialogOpen(false);
    }
  };

  const cancelDeleteAll = () => {
    setDeleteAllDialogOpen(false);
  };

  return (
    <>
      {/* Desktop toggle button - fixed position when collapsed */}
      <AnimatePresence>
        {isCollapsed && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
          >
            <Button
              variant="ghost"
              size="icon"
              className="fixed top-4 left-4 z-50 hidden md:flex bg-glass backdrop-blur-glass border border-white/20 text-foreground hover:bg-glass-light hover:shadow-glow-primary transition-all duration-300"
              onClick={() => setIsCollapsed(false)}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile toggle button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden bg-glass backdrop-blur-glass border border-white/20 text-foreground hover:bg-glass-light hover:shadow-glow-primary transition-all duration-300"
        onClick={() => setIsOpen(!isOpen)}
      >
        <motion.div
          initial={false}
          animate={{ rotate: isOpen ? 90 : 0 }}
          transition={{ duration: 0.3 }}
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </motion.div>
      </Button>

      {/* Overlay for mobile */}
      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ 
              duration: 0.3,
              ease: "easeInOut"
            }}
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence mode="wait">
        {((isOpen || window.innerWidth >= 768) && !isCollapsed) && (
          <motion.aside
            initial={{ x: -320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -320, opacity: 0 }}
            transition={{ 
              type: "tween",
              duration: 0.3,
              ease: [0.4, 0, 0.2, 1] // Custom easing for smooth motion
            }}
            className={cn(
              "fixed md:relative inset-y-0 left-0 z-40 w-80",
              "bg-glass backdrop-blur-glass border-r border-white/20",
              "flex flex-col shadow-glass"
            )}
          >
            {/* Header */}
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-glow-primary">
                    <FolderOpen className="h-5 w-5 text-white" />
                  </div>
                  <h1 className="text-xl font-bold text-foreground">
                    Chats
                  </h1>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hidden md:flex text-foreground hover:bg-glass-light transition-all duration-300 hover:scale-110"
                  onClick={() => setIsCollapsed(true)}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
              </div>
              
              {/* New Chat Button */}
              <Button
                className="w-full bg-gradient-to-r from-primary to-secondary hover:shadow-glow-primary transition-all duration-300"
                onClick={onNewChat}
              >
                <Upload className="h-4 w-4 mr-2" />
                New Chat
              </Button>
            </div>

            {/* Chats List */}
            <ScrollArea className="flex-1 px-3 py-4">
              <div className="space-y-2">
                {chats.length === 0 ? (
                  <div className="text-center py-8 px-4">
                    <p className="text-sm text-muted-foreground">
                      No chats yet. Click "New Chat" to get started!
                    </p>
                  </div>
                ) : (
                  chats.map((chat, index) => (
                    <motion.div
                      key={chat.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ 
                        delay: index * 0.05,
                        duration: 0.3,
                        ease: "easeOut"
                      }}
                      className="group"
                    >
                      <div className={cn(
                        "rounded-xl transition-all duration-300 flex items-center justify-between",
                        "border border-transparent hover:border-white/20",
                        selectedConversationId === chat.id
                          ? "bg-glass-light border-white/20 shadow-glow-primary"
                          : "bg-glass/50 hover:bg-glass"
                      )}>
                        <button
                          onClick={() => onSelectChat(chat.id)}
                          className="flex items-start gap-3 min-w-0 overflow-hidden p-3 max-w-[calc(100%-50px)]"
                        >
                          <MessageSquare className="h-4 w-4 mt-0.5 text-primary flex-shrink-0 group-hover:scale-110 transition-transform" />
                          <div className="flex-1 min-w-0 overflow-hidden max-w-[180px]">
                            <p className="text-sm font-medium text-foreground truncate">
                              {chat.title}
                            </p>
                          </div>
                        </button>
                        
                        {/* Context Menu */}
                        <div className="flex-shrink-0 pr-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-white/10"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" side="bottom" className="w-48">
                              <DropdownMenuItem onClick={(e) => handleRename(chat.id, e)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Rename
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => handleShare(chat.id, e)}>
                                <Share2 className="h-4 w-4 mr-2" />
                                Share
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={(e) => handleDelete(chat.id, e)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </ScrollArea>

            {/* Footer */}
            <div className="p-4 border-t border-white/10">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Knowledge Base RAG System
                </p>
                
                {/* Settings Menu */}
                {chats.length > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 hover:bg-white/10"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" side="top" className="w-48">
                      <DropdownMenuItem 
                        onClick={handleDeleteAll}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash className="h-4 w-4 mr-2" />
                        Delete All Chats
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-glass backdrop-blur-glass border-white/20">
          <DialogHeader>
            <DialogTitle>Delete Chat</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{chatToDelete?.title}"? This will remove all messages in this chat. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={cancelDelete}
              className="border-white/20 hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete All Confirmation Dialog */}
      <Dialog open={deleteAllDialogOpen} onOpenChange={setDeleteAllDialogOpen}>
        <DialogContent className="bg-glass backdrop-blur-glass border-white/20">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-500">
              <Trash className="h-5 w-5" />
              Delete All Chats
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>all {chats.length} chat{chats.length !== 1 ? 's' : ''}</strong>? 
              <br /><br />
              This will permanently remove:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>All conversations and messages from MongoDB</li>
                <li>All embedded documents from ChromaDB vector store</li>
                <li>All uploaded files and their processed chunks</li>
              </ul>
              <br />
              <strong className="text-red-500">This action cannot be undone!</strong>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={cancelDeleteAll}
              className="border-white/20 hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteAll}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete All Chats
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
