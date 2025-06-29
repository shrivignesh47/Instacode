import { View, Text, StyleSheet, TextInput, FlatList, Image, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { Search, Filter, Code, Image as ImageIcon, Video, FolderOpen } from 'lucide-react-native';

export default function ExploreScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  const filters = [
    { id: 'all', label: 'All', icon: Filter },
    { id: 'code', label: 'Code', icon: Code },
    { id: 'image', label: 'Images', icon: ImageIcon },
    { id: 'video', label: 'Videos', icon: Video },
    { id: 'project', label: 'Projects', icon: FolderOpen },
  ];

  const explorePosts = [
    {
      id: '1',
      type: 'code',
      title: 'React Native Animation Tutorial',
      username: 'animation_expert',
      likes: 245,
      comments: 32,
      image: 'https://images.pexels.com/photos/4164418/pexels-photo-4164418.jpeg?auto=compress&cs=tinysrgb&w=600',
    },
    {
      id: '2',
      type: 'project',
      title: 'Full Stack E-commerce App',
      username: 'webdev_pro',
      likes: 189,
      comments: 24,
      image: 'https://images.pexels.com/photos/230544/pexels-photo-230544.jpeg?auto=compress&cs=tinysrgb&w=600',
    },
    {
      id: '3',
      type: 'image',
      title: 'My Coding Setup 2024',
      username: 'setup_master',
      likes: 423,
      comments: 56,
      image: 'https://images.pexels.com/photos/1181675/pexels-photo-1181675.jpeg?auto=compress&cs=tinysrgb&w=600',
    },
    {
      id: '4',
      type: 'video',
      title: 'Building a React Native App in 10 Minutes',
      username: 'quick_coder',
      likes: 512,
      comments: 78,
      image: 'https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=600',
    },
    {
      id: '5',
      type: 'code',
      title: 'Advanced TypeScript Patterns',
      username: 'typescript_guru',
      likes: 321,
      comments: 45,
      image: 'https://images.pexels.com/photos/4709285/pexels-photo-4709285.jpeg?auto=compress&cs=tinysrgb&w=600',
    },
    {
      id: '6',
      type: 'project',
      title: 'AI-powered Chat Application',
      username: 'ai_developer',
      likes: 678,
      comments: 92,
      image: 'https://images.pexels.com/photos/2582937/pexels-photo-2582937.jpeg?auto=compress&cs=tinysrgb&w=600',
    },
  ];

  const filteredPosts = activeFilter === 'all' 
    ? explorePosts 
    : explorePosts.filter(post => post.type === activeFilter);

  const renderFilterItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.filterItem,
        activeFilter === item.id && styles.activeFilterItem,
      ]}
      onPress={() => setActiveFilter(item.id)}
    >
      <item.icon 
        size={16} 
        color={activeFilter === item.id ? '#FFFFFF' : '#9CA3AF'} 
      />
      <Text 
        style={[
          styles.filterText,
          activeFilter === item.id && styles.activeFilterText,
        ]}
      >
        {item.label}
      </Text>
    </TouchableOpacity>
  );

  const renderPostItem = ({ item }) => (
    <TouchableOpacity style={styles.postItem}>
      <Image source={{ uri: item.image }} style={styles.postImage} />
      <View style={styles.postOverlay}>
        <View style={styles.postType}>
          {item.type === 'code' && <Code size={14} color="#FFFFFF" />}
          {item.type === 'project' && <FolderOpen size={14} color="#FFFFFF" />}
          {item.type === 'image' && <ImageIcon size={14} color="#FFFFFF" />}
          {item.type === 'video' && <Video size={14} color="#FFFFFF" />}
          <Text style={styles.postTypeText}>{item.type}</Text>
        </View>
        <Text style={styles.postTitle} numberOfLines={2}>{item.title}</Text>
        <View style={styles.postMeta}>
          <Text style={styles.username}>@{item.username}</Text>
          <View style={styles.stats}>
            <Text style={styles.statText}>{item.likes} likes</Text>
            <Text style={styles.statText}>{item.comments} comments</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Explore</Text>
      </View>
      
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search posts, users, or tags..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>
      
      <View style={styles.filtersContainer}>
        <FlatList
          data={filters}
          renderItem={renderFilterItem}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersList}
        />
      </View>
      
      <FlatList
        data={filteredPosts}
        renderItem={renderPostItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.postRow}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.postsList}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 10,
    backgroundColor: '#1F2937',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Inter-Bold',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#1F2937',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  filtersContainer: {
    backgroundColor: '#1F2937',
    paddingBottom: 16,
  },
  filtersList: {
    paddingHorizontal: 16,
  },
  filterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  activeFilterItem: {
    backgroundColor: '#8B5CF6',
  },
  filterText: {
    color: '#9CA3AF',
    marginLeft: 6,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  activeFilterText: {
    color: '#FFFFFF',
  },
  postsList: {
    padding: 8,
  },
  postRow: {
    justifyContent: 'space-between',
  },
  postItem: {
    width: '48%',
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1F2937',
  },
  postImage: {
    width: '100%',
    height: 150,
  },
  postOverlay: {
    padding: 12,
  },
  postType: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  postTypeText: {
    color: '#9CA3AF',
    fontSize: 12,
    marginLeft: 4,
    textTransform: 'capitalize',
    fontFamily: 'Inter-Regular',
  },
  postTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    fontFamily: 'Inter-Bold',
  },
  postMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  username: {
    color: '#9CA3AF',
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  stats: {
    flexDirection: 'row',
  },
  statText: {
    color: '#9CA3AF',
    fontSize: 10,
    marginLeft: 6,
    fontFamily: 'Inter-Regular',
  },
});