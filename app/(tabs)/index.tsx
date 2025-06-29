import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, RefreshControl } from 'react-native';
import { useState, useCallback } from 'react';
import { Heart, MessageCircle, Share2, Bookmark } from 'lucide-react-native';

export default function HomeScreen() {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Simulate a data refresh
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>InstaCode</Text>
        <View style={styles.badgeContainer}>
          <TouchableOpacity style={styles.badge}>
            <Image 
              source={{ uri: "https://storage.bolt.army/logotext_poweredby_360w.png" }}
              style={styles.badgeImage}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.storyContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <TouchableOpacity key={item} style={styles.storyItem}>
                <View style={styles.storyRing}>
                  <Image
                    source={{ uri: `https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=300` }}
                    style={styles.storyImage}
                  />
                </View>
                <Text style={styles.storyUsername}>user{item}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {[1, 2, 3].map((post) => (
          <View key={post} style={styles.postContainer}>
            <View style={styles.postHeader}>
              <View style={styles.postUser}>
                <Image
                  source={{ uri: `https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=300` }}
                  style={styles.userAvatar}
                />
                <View>
                  <Text style={styles.username}>developer{post}</Text>
                  <Text style={styles.timeAgo}>2h ago</Text>
                </View>
              </View>
              <TouchableOpacity>
                <Text style={styles.moreOptions}>•••</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.postContent}>
              <Text style={styles.postText}>
                Just finished building this amazing React Native component! 🚀 #reactnative #javascript #coding
              </Text>
              
              <View style={styles.codeBlock}>
                <Text style={styles.codeText}>
                  {`const MyComponent = () => {\n  const [count, setCount] = useState(0);\n\n  return (\n    <View>\n      <Text>{count}</Text>\n      <Button onPress={() => setCount(count + 1)} title="Increment" />\n    </View>\n  );\n};`}
                </Text>
              </View>
            </View>

            <View style={styles.postActions}>
              <View style={styles.leftActions}>
                <TouchableOpacity style={styles.actionButton}>
                  <Heart size={24} color="#F87171" />
                  <Text style={styles.actionCount}>42</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                  <MessageCircle size={24} color="#9CA3AF" />
                  <Text style={styles.actionCount}>12</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                  <Share2 size={24} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
              <TouchableOpacity>
                <Bookmark size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
          </View>
        ))}
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
    paddingBottom: 10,
    backgroundColor: '#1F2937',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Inter-Bold',
  },
  badgeContainer: {
    position: 'relative',
  },
  badge: {
    height: 32,
    width: 120,
  },
  badgeImage: {
    width: '100%',
    height: '100%',
  },
  scrollView: {
    flex: 1,
  },
  storyContainer: {
    paddingVertical: 12,
    backgroundColor: '#1F2937',
    marginBottom: 8,
  },
  storyItem: {
    alignItems: 'center',
    marginHorizontal: 8,
  },
  storyRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2,
    borderColor: '#8B5CF6',
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  storyUsername: {
    color: '#E5E7EB',
    fontSize: 12,
    marginTop: 4,
    fontFamily: 'Inter-Regular',
  },
  postContainer: {
    backgroundColor: '#1F2937',
    marginBottom: 8,
    paddingVertical: 12,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  postUser: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  username: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
    fontFamily: 'Inter-Bold',
  },
  timeAgo: {
    color: '#9CA3AF',
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  moreOptions: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  postContent: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  postText: {
    color: '#E5E7EB',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
    fontFamily: 'Inter-Regular',
  },
  codeBlock: {
    backgroundColor: '#111827',
    padding: 12,
    borderRadius: 8,
  },
  codeText: {
    color: '#E5E7EB',
    fontFamily: 'monospace',
    fontSize: 12,
    lineHeight: 18,
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  actionCount: {
    color: '#9CA3AF',
    fontSize: 14,
    marginLeft: 4,
    fontFamily: 'Inter-Regular',
  },
});