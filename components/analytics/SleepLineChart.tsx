// components/analytics/SleepLineChart.tsx
import { useTheme } from "@/contexts/ThemeContext";
import { SleepTimePoint } from "@/utils/analyticsHelpers";
import { useFormattedTime } from "@/utils/formatTime";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle, G, Path, Text as SvgText } from "react-native-svg";

interface Props {
  data: SleepTimePoint[];
  width?: number;
  height?: number;
}

export function SleepLineChart({ data, width = 300, height = 180 }: Props) {
  const { colors } = useTheme();
  const formatTime = useFormattedTime();

  if (data.length === 0) {
    return <Text style={{ color: colors.mutedForeground }}>No data</Text>;
  }

  const margin = { top: 20, right: 20, bottom: 30, left: 40 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  const maxY = 24 * 60; // minutes in a day

  const xSpacing = chartWidth / (data.length - 1);
  const getX = (index: number) => margin.left + index * xSpacing;
  const getY = (minutes: number) =>
    margin.top + chartHeight - (minutes / maxY) * chartHeight;

  // Create path data for bedtime and wakeup lines
  const buildPath = (selector: (p: SleepTimePoint) => number | null) => {
    let d = "";
    data.forEach((p, i) => {
      const value = selector(p);
      if (value !== null) {
        const x = getX(i);
        const y = getY(value);
        if (d === "") d = `M ${x} ${y}`;
        else d += ` L ${x} ${y}`;
      }
    });
    return d;
  };

  const bedPath = buildPath((p) => p.bedtime);
  const wakePath = buildPath((p) => p.wakeTime);

  // Y-axis ticks every 3 hours
  const yTicks = [];
  for (let hour = 0; hour <= 24; hour += 3) {
    const y = getY(hour * 60);
    yTicks.push(
      <G key={hour}>
        <Path
          d={`M ${margin.left} ${y} L ${width - margin.right} ${y}`}
          stroke={colors.border}
          strokeWidth={0.5}
        />
        <SvgText
          x={margin.left - 8}
          y={y + 4}
          fontSize={10}
          fill={colors.mutedForeground}
          textAnchor="end"
        >
          {formatTime(new Date(0, 0, 0, hour))}
        </SvgText>
      </G>,
    );
  }

  // X-axis labels (first, last, and a few in between)
  const xLabels = data.map((p, i) => {
    const shouldShow =
      i === 0 || i === data.length - 1 || i % Math.ceil(data.length / 5) === 0;
    if (!shouldShow) return null;
    return (
      <SvgText
        key={i}
        x={getX(i)}
        y={height - margin.bottom + 15}
        fontSize={10}
        fill={colors.mutedForeground}
        textAnchor="middle"
      >
        {p.date}
      </SvgText>
    );
  });

  // Dots for each point
  const renderDots = (
    selector: (p: SleepTimePoint) => number | null,
    color: string,
  ) =>
    data.map((p, i) => {
      const value = selector(p);
      if (value === null) return null;
      return (
        <Circle key={i} cx={getX(i)} cy={getY(value)} r={3} fill={color} />
      );
    });

  return (
    <View style={[styles.container, { borderColor: colors.border }]}>
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: colors.accent }]} />
          <Text style={[styles.legendText, { color: colors.textSecondary }]}>
            Bedtime
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: colors.success }]} />
          <Text style={[styles.legendText, { color: colors.textSecondary }]}>
            Wake‑up
          </Text>
        </View>
      </View>

      <Svg width={width} height={height}>
        {yTicks}
        {bedPath ? (
          <Path
            d={bedPath}
            stroke={colors.accent}
            strokeWidth={2}
            fill="none"
          />
        ) : null}
        {wakePath ? (
          <Path
            d={wakePath}
            stroke={colors.success}
            strokeWidth={2}
            fill="none"
          />
        ) : null}
        {renderDots((p) => p.bedtime, colors.accent)}
        {renderDots((p) => p.wakeTime, colors.success)}
        {xLabels}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 8,
    marginBottom: 16,
  },
  legend: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 16,
    marginBottom: 8,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  legendText: {
    fontSize: 12,
  },
});
