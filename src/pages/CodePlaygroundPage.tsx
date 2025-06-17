
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import AdvancedCodePlayground from '../components/AdvancedCodePlayground';
import CreatePostModal from '../components/CreatePostModal';

const CodePlaygroundPage: React.FC = () => {
  const navigate = useNavigate();
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [sessionData, setSessionData] = useState<{
    videoBlob: Blob | null;
    code: string;
    language: string;
  }>({
    videoBlob: null,
    code: '',
    language: 'javascript'
  });

  const handleCreatePost = (videoBlob: Blob, code: string, language: string) => {
    setSessionData({ videoBlob, code, language });
    setShowCreatePost(true);
  };

  const handlePostCreated = () => {
    setShowCreatePost(false);
    setSessionData({ videoBlob: null, code: '', language: 'javascript' });
    navigate('/');
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-900">
        <AdvancedCodePlayground
          isOpen={true}
          onClose={() => navigate('/home')}
          onCreatePost={handleCreatePost}
        />
        
        {showCreatePost && sessionData.videoBlob && (
          <CreatePostModal
            isOpen={showCreatePost}
            onClose={() => setShowCreatePost(false)}
            onPostCreated={handlePostCreated}
            initialType="video"
            initialVideo={sessionData.videoBlob}
            initialCode={sessionData.code}
            initialLanguage={sessionData.language}
          />
        )}
      </div>
    </Layout>
  );
};

export default CodePlaygroundPage;