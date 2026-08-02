import { useTheme } from '../../context/ThemeContext';
import { CATEGORICAL } from '../../utils/constants';

/** Resolve chart colors for the active theme. Kept as hex (Recharts needs
 *  concrete colors) but mirrors the CSS custom properties in index.css. */
export function useChartColors() {
  const { isDark } = useTheme();
  return {
    isDark,
    income: isDark ? '#199e70' : '#1baf7a',
    expense: isDark ? '#e66767' : '#e34948',
    brand: isDark ? '#3987e5' : '#2a78d6',
    grid: isDark ? '#2c2c2a' : '#e1e0d9',
    axis: isDark ? '#898781' : '#898781',
    text: isDark ? '#c3c2b7' : '#52514e',
    surface: isDark ? '#1a1a19' : '#ffffff',
    categorical: isDark ? CATEGORICAL.dark : CATEGORICAL.light,
  };
}
