package io.dataease.datasource.provider;


import com.alibaba.excel.EasyExcel;
import com.alibaba.excel.ExcelReader;
import com.alibaba.excel.context.AnalysisContext;
import com.alibaba.excel.event.AnalysisEventListener;
import com.alibaba.excel.metadata.data.ReadCellData;
import com.alibaba.excel.read.metadata.ReadSheet;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.dataease.api.ds.vo.ExcelFileData;
import io.dataease.api.ds.vo.ExcelSheetData;
import io.dataease.datasource.dao.auto.entity.CoreDatasource;
import io.dataease.exception.DEException;
import io.dataease.extensions.datasource.dto.DatasetTableDTO;
import io.dataease.extensions.datasource.dto.DatasourceDTO;
import io.dataease.extensions.datasource.dto.DatasourceRequest;
import io.dataease.extensions.datasource.dto.TableField;
import io.dataease.utils.AuthUtils;
import io.dataease.utils.JsonUtil;
import lombok.Data;
import org.apache.commons.lang3.StringUtils;
import org.springframework.util.CollectionUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;


public class ExcelUtils {
    public static final String UFEFF = "\uFEFF";
    private static String path = "/opt/dataease2.0/data/excel/";
    private static ObjectMapper objectMapper = new ObjectMapper();

    private static TypeReference<List<TableField>> TableFieldListTypeReference = new TypeReference<List<TableField>>() {
    };

    private static TypeReference<List<ExcelSheetData>> sheets = new TypeReference<List<ExcelSheetData>>() {
    };

    public static void mergeSheets(CoreDatasource requestDatasource, DatasourceDTO sourceData) {
        List<ExcelSheetData> newSheets = JsonUtil.parseList(requestDatasource.getConfiguration(), sheets);
        List<String> tableNames = newSheets.stream().map(ExcelSheetData::getDeTableName).collect(Collectors.toList());
        List<ExcelSheetData> oldSheets = JsonUtil.parseList(sourceData.getConfiguration(), sheets);
        for (ExcelSheetData oldSheet : oldSheets) {
            if (!tableNames.contains(oldSheet.getDeTableName())) {
                newSheets.add(oldSheet);
            }
        }
        requestDatasource.setConfiguration(JsonUtil.toJSONString(newSheets).toString());
    }

    public static List<DatasetTableDTO> getTables(DatasourceRequest datasourceRequest) throws DEException {
        List<DatasetTableDTO> tableDescs = new ArrayList<>();
        try {
            JsonNode rootNode = objectMapper.readTree(datasourceRequest.getDatasource().getConfiguration());
            for (int i = 0; i < rootNode.size(); i++) {
                DatasetTableDTO datasetTableDTO = new DatasetTableDTO();
                datasetTableDTO.setTableName(rootNode.get(i).get("deTableName").asText());
                datasetTableDTO.setName(rootNode.get(i).get("deTableName").asText());
                datasetTableDTO.setDatasourceId(datasourceRequest.getDatasource().getId());
                datasetTableDTO.setLastUpdateTime(rootNode.get(i).get("lastUpdateTime") == null ? datasourceRequest.getDatasource().getCreateTime() : rootNode.get(i).get("lastUpdateTime").asLong(0L));
                tableDescs.add(datasetTableDTO);
            }
        } catch (Exception e) {
            DEException.throwException(e);
        }

        return tableDescs;
    }

    public static Map<String, String> getTableNamesMap(String configration) throws DEException {
        Map<String, String> result = new HashMap<>();
        try {
            JsonNode rootNode = objectMapper.readTree(configration);
            for (int i = 0; i < rootNode.size(); i++) {
                result.put(rootNode.get(i).get("tableName").asText(), rootNode.get(i).get("deTableName").asText());
            }
        } catch (Exception e) {
            DEException.throwException(e);
        }

        return result;
    }

    public static String getFileName(CoreDatasource datasource) throws DEException {
        try {
            JsonNode rootNode = objectMapper.readTree(datasource.getConfiguration());
            for (int i = 0; i < rootNode.size(); i++) {
                return rootNode.get(i).get("fileName").asText();
            }
        } catch (Exception e) {
            DEException.throwException(e);
        }
        return "";
    }

    public static String getSize(CoreDatasource datasource) throws DEException {
        try {
            JsonNode rootNode = objectMapper.readTree(datasource.getConfiguration());
            for (int i = 0; i < rootNode.size(); i++) {
                return rootNode.get(i).get("size").asText();
            }
        } catch (Exception e) {
            DEException.throwException(e);
        }

        return "0 B";
    }

    public List<String[]> fetchDataList(DatasourceRequest datasourceRequest) throws DEException {
        List<String[]> dataList = new ArrayList<>();
        try {
            JsonNode rootNode = objectMapper.readTree(datasourceRequest.getDatasource().getConfiguration());
            for (int i = 0; i < rootNode.size(); i++) {
                if (rootNode.get(i).get("deTableName").asText().equalsIgnoreCase(datasourceRequest.getTable())) {
                    List<TableField> tableFields = JsonUtil.parseList(rootNode.get(i).get("fields").toString(), TableFieldListTypeReference);
                    String suffix = rootNode.get(i).get("path").asText().substring(rootNode.get(i).get("path").asText().lastIndexOf(".") + 1);
                    InputStream inputStream = new FileInputStream(rootNode.get(i).get("path").asText());
                    if (StringUtils.equalsIgnoreCase(suffix, "csv")) {
                        BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream, StandardCharsets.UTF_8));
                        reader.readLine();//去掉表头
                        dataList = csvData(reader, false, tableFields.size());
                    } else {
                        dataList = fetchExcelDataList(rootNode.get(i).get("tableName").asText(), inputStream);
                    }
                }
            }
        } catch (Exception e) {
            DEException.throwException(e);
        }
        return dataList;
    }

    public List<String[]> fetchExcelDataList(String sheetName, InputStream inputStream) {
        NoModelDataListener noModelDataListener = new NoModelDataListener();
        ExcelReader excelReader = EasyExcel.read(inputStream, noModelDataListener).build();
        List<ReadSheet> sheets = excelReader.excelExecutor().sheetList();
        for (ReadSheet readSheet : sheets) {
            if (!sheetName.equalsIgnoreCase(readSheet.getSheetName())) {
                continue;
            }
            noModelDataListener.clear();
            List<TableField> fields = new ArrayList<>();
            excelReader.read(readSheet);
            for (String s : noModelDataListener.getHeader()) {
                TableField tableFiled = new TableField();
                tableFiled.setFieldType("TEXT");
                tableFiled.setName(s);
                tableFiled.setOriginName(s);
                fields.add(tableFiled);
            }
        }
        return noModelDataListener.getData();
    }

    public static List<TableField> getTableFields(DatasourceRequest datasourceRequest) throws DEException {
        List<TableField> tableFields = new ArrayList<>();
        TypeReference<List<TableField>> listTypeReference = new TypeReference<List<TableField>>() {
        };
        try {
            JsonNode rootNode = objectMapper.readTree(datasourceRequest.getDatasource().getConfiguration());
            for (int i = 0; i < rootNode.size(); i++) {
                if (rootNode.get(i).get("deTableName").asText().equalsIgnoreCase(datasourceRequest.getTable())) {
                    tableFields = JsonUtil.parseList(rootNode.get(i).get("fields").toString(), listTypeReference);
                }
            }
        } catch (Exception e) {
            DEException.throwException(e);
        }
        return tableFields;
    }

    public ExcelFileData excelSaveAndParse(MultipartFile file) throws DEException {
        String filename = file.getOriginalFilename();
        List<ExcelSheetData> excelSheetDataList = null;
        try {
            excelSheetDataList = parseExcel(filename, file.getInputStream(), true);
        } catch (Exception e) {
            DEException.throwException(e);
        }
        List<ExcelSheetData> returnSheetDataList = new ArrayList<>();
        returnSheetDataList = excelSheetDataList;
        returnSheetDataList = returnSheetDataList.stream()
                .filter(excelSheetData -> !CollectionUtils.isEmpty(excelSheetData.getFields()))
                .collect(Collectors.toList());
        // save file
        String excelId = UUID.randomUUID().toString();
        String filePath = saveFile(file, excelId);

        for (ExcelSheetData excelSheetData : returnSheetDataList) {
            if (excelSheetData.getExcelLabel().length() > 40) {
                DEException.throwException(excelSheetData.getExcelLabel() + "长度不能大于40！");
            }
            excelSheetData.setLastUpdateTime(System.currentTimeMillis());
            excelSheetData.setTableName(excelSheetData.getExcelLabel());
            excelSheetData.setDeTableName("excel_" + excelSheetData.getExcelLabel() + "_" + UUID.randomUUID().toString().replace("-", "").substring(0, 10));
            excelSheetData.setPath(filePath);
            excelSheetData.setSheetId(UUID.randomUUID().toString());
            excelSheetData.setSheetExcelId(excelId);
            excelSheetData.setFileName(filename);
            /**
             * dataease字段类型：0-文本，1-时间，2-整型数值，3-浮点数值，4-布尔，5-地理位置，6-二进制
             */
            for (TableField field : excelSheetData.getFields()) {
                if (field.getOriginName().length() > 40) {
                    DEException.throwException(excelSheetData.getExcelLabel() + "的字段" + field.getOriginName() + "长度不能大于40！");
                }
                //TEXT LONG DATETIME DOUBLE
                if (field.getFieldType().equalsIgnoreCase("TEXT")) {
                    field.setDeType(0);
                    field.setDeExtractType(0);
                }
                if (field.getFieldType().equalsIgnoreCase("DATETIME")) {
                    field.setDeType(1);
                    field.setDeExtractType(1);
                }
                if (field.getFieldType().equalsIgnoreCase("LONG")) {
                    field.setDeType(2);
                    field.setDeExtractType(2);
                }
                if (field.getFieldType().equalsIgnoreCase("DOUBLE")) {
                    field.setDeType(3);
                    field.setDeExtractType(3);
                }

            }
            long size = 0;
            String unit = "B";
            if (file.getSize() / 1024 == 0) {
                size = file.getSize();
            }
            if (0 < file.getSize() / 1024 && file.getSize() / 1024 < 1024) {
                size = file.getSize() / 1024;
                unit = "KB";
            }
            if (1024 <= file.getSize() / 1024) {
                size = file.getSize() / 1024 / 1024;
                unit = "MB";
            }
            excelSheetData.setSize(size + " " + unit);
        }
        ExcelFileData excelFileData = new ExcelFileData();
        excelFileData.setExcelLabel(filename.substring(0, filename.lastIndexOf('.')));
        excelFileData.setId(excelId);
        excelFileData.setPath(filePath);
        excelFileData.setSheets(returnSheetDataList);
        return excelFileData;
    }

    private static String saveFile(MultipartFile file, String fileNameUUID) throws DEException {
        String filePath = null;
        try {
            String filename = file.getOriginalFilename();
            String suffix = filename.substring(filename.lastIndexOf(".") + 1);
            String dirPath = path + AuthUtils.getUser().getUserId() + "/";
            File p = new File(dirPath);
            if (!p.exists()) {
                p.mkdirs();
            }
            filePath = dirPath + fileNameUUID + "." + suffix;
            File f = new File(filePath);
            FileOutputStream fileOutputStream = new FileOutputStream(f);
            fileOutputStream.write(file.getBytes());
            fileOutputStream.flush();
            fileOutputStream.close();
        } catch (Exception e) {
            DEException.throwException(e);
        }
        return filePath;
    }

    private static boolean isEmpty(List<String> cells) {
        if (CollectionUtils.isEmpty(cells)) {
            return true;
        }
        boolean isEmpty = true;
        for (int i = 0; i < cells.size(); i++) {
            if (isEmpty && StringUtils.isEmpty(cells.get(i))) {
                isEmpty = true;
            } else {
                isEmpty = false;
            }
        }
        return isEmpty;
    }

    public static List<String[]> csvData(BufferedReader reader, boolean isPreview, int size) throws DEException {
        List<String[]> data = new ArrayList<>();
        try {
            int num = 1;
            String line;
            while ((line = reader.readLine()) != null) {
                String str;
                line += ",";
                Pattern pCells = Pattern.compile("(\"[^\"]*(\"{2})*[^\"]*\")*[^,]*,");
                Matcher mCells = pCells.matcher(line);
                List<String> cells = new ArrayList();//每行记录一个list
                //读取每个单元格
                while (mCells.find()) {
                    str = mCells.group();
                    str = str.replaceAll("(?sm)\"?([^\"]*(\"{2})*[^\"]*)\"?.*,", "$1");
                    str = str.replaceAll("(?sm)(\"(\"))", "$2");
                    cells.add(str);
                }
                if (!isEmpty(cells)) {
                    if (cells.size() > size) {
                        cells = cells.subList(0, size);
                    }
                    data.add(cells.toArray(new String[]{}));
                    num++;
                }
            }
        } catch (Exception e) {
            DEException.throwException(e);
        }
        return data;
    }

    private String cellType(String value) {
        if (StringUtils.isEmpty(value) || value.length() > 19) {
            return "TEXT";
        }
        String regex = "^-?\\d+(\\.\\d+)?$";
        if (!value.matches(regex)) {
            return "TEXT";
        }
        try {
            Double d = Double.valueOf(value);
            double eps = 1e-10;
            if (d - Math.floor(d) < eps) {
                if (value.length() > 1 && value.startsWith("0")) {
                    return "TEXT";
                }
                return "LONG";
            } else {
                return "DOUBLE";
            }
        } catch (Exception e2) {
            return "TEXT";
        }
    }

    private void cellType(String value, int i, TableField tableFiled) {
        if (StringUtils.isEmpty(value)) {
            return;
        }
        if (i == 0) {
            tableFiled.setFieldType(cellType(value));
        } else {
            String type = cellType(value);
            if (tableFiled.getFieldType() == null) {
                tableFiled.setFieldType(type);
            } else {
                if (type.equalsIgnoreCase("TEXT")) {
                    tableFiled.setFieldType(type);
                }
                if (type.equalsIgnoreCase("DOUBLE") && tableFiled.getFieldType().equalsIgnoreCase("LONG")) {
                    tableFiled.setFieldType(type);
                }
            }
        }

    }

    @Data
    public class NoModelDataListener extends AnalysisEventListener<Map<Integer, String>> {
        private List<String[]> data = new ArrayList<>();
        private List<String> header = new ArrayList<>();
        private List<Integer> headerKey = new ArrayList<>();

        @Override
        public void invokeHead(Map<Integer, ReadCellData<?>> headMap, AnalysisContext context) {
            super.invokeHead(headMap, context);
            for (Integer key : headMap.keySet()) {
                ReadCellData<?> cellData = headMap.get(key);
                String value = cellData.getStringValue();
                if (StringUtils.isEmpty(value)) {
                    continue;
                }
                headerKey.add(key);
                header.add(value);
            }
        }

        @Override
        public void invoke(Map<Integer, String> dataMap, AnalysisContext context) {
            List<String> line = new ArrayList<>();
            for (Integer key : dataMap.keySet()) {
                String value = dataMap.get(key);
                if (StringUtils.isEmpty(value)) {
                    value = null;
                }
                if (headerKey.contains(key)) {
                    line.add(value);
                }
            }
            int size = line.size();
            if (size < header.size()) {
                for (int i = 0; i < header.size() - size; i++) {
                    line.add(null);
                }
            }
            data.add(line.toArray(new String[line.size()]));
        }

        @Override
        public void doAfterAllAnalysed(AnalysisContext analysisContext) {
        }

        public void clear() {
            data.clear();
            header.clear();
        }
    }


    public List<ExcelSheetData> parseExcel(String filename, InputStream inputStream, boolean isPreview) throws IOException {
        List<ExcelSheetData> excelSheetDataList = new ArrayList<>();
        String suffix = filename.substring(filename.lastIndexOf(".") + 1);
        if (StringUtils.equalsIgnoreCase(suffix, "xlsx") || StringUtils.equalsIgnoreCase(suffix, "xls")) {
            NoModelDataListener noModelDataListener = new NoModelDataListener();
            ExcelReader excelReader = EasyExcel.read(inputStream, noModelDataListener).build();
            List<ReadSheet> sheets = excelReader.excelExecutor().sheetList();
            for (ReadSheet readSheet : sheets) {
                noModelDataListener.clear();
                List<TableField> fields = new ArrayList<>();
                excelReader.read(readSheet);
                if (CollectionUtils.isEmpty(noModelDataListener.getHeader())) {
                    DEException.throwException(readSheet.getSheetName() + "首行不能为空！");
                }
                for (String s : noModelDataListener.getHeader()) {
                    TableField tableFiled = new TableField();
                    tableFiled.setFieldType(null);
                    tableFiled.setName(s);
                    tableFiled.setOriginName(s);
                    fields.add(tableFiled);
                }
                List<String[]> data = new ArrayList<>(noModelDataListener.getData());
                if (isPreview) {
                    for (int i = 0; i < data.size(); i++) {
                        for (int j = 0; j < data.get(i).length; j++) {
                            if (j < fields.size()) {
                                cellType(data.get(i)[j], i, fields.get(j));
                            }
                        }
                    }
                    if (data.size() > 100) {
                        data = data.subList(0, 100);
                    }
                }

                for (int i = 0; i < fields.size(); i++) {
                    if (StringUtils.isEmpty(fields.get(i).getFieldType())) {
                        fields.get(i).setFieldType("TEXT");
                    }
                }

                ExcelSheetData excelSheetData = new ExcelSheetData();
                excelSheetData.setFields(fields);
                excelSheetData.setData(data);
                excelSheetData.setFileName(filename);
                excelSheetData.setExcelLabel(readSheet.getSheetName());
                excelSheetDataList.add(excelSheetData);
            }
        }

        if (StringUtils.equalsIgnoreCase(suffix, "csv")) {
            List<TableField> fields = new ArrayList<>();
            BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream, StandardCharsets.UTF_8));
            String s = reader.readLine();// first line
            String[] split = s.split(",");
            for (int i = 0; i < split.length; i++) {
                String filedName = split[i];
                if (StringUtils.isEmpty(filedName)) {
                    DEException.throwException("首行行中不允许有空单元格！");
                }
                if (filedName.startsWith(UFEFF)) {
                    filedName = filedName.replace(UFEFF, "");
                }
                TableField tableFiled = new TableField();
                tableFiled.setName(filedName);
                tableFiled.setOriginName(filedName);
                tableFiled.setFieldType(null);
                fields.add(tableFiled);
            }

            List<String[]> data = csvData(reader, isPreview, fields.size());
            if (isPreview) {
                for (int i = 0; i < data.size(); i++) {
                    for (int j = 0; j < data.get(i).length; j++) {
                        if (j < fields.size()) {
                            cellType(data.get(i)[j], i, fields.get(j));
                        }
                    }
                }
                if (data.size() > 100) {
                    data = data.subList(0, 100);
                }
            }
            for (int i = 0; i < fields.size(); i++) {
                if (StringUtils.isEmpty(fields.get(i).getFieldType())) {
                    fields.get(i).setFieldType("TEXT");
                }
            }

            ExcelSheetData excelSheetData = new ExcelSheetData();
            String[] fieldArray = fields.stream().map(TableField::getName).toArray(String[]::new);
            excelSheetData.setFields(fields);
            excelSheetData.setData(data);
            excelSheetData.setFileName(filename);
            excelSheetData.setExcelLabel(filename.substring(0, filename.lastIndexOf('.')));
            excelSheetDataList.add(excelSheetData);
        }
        inputStream.close();

        for (ExcelSheetData excelSheetData : excelSheetDataList) {
            List<String[]> data = excelSheetData.getData();
            String[] fieldArray = excelSheetData.getFields().stream().map(TableField::getName).toArray(String[]::new);

            List<Map<String, Object>> jsonArray = new ArrayList<>();
            if (data != null) {
                jsonArray = data.stream().map(ele -> {
                    Map<String, Object> map = new HashMap<>();
                    for (int i = 0; i < fieldArray.length; i++) {
                        map.put(fieldArray[i], i < ele.length ? ele[i] : "");
                    }
                    return map;
                }).collect(Collectors.toList());
            }
            excelSheetData.setJsonArray(jsonArray);
        }

        return excelSheetDataList;
    }


}
