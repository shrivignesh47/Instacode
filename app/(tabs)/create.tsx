import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Image } from 'react-native';
import { Code, Image as ImageIcon, Video, FolderOpen, Camera, Upload, X } from 'lucide-react-native';
import { useCameraPermissions } from 'expo-camera';

export default function CreateScreen() {
  const [activeTab, setActiveTab] = useState('code');
  const [content, setContent] = useState('');
  const [codeLanguage, setCodeLanguage] = useState('javascript');
  const [codeContent, setCodeContent] = useState('');
  const [projectTitle, setProjectTitle] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [tags, setTags] = useState('');
  const [permission, requestPermission] = useCameraPermissions();

  const handleCameraPermission = async () => {
    if (!permission?.granted) {
      await requestPermission();
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'code':
        return (
          <View style={styles.tabContent}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Programming Language</Text>
              <View style={styles.selectContainer}>
                <TouchableOpacity 
                  style={[
                    styles.languageOption, 
                    codeLanguage === 'javascript' && styles.selectedLanguage
                  ]}
                  onPress={() => setCodeLanguage('javascript')}
                >
                  <Text style={[
                    styles.languageText,
                    codeLanguage === 'javascript' && styles.selectedLanguageText
                  ]}>JavaScript</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[
                    styles.languageOption, 
                    codeLanguage === 'python' && styles.selectedLanguage
                  ]}
                  onPress={() => setCodeLanguage('python')}
                >
                  <Text style={[
                    styles.languageText,
                    codeLanguage === 'python' && styles.selectedLanguageText
                  ]}>Python</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[
                    styles.languageOption, 
                    codeLanguage === 'typescript' && styles.selectedLanguage
                  ]}
                  onPress={() => setCodeLanguage('typescript')}
                >
                  <Text style={[
                    styles.languageText,
                    codeLanguage === 'typescript' && styles.selectedLanguageText
                  ]}>TypeScript</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Code</Text>
              <TextInput
                style={styles.codeInput}
                multiline
                placeholder="Paste your code here..."
                placeholderTextColor="#9CA3AF"
                value={codeContent}
                onChangeText={setCodeContent}
              />
            </View>
          </View>
        );
      case 'image':
        return (
          <View style={styles.tabContent}>
            <TouchableOpacity 
              style={styles.uploadContainer}
              onPress={handleCameraPermission}
            >
              <View style={styles.uploadIconContainer}>
                <Camera size={32} color="#8B5CF6" />
              </View>
              <Text style={styles.uploadTitle}>Take a Photo</Text>
              <Text style={styles.uploadSubtitle}>Use your camera to capture an image</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.uploadContainer}>
              <View style={styles.uploadIconContainer}>
                <Upload size={32} color="#8B5CF6" />
              </View>
              <Text style={styles.uploadTitle}>Upload from Gallery</Text>
              <Text style={styles.uploadSubtitle}>Select an image from your device</Text>
            </TouchableOpacity>
          </View>
        );
      case 'video':
        return (
          <View style={styles.tabContent}>
            <TouchableOpacity 
              style={styles.uploadContainer}
              onPress={handleCameraPermission}
            >
              <View style={styles.uploadIconContainer}>
                <Camera size={32} color="#8B5CF6" />
              </View>
              <Text style={styles.uploadTitle}>Record a Video</Text>
              <Text style={styles.uploadSubtitle}>Use your camera to record a video</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.uploadContainer}>
              <View style={styles.uploadIconContainer}>
                <Upload size={32} color="#8B5CF6" />
              </View>
              <Text style={styles.uploadTitle}>Upload from Gallery</Text>
              <Text style={styles.uploadSubtitle}>Select a video from your device</Text>
            </TouchableOpacity>
          </View>
        );
      case 'project':
        return (
          <View style={styles.tabContent}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Project Title</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter project title"
                placeholderTextColor="#9CA3AF"
                value={projectTitle}
                onChangeText={setProjectTitle}
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Project Description</Text>
              <TextInput
                style={styles.textAreaInput}
                multiline
                placeholder="Describe your project..."
                placeholderTextColor="#9CA3AF"
                value={projectDescription}
                onChangeText={setProjectDescription}
              />
            </View>
            
            <TouchableOpacity style={styles.uploadContainer}>
              <View style={styles.uploadIconContainer}>
                <Upload size={32} color="#8B5CF6" />
              </View>
              <Text style={styles.uploadTitle}>Upload Project Image</Text>
              <Text style={styles.uploadSubtitle}>Add a screenshot or cover image</Text>
            </TouchableOpacity>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Create Post</Text>
        <TouchableOpacity>
          <X size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.tabs}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'code' && styles.activeTab]} 
            onPress={() => setActiveTab('code')}
          >
            <Code size={20} color={activeTab === 'code' ? '#8B5CF6' : '#9CA3AF'} />
            <Text style={[styles.tabText, activeTab === 'code' && styles.activeTabText]}>Code</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'image' && styles.activeTab]} 
            onPress={() => setActiveTab('image')}
          >
            <ImageIcon size={20} color={activeTab === 'image' ? '#8B5CF6' : '#9CA3AF'} />
            <Text style={[styles.tabText, activeTab === 'image' && styles.activeTabText]}>Image</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'video' && styles.activeTab]} 
            onPress={() => setActiveTab('video')}
          >
            <Video size={20} color={activeTab === 'video' ? '#8B5CF6' : '#9CA3AF'} />
            <Text style={[styles.tabText, activeTab === 'video' && styles.activeTabText]}>Video</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'project' && styles.activeTab]} 
            onPress={() => setActiveTab('project')}
          >
            <FolderOpen size={20} color={activeTab === 'project' ? '#8B5CF6' : '#9CA3AF'} />
            <Text style={[styles.tabText, activeTab === 'project' && styles.activeTabText]}>Project</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={styles.textAreaInput}
            multiline
            placeholder="What's on your mind?"
            placeholderTextColor="#9CA3AF"
            value={content}
            onChangeText={setContent}
          />
        </View>
        
        {renderTabContent()}
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Tags</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Add tags separated by commas (e.g., react, javascript)"
            placeholderTextColor="#9CA3AF"
            value={tags}
            onChangeText={setTags}
          />
        </View>
        
        <TouchableOpacity style={styles.submitButton}>
          <Text style={styles.submitButtonText}>Share Post</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#1F2937',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Inter-Bold',
  },
  scrollView: {
    flex: 1,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#1F2937',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 8,
  },
  activeTab: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
  },
  tabText: {
    color: '#9CA3AF',
    marginLeft: 6,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  activeTabText: {
    color: '#8B5CF6',
  },
  formGroup: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  label: {
    color: '#E5E7EB',
    fontSize: 16,
    marginBottom: 8,
    fontFamily: 'Inter-Bold',
  },
  textInput: {
    backgroundColor: '#1F2937',
    borderRadius: 8,
    padding: 12,
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  textAreaInput: {
    backgroundColor: '#1F2937',
    borderRadius: 8,
    padding: 12,
    color: '#FFFFFF',
    fontSize: 16,
    height: 100,
    textAlignVertical: 'top',
    fontFamily: 'Inter-Regular',
  },
  codeInput: {
    backgroundColor: '#1F2937',
    borderRadius: 8,
    padding: 12,
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'monospace',
    height: 200,
    textAlignVertical: 'top',
  },
  tabContent: {
    marginHorizontal: 16,
  },
  selectContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  languageOption: {
    backgroundColor: '#1F2937',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedLanguage: {
    backgroundColor: '#8B5CF6',
  },
  languageText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  selectedLanguageText: {
    color: '#FFFFFF',
  },
  uploadContainer: {
    backgroundColor: '#1F2937',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#374151',
    borderStyle: 'dashed',
  },
  uploadIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  uploadTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    fontFamily: 'Inter-Bold',
  },
  uploadSubtitle: {
    color: '#9CA3AF',
    fontSize: 14,
    textAlign: 'center',
    fontFamily: 'Inter-Regular',
  },
  submitButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 8,
    paddingVertical: 14,
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 32,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
  },
});