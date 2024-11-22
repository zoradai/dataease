declare type EditorProperty =
  | 'background-overall-component'
  | 'border-style'
  | 'basic-style-selector'
  | 'dual-basic-style-selector'
  | 'label-selector'
  | 'tooltip-selector'
  | 'x-axis-selector'
  | 'y-axis-selector'
  | 'dual-y-axis-selector'
  | 'title-selector'
  | 'legend-selector'
  | 'table-header-selector'
  | 'table-cell-selector'
  | 'table-total-selector'
  | 'text-selector'
  | 'misc-selector'
  | 'misc-style-selector'
  | 'function-cfg'
  | 'assist-line'
  | 'scroll-cfg'
  | 'threshold'
  | 'map-mapping'
  | 'jump-set'
  | 'linkage'
  | 'indicator-value-selector'
  | 'indicator-name-selector'
  | 'quadrant-selector'
  | 'map-symbolic-selector'
  | 'flow-map-line-selector'
  | 'flow-map-point-selector'
  | 'bubble-animate'
declare type EditorPropertyInner = {
  [key in EditorProperty]?: string[]
}

declare type EditorSelectorSpec = {
  [key in EditorProperty]?: {
    title: string
  }
}
/**
 * 轴类型
 */
declare type AxisType =
  | 'xAxis'
  | 'yAxis'
  | 'xAxisExt'
  | 'xAxisExtRight'
  | 'yAxisExt'
  | 'extBubble'
  | 'drill'
  | 'filter'
  | 'extStack'
  | 'extLabel'
  | 'extTooltip'
  | 'area'
  | 'flowMapStartName'
  | 'flowMapEndName'
  | 'extColor'
  | 'drillFields'
/**
 * 轴配置
 */
declare type AxisConfig = {
  [key in AxisType]?: AxisSpec
}
/**
 * 轴类型详细配置
 */
declare type AxisSpec = {
  /**
   * 轴名称
   */
  name: string
  /**
   * 轴类型限制, 没有表示不限制
   */
  type?: 'q' | 'd'
  /**
   * 轴维度/指标数量限制, 0表示不限制
   */
  limit?: number
  /**
   * 轴是否允许重复
   */
  duplicate?: boolean
  /**
   * 轴提示
   */
  tooltip?: string
  /**
   * 允许为空
   */
  allowEmpty?: boolean
}
/**
 * 图表编辑表单
 */
declare interface ChartEditorForm<T> {
  /**
   * 属性表单
   */
  data: T
  /**
   * 是否拉取数据
   */
  requestData: boolean
  /**
   * 是否渲染图表
   */
  render: boolean
  /**
   * 子属性
   */
  prop?: string
}
/**
 * 轴编辑表单
 */
declare interface AxisEditForm {
  /**
   * 轴类型
   */
  axisType: AxisType
  /**
   * 变更内容
   */
  axis: Axis[]
  /**
   * 变更类型
   */
  editType: 'add' | 'remove' | 'update'
}
