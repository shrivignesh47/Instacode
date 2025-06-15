
import { Loader2, Trash2 } from 'lucide-react';

interface PostOptionsDropdownProps {
  isOpen: boolean;
  isDeleting: boolean;
  deleteError: string | null;
  onDelete: () => void;
}

const PostOptionsDropdown = ({ isOpen, isDeleting, deleteError, onDelete }: PostOptionsDropdownProps) => {
  if (!isOpen) return null;

  return (
    <div className="absolute top-0 right-0 mt-8 mr-2 w-48 bg-gray-800 border border-gray-700 rounded-md shadow-md z-10">
      <button
        onClick={onDelete}
        disabled={isDeleting}
        className="block w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-700"
      >
        {isDeleting ? (
          <>
            Deleting...
            <Loader2 className="w-4 h-4 ml-2 animate-spin inline-block" />
          </>
        ) : (
          <>
            <Trash2 className="w-4 h-4 mr-2 inline-block" />
            Delete Post
          </>
        )}
      </button>
      {deleteError && (
        <div className="text-red-500 text-sm px-4 py-2" role="alert">
          {deleteError}
        </div>
      )}
    </div>
  );
};

export default PostOptionsDropdown;