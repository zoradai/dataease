package io.dataease.api.dataset.vo;

import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import io.dataease.api.chart.vo.ChartBaseVO;
import lombok.Data;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

@Data
public class CoreDatasetGroupVO implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * ID
     */
    @JsonSerialize(using = ToStringSerializer.class)
    private Long id;

    /**
     * 名称
     */
    private String name;

    /**
     * 父级ID
     */
    @JsonSerialize(using = ToStringSerializer.class)
    private Long pid;

    /**
     * 当前分组处于第几级
     */
    private Integer level;

    /**
     * node类型：folder or dataset
     */
    private String nodeType;

    /**
     * sql,union
     */
    private String type;

    /**
     * 连接模式：0-直连，1-同步(包括excel、api等数据存在de中的表)
     */
    private Integer mode;

    /**
     * 关联关系树
     */
    private String info;

    /**
     * 创建人ID
     */
    private String createBy;

    /**
     * 创建时间
     */
    private Long createTime;

    private String qrtzInstance;

    /**
     * 同步状态
     */
    private String syncStatus;

    /**
     * 更新人ID
     */
    private String updateBy;

    /**
     * 最后同步时间
     */
    private Long lastUpdateTime;

    /**
     * 关联sql
     */
    private String unionSql;

    private List<CoreDatasetTableFieldVO> datasetFields = new ArrayList<>();

    private List<ChartBaseVO> datasetViews = new ArrayList<>();
}
