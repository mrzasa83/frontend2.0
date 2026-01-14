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
// YIELD
// ============================================
export const yieldMetadata: ColumnMetadata = {
  // Hidden fields
  CUSTOMER_PART_NUMBER: { hidden: true },
  
  // Visible fields from the Yield query
  WORK_ORDER_NUMBER: { 
    label: 'Work Order', 
    width: '120px' 
  },
  INV_PART_NUMBER: { 
    label: 'Inv Part', 
    width: '130px' 
  },
  QUAN_SCH: { 
    label: 'Scheduled', 
    type: 'number',
    width: '90px' 
  },
  QUAN_PROD: { 
    label: 'Produced', 
    type: 'number',
    width: '90px' 
  },
  QUAN_REJ: { 
    label: 'Rejected', 
    type: 'number',
    width: '80px' 
  },
  PLAN_YLD: { 
    label: 'Plan Yield', 
    type: 'percent',
    width: '95px' 
  },
  ACT_YIELD: { 
    label: 'Actual Yield', 
    type: 'percent',
    width: '105px' 
  },
  START_DATE: { 
    label: 'Start Date', 
    type: 'date',
    width: '100px' 
  },
  ACT_COMPL_DATE: { 
    label: 'Completed', 
    type: 'date',
    width: '100px' 
  },
  BASE_SPEC: { 
    label: 'Base Spec', 
    width: '120px' 
  },
  END_CUST_SPEC: { 
    label: 'End Cust Spec', 
    width: '120px' 
  },
  MATERIAL: { 
    label: 'Material', 
    width: '100px' 
  },
  PANEL_SIZE: { 
    label: 'Panel Size', 
    width: '100px' 
  },
}


// ============================================
// ROUTE
// ============================================
export const routeMetadata: ColumnMetadata = {
  // Visible fields from the route query
  STEP_NUMBER: { 
    label: 'Step', 
    type: 'number', 
    width: '80px' 
  },
  DEPT_CODE: { 
    label: 'Dept Code', 
    width: '120px' 
  },
  DEPT_NAME: { 
    label: 'Department', 
    width: '250px' 
  },
}

// ============================================
// WORK ORDERS
// ============================================
export const workOrdersMetadata: ColumnMetadata = {
  // Visible fields from the work orders query
  WORK_ORDER_NUMBER: { 
    label: 'Work Order', 
    width: '120px' 
  },
  INV_PART_NUMBER: { 
    label: 'Inventory Part', 
    width: '150px' 
  },
  STEP_NO: { 
    label: 'Step', 
    width: '100px' 
  },
  COMPLETE_DATE: { 
    label: 'Complete Date', 
    type: 'date',
    width: '120px' 
  },
}

// ============================================
// INVENTORY
// ============================================
export const inventoryMetadata: ColumnMetadata = {
  // Visible fields from the inventory query
  CP_REV: { 
    label: 'Rev', 
    width: '60px' 
  },
  QTY_ON_HAND: { 
    label: 'On Hand', 
    type: 'number', 
    width: '90px' 
  },
  QTY_ALLOC: { 
    label: 'Allocated', 
    type: 'number', 
    width: '90px' 
  },
  WORK_ORDER_NUMBER: { 
    label: 'Work Order', 
    width: '120px' 
  },
  MFG_DATE: { 
    label: 'Mfg Date', 
    type: 'date',
    width: '110px' 
  },
  WAREHOUSE_CODE: { 
    label: 'Warehouse', 
    width: '100px' 
  },
  LOCATION: { 
    label: 'Location', 
    width: '120px' 
  },
}

// ============================================
// DISCREPANCY
// ============================================
export const discrepancyMetadata: ColumnMetadata = {
  // Visible fields from the discrepancy query
  SEQUENCE_NUMBER: { 
    label: 'Sequence', 
    width: '100px' 
  },
  NOTEPAD_TEXT: { 
    label: 'Notes', 
    width: '500px' 
  },
}

// ============================================
// CHANGES (MCN)
// ============================================
export const changesMetadata: ColumnMetadata = {
  // Visible fields from the MCN query
  Status: { 
    label: 'Status', 
    width: '90px' 
  },
  request: { 
    label: 'Request #', 
    width: '100px' 
  },
  toolnum: { 
    label: 'Tool Number', 
    width: '120px' 
  },
  reason: { 
    label: 'Reason', 
    width: '250px',
    wrap: true
  },
  change: { 
    label: 'Change', 
    width: '250px',
    wrap: true
  },
  closeddate: { 
    label: 'Closed Date', 
    type: 'date',
    width: '110px' 
  },
  pe: { 
    label: 'PE', 
    width: '100px' 
  },
}