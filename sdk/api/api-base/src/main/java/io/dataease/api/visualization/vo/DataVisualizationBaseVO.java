package io.dataease.api.visualization.vo;

import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import io.dataease.model.ITreeBase;
import lombok.Data;

import java.util.List;

@Data
public class DataVisualizationBaseVO implements ITreeBase<DataVisualizationBaseVO> {

    @JsonSerialize(using = ToStringSerializer.class)
    private Long id;

    private String name;

    private String label;

    private String nodeType;

    @JsonSerialize(using = ToStringSerializer.class)
    private Long pid;

    /**
     * 移动端布局
     */
    private String mobileLayout;

    /**
     * 创建时间
     */
    private Long createTime;

    /**
     * 创建人
     */
    private String createBy;

    /**
     * 更新时间
     */
    private Long updateTime;

    /**
     * 更新人
     */
    private String updateBy;

    private List<DataVisualizationBaseVO> children;
}
