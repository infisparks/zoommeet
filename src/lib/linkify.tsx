import React from "react";
import { ExternalLink } from "lucide-react";

/**
 * Regex to detect URLs (http, https, www)
 */
const URL_REGEX = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;

/**
 * Extracts first URL from text if present
 */
export function extractFirstUrl(text: string): string | null {
  const match = text.match(URL_REGEX);
  if (!match || match.length === 0) return null;
  let url = match[0];
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = `https://${url}`;
  }
  return url;
}

/**
 * Renders text with clickable URLs formatted cleanly
 */
export function renderWithClickableLinks(
  text: string,
  linkClassName: string = "text-sky-400 hover:text-sky-300 underline font-semibold break-all inline-flex items-center gap-0.5 hover:scale-[1.02] transition-transform"
): React.ReactNode {
  if (!text) return null;

  const parts = text.split(URL_REGEX);

  return parts.map((part, index) => {
    if (part.match(URL_REGEX)) {
      let href = part;
      if (!href.startsWith("http://") && !href.startsWith("https://")) {
        href = `https://${href}`;
      }

      return (
        <a
          key={`link-${index}`}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          className={linkClassName}
          title={`Open ${href} in new tab`}
        >
          <span>{part}</span>
          <ExternalLink className="inline-block w-3 h-3 ml-0.5 shrink-0 opacity-80" />
        </a>
      );
    }
    return <span key={`text-${index}`}>{part}</span>;
  });
}
