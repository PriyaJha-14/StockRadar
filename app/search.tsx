// app/search.tsx

import { POPULAR_STOCKS, SearchResult, searchStocks } from '@/utils/searchService';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim().length >= 1) {
        performSearch(query);
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const performSearch = async (searchQuery: string) => {
    setLoading(true);
    try {
      const searchResults = await searchStocks(searchQuery);
      setResults(searchResults);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectStock = (symbol: string) => {
    router.push(`/stock/${symbol}`);
  };

  const renderSearchResult = ({ item }: { item: SearchResult }) => (
    <TouchableOpacity
      style={styles.resultItem}
      onPress={() => handleSelectStock(item.symbol)}
    >
      <View style={styles.resultContent}>
        <View style={styles.symbolRow}>
          <Text style={styles.symbolText}>{item.symbol}</Text>
          {item.country && (
            <View
              style={[
                styles.badge,
                { backgroundColor: item.country === 'India' ? '#FF9933' : '#0066CC' },
              ]}
            >
              <Text style={styles.badgeText}>
                {item.country === 'India' ? '🇮🇳' : '🇺🇸'}
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.nameText} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.exchangeText}>{item.exchange}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#fff" />
    </TouchableOpacity>
  );

  const renderPopular = () => (
    <View style={styles.popularContainer}>
      <Text style={styles.sectionTitle}>🇮🇳 Popular Indian Stocks</Text>
      {POPULAR_STOCKS.india.map((stock, index) => (
        <TouchableOpacity
          key={`india-${index}`}
          style={styles.popularItem}
          onPress={() => handleSelectStock(stock.symbol)}
        >
          <View>
            <Text style={styles.popularSymbol}>{stock.symbol.replace('.NS', '')}</Text>
            <Text style={styles.popularName}>{stock.name}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>
      ))}

      <Text style={styles.sectionTitle}>🇺🇸 Popular US Stocks</Text>
      {POPULAR_STOCKS.us.map((stock, index) => (
        <TouchableOpacity
          key={`us-${index}`}
          style={styles.popularItem}
          onPress={() => handleSelectStock(stock.symbol)}
        >
          <View>
            <Text style={styles.popularSymbol}>{stock.symbol}</Text>
            <Text style={styles.popularName}>{stock.name}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#00194b', '#0C0C0C']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>

            <View style={styles.searchBox}>
              <Ionicons name="search" size={20} color="#999" />
              <TextInput
                style={styles.input}
                placeholder="Search AAPL, Reliance, TCS..."
                placeholderTextColor="#999"
                value={query}
                onChangeText={setQuery}
                autoFocus
                autoCapitalize="characters"
              />
              {query.length > 0 && (
                <TouchableOpacity onPress={() => setQuery('')}>
                  <Ionicons name="close-circle" size={20} color="#999" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {loading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingText}>Searching...</Text>
            </View>
          ) : query.trim().length > 0 && results.length > 0 ? (
            <FlatList
              data={results}
              renderItem={renderSearchResult}
              keyExtractor={(item, index) => `${item.symbol}-${index}`}
              style={styles.resultsList}
              keyboardShouldPersistTaps="handled"
            />
          ) : query.trim().length > 0 ? (
            <View style={styles.centerContainer}>
              <Ionicons name="search-outline" size={64} color="#666" />
              <Text style={styles.emptyText}>No stocks found</Text>
              <Text style={styles.emptySubtext}>Try another search term</Text>
            </View>
          ) : (
            renderPopular()
          )}
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingTop: 8 },
  backButton: { marginRight: 12, padding: 4 },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  input: { flex: 1, marginLeft: 8, fontSize: 16, color: '#fff' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  loadingText: { marginTop: 12, fontSize: 16, color: '#fff' },
  emptyText: { fontSize: 20, fontWeight: '600', color: '#fff', marginTop: 16 },
  emptySubtext: { fontSize: 14, color: '#999', marginTop: 8, textAlign: 'center' },
  resultsList: { flex: 1 },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  resultContent: { flex: 1 },
  symbolRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  symbolText: { fontSize: 18, fontWeight: '600', color: '#fff', marginRight: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  badgeText: { fontSize: 10, color: '#fff', fontWeight: '600' },
  nameText: { fontSize: 14, color: '#ccc', marginBottom: 2 },
  exchangeText: { fontSize: 12, color: '#999' },
  popularContainer: { flex: 1, padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#fff', marginTop: 16, marginBottom: 12 },
  popularItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    marginBottom: 8,
  },
  popularSymbol: { fontSize: 16, fontWeight: '600', color: '#fff' },
  popularName: { fontSize: 13, color: '#999', marginTop: 2 },
});
