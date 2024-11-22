/**
 * 高级设置
 */
declare interface ChartSenior {
  /**
   * 功能设置
   */
  functionCfg: ChartFunctionCfg
  /**
   * 辅助线
   */
  assistLineCfg: ChartAssistLineCfg
  /**
   * 阈值
   */
  threshold: ChartThreshold
  /**
   * 滚动设置
   */
  scrollCfg: ScrollCfg
  /**
   * 区域称映射，{区域id: {原始名称: 映射名称}}
   */
  areaMapping: Record<string, Record<string, string>>
  /**
   * 气泡动效
   */
  bubbleCfg: BubbleCfg
}

/**
 * 功能设置
 */
declare interface ChartFunctionCfg {
  /**
   * 缩略轴显隐
   */
  sliderShow: boolean
  /**
   * 缩略轴范围
   */
  sliderRange: number[]
  /**
   * 缩略轴背景颜色
   */
  sliderBg: string
  /**
   * 缩略轴选中背景
   */
  sliderFillBg: string
  /**
   * 缩略轴字体颜色
   */
  sliderTextColor: string
  /**
   * 空值处理
   */
  emptyDataStrategy: string
  /**
   * 自定义值
   */
  emptyDataCustomValue: string
  /**
   * 空值字段控制
   */
  emptyDataFieldCtrl: []
}

/**
 * 辅助线设置
 */
declare interface ChartAssistLineCfg {
  /**
   * 是否启用
   */
  enable: boolean
  /**
   * 辅助线配置
   */
  assistLine: AssistLine[]
}
/**
 * 辅助线
 */
declare interface AssistLine {
  /**
   * 辅助线名称
   */
  name: string
  /**
   * 类型为固定的值
   */
  value: string
  /**
   * 辅助线类型: 0 固定, 1 动态
   */
  field: string
  /**
   * 线条颜色
   */
  color: string
  /**
   * 线条类型: solid,dash,dotted
   */
  lineType: string
  /**
   * 字体大小
   */
  fontSize: number
  /**
   * 动态值字段id
   */
  fieldId: string
  /**
   * 动态值聚合方式
   */
  summary: string

  yAxisType: 'left' | 'right'
}

/**
 * 阈值设置
 */
declare interface ChartThreshold {
  /**
   * 是否启用
   */
  enable: boolean
  /**
   * 仪表盘阈值: x,y,z
   */
  gaugeThreshold: string
  /**
   * 水波图阈值: x,y,z
   */
  liquidThreshold: string
  /**
   * 指标卡阈值
   */
  labelThreshold: Threshold[]
  /**
   * 表格阈值
   */
  tableThreshold: TableThreshold[]
  /**
   * 文本卡阈值
   */
  textLabelThreshold: Threshold[]
  /**
   * 折线阈值
   */
  lineThreshold: TableThreshold[]
}
declare interface TableThreshold {
  /**
   * 字段id
   */
  fieldId: string
  /**
   * 字段
   */
  field: ChartViewField
  /**
   * 条件
   */
  conditions: Threshold[]
}
/**
 * 阈值
 */
declare interface Threshold {
  /**
   * 最小值
   */
  min: number
  /**
   * 最大值
   */
  max: number
  /**
   * 对比方式
   */
  term: string
  /**
   * 字段
   */
  field: ChartViewField
  /**
   * 目标值
   */
  value: string | number
  /**
   * 颜色
   */
  color: string
  /**
   * 背景颜色
   */
  backgroundColor: string
  /**
   * url
   */
  url: string
  /**
   * 类型，固定值、动态值
   */
  type: 'fixed' | 'dynamic'
  /**
   * 动态值字段
   */
  dynamicField: ThresholdDynamicField
  /**
   * 动态值最小值字段 仅当term为between时使用
   */
  dynamicMinField: ThresholdDynamicField
  /**
   * 动态值最大值字段 仅当term为between时使用
   */
  dynamicMaxField: ThresholdDynamicField
}

declare interface ThresholdDynamicField {
  fieldId: string
  summary: string
  field: ChartViewField
}

/**
 * 滚动设置
 */
declare interface ScrollCfg {
  /**
   * 启停
   */
  open: boolean
  /**
   * 滚动行数
   */
  row: number
  /**
   * 滚动间隔
   */
  interval: number
  /**
   * 滚动步长
   */
  step: number
}

/**
 * 气泡动效设置
 */
declare interface BubbleCfg {
  /**
   * 开启动效
   */
  enable: boolean
  /**
   * 动效类型
   */
  type: 'wave'
  /**
   * 水波速度
   */
  speed: number
  /**
   * 水波环数
   */
  rings: number
}
