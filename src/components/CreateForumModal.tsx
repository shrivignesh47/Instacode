import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

interface CreateForumModalProps {
  isOpen: boolean;
  onClose: () => void;
  onForumCreated: () => void;
}

const CreateForumModal: React.FC<CreateForumModalProps> = ({ isOpen, onClose, onForumCreated }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'frontend',
    color: '#8B5CF6'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    { id: 'frontend', name: 'Frontend' },
    { id: 'backend', name: 'Backend' },
    { id: 'mobile', name: 'Mobile' },
    { id: 'devops', name: 'DevOps' },
    { id: 'ai', name: 'AI/ML' },
    { id: 'web3', name: 'Web3' },
    { id: 'career', name: 'Career' },
    { id: 'others', name: 'Others' },
  ];

  const colors = [
    '#8B5CF6', '#EF4444', '#22C55E', '#F59E0B',
    '#06B6D4', '#EC4899', '#84CC16', '#F97316'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setIsSubmitting(true);

      const { error } = await supabase
        .from('forums')
        .insert({
          name: formData.name,
          description: formData.description,
          category: formData.category,
          color: formData.color,
          members_count: 0,
          topics_count: 0
        });

      if (error) throw error;

      // Reset form
      setFormData({
        name: '',
        description: '',
        category: 'frontend',
        color: '#8B5CF6'
      });

      onForumCreated();
      onClose();
    } catch (error) {
      console.error('Error creating forum:', error);
      alert('Failed to create forum. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg border border-gray-700 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">Create New Forum</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
              Forum Name *
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="e.g., React Discussion"
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
              Description *
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-vertical"
              placeholder="Describe what this forum is about..."
              required
            />
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-2">
              Category *
            </label>
            <select
              id="category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Forum Color
            </label>
            <div className="flex flex-wrap gap-2">
              {colors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    formData.color === color
                      ? 'border-white scale-110'
                      : 'border-gray-600 hover:border-gray-400'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.name.trim() || !formData.description.trim()}
              className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Create Forum
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateForumModal;