frappe.require('point-of-sale.bundle.js', function() {
const MyItemDetails = class extends erpnext.PointOfSale.ItemDetails {
	get_form_fields(item) {
		//const fields = [ 'custom_length', 'custom_width', 'qty', 'uom', 'custom_note', 'rate', 'conversion_factor', 'discount_percentage', 'warehouse', 'actual_qty', 'price_list_rate'];
		const fields = [ 'uom', 'rate', 'discount_percentage', 'custom_create_date', 'custom_note'];
		if (item.custom_need_calc_square === 1) {
			fields.unshift('custom_width');
			fields.unshift('custom_length');
		} else {
			fields.unshift('qty');
		}
		if (item.has_serial_no) fields.push('serial_no');
		if (item.has_batch_no) fields.push('batch_no');
		return fields;
	}
};
erpnext.PointOfSale.ItemDetails = MyItemDetails;
});

frappe.require('point-of-sale.bundle.js', function() {
const MyPOSController = class extends erpnext.PointOfSale.Controller {
	async on_cart_update(args) {
		frappe.dom.freeze();
		let item_row = undefined;
		try {
			let { field, value, item } = args;
			item_row = this.get_item_from_frm(item);
			const item_row_exists = !$.isEmptyObject(item_row);

			const from_selector = field === 'qty' && value === "+1";

			if (item_row_exists && !from_selector) {
				if (field === 'qty')
					value = flt(value);

				if (['qty', 'conversion_factor'].includes(field) && value > 0 && !this.allow_negative_stock) {
					const qty_needed = field === 'qty' ? value * item_row.conversion_factor : item_row.qty * value;
					await this.check_stock_availability(item_row, qty_needed, this.frm.doc.set_warehouse);
				}

				if (this.is_current_item_being_edited(item_row) || from_selector) {
					await frappe.model.set_value(item_row.doctype, item_row.name, field, value);
					this.update_cart_html(item_row);
				}

			} else {
				if (!this.frm.doc.customer)
					return this.raise_customer_selection_alert();

				const { item_code, batch_no, serial_no, rate, uom } = item;

				if (!item_code)
					return;

				const new_item = { item_code, batch_no, rate, uom, [field]: value };

				if (serial_no) {
					await this.check_serial_no_availablilty(item_code, this.frm.doc.set_warehouse, serial_no);
					new_item['serial_no'] = serial_no;
				}

				if (field === 'serial_no')
					new_item['qty'] = value.split(`\n`).length || 0;

				item_row = this.frm.add_child('items', new_item);

				if (field === 'qty' && value !== 0 && !this.allow_negative_stock) {
					const qty_needed = value * item_row.conversion_factor;
					await this.check_stock_availability(item_row, qty_needed, this.frm.doc.set_warehouse);
				}

				await this.trigger_new_item_events(item_row);

				this.update_cart_html(item_row);

				if (this.item_details.$component.is(':visible'))
					this.edit_item_details_of(item_row);

				if (this.check_serial_batch_selection_needed(item_row) && !this.item_details.$component.is(':visible'))
					this.edit_item_details_of(item_row);
			}

		} catch (error) {
			console.log(error);
		} finally {
			frappe.dom.unfreeze();
			return item_row; // eslint-disable-line no-unsafe-finally
		}
	}

	prepare_menu() {
                this.page.clear_menu();

                this.page.add_menu_item(__("Open Form View"), this.open_form_view.bind(this), false, 'Ctrl+F');

                this.page.add_menu_item(__("Toggle Recent Orders"), this.toggle_recent_order.bind(this), false, 'Ctrl+O');

                this.page.add_menu_item(__("Save as Draft"), this.save_draft_invoice.bind(this), false, 'Ctrl+S');

                this.page.add_menu_item(__('Close the POS'), this.close_pos.bind(this), false, 'Shift+Ctrl+C');

                this.page.set_secondary_action(__('Save And Print'), this.save_and_print.bind(this), 'printer');
                this.page.add_inner_button(__('Save Only'), this.save_only.bind(this));
                this.page.set_primary_action(__('Save And New'), this.save_draft_invoice.bind(this), 'add');
        }

        save_() {
                if (!this.$components_wrapper.is(":visible")) return;

                if (this.frm.doc.items.length == 0) {
                        frappe.show_alert({
                                message: __("You must add atleast one item to save it as draft."),
                                indicator:'red'
                        });
                        frappe.utils.play_sound("error");
                        return;
                }

                return this.frm.save(undefined, undefined, undefined, () => {
                        frappe.show_alert({
                                message: __("There was an error saving the document."),
                                indicator: 'red'
                        });
                        frappe.utils.play_sound("error");
                });
        }

	print_() {
                //frappe.utils.print(
		this._print(
                        this.frm.doc.doctype,
                        this.frm.doc.name,
                        this.frm.pos_print_format,
                        this.frm.doc.letter_head,
                        this.frm.doc.language || frappe.boot.lang
                );
	}

	_print(doctype, docname, print_format, letterhead, lang_code) {
		let w = window.open(
			frappe.urllib.get_full_url(
				"/api/method/frappe.utils.print_format.download_pdf?doctype=" +
					encodeURIComponent(doctype) +
					"&name=" +
					encodeURIComponent(docname) +
					"&trigger_print=1" +
					"&format=" +
					encodeURIComponent(print_format) +
					"&no_letterhead=" +
					(letterhead ? "0" : "1") +
					"&letterhead=" +
					encodeURIComponent(letterhead) +
					(lang_code ? "&_lang=" + lang_code : "")
			)
		);

		if (!w) {
			frappe.msgprint(__("Please enable pop-ups"));
			return;
		}
		w.onload = function() {
			w.print();
		//	PrintManager printManager = (PrintManager) getSystemService(Context.PRINT_SERVICE);
		//	printManager.print("print", w, null);
		}
	}


        save_only() {
                this.save_().then(() => {
                        this.frm.set_value('custom_print_status', 'unprinted').then(() => this.frm.save());
                });
        }

        save_and_print() {
                this.frm.set_value('custom_print_status', 'printed').then(() => {
                        this.save_().then(() => {
                        	frappe.run_serially([
                        	        () => this.print_(),
                        	        () => frappe.dom.freeze(),
                        	        () => this.make_new_invoice(),
                        	        () => frappe.dom.unfreeze(),
                        	]);
                        });
                });
        }

	save_draft_invoice() {
                this.save_().then(() => {
                        this.frm.set_value('custom_print_status', 'unprinted').then(() => this.frm.save()).then(() => {
                        	frappe.run_serially([
                        	        () => frappe.dom.freeze(),
                        	        () => this.make_new_invoice(),
                        	        () => frappe.dom.unfreeze(),
                        	]);
                	});
		});
        }
};
erpnext.PointOfSale.Controller = MyPOSController;
});

