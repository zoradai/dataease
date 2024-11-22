import { AbstractChartView, ChartLibraryType, ChartRenderType } from '../../types'
import { useI18n } from '@/hooks/web/useI18n'

const { t } = useI18n()
/**
 * 指标卡图表
 */
export class IndicatorChartView extends AbstractChartView {
  properties: EditorProperty[] = [
    'background-overall-component',
    'border-style',
    'title-selector',
    'indicator-value-selector',
    'indicator-name-selector',
    'threshold',
    'function-cfg'
  ]
  propertyInner: EditorPropertyInner = {
    'background-overall-component': ['all'],
    'border-style': ['all'],
    'title-selector': [
      'title',
      'fontSize',
      'color',
      'hPosition',
      'isItalic',
      'isBolder',
      'remarkShow',
      'fontFamily',
      'letterSpace',
      'fontShadow'
    ],
    'indicator-value-selector': [
      'fontSize',
      'color',
      'hPosition',
      'isItalic',
      'isBolder',
      'fontFamily',
      'letterSpace',
      'fontShadow'
    ],
    'indicator-name-selector': [
      'title',
      'fontSize',
      'color',
      'hPosition',
      'isItalic',
      'isBolder',
      'fontFamily',
      'letterSpace',
      'fontShadow'
    ],
    'function-cfg': ['emptyDataStrategy']
  }
  axis: AxisType[] = ['yAxis', 'filter']
  axisConfig: AxisConfig = {
    yAxis: {
      name: `${t('chart.quota')}`,
      limit: 1
    }
  }
  constructor() {
    super(ChartRenderType.CUSTOM, ChartLibraryType.INDICATOR, 'indicator')
  }
}
