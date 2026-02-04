// components/StockChart.tsx
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import { CandlestickChart, LineChart } from 'react-native-wagmi-charts';

interface ChartDataPoint {
  timestamp: number;
  value: number;
  date?: Date;
}

interface CandleData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface StockChartProps {
  data: ChartDataPoint[];
  candleData?: CandleData[];
  symbol: string;
  currentPrice: number;
  priceChange: number;
  percentChange: number;
  timeframe: string;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 32;
const CHART_HEIGHT = 280;

export default function StockChart({
  data,
  candleData,
  symbol,
  currentPrice,
  priceChange,
  percentChange,
  timeframe,
}: StockChartProps) {
  const [chartType, setChartType] = useState<'line' | 'candle'>('line');
  const [showVolume, setShowVolume] = useState(false);

  const isPositive = priceChange >= 0;
  const lineColor = isPositive ? '#22c55e' : '#ef4444';
  const gradientColors = isPositive 
    ? ['rgba(34, 197, 94, 0.4)', 'rgba(34, 197, 94, 0.0)'] 
    : ['rgba(239, 68, 68, 0.4)', 'rgba(239, 68, 68, 0.0)'];

  const handleChartTypeToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setChartType(prev => prev === 'line' ? 'candle' : 'line');
  };

  if (!data || data.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Ionicons name="analytics-outline" size={48} color="#94a3b8" />
          <Text style={styles.emptyText}>No chart data available</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Chart Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.price}>${currentPrice.toFixed(2)}</Text>
          <View style={styles.changeContainer}>
            <Ionicons 
              name={isPositive ? "arrow-up" : "arrow-down"} 
              size={16} 
              color={lineColor} 
            />
            <Text style={[styles.change, { color: lineColor }]}>
              ${Math.abs(priceChange).toFixed(2)} ({Math.abs(percentChange).toFixed(2)}%)
            </Text>
          </View>
        </View>

        {/* Chart Type Toggle */}
        <View style={styles.controls}>
          <Pressable 
            style={[styles.controlButton, chartType === 'line' && styles.controlButtonActive]}
            onPress={handleChartTypeToggle}
          >
            <Ionicons name="trending-up" size={18} color={chartType === 'line' ? '#fff' : '#64748b'} />
            <Text style={[styles.controlText, chartType === 'line' && styles.controlTextActive]}>
              Line
            </Text>
          </Pressable>
          
          {candleData && candleData.length > 0 && (
            <Pressable 
              style={[styles.controlButton, chartType === 'candle' && styles.controlButtonActive]}
              onPress={handleChartTypeToggle}
            >
              <Ionicons name="bar-chart" size={18} color={chartType === 'candle' ? '#fff' : '#64748b'} />
              <Text style={[styles.controlText, chartType === 'candle' && styles.controlTextActive]}>
                Candle
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Chart Area */}
      <View style={styles.chartContainer}>
        {chartType === 'line' ? (
          <LineChart.Provider data={data}>
            <LineChart width={CHART_WIDTH} height={CHART_HEIGHT}>
              <LineChart.Path color={lineColor} width={2.5}>
                <LineChart.Gradient color={lineColor}>
                  <LinearGradient
                    colors={gradientColors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                  />
                </LineChart.Gradient>
              </LineChart.Path>
              
              <LineChart.CursorCrosshair color={lineColor}>
                <LineChart.Tooltip
                  textStyle={styles.tooltipText}
                  containerStyle={styles.tooltipContainer}
                />
              </LineChart.CursorCrosshair>
            </LineChart>

            {/* Price and Date Labels */}
            <View style={styles.labels}>
              <LineChart.PriceText 
                style={styles.priceLabel}
                precision={2}
              />
              <LineChart.DatetimeText
                style={styles.dateLabel}
                locale="en-US"
                options={{
                  year: timeframe === 'All' ? 'numeric' : undefined,
                  month: 'short',
                  day: 'numeric',
                  hour: timeframe === '1D' ? 'numeric' : undefined,
                  minute: timeframe === '1D' ? '2-digit' : undefined,
                }}
              />
            </View>
          </LineChart.Provider>
        ) : (
          candleData && candleData.length > 0 && (
            <CandlestickChart.Provider data={candleData}>
              <CandlestickChart width={CHART_WIDTH} height={CHART_HEIGHT}>
                <CandlestickChart.Candles 
                  positiveColor="#22c55e"
                  negativeColor="#ef4444"
                />
                <CandlestickChart.Crosshair color="#64748b">
                  <CandlestickChart.Tooltip 
                    textStyle={styles.tooltipText}
                  />
                </CandlestickChart.Crosshair>
              </CandlestickChart>

              {/* OHLC Labels */}
              <View style={styles.ohlcContainer}>
                <View style={styles.ohlcRow}>
                  <Text style={styles.ohlcLabel}>O: </Text>
                  <CandlestickChart.PriceText 
                    type="open"
                    style={styles.ohlcValue}
                    precision={2}
                  />
                </View>
                <View style={styles.ohlcRow}>
                  <Text style={styles.ohlcLabel}>H: </Text>
                  <CandlestickChart.PriceText 
                    type="high"
                    style={[styles.ohlcValue, { color: '#22c55e' }]}
                    precision={2}
                  />
                </View>
                <View style={styles.ohlcRow}>
                  <Text style={styles.ohlcLabel}>L: </Text>
                  <CandlestickChart.PriceText 
                    type="low"
                    style={[styles.ohlcValue, { color: '#ef4444' }]}
                    precision={2}
                  />
                </View>
                <View style={styles.ohlcRow}>
                  <Text style={styles.ohlcLabel}>C: </Text>
                  <CandlestickChart.PriceText 
                    type="close"
                    style={styles.ohlcValue}
                    precision={2}
                  />
                </View>
              </View>
            </CandlestickChart.Provider>
          )
        )}
      </View>

      {/* Chart Info */}
      <View style={styles.infoBar}>
        <View style={styles.infoItem}>
          <Ionicons name="time-outline" size={14} color="#64748b" />
          <Text style={styles.infoText}>{timeframe}</Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="pulse-outline" size={14} color="#64748b" />
          <Text style={styles.infoText}>Real-time</Text>
        </View>
        <View style={styles.infoItem}>
          <View style={[styles.indicator, { backgroundColor: lineColor }]} />
          <Text style={styles.infoText}>{symbol}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  price: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#0f172a',
    fontFamily: 'RubikBold',
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  change: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 4,
    fontFamily: 'RubikMedium',
  },
  controls: {
    flexDirection: 'row',
    gap: 8,
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    gap: 4,
  },
  controlButtonActive: {
    backgroundColor: '#3b82f6',
  },
  controlText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    fontFamily: 'RubikMedium',
  },
  controlTextActive: {
    color: '#ffffff',
  },
  chartContainer: {
    marginVertical: 8,
  },
  labels: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
    fontFamily: 'RubikBold',
  },
  dateLabel: {
    fontSize: 12,
    color: '#64748b',
    fontFamily: 'RubikRegular',
  },
  tooltipContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 8,
    borderRadius: 6,
  },
  tooltipText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'RubikMedium',
  },
  ohlcContainer: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },
  ohlcRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ohlcLabel: {
    fontSize: 12,
    color: '#64748b',
    fontFamily: 'RubikMedium',
  },
  ohlcValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0f172a',
    fontFamily: 'RubikBold',
  },
  infoBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoText: {
    fontSize: 11,
    color: '#64748b',
    fontFamily: 'RubikMedium',
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  emptyState: {
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: '#94a3b8',
    fontFamily: 'RubikMedium',
  },
});
