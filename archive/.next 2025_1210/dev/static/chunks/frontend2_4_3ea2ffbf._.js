(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/frontend2.4/components/ui/Tabs.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>Tabs
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend2.4/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend2.4/node_modules/next/dist/compiled/react/compiler-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__ = __turbopack_context__.i("[project]/frontend2.4/node_modules/lucide-react/dist/esm/icons/x.js [app-client] (ecmascript) <export default as X>");
'use client';
;
;
;
function Tabs(t0) {
    const $ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["c"])(20);
    if ($[0] !== "e988a0119c753a6041cd1de82bb4f7b227d4ab0eac40f1fac50faf08ba8ad3dd") {
        for(let $i = 0; $i < 20; $i += 1){
            $[$i] = Symbol.for("react.memo_cache_sentinel");
        }
        $[0] = "e988a0119c753a6041cd1de82bb4f7b227d4ab0eac40f1fac50faf08ba8ad3dd";
    }
    const { tabs, activeTab, onTabChange } = t0;
    const currentTab = activeTab || tabs[0]?.id;
    let t1;
    if ($[1] !== currentTab || $[2] !== tabs) {
        t1 = tabs.find({
            "Tabs[tabs.find()]": (tab)=>tab.id === currentTab
        }["Tabs[tabs.find()]"])?.content;
        $[1] = currentTab;
        $[2] = tabs;
        $[3] = t1;
    } else {
        t1 = $[3];
    }
    const activeContent = t1;
    let t2;
    if ($[4] !== onTabChange) {
        t2 = ({
            "Tabs[handleTabClick]": (tabId)=>{
                if (onTabChange) {
                    onTabChange(tabId);
                }
            }
        })["Tabs[handleTabClick]"];
        $[4] = onTabChange;
        $[5] = t2;
    } else {
        t2 = $[5];
    }
    const handleTabClick = t2;
    const handleClose = _TabsHandleClose;
    let t3;
    if ($[6] !== currentTab || $[7] !== handleTabClick || $[8] !== tabs) {
        let t4;
        if ($[10] !== currentTab || $[11] !== handleTabClick) {
            t4 = ({
                "Tabs[tabs.map()]": (tab_1)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: `flex items-center gap-2 px-6 py-3 font-medium text-sm transition-colors relative whitespace-nowrap cursor-pointer ${currentTab === tab_1.id ? "text-blue-600 border-b-2 border-blue-600" : "text-slate-600 hover:text-slate-800"}`,
                        onClick: {
                            "Tabs[tabs.map() > <div>.onClick]": ()=>handleTabClick(tab_1.id)
                        }["Tabs[tabs.map() > <div>.onClick]"],
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: tab_1.label
                            }, void 0, false, {
                                fileName: "[project]/frontend2.4/components/ui/Tabs.tsx",
                                lineNumber: 67,
                                columnNumber: 48
                            }, this),
                            tab_1.closeable && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: {
                                    "Tabs[tabs.map() > <button>.onClick]": (e_0)=>handleClose(e_0, tab_1)
                                }["Tabs[tabs.map() > <button>.onClick]"],
                                className: "hover:bg-slate-200 rounded p-0.5 transition-colors",
                                title: "Close tab",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {
                                    size: 14
                                }, void 0, false, {
                                    fileName: "[project]/frontend2.4/components/ui/Tabs.tsx",
                                    lineNumber: 69,
                                    columnNumber: 134
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/frontend2.4/components/ui/Tabs.tsx",
                                lineNumber: 67,
                                columnNumber: 94
                            }, this)
                        ]
                    }, tab_1.id, true, {
                        fileName: "[project]/frontend2.4/components/ui/Tabs.tsx",
                        lineNumber: 65,
                        columnNumber: 38
                    }, this)
            })["Tabs[tabs.map()]"];
            $[10] = currentTab;
            $[11] = handleTabClick;
            $[12] = t4;
        } else {
            t4 = $[12];
        }
        t3 = tabs.map(t4);
        $[6] = currentTab;
        $[7] = handleTabClick;
        $[8] = tabs;
        $[9] = t3;
    } else {
        t3 = $[9];
    }
    let t4;
    if ($[13] !== t3) {
        t4 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "border-b border-slate-200",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex space-x-1 overflow-x-auto",
                children: t3
            }, void 0, false, {
                fileName: "[project]/frontend2.4/components/ui/Tabs.tsx",
                lineNumber: 87,
                columnNumber: 53
            }, this)
        }, void 0, false, {
            fileName: "[project]/frontend2.4/components/ui/Tabs.tsx",
            lineNumber: 87,
            columnNumber: 10
        }, this);
        $[13] = t3;
        $[14] = t4;
    } else {
        t4 = $[14];
    }
    let t5;
    if ($[15] !== activeContent) {
        t5 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "py-6",
            children: activeContent
        }, void 0, false, {
            fileName: "[project]/frontend2.4/components/ui/Tabs.tsx",
            lineNumber: 95,
            columnNumber: 10
        }, this);
        $[15] = activeContent;
        $[16] = t5;
    } else {
        t5 = $[16];
    }
    let t6;
    if ($[17] !== t4 || $[18] !== t5) {
        t6 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "w-full",
            children: [
                t4,
                t5
            ]
        }, void 0, true, {
            fileName: "[project]/frontend2.4/components/ui/Tabs.tsx",
            lineNumber: 103,
            columnNumber: 10
        }, this);
        $[17] = t4;
        $[18] = t5;
        $[19] = t6;
    } else {
        t6 = $[19];
    }
    return t6;
}
_c = Tabs;
function _TabsHandleClose(e, tab_0) {
    e.stopPropagation();
    if (tab_0.onClose) {
        tab_0.onClose();
    }
}
var _c;
__turbopack_context__.k.register(_c, "Tabs");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend2.4/components/products/EditableProductTable.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>EditableProductTable
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend2.4/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend2.4/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$eye$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Eye$3e$__ = __turbopack_context__.i("[project]/frontend2.4/node_modules/lucide-react/dist/esm/icons/eye.js [app-client] (ecmascript) <export default as Eye>");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$save$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Save$3e$__ = __turbopack_context__.i("[project]/frontend2.4/node_modules/lucide-react/dist/esm/icons/save.js [app-client] (ecmascript) <export default as Save>");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__ = __turbopack_context__.i("[project]/frontend2.4/node_modules/lucide-react/dist/esm/icons/x.js [app-client] (ecmascript) <export default as X>");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$pen$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Edit2$3e$__ = __turbopack_context__.i("[project]/frontend2.4/node_modules/lucide-react/dist/esm/icons/pen.js [app-client] (ecmascript) <export default as Edit2>");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
function EditableProductTable({ products, onView, onEdit, onSave, tableState, onTableStateChange, isAdmin }) {
    _s();
    const { search, sortKey, sortAsc, pageSize, page, typeFilter } = tableState;
    const [editingRow, setEditingRow] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [editedData, setEditedData] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({});
    const [saving, setSaving] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const updateState = (updates)=>{
        onTableStateChange({
            ...tableState,
            ...updates
        });
    };
    const productTypes = Array.from(new Set(products.map((p)=>p.item_type_name).filter((t)=>t !== null && t !== undefined))).sort();
    const filtered = products.filter((p_0)=>{
        const matchesSearch = p_0.apcPN.toLowerCase().includes(search.toLowerCase()) || p_0.customer?.toLowerCase().includes(search.toLowerCase()) || p_0.customerPN?.toLowerCase().includes(search.toLowerCase()) || p_0.description?.toLowerCase().includes(search.toLowerCase());
        const matchesType = !typeFilter || typeFilter === 'all' || p_0.item_type_name === typeFilter;
        return matchesSearch && matchesType;
    });
    const sorted = [
        ...filtered
    ].sort((a, b)=>{
        const valA = a[sortKey] || '';
        const valB = b[sortKey] || '';
        return sortAsc ? String(valA).localeCompare(String(valB)) : String(valB).localeCompare(String(valA));
    });
    const paginated = sorted.slice(page * pageSize, (page + 1) * pageSize);
    const totalPages = Math.ceil(filtered.length / pageSize);
    const handleStartEdit = (product)=>{
        setEditingRow(product.id);
        setEditedData({
            customer: product.customer,
            customerPN: product.customerPN,
            currentRev: product.currentRev,
            description: product.description
        });
    };
    const handleCancelEdit = ()=>{
        setEditingRow(null);
        setEditedData({});
    };
    const handleSaveEdit = async (product_0)=>{
        setSaving(true);
        try {
            await onSave({
                ...product_0,
                ...editedData
            });
            setEditingRow(null);
            setEditedData({});
        } catch (error) {
            console.error('Error saving:', error);
        } finally{
            setSaving(false);
        }
    };
    const handleFieldChange = (field, value)=>{
        setEditedData((prev)=>({
                ...prev,
                [field]: value
            }));
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex justify-between items-center mb-4 gap-4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        type: "text",
                        placeholder: "Search products...",
                        value: search,
                        onChange: (e)=>updateState({
                                search: e.target.value,
                                page: 0
                            }),
                        className: "border border-slate-300 px-3 py-2 rounded-lg flex-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    }, void 0, false, {
                        fileName: "[project]/frontend2.4/components/products/EditableProductTable.tsx",
                        lineNumber: 110,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                        value: typeFilter || 'all',
                        onChange: (e_0)=>updateState({
                                typeFilter: e_0.target.value,
                                page: 0
                            }),
                        className: "border border-slate-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                value: "all",
                                children: "All Types"
                            }, void 0, false, {
                                fileName: "[project]/frontend2.4/components/products/EditableProductTable.tsx",
                                lineNumber: 119,
                                columnNumber: 11
                            }, this),
                            productTypes.map((type)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                    value: type,
                                    children: type
                                }, type, false, {
                                    fileName: "[project]/frontend2.4/components/products/EditableProductTable.tsx",
                                    lineNumber: 120,
                                    columnNumber: 37
                                }, this))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend2.4/components/products/EditableProductTable.tsx",
                        lineNumber: 115,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                        value: pageSize,
                        onChange: (e_1)=>updateState({
                                pageSize: Number(e_1.target.value),
                                page: 0
                            }),
                        className: "border border-slate-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none",
                        children: [
                            25,
                            50,
                            100,
                            250
                        ].map((size)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                value: size,
                                children: [
                                    "Show ",
                                    size
                                ]
                            }, size, true, {
                                fileName: "[project]/frontend2.4/components/products/EditableProductTable.tsx",
                                lineNumber: 127,
                                columnNumber: 43
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/frontend2.4/components/products/EditableProductTable.tsx",
                        lineNumber: 123,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend2.4/components/products/EditableProductTable.tsx",
                lineNumber: 109,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "border border-slate-200 rounded-lg overflow-hidden",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
                    className: "w-full",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("thead", {
                            className: "bg-slate-100",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                        className: "text-left px-4 py-3 font-medium text-sm text-slate-700 cursor-pointer hover:bg-slate-200",
                                        onClick: ()=>sortKey === 'apcPN' ? updateState({
                                                sortAsc: !sortAsc
                                            }) : updateState({
                                                sortKey: 'apcPN'
                                            }),
                                        children: [
                                            "Part Number ",
                                            sortKey === 'apcPN' && (sortAsc ? '▲' : '▼')
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/frontend2.4/components/products/EditableProductTable.tsx",
                                        lineNumber: 137,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                        className: "text-left px-4 py-3 font-medium text-sm text-slate-700 cursor-pointer hover:bg-slate-200",
                                        onClick: ()=>sortKey === 'item_type_name' ? updateState({
                                                sortAsc: !sortAsc
                                            }) : updateState({
                                                sortKey: 'item_type_name'
                                            }),
                                        children: [
                                            "Type ",
                                            sortKey === 'item_type_name' && (sortAsc ? '▲' : '▼')
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/frontend2.4/components/products/EditableProductTable.tsx",
                                        lineNumber: 144,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                        className: "text-left px-4 py-3 font-medium text-sm text-slate-700 cursor-pointer hover:bg-slate-200",
                                        onClick: ()=>sortKey === 'customer' ? updateState({
                                                sortAsc: !sortAsc
                                            }) : updateState({
                                                sortKey: 'customer'
                                            }),
                                        children: [
                                            "Customer ",
                                            sortKey === 'customer' && (sortAsc ? '▲' : '▼')
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/frontend2.4/components/products/EditableProductTable.tsx",
                                        lineNumber: 151,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                        className: "text-left px-4 py-3 font-medium text-sm text-slate-700 cursor-pointer hover:bg-slate-200",
                                        onClick: ()=>sortKey === 'customerPN' ? updateState({
                                                sortAsc: !sortAsc
                                            }) : updateState({
                                                sortKey: 'customerPN'
                                            }),
                                        children: [
                                            "Customer PN ",
                                            sortKey === 'customerPN' && (sortAsc ? '▲' : '▼')
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/frontend2.4/components/products/EditableProductTable.tsx",
                                        lineNumber: 158,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                        className: "text-left px-4 py-3 font-medium text-sm text-slate-700 cursor-pointer hover:bg-slate-200",
                                        onClick: ()=>sortKey === 'currentRev' ? updateState({
                                                sortAsc: !sortAsc
                                            }) : updateState({
                                                sortKey: 'currentRev'
                                            }),
                                        children: [
                                            "Part Rev ",
                                            sortKey === 'currentRev' && (sortAsc ? '▲' : '▼')
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/frontend2.4/components/products/EditableProductTable.tsx",
                                        lineNumber: 165,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                        className: "text-left px-4 py-3 font-medium text-sm text-slate-700",
                                        children: "Actions"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend2.4/components/products/EditableProductTable.tsx",
                                        lineNumber: 172,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend2.4/components/products/EditableProductTable.tsx",
                                lineNumber: 136,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/frontend2.4/components/products/EditableProductTable.tsx",
                            lineNumber: 135,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
                            children: paginated.map((product_1)=>{
                                const isEditing = editingRow === product_1.id;
                                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                    className: `border-t border-slate-200 ${isEditing ? 'bg-blue-50' : 'hover:bg-slate-50'} transition-colors`,
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                            className: "px-4 py-3 font-mono text-sm font-semibold",
                                            children: product_1.apcPN
                                        }, void 0, false, {
                                            fileName: "[project]/frontend2.4/components/products/EditableProductTable.tsx",
                                            lineNumber: 179,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                            className: "px-4 py-3 text-sm",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs",
                                                children: product_1.item_type_name || 'Unknown'
                                            }, void 0, false, {
                                                fileName: "[project]/frontend2.4/components/products/EditableProductTable.tsx",
                                                lineNumber: 181,
                                                columnNumber: 21
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/frontend2.4/components/products/EditableProductTable.tsx",
                                            lineNumber: 180,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                            className: "px-4 py-3 text-sm",
                                            children: isEditing ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                type: "text",
                                                value: editedData.customer ?? product_1.customer ?? '',
                                                onChange: (e_2)=>handleFieldChange('customer', e_2.target.value),
                                                className: "w-full px-2 py-1 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                            }, void 0, false, {
                                                fileName: "[project]/frontend2.4/components/products/EditableProductTable.tsx",
                                                lineNumber: 186,
                                                columnNumber: 34
                                            }, this) : product_1.customer || '-'
                                        }, void 0, false, {
                                            fileName: "[project]/frontend2.4/components/products/EditableProductTable.tsx",
                                            lineNumber: 185,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                            className: "px-4 py-3 text-sm",
                                            children: isEditing ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                type: "text",
                                                value: editedData.customerPN ?? product_1.customerPN ?? '',
                                                onChange: (e_3)=>handleFieldChange('customerPN', e_3.target.value),
                                                className: "w-full px-2 py-1 border border-slate-300 rounded text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                                            }, void 0, false, {
                                                fileName: "[project]/frontend2.4/components/products/EditableProductTable.tsx",
                                                lineNumber: 189,
                                                columnNumber: 34
                                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "font-mono",
                                                children: product_1.customerPN || '-'
                                            }, void 0, false, {
                                                fileName: "[project]/frontend2.4/components/products/EditableProductTable.tsx",
                                                lineNumber: 189,
                                                columnNumber: 311
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/frontend2.4/components/products/EditableProductTable.tsx",
                                            lineNumber: 188,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                            className: "px-4 py-3 text-sm",
                                            children: isEditing ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                type: "text",
                                                value: editedData.currentRev ?? product_1.currentRev ?? '',
                                                onChange: (e_4)=>handleFieldChange('currentRev', e_4.target.value),
                                                className: "w-full px-2 py-1 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                            }, void 0, false, {
                                                fileName: "[project]/frontend2.4/components/products/EditableProductTable.tsx",
                                                lineNumber: 192,
                                                columnNumber: 34
                                            }, this) : product_1.currentRev || '-'
                                        }, void 0, false, {
                                            fileName: "[project]/frontend2.4/components/products/EditableProductTable.tsx",
                                            lineNumber: 191,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                            className: "px-4 py-3",
                                            children: isEditing ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex gap-2",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        onClick: ()=>handleSaveEdit(product_1),
                                                        disabled: saving,
                                                        className: "p-2 text-green-600 hover:bg-green-50 rounded transition-colors disabled:opacity-50",
                                                        title: "Save Changes",
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$save$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Save$3e$__["Save"], {
                                                            size: 18
                                                        }, void 0, false, {
                                                            fileName: "[project]/frontend2.4/components/products/EditableProductTable.tsx",
                                                            lineNumber: 197,
                                                            columnNumber: 27
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend2.4/components/products/EditableProductTable.tsx",
                                                        lineNumber: 196,
                                                        columnNumber: 25
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        onClick: handleCancelEdit,
                                                        disabled: saving,
                                                        className: "p-2 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50",
                                                        title: "Cancel",
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {
                                                            size: 18
                                                        }, void 0, false, {
                                                            fileName: "[project]/frontend2.4/components/products/EditableProductTable.tsx",
                                                            lineNumber: 200,
                                                            columnNumber: 27
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend2.4/components/products/EditableProductTable.tsx",
                                                        lineNumber: 199,
                                                        columnNumber: 25
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/frontend2.4/components/products/EditableProductTable.tsx",
                                                lineNumber: 195,
                                                columnNumber: 34
                                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex gap-2",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        onClick: ()=>onView(product_1),
                                                        className: "p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors",
                                                        title: "View Product",
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$eye$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Eye$3e$__["Eye"], {
                                                            size: 18
                                                        }, void 0, false, {
                                                            fileName: "[project]/frontend2.4/components/products/EditableProductTable.tsx",
                                                            lineNumber: 204,
                                                            columnNumber: 27
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend2.4/components/products/EditableProductTable.tsx",
                                                        lineNumber: 203,
                                                        columnNumber: 25
                                                    }, this),
                                                    isAdmin && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        onClick: ()=>handleStartEdit(product_1),
                                                        className: "p-2 text-orange-600 hover:bg-orange-50 rounded transition-colors",
                                                        title: "Quick Edit",
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$pen$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Edit2$3e$__["Edit2"], {
                                                            size: 18
                                                        }, void 0, false, {
                                                            fileName: "[project]/frontend2.4/components/products/EditableProductTable.tsx",
                                                            lineNumber: 207,
                                                            columnNumber: 29
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend2.4/components/products/EditableProductTable.tsx",
                                                        lineNumber: 206,
                                                        columnNumber: 37
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        onClick: ()=>onEdit(product_1),
                                                        className: "p-2 text-green-600 hover:bg-green-50 rounded transition-colors",
                                                        title: "Full Edit",
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$pen$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Edit2$3e$__["Edit2"], {
                                                            size: 18
                                                        }, void 0, false, {
                                                            fileName: "[project]/frontend2.4/components/products/EditableProductTable.tsx",
                                                            lineNumber: 210,
                                                            columnNumber: 27
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend2.4/components/products/EditableProductTable.tsx",
                                                        lineNumber: 209,
                                                        columnNumber: 25
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/frontend2.4/components/products/EditableProductTable.tsx",
                                                lineNumber: 202,
                                                columnNumber: 32
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/frontend2.4/components/products/EditableProductTable.tsx",
                                            lineNumber: 194,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, product_1.id, true, {
                                    fileName: "[project]/frontend2.4/components/products/EditableProductTable.tsx",
                                    lineNumber: 178,
                                    columnNumber: 20
                                }, this);
                            })
                        }, void 0, false, {
                            fileName: "[project]/frontend2.4/components/products/EditableProductTable.tsx",
                            lineNumber: 175,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/frontend2.4/components/products/EditableProductTable.tsx",
                    lineNumber: 134,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/frontend2.4/components/products/EditableProductTable.tsx",
                lineNumber: 133,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex justify-between items-center mt-4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-sm text-slate-500",
                        children: [
                            "Showing ",
                            paginated.length,
                            " of ",
                            filtered.length,
                            " products",
                            typeFilter && typeFilter !== 'all' && ` (filtered by ${typeFilter})`
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend2.4/components/products/EditableProductTable.tsx",
                        lineNumber: 221,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex gap-1",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>updateState({
                                        page: Math.max(0, page - 1)
                                    }),
                                disabled: page === 0,
                                className: "px-3 py-1 rounded bg-slate-200 hover:bg-slate-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm",
                                children: "Previous"
                            }, void 0, false, {
                                fileName: "[project]/frontend2.4/components/products/EditableProductTable.tsx",
                                lineNumber: 226,
                                columnNumber: 11
                            }, this),
                            Array.from({
                                length: Math.min(5, totalPages)
                            }).map((_, i)=>{
                                const pageNum = page < 3 ? i : page - 2 + i;
                                if (pageNum >= totalPages) return null;
                                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: ()=>updateState({
                                            page: pageNum
                                        }),
                                    className: `px-3 py-1 rounded text-sm ${pageNum === page ? 'bg-slate-800 text-white' : 'bg-slate-200 hover:bg-slate-300'}`,
                                    children: pageNum + 1
                                }, pageNum, false, {
                                    fileName: "[project]/frontend2.4/components/products/EditableProductTable.tsx",
                                    lineNumber: 236,
                                    columnNumber: 18
                                }, this);
                            }),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>updateState({
                                        page: Math.min(totalPages - 1, page + 1)
                                    }),
                                disabled: page >= totalPages - 1,
                                className: "px-3 py-1 rounded bg-slate-200 hover:bg-slate-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm",
                                children: "Next"
                            }, void 0, false, {
                                fileName: "[project]/frontend2.4/components/products/EditableProductTable.tsx",
                                lineNumber: 242,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend2.4/components/products/EditableProductTable.tsx",
                        lineNumber: 225,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend2.4/components/products/EditableProductTable.tsx",
                lineNumber: 220,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend2.4/components/products/EditableProductTable.tsx",
        lineNumber: 108,
        columnNumber: 10
    }, this);
}
_s(EditableProductTable, "QXd1QX4xjASA2a6p2pIfpKev+q4=");
_c = EditableProductTable;
var _c;
__turbopack_context__.k.register(_c, "EditableProductTable");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend2.4/components/ui/DataView.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>DataView
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend2.4/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend2.4/node_modules/next/dist/compiled/react/compiler-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend2.4/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
;
;
function DataView(t0) {
    _s();
    const $ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["c"])(17);
    if ($[0] !== "79bbc776966996bd1f4c7053395fac7532f129086e699482aefe382db35a4b46") {
        for(let $i = 0; $i < 17; $i += 1){
            $[$i] = Symbol.for("react.memo_cache_sentinel");
        }
        $[0] = "79bbc776966996bd1f4c7053395fac7532f129086e699482aefe382db35a4b46";
    }
    const { data: t1, metadata: t2, loading: t3, error: t4, emptyMessage: t5, title, subtitle, mode: t6, editable: t7, onSave, onChange, formData } = t0;
    const data = t1 === undefined ? [] : t1;
    let t8;
    if ($[1] !== t2) {
        t8 = t2 === undefined ? {} : t2;
        $[1] = t2;
        $[2] = t8;
    } else {
        t8 = $[2];
    }
    const metadata = t8;
    const loading = t3 === undefined ? false : t3;
    const error = t4 === undefined ? null : t4;
    const emptyMessage = t5 === undefined ? "No data available" : t5;
    const mode = t6 === undefined ? "auto" : t6;
    const editable = t7 === undefined ? false : t7;
    let t9;
    if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
        t9 = {};
        $[3] = t9;
    } else {
        t9 = $[3];
    }
    const [localFormData, setLocalFormData] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(t9);
    const displayMode = mode === "auto" ? data.length === 1 ? "form" : "table" : mode;
    let t10;
    if ($[4] !== metadata) {
        t10 = ({
            "DataView[getVisibleColumns]": (row)=>Object.keys(row).filter({
                    "DataView[getVisibleColumns > (anonymous)()]": (key)=>{
                        const meta = metadata[key];
                        return !meta?.hidden && !meta?.system;
                    }
                }["DataView[getVisibleColumns > (anonymous)()]"])
        })["DataView[getVisibleColumns]"];
        $[4] = metadata;
        $[5] = t10;
    } else {
        t10 = $[5];
    }
    const getVisibleColumns = t10;
    const getColumnLabel = {
        "DataView[getColumnLabel]": (key_0)=>metadata[key_0]?.label || key_0.replace(/_/g, " ").replace(/\b\w/g, _DataViewGetColumnLabelAnonymous)
    }["DataView[getColumnLabel]"];
    const isReadOnly = {
        "DataView[isReadOnly]": (key_1)=>!editable || metadata[key_1]?.readonly
    }["DataView[isReadOnly]"];
    const handleFieldChange = {
        "DataView[handleFieldChange]": (field, value)=>{
            if (onChange) {
                onChange(field, value);
            } else {
                setLocalFormData({
                    "DataView[handleFieldChange > setLocalFormData()]": (prev)=>({
                            ...prev,
                            [field]: value
                        })
                }["DataView[handleFieldChange > setLocalFormData()]"]);
            }
        }
    }["DataView[handleFieldChange]"];
    const currentFormData = formData || localFormData;
    if (loading) {
        let t11;
        if ($[6] === Symbol.for("react.memo_cache_sentinel")) {
            t11 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "text-center py-8 text-slate-600",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"
                    }, void 0, false, {
                        fileName: "[project]/frontend2.4/components/ui/DataView.tsx",
                        lineNumber: 119,
                        columnNumber: 62
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "mt-2",
                        children: "Loading data..."
                    }, void 0, false, {
                        fileName: "[project]/frontend2.4/components/ui/DataView.tsx",
                        lineNumber: 119,
                        columnNumber: 155
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend2.4/components/ui/DataView.tsx",
                lineNumber: 119,
                columnNumber: 13
            }, this);
            $[6] = t11;
        } else {
            t11 = $[6];
        }
        return t11;
    }
    if (error) {
        let t11;
        if ($[7] === Symbol.for("react.memo_cache_sentinel")) {
            t11 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "font-semibold",
                children: "Error loading data"
            }, void 0, false, {
                fileName: "[project]/frontend2.4/components/ui/DataView.tsx",
                lineNumber: 129,
                columnNumber: 13
            }, this);
            $[7] = t11;
        } else {
            t11 = $[7];
        }
        let t12;
        if ($[8] !== error) {
            t12 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg",
                children: [
                    t11,
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-sm",
                        children: error
                    }, void 0, false, {
                        fileName: "[project]/frontend2.4/components/ui/DataView.tsx",
                        lineNumber: 136,
                        columnNumber: 95
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend2.4/components/ui/DataView.tsx",
                lineNumber: 136,
                columnNumber: 13
            }, this);
            $[8] = error;
            $[9] = t12;
        } else {
            t12 = $[9];
        }
        return t12;
    }
    if (data.length === 0) {
        let t11;
        if ($[10] !== emptyMessage) {
            t11 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "text-center py-8 text-slate-500",
                children: emptyMessage
            }, void 0, false, {
                fileName: "[project]/frontend2.4/components/ui/DataView.tsx",
                lineNumber: 147,
                columnNumber: 13
            }, this);
            $[10] = emptyMessage;
            $[11] = t11;
        } else {
            t11 = $[11];
        }
        return t11;
    }
    if (displayMode === "form") {
        const row_0 = data[0];
        const mergedData = {
            ...row_0,
            ...currentFormData
        };
        const visibleColumns = getVisibleColumns(row_0);
        let t11;
        if ($[12] !== subtitle || $[13] !== title) {
            t11 = title && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mb-4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                        className: "font-semibold text-slate-800",
                        children: title
                    }, void 0, false, {
                        fileName: "[project]/frontend2.4/components/ui/DataView.tsx",
                        lineNumber: 164,
                        columnNumber: 44
                    }, this),
                    subtitle && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-sm text-slate-600",
                        children: subtitle
                    }, void 0, false, {
                        fileName: "[project]/frontend2.4/components/ui/DataView.tsx",
                        lineNumber: 164,
                        columnNumber: 114
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend2.4/components/ui/DataView.tsx",
                lineNumber: 164,
                columnNumber: 22
            }, this);
            $[12] = subtitle;
            $[13] = title;
            $[14] = t11;
        } else {
            t11 = $[14];
        }
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "space-y-4",
            children: [
                t11,
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "grid grid-cols-2 gap-4",
                    children: visibleColumns.map({
                        "DataView[visibleColumns.map()]": (key_2)=>{
                            const meta_0 = metadata[key_2];
                            const value_0 = mergedData[key_2];
                            const readonly = isReadOnly(key_2);
                            const isTextarea = meta_0?.type === "textarea";
                            const isSelect = meta_0?.type === "select";
                            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: isTextarea ? "col-span-2" : "",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: "block text-sm font-medium text-slate-700 mb-1",
                                        children: [
                                            getColumnLabel(key_2),
                                            meta_0?.required && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-red-500 ml-1",
                                                children: "*"
                                            }, void 0, false, {
                                                fileName: "[project]/frontend2.4/components/ui/DataView.tsx",
                                                lineNumber: 178,
                                                columnNumber: 189
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/frontend2.4/components/ui/DataView.tsx",
                                        lineNumber: 178,
                                        columnNumber: 80
                                    }, this),
                                    isTextarea ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                                        value: value_0 || "",
                                        onChange: {
                                            "DataView[visibleColumns.map() > <textarea>.onChange]": (e)=>handleFieldChange(key_2, e.target.value)
                                        }["DataView[visibleColumns.map() > <textarea>.onChange]"],
                                        readOnly: readonly,
                                        rows: 3,
                                        className: readonly ? "w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 cursor-not-allowed text-sm" : "w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend2.4/components/ui/DataView.tsx",
                                        lineNumber: 178,
                                        columnNumber: 256
                                    }, this) : isSelect && meta_0?.options ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                        value: value_0 || "",
                                        onChange: {
                                            "DataView[visibleColumns.map() > <select>.onChange]": (e_0)=>handleFieldChange(key_2, e_0.target.value)
                                        }["DataView[visibleColumns.map() > <select>.onChange]"],
                                        disabled: readonly,
                                        className: readonly ? "w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 cursor-not-allowed text-sm" : "w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                value: "",
                                                children: "Select..."
                                            }, void 0, false, {
                                                fileName: "[project]/frontend2.4/components/ui/DataView.tsx",
                                                lineNumber: 182,
                                                columnNumber: 340
                                            }, this),
                                            meta_0.options.map(_DataViewVisibleColumnsMapMeta_0OptionsMap)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/frontend2.4/components/ui/DataView.tsx",
                                        lineNumber: 180,
                                        columnNumber: 386
                                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        type: meta_0?.type || "text",
                                        value: value_0 === null ? "" : value_0,
                                        onChange: {
                                            "DataView[visibleColumns.map() > <input>.onChange]": (e_1)=>handleFieldChange(key_2, e_1.target.value)
                                        }["DataView[visibleColumns.map() > <input>.onChange]"],
                                        readOnly: readonly,
                                        className: readonly ? "w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 cursor-not-allowed text-sm" : "w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend2.4/components/ui/DataView.tsx",
                                        lineNumber: 182,
                                        columnNumber: 451
                                    }, this)
                                ]
                            }, key_2, true, {
                                fileName: "[project]/frontend2.4/components/ui/DataView.tsx",
                                lineNumber: 178,
                                columnNumber: 20
                            }, this);
                        }
                    }["DataView[visibleColumns.map()]"])
                }, void 0, false, {
                    fileName: "[project]/frontend2.4/components/ui/DataView.tsx",
                    lineNumber: 171,
                    columnNumber: 44
                }, this),
                editable && onSave && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex justify-end pt-4",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: {
                            "DataView[<button>.onClick]": ()=>onSave(mergedData)
                        }["DataView[<button>.onClick]"],
                        className: "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm",
                        children: "Save Changes"
                    }, void 0, false, {
                        fileName: "[project]/frontend2.4/components/ui/DataView.tsx",
                        lineNumber: 186,
                        columnNumber: 114
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/frontend2.4/components/ui/DataView.tsx",
                    lineNumber: 186,
                    columnNumber: 75
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/frontend2.4/components/ui/DataView.tsx",
            lineNumber: 171,
            columnNumber: 12
        }, this);
    }
    if (data.length > 0) {
        const visibleColumns_0 = getVisibleColumns(data[0]);
        const t11 = data.map({
            "DataView[data.map()]": (row_1, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                    className: "border-t border-slate-200 hover:bg-slate-50",
                    children: visibleColumns_0.map({
                        "DataView[data.map() > visibleColumns_0.map()]": (key_4)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                className: "px-4 py-2 whitespace-nowrap text-slate-600",
                                children: row_1[key_4] === null ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "text-slate-400 italic",
                                    children: "null"
                                }, void 0, false, {
                                    fileName: "[project]/frontend2.4/components/ui/DataView.tsx",
                                    lineNumber: 194,
                                    columnNumber: 165
                                }, this) : String(row_1[key_4])
                            }, key_4, false, {
                                fileName: "[project]/frontend2.4/components/ui/DataView.tsx",
                                lineNumber: 194,
                                columnNumber: 69
                            }, this)
                    }["DataView[data.map() > visibleColumns_0.map()]"])
                }, i, false, {
                    fileName: "[project]/frontend2.4/components/ui/DataView.tsx",
                    lineNumber: 193,
                    columnNumber: 45
                }, this)
        }["DataView[data.map()]"]);
        let t12;
        if ($[15] !== t11) {
            t12 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
                children: t11
            }, void 0, false, {
                fileName: "[project]/frontend2.4/components/ui/DataView.tsx",
                lineNumber: 199,
                columnNumber: 13
            }, this);
            $[15] = t11;
            $[16] = t12;
        } else {
            t12 = $[16];
        }
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            children: [
                title && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "mb-4",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                            className: "font-semibold text-slate-800",
                            children: [
                                title,
                                " (",
                                data.length,
                                ")"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/frontend2.4/components/ui/DataView.tsx",
                            lineNumber: 205,
                            columnNumber: 49
                        }, this),
                        subtitle && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-sm text-slate-600",
                            children: subtitle
                        }, void 0, false, {
                            fileName: "[project]/frontend2.4/components/ui/DataView.tsx",
                            lineNumber: 205,
                            columnNumber: 135
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/frontend2.4/components/ui/DataView.tsx",
                    lineNumber: 205,
                    columnNumber: 27
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "border border-slate-200 rounded-lg overflow-x-auto max-h-96",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
                        className: "w-full text-sm",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("thead", {
                                className: "bg-slate-100 sticky top-0",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                    children: visibleColumns_0.map({
                                        "DataView[visibleColumns_0.map()]": (key_3)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: "px-4 py-2 text-left font-medium text-slate-700 whitespace-nowrap",
                                                style: {
                                                    width: metadata[key_3]?.width
                                                },
                                                children: getColumnLabel(key_3)
                                            }, key_3, false, {
                                                fileName: "[project]/frontend2.4/components/ui/DataView.tsx",
                                                lineNumber: 206,
                                                columnNumber: 62
                                            }, this)
                                    }["DataView[visibleColumns_0.map()]"])
                                }, void 0, false, {
                                    fileName: "[project]/frontend2.4/components/ui/DataView.tsx",
                                    lineNumber: 205,
                                    columnNumber: 351
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/frontend2.4/components/ui/DataView.tsx",
                                lineNumber: 205,
                                columnNumber: 306
                            }, this),
                            t12
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend2.4/components/ui/DataView.tsx",
                        lineNumber: 205,
                        columnNumber: 272
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/frontend2.4/components/ui/DataView.tsx",
                    lineNumber: 205,
                    columnNumber: 195
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/frontend2.4/components/ui/DataView.tsx",
            lineNumber: 205,
            columnNumber: 12
        }, this);
    }
    return null;
}
_s(DataView, "VG67pD6QOC1gIzv5IgWyD0mu76k=");
_c = DataView;
function _DataViewVisibleColumnsMapMeta_0OptionsMap(opt) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
        value: opt,
        children: opt
    }, opt, false, {
        fileName: "[project]/frontend2.4/components/ui/DataView.tsx",
        lineNumber: 214,
        columnNumber: 10
    }, this);
}
function _DataViewGetColumnLabelAnonymous(l) {
    return l.toUpperCase();
}
var _c;
__turbopack_context__.k.register(_c, "DataView");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend2.4/components/products/ProductView.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>ProductView
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend2.4/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend2.4/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__ = __turbopack_context__.i("[project]/frontend2.4/node_modules/lucide-react/dist/esm/icons/x.js [app-client] (ecmascript) <export default as X>");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$components$2f$ui$2f$Tabs$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend2.4/components/ui/Tabs.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$components$2f$ui$2f$DataView$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend2.4/components/ui/DataView.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
;
function ProductView({ product, onClose }) {
    _s();
    const [activeTab, setActiveTab] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('base');
    // Production data state
    const [productionData, setProductionData] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [loadingProduction, setLoadingProduction] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [productionError, setProductionError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    // ERP data state
    const [erpData, setErpData] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [loadingErp, setLoadingErp] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [erpError, setErpError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    // Engineering data state
    const [engineeringData, setEngineeringData] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [loadingEngineering, setLoadingEngineering] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [engineeringError, setEngineeringError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ProductView.useEffect": ()=>{
            fetchProductionData();
            fetchERPData();
            fetchEngineeringData();
        }
    }["ProductView.useEffect"], [
        product.apcPN
    ]);
    const fetchProductionData = async ()=>{
        setLoadingProduction(true);
        setProductionError(null);
        try {
            const res = await fetch('/api/products/production', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    apcPN: product.apcPN
                })
            });
            if (!res.ok) throw new Error('Failed to fetch production data');
            const data = await res.json();
            setProductionData(data.results || []);
        } catch (error) {
            console.error('Error fetching production data:', error);
            setProductionError(error instanceof Error ? error.message : 'Failed to load production data');
        } finally{
            setLoadingProduction(false);
        }
    };
    const fetchERPData = async ()=>{
        setLoadingErp(true);
        setErpError(null);
        try {
            const res_0 = await fetch('/api/products/erp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    apcPN: product.apcPN
                })
            });
            if (!res_0.ok) throw new Error('Failed to fetch ERP data');
            const data_0 = await res_0.json();
            setErpData(data_0.results || []);
        } catch (error_0) {
            console.error('Error fetching ERP data:', error_0);
            setErpError(error_0 instanceof Error ? error_0.message : 'Failed to load ERP data');
        } finally{
            setLoadingErp(false);
        }
    };
    const fetchEngineeringData = async ()=>{
        setLoadingEngineering(true);
        setEngineeringError(null);
        try {
            const res_1 = await fetch('/api/products/engineering', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    apcPN: product.apcPN
                })
            });
            if (!res_1.ok) throw new Error('Failed to fetch engineering data');
            const data_1 = await res_1.json();
            setEngineeringData(data_1.results || []);
        } catch (error_1) {
            console.error('Error fetching engineering data:', error_1);
            setEngineeringError(error_1 instanceof Error ? error_1.message : 'Failed to load engineering data');
        } finally{
            setLoadingEngineering(false);
        }
    };
    // Metadata definitions for each data source
    const baseMetadata = {
        id: {
            hidden: true
        },
        item_type_id: {
            hidden: true
        },
        apcPN: {
            label: 'APC Part Number',
            readonly: true
        },
        item_type_name: {
            label: 'Type',
            readonly: true
        },
        customer: {
            label: 'Customer'
        },
        customerPN: {
            label: 'Customer Part Number'
        },
        currentRev: {
            label: 'Part Revision'
        },
        buildRev: {
            label: 'Build Revision'
        },
        description: {
            label: 'Description',
            type: 'textarea'
        },
        fullPath: {
            label: 'Full Path'
        },
        createdAt: {
            label: 'Created At',
            readonly: true
        }
    };
    const productionMetadata = {
        // Example: Hide internal IDs, show important fields
        internal_id: {
            system: true
        },
        record_id: {
            hidden: true
        },
        part_number: {
            label: 'Part Number',
            width: '150px'
        },
        quantity: {
            label: 'Qty',
            type: 'number',
            width: '80px'
        },
        work_order: {
            label: 'Work Order',
            width: '120px'
        },
        status: {
            label: 'Status',
            width: '100px'
        },
        created_date: {
            label: 'Created',
            width: '120px'
        }
    };
    const erpMetadata = {
        // Example ERP metadata
        item_id: {
            hidden: true
        },
        part_number: {
            label: 'Part Number',
            width: '150px'
        },
        description: {
            label: 'Description',
            width: '200px'
        },
        unit_price: {
            label: 'Unit Price',
            type: 'number',
            width: '100px'
        },
        stock_qty: {
            label: 'In Stock',
            type: 'number',
            width: '80px'
        },
        location: {
            label: 'Location',
            width: '120px'
        }
    };
    const engineeringMetadata = {
        // Example engineering metadata
        drawing_id: {
            hidden: true
        },
        revision: {
            label: 'Revision',
            width: '80px'
        },
        drawing_number: {
            label: 'Drawing Number',
            width: '150px'
        },
        title: {
            label: 'Title',
            width: '200px'
        },
        engineer: {
            label: 'Engineer',
            width: '120px'
        },
        release_date: {
            label: 'Released',
            width: '120px'
        }
    };
    // Base Information Tab (using DataView in form mode)
    const baseInfoTab = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$components$2f$ui$2f$DataView$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
        data: [
            product
        ],
        metadata: baseMetadata,
        mode: "form",
        editable: false
    }, void 0, false, {
        fileName: "[project]/frontend2.4/components/products/ProductView.tsx",
        lineNumber: 258,
        columnNumber: 23
    }, this);
    // Production Information Tab (auto-switches between form/table)
    const productionTab = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$components$2f$ui$2f$DataView$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
        data: productionData,
        metadata: productionMetadata,
        loading: loadingProduction,
        error: productionError,
        emptyMessage: `No production data found for part ${product.apcPN}`,
        title: "Production Records",
        subtitle: "Data from data0050 table (read-only)",
        editable: false
    }, void 0, false, {
        fileName: "[project]/frontend2.4/components/products/ProductView.tsx",
        lineNumber: 261,
        columnNumber: 25
    }, this);
    // ERP Tab (auto-switches between form/table)
    const erpTab = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$components$2f$ui$2f$DataView$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
        data: erpData,
        metadata: erpMetadata,
        loading: loadingErp,
        error: erpError,
        emptyMessage: `No ERP data found for part ${product.apcPN}`,
        title: "ERP Information",
        subtitle: "Data from ERP system (read-only)",
        editable: false
    }, void 0, false, {
        fileName: "[project]/frontend2.4/components/products/ProductView.tsx",
        lineNumber: 264,
        columnNumber: 18
    }, this);
    // Engineering Tab (auto-switches between form/table)
    const engineeringTab = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$components$2f$ui$2f$DataView$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
        data: engineeringData,
        metadata: engineeringMetadata,
        loading: loadingEngineering,
        error: engineeringError,
        emptyMessage: `No engineering data found for part ${product.apcPN}`,
        title: "Engineering Reference",
        subtitle: "Data from engineering database (read-only)",
        editable: false
    }, void 0, false, {
        fileName: "[project]/frontend2.4/components/products/ProductView.tsx",
        lineNumber: 267,
        columnNumber: 26
    }, this);
    const tabs = [
        {
            id: 'base',
            label: 'Base Information',
            content: baseInfoTab,
            closeable: false
        },
        {
            id: 'production',
            label: 'Production',
            content: productionTab,
            closeable: false
        },
        {
            id: 'erp',
            label: 'ERP Data',
            content: erpTab,
            closeable: false
        },
        {
            id: 'engineering',
            label: 'Engineering',
            content: engineeringTab,
            closeable: false
        }
    ];
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "bg-white rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex items-center justify-between p-6 border-b border-slate-200",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                    className: "text-2xl font-bold text-slate-800",
                                    children: [
                                        "View Product: ",
                                        product.apcPN
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/frontend2.4/components/products/ProductView.tsx",
                                    lineNumber: 294,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-sm text-slate-600 mt-1",
                                    children: "Product information (read-only)"
                                }, void 0, false, {
                                    fileName: "[project]/frontend2.4/components/products/ProductView.tsx",
                                    lineNumber: 295,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/frontend2.4/components/products/ProductView.tsx",
                            lineNumber: 293,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: onClose,
                            className: "p-2 hover:bg-slate-100 rounded-lg transition-colors",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {
                                size: 24,
                                className: "text-slate-600"
                            }, void 0, false, {
                                fileName: "[project]/frontend2.4/components/products/ProductView.tsx",
                                lineNumber: 298,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/frontend2.4/components/products/ProductView.tsx",
                            lineNumber: 297,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/frontend2.4/components/products/ProductView.tsx",
                    lineNumber: 292,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex-1 overflow-auto p-6",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$components$2f$ui$2f$Tabs$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                        tabs: tabs,
                        activeTab: activeTab,
                        onTabChange: setActiveTab
                    }, void 0, false, {
                        fileName: "[project]/frontend2.4/components/products/ProductView.tsx",
                        lineNumber: 304,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/frontend2.4/components/products/ProductView.tsx",
                    lineNumber: 303,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex items-center justify-end gap-3 p-6 border-t border-slate-200",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: onClose,
                        className: "px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors",
                        children: "Close"
                    }, void 0, false, {
                        fileName: "[project]/frontend2.4/components/products/ProductView.tsx",
                        lineNumber: 309,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/frontend2.4/components/products/ProductView.tsx",
                    lineNumber: 308,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/frontend2.4/components/products/ProductView.tsx",
            lineNumber: 290,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/frontend2.4/components/products/ProductView.tsx",
        lineNumber: 289,
        columnNumber: 10
    }, this);
}
_s(ProductView, "vaU0Gy7QWiKYRPfVws34XdrLwek=");
_c = ProductView;
var _c;
__turbopack_context__.k.register(_c, "ProductView");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend2.4/components/products/ProductEditTabWithTabs.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>DataView
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend2.4/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend2.4/node_modules/next/dist/compiled/react/compiler-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend2.4/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
;
;
function DataView(t0) {
    _s();
    const $ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["c"])(87);
    if ($[0] !== "b70b2e45f55a4c32796389683909906851e0d6ca2aab4e5ea52d5fe621a04bcf") {
        for(let $i = 0; $i < 87; $i += 1){
            $[$i] = Symbol.for("react.memo_cache_sentinel");
        }
        $[0] = "b70b2e45f55a4c32796389683909906851e0d6ca2aab4e5ea52d5fe621a04bcf";
    }
    const { data, metadata: t1, loading: t2, error: t3, emptyMessage: t4, title, subtitle, mode: t5, editable: t6, onSave, onChange, formData } = t0;
    let t7;
    if ($[1] !== t1) {
        t7 = t1 === undefined ? {} : t1;
        $[1] = t1;
        $[2] = t7;
    } else {
        t7 = $[2];
    }
    const metadata = t7;
    const loading = t2 === undefined ? false : t2;
    const error = t3 === undefined ? null : t3;
    const emptyMessage = t4 === undefined ? "No data available" : t4;
    const mode = t5 === undefined ? "auto" : t5;
    const editable = t6 === undefined ? false : t6;
    let t8;
    if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
        t8 = {};
        $[3] = t8;
    } else {
        t8 = $[3];
    }
    const [localFormData, setLocalFormData] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(t8);
    const displayMode = mode === "auto" ? data && data.length === 1 ? "form" : "table" : mode;
    let t9;
    if ($[4] !== metadata) {
        t9 = ({
            "DataView[getVisibleColumns]": (row)=>Object.keys(row).filter({
                    "DataView[getVisibleColumns > (anonymous)()]": (key)=>{
                        const meta = metadata[key];
                        return !meta?.hidden && !meta?.system;
                    }
                }["DataView[getVisibleColumns > (anonymous)()]"])
        })["DataView[getVisibleColumns]"];
        $[4] = metadata;
        $[5] = t9;
    } else {
        t9 = $[5];
    }
    const getVisibleColumns = t9;
    let t10;
    if ($[6] !== metadata) {
        t10 = ({
            "DataView[getColumnLabel]": (key_0)=>metadata[key_0]?.label || key_0.replace(/_/g, " ").replace(/\b\w/g, _DataViewGetColumnLabelAnonymous)
        })["DataView[getColumnLabel]"];
        $[6] = metadata;
        $[7] = t10;
    } else {
        t10 = $[7];
    }
    const getColumnLabel = t10;
    let t11;
    if ($[8] !== editable || $[9] !== metadata) {
        t11 = ({
            "DataView[isReadOnly]": (key_1)=>!editable || metadata[key_1]?.readonly
        })["DataView[isReadOnly]"];
        $[8] = editable;
        $[9] = metadata;
        $[10] = t11;
    } else {
        t11 = $[10];
    }
    const isReadOnly = t11;
    let t12;
    if ($[11] !== onChange) {
        t12 = ({
            "DataView[handleFieldChange]": (field, value)=>{
                if (onChange) {
                    onChange(field, value);
                } else {
                    setLocalFormData({
                        "DataView[handleFieldChange > setLocalFormData()]": (prev)=>({
                                ...prev,
                                [field]: value
                            })
                    }["DataView[handleFieldChange > setLocalFormData()]"]);
                }
            }
        })["DataView[handleFieldChange]"];
        $[11] = onChange;
        $[12] = t12;
    } else {
        t12 = $[12];
    }
    const handleFieldChange = t12;
    const currentFormData = formData || localFormData;
    if (loading) {
        let t13;
        if ($[13] === Symbol.for("react.memo_cache_sentinel")) {
            t13 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "text-center py-8 text-slate-600",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"
                    }, void 0, false, {
                        fileName: "[project]/frontend2.4/components/products/ProductEditTabWithTabs.tsx",
                        lineNumber: 143,
                        columnNumber: 62
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "mt-2",
                        children: "Loading data..."
                    }, void 0, false, {
                        fileName: "[project]/frontend2.4/components/products/ProductEditTabWithTabs.tsx",
                        lineNumber: 143,
                        columnNumber: 155
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend2.4/components/products/ProductEditTabWithTabs.tsx",
                lineNumber: 143,
                columnNumber: 13
            }, this);
            $[13] = t13;
        } else {
            t13 = $[13];
        }
        return t13;
    }
    if (error) {
        let t13;
        if ($[14] === Symbol.for("react.memo_cache_sentinel")) {
            t13 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "font-semibold",
                children: "Error loading data"
            }, void 0, false, {
                fileName: "[project]/frontend2.4/components/products/ProductEditTabWithTabs.tsx",
                lineNumber: 153,
                columnNumber: 13
            }, this);
            $[14] = t13;
        } else {
            t13 = $[14];
        }
        let t14;
        if ($[15] !== error) {
            t14 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg",
                children: [
                    t13,
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-sm",
                        children: error
                    }, void 0, false, {
                        fileName: "[project]/frontend2.4/components/products/ProductEditTabWithTabs.tsx",
                        lineNumber: 160,
                        columnNumber: 95
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend2.4/components/products/ProductEditTabWithTabs.tsx",
                lineNumber: 160,
                columnNumber: 13
            }, this);
            $[15] = error;
            $[16] = t14;
        } else {
            t14 = $[16];
        }
        return t14;
    }
    if (data.length === 0) {
        let t13;
        if ($[17] !== emptyMessage) {
            t13 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "text-center py-8 text-slate-500",
                children: emptyMessage
            }, void 0, false, {
                fileName: "[project]/frontend2.4/components/products/ProductEditTabWithTabs.tsx",
                lineNumber: 171,
                columnNumber: 13
            }, this);
            $[17] = emptyMessage;
            $[18] = t13;
        } else {
            t13 = $[18];
        }
        return t13;
    }
    if (displayMode === "form") {
        const row_0 = data[0];
        let t13;
        if ($[19] !== currentFormData || $[20] !== row_0) {
            t13 = {
                ...row_0,
                ...currentFormData
            };
            $[19] = currentFormData;
            $[20] = row_0;
            $[21] = t13;
        } else {
            t13 = $[21];
        }
        const mergedData = t13;
        let t14;
        let t15;
        let t16;
        let t17;
        if ($[22] !== getColumnLabel || $[23] !== getVisibleColumns || $[24] !== handleFieldChange || $[25] !== isReadOnly || $[26] !== mergedData || $[27] !== metadata || $[28] !== row_0 || $[29] !== subtitle || $[30] !== title) {
            const visibleColumns = getVisibleColumns(row_0);
            t16 = "space-y-4";
            if ($[35] !== subtitle || $[36] !== title) {
                t17 = title && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "mb-4",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                            className: "font-semibold text-slate-800",
                            children: title
                        }, void 0, false, {
                            fileName: "[project]/frontend2.4/components/products/ProductEditTabWithTabs.tsx",
                            lineNumber: 202,
                            columnNumber: 46
                        }, this),
                        subtitle && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-sm text-slate-600",
                            children: subtitle
                        }, void 0, false, {
                            fileName: "[project]/frontend2.4/components/products/ProductEditTabWithTabs.tsx",
                            lineNumber: 202,
                            columnNumber: 116
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/frontend2.4/components/products/ProductEditTabWithTabs.tsx",
                    lineNumber: 202,
                    columnNumber: 24
                }, this);
                $[35] = subtitle;
                $[36] = title;
                $[37] = t17;
            } else {
                t17 = $[37];
            }
            t14 = "grid grid-cols-2 gap-4";
            t15 = visibleColumns.map({
                "DataView[visibleColumns.map()]": (key_2)=>{
                    const meta_0 = metadata[key_2];
                    const value_0 = mergedData[key_2];
                    const readonly = isReadOnly(key_2);
                    const isTextarea = meta_0?.type === "textarea";
                    const isSelect = meta_0?.type === "select";
                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: isTextarea ? "col-span-2" : "",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: "block text-sm font-medium text-slate-700 mb-1",
                                children: [
                                    getColumnLabel(key_2),
                                    meta_0?.required && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-red-500 ml-1",
                                        children: "*"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend2.4/components/products/ProductEditTabWithTabs.tsx",
                                        lineNumber: 217,
                                        columnNumber: 187
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend2.4/components/products/ProductEditTabWithTabs.tsx",
                                lineNumber: 217,
                                columnNumber: 78
                            }, this),
                            isTextarea ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                                value: value_0 || "",
                                onChange: {
                                    "DataView[visibleColumns.map() > <textarea>.onChange]": (e)=>handleFieldChange(key_2, e.target.value)
                                }["DataView[visibleColumns.map() > <textarea>.onChange]"],
                                readOnly: readonly,
                                rows: 3,
                                className: readonly ? "w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 cursor-not-allowed text-sm" : "w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                            }, void 0, false, {
                                fileName: "[project]/frontend2.4/components/products/ProductEditTabWithTabs.tsx",
                                lineNumber: 217,
                                columnNumber: 254
                            }, this) : isSelect && meta_0?.options ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                value: value_0 || "",
                                onChange: {
                                    "DataView[visibleColumns.map() > <select>.onChange]": (e_0)=>handleFieldChange(key_2, e_0.target.value)
                                }["DataView[visibleColumns.map() > <select>.onChange]"],
                                disabled: readonly,
                                className: readonly ? "w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 cursor-not-allowed text-sm" : "w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "",
                                        children: "Select..."
                                    }, void 0, false, {
                                        fileName: "[project]/frontend2.4/components/products/ProductEditTabWithTabs.tsx",
                                        lineNumber: 221,
                                        columnNumber: 338
                                    }, this),
                                    meta_0.options.map(_DataViewVisibleColumnsMapMeta_0OptionsMap)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend2.4/components/products/ProductEditTabWithTabs.tsx",
                                lineNumber: 219,
                                columnNumber: 384
                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                type: meta_0?.type || "text",
                                value: value_0 === null ? "" : value_0,
                                onChange: {
                                    "DataView[visibleColumns.map() > <input>.onChange]": (e_1)=>handleFieldChange(key_2, e_1.target.value)
                                }["DataView[visibleColumns.map() > <input>.onChange]"],
                                readOnly: readonly,
                                className: readonly ? "w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 cursor-not-allowed text-sm" : "w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                            }, void 0, false, {
                                fileName: "[project]/frontend2.4/components/products/ProductEditTabWithTabs.tsx",
                                lineNumber: 221,
                                columnNumber: 449
                            }, this)
                        ]
                    }, key_2, true, {
                        fileName: "[project]/frontend2.4/components/products/ProductEditTabWithTabs.tsx",
                        lineNumber: 217,
                        columnNumber: 18
                    }, this);
                }
            }["DataView[visibleColumns.map()]"]);
            $[22] = getColumnLabel;
            $[23] = getVisibleColumns;
            $[24] = handleFieldChange;
            $[25] = isReadOnly;
            $[26] = mergedData;
            $[27] = metadata;
            $[28] = row_0;
            $[29] = subtitle;
            $[30] = title;
            $[31] = t14;
            $[32] = t15;
            $[33] = t16;
            $[34] = t17;
        } else {
            t14 = $[31];
            t15 = $[32];
            t16 = $[33];
            t17 = $[34];
        }
        let t18;
        if ($[38] !== t14 || $[39] !== t15) {
            t18 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: t14,
                children: t15
            }, void 0, false, {
                fileName: "[project]/frontend2.4/components/products/ProductEditTabWithTabs.tsx",
                lineNumber: 247,
                columnNumber: 13
            }, this);
            $[38] = t14;
            $[39] = t15;
            $[40] = t18;
        } else {
            t18 = $[40];
        }
        let t19;
        if ($[41] !== editable || $[42] !== mergedData || $[43] !== onSave) {
            t19 = editable && onSave && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex justify-end pt-4",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                    onClick: {
                        "DataView[<button>.onClick]": ()=>onSave(mergedData)
                    }["DataView[<button>.onClick]"],
                    className: "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm",
                    children: "Save Changes"
                }, void 0, false, {
                    fileName: "[project]/frontend2.4/components/products/ProductEditTabWithTabs.tsx",
                    lineNumber: 256,
                    columnNumber: 74
                }, this)
            }, void 0, false, {
                fileName: "[project]/frontend2.4/components/products/ProductEditTabWithTabs.tsx",
                lineNumber: 256,
                columnNumber: 35
            }, this);
            $[41] = editable;
            $[42] = mergedData;
            $[43] = onSave;
            $[44] = t19;
        } else {
            t19 = $[44];
        }
        let t20;
        if ($[45] !== t16 || $[46] !== t17 || $[47] !== t18 || $[48] !== t19) {
            t20 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: t16,
                children: [
                    t17,
                    t18,
                    t19
                ]
            }, void 0, true, {
                fileName: "[project]/frontend2.4/components/products/ProductEditTabWithTabs.tsx",
                lineNumber: 268,
                columnNumber: 13
            }, this);
            $[45] = t16;
            $[46] = t17;
            $[47] = t18;
            $[48] = t19;
            $[49] = t20;
        } else {
            t20 = $[49];
        }
        return t20;
    }
    if (data.length > 0) {
        let t13;
        let t14;
        let t15;
        let t16;
        let t17;
        let visibleColumns_0;
        if ($[50] !== data[0] || $[51] !== data.length || $[52] !== getColumnLabel || $[53] !== getVisibleColumns || $[54] !== metadata || $[55] !== subtitle || $[56] !== title) {
            visibleColumns_0 = getVisibleColumns(data[0]);
            if ($[63] !== data.length || $[64] !== subtitle || $[65] !== title) {
                t16 = title && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "mb-4",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                            className: "font-semibold text-slate-800",
                            children: [
                                title,
                                " (",
                                data.length,
                                ")"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/frontend2.4/components/products/ProductEditTabWithTabs.tsx",
                            lineNumber: 289,
                            columnNumber: 46
                        }, this),
                        subtitle && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-sm text-slate-600",
                            children: subtitle
                        }, void 0, false, {
                            fileName: "[project]/frontend2.4/components/products/ProductEditTabWithTabs.tsx",
                            lineNumber: 289,
                            columnNumber: 132
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/frontend2.4/components/products/ProductEditTabWithTabs.tsx",
                    lineNumber: 289,
                    columnNumber: 24
                }, this);
                $[63] = data.length;
                $[64] = subtitle;
                $[65] = title;
                $[66] = t16;
            } else {
                t16 = $[66];
            }
            t15 = "border border-slate-200 rounded-lg overflow-x-auto max-h-96";
            t14 = "w-full text-sm";
            t13 = "bg-slate-100 sticky top-0";
            t17 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                children: visibleColumns_0.map({
                    "DataView[visibleColumns_0.map()]": (key_3)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                            className: "px-4 py-2 text-left font-medium text-slate-700 whitespace-nowrap",
                            style: {
                                width: metadata[key_3]?.width
                            },
                            children: getColumnLabel(key_3)
                        }, key_3, false, {
                            fileName: "[project]/frontend2.4/components/products/ProductEditTabWithTabs.tsx",
                            lineNumber: 301,
                            columnNumber: 56
                        }, this)
                }["DataView[visibleColumns_0.map()]"])
            }, void 0, false, {
                fileName: "[project]/frontend2.4/components/products/ProductEditTabWithTabs.tsx",
                lineNumber: 300,
                columnNumber: 13
            }, this);
            $[50] = data[0];
            $[51] = data.length;
            $[52] = getColumnLabel;
            $[53] = getVisibleColumns;
            $[54] = metadata;
            $[55] = subtitle;
            $[56] = title;
            $[57] = t13;
            $[58] = t14;
            $[59] = t15;
            $[60] = t16;
            $[61] = t17;
            $[62] = visibleColumns_0;
        } else {
            t13 = $[57];
            t14 = $[58];
            t15 = $[59];
            t16 = $[60];
            t17 = $[61];
            visibleColumns_0 = $[62];
        }
        let t18;
        if ($[67] !== t13 || $[68] !== t17) {
            t18 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("thead", {
                className: t13,
                children: t17
            }, void 0, false, {
                fileName: "[project]/frontend2.4/components/products/ProductEditTabWithTabs.tsx",
                lineNumber: 328,
                columnNumber: 13
            }, this);
            $[67] = t13;
            $[68] = t17;
            $[69] = t18;
        } else {
            t18 = $[69];
        }
        let t19;
        if ($[70] !== data || $[71] !== visibleColumns_0) {
            let t20;
            if ($[73] !== visibleColumns_0) {
                t20 = ({
                    "DataView[data.map()]": (row_1, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                            className: "border-t border-slate-200 hover:bg-slate-50",
                            children: visibleColumns_0.map({
                                "DataView[data.map() > visibleColumns_0.map()]": (key_4)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                        className: "px-4 py-2 whitespace-nowrap text-slate-600",
                                        children: row_1[key_4] === null ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "text-slate-400 italic",
                                            children: "null"
                                        }, void 0, false, {
                                            fileName: "[project]/frontend2.4/components/products/ProductEditTabWithTabs.tsx",
                                            lineNumber: 341,
                                            columnNumber: 169
                                        }, this) : String(row_1[key_4])
                                    }, key_4, false, {
                                        fileName: "[project]/frontend2.4/components/products/ProductEditTabWithTabs.tsx",
                                        lineNumber: 341,
                                        columnNumber: 73
                                    }, this)
                            }["DataView[data.map() > visibleColumns_0.map()]"])
                        }, i, false, {
                            fileName: "[project]/frontend2.4/components/products/ProductEditTabWithTabs.tsx",
                            lineNumber: 340,
                            columnNumber: 49
                        }, this)
                })["DataView[data.map()]"];
                $[73] = visibleColumns_0;
                $[74] = t20;
            } else {
                t20 = $[74];
            }
            t19 = data.map(t20);
            $[70] = data;
            $[71] = visibleColumns_0;
            $[72] = t19;
        } else {
            t19 = $[72];
        }
        let t20;
        if ($[75] !== t19) {
            t20 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
                children: t19
            }, void 0, false, {
                fileName: "[project]/frontend2.4/components/products/ProductEditTabWithTabs.tsx",
                lineNumber: 358,
                columnNumber: 13
            }, this);
            $[75] = t19;
            $[76] = t20;
        } else {
            t20 = $[76];
        }
        let t21;
        if ($[77] !== t14 || $[78] !== t18 || $[79] !== t20) {
            t21 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
                className: t14,
                children: [
                    t18,
                    t20
                ]
            }, void 0, true, {
                fileName: "[project]/frontend2.4/components/products/ProductEditTabWithTabs.tsx",
                lineNumber: 366,
                columnNumber: 13
            }, this);
            $[77] = t14;
            $[78] = t18;
            $[79] = t20;
            $[80] = t21;
        } else {
            t21 = $[80];
        }
        let t22;
        if ($[81] !== t15 || $[82] !== t21) {
            t22 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: t15,
                children: t21
            }, void 0, false, {
                fileName: "[project]/frontend2.4/components/products/ProductEditTabWithTabs.tsx",
                lineNumber: 376,
                columnNumber: 13
            }, this);
            $[81] = t15;
            $[82] = t21;
            $[83] = t22;
        } else {
            t22 = $[83];
        }
        let t23;
        if ($[84] !== t16 || $[85] !== t22) {
            t23 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                children: [
                    t16,
                    t22
                ]
            }, void 0, true, {
                fileName: "[project]/frontend2.4/components/products/ProductEditTabWithTabs.tsx",
                lineNumber: 385,
                columnNumber: 13
            }, this);
            $[84] = t16;
            $[85] = t22;
            $[86] = t23;
        } else {
            t23 = $[86];
        }
        return t23;
    }
    return null;
}
_s(DataView, "XOlR9IeiCaQHaLaYBd7uGTokErI=");
_c = DataView;
function _DataViewVisibleColumnsMapMeta_0OptionsMap(opt) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
        value: opt,
        children: opt
    }, opt, false, {
        fileName: "[project]/frontend2.4/components/products/ProductEditTabWithTabs.tsx",
        lineNumber: 397,
        columnNumber: 10
    }, this);
}
function _DataViewGetColumnLabelAnonymous(l) {
    return l.toUpperCase();
}
var _c;
__turbopack_context__.k.register(_c, "DataView");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend2.4/app/(dashboard)/products/page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>ProductsPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend2.4/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend2.4/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$components$2f$ui$2f$Tabs$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend2.4/components/ui/Tabs.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$components$2f$products$2f$EditableProductTable$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend2.4/components/products/EditableProductTable.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$components$2f$products$2f$ProductView$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend2.4/components/products/ProductView.tsx [app-client] (ecmascript)");
//import ProductEditTab from '@/components/products/ProductEditTab'
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$components$2f$products$2f$ProductEditTabWithTabs$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend2.4/components/products/ProductEditTabWithTabs.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$plus$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Plus$3e$__ = __turbopack_context__.i("[project]/frontend2.4/node_modules/lucide-react/dist/esm/icons/plus.js [app-client] (ecmascript) <export default as Plus>");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2d$auth$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend2.4/node_modules/next-auth/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
;
;
;
;
function ProductsPage() {
    _s();
    const { data: session } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2d$auth$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSession"])();
    const [products, setProducts] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [viewProduct, setViewProduct] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [editingProducts, setEditingProducts] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [activeTab, setActiveTab] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('all');
    const [tableState, setTableState] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        search: '',
        sortKey: 'apcPN',
        sortAsc: true,
        pageSize: 25,
        page: 0,
        typeFilter: 'all'
    });
    // Check if user is admin
    const isAdmin = session?.user?.roles?.includes('admin') || false;
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ProductsPage.useEffect": ()=>{
            fetchProducts();
        }
    }["ProductsPage.useEffect"], []);
    const fetchProducts = async ()=>{
        try {
            setLoading(true);
            setError(null);
            const res = await fetch('/api/products');
            if (!res.ok) {
                throw new Error(`Failed to fetch products: ${res.status}`);
            }
            const data = await res.json();
            setProducts(data);
        } catch (error_0) {
            console.error('Error fetching products:', error_0);
            setError(error_0 instanceof Error ? error_0.message : 'Failed to load products');
        } finally{
            setLoading(false);
        }
    };
    const handleView = (product)=>{
        setViewProduct(product);
    };
    const handleEdit = (product_0)=>{
        const alreadyEditing = editingProducts.find((p)=>p.id === product_0.id);
        if (!alreadyEditing) {
            setEditingProducts((prev)=>[
                    ...prev,
                    product_0
                ]);
        }
        setActiveTab(`edit-${product_0.id}`);
    };
    const handleCloseEditTab = (productId)=>{
        setEditingProducts((prev_0)=>prev_0.filter((p_0)=>p_0.id !== productId));
        setActiveTab('all');
    };
    const handleInlineSave = async (product_1)=>{
        try {
            const res_0 = await fetch(`/api/products/${product_1.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(product_1)
            });
            if (!res_0.ok) {
                const responseData = await res_0.json();
                throw new Error(responseData.error || 'Failed to save product');
            }
            await fetchProducts();
        } catch (error_1) {
            console.error('Error saving product:', error_1);
            alert(`Failed to save product: ${error_1 instanceof Error ? error_1.message : 'Unknown error'}`);
            throw error_1;
        }
    };
    const handleSave = async (product_2)=>{
        try {
            const res_1 = await fetch(`/api/products/${product_2.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(product_2)
            });
            if (!res_1.ok) {
                const responseData_0 = await res_1.json();
                throw new Error(responseData_0.error || 'Failed to save product');
            }
            await fetchProducts();
            handleCloseEditTab(product_2.id);
        } catch (error_2) {
            console.error('Error saving product:', error_2);
            alert(`Failed to save product: ${error_2 instanceof Error ? error_2.message : 'Unknown error'}`);
        }
    };
    if (loading) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "p-6",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "animate-pulse",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "h-8 bg-slate-200 rounded w-1/4 mb-4"
                    }, void 0, false, {
                        fileName: "[project]/frontend2.4/app/(dashboard)/products/page.tsx",
                        lineNumber: 123,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "h-64 bg-slate-200 rounded"
                    }, void 0, false, {
                        fileName: "[project]/frontend2.4/app/(dashboard)/products/page.tsx",
                        lineNumber: 124,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend2.4/app/(dashboard)/products/page.tsx",
                lineNumber: 122,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/frontend2.4/app/(dashboard)/products/page.tsx",
            lineNumber: 121,
            columnNumber: 12
        }, this);
    }
    if (error) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "p-6",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "font-semibold",
                        children: "Error loading products"
                    }, void 0, false, {
                        fileName: "[project]/frontend2.4/app/(dashboard)/products/page.tsx",
                        lineNumber: 131,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-sm",
                        children: error
                    }, void 0, false, {
                        fileName: "[project]/frontend2.4/app/(dashboard)/products/page.tsx",
                        lineNumber: 132,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: fetchProducts,
                        className: "mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700",
                        children: "Retry"
                    }, void 0, false, {
                        fileName: "[project]/frontend2.4/app/(dashboard)/products/page.tsx",
                        lineNumber: 133,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend2.4/app/(dashboard)/products/page.tsx",
                lineNumber: 130,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/frontend2.4/app/(dashboard)/products/page.tsx",
            lineNumber: 129,
            columnNumber: 12
        }, this);
    }
    const productListTab = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex justify-between items-center mb-4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                        className: "text-lg font-semibold text-slate-800",
                        children: [
                            "All Products (",
                            products.length,
                            ")"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend2.4/app/(dashboard)/products/page.tsx",
                        lineNumber: 141,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        className: "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$plus$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Plus$3e$__["Plus"], {
                                size: 18
                            }, void 0, false, {
                                fileName: "[project]/frontend2.4/app/(dashboard)/products/page.tsx",
                                lineNumber: 145,
                                columnNumber: 11
                            }, this),
                            "Add Product"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend2.4/app/(dashboard)/products/page.tsx",
                        lineNumber: 144,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend2.4/app/(dashboard)/products/page.tsx",
                lineNumber: 140,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$components$2f$products$2f$EditableProductTable$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                products: products,
                onView: handleView,
                onEdit: handleEdit,
                onSave: handleInlineSave,
                tableState: tableState,
                onTableStateChange: setTableState,
                isAdmin: isAdmin
            }, void 0, false, {
                fileName: "[project]/frontend2.4/app/(dashboard)/products/page.tsx",
                lineNumber: 149,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend2.4/app/(dashboard)/products/page.tsx",
        lineNumber: 139,
        columnNumber: 26
    }, this);
    const tabs = [
        {
            id: 'all',
            label: 'All Products',
            content: productListTab,
            closeable: false
        },
        ...editingProducts.map((product_3)=>({
                id: `edit-${product_3.id}`,
                label: product_3.apcPN,
                content: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$components$2f$products$2f$ProductEditTabWithTabs$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                    product: product_3,
                    onSave: handleSave,
                    onCancel: ()=>handleCloseEditTab(product_3.id)
                }, void 0, false, {
                    fileName: "[project]/frontend2.4/app/(dashboard)/products/page.tsx",
                    lineNumber: 159,
                    columnNumber: 14
                }, this),
                closeable: true,
                onClose: ()=>handleCloseEditTab(product_3.id)
            }))
    ];
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "p-6",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                className: "text-2xl font-bold text-slate-800 mb-2",
                children: "Products"
            }, void 0, false, {
                fileName: "[project]/frontend2.4/app/(dashboard)/products/page.tsx",
                lineNumber: 164,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "text-slate-600 mb-6",
                children: "Manage product catalog and specifications"
            }, void 0, false, {
                fileName: "[project]/frontend2.4/app/(dashboard)/products/page.tsx",
                lineNumber: 165,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bg-white rounded-lg shadow",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "p-6",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$components$2f$ui$2f$Tabs$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                        tabs: tabs,
                        activeTab: activeTab,
                        onTabChange: setActiveTab
                    }, void 0, false, {
                        fileName: "[project]/frontend2.4/app/(dashboard)/products/page.tsx",
                        lineNumber: 169,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/frontend2.4/app/(dashboard)/products/page.tsx",
                    lineNumber: 168,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/frontend2.4/app/(dashboard)/products/page.tsx",
                lineNumber: 167,
                columnNumber: 7
            }, this),
            viewProduct && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$components$2f$products$2f$ProductView$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                product: viewProduct,
                onClose: ()=>setViewProduct(null)
            }, void 0, false, {
                fileName: "[project]/frontend2.4/app/(dashboard)/products/page.tsx",
                lineNumber: 173,
                columnNumber: 23
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend2.4/app/(dashboard)/products/page.tsx",
        lineNumber: 163,
        columnNumber: 10
    }, this);
}
_s(ProductsPage, "sme+VXn1BY3xNJdNtOpDaou1DTA=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2d$auth$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSession"]
    ];
});
_c = ProductsPage;
var _c;
__turbopack_context__.k.register(_c, "ProductsPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=frontend2_4_3ea2ffbf._.js.map