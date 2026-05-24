"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { CodeBlock } from "./CodeBlock";

interface MarkdownContentProps {
  content: string;
  isStreaming?: boolean;
}

export function MarkdownContent({ content, isStreaming }: MarkdownContentProps) {
  if (!content && isStreaming) {
    return <span className="inline-block h-4 w-1 animate-pulse bg-foreground/60" />;
  }

  return (
    <div className="prose prose-sm prose-zinc dark:prose-invert max-w-none break-words [&_pre]:m-0 [&_pre]:bg-transparent [&_pre]:p-0">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          pre({ children }) {
            return <>{children}</>;
          },
          code({ className, children, ...props }) {
            const isBlock =
              className?.includes("language-") ||
              String(children).includes("\n");
            if (isBlock) {
              return (
                <CodeBlock className={className}>{children}</CodeBlock>
              );
            }
            return (
              <code
                className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em]"
                {...props}
              >
                {children}
              </code>
            );
          },
          a({ href, children }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline-offset-4 hover:underline"
              >
                {children}
              </a>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
      {isStreaming && (
        <span className="ml-0.5 inline-block h-4 w-1 animate-pulse bg-foreground/60 align-middle" />
      )}
    </div>
  );
}
