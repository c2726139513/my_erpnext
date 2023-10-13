function sleep(time) {
  return new Promise(resolve => setTimeout(resolve,time));
}
async function get_cur_company(){
        await sleep(1000);
	var companies = frappe.get_list('Company');
	if (companies.length>1)
	{
		var option_data = ''; 
        	for (var i=0;i<companies.length;i++)
		{
			option_data = option_data + '<option value=' + companies[i].name + '>' + companies[i].name + '</option>';
		}
		var insert_data = "<select id='company-select' class='form-control' style='width: auto;'>" + option_data;
		$("form:first").after(insert_data);
		var d = await frappe.call({method:"frappe.core.doctype.session_default_settings.session_default_settings.get_session_default_values",});
		var cur_company = JSON.parse(d.message)[0].default;
		/*console.log(cur_company);*/
		$('#company-select').val(cur_company);
		$('#company-select').on('change', function() {
			frappe.call({
			    method: "frappe.core.doctype.session_default_settings.session_default_settings.set_session_default_values",
			    args: {
				    default_values: {"company": this.value,"undefined":"","settings":""},
			    },
			    callback: function (data) {
				    if (data.message == "success") {
					    frappe.show_alert({
						    message: __("Session Defaults Saved"),
						    indicator: "green",
					    });
					    frappe.ui.toolbar.clear_cache();
				    } else {
					    frappe.show_alert({
						    message: __(
							    "An error occurred while setting Session Defaults"
						    ),
						    indicator: "red",
					    });
				    }
			    },
			});
		});
	}
};
get_cur_company();
