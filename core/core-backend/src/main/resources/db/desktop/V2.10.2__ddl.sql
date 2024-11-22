INSERT INTO area (id, level, name, pid)
VALUES ('156440315', 'district', '大鹏新区', '156440300');

delete
from data_visualization_info dvi
where dvi.delete_flag = 1;

ALTER TABLE `core_chart_view`
    ADD COLUMN `custom_attr_mobile` longtext NULL COMMENT '图形属性_移动端';
ALTER TABLE `core_chart_view`
    ADD COLUMN `custom_style_mobile` longtext NULL COMMENT '组件样式_移动端';
