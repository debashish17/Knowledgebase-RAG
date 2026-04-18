import { useState, useRef, forwardRef, useImperativeHandle, useEffect } from "react";
import { Send, Paperclip, Loader2, Plus, FileText, Link2, ClipboardList } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type StudyAction = 'summarize' | 'study-links' | 'quiz';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  onUploadFiles?: (files: FileList, collectionName: string) => Promise<void>;
  selectedCollection?: string | null;
  hasDocument?: boolean;
  onStudyAction?: (action: StudyAction) => void;
}

export interface ChatInputRef {
  openUploadDialog: () => void;
}

export const ChatInput = forwardRef<ChatInputRef, ChatInputProps>(
  ({ onSendMessage, onUploadFiles, selectedCollection, hasDocument, onStudyAction }, ref) => {
    const [message, setMessage] = useState("");
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [uploadFiles, setUploadFiles] = useState<FileList | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [showActions, setShowActions] = useState(false);
    const actionsRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    // Close popover when clicking outside
    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (actionsRef.current && !actionsRef.current.contains(e.target as Node)) {
          setShowActions(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Expose method to open upload dialog
    useImperativeHandle(ref, () => ({
      openUploadDialog: () => {
        setIsUploadOpen(true);
      },
    }));

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (message.trim()) {
        onSendMessage(message);
        setMessage("");
      }
    };

    const handleFileClick = () => {
      setIsUploadOpen(true);
    };

  const handleUpload = async () => {
    if (uploadFiles && onUploadFiles) {
      const collectionName = selectedCollection || `chat_${Date.now()}`;
      setIsUploading(true);
      try {
        await onUploadFiles(uploadFiles, collectionName);
        setIsUploadOpen(false);
        setUploadFiles(null);
      } finally {
        setIsUploading(false);
      }
    }
  };

  return (
    <>
      <div className="sticky bottom-0 p-4 bg-background/80 backdrop-blur-glass border-t border-white/10">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div className="relative flex items-center gap-2 bg-glass backdrop-blur-glass border border-white/20 rounded-2xl p-2 shadow-glass hover:border-white/30 transition-all group">

            {/* + Actions button with popover */}
            <div ref={actionsRef} className="relative">
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => setShowActions(prev => !prev)}
                className={cn(
                  "rounded-xl text-muted-foreground hover:text-foreground hover:bg-glass-light transition-all",
                  showActions && "text-foreground bg-glass-light"
                )}
                title="Study actions"
              >
                <Plus className="h-4 w-4" />
              </Button>

              {showActions && (
                <div className="absolute bottom-12 left-0 z-50 w-52 flex flex-col gap-1 p-2 rounded-xl bg-[#1a1a2e]/95 backdrop-blur-xl border border-white/20 shadow-2xl">
                  {[
                    { action: 'summarize' as StudyAction, label: 'Summarize', icon: FileText },
                    { action: 'study-links' as StudyAction, label: 'Get Study Links', icon: Link2 },
                    { action: 'quiz' as StudyAction, label: 'Generate Quiz', icon: ClipboardList },
                  ].map(({ action, label, icon: Icon }) => (
                    <button
                      key={action}
                      type="button"
                      onClick={() => {
                        setShowActions(false);
                        if (!hasDocument) {
                          toast({ title: "No document uploaded", description: "Please upload a document before using study tools.", variant: "destructive" });
                          return;
                        }
                        onStudyAction?.(action);
                      }}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition-all text-left"
                    >
                      <Icon className="h-4 w-4 flex-shrink-0 text-primary" />
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={handleFileClick}
              className="rounded-xl text-muted-foreground hover:text-foreground hover:bg-glass-light transition-all"
              title="Upload documents"
            >
              <Paperclip className="h-4 w-4" />
            </Button>

            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message…"
              className={cn(
                "flex-1 bg-transparent border-0 text-foreground placeholder:text-muted-foreground",
                "focus-visible:ring-0 focus-visible:ring-offset-0 px-4"
              )}
            />
            <Button
              type="submit"
              size="icon"
              disabled={!message.trim()}
              className={cn(
                "rounded-xl bg-gradient-to-br from-primary to-secondary",
                "hover:shadow-glow-primary disabled:opacity-50 disabled:shadow-none",
                "transition-all group-hover:scale-105"
              )}
            >
              <Send className="h-4 w-4 text-white" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2">
            Press Enter to send • Click 📎 to upload • Click + for study tools
          </p>
        </form>
      </div>

      {/* Upload Dialog */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Documents</DialogTitle>
            <DialogDescription>
              Select PDF or DOCX files to add to your knowledge base
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="file-upload">Select Files</Label>
              <Input
                id="file-upload"
                type="file"
                accept=".pdf,.docx,.doc"
                multiple
                ref={fileInputRef}
                onChange={(e) => setUploadFiles(e.target.files)}
              />
              {uploadFiles && uploadFiles.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  {uploadFiles.length} file(s) selected
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Files will be added to your current chat's knowledge base
              </p>
            </div>
            <Button
              onClick={handleUpload}
              disabled={!uploadFiles || isUploading}
              className="w-full"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                `Upload ${uploadFiles && uploadFiles.length > 1 ? `${uploadFiles.length} Files` : 'File'}`
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
});

ChatInput.displayName = "ChatInput";
