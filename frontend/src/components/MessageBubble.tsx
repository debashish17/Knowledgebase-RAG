import { motion } from "framer-motion";
import { Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MessageBubbleProps {
  content: string;
  isUser: boolean;
  timestamp: string;
}

export const MessageBubble = ({ content, isUser, timestamp }: MessageBubbleProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "flex gap-3 mb-4",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border",
          isUser
            ? "bg-gradient-to-br from-secondary to-primary border-secondary/50 shadow-glow-secondary"
            : "bg-glass-light border-white/20"
        )}
      >
        {isUser ? (
          <User className="h-4 w-4 text-white" />
        ) : (
          <Bot className="h-4 w-4 text-primary" />
        )}
      </div>

      {/* Message Content */}
      <div className={cn("flex flex-col max-w-[70%]", isUser ? "items-end" : "items-start")}>
        <div
          className={cn(
            "rounded-2xl px-4 py-3 backdrop-blur-glass border transition-all",
            isUser
              ? "bg-glass-light border-white/20 shadow-glass"
              : "bg-glass border-white/10"
          )}
        >
          <div className="text-sm text-foreground leading-relaxed prose prose-sm prose-invert max-w-none">
            {isUser ? (
              <p className="whitespace-pre-wrap m-0">{content}</p>
            ) : (
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                  ul: ({ children }) => <ul className="mb-2 pl-4 list-disc">{children}</ul>,
                  ol: ({ children }) => <ol className="mb-2 pl-4 list-decimal">{children}</ol>,
                  li: ({ children }) => <li className="mb-1">{children}</li>,
                  strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                  em: ({ children }) => <em className="italic">{children}</em>,
                  code: ({ children }) => <code className="bg-black/30 px-1 py-0.5 rounded text-xs">{children}</code>,
                  h1: ({ children }) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-base font-bold mb-2">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-sm font-bold mb-1">{children}</h3>,
                }}
              >
                {content}
              </ReactMarkdown>
            )}
          </div>
        </div>
        <span className="text-xs text-muted-foreground mt-1 px-1">
          {timestamp}
        </span>
      </div>
    </motion.div>
  );
};
