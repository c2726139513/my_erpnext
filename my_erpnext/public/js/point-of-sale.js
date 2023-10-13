frappe.require('point-of-sale.bundle.js', function() {
const MyItemDetails = class extends erpnext.PointOfSale.ItemDetails {
	get_form_fields(item) {
		const fields = [ 'custom_length', 'custom_width', 'qty', 'uom', 'rate', 'conversion_factor', 'discount_percentage', 'warehouse', 'actual_qty', 'price_list_rate'];
		if (item.has_serial_no) fields.push('serial_no');
		if (item.has_batch_no) fields.push('batch_no');
		return fields;
	}
};
erpnext.PointOfSale.ItemDetails = MyItemDetails;
});
