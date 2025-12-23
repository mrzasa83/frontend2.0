(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/components/ui/Tabs.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>Tabs
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/compiler-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/x.js [app-client] (ecmascript) <export default as X>");
'use client';
;
;
;
function Tabs(t0) {
    const $ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["c"])(20);
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
                "Tabs[tabs.map()]": (tab_1)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: `flex items-center gap-2 px-6 py-3 font-medium text-sm transition-colors relative whitespace-nowrap cursor-pointer ${currentTab === tab_1.id ? "text-blue-600 border-b-2 border-blue-600" : "text-slate-600 hover:text-slate-800"}`,
                        onClick: {
                            "Tabs[tabs.map() > <div>.onClick]": ()=>handleTabClick(tab_1.id)
                        }["Tabs[tabs.map() > <div>.onClick]"],
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: tab_1.label
                            }, void 0, false, {
                                fileName: "[project]/components/ui/Tabs.tsx",
                                lineNumber: 67,
                                columnNumber: 48
                            }, this),
                            tab_1.closeable && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: {
                                    "Tabs[tabs.map() > <button>.onClick]": (e_0)=>handleClose(e_0, tab_1)
                                }["Tabs[tabs.map() > <button>.onClick]"],
                                className: "hover:bg-slate-200 rounded p-0.5 transition-colors",
                                title: "Close tab",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {
                                    size: 14
                                }, void 0, false, {
                                    fileName: "[project]/components/ui/Tabs.tsx",
                                    lineNumber: 69,
                                    columnNumber: 134
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/components/ui/Tabs.tsx",
                                lineNumber: 67,
                                columnNumber: 94
                            }, this)
                        ]
                    }, tab_1.id, true, {
                        fileName: "[project]/components/ui/Tabs.tsx",
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
        t4 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "border-b border-slate-200",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex space-x-1 overflow-x-auto",
                children: t3
            }, void 0, false, {
                fileName: "[project]/components/ui/Tabs.tsx",
                lineNumber: 87,
                columnNumber: 53
            }, this)
        }, void 0, false, {
            fileName: "[project]/components/ui/Tabs.tsx",
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
        t5 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "py-6",
            children: activeContent
        }, void 0, false, {
            fileName: "[project]/components/ui/Tabs.tsx",
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
        t6 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "w-full",
            children: [
                t4,
                t5
            ]
        }, void 0, true, {
            fileName: "[project]/components/ui/Tabs.tsx",
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
"[project]/components/products/ProductTable.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>ProductTable
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/compiler-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$eye$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Eye$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/eye.js [app-client] (ecmascript) <export default as Eye>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$pencil$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Pencil$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/pencil.js [app-client] (ecmascript) <export default as Pencil>");
'use client';
;
;
;
function ProductTable(t0) {
    const $ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["c"])(105);
    if ($[0] !== "c19f2a9c227f2a29615b6cad8e37912f1a1ca3009b673b5c6445535169610562") {
        for(let $i = 0; $i < 105; $i += 1){
            $[$i] = Symbol.for("react.memo_cache_sentinel");
        }
        $[0] = "c19f2a9c227f2a29615b6cad8e37912f1a1ca3009b673b5c6445535169610562";
    }
    const { products, onView, onEdit, tableState, onTableStateChange } = t0;
    const { search, sortKey, sortAsc, pageSize, page, typeFilter } = tableState;
    let t1;
    if ($[1] !== onTableStateChange || $[2] !== tableState) {
        t1 = ({
            "ProductTable[updateState]": (updates)=>{
                onTableStateChange({
                    ...tableState,
                    ...updates
                });
            }
        })["ProductTable[updateState]"];
        $[1] = onTableStateChange;
        $[2] = tableState;
        $[3] = t1;
    } else {
        t1 = $[3];
    }
    const updateState = t1;
    let filtered;
    let paginated;
    let t2;
    let t3;
    let t4;
    let t5;
    let t6;
    let totalPages;
    if ($[4] !== onEdit || $[5] !== onView || $[6] !== page || $[7] !== pageSize || $[8] !== products || $[9] !== search || $[10] !== sortAsc || $[11] !== sortKey || $[12] !== typeFilter || $[13] !== updateState) {
        const productTypes = Array.from(new Set(products.map(_ProductTableProductsMap).filter(Boolean))).sort();
        let t7;
        if ($[22] !== search || $[23] !== typeFilter) {
            t7 = ({
                "ProductTable[products.filter()]": (p_0)=>{
                    const matchesSearch = p_0.apcPN.toLowerCase().includes(search.toLowerCase()) || p_0.customer?.toLowerCase().includes(search.toLowerCase()) || p_0.customerPN?.toLowerCase().includes(search.toLowerCase()) || p_0.description?.toLowerCase().includes(search.toLowerCase());
                    const matchesType = !typeFilter || typeFilter === "all" || p_0.item_type_name === typeFilter;
                    return matchesSearch && matchesType;
                }
            })["ProductTable[products.filter()]"];
            $[22] = search;
            $[23] = typeFilter;
            $[24] = t7;
        } else {
            t7 = $[24];
        }
        filtered = products.filter(t7);
        let t8;
        if ($[25] !== sortAsc || $[26] !== sortKey) {
            t8 = ({
                "ProductTable[(anonymous)()]": (a, b)=>{
                    const valA = a[sortKey] || "";
                    const valB = b[sortKey] || "";
                    return sortAsc ? String(valA).localeCompare(String(valB)) : String(valB).localeCompare(String(valA));
                }
            })["ProductTable[(anonymous)()]"];
            $[25] = sortAsc;
            $[26] = sortKey;
            $[27] = t8;
        } else {
            t8 = $[27];
        }
        const sorted = [
            ...filtered
        ].sort(t8);
        paginated = sorted.slice(page * pageSize, (page + 1) * pageSize);
        totalPages = Math.ceil(filtered.length / pageSize);
        let t9;
        if ($[28] !== updateState) {
            t9 = ({
                "ProductTable[<input>.onChange]": (e)=>updateState({
                        search: e.target.value,
                        page: 0
                    })
            })["ProductTable[<input>.onChange]"];
            $[28] = updateState;
            $[29] = t9;
        } else {
            t9 = $[29];
        }
        let t10;
        if ($[30] !== search || $[31] !== t9) {
            t10 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                type: "text",
                placeholder: "Search products...",
                value: search,
                onChange: t9,
                className: "border border-slate-300 px-3 py-2 rounded-lg flex-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            }, void 0, false, {
                fileName: "[project]/components/products/ProductTable.tsx",
                lineNumber: 130,
                columnNumber: 13
            }, this);
            $[30] = search;
            $[31] = t9;
            $[32] = t10;
        } else {
            t10 = $[32];
        }
        const t11 = typeFilter || "all";
        let t12;
        if ($[33] !== updateState) {
            t12 = ({
                "ProductTable[<select>.onChange]": (e_0)=>updateState({
                        typeFilter: e_0.target.value,
                        page: 0
                    })
            })["ProductTable[<select>.onChange]"];
            $[33] = updateState;
            $[34] = t12;
        } else {
            t12 = $[34];
        }
        let t13;
        if ($[35] === Symbol.for("react.memo_cache_sentinel")) {
            t13 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                value: "all",
                children: "All Types"
            }, void 0, false, {
                fileName: "[project]/components/products/ProductTable.tsx",
                lineNumber: 153,
                columnNumber: 13
            }, this);
            $[35] = t13;
        } else {
            t13 = $[35];
        }
        const t14 = productTypes.map(_ProductTableProductTypesMap);
        let t15;
        if ($[36] !== t11 || $[37] !== t12 || $[38] !== t14) {
            t15 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                value: t11,
                onChange: t12,
                className: "border border-slate-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none",
                children: [
                    t13,
                    t14
                ]
            }, void 0, true, {
                fileName: "[project]/components/products/ProductTable.tsx",
                lineNumber: 161,
                columnNumber: 13
            }, this);
            $[36] = t11;
            $[37] = t12;
            $[38] = t14;
            $[39] = t15;
        } else {
            t15 = $[39];
        }
        let t16;
        if ($[40] !== updateState) {
            t16 = ({
                "ProductTable[<select>.onChange]": (e_1)=>updateState({
                        pageSize: Number(e_1.target.value),
                        page: 0
                    })
            })["ProductTable[<select>.onChange]"];
            $[40] = updateState;
            $[41] = t16;
        } else {
            t16 = $[41];
        }
        let t17;
        if ($[42] === Symbol.for("react.memo_cache_sentinel")) {
            t17 = [
                25,
                50,
                100,
                250
            ].map(_ProductTableAnonymous);
            $[42] = t17;
        } else {
            t17 = $[42];
        }
        let t18;
        if ($[43] !== pageSize || $[44] !== t16) {
            t18 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                value: pageSize,
                onChange: t16,
                className: "border border-slate-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none",
                children: t17
            }, void 0, false, {
                fileName: "[project]/components/products/ProductTable.tsx",
                lineNumber: 191,
                columnNumber: 13
            }, this);
            $[43] = pageSize;
            $[44] = t16;
            $[45] = t18;
        } else {
            t18 = $[45];
        }
        if ($[46] !== t10 || $[47] !== t15 || $[48] !== t18) {
            t6 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex justify-between items-center mb-4 gap-4",
                children: [
                    t10,
                    t15,
                    t18
                ]
            }, void 0, true, {
                fileName: "[project]/components/products/ProductTable.tsx",
                lineNumber: 199,
                columnNumber: 12
            }, this);
            $[46] = t10;
            $[47] = t15;
            $[48] = t18;
            $[49] = t6;
        } else {
            t6 = $[49];
        }
        t5 = "border border-slate-200 rounded-lg overflow-hidden";
        t3 = "w-full";
        let t19;
        if ($[50] === Symbol.for("react.memo_cache_sentinel")) {
            t19 = [
                {
                    key: "apcPN",
                    label: "Part Number"
                },
                {
                    key: "item_type_name",
                    label: "Type"
                },
                {
                    key: "customer",
                    label: "Customer"
                },
                {
                    key: "customerPN",
                    label: "Customer PN"
                },
                {
                    key: "currentRev",
                    label: "Part Rev"
                }
            ];
            $[50] = t19;
        } else {
            t19 = $[50];
        }
        let t20;
        if ($[51] !== sortAsc || $[52] !== sortKey || $[53] !== updateState) {
            t20 = t19.map({
                "ProductTable[(anonymous)()]": (t21)=>{
                    const { key, label } = t21;
                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                        className: "text-left px-4 py-3 cursor-pointer hover:bg-slate-200 transition-colors font-medium text-sm text-slate-700",
                        onClick: {
                            "ProductTable[(anonymous)() > <th>.onClick]": ()=>key === sortKey ? updateState({
                                    sortAsc: !sortAsc
                                }) : updateState({
                                    sortKey: key
                                })
                        }["ProductTable[(anonymous)() > <th>.onClick]"],
                        children: [
                            label,
                            sortKey === key && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "ml-1",
                                children: sortAsc ? "\u25B2" : "\u25BC"
                            }, void 0, false, {
                                fileName: "[project]/components/products/ProductTable.tsx",
                                lineNumber: 245,
                                columnNumber: 87
                            }, this)
                        ]
                    }, key, true, {
                        fileName: "[project]/components/products/ProductTable.tsx",
                        lineNumber: 239,
                        columnNumber: 18
                    }, this);
                }
            }["ProductTable[(anonymous)()]"]);
            $[51] = sortAsc;
            $[52] = sortKey;
            $[53] = updateState;
            $[54] = t20;
        } else {
            t20 = $[54];
        }
        let t21;
        if ($[55] === Symbol.for("react.memo_cache_sentinel")) {
            t21 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                className: "text-left px-4 py-3 font-medium text-sm text-slate-700",
                children: "Actions"
            }, void 0, false, {
                fileName: "[project]/components/products/ProductTable.tsx",
                lineNumber: 257,
                columnNumber: 13
            }, this);
            $[55] = t21;
        } else {
            t21 = $[55];
        }
        if ($[56] !== t20) {
            t4 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("thead", {
                className: "bg-slate-100",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                    children: [
                        t20,
                        t21
                    ]
                }, void 0, true, {
                    fileName: "[project]/components/products/ProductTable.tsx",
                    lineNumber: 263,
                    columnNumber: 44
                }, this)
            }, void 0, false, {
                fileName: "[project]/components/products/ProductTable.tsx",
                lineNumber: 263,
                columnNumber: 12
            }, this);
            $[56] = t20;
            $[57] = t4;
        } else {
            t4 = $[57];
        }
        let t22;
        if ($[58] !== onEdit || $[59] !== onView) {
            t22 = ({
                "ProductTable[paginated.map()]": (product)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                        className: "border-t border-slate-200 hover:bg-slate-50 transition-colors",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                className: "px-4 py-3 font-mono text-sm font-semibold",
                                children: product.apcPN
                            }, void 0, false, {
                                fileName: "[project]/components/products/ProductTable.tsx",
                                lineNumber: 272,
                                columnNumber: 148
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                className: "px-4 py-3 text-sm",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs",
                                    children: product.item_type_name || "Unknown"
                                }, void 0, false, {
                                    fileName: "[project]/components/products/ProductTable.tsx",
                                    lineNumber: 272,
                                    columnNumber: 260
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/components/products/ProductTable.tsx",
                                lineNumber: 272,
                                columnNumber: 226
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                className: "px-4 py-3 text-sm",
                                children: product.customer || "-"
                            }, void 0, false, {
                                fileName: "[project]/components/products/ProductTable.tsx",
                                lineNumber: 272,
                                columnNumber: 379
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                className: "px-4 py-3 text-sm font-mono max-w-xs truncate",
                                children: product.customerPN || "-"
                            }, void 0, false, {
                                fileName: "[project]/components/products/ProductTable.tsx",
                                lineNumber: 272,
                                columnNumber: 443
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                className: "px-4 py-3 text-sm",
                                children: product.currentRev || "-"
                            }, void 0, false, {
                                fileName: "[project]/components/products/ProductTable.tsx",
                                lineNumber: 272,
                                columnNumber: 537
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                className: "px-4 py-3",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex gap-2",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            onClick: {
                                                "ProductTable[paginated.map() > <button>.onClick]": ()=>onView(product)
                                            }["ProductTable[paginated.map() > <button>.onClick]"],
                                            className: "p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors",
                                            title: "View Product",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$eye$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Eye$3e$__["Eye"], {
                                                size: 18
                                            }, void 0, false, {
                                                fileName: "[project]/components/products/ProductTable.tsx",
                                                lineNumber: 274,
                                                columnNumber: 164
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/components/products/ProductTable.tsx",
                                            lineNumber: 272,
                                            columnNumber: 657
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            onClick: {
                                                "ProductTable[paginated.map() > <button>.onClick]": ()=>onEdit(product)
                                            }["ProductTable[paginated.map() > <button>.onClick]"],
                                            className: "p-2 text-green-600 hover:bg-green-50 rounded transition-colors",
                                            title: "Edit Product",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$pencil$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Pencil$3e$__["Pencil"], {
                                                size: 18
                                            }, void 0, false, {
                                                fileName: "[project]/components/products/ProductTable.tsx",
                                                lineNumber: 276,
                                                columnNumber: 166
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/components/products/ProductTable.tsx",
                                            lineNumber: 274,
                                            columnNumber: 190
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/components/products/ProductTable.tsx",
                                    lineNumber: 272,
                                    columnNumber: 629
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/components/products/ProductTable.tsx",
                                lineNumber: 272,
                                columnNumber: 603
                            }, this)
                        ]
                    }, product.id, true, {
                        fileName: "[project]/components/products/ProductTable.tsx",
                        lineNumber: 272,
                        columnNumber: 53
                    }, this)
            })["ProductTable[paginated.map()]"];
            $[58] = onEdit;
            $[59] = onView;
            $[60] = t22;
        } else {
            t22 = $[60];
        }
        t2 = paginated.map(t22);
        $[4] = onEdit;
        $[5] = onView;
        $[6] = page;
        $[7] = pageSize;
        $[8] = products;
        $[9] = search;
        $[10] = sortAsc;
        $[11] = sortKey;
        $[12] = typeFilter;
        $[13] = updateState;
        $[14] = filtered;
        $[15] = paginated;
        $[16] = t2;
        $[17] = t3;
        $[18] = t4;
        $[19] = t5;
        $[20] = t6;
        $[21] = totalPages;
    } else {
        filtered = $[14];
        paginated = $[15];
        t2 = $[16];
        t3 = $[17];
        t4 = $[18];
        t5 = $[19];
        t6 = $[20];
        totalPages = $[21];
    }
    let t7;
    if ($[61] !== t2) {
        t7 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
            children: t2
        }, void 0, false, {
            fileName: "[project]/components/products/ProductTable.tsx",
            lineNumber: 315,
            columnNumber: 10
        }, this);
        $[61] = t2;
        $[62] = t7;
    } else {
        t7 = $[62];
    }
    let t8;
    if ($[63] !== t3 || $[64] !== t4 || $[65] !== t7) {
        t8 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
            className: t3,
            children: [
                t4,
                t7
            ]
        }, void 0, true, {
            fileName: "[project]/components/products/ProductTable.tsx",
            lineNumber: 323,
            columnNumber: 10
        }, this);
        $[63] = t3;
        $[64] = t4;
        $[65] = t7;
        $[66] = t8;
    } else {
        t8 = $[66];
    }
    let t9;
    if ($[67] !== t5 || $[68] !== t8) {
        t9 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: t5,
            children: t8
        }, void 0, false, {
            fileName: "[project]/components/products/ProductTable.tsx",
            lineNumber: 333,
            columnNumber: 10
        }, this);
        $[67] = t5;
        $[68] = t8;
        $[69] = t9;
    } else {
        t9 = $[69];
    }
    const t10 = typeFilter && typeFilter !== "all" && ` (filtered by ${typeFilter})`;
    let t11;
    if ($[70] !== filtered.length || $[71] !== paginated.length || $[72] !== t10) {
        t11 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
            className: "text-sm text-slate-500",
            children: [
                "Showing ",
                paginated.length,
                " of ",
                filtered.length,
                " products",
                t10
            ]
        }, void 0, true, {
            fileName: "[project]/components/products/ProductTable.tsx",
            lineNumber: 343,
            columnNumber: 11
        }, this);
        $[70] = filtered.length;
        $[71] = paginated.length;
        $[72] = t10;
        $[73] = t11;
    } else {
        t11 = $[73];
    }
    let t12;
    if ($[74] !== page || $[75] !== updateState) {
        t12 = ({
            "ProductTable[<button>.onClick]": ()=>updateState({
                    page: Math.max(0, page - 1)
                })
        })["ProductTable[<button>.onClick]"];
        $[74] = page;
        $[75] = updateState;
        $[76] = t12;
    } else {
        t12 = $[76];
    }
    const t13 = page === 0;
    let t14;
    if ($[77] !== t12 || $[78] !== t13) {
        t14 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
            onClick: t12,
            disabled: t13,
            className: "px-3 py-1 rounded bg-slate-200 hover:bg-slate-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm",
            children: "Previous"
        }, void 0, false, {
            fileName: "[project]/components/products/ProductTable.tsx",
            lineNumber: 367,
            columnNumber: 11
        }, this);
        $[77] = t12;
        $[78] = t13;
        $[79] = t14;
    } else {
        t14 = $[79];
    }
    let t15;
    if ($[80] !== totalPages) {
        t15 = Array.from({
            length: Math.min(5, totalPages)
        });
        $[80] = totalPages;
        $[81] = t15;
    } else {
        t15 = $[81];
    }
    let t16;
    if ($[82] !== page || $[83] !== t15 || $[84] !== totalPages || $[85] !== updateState) {
        t16 = t15.map({
            "ProductTable[(anonymous)()]": (_, i)=>{
                const pageNum = page < 3 ? i : page - 2 + i;
                if (pageNum >= totalPages) {
                    return null;
                }
                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                    onClick: {
                        "ProductTable[(anonymous)() > <button>.onClick]": ()=>updateState({
                                page: pageNum
                            })
                    }["ProductTable[(anonymous)() > <button>.onClick]"],
                    className: `px-3 py-1 rounded text-sm ${pageNum === page ? "bg-slate-800 text-white" : "bg-slate-200 hover:bg-slate-300"}`,
                    children: pageNum + 1
                }, pageNum, false, {
                    fileName: "[project]/components/products/ProductTable.tsx",
                    lineNumber: 392,
                    columnNumber: 16
                }, this);
            }
        }["ProductTable[(anonymous)()]"]);
        $[82] = page;
        $[83] = t15;
        $[84] = totalPages;
        $[85] = updateState;
        $[86] = t16;
    } else {
        t16 = $[86];
    }
    let t17;
    if ($[87] !== page || $[88] !== totalPages || $[89] !== updateState) {
        t17 = ({
            "ProductTable[<button>.onClick]": ()=>updateState({
                    page: Math.min(totalPages - 1, page + 1)
                })
        })["ProductTable[<button>.onClick]"];
        $[87] = page;
        $[88] = totalPages;
        $[89] = updateState;
        $[90] = t17;
    } else {
        t17 = $[90];
    }
    const t18 = page >= totalPages - 1;
    let t19;
    if ($[91] !== t17 || $[92] !== t18) {
        t19 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
            onClick: t17,
            disabled: t18,
            className: "px-3 py-1 rounded bg-slate-200 hover:bg-slate-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm",
            children: "Next"
        }, void 0, false, {
            fileName: "[project]/components/products/ProductTable.tsx",
            lineNumber: 424,
            columnNumber: 11
        }, this);
        $[91] = t17;
        $[92] = t18;
        $[93] = t19;
    } else {
        t19 = $[93];
    }
    let t20;
    if ($[94] !== t14 || $[95] !== t16 || $[96] !== t19) {
        t20 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex gap-1",
            children: [
                t14,
                t16,
                t19
            ]
        }, void 0, true, {
            fileName: "[project]/components/products/ProductTable.tsx",
            lineNumber: 433,
            columnNumber: 11
        }, this);
        $[94] = t14;
        $[95] = t16;
        $[96] = t19;
        $[97] = t20;
    } else {
        t20 = $[97];
    }
    let t21;
    if ($[98] !== t11 || $[99] !== t20) {
        t21 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex justify-between items-center mt-4",
            children: [
                t11,
                t20
            ]
        }, void 0, true, {
            fileName: "[project]/components/products/ProductTable.tsx",
            lineNumber: 443,
            columnNumber: 11
        }, this);
        $[98] = t11;
        $[99] = t20;
        $[100] = t21;
    } else {
        t21 = $[100];
    }
    let t22;
    if ($[101] !== t21 || $[102] !== t6 || $[103] !== t9) {
        t22 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            children: [
                t6,
                t9,
                t21
            ]
        }, void 0, true, {
            fileName: "[project]/components/products/ProductTable.tsx",
            lineNumber: 452,
            columnNumber: 11
        }, this);
        $[101] = t21;
        $[102] = t6;
        $[103] = t9;
        $[104] = t22;
    } else {
        t22 = $[104];
    }
    return t22;
}
_c = ProductTable;
function _ProductTableAnonymous(size) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
        value: size,
        children: [
            "Show ",
            size
        ]
    }, size, true, {
        fileName: "[project]/components/products/ProductTable.tsx",
        lineNumber: 463,
        columnNumber: 10
    }, this);
}
function _ProductTableProductTypesMap(type) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
        value: type,
        children: type
    }, type, false, {
        fileName: "[project]/components/products/ProductTable.tsx",
        lineNumber: 466,
        columnNumber: 10
    }, this);
}
function _ProductTableProductsMap(p) {
    return p.item_type_name;
}
var _c;
__turbopack_context__.k.register(_c, "ProductTable");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/products/ProductView.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>ProductView
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/compiler-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/x.js [app-client] (ecmascript) <export default as X>");
'use client';
;
;
;
function ProductView(t0) {
    const $ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["c"])(50);
    if ($[0] !== "50e2c25b75e65279a40d993d49ae6e5b37c9a4d394ab67aaa6de5afc2d8aab54") {
        for(let $i = 0; $i < 50; $i += 1){
            $[$i] = Symbol.for("react.memo_cache_sentinel");
        }
        $[0] = "50e2c25b75e65279a40d993d49ae6e5b37c9a4d394ab67aaa6de5afc2d8aab54";
    }
    const { product, onClose } = t0;
    let t1;
    if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
        t1 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                    className: "text-2xl font-bold text-slate-800",
                    children: "View Product"
                }, void 0, false, {
                    fileName: "[project]/components/products/ProductView.tsx",
                    lineNumber: 36,
                    columnNumber: 15
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    className: "text-sm text-slate-600 mt-1",
                    children: "Product information (read-only)"
                }, void 0, false, {
                    fileName: "[project]/components/products/ProductView.tsx",
                    lineNumber: 36,
                    columnNumber: 82
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/components/products/ProductView.tsx",
            lineNumber: 36,
            columnNumber: 10
        }, this);
        $[1] = t1;
    } else {
        t1 = $[1];
    }
    let t2;
    if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
        t2 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {
            size: 24,
            className: "text-slate-600"
        }, void 0, false, {
            fileName: "[project]/components/products/ProductView.tsx",
            lineNumber: 43,
            columnNumber: 10
        }, this);
        $[2] = t2;
    } else {
        t2 = $[2];
    }
    let t3;
    if ($[3] !== onClose) {
        t3 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex items-center justify-between p-6 border-b border-slate-200",
            children: [
                t1,
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                    onClick: onClose,
                    className: "p-2 hover:bg-slate-100 rounded-lg transition-colors",
                    children: t2
                }, void 0, false, {
                    fileName: "[project]/components/products/ProductView.tsx",
                    lineNumber: 50,
                    columnNumber: 95
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/components/products/ProductView.tsx",
            lineNumber: 50,
            columnNumber: 10
        }, this);
        $[3] = onClose;
        $[4] = t3;
    } else {
        t3 = $[4];
    }
    let t4;
    if ($[5] === Symbol.for("react.memo_cache_sentinel")) {
        t4 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
            className: "block text-sm font-medium text-slate-700 mb-1",
            children: "APC Part Number"
        }, void 0, false, {
            fileName: "[project]/components/products/ProductView.tsx",
            lineNumber: 58,
            columnNumber: 10
        }, this);
        $[5] = t4;
    } else {
        t4 = $[5];
    }
    let t5;
    if ($[6] !== product.apcPN) {
        t5 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            children: [
                t4,
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                    type: "text",
                    value: product.apcPN,
                    readOnly: true,
                    className: "w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 cursor-not-allowed text-sm"
                }, void 0, false, {
                    fileName: "[project]/components/products/ProductView.tsx",
                    lineNumber: 65,
                    columnNumber: 19
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/components/products/ProductView.tsx",
            lineNumber: 65,
            columnNumber: 10
        }, this);
        $[6] = product.apcPN;
        $[7] = t5;
    } else {
        t5 = $[7];
    }
    let t6;
    if ($[8] === Symbol.for("react.memo_cache_sentinel")) {
        t6 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
            className: "block text-sm font-medium text-slate-700 mb-1",
            children: "Type"
        }, void 0, false, {
            fileName: "[project]/components/products/ProductView.tsx",
            lineNumber: 73,
            columnNumber: 10
        }, this);
        $[8] = t6;
    } else {
        t6 = $[8];
    }
    const t7 = product.item_type_name || "Unknown";
    let t8;
    if ($[9] !== t7) {
        t8 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            children: [
                t6,
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                    type: "text",
                    value: t7,
                    readOnly: true,
                    className: "w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 cursor-not-allowed text-sm"
                }, void 0, false, {
                    fileName: "[project]/components/products/ProductView.tsx",
                    lineNumber: 81,
                    columnNumber: 19
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/components/products/ProductView.tsx",
            lineNumber: 81,
            columnNumber: 10
        }, this);
        $[9] = t7;
        $[10] = t8;
    } else {
        t8 = $[10];
    }
    let t9;
    if ($[11] === Symbol.for("react.memo_cache_sentinel")) {
        t9 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
            className: "block text-sm font-medium text-slate-700 mb-1",
            children: "Customer Part Number"
        }, void 0, false, {
            fileName: "[project]/components/products/ProductView.tsx",
            lineNumber: 89,
            columnNumber: 10
        }, this);
        $[11] = t9;
    } else {
        t9 = $[11];
    }
    const t10 = product.customerPN || "-";
    let t11;
    if ($[12] !== t10) {
        t11 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            children: [
                t9,
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                    type: "text",
                    value: t10,
                    readOnly: true,
                    className: "w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 cursor-not-allowed text-sm"
                }, void 0, false, {
                    fileName: "[project]/components/products/ProductView.tsx",
                    lineNumber: 97,
                    columnNumber: 20
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/components/products/ProductView.tsx",
            lineNumber: 97,
            columnNumber: 11
        }, this);
        $[12] = t10;
        $[13] = t11;
    } else {
        t11 = $[13];
    }
    let t12;
    if ($[14] === Symbol.for("react.memo_cache_sentinel")) {
        t12 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
            className: "block text-sm font-medium text-slate-700 mb-1",
            children: "Customer"
        }, void 0, false, {
            fileName: "[project]/components/products/ProductView.tsx",
            lineNumber: 105,
            columnNumber: 11
        }, this);
        $[14] = t12;
    } else {
        t12 = $[14];
    }
    const t13 = product.customer || "-";
    let t14;
    if ($[15] !== t13) {
        t14 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            children: [
                t12,
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                    type: "text",
                    value: t13,
                    readOnly: true,
                    className: "w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 cursor-not-allowed text-sm"
                }, void 0, false, {
                    fileName: "[project]/components/products/ProductView.tsx",
                    lineNumber: 113,
                    columnNumber: 21
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/components/products/ProductView.tsx",
            lineNumber: 113,
            columnNumber: 11
        }, this);
        $[15] = t13;
        $[16] = t14;
    } else {
        t14 = $[16];
    }
    let t15;
    if ($[17] === Symbol.for("react.memo_cache_sentinel")) {
        t15 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
            className: "block text-sm font-medium text-slate-700 mb-1",
            children: "Part Revision"
        }, void 0, false, {
            fileName: "[project]/components/products/ProductView.tsx",
            lineNumber: 121,
            columnNumber: 11
        }, this);
        $[17] = t15;
    } else {
        t15 = $[17];
    }
    const t16 = product.currentRev || "-";
    let t17;
    if ($[18] !== t16) {
        t17 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            children: [
                t15,
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                    type: "text",
                    value: t16,
                    readOnly: true,
                    className: "w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 cursor-not-allowed text-sm"
                }, void 0, false, {
                    fileName: "[project]/components/products/ProductView.tsx",
                    lineNumber: 129,
                    columnNumber: 21
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/components/products/ProductView.tsx",
            lineNumber: 129,
            columnNumber: 11
        }, this);
        $[18] = t16;
        $[19] = t17;
    } else {
        t17 = $[19];
    }
    let t18;
    if ($[20] === Symbol.for("react.memo_cache_sentinel")) {
        t18 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
            className: "block text-sm font-medium text-slate-700 mb-1",
            children: "Build Revision"
        }, void 0, false, {
            fileName: "[project]/components/products/ProductView.tsx",
            lineNumber: 137,
            columnNumber: 11
        }, this);
        $[20] = t18;
    } else {
        t18 = $[20];
    }
    const t19 = product.buildRev || "-";
    let t20;
    if ($[21] !== t19) {
        t20 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            children: [
                t18,
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                    type: "text",
                    value: t19,
                    readOnly: true,
                    className: "w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 cursor-not-allowed text-sm"
                }, void 0, false, {
                    fileName: "[project]/components/products/ProductView.tsx",
                    lineNumber: 145,
                    columnNumber: 21
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/components/products/ProductView.tsx",
            lineNumber: 145,
            columnNumber: 11
        }, this);
        $[21] = t19;
        $[22] = t20;
    } else {
        t20 = $[22];
    }
    let t21;
    if ($[23] === Symbol.for("react.memo_cache_sentinel")) {
        t21 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
            className: "block text-sm font-medium text-slate-700 mb-1",
            children: "Description"
        }, void 0, false, {
            fileName: "[project]/components/products/ProductView.tsx",
            lineNumber: 153,
            columnNumber: 11
        }, this);
        $[23] = t21;
    } else {
        t21 = $[23];
    }
    const t22 = product.description || "-";
    let t23;
    if ($[24] !== t22) {
        t23 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "col-span-2",
            children: [
                t21,
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                    value: t22,
                    readOnly: true,
                    rows: 3,
                    className: "w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 cursor-not-allowed text-sm"
                }, void 0, false, {
                    fileName: "[project]/components/products/ProductView.tsx",
                    lineNumber: 161,
                    columnNumber: 44
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/components/products/ProductView.tsx",
            lineNumber: 161,
            columnNumber: 11
        }, this);
        $[24] = t22;
        $[25] = t23;
    } else {
        t23 = $[25];
    }
    let t24;
    if ($[26] === Symbol.for("react.memo_cache_sentinel")) {
        t24 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
            className: "block text-sm font-medium text-slate-700 mb-1",
            children: "Full Path"
        }, void 0, false, {
            fileName: "[project]/components/products/ProductView.tsx",
            lineNumber: 169,
            columnNumber: 11
        }, this);
        $[26] = t24;
    } else {
        t24 = $[26];
    }
    const t25 = product.fullPath || "-";
    let t26;
    if ($[27] !== t25) {
        t26 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "col-span-2",
            children: [
                t24,
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                    type: "text",
                    value: t25,
                    readOnly: true,
                    className: "w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 cursor-not-allowed text-sm"
                }, void 0, false, {
                    fileName: "[project]/components/products/ProductView.tsx",
                    lineNumber: 177,
                    columnNumber: 44
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/components/products/ProductView.tsx",
            lineNumber: 177,
            columnNumber: 11
        }, this);
        $[27] = t25;
        $[28] = t26;
    } else {
        t26 = $[28];
    }
    let t27;
    if ($[29] === Symbol.for("react.memo_cache_sentinel")) {
        t27 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
            className: "block text-sm font-medium text-slate-700 mb-1",
            children: "Created At"
        }, void 0, false, {
            fileName: "[project]/components/products/ProductView.tsx",
            lineNumber: 185,
            columnNumber: 11
        }, this);
        $[29] = t27;
    } else {
        t27 = $[29];
    }
    let t28;
    if ($[30] !== product.createdAt) {
        t28 = new Date(product.createdAt).toLocaleString();
        $[30] = product.createdAt;
        $[31] = t28;
    } else {
        t28 = $[31];
    }
    let t29;
    if ($[32] !== t28) {
        t29 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            children: [
                t27,
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                    type: "text",
                    value: t28,
                    readOnly: true,
                    className: "w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 cursor-not-allowed text-sm"
                }, void 0, false, {
                    fileName: "[project]/components/products/ProductView.tsx",
                    lineNumber: 200,
                    columnNumber: 21
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/components/products/ProductView.tsx",
            lineNumber: 200,
            columnNumber: 11
        }, this);
        $[32] = t28;
        $[33] = t29;
    } else {
        t29 = $[33];
    }
    let t30;
    if ($[34] !== t11 || $[35] !== t14 || $[36] !== t17 || $[37] !== t20 || $[38] !== t23 || $[39] !== t26 || $[40] !== t29 || $[41] !== t5 || $[42] !== t8) {
        t30 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex-1 overflow-auto p-6",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "space-y-4",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "grid grid-cols-2 gap-4",
                    children: [
                        t5,
                        t8,
                        t11,
                        t14,
                        t17,
                        t20,
                        t23,
                        t26,
                        t29
                    ]
                }, void 0, true, {
                    fileName: "[project]/components/products/ProductView.tsx",
                    lineNumber: 208,
                    columnNumber: 80
                }, this)
            }, void 0, false, {
                fileName: "[project]/components/products/ProductView.tsx",
                lineNumber: 208,
                columnNumber: 53
            }, this)
        }, void 0, false, {
            fileName: "[project]/components/products/ProductView.tsx",
            lineNumber: 208,
            columnNumber: 11
        }, this);
        $[34] = t11;
        $[35] = t14;
        $[36] = t17;
        $[37] = t20;
        $[38] = t23;
        $[39] = t26;
        $[40] = t29;
        $[41] = t5;
        $[42] = t8;
        $[43] = t30;
    } else {
        t30 = $[43];
    }
    let t31;
    if ($[44] !== onClose) {
        t31 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex items-center justify-end gap-3 p-6 border-t border-slate-200",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                onClick: onClose,
                className: "px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors",
                children: "Close"
            }, void 0, false, {
                fileName: "[project]/components/products/ProductView.tsx",
                lineNumber: 224,
                columnNumber: 94
            }, this)
        }, void 0, false, {
            fileName: "[project]/components/products/ProductView.tsx",
            lineNumber: 224,
            columnNumber: 11
        }, this);
        $[44] = onClose;
        $[45] = t31;
    } else {
        t31 = $[45];
    }
    let t32;
    if ($[46] !== t3 || $[47] !== t30 || $[48] !== t31) {
        t32 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col",
                children: [
                    t3,
                    t30,
                    t31
                ]
            }, void 0, true, {
                fileName: "[project]/components/products/ProductView.tsx",
                lineNumber: 232,
                columnNumber: 103
            }, this)
        }, void 0, false, {
            fileName: "[project]/components/products/ProductView.tsx",
            lineNumber: 232,
            columnNumber: 11
        }, this);
        $[46] = t3;
        $[47] = t30;
        $[48] = t31;
        $[49] = t32;
    } else {
        t32 = $[49];
    }
    return t32;
}
_c = ProductView;
var _c;
__turbopack_context__.k.register(_c, "ProductView");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/products/ProductEditTab.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>ProductEditTab
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/compiler-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$save$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Save$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/save.js [app-client] (ecmascript) <export default as Save>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/x.js [app-client] (ecmascript) <export default as X>");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
function ProductEditTab(t0) {
    _s();
    const $ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["c"])(70);
    if ($[0] !== "45992dd5de649165534fe5288884458798d070ab02008e10d41d72e4f35c4c3f") {
        for(let $i = 0; $i < 70; $i += 1){
            $[$i] = Symbol.for("react.memo_cache_sentinel");
        }
        $[0] = "45992dd5de649165534fe5288884458798d070ab02008e10d41d72e4f35c4c3f";
    }
    const { product, onSave, onCancel } = t0;
    const [formData, setFormData] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(product);
    const [hasChanges, setHasChanges] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    let t1;
    if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
        t1 = ({
            "ProductEditTab[handleChange]": (field, value)=>{
                setFormData({
                    "ProductEditTab[handleChange > setFormData()]": (prev)=>({
                            ...prev,
                            [field]: value
                        })
                }["ProductEditTab[handleChange > setFormData()]"]);
                setHasChanges(true);
            }
        })["ProductEditTab[handleChange]"];
        $[1] = t1;
    } else {
        t1 = $[1];
    }
    const handleChange = t1;
    let t2;
    if ($[2] !== formData || $[3] !== onSave) {
        t2 = ({
            "ProductEditTab[handleSave]": ()=>{
                onSave(formData);
                setHasChanges(false);
            }
        })["ProductEditTab[handleSave]"];
        $[2] = formData;
        $[3] = onSave;
        $[4] = t2;
    } else {
        t2 = $[4];
    }
    const handleSave = t2;
    let t3;
    if ($[5] !== formData.apcPN) {
        t3 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
            className: "text-lg font-semibold text-slate-800",
            children: [
                "Editing: ",
                formData.apcPN
            ]
        }, void 0, true, {
            fileName: "[project]/components/products/ProductEditTab.tsx",
            lineNumber: 72,
            columnNumber: 10
        }, this);
        $[5] = formData.apcPN;
        $[6] = t3;
    } else {
        t3 = $[6];
    }
    let t4;
    if ($[7] !== hasChanges) {
        t4 = hasChanges && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
            className: "text-sm text-orange-600 mt-1",
            children: "⚠ You have unsaved changes"
        }, void 0, false, {
            fileName: "[project]/components/products/ProductEditTab.tsx",
            lineNumber: 80,
            columnNumber: 24
        }, this);
        $[7] = hasChanges;
        $[8] = t4;
    } else {
        t4 = $[8];
    }
    let t5;
    if ($[9] !== t3 || $[10] !== t4) {
        t5 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            children: [
                t3,
                t4
            ]
        }, void 0, true, {
            fileName: "[project]/components/products/ProductEditTab.tsx",
            lineNumber: 88,
            columnNumber: 10
        }, this);
        $[9] = t3;
        $[10] = t4;
        $[11] = t5;
    } else {
        t5 = $[11];
    }
    let t6;
    if ($[12] === Symbol.for("react.memo_cache_sentinel")) {
        t6 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {
            size: 18
        }, void 0, false, {
            fileName: "[project]/components/products/ProductEditTab.tsx",
            lineNumber: 97,
            columnNumber: 10
        }, this);
        $[12] = t6;
    } else {
        t6 = $[12];
    }
    let t7;
    if ($[13] !== onCancel) {
        t7 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
            onClick: onCancel,
            className: "px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-2",
            children: [
                t6,
                "Cancel"
            ]
        }, void 0, true, {
            fileName: "[project]/components/products/ProductEditTab.tsx",
            lineNumber: 104,
            columnNumber: 10
        }, this);
        $[13] = onCancel;
        $[14] = t7;
    } else {
        t7 = $[14];
    }
    const t8 = !hasChanges;
    let t9;
    if ($[15] === Symbol.for("react.memo_cache_sentinel")) {
        t9 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$save$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Save$3e$__["Save"], {
            size: 18
        }, void 0, false, {
            fileName: "[project]/components/products/ProductEditTab.tsx",
            lineNumber: 113,
            columnNumber: 10
        }, this);
        $[15] = t9;
    } else {
        t9 = $[15];
    }
    let t10;
    if ($[16] !== handleSave || $[17] !== t8) {
        t10 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
            onClick: handleSave,
            disabled: t8,
            className: "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed",
            children: [
                t9,
                "Save Changes"
            ]
        }, void 0, true, {
            fileName: "[project]/components/products/ProductEditTab.tsx",
            lineNumber: 120,
            columnNumber: 11
        }, this);
        $[16] = handleSave;
        $[17] = t8;
        $[18] = t10;
    } else {
        t10 = $[18];
    }
    let t11;
    if ($[19] !== t10 || $[20] !== t7) {
        t11 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex gap-3",
            children: [
                t7,
                t10
            ]
        }, void 0, true, {
            fileName: "[project]/components/products/ProductEditTab.tsx",
            lineNumber: 129,
            columnNumber: 11
        }, this);
        $[19] = t10;
        $[20] = t7;
        $[21] = t11;
    } else {
        t11 = $[21];
    }
    let t12;
    if ($[22] !== t11 || $[23] !== t5) {
        t12 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex items-center justify-between mb-6 pb-4 border-b border-slate-200",
            children: [
                t5,
                t11
            ]
        }, void 0, true, {
            fileName: "[project]/components/products/ProductEditTab.tsx",
            lineNumber: 138,
            columnNumber: 11
        }, this);
        $[22] = t11;
        $[23] = t5;
        $[24] = t12;
    } else {
        t12 = $[24];
    }
    let t13;
    if ($[25] === Symbol.for("react.memo_cache_sentinel")) {
        t13 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
            className: "block text-sm font-medium text-slate-700 mb-1",
            children: "APC Part Number"
        }, void 0, false, {
            fileName: "[project]/components/products/ProductEditTab.tsx",
            lineNumber: 147,
            columnNumber: 11
        }, this);
        $[25] = t13;
    } else {
        t13 = $[25];
    }
    let t14;
    if ($[26] !== formData.apcPN) {
        t14 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            children: [
                t13,
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                    type: "text",
                    value: formData.apcPN,
                    readOnly: true,
                    className: "w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-100 cursor-not-allowed",
                    title: "Part number cannot be changed"
                }, void 0, false, {
                    fileName: "[project]/components/products/ProductEditTab.tsx",
                    lineNumber: 154,
                    columnNumber: 21
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/components/products/ProductEditTab.tsx",
            lineNumber: 154,
            columnNumber: 11
        }, this);
        $[26] = formData.apcPN;
        $[27] = t14;
    } else {
        t14 = $[27];
    }
    let t15;
    if ($[28] === Symbol.for("react.memo_cache_sentinel")) {
        t15 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
            className: "block text-sm font-medium text-slate-700 mb-1",
            children: "Type"
        }, void 0, false, {
            fileName: "[project]/components/products/ProductEditTab.tsx",
            lineNumber: 162,
            columnNumber: 11
        }, this);
        $[28] = t15;
    } else {
        t15 = $[28];
    }
    const t16 = formData.item_type_name || "Unknown";
    let t17;
    if ($[29] !== t16) {
        t17 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            children: [
                t15,
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                    type: "text",
                    value: t16,
                    readOnly: true,
                    className: "w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-100 cursor-not-allowed",
                    title: "Item type cannot be changed"
                }, void 0, false, {
                    fileName: "[project]/components/products/ProductEditTab.tsx",
                    lineNumber: 170,
                    columnNumber: 21
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/components/products/ProductEditTab.tsx",
            lineNumber: 170,
            columnNumber: 11
        }, this);
        $[29] = t16;
        $[30] = t17;
    } else {
        t17 = $[30];
    }
    let t18;
    if ($[31] === Symbol.for("react.memo_cache_sentinel")) {
        t18 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
            className: "block text-sm font-medium text-slate-700 mb-1",
            children: "Customer"
        }, void 0, false, {
            fileName: "[project]/components/products/ProductEditTab.tsx",
            lineNumber: 178,
            columnNumber: 11
        }, this);
        $[31] = t18;
    } else {
        t18 = $[31];
    }
    const t19 = formData.customer || "";
    let t20;
    if ($[32] === Symbol.for("react.memo_cache_sentinel")) {
        t20 = ({
            "ProductEditTab[<input>.onChange]": (e)=>handleChange("customer", e.target.value)
        })["ProductEditTab[<input>.onChange]"];
        $[32] = t20;
    } else {
        t20 = $[32];
    }
    let t21;
    if ($[33] !== t19) {
        t21 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            children: [
                t18,
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                    type: "text",
                    value: t19,
                    onChange: t20,
                    className: "w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none",
                    placeholder: "Enter customer part number"
                }, void 0, false, {
                    fileName: "[project]/components/products/ProductEditTab.tsx",
                    lineNumber: 195,
                    columnNumber: 21
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/components/products/ProductEditTab.tsx",
            lineNumber: 195,
            columnNumber: 11
        }, this);
        $[33] = t19;
        $[34] = t21;
    } else {
        t21 = $[34];
    }
    let t22;
    if ($[35] === Symbol.for("react.memo_cache_sentinel")) {
        t22 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
            className: "block text-sm font-medium text-slate-700 mb-1",
            children: "Customer Part Number"
        }, void 0, false, {
            fileName: "[project]/components/products/ProductEditTab.tsx",
            lineNumber: 203,
            columnNumber: 11
        }, this);
        $[35] = t22;
    } else {
        t22 = $[35];
    }
    const t23 = formData.customerPN || "";
    let t24;
    if ($[36] === Symbol.for("react.memo_cache_sentinel")) {
        t24 = ({
            "ProductEditTab[<input>.onChange]": (e_0)=>handleChange("customerPN", e_0.target.value)
        })["ProductEditTab[<input>.onChange]"];
        $[36] = t24;
    } else {
        t24 = $[36];
    }
    let t25;
    if ($[37] !== t23) {
        t25 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            children: [
                t22,
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                    type: "text",
                    value: t23,
                    onChange: t24,
                    className: "w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none",
                    placeholder: "Enter customer name"
                }, void 0, false, {
                    fileName: "[project]/components/products/ProductEditTab.tsx",
                    lineNumber: 220,
                    columnNumber: 21
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/components/products/ProductEditTab.tsx",
            lineNumber: 220,
            columnNumber: 11
        }, this);
        $[37] = t23;
        $[38] = t25;
    } else {
        t25 = $[38];
    }
    let t26;
    if ($[39] === Symbol.for("react.memo_cache_sentinel")) {
        t26 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
            className: "block text-sm font-medium text-slate-700 mb-1",
            children: "Part Revision"
        }, void 0, false, {
            fileName: "[project]/components/products/ProductEditTab.tsx",
            lineNumber: 228,
            columnNumber: 11
        }, this);
        $[39] = t26;
    } else {
        t26 = $[39];
    }
    const t27 = formData.currentRev || "";
    let t28;
    if ($[40] === Symbol.for("react.memo_cache_sentinel")) {
        t28 = ({
            "ProductEditTab[<input>.onChange]": (e_1)=>handleChange("currentRev", e_1.target.value)
        })["ProductEditTab[<input>.onChange]"];
        $[40] = t28;
    } else {
        t28 = $[40];
    }
    let t29;
    if ($[41] !== t27) {
        t29 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            children: [
                t26,
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                    type: "text",
                    value: t27,
                    onChange: t28,
                    className: "w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none",
                    placeholder: "e.g., A, B-1, Rev C"
                }, void 0, false, {
                    fileName: "[project]/components/products/ProductEditTab.tsx",
                    lineNumber: 245,
                    columnNumber: 21
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/components/products/ProductEditTab.tsx",
            lineNumber: 245,
            columnNumber: 11
        }, this);
        $[41] = t27;
        $[42] = t29;
    } else {
        t29 = $[42];
    }
    let t30;
    if ($[43] === Symbol.for("react.memo_cache_sentinel")) {
        t30 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
            className: "block text-sm font-medium text-slate-700 mb-1",
            children: "Build Revision"
        }, void 0, false, {
            fileName: "[project]/components/products/ProductEditTab.tsx",
            lineNumber: 253,
            columnNumber: 11
        }, this);
        $[43] = t30;
    } else {
        t30 = $[43];
    }
    const t31 = formData.buildRev || "";
    let t32;
    if ($[44] === Symbol.for("react.memo_cache_sentinel")) {
        t32 = ({
            "ProductEditTab[<input>.onChange]": (e_2)=>handleChange("buildRev", e_2.target.value)
        })["ProductEditTab[<input>.onChange]"];
        $[44] = t32;
    } else {
        t32 = $[44];
    }
    let t33;
    if ($[45] !== t31) {
        t33 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            children: [
                t30,
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                    type: "text",
                    value: t31,
                    onChange: t32,
                    className: "w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none",
                    placeholder: "latest MCN ID"
                }, void 0, false, {
                    fileName: "[project]/components/products/ProductEditTab.tsx",
                    lineNumber: 270,
                    columnNumber: 21
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/components/products/ProductEditTab.tsx",
            lineNumber: 270,
            columnNumber: 11
        }, this);
        $[45] = t31;
        $[46] = t33;
    } else {
        t33 = $[46];
    }
    let t34;
    if ($[47] === Symbol.for("react.memo_cache_sentinel")) {
        t34 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
            className: "block text-sm font-medium text-slate-700 mb-1",
            children: "Description"
        }, void 0, false, {
            fileName: "[project]/components/products/ProductEditTab.tsx",
            lineNumber: 278,
            columnNumber: 11
        }, this);
        $[47] = t34;
    } else {
        t34 = $[47];
    }
    const t35 = formData.description || "";
    let t36;
    if ($[48] === Symbol.for("react.memo_cache_sentinel")) {
        t36 = ({
            "ProductEditTab[<textarea>.onChange]": (e_3)=>handleChange("description", e_3.target.value)
        })["ProductEditTab[<textarea>.onChange]"];
        $[48] = t36;
    } else {
        t36 = $[48];
    }
    let t37;
    if ($[49] !== t35) {
        t37 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "col-span-2",
            children: [
                t34,
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                    value: t35,
                    onChange: t36,
                    rows: 3,
                    className: "w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none",
                    placeholder: "Enter product description (free-form)"
                }, void 0, false, {
                    fileName: "[project]/components/products/ProductEditTab.tsx",
                    lineNumber: 295,
                    columnNumber: 44
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/components/products/ProductEditTab.tsx",
            lineNumber: 295,
            columnNumber: 11
        }, this);
        $[49] = t35;
        $[50] = t37;
    } else {
        t37 = $[50];
    }
    let t38;
    if ($[51] === Symbol.for("react.memo_cache_sentinel")) {
        t38 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
            className: "block text-sm font-medium text-slate-700 mb-1",
            children: "Full Path"
        }, void 0, false, {
            fileName: "[project]/components/products/ProductEditTab.tsx",
            lineNumber: 303,
            columnNumber: 11
        }, this);
        $[51] = t38;
    } else {
        t38 = $[51];
    }
    const t39 = formData.fullPath || "";
    let t40;
    if ($[52] === Symbol.for("react.memo_cache_sentinel")) {
        t40 = ({
            "ProductEditTab[<input>.onChange]": (e_4)=>handleChange("fullPath", e_4.target.value)
        })["ProductEditTab[<input>.onChange]"];
        $[52] = t40;
    } else {
        t40 = $[52];
    }
    let t41;
    if ($[53] !== t39) {
        t41 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "col-span-2",
            children: [
                t38,
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                    type: "text",
                    value: t39,
                    onChange: t40,
                    className: "w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none",
                    placeholder: "/mnt/jdrive/APC EngJobs/..."
                }, void 0, false, {
                    fileName: "[project]/components/products/ProductEditTab.tsx",
                    lineNumber: 320,
                    columnNumber: 44
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/components/products/ProductEditTab.tsx",
            lineNumber: 320,
            columnNumber: 11
        }, this);
        $[53] = t39;
        $[54] = t41;
    } else {
        t41 = $[54];
    }
    let t42;
    if ($[55] !== t14 || $[56] !== t17 || $[57] !== t21 || $[58] !== t25 || $[59] !== t29 || $[60] !== t33 || $[61] !== t37 || $[62] !== t41) {
        t42 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "grid grid-cols-2 gap-4",
            children: [
                t14,
                t17,
                t21,
                t25,
                t29,
                t33,
                t37,
                t41
            ]
        }, void 0, true, {
            fileName: "[project]/components/products/ProductEditTab.tsx",
            lineNumber: 328,
            columnNumber: 11
        }, this);
        $[55] = t14;
        $[56] = t17;
        $[57] = t21;
        $[58] = t25;
        $[59] = t29;
        $[60] = t33;
        $[61] = t37;
        $[62] = t41;
        $[63] = t42;
    } else {
        t42 = $[63];
    }
    let t43;
    if ($[64] === Symbol.for("react.memo_cache_sentinel")) {
        t43 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "bg-blue-50 border border-blue-200 rounded-lg p-4",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "text-sm text-blue-800",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                        children: "Note:"
                    }, void 0, false, {
                        fileName: "[project]/components/products/ProductEditTab.tsx",
                        lineNumber: 343,
                        columnNumber: 114
                    }, this),
                    " Additional product information from other data sources (MS SQL, secondary MySQL, documents) will be displayed in separate tabs as we integrate them."
                ]
            }, void 0, true, {
                fileName: "[project]/components/products/ProductEditTab.tsx",
                lineNumber: 343,
                columnNumber: 77
            }, this)
        }, void 0, false, {
            fileName: "[project]/components/products/ProductEditTab.tsx",
            lineNumber: 343,
            columnNumber: 11
        }, this);
        $[64] = t43;
    } else {
        t43 = $[64];
    }
    let t44;
    if ($[65] !== t42) {
        t44 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "space-y-4",
            children: [
                t42,
                t43
            ]
        }, void 0, true, {
            fileName: "[project]/components/products/ProductEditTab.tsx",
            lineNumber: 350,
            columnNumber: 11
        }, this);
        $[65] = t42;
        $[66] = t44;
    } else {
        t44 = $[66];
    }
    let t45;
    if ($[67] !== t12 || $[68] !== t44) {
        t45 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            children: [
                t12,
                t44
            ]
        }, void 0, true, {
            fileName: "[project]/components/products/ProductEditTab.tsx",
            lineNumber: 358,
            columnNumber: 11
        }, this);
        $[67] = t12;
        $[68] = t44;
        $[69] = t45;
    } else {
        t45 = $[69];
    }
    return t45;
}
_s(ProductEditTab, "jRj8rLwuko6XLXm1xCShV+RbOhI=");
_c = ProductEditTab;
var _c;
__turbopack_context__.k.register(_c, "ProductEditTab");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/app/(dashboard)/products/page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>ProductsPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$Tabs$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/ui/Tabs.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$products$2f$ProductTable$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/products/ProductTable.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$products$2f$ProductView$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/products/ProductView.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$products$2f$ProductEditTab$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/products/ProductEditTab.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$plus$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Plus$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/plus.js [app-client] (ecmascript) <export default as Plus>");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
;
;
;
function ProductsPage() {
    _s();
    const [products, setProducts] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [viewProduct, setViewProduct] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [editingProducts, setEditingProducts] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [activeTab, setActiveTab] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('all');
    // Maintain table state
    // In the tableState initialization, add typeFilter
    const [tableState, setTableState] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        search: '',
        sortKey: 'apcPN',
        sortAsc: true,
        pageSize: 25,
        page: 0,
        typeFilter: 'all'
    });
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
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
    const handleSave = async (product_1)=>{
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
            handleCloseEditTab(product_1.id);
        } catch (error_1) {
            console.error('Error saving product:', error_1);
            alert(`Failed to save product: ${error_1 instanceof Error ? error_1.message : 'Unknown error'}`);
        }
    };
    if (loading) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "p-6",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "animate-pulse",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "h-8 bg-slate-200 rounded w-1/4 mb-4"
                    }, void 0, false, {
                        fileName: "[project]/app/(dashboard)/products/page.tsx",
                        lineNumber: 97,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "h-64 bg-slate-200 rounded"
                    }, void 0, false, {
                        fileName: "[project]/app/(dashboard)/products/page.tsx",
                        lineNumber: 98,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/(dashboard)/products/page.tsx",
                lineNumber: 96,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/app/(dashboard)/products/page.tsx",
            lineNumber: 95,
            columnNumber: 12
        }, this);
    }
    if (error) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "p-6",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "font-semibold",
                        children: "Error loading products"
                    }, void 0, false, {
                        fileName: "[project]/app/(dashboard)/products/page.tsx",
                        lineNumber: 105,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-sm",
                        children: error
                    }, void 0, false, {
                        fileName: "[project]/app/(dashboard)/products/page.tsx",
                        lineNumber: 106,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: fetchProducts,
                        className: "mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700",
                        children: "Retry"
                    }, void 0, false, {
                        fileName: "[project]/app/(dashboard)/products/page.tsx",
                        lineNumber: 107,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/(dashboard)/products/page.tsx",
                lineNumber: 104,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/app/(dashboard)/products/page.tsx",
            lineNumber: 103,
            columnNumber: 12
        }, this);
    }
    const productListTab = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex justify-between items-center mb-4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                        className: "text-lg font-semibold text-slate-800",
                        children: [
                            "All Products (",
                            products.length,
                            ")"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/(dashboard)/products/page.tsx",
                        lineNumber: 115,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        className: "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$plus$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Plus$3e$__["Plus"], {
                                size: 18
                            }, void 0, false, {
                                fileName: "[project]/app/(dashboard)/products/page.tsx",
                                lineNumber: 119,
                                columnNumber: 11
                            }, this),
                            "Add Product"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/(dashboard)/products/page.tsx",
                        lineNumber: 118,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/(dashboard)/products/page.tsx",
                lineNumber: 114,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$products$2f$ProductTable$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                products: products,
                onView: handleView,
                onEdit: handleEdit,
                tableState: tableState,
                onTableStateChange: setTableState
            }, void 0, false, {
                fileName: "[project]/app/(dashboard)/products/page.tsx",
                lineNumber: 123,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/(dashboard)/products/page.tsx",
        lineNumber: 113,
        columnNumber: 26
    }, this);
    const tabs = [
        {
            id: 'all',
            label: 'All Products',
            content: productListTab,
            closeable: false
        },
        ...editingProducts.map((product_2)=>({
                id: `edit-${product_2.id}`,
                label: product_2.apcPN,
                content: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$products$2f$ProductEditTab$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                    product: product_2,
                    onSave: handleSave,
                    onCancel: ()=>handleCloseEditTab(product_2.id)
                }, void 0, false, {
                    fileName: "[project]/app/(dashboard)/products/page.tsx",
                    lineNumber: 133,
                    columnNumber: 14
                }, this),
                closeable: true,
                onClose: ()=>handleCloseEditTab(product_2.id)
            }))
    ];
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "p-6",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                className: "text-2xl font-bold text-slate-800 mb-2",
                children: "Products"
            }, void 0, false, {
                fileName: "[project]/app/(dashboard)/products/page.tsx",
                lineNumber: 138,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "text-slate-600 mb-6",
                children: "Manage product catalog and specifications"
            }, void 0, false, {
                fileName: "[project]/app/(dashboard)/products/page.tsx",
                lineNumber: 139,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bg-white rounded-lg shadow",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "p-6",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$Tabs$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                        tabs: tabs,
                        activeTab: activeTab,
                        onTabChange: setActiveTab
                    }, void 0, false, {
                        fileName: "[project]/app/(dashboard)/products/page.tsx",
                        lineNumber: 143,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/app/(dashboard)/products/page.tsx",
                    lineNumber: 142,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/app/(dashboard)/products/page.tsx",
                lineNumber: 141,
                columnNumber: 7
            }, this),
            viewProduct && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$products$2f$ProductView$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                product: viewProduct,
                onClose: ()=>setViewProduct(null)
            }, void 0, false, {
                fileName: "[project]/app/(dashboard)/products/page.tsx",
                lineNumber: 147,
                columnNumber: 23
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/(dashboard)/products/page.tsx",
        lineNumber: 137,
        columnNumber: 10
    }, this);
}
_s(ProductsPage, "qi8WcNcKj9pjyZaaRLs9SRknfj0=");
_c = ProductsPage;
var _c;
__turbopack_context__.k.register(_c, "ProductsPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=_5ec72fe7._.js.map