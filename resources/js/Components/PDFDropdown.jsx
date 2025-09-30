import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function PDFDropdown({ downloadUrls, suratTugasId, size = "default", className = "" }) {
  const [isOpen, setIsOpen] = useState(false);

  const pdfOptions = [
    { key: 'utama', label: 'Unduh PDF Utama', route: downloadUrls?.utama },
    { key: 'pic', label: 'Unduh PDF PIC', route: downloadUrls?.pic },
    { key: 'trainer', label: 'Unduh PDF Trainer', route: downloadUrls?.trainer },
    { key: 'pendamping', label: 'Unduh PDF Pendamping', route: downloadUrls?.pendamping },
    { key: 'instruktur', label: 'Unduh PDF Instruktur', route: downloadUrls?.instruktur },
  ];

  const validOptions = pdfOptions.filter(option => option.route);

  // If there's only one option, show a simple button instead of dropdown
  if (validOptions.length === 1) {
    const singleOption = validOptions[0];
    return (
      <Button 
        variant="outline" 
        size={size} 
        className={className}
        asChild
      >
        <a href={singleOption.route} target="_blank" rel="noopener noreferrer">
          {singleOption.label}
        </a>
      </Button>
    );
  }

  // If no valid options, don't render anything
  if (validOptions.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      <Button
        variant="outline"
        size={size}
        className={className}
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        PDF Templates
        <svg
          className={`ml-2 h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M19 9l-7 7-7-7"
          ></path>
        </svg>
      </Button>
      
      {isOpen && (
        <div 
          className="absolute z-[100] mt-1 w-56 origin-top-right rounded-md border border-border bg-background shadow-lg"
          style={{ overflow: 'visible' }}
        >
          <div className="py-1">
            {validOptions.map((option) => (
              <a
                key={option.key}
                href={option.route}
                target="_blank"
                rel="noopener noreferrer"
                className="block px-4 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground"
                onClick={() => setIsOpen(false)}
              >
                {option.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}