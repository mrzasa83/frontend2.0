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
"[project]/components/users/UserTable.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>UserTable
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/compiler-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$eye$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Eye$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/eye.js [app-client] (ecmascript) <export default as Eye>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$pencil$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Pencil$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/pencil.js [app-client] (ecmascript) <export default as Pencil>");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
function UserTable(t0) {
    _s();
    const $ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["c"])(81);
    if ($[0] !== "6743fe7660c7cc68003fc6fa5760e9cdea15f19c46847bb4032455a69ece1bcd") {
        for(let $i = 0; $i < 81; $i += 1){
            $[$i] = Symbol.for("react.memo_cache_sentinel");
        }
        $[0] = "6743fe7660c7cc68003fc6fa5760e9cdea15f19c46847bb4032455a69ece1bcd";
    }
    const { users, onView, onEdit } = t0;
    const [search, setSearch] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [sortKey, setSortKey] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("name");
    const [sortAsc, setSortAsc] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [pageSize, setPageSize] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(10);
    const [page, setPage] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0);
    let filtered;
    let paginated;
    let t1;
    let t2;
    let t3;
    let t4;
    let t5;
    let totalPages;
    if ($[1] !== onEdit || $[2] !== onView || $[3] !== page || $[4] !== pageSize || $[5] !== search || $[6] !== sortAsc || $[7] !== sortKey || $[8] !== users) {
        let t6;
        if ($[17] !== search) {
            t6 = ({
                "UserTable[users.filter()]": (u)=>u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()) || u.username?.toLowerCase().includes(search.toLowerCase())
            })["UserTable[users.filter()]"];
            $[17] = search;
            $[18] = t6;
        } else {
            t6 = $[18];
        }
        filtered = users.filter(t6);
        let t7;
        if ($[19] !== sortAsc || $[20] !== sortKey) {
            t7 = ({
                "UserTable[(anonymous)()]": (a, b)=>{
                    const valA = a[sortKey] || "";
                    const valB = b[sortKey] || "";
                    return sortAsc ? String(valA).localeCompare(String(valB)) : String(valB).localeCompare(String(valA));
                }
            })["UserTable[(anonymous)()]"];
            $[19] = sortAsc;
            $[20] = sortKey;
            $[21] = t7;
        } else {
            t7 = $[21];
        }
        const sorted = [
            ...filtered
        ].sort(t7);
        paginated = sorted.slice(page * pageSize, (page + 1) * pageSize);
        totalPages = Math.ceil(filtered.length / pageSize);
        let t8;
        if ($[22] === Symbol.for("react.memo_cache_sentinel")) {
            t8 = ({
                "UserTable[<input>.onChange]": (e)=>setSearch(e.target.value)
            })["UserTable[<input>.onChange]"];
            $[22] = t8;
        } else {
            t8 = $[22];
        }
        let t9;
        if ($[23] !== search) {
            t9 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                type: "text",
                placeholder: "Search users...",
                value: search,
                onChange: t8,
                className: "border border-slate-300 px-3 py-2 rounded-lg w-1/3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            }, void 0, false, {
                fileName: "[project]/components/users/UserTable.tsx",
                lineNumber: 90,
                columnNumber: 12
            }, this);
            $[23] = search;
            $[24] = t9;
        } else {
            t9 = $[24];
        }
        let t10;
        if ($[25] === Symbol.for("react.memo_cache_sentinel")) {
            t10 = ({
                "UserTable[<select>.onChange]": (e_0)=>{
                    setPageSize(Number(e_0.target.value));
                    setPage(0);
                }
            })["UserTable[<select>.onChange]"];
            $[25] = t10;
        } else {
            t10 = $[25];
        }
        let t11;
        if ($[26] === Symbol.for("react.memo_cache_sentinel")) {
            t11 = [
                10,
                20,
                50,
                100
            ].map(_UserTableAnonymous);
            $[26] = t11;
        } else {
            t11 = $[26];
        }
        let t12;
        if ($[27] !== pageSize) {
            t12 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                value: pageSize,
                onChange: t10,
                className: "border border-slate-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none",
                children: t11
            }, void 0, false, {
                fileName: "[project]/components/users/UserTable.tsx",
                lineNumber: 117,
                columnNumber: 13
            }, this);
            $[27] = pageSize;
            $[28] = t12;
        } else {
            t12 = $[28];
        }
        if ($[29] !== t12 || $[30] !== t9) {
            t5 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex justify-between items-center mb-4",
                children: [
                    t9,
                    t12
                ]
            }, void 0, true, {
                fileName: "[project]/components/users/UserTable.tsx",
                lineNumber: 124,
                columnNumber: 12
            }, this);
            $[29] = t12;
            $[30] = t9;
            $[31] = t5;
        } else {
            t5 = $[31];
        }
        t4 = "border border-slate-200 rounded-lg overflow-hidden";
        t2 = "w-full";
        let t13;
        if ($[32] !== sortAsc || $[33] !== sortKey) {
            t13 = [
                "name",
                "username",
                "email",
                "mobile",
                "title",
                "role"
            ].map({
                "UserTable[(anonymous)()]": (key)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                        className: "text-left px-4 py-3 cursor-pointer hover:bg-slate-200 transition-colors font-medium text-sm text-slate-700",
                        onClick: {
                            "UserTable[(anonymous)() > <th>.onClick]": ()=>key === sortKey ? setSortAsc(!sortAsc) : setSortKey(key)
                        }["UserTable[(anonymous)() > <th>.onClick]"],
                        children: [
                            key.charAt(0).toUpperCase() + key.slice(1),
                            sortKey === key && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "ml-1",
                                children: sortAsc ? "\u25B2" : "\u25BC"
                            }, void 0, false, {
                                fileName: "[project]/components/users/UserTable.tsx",
                                lineNumber: 138,
                                columnNumber: 119
                            }, this)
                        ]
                    }, key, true, {
                        fileName: "[project]/components/users/UserTable.tsx",
                        lineNumber: 136,
                        columnNumber: 44
                    }, this)
            }["UserTable[(anonymous)()]"]);
            $[32] = sortAsc;
            $[33] = sortKey;
            $[34] = t13;
        } else {
            t13 = $[34];
        }
        let t14;
        if ($[35] === Symbol.for("react.memo_cache_sentinel")) {
            t14 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                className: "text-left px-4 py-3 font-medium text-sm text-slate-700",
                children: "Actions"
            }, void 0, false, {
                fileName: "[project]/components/users/UserTable.tsx",
                lineNumber: 148,
                columnNumber: 13
            }, this);
            $[35] = t14;
        } else {
            t14 = $[35];
        }
        if ($[36] !== t13) {
            t3 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("thead", {
                className: "bg-slate-100",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                    children: [
                        t13,
                        t14
                    ]
                }, void 0, true, {
                    fileName: "[project]/components/users/UserTable.tsx",
                    lineNumber: 154,
                    columnNumber: 44
                }, this)
            }, void 0, false, {
                fileName: "[project]/components/users/UserTable.tsx",
                lineNumber: 154,
                columnNumber: 12
            }, this);
            $[36] = t13;
            $[37] = t3;
        } else {
            t3 = $[37];
        }
        let t15;
        if ($[38] !== onEdit || $[39] !== onView) {
            t15 = ({
                "UserTable[paginated.map()]": (user)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                        className: "border-t border-slate-200 hover:bg-slate-50 transition-colors",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                className: "px-4 py-3 text-sm",
                                children: user.name || "-"
                            }, void 0, false, {
                                fileName: "[project]/components/users/UserTable.tsx",
                                lineNumber: 163,
                                columnNumber: 139
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                className: "px-4 py-3 text-sm",
                                children: user.username
                            }, void 0, false, {
                                fileName: "[project]/components/users/UserTable.tsx",
                                lineNumber: 163,
                                columnNumber: 196
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                className: "px-4 py-3 text-sm",
                                children: user.email || "-"
                            }, void 0, false, {
                                fileName: "[project]/components/users/UserTable.tsx",
                                lineNumber: 163,
                                columnNumber: 250
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                className: "px-4 py-3 text-sm",
                                children: user.mobile || "-"
                            }, void 0, false, {
                                fileName: "[project]/components/users/UserTable.tsx",
                                lineNumber: 163,
                                columnNumber: 308
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                className: "px-4 py-3 text-sm",
                                children: user.title || "-"
                            }, void 0, false, {
                                fileName: "[project]/components/users/UserTable.tsx",
                                lineNumber: 163,
                                columnNumber: 367
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                className: "px-4 py-3 text-sm",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs",
                                    children: user.role || "No Role"
                                }, void 0, false, {
                                    fileName: "[project]/components/users/UserTable.tsx",
                                    lineNumber: 163,
                                    columnNumber: 459
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/components/users/UserTable.tsx",
                                lineNumber: 163,
                                columnNumber: 425
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                className: "px-4 py-3",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex gap-2",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            onClick: {
                                                "UserTable[paginated.map() > <button>.onClick]": ()=>onView(user)
                                            }["UserTable[paginated.map() > <button>.onClick]"],
                                            className: "p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors",
                                            title: "View User",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$eye$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Eye$3e$__["Eye"], {
                                                size: 18
                                            }, void 0, false, {
                                                fileName: "[project]/components/users/UserTable.tsx",
                                                lineNumber: 165,
                                                columnNumber: 158
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/components/users/UserTable.tsx",
                                            lineNumber: 163,
                                            columnNumber: 619
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            onClick: {
                                                "UserTable[paginated.map() > <button>.onClick]": ()=>onEdit(user)
                                            }["UserTable[paginated.map() > <button>.onClick]"],
                                            className: "p-2 text-green-600 hover:bg-green-50 rounded transition-colors",
                                            title: "Edit User",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$pencil$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Pencil$3e$__["Pencil"], {
                                                size: 18
                                            }, void 0, false, {
                                                fileName: "[project]/components/users/UserTable.tsx",
                                                lineNumber: 167,
                                                columnNumber: 160
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/components/users/UserTable.tsx",
                                            lineNumber: 165,
                                            columnNumber: 184
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/components/users/UserTable.tsx",
                                    lineNumber: 163,
                                    columnNumber: 591
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/components/users/UserTable.tsx",
                                lineNumber: 163,
                                columnNumber: 565
                            }, this)
                        ]
                    }, user.id, true, {
                        fileName: "[project]/components/users/UserTable.tsx",
                        lineNumber: 163,
                        columnNumber: 47
                    }, this)
            })["UserTable[paginated.map()]"];
            $[38] = onEdit;
            $[39] = onView;
            $[40] = t15;
        } else {
            t15 = $[40];
        }
        t1 = paginated.map(t15);
        $[1] = onEdit;
        $[2] = onView;
        $[3] = page;
        $[4] = pageSize;
        $[5] = search;
        $[6] = sortAsc;
        $[7] = sortKey;
        $[8] = users;
        $[9] = filtered;
        $[10] = paginated;
        $[11] = t1;
        $[12] = t2;
        $[13] = t3;
        $[14] = t4;
        $[15] = t5;
        $[16] = totalPages;
    } else {
        filtered = $[9];
        paginated = $[10];
        t1 = $[11];
        t2 = $[12];
        t3 = $[13];
        t4 = $[14];
        t5 = $[15];
        totalPages = $[16];
    }
    let t6;
    if ($[41] !== t1) {
        t6 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
            children: t1
        }, void 0, false, {
            fileName: "[project]/components/users/UserTable.tsx",
            lineNumber: 204,
            columnNumber: 10
        }, this);
        $[41] = t1;
        $[42] = t6;
    } else {
        t6 = $[42];
    }
    let t7;
    if ($[43] !== t2 || $[44] !== t3 || $[45] !== t6) {
        t7 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
            className: t2,
            children: [
                t3,
                t6
            ]
        }, void 0, true, {
            fileName: "[project]/components/users/UserTable.tsx",
            lineNumber: 212,
            columnNumber: 10
        }, this);
        $[43] = t2;
        $[44] = t3;
        $[45] = t6;
        $[46] = t7;
    } else {
        t7 = $[46];
    }
    let t8;
    if ($[47] !== t4 || $[48] !== t7) {
        t8 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: t4,
            children: t7
        }, void 0, false, {
            fileName: "[project]/components/users/UserTable.tsx",
            lineNumber: 222,
            columnNumber: 10
        }, this);
        $[47] = t4;
        $[48] = t7;
        $[49] = t8;
    } else {
        t8 = $[49];
    }
    let t9;
    if ($[50] !== filtered.length || $[51] !== paginated.length) {
        t9 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
            className: "text-sm text-slate-500",
            children: [
                "Showing ",
                paginated.length,
                " of ",
                filtered.length,
                " users"
            ]
        }, void 0, true, {
            fileName: "[project]/components/users/UserTable.tsx",
            lineNumber: 231,
            columnNumber: 10
        }, this);
        $[50] = filtered.length;
        $[51] = paginated.length;
        $[52] = t9;
    } else {
        t9 = $[52];
    }
    let t10;
    if ($[53] !== page) {
        t10 = ({
            "UserTable[<button>.onClick]": ()=>setPage(Math.max(0, page - 1))
        })["UserTable[<button>.onClick]"];
        $[53] = page;
        $[54] = t10;
    } else {
        t10 = $[54];
    }
    const t11 = page === 0;
    let t12;
    if ($[55] !== t10 || $[56] !== t11) {
        t12 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
            onClick: t10,
            disabled: t11,
            className: "px-3 py-1 rounded bg-slate-200 hover:bg-slate-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm",
            children: "Previous"
        }, void 0, false, {
            fileName: "[project]/components/users/UserTable.tsx",
            lineNumber: 251,
            columnNumber: 11
        }, this);
        $[55] = t10;
        $[56] = t11;
        $[57] = t12;
    } else {
        t12 = $[57];
    }
    let t13;
    if ($[58] !== totalPages) {
        t13 = Array.from({
            length: Math.min(5, totalPages)
        });
        $[58] = totalPages;
        $[59] = t13;
    } else {
        t13 = $[59];
    }
    let t14;
    if ($[60] !== page || $[61] !== t13 || $[62] !== totalPages) {
        t14 = t13.map({
            "UserTable[(anonymous)()]": (_, i)=>{
                const pageNum = page < 3 ? i : page - 2 + i;
                if (pageNum >= totalPages) {
                    return null;
                }
                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                    onClick: {
                        "UserTable[(anonymous)() > <button>.onClick]": ()=>setPage(pageNum)
                    }["UserTable[(anonymous)() > <button>.onClick]"],
                    className: `px-3 py-1 rounded text-sm ${pageNum === page ? "bg-slate-800 text-white" : "bg-slate-200 hover:bg-slate-300"}`,
                    children: pageNum + 1
                }, pageNum, false, {
                    fileName: "[project]/components/users/UserTable.tsx",
                    lineNumber: 276,
                    columnNumber: 16
                }, this);
            }
        }["UserTable[(anonymous)()]"]);
        $[60] = page;
        $[61] = t13;
        $[62] = totalPages;
        $[63] = t14;
    } else {
        t14 = $[63];
    }
    let t15;
    if ($[64] !== page || $[65] !== totalPages) {
        t15 = ({
            "UserTable[<button>.onClick]": ()=>setPage(Math.min(totalPages - 1, page + 1))
        })["UserTable[<button>.onClick]"];
        $[64] = page;
        $[65] = totalPages;
        $[66] = t15;
    } else {
        t15 = $[66];
    }
    const t16 = page >= totalPages - 1;
    let t17;
    if ($[67] !== t15 || $[68] !== t16) {
        t17 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
            onClick: t15,
            disabled: t16,
            className: "px-3 py-1 rounded bg-slate-200 hover:bg-slate-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm",
            children: "Next"
        }, void 0, false, {
            fileName: "[project]/components/users/UserTable.tsx",
            lineNumber: 302,
            columnNumber: 11
        }, this);
        $[67] = t15;
        $[68] = t16;
        $[69] = t17;
    } else {
        t17 = $[69];
    }
    let t18;
    if ($[70] !== t12 || $[71] !== t14 || $[72] !== t17) {
        t18 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex gap-1",
            children: [
                t12,
                t14,
                t17
            ]
        }, void 0, true, {
            fileName: "[project]/components/users/UserTable.tsx",
            lineNumber: 311,
            columnNumber: 11
        }, this);
        $[70] = t12;
        $[71] = t14;
        $[72] = t17;
        $[73] = t18;
    } else {
        t18 = $[73];
    }
    let t19;
    if ($[74] !== t18 || $[75] !== t9) {
        t19 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex justify-between items-center mt-4",
            children: [
                t9,
                t18
            ]
        }, void 0, true, {
            fileName: "[project]/components/users/UserTable.tsx",
            lineNumber: 321,
            columnNumber: 11
        }, this);
        $[74] = t18;
        $[75] = t9;
        $[76] = t19;
    } else {
        t19 = $[76];
    }
    let t20;
    if ($[77] !== t19 || $[78] !== t5 || $[79] !== t8) {
        t20 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            children: [
                t5,
                t8,
                t19
            ]
        }, void 0, true, {
            fileName: "[project]/components/users/UserTable.tsx",
            lineNumber: 330,
            columnNumber: 11
        }, this);
        $[77] = t19;
        $[78] = t5;
        $[79] = t8;
        $[80] = t20;
    } else {
        t20 = $[80];
    }
    return t20;
}
_s(UserTable, "gGax13e4TpytyJe8oN/wbRmLJ34=");
_c = UserTable;
function _UserTableAnonymous(size) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
        value: size,
        children: [
            "Show ",
            size
        ]
    }, size, true, {
        fileName: "[project]/components/users/UserTable.tsx",
        lineNumber: 341,
        columnNumber: 10
    }, this);
}
var _c;
__turbopack_context__.k.register(_c, "UserTable");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/users/UserForm.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>UserForm
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/compiler-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$Tabs$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/ui/Tabs.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/x.js [app-client] (ecmascript) <export default as X>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$save$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Save$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/save.js [app-client] (ecmascript) <export default as Save>");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
;
function UserForm(t0) {
    _s();
    const $ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["c"])(130);
    if ($[0] !== "62f8b984e8272dc6e9b7cc6eca74fe15480285f5dc14c0f3096a4d2681fa44be") {
        for(let $i = 0; $i < 130; $i += 1){
            $[$i] = Symbol.for("react.memo_cache_sentinel");
        }
        $[0] = "62f8b984e8272dc6e9b7cc6eca74fe15480285f5dc14c0f3096a4d2681fa44be";
    }
    const { user, mode, onClose, onSave } = t0;
    const [formData, setFormData] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(user);
    const isReadOnly = mode === "view";
    let t1;
    if ($[1] !== isReadOnly) {
        t1 = ({
            "UserForm[handleChange]": (field, value)=>{
                if (isReadOnly) {
                    return;
                }
                setFormData({
                    "UserForm[handleChange > setFormData()]": (prev)=>({
                            ...prev,
                            [field]: value
                        })
                }["UserForm[handleChange > setFormData()]"]);
            }
        })["UserForm[handleChange]"];
        $[1] = isReadOnly;
        $[2] = t1;
    } else {
        t1 = $[2];
    }
    const handleChange = t1;
    let t2;
    if ($[3] !== formData || $[4] !== onSave) {
        t2 = ({
            "UserForm[handleSave]": ()=>{
                if (onSave) {
                    onSave(formData);
                }
            }
        })["UserForm[handleSave]"];
        $[3] = formData;
        $[4] = onSave;
        $[5] = t2;
    } else {
        t2 = $[5];
    }
    const handleSave = t2;
    const inputClassName = `w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${isReadOnly ? "bg-slate-50 cursor-not-allowed" : ""}`;
    let t3;
    if ($[6] === Symbol.for("react.memo_cache_sentinel")) {
        t3 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
            className: "block text-sm font-medium text-slate-700 mb-1",
            children: "Username *"
        }, void 0, false, {
            fileName: "[project]/components/users/UserForm.tsx",
            lineNumber: 81,
            columnNumber: 10
        }, this);
        $[6] = t3;
    } else {
        t3 = $[6];
    }
    let t4;
    if ($[7] !== handleChange) {
        t4 = ({
            "UserForm[<input>.onChange]": (e)=>handleChange("username", e.target.value)
        })["UserForm[<input>.onChange]"];
        $[7] = handleChange;
        $[8] = t4;
    } else {
        t4 = $[8];
    }
    let t5;
    if ($[9] !== formData.username || $[10] !== inputClassName || $[11] !== isReadOnly || $[12] !== t4) {
        t5 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            children: [
                t3,
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                    type: "text",
                    value: formData.username,
                    onChange: t4,
                    readOnly: isReadOnly,
                    className: inputClassName
                }, void 0, false, {
                    fileName: "[project]/components/users/UserForm.tsx",
                    lineNumber: 98,
                    columnNumber: 19
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/components/users/UserForm.tsx",
            lineNumber: 98,
            columnNumber: 10
        }, this);
        $[9] = formData.username;
        $[10] = inputClassName;
        $[11] = isReadOnly;
        $[12] = t4;
        $[13] = t5;
    } else {
        t5 = $[13];
    }
    let t6;
    if ($[14] === Symbol.for("react.memo_cache_sentinel")) {
        t6 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
            className: "block text-sm font-medium text-slate-700 mb-1",
            children: "Full Name"
        }, void 0, false, {
            fileName: "[project]/components/users/UserForm.tsx",
            lineNumber: 109,
            columnNumber: 10
        }, this);
        $[14] = t6;
    } else {
        t6 = $[14];
    }
    const t7 = formData.name || "";
    let t8;
    if ($[15] !== handleChange) {
        t8 = ({
            "UserForm[<input>.onChange]": (e_0)=>handleChange("name", e_0.target.value)
        })["UserForm[<input>.onChange]"];
        $[15] = handleChange;
        $[16] = t8;
    } else {
        t8 = $[16];
    }
    let t9;
    if ($[17] !== inputClassName || $[18] !== isReadOnly || $[19] !== t7 || $[20] !== t8) {
        t9 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            children: [
                t6,
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                    type: "text",
                    value: t7,
                    onChange: t8,
                    readOnly: isReadOnly,
                    className: inputClassName
                }, void 0, false, {
                    fileName: "[project]/components/users/UserForm.tsx",
                    lineNumber: 127,
                    columnNumber: 19
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/components/users/UserForm.tsx",
            lineNumber: 127,
            columnNumber: 10
        }, this);
        $[17] = inputClassName;
        $[18] = isReadOnly;
        $[19] = t7;
        $[20] = t8;
        $[21] = t9;
    } else {
        t9 = $[21];
    }
    let t10;
    if ($[22] === Symbol.for("react.memo_cache_sentinel")) {
        t10 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
            className: "block text-sm font-medium text-slate-700 mb-1",
            children: "Nickname"
        }, void 0, false, {
            fileName: "[project]/components/users/UserForm.tsx",
            lineNumber: 138,
            columnNumber: 11
        }, this);
        $[22] = t10;
    } else {
        t10 = $[22];
    }
    const t11 = formData.nickname || "";
    let t12;
    if ($[23] !== handleChange) {
        t12 = ({
            "UserForm[<input>.onChange]": (e_1)=>handleChange("nickname", e_1.target.value)
        })["UserForm[<input>.onChange]"];
        $[23] = handleChange;
        $[24] = t12;
    } else {
        t12 = $[24];
    }
    let t13;
    if ($[25] !== inputClassName || $[26] !== isReadOnly || $[27] !== t11 || $[28] !== t12) {
        t13 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            children: [
                t10,
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                    type: "text",
                    value: t11,
                    onChange: t12,
                    readOnly: isReadOnly,
                    className: inputClassName
                }, void 0, false, {
                    fileName: "[project]/components/users/UserForm.tsx",
                    lineNumber: 156,
                    columnNumber: 21
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/components/users/UserForm.tsx",
            lineNumber: 156,
            columnNumber: 11
        }, this);
        $[25] = inputClassName;
        $[26] = isReadOnly;
        $[27] = t11;
        $[28] = t12;
        $[29] = t13;
    } else {
        t13 = $[29];
    }
    let t14;
    if ($[30] === Symbol.for("react.memo_cache_sentinel")) {
        t14 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
            className: "block text-sm font-medium text-slate-700 mb-1",
            children: "Email"
        }, void 0, false, {
            fileName: "[project]/components/users/UserForm.tsx",
            lineNumber: 167,
            columnNumber: 11
        }, this);
        $[30] = t14;
    } else {
        t14 = $[30];
    }
    const t15 = formData.email || "";
    let t16;
    if ($[31] !== handleChange) {
        t16 = ({
            "UserForm[<input>.onChange]": (e_2)=>handleChange("email", e_2.target.value)
        })["UserForm[<input>.onChange]"];
        $[31] = handleChange;
        $[32] = t16;
    } else {
        t16 = $[32];
    }
    let t17;
    if ($[33] !== inputClassName || $[34] !== isReadOnly || $[35] !== t15 || $[36] !== t16) {
        t17 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            children: [
                t14,
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                    type: "email",
                    value: t15,
                    onChange: t16,
                    readOnly: isReadOnly,
                    className: inputClassName
                }, void 0, false, {
                    fileName: "[project]/components/users/UserForm.tsx",
                    lineNumber: 185,
                    columnNumber: 21
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/components/users/UserForm.tsx",
            lineNumber: 185,
            columnNumber: 11
        }, this);
        $[33] = inputClassName;
        $[34] = isReadOnly;
        $[35] = t15;
        $[36] = t16;
        $[37] = t17;
    } else {
        t17 = $[37];
    }
    let t18;
    if ($[38] === Symbol.for("react.memo_cache_sentinel")) {
        t18 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
            className: "block text-sm font-medium text-slate-700 mb-1",
            children: "Phone"
        }, void 0, false, {
            fileName: "[project]/components/users/UserForm.tsx",
            lineNumber: 196,
            columnNumber: 11
        }, this);
        $[38] = t18;
    } else {
        t18 = $[38];
    }
    const t19 = formData.phone || "";
    let t20;
    if ($[39] !== handleChange) {
        t20 = ({
            "UserForm[<input>.onChange]": (e_3)=>handleChange("phone", e_3.target.value)
        })["UserForm[<input>.onChange]"];
        $[39] = handleChange;
        $[40] = t20;
    } else {
        t20 = $[40];
    }
    let t21;
    if ($[41] !== inputClassName || $[42] !== isReadOnly || $[43] !== t19 || $[44] !== t20) {
        t21 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            children: [
                t18,
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                    type: "tel",
                    value: t19,
                    onChange: t20,
                    readOnly: isReadOnly,
                    className: inputClassName
                }, void 0, false, {
                    fileName: "[project]/components/users/UserForm.tsx",
                    lineNumber: 214,
                    columnNumber: 21
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/components/users/UserForm.tsx",
            lineNumber: 214,
            columnNumber: 11
        }, this);
        $[41] = inputClassName;
        $[42] = isReadOnly;
        $[43] = t19;
        $[44] = t20;
        $[45] = t21;
    } else {
        t21 = $[45];
    }
    let t22;
    if ($[46] === Symbol.for("react.memo_cache_sentinel")) {
        t22 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
            className: "block text-sm font-medium text-slate-700 mb-1",
            children: "Mobile"
        }, void 0, false, {
            fileName: "[project]/components/users/UserForm.tsx",
            lineNumber: 225,
            columnNumber: 11
        }, this);
        $[46] = t22;
    } else {
        t22 = $[46];
    }
    const t23 = formData.mobile || "";
    let t24;
    if ($[47] !== handleChange) {
        t24 = ({
            "UserForm[<input>.onChange]": (e_4)=>handleChange("mobile", e_4.target.value)
        })["UserForm[<input>.onChange]"];
        $[47] = handleChange;
        $[48] = t24;
    } else {
        t24 = $[48];
    }
    let t25;
    if ($[49] !== inputClassName || $[50] !== isReadOnly || $[51] !== t23 || $[52] !== t24) {
        t25 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            children: [
                t22,
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                    type: "tel",
                    value: t23,
                    onChange: t24,
                    readOnly: isReadOnly,
                    className: inputClassName
                }, void 0, false, {
                    fileName: "[project]/components/users/UserForm.tsx",
                    lineNumber: 243,
                    columnNumber: 21
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/components/users/UserForm.tsx",
            lineNumber: 243,
            columnNumber: 11
        }, this);
        $[49] = inputClassName;
        $[50] = isReadOnly;
        $[51] = t23;
        $[52] = t24;
        $[53] = t25;
    } else {
        t25 = $[53];
    }
    let t26;
    if ($[54] !== t13 || $[55] !== t17 || $[56] !== t21 || $[57] !== t25 || $[58] !== t5 || $[59] !== t9) {
        t26 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "grid grid-cols-2 gap-4",
            children: [
                t5,
                t9,
                t13,
                t17,
                t21,
                t25
            ]
        }, void 0, true, {
            fileName: "[project]/components/users/UserForm.tsx",
            lineNumber: 254,
            columnNumber: 11
        }, this);
        $[54] = t13;
        $[55] = t17;
        $[56] = t21;
        $[57] = t25;
        $[58] = t5;
        $[59] = t9;
        $[60] = t26;
    } else {
        t26 = $[60];
    }
    const t27 = formData.active === 1;
    let t28;
    if ($[61] !== handleChange) {
        t28 = ({
            "UserForm[<input>.onChange]": (e_5)=>handleChange("active", e_5.target.checked ? 1 : 0)
        })["UserForm[<input>.onChange]"];
        $[61] = handleChange;
        $[62] = t28;
    } else {
        t28 = $[62];
    }
    let t29;
    if ($[63] !== isReadOnly || $[64] !== t27 || $[65] !== t28) {
        t29 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
            type: "checkbox",
            checked: t27,
            onChange: t28,
            disabled: isReadOnly,
            className: "rounded border-slate-300 text-blue-600 focus:ring-blue-500"
        }, void 0, false, {
            fileName: "[project]/components/users/UserForm.tsx",
            lineNumber: 278,
            columnNumber: 11
        }, this);
        $[63] = isReadOnly;
        $[64] = t27;
        $[65] = t28;
        $[66] = t29;
    } else {
        t29 = $[66];
    }
    let t30;
    if ($[67] === Symbol.for("react.memo_cache_sentinel")) {
        t30 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
            className: "text-sm font-medium text-slate-700",
            children: "Active User"
        }, void 0, false, {
            fileName: "[project]/components/users/UserForm.tsx",
            lineNumber: 288,
            columnNumber: 11
        }, this);
        $[67] = t30;
    } else {
        t30 = $[67];
    }
    let t31;
    if ($[68] !== t29) {
        t31 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                className: "flex items-center gap-2",
                children: [
                    t29,
                    t30
                ]
            }, void 0, true, {
                fileName: "[project]/components/users/UserForm.tsx",
                lineNumber: 295,
                columnNumber: 16
            }, this)
        }, void 0, false, {
            fileName: "[project]/components/users/UserForm.tsx",
            lineNumber: 295,
            columnNumber: 11
        }, this);
        $[68] = t29;
        $[69] = t31;
    } else {
        t31 = $[69];
    }
    let t32;
    if ($[70] !== t26 || $[71] !== t31) {
        t32 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "space-y-4",
            children: [
                t26,
                t31
            ]
        }, void 0, true, {
            fileName: "[project]/components/users/UserForm.tsx",
            lineNumber: 303,
            columnNumber: 11
        }, this);
        $[70] = t26;
        $[71] = t31;
        $[72] = t32;
    } else {
        t32 = $[72];
    }
    const personalTab = t32;
    let t33;
    if ($[73] === Symbol.for("react.memo_cache_sentinel")) {
        t33 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
            className: "block text-sm font-medium text-slate-700 mb-1",
            children: "Job Title"
        }, void 0, false, {
            fileName: "[project]/components/users/UserForm.tsx",
            lineNumber: 313,
            columnNumber: 11
        }, this);
        $[73] = t33;
    } else {
        t33 = $[73];
    }
    const t34 = formData.title || "";
    let t35;
    if ($[74] !== handleChange) {
        t35 = ({
            "UserForm[<input>.onChange]": (e_6)=>handleChange("title", e_6.target.value)
        })["UserForm[<input>.onChange]"];
        $[74] = handleChange;
        $[75] = t35;
    } else {
        t35 = $[75];
    }
    let t36;
    if ($[76] !== inputClassName || $[77] !== isReadOnly || $[78] !== t34 || $[79] !== t35) {
        t36 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            children: [
                t33,
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                    type: "text",
                    value: t34,
                    onChange: t35,
                    readOnly: isReadOnly,
                    className: inputClassName
                }, void 0, false, {
                    fileName: "[project]/components/users/UserForm.tsx",
                    lineNumber: 331,
                    columnNumber: 21
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/components/users/UserForm.tsx",
            lineNumber: 331,
            columnNumber: 11
        }, this);
        $[76] = inputClassName;
        $[77] = isReadOnly;
        $[78] = t34;
        $[79] = t35;
        $[80] = t36;
    } else {
        t36 = $[80];
    }
    let t37;
    if ($[81] === Symbol.for("react.memo_cache_sentinel")) {
        t37 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
            className: "block text-sm font-medium text-slate-700 mb-1",
            children: "Role"
        }, void 0, false, {
            fileName: "[project]/components/users/UserForm.tsx",
            lineNumber: 342,
            columnNumber: 11
        }, this);
        $[81] = t37;
    } else {
        t37 = $[81];
    }
    const t38 = formData.role || "";
    let t39;
    if ($[82] !== handleChange) {
        t39 = ({
            "UserForm[<input>.onChange]": (e_7)=>handleChange("role", e_7.target.value)
        })["UserForm[<input>.onChange]"];
        $[82] = handleChange;
        $[83] = t39;
    } else {
        t39 = $[83];
    }
    let t40;
    if ($[84] !== inputClassName || $[85] !== isReadOnly || $[86] !== t38 || $[87] !== t39) {
        t40 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            children: [
                t37,
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                    type: "text",
                    value: t38,
                    onChange: t39,
                    readOnly: isReadOnly,
                    className: inputClassName
                }, void 0, false, {
                    fileName: "[project]/components/users/UserForm.tsx",
                    lineNumber: 360,
                    columnNumber: 21
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/components/users/UserForm.tsx",
            lineNumber: 360,
            columnNumber: 11
        }, this);
        $[84] = inputClassName;
        $[85] = isReadOnly;
        $[86] = t38;
        $[87] = t39;
        $[88] = t40;
    } else {
        t40 = $[88];
    }
    let t41;
    if ($[89] !== t36 || $[90] !== t40) {
        t41 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "grid grid-cols-2 gap-4",
            children: [
                t36,
                t40
            ]
        }, void 0, true, {
            fileName: "[project]/components/users/UserForm.tsx",
            lineNumber: 371,
            columnNumber: 11
        }, this);
        $[89] = t36;
        $[90] = t40;
        $[91] = t41;
    } else {
        t41 = $[91];
    }
    let t42;
    if ($[92] === Symbol.for("react.memo_cache_sentinel")) {
        t42 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "bg-slate-50 p-4 rounded-lg",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "text-sm text-slate-600",
                children: "Additional occupation details can be added here in future updates."
            }, void 0, false, {
                fileName: "[project]/components/users/UserForm.tsx",
                lineNumber: 380,
                columnNumber: 55
            }, this)
        }, void 0, false, {
            fileName: "[project]/components/users/UserForm.tsx",
            lineNumber: 380,
            columnNumber: 11
        }, this);
        $[92] = t42;
    } else {
        t42 = $[92];
    }
    let t43;
    if ($[93] !== t41) {
        t43 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "space-y-4",
            children: [
                t41,
                t42
            ]
        }, void 0, true, {
            fileName: "[project]/components/users/UserForm.tsx",
            lineNumber: 387,
            columnNumber: 11
        }, this);
        $[93] = t41;
        $[94] = t43;
    } else {
        t43 = $[94];
    }
    const occupationTab = t43;
    let t44;
    if ($[95] !== personalTab) {
        t44 = {
            id: "personal",
            label: "Personal",
            content: personalTab
        };
        $[95] = personalTab;
        $[96] = t44;
    } else {
        t44 = $[96];
    }
    let t45;
    if ($[97] !== occupationTab) {
        t45 = {
            id: "occupation",
            label: "Occupation",
            content: occupationTab
        };
        $[97] = occupationTab;
        $[98] = t45;
    } else {
        t45 = $[98];
    }
    let t46;
    if ($[99] !== t44 || $[100] !== t45) {
        t46 = [
            t44,
            t45
        ];
        $[99] = t44;
        $[100] = t45;
        $[101] = t46;
    } else {
        t46 = $[101];
    }
    const tabs = t46;
    const t47 = mode === "view" ? "View User" : "Edit User";
    let t48;
    if ($[102] !== t47) {
        t48 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
            className: "text-2xl font-bold text-slate-800",
            children: t47
        }, void 0, false, {
            fileName: "[project]/components/users/UserForm.tsx",
            lineNumber: 431,
            columnNumber: 11
        }, this);
        $[102] = t47;
        $[103] = t48;
    } else {
        t48 = $[103];
    }
    const t49 = mode === "view" ? "User information (read-only)" : "Update user information";
    let t50;
    if ($[104] !== t49) {
        t50 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
            className: "text-sm text-slate-600 mt-1",
            children: t49
        }, void 0, false, {
            fileName: "[project]/components/users/UserForm.tsx",
            lineNumber: 440,
            columnNumber: 11
        }, this);
        $[104] = t49;
        $[105] = t50;
    } else {
        t50 = $[105];
    }
    let t51;
    if ($[106] !== t48 || $[107] !== t50) {
        t51 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            children: [
                t48,
                t50
            ]
        }, void 0, true, {
            fileName: "[project]/components/users/UserForm.tsx",
            lineNumber: 448,
            columnNumber: 11
        }, this);
        $[106] = t48;
        $[107] = t50;
        $[108] = t51;
    } else {
        t51 = $[108];
    }
    let t52;
    if ($[109] === Symbol.for("react.memo_cache_sentinel")) {
        t52 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {
            size: 24,
            className: "text-slate-600"
        }, void 0, false, {
            fileName: "[project]/components/users/UserForm.tsx",
            lineNumber: 457,
            columnNumber: 11
        }, this);
        $[109] = t52;
    } else {
        t52 = $[109];
    }
    let t53;
    if ($[110] !== onClose) {
        t53 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
            onClick: onClose,
            className: "p-2 hover:bg-slate-100 rounded-lg transition-colors",
            children: t52
        }, void 0, false, {
            fileName: "[project]/components/users/UserForm.tsx",
            lineNumber: 464,
            columnNumber: 11
        }, this);
        $[110] = onClose;
        $[111] = t53;
    } else {
        t53 = $[111];
    }
    let t54;
    if ($[112] !== t51 || $[113] !== t53) {
        t54 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex items-center justify-between p-6 border-b border-slate-200",
            children: [
                t51,
                t53
            ]
        }, void 0, true, {
            fileName: "[project]/components/users/UserForm.tsx",
            lineNumber: 472,
            columnNumber: 11
        }, this);
        $[112] = t51;
        $[113] = t53;
        $[114] = t54;
    } else {
        t54 = $[114];
    }
    let t55;
    if ($[115] !== tabs) {
        t55 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex-1 overflow-auto p-6",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$Tabs$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                tabs: tabs,
                defaultTab: "personal"
            }, void 0, false, {
                fileName: "[project]/components/users/UserForm.tsx",
                lineNumber: 481,
                columnNumber: 53
            }, this)
        }, void 0, false, {
            fileName: "[project]/components/users/UserForm.tsx",
            lineNumber: 481,
            columnNumber: 11
        }, this);
        $[115] = tabs;
        $[116] = t55;
    } else {
        t55 = $[116];
    }
    const t56 = mode === "view" ? "Close" : "Cancel";
    let t57;
    if ($[117] !== onClose || $[118] !== t56) {
        t57 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
            onClick: onClose,
            className: "px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors",
            children: t56
        }, void 0, false, {
            fileName: "[project]/components/users/UserForm.tsx",
            lineNumber: 490,
            columnNumber: 11
        }, this);
        $[117] = onClose;
        $[118] = t56;
        $[119] = t57;
    } else {
        t57 = $[119];
    }
    let t58;
    if ($[120] !== handleSave || $[121] !== mode) {
        t58 = mode === "edit" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
            onClick: handleSave,
            className: "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$save$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Save$3e$__["Save"], {
                    size: 18
                }, void 0, false, {
                    fileName: "[project]/components/users/UserForm.tsx",
                    lineNumber: 499,
                    columnNumber: 175
                }, this),
                "Save Changes"
            ]
        }, void 0, true, {
            fileName: "[project]/components/users/UserForm.tsx",
            lineNumber: 499,
            columnNumber: 30
        }, this);
        $[120] = handleSave;
        $[121] = mode;
        $[122] = t58;
    } else {
        t58 = $[122];
    }
    let t59;
    if ($[123] !== t57 || $[124] !== t58) {
        t59 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex items-center justify-end gap-3 p-6 border-t border-slate-200",
            children: [
                t57,
                t58
            ]
        }, void 0, true, {
            fileName: "[project]/components/users/UserForm.tsx",
            lineNumber: 508,
            columnNumber: 11
        }, this);
        $[123] = t57;
        $[124] = t58;
        $[125] = t59;
    } else {
        t59 = $[125];
    }
    let t60;
    if ($[126] !== t54 || $[127] !== t55 || $[128] !== t59) {
        t60 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col",
                children: [
                    t54,
                    t55,
                    t59
                ]
            }, void 0, true, {
                fileName: "[project]/components/users/UserForm.tsx",
                lineNumber: 517,
                columnNumber: 103
            }, this)
        }, void 0, false, {
            fileName: "[project]/components/users/UserForm.tsx",
            lineNumber: 517,
            columnNumber: 11
        }, this);
        $[126] = t54;
        $[127] = t55;
        $[128] = t59;
        $[129] = t60;
    } else {
        t60 = $[129];
    }
    return t60;
}
_s(UserForm, "MeXawg0Cfu8LYLjUQnjU7WTuHf4=");
_c = UserForm;
var _c;
__turbopack_context__.k.register(_c, "UserForm");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/users/UserEditTab.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>UserEditTab
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/compiler-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$Tabs$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/ui/Tabs.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$save$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Save$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/save.js [app-client] (ecmascript) <export default as Save>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/x.js [app-client] (ecmascript) <export default as X>");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
;
function UserEditTab(t0) {
    _s();
    const $ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["c"])(92);
    if ($[0] !== "a2a596539e558a484a12db953d8c75003c9920794a060bcac3e2fc67b3f02035") {
        for(let $i = 0; $i < 92; $i += 1){
            $[$i] = Symbol.for("react.memo_cache_sentinel");
        }
        $[0] = "a2a596539e558a484a12db953d8c75003c9920794a060bcac3e2fc67b3f02035";
    }
    const { user, onSave, onCancel } = t0;
    const [formData, setFormData] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(user);
    const [hasChanges, setHasChanges] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [innerTab, setInnerTab] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("personal");
    let t1;
    if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
        t1 = ({
            "UserEditTab[handleChange]": (field, value)=>{
                setFormData({
                    "UserEditTab[handleChange > setFormData()]": (prev)=>({
                            ...prev,
                            [field]: value
                        })
                }["UserEditTab[handleChange > setFormData()]"]);
                setHasChanges(true);
            }
        })["UserEditTab[handleChange]"];
        $[1] = t1;
    } else {
        t1 = $[1];
    }
    const handleChange = t1;
    let t2;
    if ($[2] !== formData || $[3] !== onSave) {
        t2 = ({
            "UserEditTab[handleSave]": ()=>{
                onSave(formData);
                setHasChanges(false);
            }
        })["UserEditTab[handleSave]"];
        $[2] = formData;
        $[3] = onSave;
        $[4] = t2;
    } else {
        t2 = $[4];
    }
    const handleSave = t2;
    let t3;
    if ($[5] === Symbol.for("react.memo_cache_sentinel")) {
        t3 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
            className: "block text-sm font-medium text-slate-700 mb-1",
            children: "Username *"
        }, void 0, false, {
            fileName: "[project]/components/users/UserEditTab.tsx",
            lineNumber: 75,
            columnNumber: 10
        }, this);
        $[5] = t3;
    } else {
        t3 = $[5];
    }
    let t4;
    if ($[6] === Symbol.for("react.memo_cache_sentinel")) {
        t4 = ({
            "UserEditTab[<input>.onChange]": (e)=>handleChange("username", e.target.value)
        })["UserEditTab[<input>.onChange]"];
        $[6] = t4;
    } else {
        t4 = $[6];
    }
    let t5;
    if ($[7] !== formData.username) {
        t5 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            children: [
                t3,
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                    type: "text",
                    value: formData.username,
                    onChange: t4,
                    className: "w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                }, void 0, false, {
                    fileName: "[project]/components/users/UserEditTab.tsx",
                    lineNumber: 91,
                    columnNumber: 19
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/components/users/UserEditTab.tsx",
            lineNumber: 91,
            columnNumber: 10
        }, this);
        $[7] = formData.username;
        $[8] = t5;
    } else {
        t5 = $[8];
    }
    let t6;
    if ($[9] === Symbol.for("react.memo_cache_sentinel")) {
        t6 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
            className: "block text-sm font-medium text-slate-700 mb-1",
            children: "Full Name"
        }, void 0, false, {
            fileName: "[project]/components/users/UserEditTab.tsx",
            lineNumber: 99,
            columnNumber: 10
        }, this);
        $[9] = t6;
    } else {
        t6 = $[9];
    }
    const t7 = formData.name || "";
    let t8;
    if ($[10] === Symbol.for("react.memo_cache_sentinel")) {
        t8 = ({
            "UserEditTab[<input>.onChange]": (e_0)=>handleChange("name", e_0.target.value)
        })["UserEditTab[<input>.onChange]"];
        $[10] = t8;
    } else {
        t8 = $[10];
    }
    let t9;
    if ($[11] !== t7) {
        t9 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            children: [
                t6,
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                    type: "text",
                    value: t7,
                    onChange: t8,
                    className: "w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                }, void 0, false, {
                    fileName: "[project]/components/users/UserEditTab.tsx",
                    lineNumber: 116,
                    columnNumber: 19
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/components/users/UserEditTab.tsx",
            lineNumber: 116,
            columnNumber: 10
        }, this);
        $[11] = t7;
        $[12] = t9;
    } else {
        t9 = $[12];
    }
    let t10;
    if ($[13] === Symbol.for("react.memo_cache_sentinel")) {
        t10 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
            className: "block text-sm font-medium text-slate-700 mb-1",
            children: "Nickname"
        }, void 0, false, {
            fileName: "[project]/components/users/UserEditTab.tsx",
            lineNumber: 124,
            columnNumber: 11
        }, this);
        $[13] = t10;
    } else {
        t10 = $[13];
    }
    const t11 = formData.nickname || "";
    let t12;
    if ($[14] === Symbol.for("react.memo_cache_sentinel")) {
        t12 = ({
            "UserEditTab[<input>.onChange]": (e_1)=>handleChange("nickname", e_1.target.value)
        })["UserEditTab[<input>.onChange]"];
        $[14] = t12;
    } else {
        t12 = $[14];
    }
    let t13;
    if ($[15] !== t11) {
        t13 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            children: [
                t10,
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                    type: "text",
                    value: t11,
                    onChange: t12,
                    className: "w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                }, void 0, false, {
                    fileName: "[project]/components/users/UserEditTab.tsx",
                    lineNumber: 141,
                    columnNumber: 21
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/components/users/UserEditTab.tsx",
            lineNumber: 141,
            columnNumber: 11
        }, this);
        $[15] = t11;
        $[16] = t13;
    } else {
        t13 = $[16];
    }
    let t14;
    if ($[17] === Symbol.for("react.memo_cache_sentinel")) {
        t14 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
            className: "block text-sm font-medium text-slate-700 mb-1",
            children: "Email"
        }, void 0, false, {
            fileName: "[project]/components/users/UserEditTab.tsx",
            lineNumber: 149,
            columnNumber: 11
        }, this);
        $[17] = t14;
    } else {
        t14 = $[17];
    }
    const t15 = formData.email || "";
    let t16;
    if ($[18] === Symbol.for("react.memo_cache_sentinel")) {
        t16 = ({
            "UserEditTab[<input>.onChange]": (e_2)=>handleChange("email", e_2.target.value)
        })["UserEditTab[<input>.onChange]"];
        $[18] = t16;
    } else {
        t16 = $[18];
    }
    let t17;
    if ($[19] !== t15) {
        t17 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            children: [
                t14,
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                    type: "email",
                    value: t15,
                    onChange: t16,
                    className: "w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                }, void 0, false, {
                    fileName: "[project]/components/users/UserEditTab.tsx",
                    lineNumber: 166,
                    columnNumber: 21
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/components/users/UserEditTab.tsx",
            lineNumber: 166,
            columnNumber: 11
        }, this);
        $[19] = t15;
        $[20] = t17;
    } else {
        t17 = $[20];
    }
    let t18;
    if ($[21] === Symbol.for("react.memo_cache_sentinel")) {
        t18 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
            className: "block text-sm font-medium text-slate-700 mb-1",
            children: "Phone"
        }, void 0, false, {
            fileName: "[project]/components/users/UserEditTab.tsx",
            lineNumber: 174,
            columnNumber: 11
        }, this);
        $[21] = t18;
    } else {
        t18 = $[21];
    }
    const t19 = formData.phone || "";
    let t20;
    if ($[22] === Symbol.for("react.memo_cache_sentinel")) {
        t20 = ({
            "UserEditTab[<input>.onChange]": (e_3)=>handleChange("phone", e_3.target.value)
        })["UserEditTab[<input>.onChange]"];
        $[22] = t20;
    } else {
        t20 = $[22];
    }
    let t21;
    if ($[23] !== t19) {
        t21 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            children: [
                t18,
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                    type: "tel",
                    value: t19,
                    onChange: t20,
                    className: "w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                }, void 0, false, {
                    fileName: "[project]/components/users/UserEditTab.tsx",
                    lineNumber: 191,
                    columnNumber: 21
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/components/users/UserEditTab.tsx",
            lineNumber: 191,
            columnNumber: 11
        }, this);
        $[23] = t19;
        $[24] = t21;
    } else {
        t21 = $[24];
    }
    let t22;
    if ($[25] === Symbol.for("react.memo_cache_sentinel")) {
        t22 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
            className: "block text-sm font-medium text-slate-700 mb-1",
            children: "Mobile"
        }, void 0, false, {
            fileName: "[project]/components/users/UserEditTab.tsx",
            lineNumber: 199,
            columnNumber: 11
        }, this);
        $[25] = t22;
    } else {
        t22 = $[25];
    }
    const t23 = formData.mobile || "";
    let t24;
    if ($[26] === Symbol.for("react.memo_cache_sentinel")) {
        t24 = ({
            "UserEditTab[<input>.onChange]": (e_4)=>handleChange("mobile", e_4.target.value)
        })["UserEditTab[<input>.onChange]"];
        $[26] = t24;
    } else {
        t24 = $[26];
    }
    let t25;
    if ($[27] !== t23) {
        t25 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            children: [
                t22,
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                    type: "tel",
                    value: t23,
                    onChange: t24,
                    className: "w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                }, void 0, false, {
                    fileName: "[project]/components/users/UserEditTab.tsx",
                    lineNumber: 216,
                    columnNumber: 21
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/components/users/UserEditTab.tsx",
            lineNumber: 216,
            columnNumber: 11
        }, this);
        $[27] = t23;
        $[28] = t25;
    } else {
        t25 = $[28];
    }
    let t26;
    if ($[29] !== t13 || $[30] !== t17 || $[31] !== t21 || $[32] !== t25 || $[33] !== t5 || $[34] !== t9) {
        t26 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "grid grid-cols-2 gap-4",
            children: [
                t5,
                t9,
                t13,
                t17,
                t21,
                t25
            ]
        }, void 0, true, {
            fileName: "[project]/components/users/UserEditTab.tsx",
            lineNumber: 224,
            columnNumber: 11
        }, this);
        $[29] = t13;
        $[30] = t17;
        $[31] = t21;
        $[32] = t25;
        $[33] = t5;
        $[34] = t9;
        $[35] = t26;
    } else {
        t26 = $[35];
    }
    const t27 = formData.active === 1;
    let t28;
    if ($[36] === Symbol.for("react.memo_cache_sentinel")) {
        t28 = ({
            "UserEditTab[<input>.onChange]": (e_5)=>handleChange("active", e_5.target.checked ? 1 : 0)
        })["UserEditTab[<input>.onChange]"];
        $[36] = t28;
    } else {
        t28 = $[36];
    }
    let t29;
    if ($[37] !== t27) {
        t29 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
            type: "checkbox",
            checked: t27,
            onChange: t28,
            className: "rounded border-slate-300 text-blue-600 focus:ring-blue-500"
        }, void 0, false, {
            fileName: "[project]/components/users/UserEditTab.tsx",
            lineNumber: 247,
            columnNumber: 11
        }, this);
        $[37] = t27;
        $[38] = t29;
    } else {
        t29 = $[38];
    }
    let t30;
    if ($[39] === Symbol.for("react.memo_cache_sentinel")) {
        t30 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
            className: "text-sm font-medium text-slate-700",
            children: "Active User"
        }, void 0, false, {
            fileName: "[project]/components/users/UserEditTab.tsx",
            lineNumber: 255,
            columnNumber: 11
        }, this);
        $[39] = t30;
    } else {
        t30 = $[39];
    }
    let t31;
    if ($[40] !== t29) {
        t31 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                className: "flex items-center gap-2",
                children: [
                    t29,
                    t30
                ]
            }, void 0, true, {
                fileName: "[project]/components/users/UserEditTab.tsx",
                lineNumber: 262,
                columnNumber: 16
            }, this)
        }, void 0, false, {
            fileName: "[project]/components/users/UserEditTab.tsx",
            lineNumber: 262,
            columnNumber: 11
        }, this);
        $[40] = t29;
        $[41] = t31;
    } else {
        t31 = $[41];
    }
    let t32;
    if ($[42] !== t26 || $[43] !== t31) {
        t32 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "space-y-4",
            children: [
                t26,
                t31
            ]
        }, void 0, true, {
            fileName: "[project]/components/users/UserEditTab.tsx",
            lineNumber: 270,
            columnNumber: 11
        }, this);
        $[42] = t26;
        $[43] = t31;
        $[44] = t32;
    } else {
        t32 = $[44];
    }
    const personalTab = t32;
    let t33;
    if ($[45] === Symbol.for("react.memo_cache_sentinel")) {
        t33 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
            className: "block text-sm font-medium text-slate-700 mb-1",
            children: "Job Title"
        }, void 0, false, {
            fileName: "[project]/components/users/UserEditTab.tsx",
            lineNumber: 280,
            columnNumber: 11
        }, this);
        $[45] = t33;
    } else {
        t33 = $[45];
    }
    const t34 = formData.title || "";
    let t35;
    if ($[46] === Symbol.for("react.memo_cache_sentinel")) {
        t35 = ({
            "UserEditTab[<input>.onChange]": (e_6)=>handleChange("title", e_6.target.value)
        })["UserEditTab[<input>.onChange]"];
        $[46] = t35;
    } else {
        t35 = $[46];
    }
    let t36;
    if ($[47] !== t34) {
        t36 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            children: [
                t33,
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                    type: "text",
                    value: t34,
                    onChange: t35,
                    className: "w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                }, void 0, false, {
                    fileName: "[project]/components/users/UserEditTab.tsx",
                    lineNumber: 297,
                    columnNumber: 21
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/components/users/UserEditTab.tsx",
            lineNumber: 297,
            columnNumber: 11
        }, this);
        $[47] = t34;
        $[48] = t36;
    } else {
        t36 = $[48];
    }
    let t37;
    if ($[49] === Symbol.for("react.memo_cache_sentinel")) {
        t37 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
            className: "block text-sm font-medium text-slate-700 mb-1",
            children: "Role"
        }, void 0, false, {
            fileName: "[project]/components/users/UserEditTab.tsx",
            lineNumber: 305,
            columnNumber: 11
        }, this);
        $[49] = t37;
    } else {
        t37 = $[49];
    }
    const t38 = formData.role || "";
    let t39;
    if ($[50] === Symbol.for("react.memo_cache_sentinel")) {
        t39 = ({
            "UserEditTab[<input>.onChange]": (e_7)=>handleChange("role", e_7.target.value)
        })["UserEditTab[<input>.onChange]"];
        $[50] = t39;
    } else {
        t39 = $[50];
    }
    let t40;
    if ($[51] !== t38) {
        t40 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            children: [
                t37,
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                    type: "text",
                    value: t38,
                    onChange: t39,
                    className: "w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                }, void 0, false, {
                    fileName: "[project]/components/users/UserEditTab.tsx",
                    lineNumber: 322,
                    columnNumber: 21
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/components/users/UserEditTab.tsx",
            lineNumber: 322,
            columnNumber: 11
        }, this);
        $[51] = t38;
        $[52] = t40;
    } else {
        t40 = $[52];
    }
    let t41;
    if ($[53] !== t36 || $[54] !== t40) {
        t41 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "grid grid-cols-2 gap-4",
            children: [
                t36,
                t40
            ]
        }, void 0, true, {
            fileName: "[project]/components/users/UserEditTab.tsx",
            lineNumber: 330,
            columnNumber: 11
        }, this);
        $[53] = t36;
        $[54] = t40;
        $[55] = t41;
    } else {
        t41 = $[55];
    }
    let t42;
    if ($[56] === Symbol.for("react.memo_cache_sentinel")) {
        t42 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "bg-blue-50 border border-blue-200 p-4 rounded-lg",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "text-sm text-blue-800",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                        children: "Note:"
                    }, void 0, false, {
                        fileName: "[project]/components/users/UserEditTab.tsx",
                        lineNumber: 339,
                        columnNumber: 114
                    }, this),
                    " Additional occupation details (department, manager, start date, etc.) can be added here in future updates."
                ]
            }, void 0, true, {
                fileName: "[project]/components/users/UserEditTab.tsx",
                lineNumber: 339,
                columnNumber: 77
            }, this)
        }, void 0, false, {
            fileName: "[project]/components/users/UserEditTab.tsx",
            lineNumber: 339,
            columnNumber: 11
        }, this);
        $[56] = t42;
    } else {
        t42 = $[56];
    }
    let t43;
    if ($[57] !== t41) {
        t43 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "space-y-4",
            children: [
                t41,
                t42
            ]
        }, void 0, true, {
            fileName: "[project]/components/users/UserEditTab.tsx",
            lineNumber: 346,
            columnNumber: 11
        }, this);
        $[57] = t41;
        $[58] = t43;
    } else {
        t43 = $[58];
    }
    const occupationTab = t43;
    let t44;
    if ($[59] !== personalTab) {
        t44 = {
            id: "personal",
            label: "Personal",
            content: personalTab,
            closeable: false
        };
        $[59] = personalTab;
        $[60] = t44;
    } else {
        t44 = $[60];
    }
    let t45;
    if ($[61] !== occupationTab) {
        t45 = {
            id: "occupation",
            label: "Occupation",
            content: occupationTab,
            closeable: false
        };
        $[61] = occupationTab;
        $[62] = t45;
    } else {
        t45 = $[62];
    }
    let t46;
    if ($[63] !== t44 || $[64] !== t45) {
        t46 = [
            t44,
            t45
        ];
        $[63] = t44;
        $[64] = t45;
        $[65] = t46;
    } else {
        t46 = $[65];
    }
    const tabs = t46;
    const t47 = formData.name || formData.username;
    let t48;
    if ($[66] !== t47) {
        t48 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
            className: "text-lg font-semibold text-slate-800",
            children: [
                "Editing: ",
                t47
            ]
        }, void 0, true, {
            fileName: "[project]/components/users/UserEditTab.tsx",
            lineNumber: 392,
            columnNumber: 11
        }, this);
        $[66] = t47;
        $[67] = t48;
    } else {
        t48 = $[67];
    }
    let t49;
    if ($[68] !== hasChanges) {
        t49 = hasChanges && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
            className: "text-sm text-orange-600 mt-1",
            children: "⚠ You have unsaved changes"
        }, void 0, false, {
            fileName: "[project]/components/users/UserEditTab.tsx",
            lineNumber: 400,
            columnNumber: 25
        }, this);
        $[68] = hasChanges;
        $[69] = t49;
    } else {
        t49 = $[69];
    }
    let t50;
    if ($[70] !== t48 || $[71] !== t49) {
        t50 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            children: [
                t48,
                t49
            ]
        }, void 0, true, {
            fileName: "[project]/components/users/UserEditTab.tsx",
            lineNumber: 408,
            columnNumber: 11
        }, this);
        $[70] = t48;
        $[71] = t49;
        $[72] = t50;
    } else {
        t50 = $[72];
    }
    let t51;
    if ($[73] === Symbol.for("react.memo_cache_sentinel")) {
        t51 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {
            size: 18
        }, void 0, false, {
            fileName: "[project]/components/users/UserEditTab.tsx",
            lineNumber: 417,
            columnNumber: 11
        }, this);
        $[73] = t51;
    } else {
        t51 = $[73];
    }
    let t52;
    if ($[74] !== onCancel) {
        t52 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
            onClick: onCancel,
            className: "px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-2",
            children: [
                t51,
                "Cancel"
            ]
        }, void 0, true, {
            fileName: "[project]/components/users/UserEditTab.tsx",
            lineNumber: 424,
            columnNumber: 11
        }, this);
        $[74] = onCancel;
        $[75] = t52;
    } else {
        t52 = $[75];
    }
    const t53 = !hasChanges;
    let t54;
    if ($[76] === Symbol.for("react.memo_cache_sentinel")) {
        t54 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$save$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Save$3e$__["Save"], {
            size: 18
        }, void 0, false, {
            fileName: "[project]/components/users/UserEditTab.tsx",
            lineNumber: 433,
            columnNumber: 11
        }, this);
        $[76] = t54;
    } else {
        t54 = $[76];
    }
    let t55;
    if ($[77] !== handleSave || $[78] !== t53) {
        t55 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
            onClick: handleSave,
            disabled: t53,
            className: "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed",
            children: [
                t54,
                "Save Changes"
            ]
        }, void 0, true, {
            fileName: "[project]/components/users/UserEditTab.tsx",
            lineNumber: 440,
            columnNumber: 11
        }, this);
        $[77] = handleSave;
        $[78] = t53;
        $[79] = t55;
    } else {
        t55 = $[79];
    }
    let t56;
    if ($[80] !== t52 || $[81] !== t55) {
        t56 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex gap-3",
            children: [
                t52,
                t55
            ]
        }, void 0, true, {
            fileName: "[project]/components/users/UserEditTab.tsx",
            lineNumber: 449,
            columnNumber: 11
        }, this);
        $[80] = t52;
        $[81] = t55;
        $[82] = t56;
    } else {
        t56 = $[82];
    }
    let t57;
    if ($[83] !== t50 || $[84] !== t56) {
        t57 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex items-center justify-between mb-6 pb-4 border-b border-slate-200",
            children: [
                t50,
                t56
            ]
        }, void 0, true, {
            fileName: "[project]/components/users/UserEditTab.tsx",
            lineNumber: 458,
            columnNumber: 11
        }, this);
        $[83] = t50;
        $[84] = t56;
        $[85] = t57;
    } else {
        t57 = $[85];
    }
    let t58;
    if ($[86] !== innerTab || $[87] !== tabs) {
        t58 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$Tabs$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
            tabs: tabs,
            activeTab: innerTab,
            onTabChange: setInnerTab
        }, void 0, false, {
            fileName: "[project]/components/users/UserEditTab.tsx",
            lineNumber: 467,
            columnNumber: 11
        }, this);
        $[86] = innerTab;
        $[87] = tabs;
        $[88] = t58;
    } else {
        t58 = $[88];
    }
    let t59;
    if ($[89] !== t57 || $[90] !== t58) {
        t59 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            children: [
                t57,
                t58
            ]
        }, void 0, true, {
            fileName: "[project]/components/users/UserEditTab.tsx",
            lineNumber: 476,
            columnNumber: 11
        }, this);
        $[89] = t57;
        $[90] = t58;
        $[91] = t59;
    } else {
        t59 = $[91];
    }
    return t59;
}
_s(UserEditTab, "nY7ypcUGqIPvokx5+rL0MD8FXR8=");
_c = UserEditTab;
var _c;
__turbopack_context__.k.register(_c, "UserEditTab");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/app/(dashboard)/users/page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>UsersPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$Tabs$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/ui/Tabs.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$users$2f$UserTable$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/users/UserTable.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$users$2f$UserForm$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/users/UserForm.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$users$2f$UserEditTab$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/users/UserEditTab.tsx [app-client] (ecmascript)");
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
function UsersPage() {
    _s();
    const [users, setUsers] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [viewUser, setViewUser] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [editingUsers, setEditingUsers] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [activeTab, setActiveTab] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('all');
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "UsersPage.useEffect": ()=>{
            fetchUsers();
        }
    }["UsersPage.useEffect"], []);
    const fetchUsers = async ()=>{
        try {
            setLoading(true);
            setError(null);
            const res = await fetch('/api/users');
            if (!res.ok) {
                throw new Error(`Failed to fetch users: ${res.status}`);
            }
            const data = await res.json();
            setUsers(data);
        } catch (error_0) {
            console.error('Error fetching users:', error_0);
            setError(error_0 instanceof Error ? error_0.message : 'Failed to load users');
        } finally{
            setLoading(false);
        }
    };
    const handleView = (user)=>{
        setViewUser(user);
    };
    const handleEdit = (user_0)=>{
        // Check if user is already being edited
        const alreadyEditing = editingUsers.find((u)=>u.id === user_0.id);
        if (!alreadyEditing) {
            setEditingUsers((prev)=>[
                    ...prev,
                    user_0
                ]);
        }
        // Switch to that user's tab
        setActiveTab(`edit-${user_0.id}`);
    };
    const handleCloseEditTab = (userId)=>{
        setEditingUsers((prev_0)=>prev_0.filter((u_0)=>u_0.id !== userId));
        setActiveTab('all');
    };
    const handleSave = async (user_1)=>{
        try {
            console.log('Saving user:', user_1); // Keep for debugging
            const res_0 = await fetch(`/api/users/${user_1.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(user_1)
            });
            const responseData = await res_0.json();
            console.log('Save response:', responseData); // Keep for debugging
            if (!res_0.ok) {
                throw new Error(responseData.error || responseData.details || 'Failed to save user');
            }
            // Refresh the user list and close the tab
            await fetchUsers();
            handleCloseEditTab(user_1.id);
        } catch (error_1) {
            console.error('Error saving user:', error_1);
            // Only show alert on actual errors
            alert(`Failed to save user: ${error_1 instanceof Error ? error_1.message : 'Unknown error'}`);
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
                        fileName: "[project]/app/(dashboard)/users/page.tsx",
                        lineNumber: 94,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "h-64 bg-slate-200 rounded"
                    }, void 0, false, {
                        fileName: "[project]/app/(dashboard)/users/page.tsx",
                        lineNumber: 95,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/(dashboard)/users/page.tsx",
                lineNumber: 93,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/app/(dashboard)/users/page.tsx",
            lineNumber: 92,
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
                        children: "Error loading users"
                    }, void 0, false, {
                        fileName: "[project]/app/(dashboard)/users/page.tsx",
                        lineNumber: 102,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-sm",
                        children: error
                    }, void 0, false, {
                        fileName: "[project]/app/(dashboard)/users/page.tsx",
                        lineNumber: 103,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: fetchUsers,
                        className: "mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700",
                        children: "Retry"
                    }, void 0, false, {
                        fileName: "[project]/app/(dashboard)/users/page.tsx",
                        lineNumber: 104,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/(dashboard)/users/page.tsx",
                lineNumber: 101,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/app/(dashboard)/users/page.tsx",
            lineNumber: 100,
            columnNumber: 12
        }, this);
    }
    const userListTab = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex justify-between items-center mb-4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                        className: "text-lg font-semibold text-slate-800",
                        children: [
                            "All Users (",
                            users.length,
                            ")"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/(dashboard)/users/page.tsx",
                        lineNumber: 112,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        className: "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$plus$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Plus$3e$__["Plus"], {
                                size: 18
                            }, void 0, false, {
                                fileName: "[project]/app/(dashboard)/users/page.tsx",
                                lineNumber: 116,
                                columnNumber: 11
                            }, this),
                            "Add User"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/(dashboard)/users/page.tsx",
                        lineNumber: 115,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/(dashboard)/users/page.tsx",
                lineNumber: 111,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$users$2f$UserTable$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                users: users,
                onView: handleView,
                onEdit: handleEdit
            }, void 0, false, {
                fileName: "[project]/app/(dashboard)/users/page.tsx",
                lineNumber: 120,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/(dashboard)/users/page.tsx",
        lineNumber: 110,
        columnNumber: 23
    }, this);
    // Build tabs array dynamically
    const tabs = [
        {
            id: 'all',
            label: 'All Users',
            content: userListTab,
            closeable: false
        },
        ...editingUsers.map((user_2)=>({
                id: `edit-${user_2.id}`,
                label: user_2.name || user_2.username,
                content: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$users$2f$UserEditTab$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                    user: user_2,
                    onSave: handleSave,
                    onCancel: ()=>handleCloseEditTab(user_2.id)
                }, void 0, false, {
                    fileName: "[project]/app/(dashboard)/users/page.tsx",
                    lineNumber: 132,
                    columnNumber: 14
                }, this),
                closeable: true,
                onClose: ()=>handleCloseEditTab(user_2.id)
            }))
    ];
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "p-6",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                className: "text-2xl font-bold text-slate-800 mb-2",
                children: "Users"
            }, void 0, false, {
                fileName: "[project]/app/(dashboard)/users/page.tsx",
                lineNumber: 137,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "text-slate-600 mb-6",
                children: "Manage system users and permissions"
            }, void 0, false, {
                fileName: "[project]/app/(dashboard)/users/page.tsx",
                lineNumber: 138,
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
                        fileName: "[project]/app/(dashboard)/users/page.tsx",
                        lineNumber: 142,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/app/(dashboard)/users/page.tsx",
                    lineNumber: 141,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/app/(dashboard)/users/page.tsx",
                lineNumber: 140,
                columnNumber: 7
            }, this),
            viewUser && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$users$2f$UserForm$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                user: viewUser,
                mode: "view",
                onClose: ()=>setViewUser(null)
            }, void 0, false, {
                fileName: "[project]/app/(dashboard)/users/page.tsx",
                lineNumber: 147,
                columnNumber: 20
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/(dashboard)/users/page.tsx",
        lineNumber: 136,
        columnNumber: 10
    }, this);
}
_s(UsersPage, "PA59a3odl8eb3aC6oqO+GyO3480=");
_c = UsersPage;
var _c;
__turbopack_context__.k.register(_c, "UsersPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=_15ef2d96._.js.map