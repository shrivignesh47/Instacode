
import { useState } from 'react';
import { Loader2, Trash2, Edit } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

interface PostOptionsDropdownProps {
  isOpen: boolean;
  postId: string;
  postUserId: string;
  onClose: () => void;
  onPostDeleted: () => void;
  onEditPost: () => void;
}

const PostOptionsDropdown = ({ 
  isOpen, 
  postId, 
  postUserId, 
  onClose, 
  onPostDeleted,
  onEditPost
}: PostOptionsDropdownProps) => {
  const { user } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  if (!isOpen || !user || user.id !== postUserId) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    setDeleteError(null);

    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)
        .eq('user_id', user.id); // Extra safety check

      if (error) {
        throw error;
      }

      onPostDeleted();
      onClose();
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete post');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = () => {
    onEditPost();
    onClose();
  };

  return (
    <div className="absolute top-0 right-0 mt-8 mr-2 w-48 bg-gray-800 border border-gray-700 rounded-md shadow-md z-10">
      <button
        onClick={handleEdit}
        className="block w-full text-left px-4 py-2 text-sm text-blue-400 hover:bg-gray-700"
      >
        <Edit className="w-4 h-4 mr-2 inline-block" />
        Edit Post
      </button>
      <button
        onClick={handleDelete}
        disabled={isDeleting}
        className="block w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed border-t border-gray-700"
      >
        {isDeleting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin inline-block" />
            Deleting...
          </>
        ) : (
          <>
            <Trash2 className="w-4 h-4 mr-2 inline-block" />
            Delete Post
          </>
        )}
      </button>
      {deleteError && (
        <div className="text-red-500 text-sm px-4 py-2 border-t border-gray-700" role="alert">
          {deleteError}
        </div>
      )}
    </div>
  );
};

export default PostOptionsDropdown;