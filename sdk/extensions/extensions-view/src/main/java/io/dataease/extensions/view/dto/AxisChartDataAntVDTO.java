package io.dataease.extensions.view.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

/**
 * @Author gin
 */
@Data
public class AxisChartDataAntVDTO {
    private BigDecimal value;
    private List<ChartDimensionDTO> dimensionList;
    private List<ChartQuotaDTO> quotaList;
    private String field;
    private String name;
    private String category;
    private BigDecimal popSize;
    private String group;
    private List<DynamicValueDTO> dynamicLabelValue;
    private List<DynamicValueDTO> dynamicTooltipValue;
}
