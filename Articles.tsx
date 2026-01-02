import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Linking,
  Image,
  Dimensions,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { supabase } from './App';

const { width } = Dimensions.get('window');

interface Article {
  id: string;
  title: string;
  description: string;
  content: string;
  source_name: string;
  author: string | null;
  url: string;
  image_url: string | null;
  published_at: string;
  keywords: string[];
}

interface RouteParams {
  session: any;
}

const Articles = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [articles, setArticles] = useState<Article[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
  const [recommendations, setRecommendations] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'foryou'>('all'); // Tab state
  
  const route = useRoute();
  const { session } = route.params as RouteParams;

  // Fetch articles from Supabase
  const fetchArticles = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('health_articles')
        .select('*')
        .order('published_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching articles:', error);
        Alert.alert('Error', 'Failed to load articles');
        return;
      }

      if (data) {
        setArticles(data);
        setFilteredArticles(data);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      Alert.alert('Error', 'Something went wrong');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch personalized recommendations
  const fetchRecommendations = async () => {
    if (!session?.user?.id) return;

    try {
      const { data, error } = await supabase.functions.invoke('get-recommendations', {
        body: { user_id: session.user.id },
      });

      if (error) {
        console.error('Recommendations error:', error);
        return;
      }

      if (data?.recommendations) {
        setRecommendations(data.recommendations);
      }
    } catch (error) {
      console.log('Failed to fetch recommendations:', error);
    }
  };

  // Calculate reading time
  const calculateReadTime = (text: string): string => {
    if (!text) return '5 min';
    const words = text.split(' ').length;
    const minutes = Math.ceil(words / 200);
    return `${minutes} min`;
  };

  // Format date
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  // Get category color based on keywords
  const getCategoryColor = (keywords: string[]): string => {
    if (!keywords || keywords.length === 0) return '#64748B';
    
    const keywordStr = keywords.join(' ').toLowerCase();
    
    if (keywordStr.includes('heart') || keywordStr.includes('cardiac')) return '#EF4444';
    if (keywordStr.includes('cancer') || keywordStr.includes('tumor')) return '#8B5CF6';
    if (keywordStr.includes('diabetes') || keywordStr.includes('blood sugar')) return '#F59E0B';
    if (keywordStr.includes('mental') || keywordStr.includes('depression')) return '#06B6D4';
    if (keywordStr.includes('diet') || keywordStr.includes('nutrition')) return '#10B981';
    if (keywordStr.includes('brain') || keywordStr.includes('alzheimer')) return '#EC4899';
    if (keywordStr.includes('thyroid') || keywordStr.includes('hormone')) return '#8B5CF6';
    
    return '#3B82F6';
  };

  // Get category name
  const getCategoryName = (keywords: string[]): string => {
    if (!keywords || keywords.length === 0) return 'Health';
    
    const keywordStr = keywords.join(' ').toLowerCase();
    
    if (keywordStr.includes('heart') || keywordStr.includes('cardiac')) return 'Cardiology';
    if (keywordStr.includes('cancer') || keywordStr.includes('tumor')) return 'Oncology';
    if (keywordStr.includes('diabetes')) return 'Diabetes';
    if (keywordStr.includes('mental') || keywordStr.includes('depression')) return 'Mental Health';
    if (keywordStr.includes('diet') || keywordStr.includes('nutrition')) return 'Nutrition';
    if (keywordStr.includes('brain') || keywordStr.includes('alzheimer')) return 'Neurology';
    if (keywordStr.includes('thyroid')) return 'Thyroid';
    
    return 'General';
  };

  useEffect(() => {
    fetchArticles();
    fetchRecommendations();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredArticles(articles);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = articles.filter(article =>
        article.title.toLowerCase().includes(query) ||
        (article.description && article.description.toLowerCase().includes(query)) ||
        (article.source_name && article.source_name.toLowerCase().includes(query)) ||
        (article.keywords && article.keywords.some(kw => kw.toLowerCase().includes(query)))
      );
      setFilteredArticles(filtered);
    }
  }, [searchQuery, articles]);

  const handleArticlePress = async (article: Article) => {
    if (session?.user?.id) {
      await supabase.from('user_article_interactions').insert({
        user_id: session.user.id,
        article_id: article.id,
        interaction_type: 'click',
        created_at: new Date().toISOString(),
      });

      setTimeout(() => fetchRecommendations(), 1000);
    }

    Linking.openURL(article.url).catch(() => {
      Alert.alert('Error', 'Failed to open the article.');
    });
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchArticles();
    fetchRecommendations();
  };

  // Featured Article Card (Hero)
  const renderFeaturedArticle = ({ item }: { item: Article }) => (
    <TouchableOpacity
      style={styles.featuredCard}
      onPress={() => handleArticlePress(item)}
      activeOpacity={0.95}
    >
      {item.image_url ? (
        <Image 
          source={{ uri: item.image_url }} 
          style={styles.featuredImage}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.featuredImagePlaceholder, { backgroundColor: getCategoryColor(item.keywords) }]}>
          <Text style={styles.placeholderIcon}>📰</Text>
        </View>
      )}
      
      <View style={styles.featuredOverlay}>
        <View style={styles.featuredContent}>
          <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(item.keywords) }]}>
            <Text style={styles.categoryText}>{getCategoryName(item.keywords)}</Text>
          </View>
          
          <Text style={styles.featuredTitle} numberOfLines={3}>
            {item.title}
          </Text>
          
          <View style={styles.featuredMeta}>
            <View style={styles.metaItem}>
              <Text style={styles.metaIcon}>📖</Text>
              <Text style={styles.metaText}>{calculateReadTime(item.description || item.content || '')}</Text>
            </View>
            <View style={styles.metaDivider} />
            <View style={styles.metaItem}>
              <Text style={styles.metaIcon}>📅</Text>
              <Text style={styles.metaText}>{formatDate(item.published_at)}</Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Regular Article Card
  const renderArticle = ({ item, index }: { item: Article; index: number }) => {
    // Only show featured card in "All Articles" tab
    if (index === 0 && activeTab === 'all') {
      return renderFeaturedArticle({ item });
    }

    return (
      <TouchableOpacity
        style={styles.articleCard}
        onPress={() => handleArticlePress(item)}
        activeOpacity={0.85}
      >
        <View style={styles.articleContent}>
          <View style={styles.articleLeft}>
            <View style={styles.categoryContainer}>
              <View style={[styles.categoryDot, { backgroundColor: getCategoryColor(item.keywords) }]} />
              <Text style={[styles.categoryLabel, { color: getCategoryColor(item.keywords) }]}>
                {getCategoryName(item.keywords)}
              </Text>
            </View>
            
            <Text style={styles.articleTitle} numberOfLines={2}>
              {item.title}
            </Text>
            
            {item.description && (
              <Text style={styles.articleDescription} numberOfLines={2}>
                {item.description}
              </Text>
            )}
            
            <View style={styles.articleFooter}>
              <Text style={styles.sourceText} numberOfLines={1}>{item.source_name}</Text>
              <Text style={styles.dotSeparator}>•</Text>
              <Text style={styles.dateText}>{formatDate(item.published_at)}</Text>
            </View>
          </View>
          
          {item.image_url && (
            <Image 
              source={{ uri: item.image_url }} 
              style={styles.articleThumbnail}
              resizeMode="cover"
            />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // Get data based on active tab
  const getDisplayData = () => {
    if (activeTab === 'foryou') {
      return searchQuery.trim() === '' ? recommendations : recommendations.filter(article =>
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (article.description && article.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    return filteredArticles;
  };

  const displayData = getDisplayData();

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchBar}
            placeholder="Search health topics..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'all' && styles.activeTab]}
          onPress={() => setActiveTab('all')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>
            All Articles
          </Text>
          {activeTab === 'all' && <View style={styles.tabIndicator} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'foryou' && styles.activeTab]}
          onPress={() => setActiveTab('foryou')}
          activeOpacity={0.7}
        >
          <View style={styles.tabContent}>
            <Text style={[styles.tabText, activeTab === 'foryou' && styles.activeTabText]}>
              For You
            </Text>
            <Text style={styles.tabEmoji}></Text>
          </View>
          {activeTab === 'foryou' && <View style={styles.tabIndicator} />}
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading && articles.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading articles...</Text>
        </View>
      ) : displayData.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>
            {activeTab === 'foryou' ? '🎯' : '📭'}
          </Text>
          <Text style={styles.emptyTitle}>
            {activeTab === 'foryou' ? 'No Recommendations Yet' : 'No Articles Found'}
          </Text>
          <Text style={styles.emptyText}>
            {activeTab === 'foryou' 
              ? 'Start reading articles to get personalized recommendations'
              : searchQuery 
                ? 'Try searching with different keywords' 
                : 'Pull down to refresh'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={displayData}
          renderItem={renderArticle}
          keyExtractor={(item) => `${activeTab}-${item.id}`}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  
  // Search Bar
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  searchBar: {
    flex: 1,
    fontSize: 15,
    color: '#0F172A',
    fontWeight: '400',
  },
  clearButton: {
    padding: 4,
  },
  clearIcon: {
    fontSize: 18,
    color: '#94A3B8',
  },

  // Tab Switcher
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    position: 'relative',
  },
  activeTab: {
    // Active tab styling handled by indicator
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748B',
  },
  activeTabText: {
    color: '#3B82F6',
    fontWeight: '700',
  },
  tabEmoji: {
    fontSize: 16,
    marginLeft: 6,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#3B82F6',
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  
  // Featured Article
  featuredCard: {
    height: 320,
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#000',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  featuredImage: {
    width: '100%',
    height: '100%',
  },
  featuredImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderIcon: {
    fontSize: 64,
  },
  featuredOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '65%',
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  featuredContent: {
    padding: 20,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 12,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  featuredTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 30,
    marginBottom: 14,
  },
  featuredMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaDivider: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#94A3B8',
    marginHorizontal: 12,
  },
  metaIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  metaText: {
    fontSize: 13,
    color: '#E2E8F0',
    fontWeight: '600',
  },
  
  // Regular Articles
  listContainer: {
    paddingBottom: 24,
    paddingTop: 16,
  },
  articleCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 14,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  articleContent: {
    flexDirection: 'row',
    padding: 16,
  },
  articleLeft: {
    flex: 1,
    paddingRight: 12,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  categoryLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  articleTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 24,
    marginBottom: 8,
  },
  articleDescription: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 21,
    marginBottom: 12,
  },
  articleFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sourceText: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '600',
    maxWidth: 120,
  },
  dotSeparator: {
    fontSize: 12,
    color: '#CBD5E1',
    marginHorizontal: 8,
  },
  dateText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  articleThumbnail: {
    width: 100,
    height: 100,
    borderRadius: 10,
  },
  
  // Loading & Empty
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    color: '#64748B',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 48,
    paddingTop: 40,
  },
  emptyIcon: {
    fontSize: 72,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default Articles;
