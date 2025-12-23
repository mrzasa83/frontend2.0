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
"[project]/frontend2.4/lib/metadata/columnMetadata.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "bomMetadata",
    ()=>bomMetadata,
    "discrepancyMetadata",
    ()=>discrepancyMetadata,
    "inventoryMetadata",
    ()=>inventoryMetadata,
    "productionGeneralMetadata",
    ()=>productionGeneralMetadata,
    "routeMetadata",
    ()=>routeMetadata,
    "whereUsedMetadata",
    ()=>whereUsedMetadata,
    "workOrdersMetadata",
    ()=>workOrdersMetadata
]);
const productionGeneralMetadata = {
    // Hidden/System fields
    RKEY: {
        hidden: true
    },
    internal_id: {
        system: true
    },
    record_id: {
        hidden: true
    },
    created_by: {
        system: true
    },
    modified_by: {
        system: true
    }
};
const bomMetadata = {
    // Hidden/System fields
    BOM_PTR: {
        hidden: true
    },
    INVENTORY_PTR: {
        hidden: true
    },
    component_rkey: {
        hidden: true
    },
    parent_part: {
        hidden: true
    },
    eff_end: {
        hidden: true
    },
    sequence: {
        hidden: true
    },
    bom_header_key: {
        hidden: true
    },
    parent_type: {
        hidden: true
    },
    component_type: {
        system: true
    },
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
    }
};
const whereUsedMetadata = {
    // Hidden/System fields
    RKEY: {
        hidden: true
    },
    internal_id: {
        system: true
    }
};
const routeMetadata = {
    // Hidden/System fields
    RKEY: {
        hidden: true
    },
    internal_id: {
        system: true
    }
};
const workOrdersMetadata = {
    // Hidden/System fields
    RKEY: {
        hidden: true
    },
    internal_id: {
        system: true
    }
};
const inventoryMetadata = {
    // Hidden/System fields
    RKEY: {
        hidden: true
    },
    internal_id: {
        system: true
    }
};
const discrepancyMetadata = {
    // Hidden/System fields
    RKEY: {
        hidden: true
    },
    internal_id: {
        system: true
    }
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend2.4/components/products/ProductEdit.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>ProductEdit
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend2.4/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend2.4/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$save$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Save$3e$__ = __turbopack_context__.i("[project]/frontend2.4/node_modules/lucide-react/dist/esm/icons/save.js [app-client] (ecmascript) <export default as Save>");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__ = __turbopack_context__.i("[project]/frontend2.4/node_modules/lucide-react/dist/esm/icons/x.js [app-client] (ecmascript) <export default as X>");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$package$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Package$3e$__ = __turbopack_context__.i("[project]/frontend2.4/node_modules/lucide-react/dist/esm/icons/package.js [app-client] (ecmascript) <export default as Package>");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$git$2d$branch$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__GitBranch$3e$__ = __turbopack_context__.i("[project]/frontend2.4/node_modules/lucide-react/dist/esm/icons/git-branch.js [app-client] (ecmascript) <export default as GitBranch>");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$route$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Route$3e$__ = __turbopack_context__.i("[project]/frontend2.4/node_modules/lucide-react/dist/esm/icons/route.js [app-client] (ecmascript) <export default as Route>");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clipboard$2d$list$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ClipboardList$3e$__ = __turbopack_context__.i("[project]/frontend2.4/node_modules/lucide-react/dist/esm/icons/clipboard-list.js [app-client] (ecmascript) <export default as ClipboardList>");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$archive$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Archive$3e$__ = __turbopack_context__.i("[project]/frontend2.4/node_modules/lucide-react/dist/esm/icons/archive.js [app-client] (ecmascript) <export default as Archive>");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$triangle$2d$alert$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertTriangle$3e$__ = __turbopack_context__.i("[project]/frontend2.4/node_modules/lucide-react/dist/esm/icons/triangle-alert.js [app-client] (ecmascript) <export default as AlertTriangle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$factory$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Factory$3e$__ = __turbopack_context__.i("[project]/frontend2.4/node_modules/lucide-react/dist/esm/icons/factory.js [app-client] (ecmascript) <export default as Factory>");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$components$2f$ui$2f$Tabs$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend2.4/components/ui/Tabs.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$components$2f$ui$2f$DataView$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend2.4/components/ui/DataView.tsx [app-client] (ecmascript)");
(()=>{
    const e = new Error("Cannot find module '@/components/BOMTreeNavigator'");
    e.code = 'MODULE_NOT_FOUND';
    throw e;
})();
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$lib$2f$metadata$2f$columnMetadata$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend2.4/lib/metadata/columnMetadata.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
;
;
;
function ProductEdit({ product, onSave, onCancel }) {
    _s();
    const [formData, setFormData] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(product);
    const [hasChanges, setHasChanges] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [activeTab, setActiveTab] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('general');
    const [activeProductionTab, setActiveProductionTab] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('prod-general');
    // Production data states
    const [productionGeneralData, setProductionGeneralData] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [loadingProdGeneral, setLoadingProdGeneral] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [prodGeneralError, setProdGeneralError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    // Where Used data states
    const [whereUsedData, setWhereUsedData] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [loadingWhereUsed, setLoadingWhereUsed] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [whereUsedError, setWhereUsedError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    // Route data states
    const [routeData, setRouteData] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [loadingRoute, setLoadingRoute] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [routeError, setRouteError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    // Work Orders data states
    const [workOrdersData, setWorkOrdersData] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [loadingWorkOrders, setLoadingWorkOrders] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [workOrdersError, setWorkOrdersError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    // Inventory data states
    const [inventoryData, setInventoryData] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [loadingInventory, setLoadingInventory] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [inventoryError, setInventoryError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    // Discrepancy data states
    const [discrepancyData, setDiscrepancyData] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [loadingDiscrepancy, setLoadingDiscrepancy] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [discrepancyError, setDiscrepancyError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ProductEdit.useEffect": ()=>{
            // Load production data when Production tab is active
            if (activeTab === 'production') {
                if (activeProductionTab === 'prod-general') {
                    fetchProductionGeneralData();
                }
            // Add other fetch calls as needed when those tabs are clicked
            }
        }
    }["ProductEdit.useEffect"], [
        activeTab,
        activeProductionTab,
        product.apcPN
    ]);
    const fetchProductionGeneralData = async ()=>{
        setLoadingProdGeneral(true);
        setProdGeneralError(null);
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
            setProductionGeneralData(data.results || []);
        } catch (error) {
            console.error('Error fetching production data:', error);
            setProdGeneralError(error instanceof Error ? error.message : 'Failed to load production data');
        } finally{
            setLoadingProdGeneral(false);
        }
    };
    const handleChange = (field, value)=>{
        setFormData((prev)=>({
                ...prev,
                [field]: value
            }));
        setHasChanges(true);
    };
    const handleSave = ()=>{
        onSave(formData);
        setHasChanges(false);
    };
    // Metadata for base (editable) fields
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
            label: 'Customer',
            required: false
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
            hidden: true
        }
    };
    // ========================================
    // TAB 1: GENERAL (Editable)
    // ========================================
    const generalTab = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "space-y-4",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$components$2f$ui$2f$DataView$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                data: [
                    product
                ],
                metadata: baseMetadata,
                mode: "form",
                editable: true,
                onChange: handleChange,
                formData: formData
            }, void 0, false, {
                fileName: "[project]/frontend2.4/components/products/ProductEdit.tsx",
                lineNumber: 158,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bg-blue-50 border border-blue-200 rounded-lg p-4",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    className: "text-sm text-blue-800",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                            children: "Note:"
                        }, void 0, false, {
                            fileName: "[project]/frontend2.4/components/products/ProductEdit.tsx",
                            lineNumber: 162,
                            columnNumber: 11
                        }, this),
                        " General information is editable. Production and Engineering data are read-only."
                    ]
                }, void 0, true, {
                    fileName: "[project]/frontend2.4/components/products/ProductEdit.tsx",
                    lineNumber: 161,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/frontend2.4/components/products/ProductEdit.tsx",
                lineNumber: 160,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend2.4/components/products/ProductEdit.tsx",
        lineNumber: 157,
        columnNumber: 22
    }, this);
    // ========================================
    // TAB 2: PRODUCTION (with vertical sub-tabs)
    // ========================================
    const productionTab = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex h-full gap-6",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "w-48 flex-shrink-0",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("nav", {
                    className: "space-y-1",
                    children: [
                        {
                            id: 'prod-general',
                            label: 'General',
                            icon: __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clipboard$2d$list$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ClipboardList$3e$__["ClipboardList"]
                        },
                        {
                            id: 'prod-bom',
                            label: 'BOM',
                            icon: __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$package$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Package$3e$__["Package"]
                        },
                        {
                            id: 'prod-whereused',
                            label: 'Where Used',
                            icon: __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$git$2d$branch$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__GitBranch$3e$__["GitBranch"]
                        },
                        {
                            id: 'prod-route',
                            label: 'Route',
                            icon: __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$route$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Route$3e$__["Route"]
                        },
                        {
                            id: 'prod-workorders',
                            label: 'Work Orders',
                            icon: __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clipboard$2d$list$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ClipboardList$3e$__["ClipboardList"]
                        },
                        {
                            id: 'prod-inventory',
                            label: 'Inventory',
                            icon: __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$archive$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Archive$3e$__["Archive"]
                        },
                        {
                            id: 'prod-discrepancy',
                            label: 'Discrepancy',
                            icon: __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$triangle$2d$alert$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertTriangle$3e$__["AlertTriangle"]
                        }
                    ].map((tab)=>{
                        const Icon = tab.icon;
                        const isActive = activeProductionTab === tab.id;
                        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: ()=>setActiveProductionTab(tab.id),
                            className: `
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                  ${isActive ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-slate-100'}
                `,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Icon, {
                                    size: 18
                                }, void 0, false, {
                                    fileName: "[project]/frontend2.4/components/products/ProductEdit.tsx",
                                    lineNumber: 209,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "flex-1 text-left",
                                    children: tab.label
                                }, void 0, false, {
                                    fileName: "[project]/frontend2.4/components/products/ProductEdit.tsx",
                                    lineNumber: 210,
                                    columnNumber: 17
                                }, this)
                            ]
                        }, tab.id, true, {
                            fileName: "[project]/frontend2.4/components/products/ProductEdit.tsx",
                            lineNumber: 205,
                            columnNumber: 18
                        }, this);
                    })
                }, void 0, false, {
                    fileName: "[project]/frontend2.4/components/products/ProductEdit.tsx",
                    lineNumber: 173,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/frontend2.4/components/products/ProductEdit.tsx",
                lineNumber: 172,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex-1 min-w-0",
                children: [
                    activeProductionTab === 'prod-general' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$components$2f$ui$2f$DataView$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                        data: productionGeneralData,
                        metadata: __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$lib$2f$metadata$2f$columnMetadata$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["productionGeneralMetadata"],
                        loading: loadingProdGeneral,
                        error: prodGeneralError,
                        emptyMessage: `No production data found for part ${formData.apcPN}`,
                        title: "Production General",
                        subtitle: "Data from data0050 table (read-only)",
                        editable: false
                    }, void 0, false, {
                        fileName: "[project]/frontend2.4/components/products/ProductEdit.tsx",
                        lineNumber: 218,
                        columnNumber: 52
                    }, this),
                    activeProductionTab === 'prod-bom' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(BOMTreeNavigator, {
                        rootPartNumber: formData.apcPN,
                        onPartClick: (partNumber)=>{
                            console.log('Clicked part:', partNumber);
                        // TODO: Navigate to that part or show details
                        }
                    }, void 0, false, {
                        fileName: "[project]/frontend2.4/components/products/ProductEdit.tsx",
                        lineNumber: 220,
                        columnNumber: 48
                    }, this),
                    activeProductionTab === 'prod-whereused' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$components$2f$ui$2f$DataView$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                        data: whereUsedData,
                        metadata: __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$lib$2f$metadata$2f$columnMetadata$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["whereUsedMetadata"],
                        loading: loadingWhereUsed,
                        error: whereUsedError,
                        emptyMessage: `No where-used data found for part ${formData.apcPN}`,
                        title: "Where Used",
                        subtitle: "Parent assemblies (read-only)",
                        editable: false
                    }, void 0, false, {
                        fileName: "[project]/frontend2.4/components/products/ProductEdit.tsx",
                        lineNumber: 225,
                        columnNumber: 54
                    }, this),
                    activeProductionTab === 'prod-route' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$components$2f$ui$2f$DataView$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                        data: routeData,
                        metadata: __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$lib$2f$metadata$2f$columnMetadata$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["routeMetadata"],
                        loading: loadingRoute,
                        error: routeError,
                        emptyMessage: `No route data found for part ${formData.apcPN}`,
                        title: "Route",
                        subtitle: "Manufacturing route (read-only)",
                        editable: false
                    }, void 0, false, {
                        fileName: "[project]/frontend2.4/components/products/ProductEdit.tsx",
                        lineNumber: 227,
                        columnNumber: 50
                    }, this),
                    activeProductionTab === 'prod-workorders' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$components$2f$ui$2f$DataView$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                        data: workOrdersData,
                        metadata: __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$lib$2f$metadata$2f$columnMetadata$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["workOrdersMetadata"],
                        loading: loadingWorkOrders,
                        error: workOrdersError,
                        emptyMessage: `No work orders found for part ${formData.apcPN}`,
                        title: "Work Orders",
                        subtitle: "Work order history (read-only)",
                        editable: false
                    }, void 0, false, {
                        fileName: "[project]/frontend2.4/components/products/ProductEdit.tsx",
                        lineNumber: 229,
                        columnNumber: 55
                    }, this),
                    activeProductionTab === 'prod-inventory' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$components$2f$ui$2f$DataView$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                        data: inventoryData,
                        metadata: __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$lib$2f$metadata$2f$columnMetadata$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["inventoryMetadata"],
                        loading: loadingInventory,
                        error: inventoryError,
                        emptyMessage: `No inventory data found for part ${formData.apcPN}`,
                        title: "Inventory",
                        subtitle: "Inventory levels (read-only)",
                        editable: false
                    }, void 0, false, {
                        fileName: "[project]/frontend2.4/components/products/ProductEdit.tsx",
                        lineNumber: 231,
                        columnNumber: 54
                    }, this),
                    activeProductionTab === 'prod-discrepancy' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$components$2f$ui$2f$DataView$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                        data: discrepancyData,
                        metadata: __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$lib$2f$metadata$2f$columnMetadata$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["discrepancyMetadata"],
                        loading: loadingDiscrepancy,
                        error: discrepancyError,
                        emptyMessage: `No discrepancies found for part ${formData.apcPN}`,
                        title: "Discrepancy",
                        subtitle: "Discrepancy reports (read-only)",
                        editable: false
                    }, void 0, false, {
                        fileName: "[project]/frontend2.4/components/products/ProductEdit.tsx",
                        lineNumber: 233,
                        columnNumber: 56
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend2.4/components/products/ProductEdit.tsx",
                lineNumber: 217,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend2.4/components/products/ProductEdit.tsx",
        lineNumber: 170,
        columnNumber: 25
    }, this);
    // ========================================
    // TAB 3: ENGINEERING (Coming Soon)
    // ========================================
    const engineeringTab = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex flex-col items-center justify-center py-16 text-slate-500",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$factory$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Factory$3e$__["Factory"], {
                size: 64,
                className: "mb-4 opacity-50"
            }, void 0, false, {
                fileName: "[project]/frontend2.4/components/products/ProductEdit.tsx",
                lineNumber: 241,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                className: "text-xl font-semibold mb-2",
                children: "Engineering Data"
            }, void 0, false, {
                fileName: "[project]/frontend2.4/components/products/ProductEdit.tsx",
                lineNumber: 242,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "text-sm",
                children: "Coming soon - provide database details"
            }, void 0, false, {
                fileName: "[project]/frontend2.4/components/products/ProductEdit.tsx",
                lineNumber: 243,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend2.4/components/products/ProductEdit.tsx",
        lineNumber: 240,
        columnNumber: 26
    }, this);
    // Top-level horizontal tabs
    const topLevelTabs = [
        {
            id: 'general',
            label: 'General',
            content: generalTab,
            closeable: false
        },
        {
            id: 'production',
            label: 'Production',
            content: productionTab,
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
        className: "h-full flex flex-col",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center justify-between px-6 py-4 border-b border-slate-200",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                className: "text-lg font-semibold text-slate-800",
                                children: [
                                    "Editing: ",
                                    formData.apcPN
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend2.4/components/products/ProductEdit.tsx",
                                lineNumber: 267,
                                columnNumber: 11
                            }, this),
                            hasChanges && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-sm text-orange-600 mt-1",
                                children: "⚠️ You have unsaved changes"
                            }, void 0, false, {
                                fileName: "[project]/frontend2.4/components/products/ProductEdit.tsx",
                                lineNumber: 270,
                                columnNumber: 26
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend2.4/components/products/ProductEdit.tsx",
                        lineNumber: 266,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex gap-3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: onCancel,
                                className: "px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {
                                        size: 18
                                    }, void 0, false, {
                                        fileName: "[project]/frontend2.4/components/products/ProductEdit.tsx",
                                        lineNumber: 276,
                                        columnNumber: 13
                                    }, this),
                                    "Cancel"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend2.4/components/products/ProductEdit.tsx",
                                lineNumber: 275,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: handleSave,
                                disabled: !hasChanges,
                                className: "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$save$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Save$3e$__["Save"], {
                                        size: 18
                                    }, void 0, false, {
                                        fileName: "[project]/frontend2.4/components/products/ProductEdit.tsx",
                                        lineNumber: 280,
                                        columnNumber: 13
                                    }, this),
                                    "Save Changes"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend2.4/components/products/ProductEdit.tsx",
                                lineNumber: 279,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend2.4/components/products/ProductEdit.tsx",
                        lineNumber: 274,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend2.4/components/products/ProductEdit.tsx",
                lineNumber: 265,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex-1 overflow-auto px-6 py-4",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$components$2f$ui$2f$Tabs$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                    tabs: topLevelTabs,
                    activeTab: activeTab,
                    onTabChange: setActiveTab
                }, void 0, false, {
                    fileName: "[project]/frontend2.4/components/products/ProductEdit.tsx",
                    lineNumber: 288,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/frontend2.4/components/products/ProductEdit.tsx",
                lineNumber: 287,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend2.4/components/products/ProductEdit.tsx",
        lineNumber: 263,
        columnNumber: 10
    }, this);
}
_s(ProductEdit, "QGoQ+I5erSZh9JYGuYe5s1f9vD0=");
_c = ProductEdit;
var _c;
__turbopack_context__.k.register(_c, "ProductEdit");
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
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$components$2f$products$2f$ProductEdit$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend2.4/components/products/ProductEdit.tsx [app-client] (ecmascript)");
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
                        lineNumber: 122,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "h-64 bg-slate-200 rounded"
                    }, void 0, false, {
                        fileName: "[project]/frontend2.4/app/(dashboard)/products/page.tsx",
                        lineNumber: 123,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend2.4/app/(dashboard)/products/page.tsx",
                lineNumber: 121,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/frontend2.4/app/(dashboard)/products/page.tsx",
            lineNumber: 120,
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
                        lineNumber: 130,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-sm",
                        children: error
                    }, void 0, false, {
                        fileName: "[project]/frontend2.4/app/(dashboard)/products/page.tsx",
                        lineNumber: 131,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: fetchProducts,
                        className: "mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700",
                        children: "Retry"
                    }, void 0, false, {
                        fileName: "[project]/frontend2.4/app/(dashboard)/products/page.tsx",
                        lineNumber: 132,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend2.4/app/(dashboard)/products/page.tsx",
                lineNumber: 129,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/frontend2.4/app/(dashboard)/products/page.tsx",
            lineNumber: 128,
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
                        lineNumber: 140,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        className: "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$plus$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Plus$3e$__["Plus"], {
                                size: 18
                            }, void 0, false, {
                                fileName: "[project]/frontend2.4/app/(dashboard)/products/page.tsx",
                                lineNumber: 144,
                                columnNumber: 11
                            }, this),
                            "Add Product"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend2.4/app/(dashboard)/products/page.tsx",
                        lineNumber: 143,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend2.4/app/(dashboard)/products/page.tsx",
                lineNumber: 139,
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
                lineNumber: 148,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend2.4/app/(dashboard)/products/page.tsx",
        lineNumber: 138,
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
                content: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$components$2f$products$2f$ProductEdit$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                    product: product_3,
                    onSave: handleSave,
                    onCancel: ()=>handleCloseEditTab(product_3.id)
                }, void 0, false, {
                    fileName: "[project]/frontend2.4/app/(dashboard)/products/page.tsx",
                    lineNumber: 158,
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
                lineNumber: 163,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "text-slate-600 mb-6",
                children: "Manage product catalog and specifications"
            }, void 0, false, {
                fileName: "[project]/frontend2.4/app/(dashboard)/products/page.tsx",
                lineNumber: 164,
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
                        lineNumber: 168,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/frontend2.4/app/(dashboard)/products/page.tsx",
                    lineNumber: 167,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/frontend2.4/app/(dashboard)/products/page.tsx",
                lineNumber: 166,
                columnNumber: 7
            }, this),
            viewProduct && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$components$2f$products$2f$ProductView$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                product: viewProduct,
                onClose: ()=>setViewProduct(null)
            }, void 0, false, {
                fileName: "[project]/frontend2.4/app/(dashboard)/products/page.tsx",
                lineNumber: 172,
                columnNumber: 23
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend2.4/app/(dashboard)/products/page.tsx",
        lineNumber: 162,
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

//# sourceMappingURL=frontend2_4_eeb92350._.js.map