import {
  AntVAbstractChartView,
  AntVDrawOptions,
  ChartLibraryType
} from '@/views/chart/components/js/panel/types'
import {
  S2Theme,
  SpreadSheet,
  Style,
  S2Options,
  Meta,
  SERIES_NUMBER_FIELD,
  setTooltipContainerStyle,
  S2DataConfig
} from '@antv/s2'
import {
  configHeaderInteraction,
  configMergeCells,
  configTooltip,
  getConditions,
  getCustomTheme,
  getStyle,
  handleTableEmptyStrategy
} from '@/views/chart/components/js/panel/common/common_table'
import '@antv/s2/dist/style.min.css'
import { find } from 'lodash-es'

declare interface PageInfo {
  currentPage: number
  pageSize: number
  total: number
}

export interface S2DrawOptions<O> extends AntVDrawOptions<O> {
  pageInfo?: PageInfo
  resizeAction?: (...args: any) => void
}
export abstract class S2ChartView<P extends SpreadSheet> extends AntVAbstractChartView {
  public abstract drawChart(drawOption: S2DrawOptions<P>): P
  protected constructor(name: string, defaultData: any[]) {
    super(ChartLibraryType.S2, name, defaultData)
  }
  protected configTheme(chart: Chart): S2Theme {
    return getCustomTheme(chart)
  }

  protected configStyle(chart: Chart, s2DataConfig: S2DataConfig): Style {
    return getStyle(chart, s2DataConfig)
  }

  protected configEmptyDataStrategy(chart: Chart): Record<string, any>[] {
    return handleTableEmptyStrategy(chart)
  }

  protected configTooltip(chart: Chart, option: S2Options) {
    configTooltip(chart, option)
  }

  protected configHeaderInteraction(chart: Chart, option: S2Options) {
    configHeaderInteraction(chart, option)
  }

  protected configConditions(chart: Chart) {
    return getConditions(chart)
  }

  protected configMergeCells(chart: Chart, option: S2Options, dataConfig: S2DataConfig) {
    configMergeCells(chart, option, dataConfig)
  }

  protected showTooltip(s2Instance: P, event, metaConfig: Meta[]) {
    const cell = s2Instance.getCell(event.target)
    const meta = cell.getMeta()
    let content = ''
    let field
    switch (cell.cellType) {
      case 'dataCell':
      case 'mergedCell':
        if (meta.valueField === SERIES_NUMBER_FIELD) {
          content = meta.fieldValue.toString()
          break
        }
        field = find(metaConfig, item => item.field === meta.valueField)
        if (meta.fieldValue === 0) {
          content = '0'
        }
        if (meta.fieldValue) {
          content = field?.formatter?.(meta.fieldValue)
        }
        break
      case 'rowCell':
      case 'colCell':
        content = meta.label
        field = find(metaConfig, item => item.field === content)
        if (field) {
          content = field.name
        }
        break
    }
    if (!content) {
      return
    }
    event.s2Instance = s2Instance
    const style = s2Instance.options.tooltip.style
    setTooltipContainerStyle(s2Instance.tooltip.container, { style })
    s2Instance.showTooltip({
      position: {
        x: event.clientX,
        y: event.clientY
      },
      content,
      meta,
      event
    })
  }
}
