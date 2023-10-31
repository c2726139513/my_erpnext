//计算平方

//cur_frm.add_fetch('item_code', 'stock_uom', 'stock_uom');
frappe.ui.form.on('POS Invoice Item', {
    custom_length: function(frm, cdt, cdn) {
        var item = frappe.get_doc(cdt, cdn);
        if (item.custom_length && item.custom_width) {
            item.qty = item.custom_length * item.custom_width;
            refresh_field('qty', item.name, 'items');
        }
    },
    custom_width: function(frm, cdt, cdn) {
        var item = frappe.get_doc(cdt, cdn);
        if (item.custom_length && item.custom_width) {
            item.qty = item.custom_length * item.custom_width;
            refresh_field('qty', item.name, 'items');
        }
    },
});
