from frappe import get_meta

def after_install():
    add_custom_fields()

def add_custom_fields():
    meta = get_meta('POS Invoice Item')    
    custom_length = {
            'fieldname': 'custom_length',
            'label': 'length',
            'fieldtype': 'Data',
            'insert_after': 'qty',
            'depends_on': 'eval:doc.doctype=="POS Invoice Item"',
            'default': '',
            'read_only': 0
    }
    custom_width = {
            'fieldname': 'custom_width',
            'label': 'width',
            'fieldtype': 'Data',
            'insert_after': 'custom_length',
            'depends_on': 'eval:doc.doctype=="POS Invoice Item"',
            'default': '',
            'read_only': 0
    }
    create_date = {
            'fieldname': 'create_date',
            'label': 'Creat Date',
            'fieldtype': 'Date',
            'insert_after': 'qty',
            'depends_on': 'eval:doc.doctype=="POS Invoice Item"',
            'default': '',
            'read_only': 0
    }
    meta.append('fields', custom_length)
    meta.append('fields', custom_width)
    meta.append('fields', create_date)

    meta.save()    
