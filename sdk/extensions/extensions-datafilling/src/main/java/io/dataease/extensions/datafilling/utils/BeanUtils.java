package io.dataease.extensions.datafilling.utils;

import io.dataease.license.utils.LogUtil;
import org.apache.commons.lang3.StringUtils;

import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.List;

public class BeanUtils {

    public static <T> T copyBean(T target, Object source) {
        try {
            org.springframework.beans.BeanUtils.copyProperties(source, target);
            return target;
        } catch (Exception e) {
            throw new RuntimeException("Failed to copy object: ", e);
        }
    }

    public static <T> T copyBean(T target, Object source, String... ignoreProperties) {
        try {
            org.springframework.beans.BeanUtils.copyProperties(source, target, ignoreProperties);
            return target;
        } catch (Exception e) {
            throw new RuntimeException("Failed to copy object: ", e);
        }
    }

    public static Object getFieldValueByName(String fieldName, Object bean) {
        try {
            if (StringUtils.isBlank(fieldName)) {
                return null;
            }
            String firstLetter = fieldName.substring(0, 1).toUpperCase();
            String getter = "get" + firstLetter + fieldName.substring(1);
            Method method = bean.getClass().getMethod(getter);
            return method.invoke(bean);
        } catch (Exception e) {
            LogUtil.error("failed to getFieldValueByName. ", e);
            return null;
        }
    }

    public static void setFieldValueByName(Object bean, String fieldName, Object value, Class<?> type) {
        try {
            if (StringUtils.isBlank(fieldName)) {
                return;
            }
            String firstLetter = fieldName.substring(0, 1).toUpperCase();
            String setter = "set" + firstLetter + fieldName.substring(1);
            Method method = bean.getClass().getMethod(setter, type);
            method.invoke(bean, value);
        } catch (Exception e) {
            LogUtil.error("failed to setFieldValueByName. ", e);
        }
    }

    public static Method getMethod(Object bean, String fieldName, Class<?> type) {
        try {
            if (StringUtils.isBlank(fieldName)) {
                return null;
            }
            String firstLetter = fieldName.substring(0, 1).toUpperCase();
            String setter = "set" + firstLetter + fieldName.substring(1);
            return bean.getClass().getMethod(setter, type);
        } catch (Exception e) {
            return null;
        }
    }

    public static List<String> getFieldNames(Class<?> clazz) {
        List<String> fieldNames = new ArrayList<>();
        Field[] fields = clazz.getDeclaredFields();
        for (Field field : fields) {
            fieldNames.add(field.getName());
        }
        return fieldNames;
    }
}
