package io.dataease.api.ds.vo;

import io.dataease.extensions.datasource.dto.TableField;
import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
public class ExcelSheetData {
    private String excelLabel;
    private List<String[]> data;
    private List<TableField> fields;
    private String tableName;
    private String fileName;
    private String size;
    private String deTableName;
    private Long lastUpdateTime;
    private String path;
    private boolean isSheet = true;
    private String sheetId;
    private String sheetExcelId;
    private List<Map<String, Object>> jsonArray;

}
