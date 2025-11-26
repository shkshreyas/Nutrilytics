import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';
import { Colors, GlobalStyles } from '../theme';

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - 40;
const CHART_HEIGHT = 200;
const BAR_WIDTH = 30;
const PADDING = 20;

interface NutrientChartProps {
  data: {
    nutrient: string;
    amount: number;
    unit: string;
    recommended: number;
  }[];
}

export default function NutrientChart({ data }: NutrientChartProps) {
  const chartData = data.map((item) => ({
    ...item,
    percentage: (item.amount / item.recommended) * 100,
  }));

  const maxPercentage = Math.max(...chartData.map((item) => item.percentage));
  const scale = CHART_HEIGHT / (Math.ceil(maxPercentage / 100) * 100);

  return (
    <View style={[GlobalStyles.card, styles.container]}>
      <Text style={GlobalStyles.sectionTitle}>Nutrient Intake</Text>

      <Svg width={CHART_WIDTH} height={CHART_HEIGHT + 40}>
        {/* Background grid lines */}
        {[0, 25, 50, 75, 100].map((value, index) => (
          <React.Fragment key={index}>
            <SvgText
              x={15}
              y={CHART_HEIGHT - value * scale}
              fontSize={10}
              fill={Colors.textSecondary}
              textAnchor="end"
            >
              {value}%
            </SvgText>
            <Rect
              x={20}
              y={CHART_HEIGHT - value * scale}
              width={CHART_WIDTH - 40}
              height={1}
              fill={Colors.border}
              opacity={0.5}
            />
          </React.Fragment>
        ))}

        {/* Bars */}
        {chartData.map((item, index) => {
          const barHeight = item.percentage * scale;
          const x = 40 + index * (BAR_WIDTH + PADDING);
          const y = CHART_HEIGHT - barHeight;

          return (
            <React.Fragment key={index}>
              {/* Bar */}
              <Rect
                x={x}
                y={y}
                width={BAR_WIDTH}
                height={barHeight}
                fill={item.percentage > 100 ? Colors.warning : Colors.primary}
                opacity={0.8}
              />

              {/* Percentage label */}
              <SvgText
                x={x + BAR_WIDTH / 2}
                y={y - 10}
                fontSize={10}
                fill={Colors.text}
                textAnchor="middle"
              >
                {Math.round(item.percentage)}%
              </SvgText>

              {/* Nutrient label */}
              <SvgText
                x={x + BAR_WIDTH / 2}
                y={CHART_HEIGHT + 20}
                fontSize={10}
                fill={Colors.text}
                textAnchor="middle"
              >
                {item.nutrient.substring(0, 3)}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>

      <View style={styles.legend}>
        {data.map((item, index) => (
          <View key={index} style={styles.legendItem}>
            <Text style={styles.legendLabel}>{item.nutrient}</Text>
            <Text style={styles.legendValue}>
              {item.amount}
              {item.unit} / {item.recommended}
              {item.unit}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    padding: 15,
    marginBottom: 20,
  },
  legend: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 10,
  },
  legendItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  legendLabel: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
  legendValue: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
});
