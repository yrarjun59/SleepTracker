// components/analytics/SleepLineChart.tsx
import { useTheme } from "@/contexts/ThemeContext";
import { SleepTimePoint } from "@/utils/analyticsHelpers";
import { useFormattedTime } from "@/utils/formatTime";
import { useState } from "react";
import { LayoutChangeEvent, StyleSheet, Text, View } from "react-native";
import Svg, {
  Circle,
  Defs,
  G,
  LinearGradient,
  Path,
  Rect,
  Stop,
  Text as SvgText,
} from "react-native-svg";

interface Props {
  data: SleepTimePoint[];
  width?: number; // fixed width for horizontal scroll
  height?: number;
}

export function SleepLineChart({
  data,
  width: fixedWidth,
  height = 200,
}: Props) {
  const { colors } = useTheme();
  const formatTime = useFormattedTime();
  const [containerWidth, setContainerWidth] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const onLayout = (e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  };

  const width = fixedWidth ?? containerWidth;

  if (width === 0) {
    return <View onLayout={onLayout} style={{ height }} />;
  }

  if (data.length === 0) {
    return <Text style={{ color: colors.mutedForeground }}>No data</Text>;
  }

  // Find min/max bedtime for scaling
  const bedtimes = data
    .map((d) => d.bedtime)
    .filter((v): v is number => v !== null);
  let minY = 0;
  let maxY = 24 * 60;
  if (bedtimes.length > 0) {
    minY = Math.max(0, Math.min(...bedtimes) - 60);
    maxY = Math.min(24 * 60, Math.max(...bedtimes) + 60);
  }

  const margin = { top: 20, right: 20, bottom: 30, left: 45 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  const xSpacing = data.length > 1 ? chartWidth / (data.length - 1) : 0;
  const getX = (index: number) => margin.left + index * xSpacing;
  const getY = (minutes: number) =>
    margin.top + chartHeight - ((minutes - minY) / (maxY - minY)) * chartHeight;

  // Build bedtime path and points
  let bedPathD = "";
  const bedPoints: {
    x: number;
    y: number;
    value: number;
    label: string;
    index: number;
  }[] = [];
  data.forEach((p, i) => {
    if (p.bedtime !== null) {
      const x = getX(i);
      const y = getY(p.bedtime);
      bedPoints.push({ x, y, value: p.bedtime, label: p.date, index: i });
      if (bedPathD === "") bedPathD = `M ${x} ${y}`;
      else bedPathD += ` L ${x} ${y}`;
    }
  });

  const bottomY = margin.top + chartHeight;
  const areaPathD =
    bedPoints.length > 0
      ? `${bedPathD} L ${getX(data.length - 1)} ${bottomY} L ${getX(0)} ${bottomY} Z`
      : "";

  // Y-axis ticks (every 3 hours for clarity)
  const yTicks = [];
  const tickStep = 180; // 3 hours
  for (
    let minutes = Math.ceil(minY / tickStep) * tickStep;
    minutes <= maxY;
    minutes += tickStep
  ) {
    const y = getY(minutes);
    yTicks.push(
      <G key={minutes}>
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
          {formatTime(
            new Date(0, 0, 0, Math.floor(minutes / 60), minutes % 60),
          )}
        </SvgText>
      </G>,
    );
  }

  // X-axis labels
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

  const selectedPoint =
    selectedIndex !== null
      ? bedPoints.find((p) => p.index === selectedIndex)
      : null;

  return (
    <View
      style={[styles.container, { borderColor: colors.border }]}
      onLayout={onLayout}
    >
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: colors.accent }]} />
          <Text style={[styles.legendText, { color: colors.textSecondary }]}>
            Bedtime
          </Text>
        </View>
      </View>

      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="bedArea" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.accent} stopOpacity={0.3} />
            <Stop offset="1" stopColor={colors.accent} stopOpacity={0.05} />
          </LinearGradient>
        </Defs>

        {yTicks}
        {areaPathD ? <Path d={areaPathD} fill="url(#bedArea)" /> : null}
        {bedPathD ? (
          <Path
            d={bedPathD}
            stroke={colors.accent}
            strokeWidth={2}
            fill="none"
          />
        ) : null}

        {bedPoints.map((pt) => (
          <Circle
            key={pt.index}
            cx={pt.x}
            cy={pt.y}
            r={4}
            fill={colors.accent}
            onPress={() =>
              setSelectedIndex((prev) => (prev === pt.index ? null : pt.index))
            }
          />
        ))}

        {/* Selected point time label rendered directly at the point */}
        {selectedPoint && (
          <G>
            <Rect
              x={selectedPoint.x + 8}
              y={selectedPoint.y - 12}
              width={70}
              height={20}
              rx={4}
              fill={colors.card}
              stroke={colors.border}
              strokeWidth={0.5}
            />
            <SvgText
              x={selectedPoint.x + 12}
              y={selectedPoint.y + 2}
              fontSize={10}
              fill={colors.foreground}
            >
              {formatTime(
                new Date(
                  0,
                  0,
                  0,
                  Math.floor(selectedPoint.value / 60),
                  selectedPoint.value % 60,
                ),
              )}
            </SvgText>
          </G>
        )}

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
