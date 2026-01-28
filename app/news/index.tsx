import { useQuery } from '@tanstack/react-query';
import React, { useState } from 'react';
import { FlatList, Image, Linking, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { fetchMarketNews, NewsArticle } from '../api/newsApi';

export default function NewsScreen() {
  const [category, setCategory] = useState('general');
  
  const { data: news, isLoading, refetch } = useQuery({
    queryKey: ['marketNews', category],
    queryFn: () => fetchMarketNews(category),
    refetchInterval: 60000, // Refresh every 60 seconds
  });

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  const renderNewsItem = ({ item }: { item: NewsArticle }) => (
    <TouchableOpacity
      style={styles.newsCard}
      onPress={() => Linking.openURL(item.url)}
    >
      {item.image && (
        <Image source={{ uri: item.image }} style={styles.newsImage} />
      )}
      <View style={styles.newsContent}>
        <Text style={styles.newsSource}>{item.source} · {formatDate(item.datetime)}</Text>
        <Text style={styles.newsHeadline} numberOfLines={3}>
          {item.headline}
        </Text>
        <Text style={styles.newsSummary} numberOfLines={2}>
          {item.summary}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Category Tabs */}
      <View style={styles.categoryContainer}>
        {['general', 'forex', 'crypto', 'merger'].map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.categoryTab, category === cat && styles.activeTab]}
            onPress={() => setCategory(cat)}
          >
            <Text style={[styles.categoryText, category === cat && styles.activeTabText]}>
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* News List */}
      <FlatList
        data={news}
        renderItem={renderNewsItem}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} />
        }
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  categoryContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
  },
  activeTab: { backgroundColor: '#2563eb' },
  categoryText: { fontSize: 14, color: '#666' },
  activeTabText: { color: '#fff', fontWeight: '600' },
  listContent: { padding: 12 },
  newsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  newsImage: { width: '100%', height: 200, resizeMode: 'cover' },
  newsContent: { padding: 12 },
  newsSource: { fontSize: 12, color: '#666', marginBottom: 4 },
  newsHeadline: { fontSize: 16, fontWeight: '600', color: '#000', marginBottom: 8 },
  newsSummary: { fontSize: 14, color: '#666', lineHeight: 20 },
});
