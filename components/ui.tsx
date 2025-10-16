import React, { ReactNode } from 'react';

export const Card: React.FC<{ children: ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-white shadow-md rounded-lg p-6 ${className}`}>
    {children}
  </div>
);

// Fix: Updated Button component to accept all standard button attributes (like 'title')
// by extending React.ComponentPropsWithoutRef<'button'>. This makes the component more flexible and robust.
export const Button: React.FC<
  {
    children: ReactNode;
    variant?: 'primary' | 'secondary' | 'danger';
  } & React.ComponentPropsWithoutRef<'button'>
> = ({ children, variant = 'primary', className = '', type = 'button', ...props }) => {
  const baseClasses = 'inline-flex items-center gap-2 px-4 py-2 rounded-md font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
  const variantClasses = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500',
    secondary: 'bg-slate-200 text-slate-800 hover:bg-slate-300 focus:ring-slate-400',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  };
  return (
    <button type={type} className={`${baseClasses} ${variantClasses[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

export const Tag: React.FC<{ children: ReactNode; color?: string; className?: string }> = ({ children, color = 'bg-slate-100 text-slate-600', className = '' }) => (
  <span className={`px-2 py-1 text-xs font-medium rounded-full ${color} ${className}`}>
    {children}
  </span>
);

export const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: ReactNode }> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold text-slate-800">{title}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800">
            <XIcon />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

const markdownToHtml = (markdown: string): { __html: string } => {
    if (!markdown) return { __html: '' };

    let html = markdown
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\n/g, '<br />')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-indigo-600 hover:underline">$1</a>');

    // Handle bullet points
    const lines = html.split('<br />');
    let inList = false;
    const processedLines = lines.map(line => {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
            const itemContent = trimmedLine.substring(2);
            if (!inList) {
                inList = true;
                return `<ul><li>${itemContent}</li>`;
            } else {
                return `<li>${itemContent}</li>`;
            }
        } else {
            if (inList) {
                inList = false;
                return `</ul>${line}`;
            }
            return line;
        }
    });

    if (inList) {
        processedLines.push('</ul>');
    }

    return { __html: processedLines.join('').replace(/<\/li><li>/g, '</li><li>') };
};


export const MarkdownRenderer: React.FC<{ content: string; className?: string }> = ({ content, className = '' }) => {
    return <div className={className} dangerouslySetInnerHTML={markdownToHtml(content)} />;
};


// Icons
export const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
  </svg>
);

export const ArchiveIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z" />
        <path fillRule="evenodd" d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" />
    </svg>
);

export const ChevronDownIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
);

export const XIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

export const UsersIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21v-1a6 6 0 00-5.176-5.97M15 21h6m-6-1a6 6 0 00-5.176-5.97m-3.201 1.956A5.97 5.97 0 0112 15a5.97 5.97 0 013.201 1.03m-6.402 0A5.97 5.97 0 0012 15a5.97 5.97 0 003.201-1.03m-6.402 0A5.97 5.97 0 016 15a5.97 5.97 0 013.201-1.03m0 0A5.97 5.97 0 0112 13a5.97 5.97 0 013.201 1.97m-6.402 0A5.97 5.97 0 0012 13a5.97 5.97 0 003.201 1.97" />
    </svg>
);

// Fix: Updated ClipboardListIcon to accept a className prop to allow for custom sizing and styling.
export const ClipboardListIcon = ({ className = 'h-5 w-5' }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
);

export const CheckCircleIcon = ({className = 'h-5 w-5 text-green-500'}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
);

export const CogIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

export const PencilIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
        <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
    </svg>
);

export const SearchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
    </svg>
);

export const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
    </svg>
);

export const DownloadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 9.707a1 1 0 011.414 0L9 11.086V3a1 1 0 112 0v8.086l1.293-1.379a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
);

export const SparklesIcon = ({ className = 'h-5 w-5' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1.158A3.001 3.001 0 017.158 7H6a1 1 0 01-1-1V4a1 1 0 011-1h1a1 1 0 011 1v2h1.158A3.001 3.001 0 0113 5.158V4a1 1 0 011-1h1a1 1 0 011 1v1a1 1 0 01-1 1h-1.158A3.001 3.001 0 0110.842 7H12a1 1 0 011 1v2a1 1 0 01-1 1h-1a1 1 0 01-1-1V8h-1.158A3.001 3.001 0 017 10.842V12a1 1 0 01-1 1H4a1 1 0 01-1-1v-1a1 1 0 011-1h1.158A3.001 3.001 0 017.158 7H6a1 1 0 01-1-1V4a1 1 0 011-1zm10.293 8.293a1 1 0 011.414 0l1 1a1 1 0 01-1.414 1.414l-1-1a1 1 0 010-1.414zM11 15a1 1 0 112 0 1 1 0 01-2 0z" clipRule="evenodd" />
    </svg>
);