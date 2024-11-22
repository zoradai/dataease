package io.dataease.api.dataset.union;

import io.dataease.extensions.datasource.dto.DatasetTableDTO;
import io.dataease.extensions.datasource.dto.DatasetTableFieldDTO;
import lombok.Data;

import java.io.Serializable;
import java.util.List;

/**
 * @Author gin
 */
@Data
public class UnionDTO implements Serializable {
    private DatasetTableDTO currentDs;
    private List<Long> currentDsField;
    private List<DatasetTableFieldDTO> currentDsFields;
    private List<UnionDTO> childrenDs;
    private UnionParamDTO unionToParent;
    private int allChildCount;
}
