import { ColumnMetadata } from '@/components/ui/DataView'

// ============================================
// PRODUCTION GENERAL (data0050)
// ============================================
export const productionGeneralMetadata: ColumnMetadata = {
  // Hidden/System fields
  RKEY: { hidden: true },
  internal_id: { system: true },
  record_id: { hidden: true },
  created_by: { system: true },
  modified_by: { system: true },
  
  // Add your visible fields here with custom labels
  // Example:
  // part_number: { 
  //   label: 'Part Number', 
  //   width: '150px',
  //   readonly: true 
  // },
  // quantity: { 
  //   label: 'Quantity', 
  //   type: 'number', 
  //   width: '100px' 
  // },
  // status: { 
  //   label: 'Status', 
  //   width: '120px' 
  // },
}

// ============================================
// BOM (Bill of Materials)
// ============================================
export const bomMetadata: ColumnMetadata = {
  // Hidden/System fields
  BOM_PTR: { hidden: true },
  INVENTORY_PTR: { hidden: true },
  component_rkey: { hidden: true },
  parent_part: { hidden: true },
  eff_end: { hidden: true },
  sequence: { hidden: true }, // Used for sorting but don't display
  bom_header_key: { hidden: true },
  parent_type: { hidden: true },
  component_type: { system: true }, // P or M flag - for internal logic
  
  // Visible fields based on your actual query
  component_part: { 
    label: 'Component Part', 
    width: '150px',
    readonly: true
  },
  description: { 
    label: 'Description', 
    width: '250px' 
  },
  quantity: { 
    label: 'Qty', 
    type: 'number', 
    width: '80px' 
  },
  unit_ptr: { 
    label: 'Unit', 
    width: '60px' 
  },
  ref_des: { 
    label: 'Reference Designators', 
    width: '200px' 
  },
}

// ============================================
// WHERE USED
// ============================================
export const whereUsedMetadata: ColumnMetadata = {
  // Hidden/System fields
  RKEY: { hidden: true },
  internal_id: { system: true },
  
  // Visible fields
  // parent_part: { 
  //   label: 'Parent Part', 
  //   width: '150px' 
  // },
  // parent_description: { 
  //   label: 'Parent Description', 
  //   width: '250px' 
  // },
  // quantity_used: { 
  //   label: 'Qty Used', 
  //   type: 'number', 
  //   width: '80px' 
  // },
}

// ============================================
// ROUTE
// ============================================
export const routeMetadata: ColumnMetadata = {
  // Hidden/System fields
  RKEY: { hidden: true },
  internal_id: { system: true },
  
  // Visible fields
  // operation_seq: { 
  //   label: 'Seq', 
  //   type: 'number', 
  //   width: '60px' 
  // },
  // operation_code: { 
  //   label: 'Operation', 
  //   width: '120px' 
  // },
  // work_center: { 
  //   label: 'Work Center', 
  //   width: '150px' 
  // },
  // description: { 
  //   label: 'Description', 
  //   width: '250px' 
  // },
  // setup_time: { 
  //   label: 'Setup (hrs)', 
  //   type: 'number', 
  //   width: '100px' 
  // },
  // run_time: { 
  //   label: 'Run (hrs)', 
  //   type: 'number', 
  //   width: '100px' 
  // },
}

// ============================================
// WORK ORDERS
// ============================================
export const workOrdersMetadata: ColumnMetadata = {
  // Hidden/System fields
  RKEY: { hidden: true },
  internal_id: { system: true },
  
  // Visible fields
  // work_order: { 
  //   label: 'Work Order', 
  //   width: '120px' 
  // },
  // status: { 
  //   label: 'Status', 
  //   width: '100px' 
  // },
  // quantity_ordered: { 
  //   label: 'Qty Ordered', 
  //   type: 'number', 
  //   width: '100px' 
  // },
  // quantity_complete: { 
  //   label: 'Qty Complete', 
  //   type: 'number', 
  //   width: '100px' 
  // },
  // due_date: { 
  //   label: 'Due Date', 
  //   width: '120px' 
  // },
  // priority: { 
  //   label: 'Priority', 
  //   width: '80px' 
  // },
}

// ============================================
// INVENTORY
// ============================================
export const inventoryMetadata: ColumnMetadata = {
  // Hidden/System fields
  RKEY: { hidden: true },
  internal_id: { system: true },
  
  // Visible fields
  // location: { 
  //   label: 'Location', 
  //   width: '120px' 
  // },
  // lot_number: { 
  //   label: 'Lot #', 
  //   width: '120px' 
  // },
  // quantity_on_hand: { 
  //   label: 'On Hand', 
  //   type: 'number', 
  //   width: '100px' 
  // },
  // quantity_allocated: { 
  //   label: 'Allocated', 
  //   type: 'number', 
  //   width: '100px' 
  // },
  // quantity_available: { 
  //   label: 'Available', 
  //   type: 'number', 
  //   width: '100px' 
  // },
  // last_transaction: { 
  //   label: 'Last Transaction', 
  //   width: '150px' 
  // },
}

// ============================================
// DISCREPANCY
// ============================================
export const discrepancyMetadata: ColumnMetadata = {
  // Hidden/System fields
  RKEY: { hidden: true },
  internal_id: { system: true },
  
  // Visible fields
  // discrepancy_id: { 
  //   label: 'ID', 
  //   width: '100px' 
  // },
  // discrepancy_type: { 
  //   label: 'Type', 
  //   width: '120px' 
  // },
  // reported_date: { 
  //   label: 'Reported', 
  //   width: '120px' 
  // },
  // description: { 
  //   label: 'Description', 
  //   width: '300px' 
  // },
  // status: { 
  //   label: 'Status', 
  //   width: '100px' 
  // },
  // assigned_to: { 
  //   label: 'Assigned To', 
  //   width: '120px' 
  // },
}