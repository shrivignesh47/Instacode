import { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, FlatList } from 'react-native';
import { Settings, Grid, List, MapPin, Globe, Github, Linkedin, Twitter, Edit, LogOut } from 'lucide-react-native';

export default function ProfileScreen() {
  const [activeTab, setActiveTab] = useState('posts');
  const [viewMode, setViewMode] = useState('grid');

  const userProfile = {
    username: 'johndoe',
    displayName: 'John Doe',
    avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=300',
    bio: 'Full-stack developer passionate about React Native, TypeScript, and building beautiful mobile experiences.',
    location: 'San Francisco, CA',
    website: 'johndoe.dev',
    github: 'github.com/johndoe',
    linkedin: 'linkedin.com/in/johndoe',
    twitter: 'twitter.com/johndoe',
    followers: 1234,
    following: 567,
    posts: 89,
  };

  const userPosts = [
    {
      id: '1',
      type: 'code',
      title: 'Custom React Hook for API Calls',
      preview: 'https://images.pexels.com/photos/4164418/pexels-photo-4164418.jpeg?auto=compress&cs=tinysrgb&w=600',
      likes: 42,
      comments: 7,
    },
    {
      id: '2',
      type: 'project',
      title: 'E-commerce Mobile App',
      preview: 'https://images.pexels.com/photos/230544/pexels-photo-230544.jpeg?auto=compress&cs=tinysrgb&w=600',
      likes: 128,
      comments: 24,
    },
    {
      id: '3',
      type: 'image',
      title: 'My Coding Setup 2024',
      preview: 'https://images.pexels.com/photos/1181675/pexels-photo-1181675.jpeg?auto=compress&cs=tinysrgb&w=600',
      likes: 89,
      comments: 15,
    },
    {
      id: '4',
      type: 'video',
      title: 'React Native Animation Tutorial',
      preview: 'https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=600',
      likes: 76,
      comments: 11,
    },
    {
      id: '5',
      type: 'code',
      title: 'TypeScript Utility Functions',
      preview: 'https://images.pexels.com/photos/4709285/pexels-photo-4709285.jpeg?auto=compress&cs=tinysrgb&w=600',
      likes: 54,
      comments: 9,
    },
    {
      id: '6',
      type: 'project',
      title: 'Weather App with Geolocation',
      preview: 'https://images.pexels.com/photos/2582937/pexels-photo-2582937.jpeg?auto=compress&cs=tinysrgb&w=600',
      likes: 112,
      comments: 18,
    },
  ];

  const renderGridItem = ({ item }) => (
    <TouchableOpacity style={styles.gridItem}>
      <Image source={{ uri: item.preview }} style={styles.gridItemImage} />
      <View style={styles.gridItemOverlay}>
        <Text style={styles.gridItemType}>{item.type}</Text>
        <Text style={styles.gridItemTitle} numberOfLines={2}>{item.title}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderListItem = ({ item }) => (
    <TouchableOpacity style={styles.listItem}>
      <Image source={{ uri: item.preview }} style={styles.listItemImage} />
      <View style={styles.listItemContent}>
        <Text style={styles.listItemType}>{item.type}</Text>
        <Text style={styles.listItemTitle}>{item.title}</Text>
        <View style={styles.listItemStats}>
          <Text style={styles.listItemStat}>{item.likes} likes</Text>
          <Text style={styles.listItemStat}>{item.comments} comments</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton}>
            <Settings size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.profileHeader}>
          <Image source={{ uri: userProfile.avatar }} style={styles.profileAvatar} />
          
          <View style={styles.profileInfo}>
            <Text style={styles.displayName}>{userProfile.displayName}</Text>
            <Text style={styles.username}>@{userProfile.username}</Text>
            
            <View style={styles.badgeContainer}>
              <TouchableOpacity style={styles.badge}>
                <Image 
                  source={{ uri: "https://storage.bolt.army/logotext_poweredby_360w.png" }}
                  style={styles.badgeImage}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            </View>
            
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{userProfile.posts}</Text>
                <Text style={styles.statLabel}>Posts</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{userProfile.followers}</Text>
                <Text style={styles.statLabel}>Followers</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{userProfile.following}</Text>
                <Text style={styles.statLabel}>Following</Text>
              </View>
            </View>
          </View>
        </View>
        
        <View style={styles.bioSection}>
          <Text style={styles.bioText}>{userProfile.bio}</Text>
          
          <View style={styles.profileDetails}>
            {userProfile.location && (
              <View style={styles.detailItem}>
                <MapPin size={16} color="#9CA3AF" />
                <Text style={styles.detailText}>{userProfile.location}</Text>
              </View>
            )}
            
            {userProfile.website && (
              <View style={styles.detailItem}>
                <Globe size={16} color="#9CA3AF" />
                <Text style={styles.detailText}>{userProfile.website}</Text>
              </View>
            )}
          </View>
          
          <View style={styles.socialLinks}>
            {userProfile.github && (
              <TouchableOpacity style={styles.socialButton}>
                <Github size={20} color="#FFFFFF" />
              </TouchableOpacity>
            )}
            
            {userProfile.linkedin && (
              <TouchableOpacity style={styles.socialButton}>
                <Linkedin size={20} color="#FFFFFF" />
              </TouchableOpacity>
            )}
            
            {userProfile.twitter && (
              <TouchableOpacity style={styles.socialButton}>
                <Twitter size={20} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>
          
          <View style={styles.profileActions}>
            <TouchableOpacity style={styles.editProfileButton}>
              <Edit size={16} color="#FFFFFF" />
              <Text style={styles.editProfileText}>Edit Profile</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.logoutButton}>
              <LogOut size={16} color="#FFFFFF" />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.contentSection}>
          <View style={styles.contentHeader}>
            <View style={styles.tabs}>
              <TouchableOpacity 
                style={[styles.tab, activeTab === 'posts' && styles.activeTab]}
                onPress={() => setActiveTab('posts')}
              >
                <Text style={[styles.tabText, activeTab === 'posts' && styles.activeTabText]}>
                  Posts
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.tab, activeTab === 'saved' && styles.activeTab]}
                onPress={() => setActiveTab('saved')}
              >
                <Text style={[styles.tabText, activeTab === 'saved' && styles.activeTabText]}>
                  Saved
                </Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.viewToggle}>
              <TouchableOpacity 
                style={[styles.viewButton, viewMode === 'grid' && styles.activeViewButton]}
                onPress={() => setViewMode('grid')}
              >
                <Grid size={20} color={viewMode === 'grid' ? '#8B5CF6' : '#9CA3AF'} />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.viewButton, viewMode === 'list' && styles.activeViewButton]}
                onPress={() => setViewMode('list')}
              >
                <List size={20} color={viewMode === 'list' ? '#8B5CF6' : '#9CA3AF'} />
              </TouchableOpacity>
            </View>
          </View>
          
          {viewMode === 'grid' ? (
            <FlatList
              data={userPosts}
              renderItem={renderGridItem}
              keyExtractor={(item) => item.id}
              numColumns={2}
              columnWrapperStyle={styles.gridRow}
              scrollEnabled={false}
            />
          ) : (
            <FlatList
              data={userPosts}
              renderItem={renderListItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          )}
        </View>
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
  headerActions: {
    flexDirection: 'row',
  },
  headerButton: {
    marginLeft: 16,
  },
  scrollView: {
    flex: 1,
  },
  profileHeader: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#1F2937',
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#8B5CF6',
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  displayName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
    fontFamily: 'Inter-Bold',
  },
  username: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 12,
    fontFamily: 'Inter-Regular',
  },
  badgeContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
  },
  badge: {
    height: 24,
    width: 90,
  },
  badgeImage: {
    width: '100%',
    height: '100%',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Inter-Bold',
  },
  statLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: 'Inter-Regular',
  },
  bioSection: {
    padding: 16,
    backgroundColor: '#1F2937',
    marginBottom: 8,
  },
  bioText: {
    fontSize: 14,
    color: '#E5E7EB',
    lineHeight: 20,
    marginBottom: 12,
    fontFamily: 'Inter-Regular',
  },
  profileDetails: {
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginLeft: 8,
    fontFamily: 'Inter-Regular',
  },
  socialLinks: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  socialButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  profileActions: {
    flexDirection: 'row',
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B5CF6',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 12,
  },
  editProfileText: {
    color: '#FFFFFF',
    marginLeft: 8,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  logoutText: {
    color: '#FFFFFF',
    marginLeft: 8,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  contentSection: {
    flex: 1,
    backgroundColor: '#1F2937',
  },
  contentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  tabs: {
    flexDirection: 'row',
  },
  tab: {
    marginRight: 24,
    paddingVertical: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#8B5CF6',
  },
  tabText: {
    fontSize: 16,
    color: '#9CA3AF',
    fontFamily: 'Inter-Regular',
  },
  activeTabText: {
    color: '#8B5CF6',
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: '#374151',
    borderRadius: 8,
  },
  viewButton: {
    padding: 8,
  },
  activeViewButton: {
    backgroundColor: '#4B5563',
    borderRadius: 8,
  },
  gridRow: {
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  gridItem: {
    width: '48%',
    aspectRatio: 1,
    marginVertical: 8,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  gridItemImage: {
    width: '100%',
    height: '100%',
  },
  gridItemOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 8,
  },
  gridItemType: {
    color: '#8B5CF6',
    fontSize: 12,
    textTransform: 'uppercase',
    marginBottom: 4,
    fontFamily: 'Inter-Bold',
  },
  gridItemTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  listItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  listItemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 16,
  },
  listItemContent: {
    flex: 1,
    justifyContent: 'center',
  },
  listItemType: {
    color: '#8B5CF6',
    fontSize: 12,
    textTransform: 'uppercase',
    marginBottom: 4,
    fontFamily: 'Inter-Bold',
  },
  listItemTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 8,
    fontFamily: 'Inter-Bold',
  },
  listItemStats: {
    flexDirection: 'row',
  },
  listItemStat: {
    color: '#9CA3AF',
    fontSize: 12,
    marginRight: 12,
    fontFamily: 'Inter-Regular',
  },
});