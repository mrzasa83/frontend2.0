(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/frontend2.4/components/users/UserTable.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>UserTable
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend2.4/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend2.4/node_modules/next/dist/compiled/react/compiler-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$eye$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Eye$3e$__ = __turbopack_context__.i("[project]/frontend2.4/node_modules/lucide-react/dist/esm/icons/eye.js [app-client] (ecmascript) <export default as Eye>");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$pencil$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Pencil$3e$__ = __turbopack_context__.i("[project]/frontend2.4/node_modules/lucide-react/dist/esm/icons/pencil.js [app-client] (ecmascript) <export default as Pencil>");
'use client';
;
;
;
function UserTable(t0) {
    const $ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["c"])(20);
    if ($[0] !== "6a7fb1302ad8da21fca6356ea2b46b432e768bf7612986accc41085113eb1043") {
        for(let $i = 0; $i < 20; $i += 1){
            $[$i] = Symbol.for("react.memo_cache_sentinel");
        }
        $[0] = "6a7fb1302ad8da21fca6356ea2b46b432e768bf7612986accc41085113eb1043";
    }
    const { users, onView, onEdit, showActions: t1 } = t0;
    const showActions = t1 === undefined ? true : t1;
    let t2;
    let t3;
    let t4;
    let t5;
    let t6;
    if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
        t2 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
            className: "text-left px-4 py-3 font-medium text-sm text-slate-700",
            children: "Username"
        }, void 0, false, {
            fileName: "[project]/frontend2.4/components/users/UserTable.tsx",
            lineNumber: 45,
            columnNumber: 10
        }, this);
        t3 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
            className: "text-left px-4 py-3 font-medium text-sm text-slate-700",
            children: "Name"
        }, void 0, false, {
            fileName: "[project]/frontend2.4/components/users/UserTable.tsx",
            lineNumber: 46,
            columnNumber: 10
        }, this);
        t4 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
            className: "text-left px-4 py-3 font-medium text-sm text-slate-700",
            children: "Email"
        }, void 0, false, {
            fileName: "[project]/frontend2.4/components/users/UserTable.tsx",
            lineNumber: 47,
            columnNumber: 10
        }, this);
        t5 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
            className: "text-left px-4 py-3 font-medium text-sm text-slate-700",
            children: "Title"
        }, void 0, false, {
            fileName: "[project]/frontend2.4/components/users/UserTable.tsx",
            lineNumber: 48,
            columnNumber: 10
        }, this);
        t6 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
            className: "text-left px-4 py-3 font-medium text-sm text-slate-700",
            children: "Status"
        }, void 0, false, {
            fileName: "[project]/frontend2.4/components/users/UserTable.tsx",
            lineNumber: 49,
            columnNumber: 10
        }, this);
        $[1] = t2;
        $[2] = t3;
        $[3] = t4;
        $[4] = t5;
        $[5] = t6;
    } else {
        t2 = $[1];
        t3 = $[2];
        t4 = $[3];
        t5 = $[4];
        t6 = $[5];
    }
    let t7;
    if ($[6] !== showActions) {
        t7 = showActions && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
            className: "text-left px-4 py-3 font-medium text-sm text-slate-700",
            children: "Actions"
        }, void 0, false, {
            fileName: "[project]/frontend2.4/components/users/UserTable.tsx",
            lineNumber: 64,
            columnNumber: 25
        }, this);
        $[6] = showActions;
        $[7] = t7;
    } else {
        t7 = $[7];
    }
    let t8;
    if ($[8] !== t7) {
        t8 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("thead", {
            className: "bg-slate-100",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                children: [
                    t2,
                    t3,
                    t4,
                    t5,
                    t6,
                    t7
                ]
            }, void 0, true, {
                fileName: "[project]/frontend2.4/components/users/UserTable.tsx",
                lineNumber: 72,
                columnNumber: 42
            }, this)
        }, void 0, false, {
            fileName: "[project]/frontend2.4/components/users/UserTable.tsx",
            lineNumber: 72,
            columnNumber: 10
        }, this);
        $[8] = t7;
        $[9] = t8;
    } else {
        t8 = $[9];
    }
    let t9;
    if ($[10] !== onEdit || $[11] !== onView || $[12] !== showActions || $[13] !== users) {
        t9 = users.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                colSpan: showActions ? 6 : 5,
                className: "px-4 py-8 text-center text-slate-500",
                children: "No users found"
            }, void 0, false, {
                fileName: "[project]/frontend2.4/components/users/UserTable.tsx",
                lineNumber: 80,
                columnNumber: 35
            }, this)
        }, void 0, false, {
            fileName: "[project]/frontend2.4/components/users/UserTable.tsx",
            lineNumber: 80,
            columnNumber: 31
        }, this) : users.map({
            "UserTable[users.map()]": (user)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                    className: "border-t border-slate-200 hover:bg-slate-50 transition-colors",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                            className: "px-4 py-3 font-mono text-sm font-semibold",
                            children: user.username
                        }, void 0, false, {
                            fileName: "[project]/frontend2.4/components/users/UserTable.tsx",
                            lineNumber: 81,
                            columnNumber: 133
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                            className: "px-4 py-3 text-sm",
                            children: user.name || "-"
                        }, void 0, false, {
                            fileName: "[project]/frontend2.4/components/users/UserTable.tsx",
                            lineNumber: 81,
                            columnNumber: 211
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                            className: "px-4 py-3 text-sm",
                            children: user.email || "-"
                        }, void 0, false, {
                            fileName: "[project]/frontend2.4/components/users/UserTable.tsx",
                            lineNumber: 81,
                            columnNumber: 268
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                            className: "px-4 py-3 text-sm",
                            children: user.title || "-"
                        }, void 0, false, {
                            fileName: "[project]/frontend2.4/components/users/UserTable.tsx",
                            lineNumber: 81,
                            columnNumber: 326
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                            className: "px-4 py-3 text-sm",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: `px-2 py-1 rounded-full text-xs font-medium ${user.active === 1 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`,
                                children: user.active === 1 ? "Active" : "Inactive"
                            }, void 0, false, {
                                fileName: "[project]/frontend2.4/components/users/UserTable.tsx",
                                lineNumber: 81,
                                columnNumber: 418
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/frontend2.4/components/users/UserTable.tsx",
                            lineNumber: 81,
                            columnNumber: 384
                        }, this),
                        showActions && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                            className: "px-4 py-3",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex gap-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: {
                                            "UserTable[users.map() > <button>.onClick]": ()=>onView(user)
                                        }["UserTable[users.map() > <button>.onClick]"],
                                        className: "p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors",
                                        title: "View User",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$eye$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Eye$3e$__["Eye"], {
                                            size: 18
                                        }, void 0, false, {
                                            fileName: "[project]/frontend2.4/components/users/UserTable.tsx",
                                            lineNumber: 83,
                                            columnNumber: 152
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/frontend2.4/components/users/UserTable.tsx",
                                        lineNumber: 81,
                                        columnNumber: 687
                                    }, this),
                                    onEdit && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: {
                                            "UserTable[users.map() > <button>.onClick]": ()=>onEdit(user)
                                        }["UserTable[users.map() > <button>.onClick]"],
                                        className: "p-2 text-green-600 hover:bg-green-50 rounded transition-colors",
                                        title: "Edit User",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$pencil$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Pencil$3e$__["Pencil"], {
                                            size: 18
                                        }, void 0, false, {
                                            fileName: "[project]/frontend2.4/components/users/UserTable.tsx",
                                            lineNumber: 85,
                                            columnNumber: 154
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/frontend2.4/components/users/UserTable.tsx",
                                        lineNumber: 83,
                                        columnNumber: 189
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend2.4/components/users/UserTable.tsx",
                                lineNumber: 81,
                                columnNumber: 659
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/frontend2.4/components/users/UserTable.tsx",
                            lineNumber: 81,
                            columnNumber: 633
                        }, this)
                    ]
                }, user.id, true, {
                    fileName: "[project]/frontend2.4/components/users/UserTable.tsx",
                    lineNumber: 81,
                    columnNumber: 41
                }, this)
        }["UserTable[users.map()]"]);
        $[10] = onEdit;
        $[11] = onView;
        $[12] = showActions;
        $[13] = users;
        $[14] = t9;
    } else {
        t9 = $[14];
    }
    let t10;
    if ($[15] !== t9) {
        t10 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
            children: t9
        }, void 0, false, {
            fileName: "[project]/frontend2.4/components/users/UserTable.tsx",
            lineNumber: 97,
            columnNumber: 11
        }, this);
        $[15] = t9;
        $[16] = t10;
    } else {
        t10 = $[16];
    }
    let t11;
    if ($[17] !== t10 || $[18] !== t8) {
        t11 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "border border-slate-200 rounded-lg overflow-hidden",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
                className: "w-full",
                children: [
                    t8,
                    t10
                ]
            }, void 0, true, {
                fileName: "[project]/frontend2.4/components/users/UserTable.tsx",
                lineNumber: 105,
                columnNumber: 79
            }, this)
        }, void 0, false, {
            fileName: "[project]/frontend2.4/components/users/UserTable.tsx",
            lineNumber: 105,
            columnNumber: 11
        }, this);
        $[17] = t10;
        $[18] = t8;
        $[19] = t11;
    } else {
        t11 = $[19];
    }
    return t11;
}
_c = UserTable;
var _c;
__turbopack_context__.k.register(_c, "UserTable");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
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
"[project]/frontend2.4/components/users/UserForm.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>UserForm
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend2.4/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend2.4/node_modules/next/dist/compiled/react/compiler-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend2.4/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$components$2f$ui$2f$Tabs$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend2.4/components/ui/Tabs.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__ = __turbopack_context__.i("[project]/frontend2.4/node_modules/lucide-react/dist/esm/icons/x.js [app-client] (ecmascript) <export default as X>");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$save$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Save$3e$__ = __turbopack_context__.i("[project]/frontend2.4/node_modules/lucide-react/dist/esm/icons/save.js [app-client] (ecmascript) <export default as Save>");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
;
function UserForm(t0) {
    _s();
    const $ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["c"])(131);
    if ($[0] !== "f4ddf13b504e59659a7907f743cfb69d37513a5e60d92181ba2df39162675e1d") {
        for(let $i = 0; $i < 131; $i += 1){
            $[$i] = Symbol.for("react.memo_cache_sentinel");
        }
        $[0] = "f4ddf13b504e59659a7907f743cfb69d37513a5e60d92181ba2df39162675e1d";
    }
    const { user, mode, onClose, onSave } = t0;
    const [formData, setFormData] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(user);
    const isReadOnly = mode === "view";
    const [activeTab, setActiveTab] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("personal");
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
        t3 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
            className: "block text-sm font-medium text-slate-700 mb-1",
            children: "Username *"
        }, void 0, false, {
            fileName: "[project]/frontend2.4/components/users/UserForm.tsx",
            lineNumber: 82,
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
        t5 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            children: [
                t3,
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                    type: "text",
                    value: formData.username,
                    onChange: t4,
                    readOnly: isReadOnly,
                    className: inputClassName
                }, void 0, false, {
                    fileName: "[project]/frontend2.4/components/users/UserForm.tsx",
                    lineNumber: 99,
                    columnNumber: 19
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/frontend2.4/components/users/UserForm.tsx",
            lineNumber: 99,
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
        t6 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
            className: "block text-sm font-medium text-slate-700 mb-1",
            children: "Full Name"
        }, void 0, false, {
            fileName: "[project]/frontend2.4/components/users/UserForm.tsx",
            lineNumber: 110,
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
        t9 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            children: [
                t6,
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                    type: "text",
                    value: t7,
                    onChange: t8,
                    readOnly: isReadOnly,
                    className: inputClassName
                }, void 0, false, {
                    fileName: "[project]/frontend2.4/components/users/UserForm.tsx",
                    lineNumber: 128,
                    columnNumber: 19
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/frontend2.4/components/users/UserForm.tsx",
            lineNumber: 128,
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
        t10 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
            className: "block text-sm font-medium text-slate-700 mb-1",
            children: "Nickname"
        }, void 0, false, {
            fileName: "[project]/frontend2.4/components/users/UserForm.tsx",
            lineNumber: 139,
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
        t13 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            children: [
                t10,
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                    type: "text",
                    value: t11,
                    onChange: t12,
                    readOnly: isReadOnly,
                    className: inputClassName
                }, void 0, false, {
                    fileName: "[project]/frontend2.4/components/users/UserForm.tsx",
                    lineNumber: 157,
                    columnNumber: 21
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/frontend2.4/components/users/UserForm.tsx",
            lineNumber: 157,
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
        t14 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
            className: "block text-sm font-medium text-slate-700 mb-1",
            children: "Email"
        }, void 0, false, {
            fileName: "[project]/frontend2.4/components/users/UserForm.tsx",
            lineNumber: 168,
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
        t17 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            children: [
                t14,
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                    type: "email",
                    value: t15,
                    onChange: t16,
                    readOnly: isReadOnly,
                    className: inputClassName
                }, void 0, false, {
                    fileName: "[project]/frontend2.4/components/users/UserForm.tsx",
                    lineNumber: 186,
                    columnNumber: 21
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/frontend2.4/components/users/UserForm.tsx",
            lineNumber: 186,
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
        t18 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
            className: "block text-sm font-medium text-slate-700 mb-1",
            children: "Phone"
        }, void 0, false, {
            fileName: "[project]/frontend2.4/components/users/UserForm.tsx",
            lineNumber: 197,
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
        t21 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            children: [
                t18,
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                    type: "tel",
                    value: t19,
                    onChange: t20,
                    readOnly: isReadOnly,
                    className: inputClassName
                }, void 0, false, {
                    fileName: "[project]/frontend2.4/components/users/UserForm.tsx",
                    lineNumber: 215,
                    columnNumber: 21
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/frontend2.4/components/users/UserForm.tsx",
            lineNumber: 215,
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
        t22 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
            className: "block text-sm font-medium text-slate-700 mb-1",
            children: "Mobile"
        }, void 0, false, {
            fileName: "[project]/frontend2.4/components/users/UserForm.tsx",
            lineNumber: 226,
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
        t25 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            children: [
                t22,
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                    type: "tel",
                    value: t23,
                    onChange: t24,
                    readOnly: isReadOnly,
                    className: inputClassName
                }, void 0, false, {
                    fileName: "[project]/frontend2.4/components/users/UserForm.tsx",
                    lineNumber: 244,
                    columnNumber: 21
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/frontend2.4/components/users/UserForm.tsx",
            lineNumber: 244,
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
        t26 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
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
            fileName: "[project]/frontend2.4/components/users/UserForm.tsx",
            lineNumber: 255,
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
        t29 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
            type: "checkbox",
            checked: t27,
            onChange: t28,
            disabled: isReadOnly,
            className: "rounded border-slate-300 text-blue-600 focus:ring-blue-500"
        }, void 0, false, {
            fileName: "[project]/frontend2.4/components/users/UserForm.tsx",
            lineNumber: 279,
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
        t30 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
            className: "text-sm font-medium text-slate-700",
            children: "Active User"
        }, void 0, false, {
            fileName: "[project]/frontend2.4/components/users/UserForm.tsx",
            lineNumber: 289,
            columnNumber: 11
        }, this);
        $[67] = t30;
    } else {
        t30 = $[67];
    }
    let t31;
    if ($[68] !== t29) {
        t31 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                className: "flex items-center gap-2",
                children: [
                    t29,
                    t30
                ]
            }, void 0, true, {
                fileName: "[project]/frontend2.4/components/users/UserForm.tsx",
                lineNumber: 296,
                columnNumber: 16
            }, this)
        }, void 0, false, {
            fileName: "[project]/frontend2.4/components/users/UserForm.tsx",
            lineNumber: 296,
            columnNumber: 11
        }, this);
        $[68] = t29;
        $[69] = t31;
    } else {
        t31 = $[69];
    }
    let t32;
    if ($[70] !== t26 || $[71] !== t31) {
        t32 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "space-y-4",
            children: [
                t26,
                t31
            ]
        }, void 0, true, {
            fileName: "[project]/frontend2.4/components/users/UserForm.tsx",
            lineNumber: 304,
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
        t33 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
            className: "block text-sm font-medium text-slate-700 mb-1",
            children: "Job Title"
        }, void 0, false, {
            fileName: "[project]/frontend2.4/components/users/UserForm.tsx",
            lineNumber: 314,
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
        t36 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            children: [
                t33,
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                    type: "text",
                    value: t34,
                    onChange: t35,
                    readOnly: isReadOnly,
                    className: inputClassName
                }, void 0, false, {
                    fileName: "[project]/frontend2.4/components/users/UserForm.tsx",
                    lineNumber: 332,
                    columnNumber: 21
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/frontend2.4/components/users/UserForm.tsx",
            lineNumber: 332,
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
        t37 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
            className: "block text-sm font-medium text-slate-700 mb-1",
            children: "Role"
        }, void 0, false, {
            fileName: "[project]/frontend2.4/components/users/UserForm.tsx",
            lineNumber: 343,
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
        t40 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            children: [
                t37,
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                    type: "text",
                    value: t38,
                    onChange: t39,
                    readOnly: isReadOnly,
                    className: inputClassName
                }, void 0, false, {
                    fileName: "[project]/frontend2.4/components/users/UserForm.tsx",
                    lineNumber: 361,
                    columnNumber: 21
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/frontend2.4/components/users/UserForm.tsx",
            lineNumber: 361,
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
        t41 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "grid grid-cols-2 gap-4",
            children: [
                t36,
                t40
            ]
        }, void 0, true, {
            fileName: "[project]/frontend2.4/components/users/UserForm.tsx",
            lineNumber: 372,
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
        t42 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "bg-slate-50 p-4 rounded-lg",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "text-sm text-slate-600",
                children: "Additional occupation details can be added here in future updates."
            }, void 0, false, {
                fileName: "[project]/frontend2.4/components/users/UserForm.tsx",
                lineNumber: 381,
                columnNumber: 55
            }, this)
        }, void 0, false, {
            fileName: "[project]/frontend2.4/components/users/UserForm.tsx",
            lineNumber: 381,
            columnNumber: 11
        }, this);
        $[92] = t42;
    } else {
        t42 = $[92];
    }
    let t43;
    if ($[93] !== t41) {
        t43 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "space-y-4",
            children: [
                t41,
                t42
            ]
        }, void 0, true, {
            fileName: "[project]/frontend2.4/components/users/UserForm.tsx",
            lineNumber: 388,
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
        t48 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
            className: "text-2xl font-bold text-slate-800",
            children: t47
        }, void 0, false, {
            fileName: "[project]/frontend2.4/components/users/UserForm.tsx",
            lineNumber: 432,
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
        t50 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
            className: "text-sm text-slate-600 mt-1",
            children: t49
        }, void 0, false, {
            fileName: "[project]/frontend2.4/components/users/UserForm.tsx",
            lineNumber: 441,
            columnNumber: 11
        }, this);
        $[104] = t49;
        $[105] = t50;
    } else {
        t50 = $[105];
    }
    let t51;
    if ($[106] !== t48 || $[107] !== t50) {
        t51 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            children: [
                t48,
                t50
            ]
        }, void 0, true, {
            fileName: "[project]/frontend2.4/components/users/UserForm.tsx",
            lineNumber: 449,
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
        t52 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {
            size: 24,
            className: "text-slate-600"
        }, void 0, false, {
            fileName: "[project]/frontend2.4/components/users/UserForm.tsx",
            lineNumber: 458,
            columnNumber: 11
        }, this);
        $[109] = t52;
    } else {
        t52 = $[109];
    }
    let t53;
    if ($[110] !== onClose) {
        t53 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
            onClick: onClose,
            className: "p-2 hover:bg-slate-100 rounded-lg transition-colors",
            children: t52
        }, void 0, false, {
            fileName: "[project]/frontend2.4/components/users/UserForm.tsx",
            lineNumber: 465,
            columnNumber: 11
        }, this);
        $[110] = onClose;
        $[111] = t53;
    } else {
        t53 = $[111];
    }
    let t54;
    if ($[112] !== t51 || $[113] !== t53) {
        t54 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex items-center justify-between p-6 border-b border-slate-200",
            children: [
                t51,
                t53
            ]
        }, void 0, true, {
            fileName: "[project]/frontend2.4/components/users/UserForm.tsx",
            lineNumber: 473,
            columnNumber: 11
        }, this);
        $[112] = t51;
        $[113] = t53;
        $[114] = t54;
    } else {
        t54 = $[114];
    }
    let t55;
    if ($[115] !== activeTab || $[116] !== tabs) {
        t55 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex-1 overflow-auto p-6",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$components$2f$ui$2f$Tabs$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                tabs: tabs,
                activeTab: activeTab,
                onTabChange: setActiveTab
            }, void 0, false, {
                fileName: "[project]/frontend2.4/components/users/UserForm.tsx",
                lineNumber: 482,
                columnNumber: 53
            }, this)
        }, void 0, false, {
            fileName: "[project]/frontend2.4/components/users/UserForm.tsx",
            lineNumber: 482,
            columnNumber: 11
        }, this);
        $[115] = activeTab;
        $[116] = tabs;
        $[117] = t55;
    } else {
        t55 = $[117];
    }
    const t56 = mode === "view" ? "Close" : "Cancel";
    let t57;
    if ($[118] !== onClose || $[119] !== t56) {
        t57 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
            onClick: onClose,
            className: "px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors",
            children: t56
        }, void 0, false, {
            fileName: "[project]/frontend2.4/components/users/UserForm.tsx",
            lineNumber: 492,
            columnNumber: 11
        }, this);
        $[118] = onClose;
        $[119] = t56;
        $[120] = t57;
    } else {
        t57 = $[120];
    }
    let t58;
    if ($[121] !== handleSave || $[122] !== mode) {
        t58 = mode === "edit" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
            onClick: handleSave,
            className: "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$save$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Save$3e$__["Save"], {
                    size: 18
                }, void 0, false, {
                    fileName: "[project]/frontend2.4/components/users/UserForm.tsx",
                    lineNumber: 501,
                    columnNumber: 175
                }, this),
                "Save Changes"
            ]
        }, void 0, true, {
            fileName: "[project]/frontend2.4/components/users/UserForm.tsx",
            lineNumber: 501,
            columnNumber: 30
        }, this);
        $[121] = handleSave;
        $[122] = mode;
        $[123] = t58;
    } else {
        t58 = $[123];
    }
    let t59;
    if ($[124] !== t57 || $[125] !== t58) {
        t59 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex items-center justify-end gap-3 p-6 border-t border-slate-200",
            children: [
                t57,
                t58
            ]
        }, void 0, true, {
            fileName: "[project]/frontend2.4/components/users/UserForm.tsx",
            lineNumber: 510,
            columnNumber: 11
        }, this);
        $[124] = t57;
        $[125] = t58;
        $[126] = t59;
    } else {
        t59 = $[126];
    }
    let t60;
    if ($[127] !== t54 || $[128] !== t55 || $[129] !== t59) {
        t60 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col",
                children: [
                    t54,
                    t55,
                    t59
                ]
            }, void 0, true, {
                fileName: "[project]/frontend2.4/components/users/UserForm.tsx",
                lineNumber: 519,
                columnNumber: 103
            }, this)
        }, void 0, false, {
            fileName: "[project]/frontend2.4/components/users/UserForm.tsx",
            lineNumber: 519,
            columnNumber: 11
        }, this);
        $[127] = t54;
        $[128] = t55;
        $[129] = t59;
        $[130] = t60;
    } else {
        t60 = $[130];
    }
    return t60;
}
_s(UserForm, "335zb+Twhmnfw/8ttyNq4VpozFg=");
_c = UserForm;
var _c;
__turbopack_context__.k.register(_c, "UserForm");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend2.4/app/(dashboard)/users/page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>UsersPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend2.4/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend2.4/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$components$2f$users$2f$UserTable$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend2.4/components/users/UserTable.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$components$2f$users$2f$UserForm$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend2.4/components/users/UserForm.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$users$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Users$3e$__ = __turbopack_context__.i("[project]/frontend2.4/node_modules/lucide-react/dist/esm/icons/users.js [app-client] (ecmascript) <export default as Users>");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
;
function UsersPage() {
    _s();
    const [users, setUsers] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [viewUser, setViewUser] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [searchTerm, setSearchTerm] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
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
    const filteredUsers = users.filter((user_0)=>user_0.name?.toLowerCase().includes(searchTerm.toLowerCase()) || user_0.username.toLowerCase().includes(searchTerm.toLowerCase()) || user_0.email?.toLowerCase().includes(searchTerm.toLowerCase()));
    if (loading) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "p-6",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "animate-pulse",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "h-8 bg-slate-200 rounded w-1/4 mb-4"
                    }, void 0, false, {
                        fileName: "[project]/frontend2.4/app/(dashboard)/users/page.tsx",
                        lineNumber: 53,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "h-64 bg-slate-200 rounded"
                    }, void 0, false, {
                        fileName: "[project]/frontend2.4/app/(dashboard)/users/page.tsx",
                        lineNumber: 54,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend2.4/app/(dashboard)/users/page.tsx",
                lineNumber: 52,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/frontend2.4/app/(dashboard)/users/page.tsx",
            lineNumber: 51,
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
                        children: "Error loading users"
                    }, void 0, false, {
                        fileName: "[project]/frontend2.4/app/(dashboard)/users/page.tsx",
                        lineNumber: 61,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-sm",
                        children: error
                    }, void 0, false, {
                        fileName: "[project]/frontend2.4/app/(dashboard)/users/page.tsx",
                        lineNumber: 62,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: fetchUsers,
                        className: "mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700",
                        children: "Retry"
                    }, void 0, false, {
                        fileName: "[project]/frontend2.4/app/(dashboard)/users/page.tsx",
                        lineNumber: 63,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend2.4/app/(dashboard)/users/page.tsx",
                lineNumber: 60,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/frontend2.4/app/(dashboard)/users/page.tsx",
            lineNumber: 59,
            columnNumber: 12
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "p-6",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mb-6",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        className: "text-2xl font-bold text-slate-800 flex items-center gap-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$users$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Users$3e$__["Users"], {
                                size: 28
                            }, void 0, false, {
                                fileName: "[project]/frontend2.4/app/(dashboard)/users/page.tsx",
                                lineNumber: 72,
                                columnNumber: 11
                            }, this),
                            "Users Directory"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend2.4/app/(dashboard)/users/page.tsx",
                        lineNumber: 71,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-slate-600 mt-1",
                        children: "View system users (read-only)"
                    }, void 0, false, {
                        fileName: "[project]/frontend2.4/app/(dashboard)/users/page.tsx",
                        lineNumber: 75,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend2.4/app/(dashboard)/users/page.tsx",
                lineNumber: 70,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bg-white rounded-lg shadow",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "p-6",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "mb-6",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                type: "text",
                                placeholder: "Search users by name, username, or email...",
                                value: searchTerm,
                                onChange: (e)=>setSearchTerm(e.target.value),
                                className: "w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            }, void 0, false, {
                                fileName: "[project]/frontend2.4/app/(dashboard)/users/page.tsx",
                                lineNumber: 82,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/frontend2.4/app/(dashboard)/users/page.tsx",
                            lineNumber: 81,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-sm text-blue-800",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                        children: "Note:"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend2.4/app/(dashboard)/users/page.tsx",
                                        lineNumber: 88,
                                        columnNumber: 15
                                    }, this),
                                    " This is a read-only view. To manage users, assign roles, or reset passwords, please contact an administrator or access the Admin → User Management section if you have permission."
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend2.4/app/(dashboard)/users/page.tsx",
                                lineNumber: 87,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/frontend2.4/app/(dashboard)/users/page.tsx",
                            lineNumber: 86,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "mb-4",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-slate-600",
                                children: [
                                    "Showing ",
                                    filteredUsers.length,
                                    " of ",
                                    users.length,
                                    " users"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend2.4/app/(dashboard)/users/page.tsx",
                                lineNumber: 95,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/frontend2.4/app/(dashboard)/users/page.tsx",
                            lineNumber: 94,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$components$2f$users$2f$UserTable$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                            users: filteredUsers,
                            onView: handleView,
                            showActions: false
                        }, void 0, false, {
                            fileName: "[project]/frontend2.4/app/(dashboard)/users/page.tsx",
                            lineNumber: 101,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/frontend2.4/app/(dashboard)/users/page.tsx",
                    lineNumber: 79,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/frontend2.4/app/(dashboard)/users/page.tsx",
                lineNumber: 78,
                columnNumber: 7
            }, this),
            viewUser && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$components$2f$users$2f$UserForm$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                user: viewUser,
                mode: "view",
                onClose: ()=>setViewUser(null)
            }, void 0, false, {
                fileName: "[project]/frontend2.4/app/(dashboard)/users/page.tsx",
                lineNumber: 106,
                columnNumber: 20
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend2.4/app/(dashboard)/users/page.tsx",
        lineNumber: 69,
        columnNumber: 10
    }, this);
}
_s(UsersPage, "a//xlqjr/4+JZZjWSM0EM/QF9EI=");
_c = UsersPage;
var _c;
__turbopack_context__.k.register(_c, "UsersPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend2.4/node_modules/lucide-react/dist/esm/icons/eye.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * @license lucide-react v0.548.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ __turbopack_context__.s([
    "__iconNode",
    ()=>__iconNode,
    "default",
    ()=>Eye
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend2.4/node_modules/lucide-react/dist/esm/createLucideIcon.js [app-client] (ecmascript)");
;
const __iconNode = [
    [
        "path",
        {
            d: "M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0",
            key: "1nclc0"
        }
    ],
    [
        "circle",
        {
            cx: "12",
            cy: "12",
            r: "3",
            key: "1v7zrd"
        }
    ]
];
const Eye = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])("eye", __iconNode);
;
 //# sourceMappingURL=eye.js.map
}),
"[project]/frontend2.4/node_modules/lucide-react/dist/esm/icons/eye.js [app-client] (ecmascript) <export default as Eye>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Eye",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$eye$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$eye$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend2.4/node_modules/lucide-react/dist/esm/icons/eye.js [app-client] (ecmascript)");
}),
"[project]/frontend2.4/node_modules/lucide-react/dist/esm/icons/pencil.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * @license lucide-react v0.548.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ __turbopack_context__.s([
    "__iconNode",
    ()=>__iconNode,
    "default",
    ()=>Pencil
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend2.4/node_modules/lucide-react/dist/esm/createLucideIcon.js [app-client] (ecmascript)");
;
const __iconNode = [
    [
        "path",
        {
            d: "M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z",
            key: "1a8usu"
        }
    ],
    [
        "path",
        {
            d: "m15 5 4 4",
            key: "1mk7zo"
        }
    ]
];
const Pencil = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])("pencil", __iconNode);
;
 //# sourceMappingURL=pencil.js.map
}),
"[project]/frontend2.4/node_modules/lucide-react/dist/esm/icons/pencil.js [app-client] (ecmascript) <export default as Pencil>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Pencil",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$pencil$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$pencil$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend2.4/node_modules/lucide-react/dist/esm/icons/pencil.js [app-client] (ecmascript)");
}),
"[project]/frontend2.4/node_modules/lucide-react/dist/esm/icons/x.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * @license lucide-react v0.548.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ __turbopack_context__.s([
    "__iconNode",
    ()=>__iconNode,
    "default",
    ()=>X
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend2.4/node_modules/lucide-react/dist/esm/createLucideIcon.js [app-client] (ecmascript)");
;
const __iconNode = [
    [
        "path",
        {
            d: "M18 6 6 18",
            key: "1bl5f8"
        }
    ],
    [
        "path",
        {
            d: "m6 6 12 12",
            key: "d8bk6v"
        }
    ]
];
const X = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])("x", __iconNode);
;
 //# sourceMappingURL=x.js.map
}),
"[project]/frontend2.4/node_modules/lucide-react/dist/esm/icons/x.js [app-client] (ecmascript) <export default as X>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "X",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend2.4/node_modules/lucide-react/dist/esm/icons/x.js [app-client] (ecmascript)");
}),
"[project]/frontend2.4/node_modules/lucide-react/dist/esm/icons/save.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * @license lucide-react v0.548.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ __turbopack_context__.s([
    "__iconNode",
    ()=>__iconNode,
    "default",
    ()=>Save
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend2.4/node_modules/lucide-react/dist/esm/createLucideIcon.js [app-client] (ecmascript)");
;
const __iconNode = [
    [
        "path",
        {
            d: "M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z",
            key: "1c8476"
        }
    ],
    [
        "path",
        {
            d: "M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7",
            key: "1ydtos"
        }
    ],
    [
        "path",
        {
            d: "M7 3v4a1 1 0 0 0 1 1h7",
            key: "t51u73"
        }
    ]
];
const Save = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])("save", __iconNode);
;
 //# sourceMappingURL=save.js.map
}),
"[project]/frontend2.4/node_modules/lucide-react/dist/esm/icons/save.js [app-client] (ecmascript) <export default as Save>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Save",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$save$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$save$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend2.4/node_modules/lucide-react/dist/esm/icons/save.js [app-client] (ecmascript)");
}),
]);

//# sourceMappingURL=frontend2_4_8e827a9b._.js.map