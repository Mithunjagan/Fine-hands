import { useState, useEffect, useRef } from 'react';
import { useTransactionStore } from '../store/transactionStore';
import { streamAdvice } from '../lib/api';
import { Bot, Sparkles, Send, User } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const preprocessContent = (text: string) => {
  if (!text) return "";
  let cleaned = text;

  // Replace narrow no-break space, no-break space, and zero-width spaces
  cleaned = cleaned.replace(/[\u202F\u00A0\u200B\u200A\u2009]/g, ' ');

  // Clean non-breaking hyphen U+2011 to standard hyphen
  cleaned = cleaned.replace(/\u2011/g, '-');

  // De-scramble split words
  const replacements: { [key: string]: string } = {
    "N IFT Y": "NIFTY",
    "N I F T Y": "NIFTY",
    "FMC G": "FMCG",
    "F M C G": "FMCG",
    "L TC G": "LTCG",
    "L T C G": "LTCG",
    "PP F": "PPF",
    "P PF": "PPF",
    "Y TD": "YTD",
    "Yo Y": "YoY",
    "tech ‑ n iche": "tech-niche",
    "Flex i ‑ Cap": "Flexi-Cap",
    "SE BI": "SEBI",
    "RE IT s": "REITs",
    "RE IT": "REIT",
    "Saa S": "SaaS",
    "You Tube": "YouTube",
    "Pat reon": "Patreon",
    "P ess im istic": "Pessimistic",
    "Optim istic": "Optimistic",
    "We alth": "Wealth",
    "comp ounding": "compounding",
    "Equ ity": "Equity",
    "Gov t": "Govt",
    "ill iquid": "illiquid",
    "System atic": "Systematic",
    "ce iling": "ceiling",
    "salar ied": "salaried",
    "invest able": "investable",
    "adjust ed": "adjusted",
    "Calcul ations": "Calculations",
    "Nom inal": "Nominal",
    "Infl ation": "Inflation",
    "Ass umption": "Assumption",
    "Tail ored": "Tailored",
    "devi ates": "deviates",
    "deb its": "debits",
    "consul t": "consult",
    "financ ial": "financial",
    "educat ional": "educational",
    "purp oses": "purposes",
    "provid e": "provide",
    "invest ing": "investing",
    "sav ings": "savings",
    "Emerg ency": "Emergency",
    "int erest": "interest",
    "divid end": "dividend",
    "portf olio": "portfolio",
    "allocat ion": "allocation",
    "cont rib ute": "contribute",
    "mult ip le": "multiple",
    "pleas ure": "pleasure",
    "assist ing": "assisting",
    "fut ure": "future",
    "re ‑ balance": "re-balance",
    "side ‑ income": "side-income",
    "side ‑ hustle": "side-hustle",
    "long ‑ term": "long-term",
    "short ‑ term": "short-term",
    "steady ‑ rate": "steady-rate",
    "7 ‑ yr": "7-yr",
    "FY ‑ 26": "FY-26",
    "FY ‑ 27": "FY-27",
    "3 ‑ Scenario": "3-Scenario",
    "high ‑ yield": "high-yield",
    "digital ‑ only": "digital-only",
    "tech ‑ niche": "tech-niche",
    "learn ‑ by ‑ doing": "learn-by-doing",
    "20 ‑ yr": "20-yr",
    "15 ‑ yr": "15-yr",
    "10 ‑ +": "10+",
    "10 ‑ 15": "10-15",
    "inflation ‑ adjust ed": "inflation-adjusted",
    "after ‑ tax": "after-tax",
    "equity ‑ portion": "equity-portion",
    "month ‑ wise": "month-wise",
    "risk ‑ free": "risk-free",
    "high ‑ ceiling": "high-ceiling",
    "Next ‑ Step": "Next-Step",
    "Git Hub ‑ sponsored": "GitHub-sponsored",
    "Micro ‑ controller": "Micro-controller",
    "PCB design": "PCB design",
    "You Tube series": "YouTube series",
    "Git Hub ‑ s ponsored": "GitHub-sponsored",
    "dem at": "demat",
    "ru pees": "rupees",
    "sponsorship s": "sponsorships"
  };

  // Replace each of these words (case-insensitive or exact)
  for (const [key, val] of Object.entries(replacements)) {
    const escapedKey = key.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(escapedKey.replace(/\s+/g, '\\s+'), 'gi');
    cleaned = cleaned.replace(regex, val);
  }

  // De-space numbers that got split, e.g. "3 . 2 %" or "2 0 2 6" or "1 , 0 0 , 0 0 0"
  cleaned = cleaned.replace(/(\d)\s+(\d)/g, '$1$2');
  cleaned = cleaned.replace(/(\d)\s+(\.)\s+(\d)/g, '$1$2$3');
  cleaned = cleaned.replace(/(\d)\s+%/g, '$1%');
  cleaned = cleaned.replace(/%\s+p\s*\.\s*a\s*\./g, '% p.a.');
  cleaned = cleaned.replace(/₹\s+/g, '₹');

  // Fix specific typos or garbled sequences in the text
  cleaned = cleaned.replace(/It\s+1\s+was\s+\.\s+a\s+pleasure\s+assisting\s+you\s+–\s*\.\s*If\s+3\s+you\s+have\s+any\s+more\s+questions\s+in\s+the\s+future\s*,\s*feel\s+free\s+to\s+reach\s+out/gi, "");
  cleaned = cleaned.replace(/It\s+was\s+a\s+pleasure\s+assisting\s+you\s+–\s*If\s+you\s+have\s+any\s+more\s+questions\s+in\s+the\s+future/gi, "");
  cleaned = cleaned.replace(/Set\s+pleasure\s+up\s+an\s+Emergency\s+assisting\s+Fund\s+you\s+–\s*\.\s*If\s+3\s+you\s+have\s+any\s+more\s+questions\s+in\s+the\s+future\s*,\s*feel\s+free\s+to\s+reach\s+out/gi, "Set up an Emergency Fund");
  cleaned = cleaned.replace(/Set\s+pleasure\s+up\s+an\s+Emergency\s+assisting\s+Fund\s+you\s+–\s*\./gi, "Set up an Emergency Fund");
  
  // Specific fix for the garbled emergency fund item
  cleaned = cleaned.replace(/1\s+was\s*\.\s*a\s*\*\*Set\s+pleasure\s+up\s+an\s+Emergency\s+assisting\s+Fund\s+you\s*\*\*\s*–\s*\.\s*If\s+3\s+months\s+have\s+of\s+any\s+expenses\s+more\s+in\s+questions\s+a\s+liquid\s+in\s+high\s+the\s+‑\s*yield\s+savings\s*,\s*account\s+feel\s*\(\s*≈\s*free\s+₹\s+to\s+3\s+L\s*\.\s*\)\s*\./gi, 
                            "1. **Set up an Emergency Fund** - Keep 3 months of expenses in a liquid high-yield savings account (≈ ₹3 L).");

  cleaned = cleaned.replace(/1\s+was\s*\.\s*a\s*\*\*Set\s+pleasure\s+up\s+an\s+Emergency\s+assisting\s+Fund\s+you\s*\*\*\s*–\s*\.\s*If\s+3\s+months/gi,
                            "1. **Set up an Emergency Fund** - Keep 3 months");

  cleaned = cleaned.replace(/feel\s+free\s+to\s+reach\s+out\s+this\s+is\s+for\s+educational\s+purposes\s+only/gi, "");

  return cleaned;
};

const parseInlineMarkdown = (text: string): React.ReactNode[] => {
  if (!text) return [];

  const tokens: { type: 'text' | 'bold' | 'code' | 'italic'; content: string }[] = [];
  let i = 0;
  
  while (i < text.length) {
    // Bold **
    if (text.startsWith('**', i)) {
      const endIdx = text.indexOf('**', i + 2);
      if (endIdx !== -1) {
        tokens.push({ type: 'bold', content: text.substring(i + 2, endIdx) });
        i = endIdx + 2;
        continue;
      }
    }
    
    // Code `
    if (text.startsWith('`', i)) {
      const endIdx = text.indexOf('`', i + 1);
      if (endIdx !== -1) {
        tokens.push({ type: 'code', content: text.substring(i + 1, endIdx) });
        i = endIdx + 1;
        continue;
      }
    }

    // Italic *
    if (text.startsWith('*', i)) {
      const endIdx = text.indexOf('*', i + 1);
      if (endIdx !== -1) {
        tokens.push({ type: 'italic', content: text.substring(i + 1, endIdx) });
        i = endIdx + 1;
        continue;
      }
    }

    // Normal text character
    if (tokens.length > 0 && tokens[tokens.length - 1].type === 'text') {
      tokens[tokens.length - 1].content += text[i];
    } else {
      tokens.push({ type: 'text', content: text[i] });
    }
    i++;
  }

  return tokens.map((token, idx) => {
    if (token.type === 'bold') {
      return <strong key={idx} className="font-extrabold text-purple-300">{token.content}</strong>;
    }
    if (token.type === 'code') {
      return <code key={idx} className="px-1.5 py-0.5 rounded bg-gray-950/80 border border-gray-800 text-purple-300 font-mono text-xs">{token.content}</code>;
    }
    if (token.type === 'italic') {
      return <span key={idx} className="italic text-gray-300/90">{token.content}</span>;
    }
    return token.content;
  });
};

interface Block {
  type: 'header' | 'table' | 'list' | 'paragraph' | 'hr' | 'empty';
  level?: number;
  lines: string[];
}

const isSeparatorRow = (row: string) => {
  return /^[|\s-:]+$/.test(row) && row.includes('-');
};

const parseMarkdownBlocks = (text: string): Block[] => {
  const lines = text.split('\n');
  const blocks: Block[] = [];
  let currentBlock: Block | null = null;

  lines.forEach((line) => {
    const trimmed = line.trim();

    if (trimmed === '') {
      if (currentBlock) {
        blocks.push(currentBlock);
        currentBlock = null;
      }
      blocks.push({ type: 'empty', lines: [''] });
      return;
    }

    if (trimmed === '---' || trimmed === '***') {
      if (currentBlock) {
        blocks.push(currentBlock);
        currentBlock = null;
      }
      blocks.push({ type: 'hr', lines: [trimmed] });
      return;
    }

    if (trimmed.startsWith('#')) {
      if (currentBlock) {
        blocks.push(currentBlock);
        currentBlock = null;
      }
      const match = trimmed.match(/^(#{1,6})\s+(.*)$/);
      if (match) {
        blocks.push({
          type: 'header',
          level: match[1].length,
          lines: [match[2]],
        });
      } else {
        blocks.push({ type: 'paragraph', lines: [line] });
      }
      return;
    }

    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      if (currentBlock && currentBlock.type !== 'table') {
        blocks.push(currentBlock);
        currentBlock = null;
      }
      if (!currentBlock) {
        currentBlock = { type: 'table', lines: [] };
      }
      currentBlock.lines.push(line);
      return;
    }

    const isBullet = /^(?:\*|-|•)\s+(.*)$/.test(trimmed);
    const isNumbered = /^(?:\d+️⃣?|\d+\s*️⃣?)\s*\.\s*(.*)$/.test(trimmed) || /^\d+\s*️⃣?\s+(.*)$/.test(trimmed) || /^\d+\s*\.\s*(.*)$/.test(trimmed);
    if (isBullet || isNumbered) {
      if (currentBlock && currentBlock.type !== 'list') {
        blocks.push(currentBlock);
        currentBlock = null;
      }
      if (!currentBlock) {
        currentBlock = { type: 'list', lines: [] };
      }
      currentBlock.lines.push(line);
      return;
    }

    if (currentBlock && currentBlock.type !== 'paragraph') {
      blocks.push(currentBlock);
      currentBlock = null;
    }
    if (!currentBlock) {
      currentBlock = { type: 'paragraph', lines: [] };
    }
    currentBlock.lines.push(line);
  });

  if (currentBlock) {
    blocks.push(currentBlock);
  }

  return blocks;
};

const renderHeader = (line: string, level: number, blockIndex: number) => {
  const text = parseInlineMarkdown(line);
  if (level === 1) {
    return <h2 key={blockIndex} className="text-lg font-black mt-5 mb-2.5 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-fuchsia-400 tracking-tight">{text}</h2>;
  }
  if (level === 2) {
    return <h3 key={blockIndex} className="text-sm font-extrabold mt-4 mb-2 text-white flex items-center gap-2 border-b border-gray-800 pb-1.5">{text}</h3>;
  }
  return <h4 key={blockIndex} className="text-xs font-bold mt-3.5 mb-1.5 text-purple-300">{text}</h4>;
};

const renderTable = (lines: string[], blockIndex: number) => {
  const dataRows = lines.filter(row => !isSeparatorRow(row));
  if (dataRows.length === 0) return null;

  const headerCells = dataRows[0].split('|').slice(1, -1).map(c => c.trim());
  const bodyRows = dataRows.slice(1).map(row => row.split('|').slice(1, -1).map(c => c.trim()));

  return (
    <div key={`table-${blockIndex}`} className="my-3.5 overflow-x-auto rounded-xl border border-gray-800 bg-gray-950/60 backdrop-blur-md">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="border-b border-gray-800 bg-gray-900/40">
            {headerCells.map((cell, idx) => (
              <th key={idx} className="p-2.5 font-semibold text-purple-400">
                {parseInlineMarkdown(cell)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-850">
          {bodyRows.map((row, rowIdx) => (
            <tr key={rowIdx} className="hover:bg-gray-900/10 transition-colors">
              {row.map((cell, cellIdx) => (
                <td key={cellIdx} className="p-2.5 text-gray-300 font-medium">
                  {parseInlineMarkdown(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const renderList = (lines: string[], blockIndex: number) => {
  const items = lines.map((line, idx) => {
    const trimmed = line.trim();
    const bulletMatch = trimmed.match(/^(?:\*|-|•)\s+(.*)$/);
    if (bulletMatch) {
      return (
        <li key={idx} className="text-sm text-gray-300 flex items-start gap-2 leading-relaxed">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2 flex-shrink-0" />
          <span className="flex-1">{parseInlineMarkdown(bulletMatch[1])}</span>
        </li>
      );
    }
    const numberMatch = trimmed.match(/^(?:\d+️⃣?|\d+\s*️⃣?)\s*\.\s*(.*)$/) || trimmed.match(/^\d+\s*️⃣?\s+(.*)$/) || trimmed.match(/^\d+\s*\.\s*(.*)$/);
    if (numberMatch) {
      const prefixMatch = trimmed.match(/^([^\s.]+)/);
      const prefix = prefixMatch ? prefixMatch[1] : `${idx + 1}`;
      const listContent = numberMatch[1];
      const hasEmoji = prefix.includes('️⃣') || prefix.includes('️') || prefix.includes('⃣');
      return (
        <li key={idx} className="text-sm text-gray-300 flex items-start gap-2.5 leading-relaxed">
          <span className="font-bold text-purple-400 flex-shrink-0">{prefix}{hasEmoji ? "" : "."}</span>
          <span className="flex-1">{parseInlineMarkdown(listContent)}</span>
        </li>
      );
    }
    return (
      <li key={idx} className="text-sm text-gray-300 leading-relaxed">
        {parseInlineMarkdown(trimmed)}
      </li>
    );
  });

  return (
    <ul key={blockIndex} className="my-3 space-y-2 pl-1">
      {items}
    </ul>
  );
};

const renderEmpty = (blockIndex: number) => {
  return <div key={`empty-${blockIndex}`} className="h-1.5" />;
};

const renderHR = (blockIndex: number) => {
  return <hr key={`hr-${blockIndex}`} className="my-3 border-gray-800" />;
};

const renderParagraph = (lines: string[], blockIndex: number) => {
  const paragraphText = lines.join('\n');
  
  const isTakeaway = paragraphText.trim().toLowerCase().startsWith('take away :') || paragraphText.trim().toLowerCase().startsWith('takeaway:');
  const isAssumption = paragraphText.trim().toLowerCase().startsWith('assumption:');
  const isInflation = paragraphText.trim().toLowerCase().startsWith('inflation:');
  const isBottomLine = paragraphText.trim().toLowerCase().startsWith('bottom line -') || paragraphText.trim().toLowerCase().startsWith('bottom line:');
  
  if (isTakeaway || isAssumption || isInflation || isBottomLine) {
    let title = "Insight";
    let icon = "💡";
    let bg = "bg-purple-950/20 border-purple-800/40";
    let textColor = "text-purple-300";
    
    if (isTakeaway) {
      title = "Takeaway";
      icon = "🎯";
      bg = "bg-blue-950/20 border-blue-800/40";
      textColor = "text-blue-300";
    } else if (isAssumption) {
      title = "Assumption";
      icon = "📋";
      bg = "bg-amber-950/20 border-amber-800/40";
      textColor = "text-amber-300";
    } else if (isInflation) {
      title = "Inflation Note";
      icon = "📈";
      bg = "bg-rose-950/20 border-rose-800/40";
      textColor = "text-rose-300";
    } else if (isBottomLine) {
      title = "Bottom Line";
      icon = "👑";
      bg = "bg-emerald-950/20 border-emerald-800/40";
      textColor = "text-emerald-300";
    }
    
    const cleanText = paragraphText.replace(/^(?:take\s*away\s*:\s*|takeaway\s*:\s*|assumption\s*:\s*\*?|inflation\s*:\s*\*?|bottom\s*line\s*-\s*\*?|bottom\s*line\s*:\s*\*?)/i, '');
    
    return (
      <div key={`callout-${blockIndex}`} className={`my-3 p-3.5 rounded-xl border ${bg} backdrop-blur-md flex items-start gap-2.5`}>
        <span className="text-base flex-shrink-0 mt-0.5">{icon}</span>
        <div className="flex-1">
          <div className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${textColor}`}>{title}</div>
          <div className="text-xs text-gray-200 leading-relaxed">{parseInlineMarkdown(cleanText)}</div>
        </div>
      </div>
    );
  }

  return (
    <p key={blockIndex} className="text-xs leading-relaxed mb-2 text-gray-200">
      {parseInlineMarkdown(paragraphText)}
    </p>
  );
};

const renderFormattedContent = (content: string) => {
  if (!content) return null;

  const cleanedContent = preprocessContent(content);
  const blocks = parseMarkdownBlocks(cleanedContent);

  return (
    <div className="space-y-1">
      {blocks.map((block, index) => {
        switch (block.type) {
          case 'header':
            return renderHeader(block.lines[0], block.level || 3, index);
          case 'table':
            return renderTable(block.lines, index);
          case 'list':
            return renderList(block.lines, index);
          case 'paragraph':
            return renderParagraph(block.lines, index);
          case 'hr':
            return renderHR(index);
          case 'empty':
            return renderEmpty(index);
          default:
            return null;
        }
      })}
    </div>
  );
};

const AIAdvisor = () => {
  const { transactions } = useTransactionStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const getFallbackAdvice = (userQuery: string) => {
    const qClean = userQuery.toLowerCase().trim().replace(/[^\w\s]/g, '');
    if (['hi', 'hello', 'hey', 'hey there', 'namaste', 'greetings', 'yo', 'sup'].includes(qClean)) {
      return `👋 **Hey there!** I'm **The Money Doctor**, your personal financial health advisor. Let's optimize your wealth! What would you like to ask today? 🚀`;
    }
    if (transactions.length === 0) return "You haven't logged any transactions yet. Start tracking to get personalized advice!";
    const topCategory = transactions[0]?.category || 'spending';
    return `It looks like you've been spending on ${topCategory} recently. Keeping an eye on these recurring expenses is a great way to stay within budget.`;
  };

  const handleSend = async () => {
    if (!query.trim()) return;
    
    const userMsg = query.trim();
    setQuery('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }, { role: 'assistant', content: '' }]);
    setLoading(true);

    const onToken = (token: string) => {
      setMessages(prev => {
        if (prev.length === 0) return prev;
        const lastIdx = prev.length - 1;
        const last = prev[lastIdx];
        if (last.role === 'assistant') {
          const updatedLast = { ...last, content: last.content + token };
          return [...prev.slice(0, lastIdx), updatedLast];
        }
        return prev;
      });
    };

    const onDone = () => setLoading(false);
    
    const onError = (error: string) => {
      console.warn("API Error, using fallback", error);
      setMessages(prev => {
        if (prev.length === 0) return prev;
        const lastIdx = prev.length - 1;
        const last = prev[lastIdx];
        if (last.role === 'assistant') {
          const updatedLast = { ...last, content: getFallbackAdvice(userMsg) };
          return [...prev.slice(0, lastIdx), updatedLast];
        }
        return prev;
      });
      setLoading(false);
    };

    abortControllerRef.current = streamAdvice(
      transactions,
      800, // mock health score for now
      2,
      20,
      userMsg,
      onToken,
      onDone,
      onError
    );
  };

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-6 h-full flex flex-col relative z-10 overflow-hidden backdrop-blur-md">
      <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/10 rounded-full blur-[80px] -mr-16 -mt-16 pointer-events-none"></div>
      
      <div className="flex items-center gap-4 mb-4 relative z-10">
        <div className="p-2.5 bg-gradient-to-br from-purple-500/20 to-fuchsia-600/20 rounded-xl border border-purple-500/30">
          <Bot className="w-5 h-5 text-purple-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">The Money Doctor</h2>
          <p className="text-xs text-purple-300/70 flex items-center gap-1"><Sparkles className="w-3 h-3"/> AI Advisor</p>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto mb-4 pr-2 space-y-4 relative z-10">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full opacity-50 space-y-3">
            <Bot className="w-8 h-8 text-purple-400 opacity-50" />
            <p className="text-sm text-gray-300 text-center">Ready to analyze your spending DNA.<br/>Ask me anything!</p>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 border border-purple-500/30">
                  <Bot className="w-4 h-4 text-purple-400" />
                </div>
              )}
              <div className={`px-4 py-2.5 rounded-2xl max-w-[80%] text-sm ${
                msg.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-tr-sm whitespace-pre-wrap' 
                  : 'bg-gray-800 text-gray-200 rounded-tl-sm border border-gray-700'
              }`}>
                {msg.role === 'assistant' ? renderFormattedContent(msg.content) : msg.content}
                {loading && i === messages.length - 1 && msg.role === 'assistant' && (
                  <span className="inline-block w-1.5 h-3 ml-1 bg-purple-400 animate-pulse"></span>
                )}
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 border border-blue-500/30">
                  <User className="w-4 h-4 text-blue-400" />
                </div>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="relative z-10 flex gap-2">
        <input 
          type="text" 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask about your finances..."
          className="flex-1 bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-purple-500 outline-none"
        />
        <button 
          onClick={handleSend}
          disabled={loading || !query.trim()}
          className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white p-2.5 rounded-xl transition-colors flex items-center justify-center"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default AIAdvisor;
