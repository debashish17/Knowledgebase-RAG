import { useState, useRef, forwardRef, useImperativeHandle } from "react";
import { Send, Paperclip } from "lucide-react";
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

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  onUploadFiles?: (files: FileList, collectionName: string) => void;
  selectedCollection?: string | null;
}

export interface ChatInputRef {
  openUploadDialog: () => void;
}

export const ChatInput = forwardRef<ChatInputRef, ChatInputProps>(
  ({ onSendMessage, onUploadFiles, selectedCollection }, ref) => {
    const [message, setMessage] = useState("");
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [uploadFiles, setUploadFiles] = useState<FileList | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleUpload = () => {
    if (uploadFiles && onUploadFiles) {
      // Use existing collection or auto-generate new one
      const collectionName = selectedCollection || `chat_${Date.now()}`;
      onUploadFiles(uploadFiles, collectionName);
      setIsUploadOpen(false);
      setUploadFiles(null);
    }
  };

  return (
    <>
      <div className="sticky bottom-0 p-4 bg-background/80 backdrop-blur-glass border-t border-white/10">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div className="relative flex items-center gap-2 bg-glass backdrop-blur-glass border border-white/20 rounded-2xl p-2 shadow-glass hover:border-white/30 transition-all group">
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
            Press Enter to send • Click 📎 to upload documents
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
              disabled={!uploadFiles}
              className="w-full"
            >
              Upload {uploadFiles && uploadFiles.length > 1 ? `${uploadFiles.length} Files` : 'File'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
});

ChatInput.displayName = "ChatInput";
