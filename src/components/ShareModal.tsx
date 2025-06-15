
import { Check, Copy, ExternalLink } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  shareLink: string;
  isCodeCopied: boolean;
  onClose: () => void;
  onCopyLink: () => void;
}

const ShareModal = ({ isOpen, shareLink, isCodeCopied, onClose, onCopyLink }: ShareModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-20 flex items-center justify-center">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">Share Post</h3>
        <div className="flex items-center justify-between mb-4">
          <input
            type="text"
            value={shareLink}
            readOnly
            className="w-3/4 px-4 py-2 rounded-md bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <button
            onClick={onCopyLink}
            className="px-4 py-2 rounded-md bg-purple-600 hover:bg-purple-700 text-white"
          >
            {isCodeCopied ? (
              <>
                Copied!
                <Check className="w-4 h-4 ml-2 inline-block" />
              </>
            ) : (
              <>
                Copy Link
                <Copy className="w-4 h-4 ml-2 inline-block" />
              </>
            )}
          </button>
        </div>
        <div className="flex justify-end space-x-2">
          <a
            href={shareLink}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white"
          >
            Open in New Tab
            <ExternalLink className="w-4 h-4 ml-2 inline-block" />
          </a>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-gray-600 hover:bg-gray-700 text-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;