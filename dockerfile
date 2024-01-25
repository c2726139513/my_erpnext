#FROM frappe/erpnext:v15.0.0
USER root
RUN     sed -i 's/deb.debian.org/mirrors.ustc.edu.cn/g' /etc/apt/sources.list.d/debian.sources \
        && apt-get update \
        && apt-get install ttf-wqy-zenhei -y \
        && apt-get install ttf-wqy-microhei -y
USER frappe
RUN cd /home/frappe/frappe-bench \
        && pip config set global.index-url https://pypi.tuna.tsinghua.edu.cn/simple \
        && bench get-app https://gitee.com/yuzelin/erpnext_chinese.git \
        && bench get-app --branch version-15 https://gitee.com/yuzelin/erpnext_oob.git \
        && bench get-app payments \
        && bench set-config -gp socketio_port 9000 \
        && bench get-app --branch version-15 hrms \
        && bench get-app print_designer \
        && bench get-app https://github.com/c2726139513/my_erpnext \
        && bench get-app https://gitee.com/yuzelin/zelin_ac