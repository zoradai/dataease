package io.dataease.visualization.utils;

import io.dataease.engine.constant.DeTypeConstants;
import io.dataease.utils.FileUtils;
import io.dataease.utils.LogUtil;
import io.dataease.visualization.bo.ExcelSheetModel;
import org.apache.commons.collections4.CollectionUtils;
import org.apache.commons.lang3.StringUtils;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.streaming.SXSSFWorkbook;

import java.io.BufferedOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.util.List;
import java.util.concurrent.atomic.AtomicReference;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class VisualizationExcelUtils {

    private static final String suffix = ".xlsx";
    private static final String BASE_ROOT = "/opt/dataease2.0/data/report/";

    public static File exportExcel(List<ExcelSheetModel> sheets, String fileName, String folderId) throws Exception {
        AtomicReference<String> realFileName = new AtomicReference<>(fileName);
        Workbook wb = new SXSSFWorkbook();

        sheets.forEach(sheet -> {

            List<List<String>> details = sheet.getData();
            List<Integer> fieldTypes = sheet.getFiledTypes();
            details.add(0, sheet.getHeads());
            String sheetName = sheet.getSheetName();
            Pattern pattern = Pattern.compile("[\\s\\\\/:\\*\\?\\\"<>\\|]");
            Matcher matcher = pattern.matcher(sheetName);
            sheetName = matcher.replaceAll("-");
            Sheet curSheet = wb.createSheet(sheetName);
            if (StringUtils.isBlank(fileName)) {
                String cName = sheetName + suffix;
                realFileName.set(cName);
            }

            CellStyle cellStyle = wb.createCellStyle();
            Font font = wb.createFont();
            font.setFontHeightInPoints((short) 12);
            font.setBold(true);
            cellStyle.setFont(font);
            cellStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
            cellStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            if (CollectionUtils.isNotEmpty(details)) {
                for (int i = 0; i < details.size(); i++) {
                    Row row = curSheet.createRow(i);
                    List<String> rowData = details.get(i);
                    if (rowData != null) {
                        for (int j = 0; j < rowData.size(); j++) {
                            Cell cell = row.createCell(j);
                            // with DataType
                            if (i > 0 && (fieldTypes.get(j).equals(DeTypeConstants.DE_INT) || fieldTypes.get(j).equals(DeTypeConstants.DE_FLOAT)) && StringUtils.isNotEmpty(rowData.get(j))) {
                                cell.setCellValue(Double.valueOf(rowData.get(j)));
                            } else {
                                cell.setCellValue(rowData.get(j));
                            }
                            if (i == 0) {// 头部
                                cell.setCellStyle(cellStyle);
                                // 设置列的宽度
                                curSheet.setColumnWidth(j, 255 * 20);
                            }
                        }
                    }
                }
            }
        });
        if (!StringUtils.endsWith(fileName, suffix)) {
            realFileName.set(realFileName.get() + suffix);
        }
        String folderPath = BASE_ROOT;
        if (StringUtils.isNotBlank(folderId)) {
            folderPath = BASE_ROOT + folderId + "/";
        }

        folderPath += Thread.currentThread().getId() + "/";
        FileUtils.validateExist(folderPath);
        File result = new File(folderPath + realFileName.get());
        FileOutputStream fos = new FileOutputStream(result);
        BufferedOutputStream outputStream = new BufferedOutputStream(fos);
        try {
            wb.write(outputStream);
        } catch (Exception e) {
            LogUtil.error(e.getMessage(), new Throwable(e));
            throw e;
        } finally {
            wb.close();
            outputStream.flush();
            outputStream.close();
        }
        return result;
    }
}
